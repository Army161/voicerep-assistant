

# Phase 1: Auth + Marketing + Routing

## Blocker: Supabase Not Connected

Supabase is **not connected yet** — there's no `src/integrations/supabase/` directory and no Supabase connection linked to this project. The database migration is already applied on the Supabase side, but the frontend has no client to talk to it.

**Before I can build anything, you need to connect Supabase.** I'll initiate that now — you'll need to select your existing Supabase project (`wmdcufvcelevdubuajmu`).

## Once Connected, Build Order

1. **Auth Context** — `src/contexts/AuthContext.tsx` with session, profile, workspace fetching, retry logic (3 attempts for post-signup trigger race), `refresh()`, `signOut()`

2. **Auth Guard** — `src/components/AuthGuard.tsx` protecting only `/app` and `/app/settings`. Loading → spinner, no user → `/login`, no workspace → "Setting up..." with retry

3. **Navbar** — `src/components/Navbar.tsx` with conditional login/signout/dashboard links

4. **Pages**:
   - `Index.tsx` — Full marketing page (hero, features, pricing cards, CTA)
   - `Login.tsx` — Sign in / Create account tabs, email+password, redirect to `/onboarding`
   - `ResetPassword.tsx` — Two-mode (request email / set new password)
   - 6 placeholder pages (Onboarding, Billing, BillingSuccess, BillingCancel, Dashboard, Settings)

5. **Routing** — Classic `<BrowserRouter><Routes>` in `App.tsx`, wrapped with `AuthProvider`

## Technical Details
- React Router v6 classic `<BrowserRouter><Routes>` style
- AuthContext uses `onAuthStateChange` set up before `getSession()`
- Post-signup redirect → `/onboarding`
- Reset password: `redirectTo: window.location.origin + '/reset-password'`
- No onboarding/subscription enforcement in AuthGuard (Phase 1)

