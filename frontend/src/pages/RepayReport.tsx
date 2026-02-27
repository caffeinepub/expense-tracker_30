import { useMemo } from 'react';
import { IndianRupee, User, Users, TrendingUp } from 'lucide-react';
import { type Expense } from '../backend';
import { getCategoryKind, formatDate } from '../lib/categoryUtils';
import { useGetExpenses } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

interface RepayGroup {
  name: string;
  entries: Expense[];
  total: number;
}

export function RepayReport() {
  const { data: allExpenses, isLoading } = useGetExpenses();

  const repayGroups = useMemo((): RepayGroup[] => {
    if (!allExpenses) return [];

    const repayExpenses = allExpenses.filter((exp) => {
      const kind = getCategoryKind(exp.category);
      return kind === 'cashTransfer' && exp.subCategory === 'Repay' && exp.repayName;
    });

    const groupMap = new Map<string, Expense[]>();
    for (const exp of repayExpenses) {
      const name = exp.repayName!;
      if (!groupMap.has(name)) groupMap.set(name, []);
      groupMap.get(name)!.push(exp);
    }

    const groups: RepayGroup[] = [];
    groupMap.forEach((entries, name) => {
      const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
      const total = sorted.reduce((sum, e) => sum + Number(e.amount), 0);
      groups.push({ name, entries: sorted, total });
    });

    // Sort groups by total descending
    groups.sort((a, b) => b.total - a.total);
    return groups;
  }, [allExpenses]);

  const grandTotal = useMemo(() => {
    return repayGroups.reduce((sum, g) => sum + g.total, 0);
  }, [repayGroups]);

  return (
    <div className="px-4 py-5 space-y-4 animate-slide-up">
      {/* Header Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div
          className="px-4 py-3 border-b border-border flex items-center gap-2"
          style={{ background: 'oklch(0.97 0.03 75)' }}
        >
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-sm text-foreground">Repay Report</h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">
            People who need to repay you. Amounts are grouped by person name.
          </p>
          {!isLoading && repayGroups.length > 0 && (
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                Total Outstanding
              </span>
              <span className="flex items-center gap-0.5 text-base font-extrabold text-primary">
                <IndianRupee className="w-4 h-4" strokeWidth={2.5} />
                {grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4 rounded-lg ml-2" />
              <Skeleton className="h-8 w-2/3 rounded-lg ml-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && repayGroups.length === 0 && (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="py-14 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
              🤝
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">No repay entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a Cash Transfer expense with "Repay" sub-category to track who owes you money
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Repay Groups */}
      {!isLoading && repayGroups.map((group) => (
        <div
          key={group.name}
          className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
        >
          {/* Person Header - highlighted amber */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'oklch(0.92 0.1 75)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'oklch(0.72 0.18 60)',
                  color: 'oklch(0.99 0.005 80)',
                }}
              >
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: 'oklch(0.35 0.12 50)' }}
                >
                  {group.name}
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.5 0.08 55)' }}>
                  {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.5 0.08 55)' }}>
                Total Owed
              </p>
              <span
                className="flex items-center gap-0.5 font-extrabold text-base"
                style={{ color: 'oklch(0.45 0.18 50)' }}
              >
                <IndianRupee className="w-4 h-4" strokeWidth={2.5} />
                {group.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Entries */}
          <div className="divide-y divide-border">
            {group.entries.map((expense) => (
              <div key={expense.id.toString()} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: 'oklch(0.95 0.05 75)' }}
                >
                  💸
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{formatDate(expense.date)}</p>
                  {expense.note && (
                    <p className="text-xs text-muted-foreground truncate italic mt-0.5">
                      "{expense.note}"
                    </p>
                  )}
                </div>
                <span
                  className="flex items-center gap-0.5 font-bold text-sm shrink-0"
                  style={{ color: 'oklch(0.45 0.18 50)' }}
                >
                  <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {Number(expense.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal row */}
          <div
            className="px-4 py-2.5 flex items-center justify-between border-t border-border"
            style={{ background: 'oklch(0.96 0.04 75)' }}
          >
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {group.name} owes you
            </span>
            <span
              className="flex items-center gap-0.5 text-sm font-extrabold"
              style={{ color: 'oklch(0.45 0.18 50)' }}
            >
              <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
              {group.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
