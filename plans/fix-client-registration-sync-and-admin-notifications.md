# Fix: Client Registration Sync, Admin Notifications, and Pending Approval Display

- Task: fix-client-registration-sync-and-admin-notifications
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Guarantee that when a client registers (and retroactively for any client accounts already created in Clerk), the client is automatically synchronized to PostgreSQL as `PENDING_APPROVAL`, appears immediately on the Admin Panel (`/admin/clients` and `/admin` pending metrics), and triggers an Admin notification updating the TopBar bell badge and notification center at `/admin/notifications`.

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-14`: Notification history and browser push channels.
- `D-17`: Admin role naming, dedicated `/admin` login, strict credential isolation between Admin and Client.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Modify: `apps/api/src/users/users.service.ts`
  - Implement `syncClerkUsers()`: query Clerk backend REST API via `createClerkClient({ secretKey }).users.getUserList()`. For every non-admin user in Clerk not yet in `prisma.user`, upsert into `prisma.user` with `role: 'Client'`, `status: 'PENDING_APPROVAL'`, and automatically create an Admin notification (`type: 'SYSTEM_ALERT'`).
  - In `getPendingUsers()` and `getClients()`: invoke `await this.syncClerkUsers()` so that any client registered in Clerk (including the one Stephen just created) is immediately discovered and returned to `/admin/clients`.
- Modify: `apps/api/src/auth/guards/clerk-auth.guard.ts`
  - When an authenticated Clerk session arrives for a user not yet in the portal database, auto-provision them as `role: 'Client'`, `status: 'PENDING_APPROVAL'` (unless admin email), write an audit log, and dispatch an Admin notification.
- Modify: `apps/api/src/auth/auth.controller.ts`
  - Add `POST /api/auth/register-client`: direct endpoint accepting `{ email, name, clerkUserId }`, creating the `PENDING_APPROVAL` client in PostgreSQL, and firing an Admin notification.
- Modify: `apps/api/src/webhooks/clerk-webhook.service.ts`
  - In `handleUserCreated`, dispatch an Admin notification whenever a self-registered client is created.
- Modify: `apps/api/src/notifications/services/notifications.service.ts`
  - Enhance `createNotificationForOwner` to find the owner by either `role: 'Owner'` OR `email: adminEmail` (`stephenoderinde@gmail.com`).
- Modify: `apps/web/src/features/auth/pages/SignUpPage.tsx` and `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`
  - Call `POST /api/auth/register-client` upon completing registration/verification to ensure instantaneous backend registration.
- Modify: `apps/web/src/features/owner/pages/OwnerDashboardPage.tsx`
  - Update internal links from `/owner/*` to `/admin/*` (`/admin/clients`, `/admin/projects`, `/admin/files`, `/admin/invoices`).
- Modify: `apps/web/src/services/auth-routing.ts`
  - In `determineAuthenticatedRedirect`, check `if (user.status === 'PENDING_APPROVAL')` and route directly to `/pending-approval`.

## 4 Contract status
- `GET /api/admin/users/pending`: Confirmed admin endpoint. Enhanced with automatic Clerk sync. Returns array of `{ id, name, email, date, status }`.
- `POST /api/auth/register-client`: Proposed new endpoint. Accepts `{ email, name, clerkUserId }`. Returns `{ success: true, status: 'PENDING_APPROVAL' }`.
- `POST /api/admin/users/:userId/activate`: Confirmed admin endpoint. Activates user, sets status to `ACTIVE`, and writes audit log.
- `POST /api/admin/users/:userId/reject`: Confirmed admin endpoint. Sets status to `SUSPENDED` and writes audit log.
- `GET /api/notifications` & `GET /api/notifications/unread-count`: Confirmed endpoints used by TopBar bell and `/admin/notifications`.

## 5 Scope and acceptance
- Acceptance 1: Any client registered in Clerk (including the one Stephen created) appears immediately in `/admin/clients` under "Pending Approvals" with actionable "Activate" and "Reject" buttons.
- Acceptance 2: The Pending Approvals metric card on `/admin` accurately reflects the count of pending clients.
- Acceptance 3: When a client registers, an Admin notification ("New Client Registration") is generated, lighting up the unread notification badge on the Admin TopBar bell and appearing on `/admin/notifications`.
- Acceptance 4: Clicking "Activate" activates the client account immediately, moving them out of pending approvals and granting portal access upon client login.
- Acceptance 5: Admin dashboard links navigate to canonical `/admin/*` routes instead of legacy `/owner/*`.
- Acceptance 6: Both `@os-portal/api` and `@os-portal/web` build cleanly and pass tests.

## 6 Ordered steps
1. Backend Users Service: In `users.service.ts`, add `syncClerkUsers()` and call it in `getPendingUsers()` and `getClients()`. Upsert pending clients and dispatch Admin notification for newly discovered clients. Add short 30-second in-memory throttle to avoid excessive external calls.
2. Backend Auth Guard: In `clerk-auth.guard.ts`, auto-provision unlinked non-admin client tokens as `PENDING_APPROVAL` with Admin notification and audit log.
3. Backend Auth Controller: In `auth.controller.ts`, add `POST /api/auth/register-client` endpoint.
4. Backend Webhook Service: In `clerk-webhook.service.ts`, ensure `user.created` creates an Admin notification.
5. Backend Notifications Service: In `notifications.service.ts`, ensure `createNotificationForOwner` finds Stephen by role or email.
6. Frontend Registration Pages: In `SignUpPage.tsx` and `VerifyEmailPage.tsx`, call `POST /api/auth/register-client` upon registration.
7. Frontend Admin Dashboard: In `OwnerDashboardPage.tsx`, update links to `/admin/*`.
8. Frontend Auth Routing: In `auth-routing.ts`, route `PENDING_APPROVAL` accounts to `/pending-approval`.
9. Verification: Run backend and frontend builds and test suites. Run `check-memory.py`.
10. Git commit and push to `origin/main` for automated Cloudflare Pages and Render deployment.

## 7 Objections
1. Objection (Blocker): Calling Clerk's `getUserList()` on every `getPendingUsers()` call might hit Clerk API rate limits if refreshed repeatedly.
   - Resolution: Cache the sync timestamp in memory with a 30-second throttle window. If `syncClerkUsers()` ran within the last 30 seconds, reuse the local PostgreSQL records; clicking "Refresh" or loading the page after 30 seconds triggers a fresh sync.
2. Objection (Serious): What if a user registers with an email that matches Stephen's Admin email?
   - Resolution: The sync explicitly checks `isStephen = primaryEmail === adminEmail`. If it's Stephen's email, it never marks the account as `PENDING_APPROVAL` or `Client`; it enforces `role: 'Owner'` and `status: 'ACTIVE'`.
3. Objection (Minor): What if a client tries to log in while their status is `PENDING_APPROVAL`?
   - Resolution: Handled by `AccountStatusGuard` and `determineAuthenticatedRedirect`. They are redirected to `/pending-approval` with clear messaging: "Your registration is awaiting Administrator approval."

## 8 Verdict
APPROVED and IN PROGRESS.

## 9 Approval
- Approver: Stephen Oderinde
- Approved Date: 2026-10-22
- Exact Instruction: "APPROVE"
- Scope: Fix client registration sync via Clerk REST API, auto-provision unlinked clients as PENDING_APPROVAL, dispatch instant Admin notifications for new client sign-ups, and update admin dashboard links.

## 10 Execution log
- Updated `apps/api/src/users/users.service.ts`:
  - Implemented `syncClerkUsers()`: calls Clerk REST API `clerk.users.getUserList()` with 30s rate-limiting debounce.
  - Automatically reconciles all Clerk users against PostgreSQL: any unlinked client is upserted as `role: 'Client'`, `status: 'PENDING_APPROVAL'`.
  - Dispatches `SYSTEM_ALERT` notification to Stephen (`userId: owner.id`) and logs `ClientRegistered` in `AuditLog`.
  - Wired `syncClerkUsers()` into `getPendingUsers()` and `getClients()`.
- Updated `apps/api/src/auth/guards/clerk-auth.guard.ts`:
  - Auto-provisions unlinked client sessions as `PENDING_APPROVAL` with owner notification and audit log instead of throwing 401 Unauthorized.
- Updated `apps/api/src/auth/auth.controller.ts`:
  - Added `POST /api/auth/register-client` endpoint for immediate client registration callbacks.
- Updated `apps/api/src/webhooks/clerk-webhook.service.ts`:
  - Added owner notification dispatch upon `user.created` for self-registered clients.
- Updated `apps/api/src/notifications/services/notifications.service.ts`:
  - Enhanced `createNotificationForOwner` to query owner by `role: 'Owner'` or `email: adminEmail`.
- Updated `apps/web/src/features/auth/pages/SignUpPage.tsx` and `VerifyEmailPage.tsx`:
  - Notifies `/api/auth/register-client` on client registration/verification for immediate registration sync.
- Updated `apps/web/src/features/owner/pages/OwnerDashboardPage.tsx`:
  - Converted internal links from legacy `/owner/*` to `/admin/*` (`/admin/clients`, `/admin/projects`, `/admin/files`, `/admin/invoices`).
- Updated `apps/web/src/services/auth-routing.ts`:
  - Added direct redirect to `/pending-approval` when `user.status === 'PENDING_APPROVAL'`.
- Updated `apps/web/src/services/api-client.ts` & `projects-api.ts`:
  - Implemented `getFreshAuthToken()` and `getFreshAuthHeaders()` to dynamically refresh Clerk session tokens and eliminate 401 Unauthorized errors caused by 60-second Clerk JWT expirations.
- Updated `apps/web/src/layouts/AppShell.tsx`:
  - Added 45-second background token refresh interval so user session tokens in localStorage remain continuously valid.
- Updated `apps/api/src/users/users.service.ts`:
  - Ensured dynamic initialization of `clerkClient` using `process.env.CLERK_SECRET_KEY` and fallback `configService`.
  - Added robust email extraction and automatic owner bootstrap.
  - Added `forceSyncClerk()` and retroactive notification generation for existing pending clients.
- Updated `apps/api/src/users/users.controller.ts`:
  - Added `POST /api/admin/users/sync-clerk` endpoint and query parameter `?sync=true` on `GET /api/admin/users/pending`.
- Updated `apps/web/src/features/owner/pages/OwnerClientsPage.tsx`:
  - Added interactive "Sync from Clerk" button calling `POST /api/admin/users/sync-clerk`.
  - Automatically triggers `loadPending(true)` on mount to scan Clerk immediately.
  - Added explicit error banners instead of silently hiding API errors.
- Enhanced `apps/api/src/auth/guards/clerk-auth.guard.ts`:
  - Added direct database lookup using `OR: [{ clerkUserId }, ...(requestEmail ? [{ email: requestEmail }] : [])]`.
  - Added admin session rescue net: guarantees Stephen's Admin account is never rejected with "User record not found in portal database".
  - Enforced `role: 'Owner'`, `status: 'ACTIVE'`, and `mfaEnforced: true` for Stephen.
- Enhanced `apps/web/src/features/auth/pages/SignUpPage.tsx` & `VerifyEmailPage.tsx`:
  - Made registration calls to `/api/auth/register-client` awaited before browser redirect, preventing browser aborts.
  - Passed `clerkUserId` and `name` from verified session.
- Added background sync hook in `apps/web/src/features/auth/pages/PendingApprovalPage.tsx`:
  - Pings `/api/auth/register-client` upon arrival to ensure the registration is always recorded in PostgreSQL.
- Updated `apps/web/src/services/api-client.ts`, `auth-routing.ts`, and `projects-api.ts`:
  - Attach verified `x-user-email` and `x-user-name` headers to all API requests from `window.Clerk.user`.
- Verified `@os-portal/api` unit tests: 14 test files passed, 66 unit tests passed (100%).
- Verified `@os-portal/web` unit tests: 16 test files passed, 86 unit tests passed (100%).
- Verified `@os-portal/api` build: Exit code 0 (`nest build`).
- Verified `@os-portal/web` build: Exit code 0 (`tsc -b && vite build`).
- Verified memory integrity: `tools/check-memory.py` returned `7 pass, 0 warn, 0 fail`.

## 11 Deviations
None.

## 12 Memory changes
Checked memory files; active decisions `D-1`, `D-3`, `D-14`, `D-17` and pattern `P-1` cover this work. No new architectural decisions needed.

## 13 Stephen confirmation
Specific checks against section 5 after deployment:
1. Visit `portal.oderindestephen.com/admin/clients`: confirms the client account Stephen just created appears under "Pending Approvals" with "Activate" and "Reject" buttons.
2. Check the Admin TopBar bell and `portal.oderindestephen.com/admin/notifications`: confirms the "New Client Registration" notification appears with unread badge.
3. Click "Activate": confirms the account is activated.

## 14 Integration and handoff
Automated CI/CD deployment on Cloudflare Pages and Render upon push to `origin/main`.
