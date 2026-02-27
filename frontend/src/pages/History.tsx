import { useState, useMemo } from 'react';
import { Trash2, Loader2, IndianRupee, Filter, X, Calendar, TrendingUp, User, Tag } from 'lucide-react';
import { type Expense } from '../backend';
import {
  getCategoryKind,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ALL_CATEGORY_KINDS,
  CategoryKind,
  formatDate,
  getTodayDate,
} from '../lib/categoryUtils';
import {
  useGetExpenses,
  useGetExpensesByDate,
  useGetExpensesByDateRange,
  useDeleteExpense,
} from '../hooks/useQueries';
import { CategoryBadge } from '../components/CategoryBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type FilterMode = 'all' | 'date' | 'range';

export function History() {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKind | 'all'>('all');
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const allExpensesQuery = useGetExpenses();
  const dateExpensesQuery = useGetExpensesByDate(filterDate, filterMode === 'date');
  const rangeExpensesQuery = useGetExpensesByDateRange(startDate, endDate, filterMode === 'range');
  const deleteExpenseMutation = useDeleteExpense();

  // Base expenses from date filter
  const dateFilteredExpenses: Expense[] = useMemo(() => {
    if (filterMode === 'date') return dateExpensesQuery.data ?? [];
    if (filterMode === 'range') return rangeExpensesQuery.data ?? [];
    return allExpensesQuery.data ?? [];
  }, [filterMode, allExpensesQuery.data, dateExpensesQuery.data, rangeExpensesQuery.data]);

  // Apply category filter on top of date filter
  const expenses: Expense[] = useMemo(() => {
    if (categoryFilter === 'all') return dateFilteredExpenses;
    return dateFilteredExpenses.filter(
      (exp) => getCategoryKind(exp.category) === categoryFilter
    );
  }, [dateFilteredExpenses, categoryFilter]);

  const isLoading =
    (filterMode === 'all' && allExpensesQuery.isLoading) ||
    (filterMode === 'date' && dateExpensesQuery.isLoading) ||
    (filterMode === 'range' && rangeExpensesQuery.isLoading);

  // Sort by date descending, then by id descending
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return Number(b.id) - Number(a.id);
    });
  }, [expenses]);

  // Category totals — based on filtered expenses (both date + category)
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<CategoryKind, number>> = {};
    for (const exp of expenses) {
      const kind = getCategoryKind(exp.category);
      totals[kind] = (totals[kind] ?? 0) + Number(exp.amount);
    }
    return totals;
  }, [expenses]);

  const grandTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  // Which categories exist in the date-filtered set (for chip display)
  const availableCategories = useMemo(() => {
    const kinds = new Set<CategoryKind>();
    for (const exp of dateFilteredExpenses) {
      kinds.add(getCategoryKind(exp.category));
    }
    return ALL_CATEGORY_KINDS.filter((k) => kinds.has(k));
  }, [dateFilteredExpenses]);

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await deleteExpenseMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilter = () => {
    setFilterMode('all');
    setFilterDate(getTodayDate());
    setStartDate('');
    setEndDate('');
  };

  const categoriesWithData = ALL_CATEGORY_KINDS.filter((kind) => categoryTotals[kind]);

  const hasActiveFilters = filterMode !== 'all' || categoryFilter !== 'all';

  return (
    <div className="px-4 py-5 space-y-4 animate-slide-up">
      {/* Filter Section */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div
          className="px-4 py-3 border-b border-border flex items-center justify-between"
          style={{ background: 'oklch(0.97 0.03 75)' }}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Filter Expenses</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearFilter();
                setCategoryFilter('all');
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Filter Mode Tabs */}
          <div className="flex gap-2">
            {(['all', 'date', 'range'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                  filterMode === mode
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {mode === 'all' ? 'All' : mode === 'date' ? 'By Date' : 'Date Range'}
              </button>
            ))}
          </div>

          {/* Date filter */}
          {filterMode === 'date' && (
            <div className="space-y-1.5 animate-slide-up">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Select Date
              </Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          )}

          {/* Range filter */}
          {filterMode === 'range' && (
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          )}

          {/* Category Filter Chips */}
          {!isLoading && availableCategories.length > 0 && (
            <div className="space-y-2 animate-slide-up">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Category</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {/* All chip */}
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap ${
                    categoryFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
                  }`}
                >
                  All
                </button>
                {availableCategories.map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setCategoryFilter(kind)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap ${
                      categoryFilter === kind
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent border border-border'
                    }`}
                  >
                    <span className="text-sm leading-none">{CATEGORY_ICONS[kind]}</span>
                    {CATEGORY_LABELS[kind]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {!isLoading && categoriesWithData.length > 0 && (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div
            className="px-4 py-3 border-b border-border flex items-center gap-2"
            style={{ background: 'oklch(0.97 0.03 75)' }}
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Summary</h2>
            {categoryFilter !== 'all' && (
              <span className="ml-auto text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 font-medium">
                {CATEGORY_ICONS[categoryFilter]} {CATEGORY_LABELS[categoryFilter]}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            {categoriesWithData.map((kind) => (
              <div key={kind} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <span className="text-base">{CATEGORY_ICONS[kind]}</span>
                  <span className="font-medium">{CATEGORY_LABELS[kind]}</span>
                </span>
                <span className="flex items-center gap-0.5 text-sm font-bold text-foreground">
                  <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {(categoryTotals[kind] ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="pt-2.5 mt-0.5 border-t border-border flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Grand Total</span>
              <span className="flex items-center gap-0.5 text-base font-extrabold text-primary">
                <IndianRupee className="w-4 h-4" strokeWidth={2.5} />
                {grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div
          className="px-4 py-3 border-b border-border flex items-center justify-between"
          style={{ background: 'oklch(0.97 0.03 75)' }}
        >
          <h2 className="font-display font-semibold text-sm text-foreground">Expenses</h2>
          {!isLoading && (
            <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 font-semibold">
              {sortedExpenses.length} {sortedExpenses.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : sortedExpenses.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-2xl">
                💸
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">No expenses found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filterMode === 'all' && categoryFilter === 'all'
                    ? 'Start adding expenses to see them here'
                    : 'No expenses for the selected filters'}
                </p>
              </div>
            </div>
          ) : (
            sortedExpenses.map((expense) => (
              <ExpenseRow
                key={expense.id.toString()}
                expense={expense}
                onDelete={handleDelete}
                isDeleting={deletingId === expense.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}

function ExpenseRow({ expense, onDelete, isDeleting }: ExpenseRowProps) {
  const kind = getCategoryKind(expense.category);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Category icon */}
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
        {CATEGORY_ICONS[kind]}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <CategoryBadge
          category={expense.category}
          subCategory={expense.subCategory}
          size="sm"
        />
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(expense.date)}</p>
        {expense.repayName && (
          <p className="text-xs font-semibold mt-0.5 flex items-center gap-1" style={{ color: 'oklch(0.55 0.15 55)' }}>
            <User className="w-3 h-3" />
            {expense.repayName}
          </p>
        )}
        {expense.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 italic">
            "{expense.note}"
          </p>
        )}
      </div>

      {/* Amount + Delete */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="flex items-center gap-0.5 font-extrabold text-foreground text-sm">
          <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
          {Number(expense.amount).toLocaleString('en-IN')}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Delete expense"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-4 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this expense entry. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(expense.id)}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
