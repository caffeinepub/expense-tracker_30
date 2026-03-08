import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Loader2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAddExpense, useGetExpenses } from "../hooks/useQueries";
import { checkBudgetWarning, getBudgetGoals } from "../lib/budgetGoals";
import {
  ALL_CATEGORY_KINDS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type CategoryKind,
  buildCategory,
  getCategoryKind,
  getSubCategoriesByKind,
  getTodayDate,
  getVirtualCategorySubLabel,
  hasSubCategoriesByKind,
  isNoteRequiredForSubCategory,
  isVirtualCategory,
} from "../lib/categoryUtils";

// Celebration overlay component
function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  // Play sound with graceful fallback
  useEffect(() => {
    try {
      const audio = new Audio("/assets/generated/celebration-sound.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {
        /* blocked by browser, ignore */
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => `confetti-${i}`).map((key) => (
          <div
            key={key}
            className="absolute animate-confetti-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${10 + Math.random() * 20}%`,
              animationDelay: `${Math.random() * 1.2}s`,
              animationDuration: `${1.5 + Math.random() * 1.2}s`,
              fontSize: `${16 + Math.floor(Math.random() * 18)}px`,
            }}
          >
            {
              ["🪙", "💰", "✨", "🎉", "🎊", "💸", "⭐", "🌟"][
                Math.floor(Math.random() * 8)
              ]
            }
          </div>
        ))}
      </div>

      {/* Coin character */}
      <div className="relative flex flex-col items-center gap-3 animate-celebration-bounce">
        <img
          src="/assets/generated/celebration-coin.dim_400x400.png"
          alt="Celebration"
          className="w-32 h-32 drop-shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="bg-white rounded-2xl px-6 py-3 shadow-2xl text-center">
          <p className="text-2xl font-black text-amber-600">Big Spender! 🤑</p>
          <p className="text-sm text-gray-600 mt-1">That's a hefty expense!</p>
        </div>
      </div>
    </div>
  );
}

