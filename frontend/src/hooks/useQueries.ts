import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useActor } from './useActor';
import { Category, type Expense, type UserProfile } from '../backend';

const PROFILE_TIMEOUT_MS = 5000;

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start a timeout whenever we're in a loading state (actor fetching or query pending)
  useEffect(() => {
    if (actorFetching) {
      // Reset timeout whenever actor is fetching
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimedOut(false);
      timerRef.current = setTimeout(() => {
        setTimedOut(true);
      }, PROFILE_TIMEOUT_MS);
    } else {
      // Actor is ready — clear any pending timeout
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [actorFetching]);

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Race the actual call against a timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), PROFILE_TIMEOUT_MS)
      );
      return Promise.race([actor.getCallerUserProfile(), timeoutPromise]);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  const isTimedOutOrError = timedOut || query.isError;

  return {
    ...query,
    isLoading: !isTimedOutOrError && (actorFetching || query.isLoading),
    isFetched: isTimedOutOrError || (!!actor && query.isFetched),
    isTimedOut: timedOut,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetExpensesByDate(date: string, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ['expenses', 'date', date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesByDate(date);
    },
    enabled: !!actor && !isFetching && enabled && date.length > 0,
  });
}

export function useGetExpensesByDateRange(startDate: string, endDate: string, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ['expenses', 'range', startDate, endDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesByDateRange(startDate, endDate);
    },
    enabled: !!actor && !isFetching && enabled && startDate.length > 0 && endDate.length > 0,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      category: Category;
      subCategory: string | null;
      amount: bigint;
      note: string | null;
      repayName: string | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addExpense(
        params.date,
        params.category,
        params.subCategory,
        params.amount,
        params.note,
        params.repayName,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
