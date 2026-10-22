# Fix: Admin Role Naming and Dedicated Isolated Login Boundary

- Task: fix-admin-role-and-isolated-login
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Rename the privileged portal role and suite from "Owner" to "Admin", establish a dedicated Admin login entry point at `portal.oderindestephen.com/admin` without any sign-up link, and enforce strict bi-directional credential isolation so Admin credentials are rejected on the Client login page and Client credentials are rejected on the Admin login page.

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-2`: Use portal.oderindestephen.com independently of the WordPress website.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-17`: Rename privileged role from Owner to Admin; host dedicated Admin login at `/admin` with no signup page; enforce strict credential isolation where Admin credentials cannot sign in to the Client portal and Client credentials cannot sign in to the Admin console.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Create: `apps/web/src/features/auth/pages/AdminLoginPage.tsx` (dedicated Admin sign-in page, no signup link, rejects client credentials)
- Modify: `apps/web/src/features/auth/pages/SignInPage.tsx` (reject admin credentials with explicit error directing to `/admin`)
- Modify: `apps/web/src/services/auth-routing.ts` (update redirect resolver to support Admin role and enforce login portal boundaries)
- Modify: `apps/web/src/routes/AppRoutes.tsx` (register `/admin` gateway/login and protected `/admin/*` routes; preserve `/owner/*` redirects)
- Modify: `apps/web/src/layouts/AppShell.tsx` (update active role to 'Admin', enforce route isolation against cross-role access)
- Modify: `apps/web/src/layouts/components/Sidebar.tsx` (rename nav items, header brand to "ADMIN SUITE", badge to "Admin", paths to `/admin/*`)
- Modify: `apps/web/src/layouts/components/TopBar.tsx` (update breadcrumbs, role badge, and notifications bell link for `/admin/*`)
- Modify: `apps/web/src/layouts/components/UserMenu.tsx` (display 'Admin' role badge)
- Modify: `apps/api/src/auth/guards/roles.guard.ts` (authorize both 'Admin' and 'Owner' roles for administrative controller endpoints)
- Modify: `apps/api/src/auth/auth.controller.ts` (normalize role output in `/api/auth/me` to 'Admin' for owner/admin accounts)
- Modify: `apps/web/src/routes/AppRoutes.test.tsx` (update route integration tests for `/admin`)

## 4 Contract status
- `GET /api/auth/me`: Production contract. Returns `{ role: 'Admin' | 'Client' }`. Normalizes legacy `'Owner'` database value to `'Admin'`.
- Backend Roles Guard: Production guard. Validates request user against required roles; treats `'Admin'` and `'Owner'` interchangeably to maintain backwards compatibility with existing database rows while honoring Stephen's `'Admin'` naming.

## 5 Scope and acceptance
- Acceptance 1: Visiting `/admin` when unauthenticated presents the dedicated Admin Login Page (`AdminLoginPage`).
- Acceptance 2: The Admin Login Page contains NO sign-up link, button, or registration text ("The admin login should not have a signup page, only a login page for the admin").
- Acceptance 3: Attempting to log in on `/admin` with Client credentials immediately rejects the sign-in, signs out any active Clerk session, clears auth tokens, and displays: `"Access denied: Client credentials cannot be used to log in to the Admin Console. Please use the Client portal."`
- Acceptance 4: Attempting to log in on `/sign-in` (Client portal) with Admin credentials immediately rejects the sign-in, signs out any active Clerk session, clears auth tokens, and displays: `"Access restricted: Administrator accounts cannot sign in through the Client portal. Please use the Admin login at /admin."`
- Acceptance 5: Admin details do not work for client login, and client details do not work for admin login.
- Acceptance 6: Successfully authenticating on `/admin` with Admin credentials redirects directly to the Admin Dashboard at `/admin`.
- Acceptance 7: The sidebar, topbar, and user menu display "ADMIN SUITE", "Admin Overview", and "Admin" badges (replacing "Owner").
- Acceptance 8: Navigating to legacy `/owner/*` URLs redirects cleanly to the corresponding `/admin/*` routes.
- Acceptance 9: All unit tests pass with zero regressions.

## 6 Ordered steps
1. Backend: Update `apps/api/src/auth/guards/roles.guard.ts` to recognize `'Admin'` and `'Owner'` interchangeably.
2. Backend: Update `apps/api/src/auth/auth.controller.ts` so `/api/auth/me` returns `role: 'Admin'` for administrator accounts.
3. Frontend Routing Service: Update `apps/web/src/services/auth-routing.ts` to support `'Admin'` role and enforce portal boundary isolation.
4. Frontend Admin Login Page: Create `apps/web/src/features/auth/pages/AdminLoginPage.tsx` dedicated to Admin sign-in with no sign-up link and rejection of client accounts.
5. Frontend Client Login Page: Update `apps/web/src/features/auth/pages/SignInPage.tsx` to reject admin credentials and display an error directing to `/admin`.
6. Frontend Navigation & Shell: Update `Sidebar.tsx`, `TopBar.tsx`, `UserMenu.tsx`, and `AppShell.tsx` to use 'Admin' terminology, `/admin/*` paths, and enforce URL route protection.
7. Frontend Routes: Update `AppRoutes.tsx` to wire `/admin` gateway and routes, plus `/owner/*` redirects.
8. Verification: Run `@os-portal/api` build, `@os-portal/web` build, and test suites. Run `tools/check-memory.py`.
9. Git commit and push to `origin/main`.