export function AddExpense() {
  const [date, setDate] = useState(getTodayDate());
  const [categoryKind, setCategoryKind] = useState<CategoryKind | "">("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [subCategory, setSubCategory] = useState("");
  const [repayName, setRepayName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [noteError, setNoteError] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement>(null);

  const addExpenseMutation = useAddExpense();
  const { data: allExpenses } = useGetExpenses();

  const subCategories =
    categoryKind && hasSubCategoriesByKind(categoryKind as CategoryKind)
      ? getSubCategoriesByKind(categoryKind as CategoryKind)
      : [];

  const showRepayName =
    categoryKind === "cashTransfer" && subCategory === "Repay";

  // Determine if note is required based on category/sub-category
  const noteRequired = categoryKind
    ? isNoteRequiredForSubCategory(categoryKind as CategoryKind, subCategory)
    : false;

  // Budget warning for selected category
  const budgetWarning = useMemo(() => {
    if (!categoryKind || !allExpenses) return null;

    const goals = getBudgetGoals();
    // For virtual categories, they map to 'others' in the backend but we track them by their UI kind
    const goalKey = categoryKind;
    const goal = goals[goalKey];
    if (!goal) return null;

    // Compute current month's spend for this category
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let spent = 0;
    for (const exp of allExpenses) {
      if (!exp.date.startsWith(currentMonth)) continue;
      const expKind = getCategoryKind(exp.category);

      if (isVirtualCategory(categoryKind as CategoryKind)) {
        // Virtual categories stored as 'others' with subCategory = virtual label
        const virtualLabel = getVirtualCategorySubLabel(
          categoryKind as CategoryKind,
        );
        if (expKind === "others" && exp.subCategory === virtualLabel) {
          spent += Number(exp.amount);
        }
      } else if (expKind === categoryKind) {
        spent += Number(exp.amount);
      }
    }

    const warning = checkBudgetWarning(goalKey, spent, goal);
    if (!warning.isWarning) return null;

    return { goal, spent, ...warning };
  }, [categoryKind, allExpenses]);

  const handleCategorySelect = (kind: CategoryKind) => {
    setCategoryKind(kind);
    setSubCategory("");
    setRepayName("");
    setNoteError(false);
    setShowCategoryPicker(false);
  };

  const handleSubCategoryChange = (val: string) => {
    setSubCategory(val);
    if (val !== "Repay") setRepayName("");
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    if (noteRequired && val.trim().length > 0) {
      setNoteError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryKind || !amount || !date) return;

    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) return;

    if (showRepayName && !repayName.trim()) return;

    if (noteRequired && !note.trim()) {
      setNoteError(true);
      return;
    }

    const kind = categoryKind as CategoryKind;

    // For virtual categories, pass the virtual label as subCategory
    let finalSubCategory: string | null;
    if (isVirtualCategory(kind)) {
      finalSubCategory = getVirtualCategorySubLabel(kind);
    } else {
      finalSubCategory = subCategory || null;
    }

    const category = buildCategory(kind, subCategory || undefined);

    try {
      await addExpenseMutation.mutateAsync({
        date,
        category,
        subCategory: finalSubCategory,
        amount: BigInt(Math.round(amountNum)),
        note: note.trim() || null,
        repayName: showRepayName ? repayName.trim() : null,
      });

      const wasExpensive = amountNum >= 500;

      // Reset form
      setCategoryKind("");
      setSubCategory("");
      setRepayName("");
      setAmount("");
      setNote("");
      setNoteError(false);
      setDate(getTodayDate());

      if (wasExpensive) {
        setShowCelebration(true);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
    }
  };

  const isValid =
    categoryKind &&
    amount &&
    Number.parseFloat(amount) > 0 &&
    date &&
    (!showRepayName || repayName.trim().length > 0) &&
    (!noteRequired || note.trim().length > 0);

  const selectedLabel = categoryKind
    ? CATEGORY_LABELS[categoryKind as CategoryKind]
    : null;
  const selectedIcon = categoryKind
    ? CATEGORY_ICONS[categoryKind as CategoryKind]
    : null;

  return (
    <div className="relative px-4 py-5 animate-slide-up min-h-screen">
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

      {/* Celebration overlay */}
      {showCelebration && (
        <CelebrationOverlay
          onDone={() => {
            setShowCelebration(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
          }}
        />
      )}

      <div className="relative z-10">
        {/* Success Banner */}
        {showSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 animate-slide-up">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">
              Expense saved successfully! 🎯
            </span>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 border-b border-border"
            style={{ background: "oklch(0.97 0.03 75)" }}
          >
            <h2 className="font-display font-semibold text-base text-foreground">
              New Expense
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-5">
            {/* ── Date ── */}
            <div className="space-y-1.5">
              <Label
                htmlFor="date"
                className="text-sm font-semibold text-foreground"
              >
                📅 Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 text-sm font-medium w-full"
                required
                data-ocid="add_expense.input"
              />
            </div>

            {/* ── Expense Type — card-based picker ── */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                🏷️ Expense Type
              </Label>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setShowCategoryPicker((v) => !v)}
                className={`w-full h-12 flex items-center justify-between px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  categoryKind
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
                data-ocid="add_expense.select"
              >
                <span className="flex items-center gap-2">
                  {selectedIcon && (
                    <span className="text-lg">{selectedIcon}</span>
                  )}
                  <span>{selectedLabel ?? "Tap to select category…"}</span>
                </span>
                {showCategoryPicker ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Inline card grid — no z-index overlap */}
              {showCategoryPicker && (
                <div
                  ref={categoryPickerRef}
                  className="mt-2 grid grid-cols-3 gap-2 animate-slide-up"
                >
                  {ALL_CATEGORY_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => handleCategorySelect(kind)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 px-1 min-h-[72px] transition-all active:scale-95 ${
                        categoryKind === kind
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-secondary hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      <span className="text-2xl leading-none">
                        {CATEGORY_ICONS[kind]}
                      </span>
                      <span className="text-[11px] font-semibold text-center leading-tight text-foreground">
                        {CATEGORY_LABELS[kind]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Budget Warning Banner ── */}
            {budgetWarning && (
              <div
                className="flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 animate-slide-up"
                data-ocid="add_expense.budget_warning"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="text-xs font-semibold">
                  {budgetWarning.isExceeded
                    ? `🚨 Budget exceeded! You've spent ₹${budgetWarning.spent.toLocaleString("en-IN")} of your ₹${budgetWarning.goal.toLocaleString("en-IN")} ${selectedLabel} budget (${budgetWarning.percentage}%)`
                    : `⚠️ You've reached ${budgetWarning.percentage}% of your ₹${budgetWarning.goal.toLocaleString("en-IN")} ${selectedLabel} budget!`}
                </div>
              </div>
            )}

            {/* ── Sub-category (conditional) ── */}
            {subCategories.length > 0 && (
              <div className="space-y-1.5 animate-slide-up">
                <Label className="text-sm font-semibold text-foreground">
                  🔖 Sub-category
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubCategoryChange(sub)}
                      className={`h-11 flex items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                        subCategory === sub
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-foreground hover:border-primary/40 hover:bg-accent"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Repay Name (conditional) ── */}
            {showRepayName && (
              <div className="space-y-1.5 animate-slide-up">
                <Label
                  htmlFor="repayName"
                  className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  Person Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="repayName"
                  type="text"
                  value={repayName}
                  onChange={(e) => setRepayName(e.target.value)}
                  placeholder="Enter person's name…"
                  className="h-11 text-sm"
                  required
                  data-ocid="add_expense.input"
                />
                <p className="text-xs text-muted-foreground">
                  Name of the person who needs to repay you
                </p>
              </div>
            )}

            {/* ── Amount ── */}
            <div className="space-y-1.5">
              <Label
                htmlFor="amount"
                className="text-sm font-semibold text-foreground"
              >
                💰 Amount
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <IndianRupee
                    className="w-4 h-4 text-primary"
                    strokeWidth={2.5}
                  />
                </div>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-12 pl-8 text-base font-bold"
                  required
                  data-ocid="add_expense.input"
                />
              </div>
              {amount && Number.parseFloat(amount) >= 500 && (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  🔥 High spend alert — celebration incoming!
                </p>
              )}
            </div>

            {/* ── Note ── */}
            <div className="space-y-1.5">
              <Label
                htmlFor="note"
                className={`text-sm font-semibold flex items-center gap-1 ${noteError ? "text-destructive" : "text-foreground"}`}
              >
                📝 Note
                {noteRequired ? (
                  <span className="text-destructive ml-0.5">*</span>
                ) : (
                  <span className="text-muted-foreground font-normal ml-1">
                    (optional)
                  </span>
                )}
              </Label>
              {noteRequired && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />A note is
                  required for this selection
                </p>
              )}
              <Textarea
                id="note"
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={
                  noteRequired ? "Describe this expense…" : "Add a note…"
                }
                className={`text-sm resize-none min-h-[72px] ${noteError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                rows={2}
                data-ocid="add_expense.textarea"
              />
              {noteError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Note is required for this category
                </p>
              )}
            </div>

            {/* ── Submit ── */}
            <Button
              type="submit"
              disabled={!isValid || addExpenseMutation.isPending}
              className="w-full h-12 text-sm font-bold rounded-xl"
              data-ocid="add_expense.submit_button"
            >
              {addExpenseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4 mr-1" strokeWidth={2.5} />
                  Save Expense
                </>
              )}
            </Button>

            {addExpenseMutation.isError && (
              <p
                className="text-xs text-destructive text-center"
                data-ocid="add_expense.error_state"
              >
                Failed to save. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
