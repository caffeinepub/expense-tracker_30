# Specification

## Summary
**Goal:** Fix the infinite "Loading your profile..." screen that prevents users from accessing the Rupee Tracker app, and reset backend stable state to resolve the underlying canister issue.

**Planned changes:**
- Add a timeout (5 seconds) and error boundary to the profile-fetching logic so that if the profile query fails, errors, or returns null/undefined, the app falls back to the unauthenticated login state instead of spinning forever
- Fix the loading guard in App.tsx to not block rendering when the actor or identity is not yet ready
- Reset all stable variables (expenses, userProfiles, or equivalent) in the backend Motoko canister to empty collections so the canister responds correctly to profile queries

**User-visible outcome:** Opening the app no longer results in an indefinite loading spinner. If the profile fetch fails or times out, the user sees the login screen within 5 seconds and can authenticate via Internet Identity.
