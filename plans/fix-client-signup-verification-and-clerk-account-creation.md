# Fix: Client Sign-Up Verification and Clerk Account Creation

- Task: fix-client-signup-verification-and-clerk-account-creation
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Implement an integrated in-component 2-step verification flow on `/sign-up` and fix `/verify-email` error handling so that client accounts and passwords are fully verified and created in Clerk before moving to approval, enabling approved clients to log in successfully without Clerk reporting "Couldn't find your account."

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-17`: Admin role naming, dedicated `/admin` login, strict credential isolation between Admin and Client.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Modify: `apps/web/src/features/auth/pages/SignUpPage.tsx`
  - Convert into an integrated 2-step registration:
    - Step 1 (Registration Details): Full Name, Email, Password. Calls `clerk.client.signUp.create()`.
    - Step 2 (In-Page Email Verification): Retains in-memory Clerk `signUp` instance without page navigation or state loss. Renders 6-digit code input and countdown timer.
    - Upon submitting the code, calls `clerk.client.signUp.attemptEmailAddressVerification({ code })`.
    - If code is invalid/expired: displays real Clerk error and keeps user on the verification step.
    - If code is valid (`status === 'complete'`): activates session with `clerk.setActive({ session: completeSignUp.createdSessionId })`, retrieves verified `clerkUserId`, syncs to backend `POST /api/auth/register-client`, and navigates to the appropriate screen (`/overview` if already active, `/pending-approval` if pending).
- Modify: `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`
  - Fix fallback verification page: prevent silent redirection to `/pending-approval` when `attemptEmailAddressVerification` fails or when `clerk.client.signUp` is missing.
  - Display actual error messages and allow re-entering code or resending.
- Modify: `apps/api/src/users/users.service.ts`
  - In `activateUser(userId)`: if user has a placeholder `clerkUserId`, query Clerk REST API by email address to link real `clerkUserId` when activating.

## 4 Contract status
- `clerk.client.signUp.create()`: Confirmed Clerk SDK interface.
- `clerk.client.signUp.attemptEmailAddressVerification({ code })`: Confirmed Clerk SDK interface.
- `POST /api/auth/register-client`: Confirmed backend endpoint accepting `{ email, name, clerkUserId }`.
- `POST /api/admin/users/:userId/activate`: Confirmed backend endpoint for activating clients.

## 5 Scope and acceptance
- Acceptance 1: Signing up on `/sign-up` seamlessly displays the 6-digit code verification step without a full page reload or lost Clerk state.
- Acceptance 2: Submitting an invalid verification code displays an error message on screen and does not prematurely redirect to `/pending-approval`.
- Acceptance 3: Submitting the valid 6-digit verification code creates and finalizes the user record in Clerk, activates the Clerk session, records the real `clerkUserId` in PostgreSQL, and dispatches the Admin notification.
- Acceptance 4: Once activated by the Admin, the client can log in on `portal.oderindestephen.com/sign-in` using their email and password without seeing "Couldn't find your account."
- Acceptance 5: Both `@os-portal/web` and `@os-portal/api` build cleanly and pass all unit tests.

## 6 Ordered steps
1. Update `apps/web/src/features/auth/pages/SignUpPage.tsx`: Implement in-component 2-step verification keeping the live Clerk `signUp` instance in memory.
2. Update `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`: Remove swallowed error catch block; prevent redirect on verification failure.
3. Update `apps/api/src/users/users.service.ts`: In `activateUser`, reconcile `clerkUserId` via Clerk API if user exists in Clerk.
4. Run full test suites (`apps/web` and `apps/api`) and builds.
5. Check memory constraints with `check-memory.py`.
6. Commit and push to `origin/main` for automated Cloudflare and Render deployment.

## 7 Objections
1. Objection (Blocker): If the user does not verify their email code, their account does not exist in Clerk, making it impossible to log in on `/sign-in`.
   - Resolution: Keep the verification code input directly on the registration page with clear instructions. Do not permit registration completion or redirect to `/pending-approval` until `attemptEmailAddressVerification` returns `status === 'complete'`.
2. Objection (Serious): What if a user enters the wrong 6-digit code?
   - Resolution: Capture the error from Clerk (`clerkErr.errors[0].message`), display it in a red alert banner above the code field, and allow the user to re-enter the code or click "Resend code".
3. Objection (Minor): What if a client was already approved in PostgreSQL before their Clerk account was finalized?
   - Resolution: When they complete sign-up with their email, `register-client` matches the existing PostgreSQL user row, updates `clerkUserId`, and preserves their `ACTIVE` status, letting them proceed directly to their workspace.

## 8 Verdict
APPROVED and IN PROGRESS.

## 9 Approval
- Approver: Stephen Oderinde
- Approved Date: 2026-10-22
- Exact Instruction: "APPROVE"
- Scope: Fix client sign-up email verification flow to ensure user account and password are created in Clerk, preventing "Couldn't find your account" login error.

## 10 Execution log
- Updated `apps/web/src/features/auth/pages/SignUpPage.tsx`:
  - Implemented an integrated 2-step registration with in-component email verification.
  - Step 1 collects registration details and initializes `clerk.client.signUp.create()`.
  - Step 2 renders the 6-digit verification code input directly on the registration card without a page reload, preserving the active Clerk `signUp` instance in memory.
  - Verification submission calls `clerk.client.signUp.attemptEmailAddressVerification({ code })`, captures errors gracefully, and prevents premature redirection.
  - Upon successful verification (`status === 'complete'`), sets active Clerk session, retrieves verified `clerkUserId`, syncs to backend `POST /api/auth/register-client`, and navigates to the target workspace.
- Updated `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`:
  - Hardened fallback verification page: checks for active Clerk `signUp` instance and displays user-friendly guidance if missing.
  - Removed swallowed try/catch block so invalid or expired codes display actual error messages without silently redirecting to `/pending-approval`.
- Updated `apps/api/src/users/users.service.ts`:
  - In `activateUser(userId)`, added Clerk API reconciliation to link the verified Clerk user ID if the client account was activated.
- Verified `@os-portal/api` unit tests: 14 test files passed, 66 tests passed (100%).
- Verified `@os-portal/web` unit tests: 16 test files passed, 86 tests passed (100%).
- Verified `@os-portal/api` build: Exit code 0 (`nest build`).
- Verified `@os-portal/web` build: Exit code 0 (`tsc -b && vite build`).
- Verified memory integrity: `py -3 tools/check-memory.py` returned 7 pass, 0 warn, 0 fail.

## 11 Deviations
None.

## 12 Memory changes
None needed.

## 13 Stephen confirmation
Awaiting completion.

## 14 Integration and handoff
Automated Cloudflare Pages and Render deployment on push to `origin/main`.
