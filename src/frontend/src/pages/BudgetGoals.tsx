import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Target,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useGetExpenses } from "../hooks/useQueries";
import {
  checkBudgetWarning,
  getBudgetGoals,
  setBudgetGoal,
} from "../lib/budgetGoals";
import {
  ALL_CATEGORY_KINDS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type CategoryKind,
  getCategoryKind,
} from "../lib/categoryUtils";

interface CategoryBudgetRow {
  kind: CategoryKind;
  label: string;
  icon: string;
  spent: number;
  goal: number;
  inputValue: string;
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-green-500";
}

function getProgressBgColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-100";
  if (percentage >= 75) return "bg-amber-100";
  return "bg-green-100";
}

function getStatusText(
  _percentage: number,
  isExceeded: boolean,
  isWarning: boolean,
): string {
  if (isExceeded) return "🚨 Exceeded!";
  if (isWarning) return "⚠️ Warning!";
  return "✅ On Track";
}

export function BudgetGoals() {
  const { data: allExpenses, isLoading } = useGetExpenses();

  // Load saved goals from localStorage
  const [savedGoals, setSavedGoals] = useState<Record<string, number>>(() =>
    getBudgetGoals(),
  );
  // Local input state (string, per category)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const goals = getBudgetGoals();
    const vals: Record<string, string> = {};
    for (const kind of ALL_CATEGORY_KINDS) {
      vals[kind] = goals[kind] ? String(goals[kind]) : "";
    }
    return vals;
  });
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});

  // Current month prefix for filtering
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Compute current month spend per category
  const monthlySpend = useMemo((): Record<string, number> => {
    if (!allExpenses) return {};
    const spend: Record<string, number> = {};

    for (const exp of allExpenses) {
      if (!exp.date.startsWith(currentMonth)) continue;
      const backendKind = getCategoryKind(exp.category);
      const amount = Number(exp.amount);

      if (backendKind === "others" && exp.subCategory) {
        // Could be a virtual category stored as 'others'
        if (exp.subCategory === "Credit Card") {
          spend.creditCard = (spend.creditCard ?? 0) + amount;
        } else if (exp.subCategory === "Haircut") {
          spend.haircut = (spend.haircut ?? 0) + amount;
        } else if (exp.subCategory === "Donation") {
          spend.donation = (spend.donation ?? 0) + amount;
        } else {
          // Real 'others'
          spend.others = (spend.others ?? 0) + amount;
        }
      } else {
        spend[backendKind] = (spend[backendKind] ?? 0) + amount;
      }
    }

    return spend;
  }, [allExpenses, currentMonth]);

  const totalSpend = useMemo(() => {
    return Object.values(monthlySpend).reduce((s, v) => s + v, 0);
  }, [monthlySpend]);

  const totalGoal = useMemo(() => {
    return Object.values(savedGoals).reduce((s, v) => s + v, 0);
  }, [savedGoals]);

  // Categories with active warnings
  const warnings = useMemo(() => {
    return ALL_CATEGORY_KINDS.filter((kind) => {
      const goal = savedGoals[kind];
      if (!goal) return false;
      const spent = monthlySpend[kind] ?? 0;
      const w = checkBudgetWarning(kind, spent, goal);
      return w.isWarning;
    });
  }, [savedGoals, monthlySpend]);

  const handleInputChange = useCallback((kind: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [kind]: value }));
    // Clear "saved" indicator when editing
    setSavedState((prev) => ({ ...prev, [kind]: false }));
  }, []);

  const handleSave = useCallback(
    (kind: string) => {
      const val = Number.parseFloat(inputValues[kind] ?? "");
      const goal = Number.isNaN(val) || val <= 0 ? 0 : Math.round(val);
      setBudgetGoal(kind, goal);
      setSavedGoals(getBudgetGoals());
      setSavedState((prev) => ({ ...prev, [kind]: true }));
      // Clear the "saved" indicator after 2s
      setTimeout(
        () => setSavedState((prev) => ({ ...prev, [kind]: false })),
        2000,
      );
    },
    [inputValues],
  );

  const rows: CategoryBudgetRow[] = ALL_CATEGORY_KINDS.map((kind) => ({
    kind,
    label: CATEGORY_LABELS[kind],
    icon: CATEGORY_ICONS[kind],
    spent: monthlySpend[kind] ?? 0,
    goal: savedGoals[kind] ?? 0,
    inputValue: inputValues[kind] ?? "",
  }));

  return (
    <div className="relative px-4 py-5 space-y-4 animate-slide-up min-h-screen">
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(/assets/generated/expense-bg-pattern.dim_800x800.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
          opacity: 0.07,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header Card */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div
            className="px-4 py-3 border-b border-border flex items-center gap-2"
            style={{ background: "oklch(0.97 0.03 75)" }}
          >
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">
              Budget Goals
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date().toLocaleString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Set monthly budget goals per category. You'll get a warning at 75%
              of your goal.
            </p>

            {/* Grand total */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Total Spent (Month)
                </p>
                <p className="text-base font-extrabold text-foreground flex items-center justify-center gap-0.5">
                  <IndianRupee
                    className="w-4 h-4 text-primary"
                    strokeWidth={2.5}
                  />
                  {isLoading ? "…" : totalSpend.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Total Budget
                </p>
                <p className="text-base font-extrabold text-foreground flex items-center justify-center gap-0.5">
                  <IndianRupee
                    className="w-4 h-4 text-primary"
                    strokeWidth={2.5}
                  />
                  {totalGoal > 0 ? totalGoal.toLocaleString("en-IN") : "—"}
                </p>
              </div>
            </div>

            {/* Overall progress bar */}
            {totalGoal > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span className="font-semibold">
                    {Math.min(Math.round((totalSpend / totalGoal) * 100), 999)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(Math.round((totalSpend / totalGoal) * 100))}`}
                    style={{
                      width: `${Math.min((totalSpend / totalGoal) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banners */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-bold">Budget Warnings</span>
            </div>
            {warnings.map((kind) => {
              const goal = savedGoals[kind];
              const spent = monthlySpend[kind] ?? 0;
              const w = checkBudgetWarning(kind, spent, goal);
              return (
                <div
                  key={kind}
                  className="flex items-center gap-2 text-xs text-amber-700"
                >
                  <span>{CATEGORY_ICONS[kind]}</span>
                  <span className="font-semibold">
                    {CATEGORY_LABELS[kind]}:
                  </span>
                  <span>
                    {w.isExceeded
                      ? `Exceeded! ₹${spent.toLocaleString("en-IN")} / ₹${goal.toLocaleString("en-IN")}`
                      : `${w.percentage}% used — ₹${spent.toLocaleString("en-IN")} of ₹${goal.toLocaleString("en-IN")}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Category Budget Rows */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div
            className="px-4 py-3 border-b border-border flex items-center gap-2"
            style={{ background: "oklch(0.97 0.03 75)" }}
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm text-foreground">
              Category Goals
            </h3>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row, idx) => {
                const w =
                  row.goal > 0
                    ? checkBudgetWarning(row.kind, row.spent, row.goal)
                    : null;
                const percentage = w?.percentage ?? 0;
                const clampedPct = Math.min(percentage, 100);

                return (
                  <div key={row.kind} className="p-4 space-y-2">
                    {/* Category label row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{row.icon}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {row.label}
                        </span>
                        {w && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              w.isExceeded
                                ? "bg-red-100 text-red-700"
                                : w.isWarning
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {getStatusText(
                              percentage,
                              w.isExceeded,
                              w.isWarning,
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground flex items-center gap-0.5">
                        <IndianRupee
                          className="w-3 h-3 text-primary"
                          strokeWidth={2.5}
                        />
                        {row.spent.toLocaleString("en-IN")}
                        {row.goal > 0 && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            / {row.goal.toLocaleString("en-IN")}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Progress bar (only if goal set) */}
                    {row.goal > 0 && (
                      <div className="space-y-1">
                        <div
                          className={`h-2 rounded-full overflow-hidden ${getProgressBgColor(percentage)}`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                            style={{ width: `${clampedPct}%` }}
                          />
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            w?.isExceeded
                              ? "text-red-600"
                              : w?.isWarning
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                        >
                          {percentage}% of ₹{row.goal.toLocaleString("en-IN")}{" "}
                          budget used
                        </p>
                      </div>
                    )}

                    {/* Goal input + save */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <IndianRupee
                            className="w-3.5 h-3.5 text-muted-foreground"
                            strokeWidth={2.5}
                          />
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={row.inputValue}
                          onChange={(e) =>
                            handleInputChange(row.kind, e.target.value)
                          }
                          onBlur={() => handleSave(row.kind)}
                          placeholder="Set goal amount…"
                          className="h-9 pl-7 text-sm"
                          data-ocid={`budget.goal.input.${idx + 1}`}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={savedState[row.kind] ? "default" : "outline"}
                        onClick={() => handleSave(row.kind)}
                        className="h-9 px-3 text-xs font-semibold shrink-0 min-w-[64px]"
                        data-ocid={`budget.goal.save_button.${idx + 1}`}
                      >
                        {savedState[row.kind] ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Saved
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
