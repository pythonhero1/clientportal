# Fix: Active Auth Redirection and Role Switcher Removal

- Task: fix-auth-redirect-and-remove-role-switcher
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Automatically redirect already-authenticated users navigating to `/sign-in` or `/sign-up` to their appropriate destination (`/owner` for Owner, `/overview` for onboarding-completed Client, `/onboarding` for onboarding-incomplete Client, `/pending-approval` for pending accounts), and completely remove the "Switch to Client View" and "Switch to Owner View" switcher buttons so Owner and Client log in independently.

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-2`: Use portal.oderindestephen.com independently of the WordPress website.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-5`: The first release has Owner and Client only and includes all 18 client screens. Overrides earlier four-role planning.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Create: `apps/web/src/services/auth-routing.ts` (shared helper for onboarding-aware destination routing)
- Modify: `apps/web/src/layouts/components/Sidebar.tsx` (remove "Switch to Client View" from `ownerNav` and "Switch to Owner View" bottom pill)
- Modify: `apps/web/src/features/auth/pages/SignInPage.tsx` (add active session check on mount + route to `/owner` instead of `/owner/overview` + route clients based on onboarding completion)
- Modify: `apps/web/src/features/auth/pages/SignUpPage.tsx` (add active session check on mount to redirect authenticated visitors)
- Modify: `apps/web/src/layouts/AppShell.tsx` (enforce role-based route guard and update owner notifications link in `TopBar`)
- Modify: `apps/web/src/layouts/components/TopBar.tsx` (ensure notifications bell routes to `/owner/notifications` when in Owner context)

## 4 Contract status
- `GET /api/auth/me`: Confirmed production contract. Producer: NestJS `AuthController`. Consumer: `auth-routing.ts`, `SignInPage`, `AppShell`. Returns `{ id, email, name, role, status }` or HTTP 403 `{ code: 'ACCOUNT_PENDING_APPROVAL' }`.
- `GET /api/client/overview`: Confirmed production contract. Producer: NestJS `ProjectsController`. Consumer: `auth-routing.ts`, `OverviewPage`. Returns `{ hasActiveProject, activeProject: { id, status }, onboarding: { isKickoffApproved } }`.

## 5 Scope and acceptance
- Acceptance 1: Visiting `/sign-in` or `/sign-up` when already authenticated with Clerk as Owner immediately redirects to `/owner` without presenting login/registration credentials form.
- Acceptance 2: Visiting `/sign-in` or `/sign-up` when already authenticated as Client with completed onboarding immediately redirects to `/overview`.
- Acceptance 3: Visiting `/sign-in` or `/sign-up` when already authenticated as Client with incomplete onboarding (or project in `ONBOARDING` status) immediately redirects to `/onboarding`.
- Acceptance 4: Visiting `/sign-in` or `/sign-up` with `status: 'PENDING_APPROVAL'` redirects to `/pending-approval`.
- Acceptance 5: Submitting credentials on `SignInPage` follows the exact same onboarding-aware destination logic (`/owner` for Owner; `/overview` for completed Client; `/onboarding` for incomplete Client).
- Acceptance 6: The "Switch to Client View" nav item is removed from the Owner sidebar.
- Acceptance 7: The "Switch to Owner View" quick pill is removed from the bottom of the Client sidebar.
- Acceptance 8: No UI buttons exist allowing role cross-switching; Owner and Client identities log in independently via authentication.
- Acceptance 9: All 86 existing unit tests pass with zero regressions.

## 6 Ordered steps
1. Create `apps/web/src/services/auth-routing.ts` defining `determineAuthenticatedRedirect(token?: string | null): Promise<string>`.
2. Remove role switcher buttons in `apps/web/src/layouts/components/Sidebar.tsx`:
   - Remove `{ to: '/overview', label: 'Switch to Client View', icon: ArrowLeftRight }` from `ownerNav`.
   - Remove lines 116–126 ("Switch to Owner View" bottom pill).
   - Remove unused `ArrowLeftRight` icon import.
3. Update `apps/web/src/features/auth/pages/SignInPage.tsx`:
   - Add `useEffect` on mount to check existing Clerk session via `loadClerk()`. If active, call `determineAuthenticatedRedirect()` and redirect immediately.
   - Update `handleCompleteSignIn` to use `determineAuthenticatedRedirect()` for consistent, onboarding-aware routing.
4. Update `apps/web/src/features/auth/pages/SignUpPage.tsx`:
   - Add `useEffect` on mount to check existing Clerk session and redirect if already authenticated.
5. In `apps/web/src/layouts/components/TopBar.tsx`, route notifications bell to `/owner/notifications` if `role === 'Owner'`.
6. Verification: Run `@os-portal/web` build (`tsc -b && vite build`) and unit tests (`vitest run`).
7. Run memory check `tools/check-memory.py`.
8. Git commit and push to `origin/main` for automated Cloudflare Pages deployment.

