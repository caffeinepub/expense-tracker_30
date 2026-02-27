# Specification

## Summary
**Goal:** Fix the "Failed to save. Please try again." error that appears when submitting the Add Expense form in Rupee Tracker.

**Planned changes:**
- Investigate and fix the type/variant mismatch between the frontend `addExpense` call in `useQueries.ts` and the Category variant type declared in the Motoko backend `main.mo`
- Ensure the `#others` variant (and all other category variants) passed from the frontend exactly match the declarations in `main.mo`
- Verify `migration.mo` does not cause a schema mismatch or corrupt stable state during canister upgrade
- Fix any serialization/deserialization issue so all categories save successfully

**User-visible outcome:** Users can submit expenses for any category (Food, Tea, Cooldrink, Petrol, Fruits, Recharge, Shopping, Trip, Bike Repair, Medical, Cash Transfer, Others) without seeing a save error. After a successful save, the form resets and a success confirmation is shown.