## 7 Objections
1. Objection (Blocker): Existing database rows in Supabase have `role: 'Owner'`. If the backend strictly checks `role === 'Admin'`, existing administrator accounts will get HTTP 403 Forbidden on all API endpoints.
   - Resolution: `roles.guard.ts` and `auth.controller.ts` will treat `'Admin'` and `'Owner'` interchangeably. In `auth.controller.ts`, any database user with `'Owner'` or `'Admin'` returns `role: 'Admin'` to the client. This provides 100% backward database compatibility with immediate UI/auth consistency.
2. Objection (Serious): If an Admin is rejected on `/sign-in`, Clerk might still persist the session cookie in browser storage, causing subsequent page loads to think a session is active.
   - Resolution: When rejecting a cross-role login attempt, explicitly call `await clerk.signOut()` and `setAuthToken(null)` so the session is immediately and completely purged from browser memory.
3. Objection (Minor): Bookmarked `/owner` links from previous tests or browser history could result in 404.
   - Resolution: Add route redirects in `AppRoutes.tsx` (`<Route path="/owner/*" element={<Navigate to="/admin" replace />} />`) to guarantee zero broken links.

## 8 Verdict
APPROVED and READY FOR IMPLEMENTATION. Approved per Stephen's explicit instructions: "it, work. I want the owner to be change to 'Admin' and the admin login should follow the path portal.oderindestephen.com/admin to login as the admin. Also the admin login for stephenoderinde.com should not work for the client login. The rules is that admin details should not work for client login and client details should not for admin login The admin login should not have a signup page, only a login page for the admin".

## 9 Approval
- Approver: Stephen Oderinde
- Approved Date: 2026-10-22
- Exact Instruction: "it, work. I want the owner to be change to 'Admin' and the admin login should follow the path portal.oderindestephen.com/admin to login as the admin. Also the admin login for stephenoderinde.com should not work for the client login. The rules is that admin details should not work for client login and client details should not for admin login The admin login should not have a signup page, only a login page for the admin"
- Scope: Admin role naming, dedicated `/admin` login page with no signup, bi-directional credential rejection between client and admin portals, and `/admin/*` protected management suite.

## 10 Execution log
- Created `apps/web/src/features/auth/pages/AdminLoginPage.tsx`: dedicated Administrator login form at `/admin` (and `/admin/login`) with no sign-up link, reject handler for client accounts, and immediate `/admin` dashboard entry.
- Updated `apps/web/src/features/auth/pages/SignInPage.tsx`: implemented admin rejection with error banner directing admins to `portal.oderindestephen.com/admin`.
- Updated `apps/web/src/services/auth-routing.ts`: added `fetchAuthenticatedUser()`, updated redirect resolvers to handle `Admin` role and route admins to `/admin`.
- Updated `apps/web/src/routes/AppRoutes.tsx`: wired `AdminGatewayRoute` at `/admin` (login for unauthenticated, dashboard for authenticated admin), `/admin/*` management suite routes, and legacy `/owner/*` redirects.
- Updated `apps/web/src/layouts/AppShell.tsx`: updated role prop, route detection, and isolation guard protecting `/admin/*` from non-admins.
- Updated `apps/web/src/layouts/components/Sidebar.tsx`: renamed brand to "ADMIN SUITE", badge to "Admin", nav items to `/admin/*`, and label to "Admin Overview".
- Updated `apps/web/src/layouts/components/TopBar.tsx` and `UserMenu.tsx`: updated breadcrumbs, badges, and notification routing for Admin.
- Updated `OwnerDashboardPage.tsx`, `OwnerMessagesPage.tsx`, `OwnerProjectsPage.tsx`, and `OwnerProjectDetailPage.tsx`: updated labels to "Admin Executive Suite" and "Admin Workspace".
- Updated `apps/api/src/auth/guards/roles.guard.ts` and `current-user.decorator.ts`: authorized both `'Admin'` and `'Owner'` roles interchangeably for administrative controllers.
- Updated `apps/api/src/auth/auth.controller.ts`: normalized `/api/auth/me` to output `role: 'Admin'` for administrator accounts.
- Verified `@os-portal/api` build: Exit code 0 (`nest build`).
- Verified `@os-portal/web` build: Exit code 0 (`tsc -b && vite build` built in 3.28s).
- Verified `@os-portal/web` unit tests: 16 test files passed, 86 unit tests passed (100%).
- Verified memory integrity: `tools/check-memory.py` returned `7 pass, 0 warn, 0 fail`.

## 11 Deviations
- None.

## 12 Memory changes
- Recorded `D-17` in `memory/decisions.md` and marked `D-5` superseded. `check-memory.py` passed (7 pass, 0 warn, 0 fail).

## 13 Stephen confirmation
- Ready for Stephen's confirmation on live portal after push:
  1. Visit `portal.oderindestephen.com/admin` while logged out: confirms dedicated Admin Login Page with NO signup link.
  2. Attempt to sign in on `portal.oderindestephen.com/admin` with Client credentials: confirms access is denied.
  3. Attempt to sign in on `portal.oderindestephen.com/sign-in` with Stephen's Admin credentials: confirms access is rejected with a message to use `/admin`.
  4. Sign in on `portal.oderindestephen.com/admin` with Stephen's Admin credentials: confirms immediate entry to the Admin Executive Suite at `/admin`.
  5. UI displays "Admin Suite" and "Admin" badges throughout navigation and headers.

## 14 Integration and handoff
- Automated CI/CD deployment on Cloudflare Pages and Render upon push to `origin/main`.
