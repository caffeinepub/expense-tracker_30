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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  Calendar,
  Filter,
  Flame,
  IndianRupee,
  Loader2,
  PieChartIcon,
  Tag,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Expense } from "../backend";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  useDeleteExpense,
  useGetExpenses,
  useGetExpensesByDate,
  useGetExpensesByDateRange,
} from "../hooks/useQueries";
import {
  ALL_CATEGORY_KINDS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type CategoryKind,
  formatDate,
  getCategoryKind,
  getTodayDate,
} from "../lib/categoryUtils";

type FilterMode = "all" | "date" | "range";
type ChartType = "pie" | "bar";

const HIGH_SPEND_THRESHOLD = 500;

// Colors per category kind for charts
const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  tea: "#92400e",
  coolDrink: "#06b6d4",
  petrol: "#6366f1",
  fruits: "#84cc16",
  recharge: "#8b5cf6",
  shopping: "#ec4899",
  trip: "#14b8a6",
  bikeRepair: "#64748b",
  medical: "#ef4444",
  cashTransfer: "#22c55e",
  others: "#a78bfa",
  creditCard: "#3b82f6",
  haircut: "#f59e0b",
  donation: "#10b981",
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload?: { percent?: number };
}

// Custom tooltip for pie chart
function PieTooltip({
  active,
  payload,
}: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-bold text-foreground">{item.name}</p>
        <p className="text-primary font-semibold">
          ₹{item.value.toLocaleString("en-IN")}
        </p>
        {item.payload?.percent !== undefined && (
          <p className="text-muted-foreground">
            {(item.payload.percent * 100).toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

// Custom tooltip for bar chart
function BarTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
}

// Group expenses by date for bar chart
function buildBarData(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const exp of expenses) {
    map.set(exp.date, (map.get(exp.date) ?? 0) + Number(exp.amount));
  }
  // Sort by date ascending
  const entries = Array.from(map.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length > 10) {
    // Group by week: key = "Week N"
    const weekMap = new Map<string, number>();
    for (const [dateStr, amount] of entries) {
      const date = new Date(dateStr);
      const weekNum = Math.ceil(date.getDate() / 7);
      const key = `W${weekNum} ${date.toLocaleString("en-IN", { month: "short" })}`;
      weekMap.set(key, (weekMap.get(key) ?? 0) + amount);
    }
    return Array.from(weekMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  return entries.map(([dateStr, amount]) => ({
    date: formatDate(dateStr).replace(/\s\d{4}$/, ""), // drop year for brevity
    amount,
  }));
}

export function History() {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryKind | "all">(
    "all",
  );
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [chartType, setChartType] = useState<ChartType>("pie");

  const allExpensesQuery = useGetExpenses();
  const dateExpensesQuery = useGetExpensesByDate(
    filterDate,
    filterMode === "date",
  );
  const rangeExpensesQuery = useGetExpensesByDateRange(
    startDate,
    endDate,
    filterMode === "range",
  );
  const deleteExpenseMutation = useDeleteExpense();

  // Base expenses from date filter
  const dateFilteredExpenses: Expense[] = useMemo(() => {
    if (filterMode === "date") return dateExpensesQuery.data ?? [];
    if (filterMode === "range") return rangeExpensesQuery.data ?? [];
    return allExpensesQuery.data ?? [];
  }, [
    filterMode,
    allExpensesQuery.data,
    dateExpensesQuery.data,
    rangeExpensesQuery.data,
  ]);

  // Apply category filter on top of date filter
  const expenses: Expense[] = useMemo(() => {
    if (categoryFilter === "all") return dateFilteredExpenses;
    return dateFilteredExpenses.filter(
      (exp) => getCategoryKind(exp.category) === categoryFilter,
    );
  }, [dateFilteredExpenses, categoryFilter]);

  const isLoading =
    (filterMode === "all" && allExpensesQuery.isLoading) ||
    (filterMode === "date" && dateExpensesQuery.isLoading) ||
    (filterMode === "range" && rangeExpensesQuery.isLoading);

  // Sort by date descending, then by id descending
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return Number(b.id) - Number(a.id);
    });
  }, [expenses]);

  // Category totals
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

  // Pie chart data
  const pieData = useMemo(() => {
    return ALL_CATEGORY_KINDS.filter(
      (kind) => (categoryTotals[kind] ?? 0) > 0,
    ).map((kind) => ({
      name: `${CATEGORY_ICONS[kind]} ${CATEGORY_LABELS[kind]}`,
      value: categoryTotals[kind] ?? 0,
      color: CATEGORY_COLORS[kind] ?? "#a78bfa",
      percent: 0, // will be filled by recharts
    }));
  }, [categoryTotals]);

  // Bar chart data
  const barData = useMemo(() => buildBarData(expenses), [expenses]);

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await deleteExpenseMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilter = () => {
    setFilterMode("all");
    setFilterDate(getTodayDate());
    setStartDate("");
    setEndDate("");
  };

  const categoriesWithData = ALL_CATEGORY_KINDS.filter(
    (kind) => categoryTotals[kind],
  );
  const hasActiveFilters = filterMode !== "all" || categoryFilter !== "all";

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
        {/* Filter Section */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div
            className="px-4 py-3 border-b border-border flex items-center justify-between"
            style={{ background: "oklch(0.97 0.03 75)" }}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-sm text-foreground">
                Filter Expenses
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  clearFilter();
                  setCategoryFilter("all");
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
              {(["all", "date", "range"] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                    filterMode === mode
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                  data-ocid="history.filter.tab"
                >
                  {mode === "all"
                    ? "All"
                    : mode === "date"
                      ? "By Date"
                      : "Date Range"}
                </button>
              ))}
            </div>

            {/* Date filter */}
            {filterMode === "date" && (
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
            {filterMode === "range" && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    From
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    To
                  </Label>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Category
                </Label>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
                      categoryFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    All
                  </button>
                  {availableCategories.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setCategoryFilter(kind)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[32px] ${
                        categoryFilter === kind
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{CATEGORY_ICONS[kind]}</span>
                      <span>{CATEGORY_LABELS[kind]}</span>
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
              className="px-4 py-3 border-b border-border flex items-center justify-between"
              style={{ background: "oklch(0.97 0.03 75)" }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-sm text-foreground">
                  Summary
                </h2>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-primary">
                <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {categoriesWithData.map((kind) => (
                <div
                  key={kind}
                  className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span>{CATEGORY_ICONS[kind]}</span>
                    <span>{CATEGORY_LABELS[kind]}</span>
                  </span>
                  <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" strokeWidth={2.5} />
                    {(categoryTotals[kind] ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {!isLoading && expenses.length > 0 && (
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div
              className="px-4 py-3 border-b border-border"
              style={{ background: "oklch(0.97 0.03 75)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <h2 className="font-display font-semibold text-sm text-foreground">
                    Charts
                  </h2>
                </div>
                {/* Toggle buttons */}
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setChartType("pie")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      chartType === "pie"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-ocid="history.pie_chart.toggle"
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    Pie
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      chartType === "bar"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-ocid="history.bar_chart.toggle"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Bar
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {chartType === "pie" ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    Spending breakdown by category
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={45}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={600}
                        paddingAngle={2}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--foreground)",
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Category percentage breakdown */}
                  <div className="mt-3 space-y-2">
                    {pieData
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((entry) => {
                        const pct =
                          grandTotal > 0
                            ? Math.round((entry.value / grandTotal) * 100)
                            : 0;
                        return (
                          <div
                            key={entry.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs text-foreground flex-1 truncate">
                              {entry.name}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {pct}%
                            </span>
                            <span className="text-xs text-primary font-semibold">
                              ₹{entry.value.toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    {barData.length > 10
                      ? "Weekly spending trend"
                      : "Daily spending trend"}
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={barData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
                        }
                        width={48}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: "oklch(0.95 0.03 75)" }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="oklch(0.65 0.18 55)"
                        radius={[6, 6, 0, 0]}
                        animationBegin={0}
                        animationDuration={600}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div
            className="px-4 py-3 border-b border-border"
            style={{ background: "oklch(0.97 0.03 75)" }}
          >
            <h2 className="font-display font-semibold text-sm text-foreground">
              Transactions
              {sortedExpenses.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({sortedExpenses.length})
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3" data-ocid="history.loading_state">
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
            <div className="p-8 text-center" data-ocid="history.empty_state">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm font-semibold text-foreground">
                No expenses found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Start adding expenses!"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sortedExpenses.map((expense, idx) => {
                const kind = getCategoryKind(expense.category);
                const amountNum = Number(expense.amount);
                const isHighSpend = amountNum >= HIGH_SPEND_THRESHOLD;

                return (
                  <li
                    key={String(expense.id)}
                    data-ocid={`history.item.${idx + 1}`}
                    className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                      isHighSpend
                        ? "bg-amber-50 border-l-4 border-l-amber-500 dark:bg-amber-950/30 dark:border-l-amber-400"
                        : "hover:bg-secondary/40"
                    }`}
                  >
                    {/* Category icon bubble */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        isHighSpend
                          ? "bg-amber-100 dark:bg-amber-900/50"
                          : "bg-secondary"
                      }`}
                    >
                      {CATEGORY_ICONS[kind]}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <CategoryBadge category={expense.category} />
                        {expense.subCategory && (
                          <span className="text-[10px] font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            {expense.subCategory}
                          </span>
                        )}
                        {isHighSpend && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" />
                            High
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(expense.date)}
                      </p>
                      {expense.repayName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {expense.repayName}
                        </p>
                      )}
                      {expense.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          📝 {expense.note}
                        </p>
                      )}
                    </div>

                    {/* Amount + delete */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`flex items-center gap-0.5 text-sm font-bold ${
                          isHighSpend
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        <IndianRupee
                          className="w-3.5 h-3.5"
                          strokeWidth={2.5}
                        />
                        {amountNum.toLocaleString("en-IN")}
                      </span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            disabled={deletingId === expense.id}
                            data-ocid={`history.delete_button.${idx + 1}`}
                          >
                            {deletingId === expense.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this ₹
                              {amountNum.toLocaleString("en-IN")} expense. This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="history.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(expense.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-ocid="history.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
