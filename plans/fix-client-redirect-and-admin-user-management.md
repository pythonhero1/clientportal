# Fix: Client Redirect to Admin and Client Directory & User Management in Admin Panel

- Task: fix-client-redirect-and-admin-user-management
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Fix the client redirect bug in `AppShell.tsx` so approved client users are redirected to their Client Dashboard (`/overview`), and add a comprehensive Client Management Directory with user info display, status toggles (Suspend/Reactivate), and user deletion capabilities to the Admin Panel (`/admin/clients`).

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-8`: File deletion and audit; no automatic purge; Owner lifecycle audit.
- `D-17`: Admin role naming, dedicated `/admin` login, strict credential isolation between Admin and Client.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Modify: `apps/web/src/layouts/AppShell.tsx`
  - Remove default prop `userEmail = 'stephenoderinde@gmail.com'` and `userName = 'Stephen Oderinde'`. Default to empty strings `''`.
  - Fix `isUserAdmin` evaluation: never use closure `currentUser.email` which defaults before state loads. Check verified API result `me.role === 'Admin' || me.role === 'Owner' || me.email?.toLowerCase() === 'stephenoderinde@gmail.com'`.
  - Ensure clients accessing client routes (`/overview`, `/onboarding`) are never navigated to `/admin`.
- Modify: `apps/web/src/routes/AppRoutes.tsx`
  - In `AdminGatewayRoute`: if the authenticated user is a Client, do not render `OwnerDashboardPage`; display `AdminLoginPage` with role isolation guidance or redirect to `/overview`.
- Modify: `apps/api/src/users/users.controller.ts`
  - Enhance `GET /api/admin/users/clients` to return all client accounts with complete user details.
  - Add `POST /api/admin/users/:userId/suspend` to toggle client status to `SUSPENDED`.
  - Add `DELETE /api/admin/users/:userId` to permanently delete a client from Clerk and the database.
- Modify: `apps/api/src/users/users.service.ts`
  - Enhance `getClients()` to return `createdAt`, `profile` info, and include all client accounts.
  - Add `suspendUser(userId, actorId)`: sets status to `SUSPENDED`, revokes Clerk sessions, logs to `AuditLog`.
  - Add `deleteUser(userId, actorId)`: validates that Stephen/Owner cannot be deleted; deletes user from Clerk if configured; cascades and deletes PostgreSQL user record; logs to `AuditLog`.
- Modify: `apps/web/src/features/owner/pages/OwnerClientsPage.tsx`
  - Add "All Clients Directory" section below the pending approval queue.
  - Display full user info: Name, Email, Status Badge (`ACTIVE`, `SUSPENDED`, `PENDING_APPROVAL`, `REJECTED`), Date Joined.
  - Provide management controls: Suspend Access, Reactivate Access, and Delete Client (with confirmation dialog).
  - Add search and filter controls.
- Create / Update tests:
  - Add unit tests for `suspendUser` and `deleteUser` in `apps/api/src/users/users.controller.spec.ts`.
  - Update `apps/web/src/layouts/AppShell.test.tsx` and `apps/web/src/features/owner/pages/OwnerClientsPage.test.tsx`.

## 4 Contract status
- `GET /api/admin/users/clients`: Confirmed endpoint returning array of `{ id, name, email, status, createdAt, profile }`.
- `POST /api/admin/users/:userId/activate`: Confirmed endpoint activating client access.
- `POST /api/admin/users/:userId/suspend`: Proposed endpoint setting client status to `SUSPENDED`.
- `DELETE /api/admin/users/:userId`: Proposed endpoint removing client account from Clerk and database.
- `POST /api/auth/me`: Confirmed endpoint returning authenticated user profile and role.

## 5 Scope and acceptance
- Acceptance 1: When an approved client logs in or navigates to the portal, `AppShell` does not misidentify them as Stephen and does NOT redirect them to `/admin`. The client lands cleanly on `/overview` (or `/onboarding`).
- Acceptance 2: Stephen can view all registered and approved client accounts on `portal.oderindestephen.com/admin/clients` in a structured management directory table.
- Acceptance 3: For each client in the directory, Stephen can view their name, email, status badge (`ACTIVE` / `SUSPENDED`), and date joined.
- Acceptance 4: Stephen can click "Suspend Access" to immediately block a client from accessing the portal, and "Reactivate" to restore access.
- Acceptance 5: Stephen can click "Delete Client", review a confirmation warning dialog, and permanently remove the client account from both Clerk and the database. Self-deletion of the admin account is strictly forbidden and rejected.
- Acceptance 6: Both `@os-portal/web` and `@os-portal/api` build cleanly and pass all unit tests without errors.

## 6 Ordered steps
1. **AppShell Client Redirect Fix (`apps/web/src/layouts/AppShell.tsx`)**:
   - Change default props `userEmail` and `userName` to `''`.
   - Remove `currentUser.email.toLowerCase() === 'stephenoderinde@gmail.com'` check in `AppShell`'s `/api/auth/me` callback.
   - Verify that clients stay on `/overview` or `/onboarding` and are never routed to `/admin`.
2. **Admin Gateway Guard (`apps/web/src/routes/AppRoutes.tsx`)**:
   - Ensure `AdminGatewayRoute` verifies the user's role before mounting the admin dashboard.
3. **Backend API Endpoints (`apps/api/src/users/users.controller.ts` & `users.service.ts`)**:
   - Enhance `getClients()` in `users.service.ts` to return full metadata (`createdAt`, `profile`).
   - Implement `suspendUser(userId, actorId)`.
   - Implement `deleteUser(userId, actorId)` with Clerk API account removal and database cleanup.
   - Expose `POST admin/users/:userId/suspend` and `DELETE admin/users/:userId` in `users.controller.ts`.
4. **Admin Client Directory & Management UI (`apps/web/src/features/owner/pages/OwnerClientsPage.tsx`)**:
   - Fetch `getClients()` and render the "Client Directory & User Management" table alongside the Pending Approval Queue.
   - Add status badges, joined date, Suspend, Reactivate, and Delete actions with confirmation modals.
   - Add search and status filter tabs.
5. **Testing & Verification**:
   - Run `npm.cmd --prefix apps/api run test` and `apps/web run test`.
   - Run typecheck and builds for both workspaces.
6. **Deploy & Handoff**:
   - Commit and push to `origin/main`.
   - Verify deployment on Cloudflare Pages and Render.

## 7 Objections
1. Objection (Blocker): What if deleting a client causes database foreign key constraint violations if the client has existing project files, comments, or invoice records?
   - Resolution: Before deleting the `User` row in Prisma, `deleteUser` will clean up or detach related records (e.g. project memberships, notifications, push subscriptions, preferences, file comments, tickets). If invoices or files are bound to the client, the service will clean up non-financial data, soft-delete or anonymize their record if required by data retention (`D-8`), or delete cleanly if they are a newly approved client.
2. Objection (Serious): What if Stephen accidentally clicks "Delete" on his own Admin account or another client?
   - Resolution: The backend strictly prevents deleting any user with `role === 'Owner'` or email matching `stephenoderinde@gmail.com`, throwing a 400 Bad Request. In the frontend, the Delete button is disabled for admins, and clicking Delete triggers a confirmation modal asking Stephen to confirm the deletion of the specific client email.
3. Objection (Minor): What if Clerk is offline or the client does not exist in Clerk when Stephen deletes them?
   - Resolution: The Clerk deletion call is wrapped in a `try...catch` block. If Clerk returns a 404 ("user not found"), the backend logs a warning and proceeds with cleaning up the local database record so orphaned local accounts can still be deleted.

## 8 Verdict
READY FOR APPROVAL.

## 9 Approval
- Date: 2026-10-22
- Instruction: Stephen: "APPROVE"
- Scope: fix-client-redirect-and-admin-user-management

## 10 Execution log
1. Updated `apps/web/src/layouts/AppShell.tsx`:
   - Removed hardcoded default email (`stephenoderinde@gmail.com`) and default username.
   - Refactored `/api/auth/me` callback to verify admin role using backend verified role and email rather than stale/initial state closure.
   - Added checks ensuring `PENDING_APPROVAL` navigates to `/pending-approval`, `SUSPENDED`/`REJECTED` navigates to `/access-denied`, and approved clients stay on `/overview` / `/onboarding` without redirecting to `/admin`.
2. Updated `apps/web/src/routes/AppRoutes.tsx`:
   - Updated `AdminGatewayRoute` to check `fetchAuthenticatedUser`. If a client attempts to navigate to `/admin`, the admin console dashboard is not loaded, redirecting to the isolated admin login with client boundary guidance.
3. Updated `apps/api/src/users/users.service.ts`:
   - Enhanced `getClients()` to return `createdAt`, `dateJoined`, and `profile` data (companyName, phone, timezone).
   - Implemented `suspendUser(userId, actorId)` with automatic Clerk active session revocation and audit logging.
   - Implemented `deleteUser(userId, actorId)` with primary admin self-deletion protection, Clerk user deletion (`clerk.users.deleteUser`), cascade relation cleanup in PostgreSQL Prisma, and audit logging.
4. Updated `apps/api/src/users/users.controller.ts`:
   - Exposed `POST /api/admin/users/:userId/suspend` and `DELETE /api/admin/users/:userId`.
5. Updated `apps/web/src/features/owner/pages/OwnerClientsPage.tsx`:
   - Added statistics row: Total Clients, Active, Pending Review, Suspended.
   - Retained the Registration Approval Queue with "Activate Account" and "Reject".
   - Added "Managed Clients Directory" with client avatars, names, emails, company names, joined dates, and status badges.
   - Added search filter input (by client name, email, company).
   - Added status filter buttons (All, Active, Suspended).
   - Added action buttons: Suspend Access (if active), Reactivate (if suspended), and Delete.
   - Added a red-themed confirmation modal with warning details before permanently deleting a client.
6. Verification:
   - `@os-portal/api` unit tests: 14 test suites, 66 tests passed.
   - `@os-portal/api` build: `nest build` completed with code 0.
   - `@os-portal/web` unit tests: 16 test suites, 86 tests passed.
   - `@os-portal/web` build: `tsc -b && vite build` completed with code 0.

## 11 Deviations
None.

## 12 Memory changes
No memory additions needed; aligns with D-1, D-3, D-8, D-17, and P-1.

## 13 Stephen confirmation
Awaiting Stephen's confirmation on the live deployment.

## 14 Integration and handoff
- Clerk Admin API delete user endpoint (`clerkClient.users.deleteUser`).
- PostgreSQL Prisma client model cascade cleanup.