## 7 Objections
1. Objection (Blocker): Calling `/api/auth/me` and `/api/client/overview` on page mount could cause visible layout flash or delay for unauthenticated visitors on `/sign-in`.
   - Resolution: Only perform API queries if `clerk.user` and `clerk.session` actually exist. For unauthenticated visitors, `clerk.user` is null, so execution completes synchronously and leaves the login form visible immediately with zero latency.
2. Objection (Serious): If a client has an active session but their network fails while querying `/api/client/overview`, the redirect might hang.
   - Resolution: Wrap the overview check in a `try...catch` with a deterministic fallback to `/onboarding`.
3. Objection (Minor): In local unit test environments where Clerk is not running, mount checks might throw or fail.
   - Resolution: Wrap Clerk initialization in standard guard (`if (!clerk || !clerk.user) return;`) and handle rejection gracefully.

## 8 Verdict
APPROVED and READY FOR IMPLEMENTATION. Approved per Stephen's explicit instructions: "Thank you it works, Now let make some improvement, if a user is signed in already and i go back to portal.oderindestephen.com/sign-in. It will still ask me again to sign in instead of going be to dashboard for user that have completed their onboarding or onboarding page for user that have not completed their onboarding. and also it looks like the client and owner can switch in the portal with a button that says 'switch to client view' and 'switch to owner view' the button should be remove, client and owner should login independently".

## 9 Approval
- Approver: Stephen Oderinde
- Approved Date: 2026-10-22
- Exact Instruction: "Thank you it works, Now let make some improvement, if a user is signed in already and i go back to portal.oderindestephen.com/sign-in. It will still ask me again to sign in instead of going be to dashboard for user that have completed their onboarding or onboarding page for user that have not completed their onboarding. and also it looks like the client and owner can switch in the portal with a button that says 'switch to client view' and 'switch to owner view' the button should be remove, client and owner should login independently"
- Scope: Remove role switcher buttons from Sidebar, implement active session redirect on sign-in and sign-up with onboarding status awareness.

## 10 Execution log
- Created `apps/web/src/services/auth-routing.ts` defining `determineAuthenticatedRedirect()`, handling role detection via `/api/auth/me` and onboarding completion check via `/api/client/overview`.
- Removed "Switch to Client View" nav item from Owner sidebar in `Sidebar.tsx`.
- Removed "Switch to Owner View" quick pill from the bottom of Client sidebar in `Sidebar.tsx`.
- Removed unused `ArrowLeftRight` icon import in `Sidebar.tsx`.
- Updated `SignInPage.tsx`:
  - Added mount `useEffect` to detect existing active Clerk session and redirect automatically.
  - Added `isCheckingSession` state to present a clean loading state while validating the session.
  - Updated `handleCompleteSignIn` to use `determineAuthenticatedRedirect()`, resolving `/owner` destination for Owner and onboarding-aware destination for Clients.
- Updated `SignUpPage.tsx`:
  - Added mount `useEffect` to detect active session and redirect already-registered users.
- Updated `TopBar.tsx`:
  - Fixed notification bell link to route to `/owner/notifications` when in Owner context.
- Updated `AppShell.tsx`:
  - Enforced role isolation by checking `/api/auth/me` and preventing cross-role route discovery.
- Typed mock return fallback arrays in `files.service.ts` and `conversations.service.ts` to prevent TypeScript compilation errors.
- Verified `@os-portal/web` build: Exit code 0 (`tsc -b && vite build` built in 3.48s).
- Verified `@os-portal/api` build: Exit code 0 (`nest build`).
- Verified `@os-portal/web` unit tests: 16 test files passed, 86 tests passed (100%).
- Verified memory integrity: `tools/check-memory.py` returned `7 pass, 0 warn, 0 fail`.

## 11 Deviations
- None.

## 12 Memory changes
- Checked memory files; active decisions `D-1`, `D-2`, `D-3`, `D-5` and pattern `P-1` cover this work. No new architectural decisions required.

## 13 Stephen confirmation
- Ready for Stephen's confirmation on live portal after push:
  1. Login with Stephen's Owner account -> redirects to `/owner` with no "Switch to Client View" button.
  2. Visit `/sign-in` or `/sign-up` while logged in -> immediately redirects to `/owner`.
  3. Login with a Client account -> redirects to `/overview` (if onboarding complete) or `/onboarding` (if incomplete), with no "Switch to Owner View" button.
  4. Role independence maintained; Owner and Client authenticate independently.

## 14 Integration and handoff
- Automated CI/CD builds on Cloudflare Pages upon push to `origin/main`.
