# Specification

## Summary
**Goal:** Improve the Add Expense form layout, add a themed decorative background, highlight high-spend rows in History, show a celebration animation for expensive entries, and preserve all existing backend data.

**Planned changes:**
- Redesign the Add Expense form so the category dropdown, sub-category selector, Amount, Notes, and all other fields are stacked in clearly separated full-width rows with no visual overlap between the dropdown list and other fields
- Show the sub-category row only when a category with sub-categories is selected, appearing smoothly below the category row
- Add a soft repeating decorative background pattern (Rupee ₹, shopping bag, medical cross, food bowl, petrol pump symbols) in warm amber/saffron tones to the Add Expense and History pages, served from frontend/public/assets/generated, without reducing text readability
- In the History page, highlight expense rows with amount ≥ ₹500 with a visually distinct treatment (color tint, icon, or border) while keeping the category badge and sub-category label clearly visible
- After submitting an expense ≥ ₹500, display a fun celebration overlay animation (e.g., falling coins or confetti with a cute coin character) and play a short playful sound effect; the animation auto-dismisses after 2–3 seconds
- Entries below ₹500 continue to show only the normal success banner with no celebration
- Ensure all existing backend stable variables and expense records are preserved across the upgrade; update migration.mo if needed so no data is lost

**User-visible outcome:** The Add Expense form is easy to use with clearly separated fields and no overlapping dropdowns. Both the Add Expense and History pages have a decorative themed background. High-spend entries (≥ ₹500) are visually highlighted in History, and submitting an expensive entry triggers a fun celebration animation. All previously saved expenses remain accessible after the upgrade.
