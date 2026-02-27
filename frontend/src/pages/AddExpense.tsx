import { useState } from 'react';
import { CheckCircle2, Loader2, IndianRupee, User, AlertCircle } from 'lucide-react';
import {
  buildCategory,
  ALL_CATEGORY_KINDS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  getSubCategoriesByKind,
  hasSubCategoriesByKind,
  getTodayDate,
  CategoryKind,
} from '../lib/categoryUtils';
import { useAddExpense } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AddExpense() {
  const [date, setDate] = useState(getTodayDate());
  const [categoryKind, setCategoryKind] = useState<CategoryKind | ''>('');
  const [subCategory, setSubCategory] = useState('');
  const [repayName, setRepayName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [noteError, setNoteError] = useState(false);

  const addExpenseMutation = useAddExpense();

  const subCategories =
    categoryKind && hasSubCategoriesByKind(categoryKind as CategoryKind)
      ? getSubCategoriesByKind(categoryKind as CategoryKind)
      : [];

  const showRepayName = categoryKind === 'cashTransfer' && subCategory === 'Repay';
  const isOthers = categoryKind === 'others';
  const noteRequired = isOthers;

  const handleCategoryChange = (val: string) => {
    setCategoryKind(val as CategoryKind);
    setSubCategory('');
    setRepayName('');
    setNoteError(false);
  };

  const handleSubCategoryChange = (val: string) => {
    setSubCategory(val);
    if (val !== 'Repay') setRepayName('');
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

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // Validate repay name
    if (showRepayName && !repayName.trim()) return;

    // Validate note for Others
    if (noteRequired && !note.trim()) {
      setNoteError(true);
      return;
    }

    const category = buildCategory(categoryKind as CategoryKind, subCategory || undefined);

    try {
      await addExpenseMutation.mutateAsync({
        date,
        category,
        subCategory: subCategory || null,
        amount: BigInt(Math.round(amountNum)),
        note: note.trim() || null,
        repayName: showRepayName ? repayName.trim() : null,
      });

      // Reset form
      setCategoryKind('');
      setSubCategory('');
      setRepayName('');
      setAmount('');
      setNote('');
      setNoteError(false);
      setDate(getTodayDate());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const isValid =
    categoryKind &&
    amount &&
    parseFloat(amount) > 0 &&
    date &&
    (!showRepayName || repayName.trim().length > 0) &&
    (!noteRequired || note.trim().length > 0);

  return (
    <div className="px-4 py-5 animate-slide-up">
      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">Expense added successfully!</span>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border" style={{ background: 'oklch(0.97 0.03 75)' }}>
          <h2 className="font-display font-semibold text-base text-foreground">New Expense</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-semibold text-foreground">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-sm font-medium"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Expense Type</Label>
            <Select value={categoryKind} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORY_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind} className="text-sm">
                    <span className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[kind]}</span>
                      <span>{CATEGORY_LABELS[kind]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-category (conditional) */}
          {subCategories.length > 0 && (
            <div className="space-y-1.5 animate-slide-up">
              <Label className="text-sm font-semibold text-foreground">Sub-category</Label>
              <Select value={subCategory} onValueChange={handleSubCategoryChange}>
                <SelectTrigger className="h-11 text-sm">
                  <SelectValue placeholder="Select sub-category..." />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub} value={sub} className="text-sm">
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Repay Name (conditional - only when CashTransfer + Repay) */}
          {showRepayName && (
            <div className="space-y-1.5 animate-slide-up">
              <Label htmlFor="repayName" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Person Name
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="repayName"
                type="text"
                value={repayName}
                onChange={(e) => setRepayName(e.target.value)}
                placeholder="Enter person's name..."
                className="h-11 text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Name of the person who needs to repay you
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <IndianRupee className="w-4 h-4 text-primary" strokeWidth={2.5} />
              </div>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-11 pl-8 text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Note — required for Others, optional otherwise */}
          <div className="space-y-1.5">
            <Label
              htmlFor="note"
              className={`text-sm font-semibold flex items-center gap-1 ${noteError ? 'text-destructive' : 'text-foreground'}`}
            >
              Note
              {noteRequired ? (
                <span className="text-destructive ml-0.5">*</span>
              ) : (
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              )}
            </Label>
            {isOthers && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                A note is required when selecting "Others"
              </p>
            )}
            <Textarea
              id="note"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={noteRequired ? 'Describe this expense...' : 'Add a note...'}
              className={`text-sm resize-none min-h-[72px] ${noteError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              rows={2}
            />
            {noteError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Note is required for Others category
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isValid || addExpenseMutation.isPending}
            className="w-full h-12 text-sm font-bold rounded-xl"
          >
            {addExpenseMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <IndianRupee className="w-4 h-4 mr-1" strokeWidth={2.5} />
                Save Expense
              </>
            )}
          </Button>

          {addExpenseMutation.isError && (
            <p className="text-xs text-destructive text-center">
              Failed to save. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
