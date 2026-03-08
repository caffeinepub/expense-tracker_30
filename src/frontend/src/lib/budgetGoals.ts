const STORAGE_KEY = "expense_budget_goals";
const WARNING_THRESHOLD = 0.75;

export interface BudgetGoal {
  categoryKind: string;
  monthlyGoal: number; // in rupees
}

/** Returns a map of categoryKind → goal amount (in ₹) */
export function getBudgetGoals(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/** Persists a budget goal for a category */
export function setBudgetGoal(categoryKind: string, goal: number): void {
  const goals = getBudgetGoals();
  if (goal <= 0) {
    delete goals[categoryKind];
  } else {
    goals[categoryKind] = goal;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

/** Removes the budget goal for a category */
export function removeBudgetGoal(categoryKind: string): void {
  const goals = getBudgetGoals();
  delete goals[categoryKind];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export interface BudgetWarning {
  isWarning: boolean; // spent >= 75% of goal
  isExceeded: boolean; // spent >= 100%
  percentage: number; // 0-100+
}

export function checkBudgetWarning(
  _categoryKind: string,
  spentAmount: number,
  goal: number,
): BudgetWarning {
  if (!goal || goal <= 0) {
    return { isWarning: false, isExceeded: false, percentage: 0 };
  }
  const ratio = spentAmount / goal;
  const percentage = Math.round(ratio * 100);
  return {
    isWarning: ratio >= WARNING_THRESHOLD,
    isExceeded: ratio >= 1,
    percentage,
  };
}
