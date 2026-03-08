# Expense Tracker

## Current State

Full-stack expense tracker with:
- Categories: food (Biryani, Junk Food), tea, coolDrink, petrol, fruits, recharge, shopping (Clothes, Accessories, Watches, Skincare, Gadgets), trip, bikeRepair, medical (Medicine, Hospital), cashTransfer (Family, NeedToPay, Repay), others
- Repay tracking with person name field
- History page with date/range/category filters and grand total
- RepayReport page grouping repay amounts by person
- Celebration animation on submit for high-spend expenses
- Login via Internet Identity

## Requested Changes (Diff)

### Add
- **Credit Card** as a new top-level expense category (separate, not a payment method)
- **Haircut** as a new top-level expense category
- **Donation** as a new top-level expense category
- **Trip sub-categories**: Travel, Food, Shopping
- **Food sub-categories**: add Tiffin and Others (note mandatory when Others selected for food sub-category)
- **Shopping sub-categories**: add Shoes
- **Food sub-category Others**: note is mandatory (similar to top-level Others)
- **Budget Goals system**: per-category budget goals stored in localStorage (no backend change needed). User can set a monthly budget goal per category. When cumulative spend in current month reaches 75% of goal, show a prominent warning banner.
- **Pie chart** in History tab: shows spend breakdown by category (percentage + value). Dynamic — responds to active date/category filters.
- **Bar chart** in History tab: shows daily/monthly spend trend. Dynamic — responds to active date filters.
- **Charts tab** or "Reports" section in History: embedded charts with toggle between pie and bar view.
- **Budget Goals page/section**: accessible from nav or settings — list all categories with a goal input field per category, show current month spend vs goal with progress bar and 75% warning highlight.

### Modify
- `categoryUtils.ts`: add `creditCard`, `haircut`, `donation` to CategoryKind, CATEGORY_LABELS, CATEGORY_ICONS, ALL_CATEGORY_KINDS
- `categoryUtils.ts`: update FOOD_SUB_CATEGORIES to include 'Tiffin' and 'Others'
- `categoryUtils.ts`: update SHOPPING_SUB_CATEGORIES to include 'Shoes'
- `categoryUtils.ts`: add TRIP_SUB_CATEGORIES = ['Travel', 'Food', 'Shopping']
- `categoryUtils.ts`: update `hasSubCategoriesByKind` to include 'trip'
- `categoryUtils.ts`: update `buildCategory` to handle new categories
- `AddExpense.tsx`: note mandatory when food sub-category is 'Others' (in addition to top-level Others)
- `History.tsx`: add pie chart and bar chart sections below summary, dynamic based on filters, with Recharts library
- `backend.mo`: add `creditCard`, `haircut`, `donation` variant types to Category

### Remove
- Nothing removed

## Implementation Plan

1. Update Motoko backend to add `creditCard`, `haircut`, `donation` as new Category variants
2. Update `categoryUtils.ts` with all new categories and sub-categories
3. Update `AddExpense.tsx` to handle food sub-category Others note requirement
4. Create `BudgetGoals.tsx` page — category budget goal setting with per-category input, progress bar, 75% warning
5. Update `History.tsx` to add Recharts pie chart and bar chart sections (dynamic, filter-aware)
6. Update `App.tsx` and `BottomNavigation` to add a 4th tab for Budget Goals
7. Store budget goals in localStorage keyed by category
8. Show 75% budget warning banner in AddExpense and/or BudgetGoals when threshold is met
