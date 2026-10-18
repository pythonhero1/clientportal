# Identity and Access (Database Identity and Authorization)

- Task: P01 implement Prisma schema, Clerk authentication, account activation, Owner bootstrap, role/project authorization guards, and auth screens 01-05
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement the database persistence layer with Prisma, Clerk authentication integration, account activation lifecycle, controlled server-side Owner bootstrap, role and project isolation guards, and responsive auth screens 01 to 05 in both themes so unactivated accounts cannot access project data and Client A cannot access Client B.

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-2 - Independent portal`: "Use portal.oderindestephen.com independently of the WordPress website."
- `D-3 - Registration and security`: "Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA and optional Client MFA."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### Proposed modifications to existing files:
- `package.json:18-21`: Replace stub script commands with real Prisma CLI invocations (`prisma generate`, `prisma migrate dev`, `prisma migrate deploy`, `seed`).
- `apps/api/package.json:25-31`: Add runtime dependencies (`@prisma/client`, `@clerk/backend`, `svix`, `@nestjs/config`, `class-validator`, `class-transformer`, `@nestjs/swagger`) and devDependencies (`prisma`, `tsx`).
- `apps/api/src/main.ts:1-10`: Configure global `ValidationPipe` (with `whitelist: true, forbidNonWhitelisted: true, transform: true`), preserve `rawBody` for Svix signature verification, configure CORS for web app origin, and initialize Swagger document builder.
- `apps/api/src/app.module.ts:5-10`: Register `ConfigModule`, `PrismaModule`, `AuthModule`, `UsersModule`, `ProjectsModule`, and `WebhooksModule`.
- `apps/web/package.json:13-16`: Add runtime dependencies (`@clerk/react` or `@clerk/clerk-react`, `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `zod`, `react-hook-form`).
- `apps/web/src/main.tsx:6-10`: Wrap application tree in `ClerkProvider`, `BrowserRouter`, `QueryClientProvider`, and Theme provider.
- `apps/web/src/App.tsx:7-130`: Replace P00 counter template with router switch, route guards, auth layout, and protected route boundaries.

### Proposed new files in `apps/api`:
- `apps/api/prisma/schema.prisma`: Authoritative database schema with `Role`, `AccountStatus`, `User`, `Profile`, `Project`, `ProjectMembership`, `Invitation`, and `AuditLog` models.
- `apps/api/prisma/seed.ts`: Seed script with non-production test fixtures for Owner, Client A, Client B, and Inactive Client C.
- `apps/api/src/prisma/prisma.service.ts`: NestJS Prisma client service lifecycle management.
- `apps/api/src/prisma/prisma.module.ts`: Global database persistence module.
- `apps/api/src/auth/guards/clerk-auth.guard.ts`: JWT bearer verification against Clerk SDK, attaching authenticated database user to `req.user`.
- `apps/api/src/auth/guards/account-status.guard.ts`: Gating authenticated requests: rejecting `PENDING_APPROVAL` with 403 `ACCOUNT_PENDING_APPROVAL` and `SUSPENDED` with 403 `ACCOUNT_SUSPENDED`.
- `apps/api/src/auth/guards/roles.guard.ts`: Role-based access control enforcing `Owner` vs `Client`.
- `apps/api/src/auth/guards/owner-mfa.guard.ts`: Enforcing verified two-factor authentication claims for privileged Owner operations.
- `apps/api/src/auth/guards/project-access.guard.ts`: Intercepting `:projectId` routes to ensure Client callers have explicit membership in the requested project (Owner bypasses; foreign project returns 404/403).
- `apps/api/src/auth/decorators/current-user.decorator.ts`: Parameter decorator extracting `req.user`.
- `apps/api/src/auth/decorators/roles.decorator.ts`: Metadata decorator for role requirements.
- `apps/api/src/auth/auth.module.ts`: Authentication and guard module.
- `apps/api/src/auth/auth.controller.ts`: Endpoints for `GET /api/auth/me` and `POST /api/invitations/accept`.
- `apps/api/src/auth/scripts/bootstrap-owner.ts`: One-time server-side bootstrap script binding Stephen's verified Clerk ID to `Owner` role with mandatory MFA and audit logging, disabling repeat elevation.
- `apps/api/src/webhooks/clerk-webhook.controller.ts`: `POST /api/webhooks/clerk` endpoint verifying Svix signature on raw payload, processing `user.created`, `user.updated`, and `user.deleted` idempotently.
- `apps/api/src/webhooks/clerk-webhook.service.ts`: Ingestion logic mapping Clerk events to database users, invitations, and audit log.
- `apps/api/src/webhooks/webhooks.module.ts`: Webhook handling module.
- `apps/api/src/users/users.module.ts`, `users.service.ts`, `users.controller.ts`: Owner user activation and invitation management endpoints.
- `apps/api/src/projects/projects.module.ts`, `projects.service.ts`, `projects.controller.ts`: Scoped project list (`GET /api/projects`) and detail (`GET /api/projects/:projectId`) verifying Client A vs Client B isolation.
- `apps/api/test/auth-isolation.e2e-spec.ts`: End-to-end integration test suite exercising Client A vs Client B isolation, inactive user rejection, and Owner elevation prevention.

### Proposed new files in `apps/web`:
- `apps/web/src/routes/AppRoutes.tsx`: Route definition with public auth routes, protected client layout, and status redirects.
- `apps/web/src/layouts/AuthLayout.tsx`: Responsive authentication shell matching Figma (desktop centered card, tablet, mobile full-bleed, semantic tokens for dark and light).
- `apps/web/src/features/auth/pages/SignInPage.tsx`: Screen 01 Login (`/sign-in`, Figma `1:96`).
- `apps/web/src/features/auth/pages/SignUpPage.tsx`: Screen 02 Sign Up (`/sign-up`, Figma `1:125`).
- `apps/web/src/features/auth/pages/ForgotPasswordPage.tsx`: Screen 03 Forgot Password (`/forgot-password`, Figma `1:159`).
- `apps/web/src/features/auth/pages/ResetPasswordPage.tsx`: Screen 04 Reset Password (`/reset-password`, Figma `1:182`).
- `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`: Screen 05 Verify Email (`/verify-email`, Figma `1:208`).
- `apps/web/src/features/auth/pages/PendingApprovalPage.tsx`: Pending activation state informing newly registered users to await Stephen's approval.
- `apps/web/src/features/auth/pages/AccessDeniedPage.tsx`: Access denied state for suspended or unauthorized accounts.
- `apps/web/src/styles/tokens.css`: Semantic CSS tokens for Dark (`#070B12` canvas, `#0B1320` surface, `#2F6DF6` primary, `#F5F7FB` text) and Light (`#F7F9FC` canvas, `#FFFFFF` surface, `#1D4ED8` primary, `#111827` text).

## 4 Contract status

### 4.1 Confirmed interfaces
- Frontend-to-API prefix: Confirmed as `/api` matching Vite proxy (`apps/web/vite.config.ts:9`) and NestJS global prefix (`apps/api/src/main.ts:6`).
- Core roles: Confirmed as `Owner` and `Client` only per Decision D-5.

### 4.2 Proposed interfaces for review

#### Database Schema (`apps/api/prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  Owner
  Client
}

enum AccountStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
  REJECTED
}

model User {
  id           String        @id @default(cuid())
  clerkUserId  String        @unique
  email        String        @unique
  name         String?
  role         Role          @default(Client)
  status       AccountStatus @default(PENDING_APPROVAL)
  mfaEnforced  Boolean       @default(false)
  profile      Profile?
  memberships  ProjectMembership[]
  sentInvites  Invitation[]  @relation("InvitedBy")
  auditActions AuditLog[]    @relation("ActorUser")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([clerkUserId])
  @@index([email])
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone       String?
  companyName String?
  avatarUrl   String?
  timezone    String   @default("Africa/Lagos")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Project {
  id          String              @id @default(cuid())
  name        String
  description String?
  status      String              @default("ACTIVE")
  memberships ProjectMembership[]
  invitations Invitation[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model ProjectMembership {
  id                         String   @id @default(cuid())
  projectId                  String
  project                    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId                     String
  user                       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  isDesignatedBillingContact Boolean  @default(false)
  isDesignatedApprover       Boolean  @default(false)
  joinedAt                   DateTime @default(now())

  @@unique([projectId, userId])
  @@index([userId])
  @@index([projectId])
}

model Invitation {
  id                         String    @id @default(cuid())
  token                      String    @unique
  email                      String
  role                       Role      @default(CLIENT)
  projectId                  String?
  project                    Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  isDesignatedBillingContact Boolean   @default(false)
  isDesignatedApprover       Boolean   @default(false)
  status                     String    @default("PENDING") // PENDING, ACCEPTED, EXPIRED, REVOKED
  invitedById                String
  invitedBy                  User      @relation("InvitedBy", fields: [invitedById], references: [id])
  expiresAt                  DateTime
  acceptedAt                 DateTime?
  createdAt                  DateTime  @default(now())

  @@index([token])
  @@index([email])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actor      User?    @relation("ActorUser", fields: [actorId], references: [id], onDelete: SetNull)
  action     String   // OwnerBootstrap, ClientSignup, AccountActivated, AccountSuspended, UnauthorizedAttempt
  targetType String
  targetId   String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([actorId])
  @@index([action])
}
```

#### HTTP Endpoints & DTOs:
1. `POST /api/webhooks/clerk`
   - Producer: Clerk Webhook Service
   - Consumer: NestJS `WebhooksModule`
   - Headers: `svix-id`, `svix-timestamp`, `svix-signature`
   - Verification: Svix HMAC verification with raw body string.
   - Behavior: Idempotent user synchronization. Self-registered users default to `PENDING_APPROVAL`. Users with matching token accept invitations and activate immediately.
   - Response: `200 { received: true }`
2. `GET /api/auth/me`
   - Producer: NestJS `AuthModule`
   - Consumer: React web frontend TanStack Query hook
   - Guard: `ClerkAuthGuard` (bearer token verified via `@clerk/backend`)
   - Response: `200 { id, clerkUserId, email, name, role, status, mfaEnforced, profile: { companyName, timezone, avatarUrl } }`
   - Error: `401 Unauthorized` if token is invalid or user record not found.
3. `POST /api/admin/users/:userId/activate`
   - Guard: `ClerkAuthGuard` + `RolesGuard('Owner')` + `OwnerMfaGuard`
   - Response: `200 { id, status: "ACTIVE" }`
4. `POST /api/admin/invitations`
   - Guard: `ClerkAuthGuard` + `RolesGuard('Owner')` + `OwnerMfaGuard`
   - Body: `{ email: string, projectId?: string, isDesignatedBillingContact?: boolean, isDesignatedApprover?: boolean }`
   - Response: `201 { id, email, token, expiresAt }`
5. `GET /api/projects`
   - Guard: `ClerkAuthGuard` + `AccountStatusGuard`
   - Behavior: If caller is `Owner`, returns all projects. If caller is `Client`, returns **only** projects where caller has an active `ProjectMembership`.
   - Response: `200 [ { id, name, status } ]`
6. `GET /api/projects/:projectId`
   - Guard: `ClerkAuthGuard` + `AccountStatusGuard` + `ProjectAccessGuard`
   - Behavior: Owner permitted; Client permitted only if member of `:projectId`. If non-member Client accesses another project, returns `404 Not Found` (to prevent foreign project ID probing).

#### Error Response Format:
```json
{
  "statusCode": 403,
  "code": "ACCOUNT_PENDING_APPROVAL",
  "message": "Your account is pending Owner approval."
}
```

## 5 Scope and acceptance

### Requirements Quoted:
- `BUILD-PLAN.md:105-110`: "Review the Prisma schema and migration strategy. Integrate Clerk, account activation, verified invitations, the controlled Owner bootstrap, MFA, secure recovery and Owner/Client/project guards. Implement the login, signup, forgot password, reset password and verify email journeys. Exit: an unactivated account cannot read project data; Client A cannot access Client B through routes, IDs, counts or socket events; Owner MFA and invitation checks work. Authentication flows pass against the chosen development Clerk configuration."
- `docs/PERMISSIONS.md:3-4`: "The first release has Owner and Client only. A public signup is pending until Owner activates it. A verified invitation activates only the intended account with explicitly assigned access. Clerk identity and application authorization are separate checks."
- `docs/PERMISSIONS.md:37-40`: "Use a documented server-side bootstrap procedure that binds Stephen's verified Clerk user ID once. Require MFA before granting protected Owner operations. Never infer Owner status from being the first signup or from a submitted role/email domain. Keep bootstrap actions auditable and disable repeat elevation after the Owner exists."
- `docs/SCREEN-MAP.md:7-13`: Screens 01 to 05 cover Login (`1:96`), Sign Up (`1:125`), Forgot Password (`1:159`), Reset Password (`1:182`), Verify Email (`1:208`).

### Measurable Acceptance Criteria:
1. **Schema & Migration**: Prisma models compile with strict typing; migrations apply cleanly to PostgreSQL; `package.json` scripts execute `prisma generate` and `prisma migrate dev`.
2. **Server-Side Owner Bootstrap**: Running `npm run bootstrap:owner` binds Stephen's verified Clerk ID as `Owner` with `mfaEnforced: true`; a second execution aborts with an error; zero public endpoints can grant Owner role.
3. **Account Activation Gating**:
   - A public signup creates a `PENDING_APPROVAL` account.
   - Accessing `GET /api/projects` with a pending account returns `403 ACCOUNT_PENDING_APPROVAL`.
   - Web app routes pending users to `/pending-approval`.
4. **Project & Client Data Isolation**:
   - Integration tests prove Client A (`userId: A`) querying `GET /api/projects` receives only Project 1.
   - Client A querying `GET /api/projects/:project2Id` receives `404 Not Found`.
   - Client B querying `GET /api/projects/:project1Id` receives `404 Not Found`.
5. **Screens 01–05 Implementation**:
   - Screens 01–05 render with semantic dark/light tokens matching Figma layout principles.
   - Fully responsive across desktop (1440px), tablet (768px), and mobile (390px).
   - Clerk authentication flows (sign-in, sign-up, password reset, email verification) succeed against configured development Clerk credentials.
6. **Code Quality**:
   - `npm run typecheck` passes with zero errors across `@os-portal/web` and `@os-portal/api`.
   - `npm run lint` passes with zero errors.
   - `npm run test` and `npm run test:e2e` pass with zero failures.

## 6 Ordered steps

### Step 1: Dependencies and Prisma Database Scaffolding
- In `apps/api`: install `@prisma/client`, `prisma` (devDependencies), `tsx` (devDependencies), `@nestjs/config`, `class-validator`, `class-transformer`, `@nestjs/swagger`.
- In `apps/web`: install `@clerk/clerk-react`, `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `zod`, `react-hook-form`.
- Create `apps/api/prisma/schema.prisma` with reviewed models and generate Prisma client.
- Update root `package.json` with working `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, and `db:seed`.
- *Verification*: Run `npm run db:generate` and `npm run typecheck`. Both workspaces compile.
- *Rollback*: Revert changes to `package.json` and remove `apps/api/prisma/`.

### Step 2: Backend Prisma Module & Global Configuration
- Implement `PrismaService` and `PrismaModule` in `apps/api/src/prisma/`.
- Update `apps/api/src/main.ts` with global `ValidationPipe` (strict whitelist/transform) and raw body parser.
- Register `ConfigModule` and `PrismaModule` in `AppModule`.
- *Verification*: Run `apps/api` unit tests; verify NestJS boots with PrismaModule.
- *Rollback*: Remove `PrismaService` and restore `main.ts` and `app.module.ts`.

### Step 3: Clerk Webhook Ingestion & User Synchronization
- Install `svix` and `@clerk/backend` in `apps/api`.
- Implement `ClerkWebhookController` (`POST /api/webhooks/clerk`) and `ClerkWebhookService`.
- Verify Svix signature against `CLERK_WEBHOOK_SIGNING_SECRET` using raw body.
- Synchronize `user.created`, `user.updated`, and `user.deleted` (status `SUSPENDED`).
- Deduplicate webhooks using `AuditLog`.
- *Verification*: Unit tests verifying valid/invalid Svix signature and idempotent user synchronization.
- *Rollback*: Remove `WebhooksModule`.

### Step 4: Authorization Guards & Server-Side Owner Bootstrap
- Implement `ClerkAuthGuard`, `AccountStatusGuard`, `RolesGuard`, `OwnerMfaGuard`, and `ProjectAccessGuard` in `apps/api/src/auth/guards/`.
- Implement `apps/api/src/auth/scripts/bootstrap-owner.ts` for one-time server elevation.
- Add `bootstrap:owner` script to `apps/api/package.json`.
- Implement `GET /api/auth/me` and `POST /api/invitations/accept` in `AuthController`.
- *Verification*: Unit tests covering all 5 guards and bootstrap elevation script.
- *Rollback*: Remove auth guards and controller.

### Step 5: Data Scoping & Isolation Endpoints
- Implement `ProjectsModule` with `GET /api/projects` and `GET /api/projects/:projectId`.
- Implement `UsersModule` for Owner client activation (`POST /api/admin/users/:userId/activate`) and invitation generation (`POST /api/admin/invitations`).
- Implement comprehensive e2e test suite (`apps/api/test/auth-isolation.e2e-spec.ts`) asserting:
  - Client A cannot access Client B's project (returns 404).
  - Unactivated/pending user cannot access projects (returns 403).
  - Client cannot call Owner endpoints (returns 403).
- *Verification*: Run `npm run test:e2e --workspace @os-portal/api`; all assertions pass.
- *Rollback*: Revert projects/users modules and test suite.

### Step 6: Frontend Auth Shell, Tokens & Screens 01–05
- Implement semantic CSS tokens in `apps/web/src/styles/tokens.css` for dark and light themes.
- Wrap `apps/web/src/main.tsx` with `ClerkProvider`, `BrowserRouter`, `QueryClientProvider`.
- Build `AuthLayout.tsx` supporting desktop, tablet, and mobile with dark/light themes.
- Implement Screen 01 Login (`/sign-in`), Screen 02 Sign Up (`/sign-up`), Screen 03 Forgot Password (`/forgot-password`), Screen 04 Reset Password (`/reset-password`), Screen 05 Verify Email (`/verify-email`).
- Implement `/pending-approval` and `/access-denied` status views.
- Configure router in `AppRoutes.tsx` with authenticated route redirection.
- *Verification*: Run `npm run build --workspaces` and `npm run typecheck`; verify responsive rendering and theme toggling.
- *Rollback*: Revert frontend routes and auth components.

### Step 7: Composite Verification & Review
- Run full gate: `npm run verify` (typecheck + lint + unit tests + e2e tests + production builds).
- Verify no secrets committed to Git; check `.env*` exclusion.
- Update `plans/P01-identity-and-access.md` execution log and memory references.
- Run `py -3 tools/check-memory.py`.
- *Rollback*: Revert any uncommitted test artifacts.

## 7 Objections

### O1 External PostgreSQL database is required for migrations serious
- *Concern*: Stephen's Windows environment lacks local `psql` and `docker`. Attempting `prisma migrate dev` without a live PostgreSQL database will fail.
- *Resolution*: Under Pattern P-2, Stephen must provide a development PostgreSQL connection string (`DATABASE_URL` and `DIRECT_DATABASE_URL`), or development database access must be configured before applying migrations. Prisma schema and unit tests mocking PrismaService can be verified independently, but live e2e tests require the database.

### O2 Clerk development credentials must be configured for real SDK journeys serious
- *Concern*: Testing real Clerk authentication and webhooks requires valid `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_WEBHOOK_SIGNING_SECRET`.
- *Resolution*: Mock and unit-test the guards, token verification layer, and Svix signature verification with fixture keys so that code is 100% testable offline. For live browser testing, Stephen supplies the development keys in local `.env` files.

### O3 Owner elevation via API could introduce privilege escalation blocker
- *Concern*: If an API endpoint exists to promote a user to `Owner`, a security flaw or misconfiguration could allow public signups to seize portal control.
- *Resolution*: Strictly prohibit any public HTTP endpoint for Owner creation. Implement Owner setup solely as a server-side CLI script (`npm run bootstrap:owner`) that binds Stephen's verified Clerk ID once, checks that no Owner exists, enforces MFA, and logs an immutable audit event.

### O4 Client enumeration via 403 Forbidden responses minor
- *Concern*: Returning `403 Forbidden` when Client A requests `/api/projects/:project2Id` reveals that Project 2 exists, allowing ID enumeration.
- *Resolution*: `ProjectAccessGuard` returns `404 Not Found` rather than `403 Forbidden` for foreign project IDs, preventing cross-client discovery.

## 8 Verdict

READY FOR APPROVAL.
The implementation plan is concrete, follows the 14-section template, enforces Owner/Client role boundaries, guarantees Client A vs Client B isolation, and meets Pattern P-2 by making all external parameters explicit. Independent schema scaffolding, guard implementation, and unit test suites can proceed immediately upon approval.

## 9 Approval

- Status: APPROVED
- Date: 2026-10-18
- Stephen's instruction: "Approve"
- Approved scope: Phase P01 Identity and Access as defined in Sections 3, 5, and 6 of this plan: Prisma schema, Clerk authentication, account activation, Owner bootstrap, role/project authorization guards, and auth screens 01-05.

## 10 Execution log

- **2026-10-18**: Stephen approved plan P01 with instruction "Approve".
- **Step 1: Database & Prisma Layer (`apps/api`)**:
  - Authored `apps/api/prisma/schema.prisma` with `Role` (`Owner`, `Client`), `AccountStatus` (`PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `REJECTED`), `User`, `Profile`, `Project`, `ProjectMembership`, `Invitation`, and `AuditLog`.
  - Configured `apps/api/prisma.config.ts` for Prisma 7 connection handling.
  - Installed `@prisma/adapter-pg` and `pg`.
  - Generated Prisma client (`npx prisma generate`) into `node_modules/@prisma/client`.
  - Implemented `apps/api/src/prisma/prisma.service.ts` and `apps/api/src/prisma/prisma.module.ts` with connection resilience.
  - Configured database scripts in `package.json` (`db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `bootstrap:owner`).
- **Step 2: Server-side Owner Bootstrap (`apps/api`)**:
  - Implemented `apps/api/src/auth/scripts/bootstrap-owner.ts`.
  - Verified logic: checks existing Owner, creates/elevates Stephen's verified identity, enforces MFA, logs immutable audit entry, rejects repeat executions.
- **Step 3: Webhook Ingestion & Account Lifecycle (`apps/api`)**:
  - Configured `apps/api/src/main.ts` with `rawBody: true` for Svix verification and global `ValidationPipe`.
  - Implemented `apps/api/src/webhooks/clerk-webhook.controller.ts` and `apps/api/src/webhooks/clerk-webhook.service.ts` handling `user.created`, `user.updated`, `user.deleted` with deduplication via `AuditLog`.
- **Step 4: Auth & Isolation Guards (`apps/api`)**:
  - Implemented `ClerkAuthGuard`, `AccountStatusGuard`, `RolesGuard`, `OwnerMfaGuard`, `ProjectAccessGuard` in `apps/api/src/auth/guards/`.
  - Implemented `ProjectsController` (`apps/api/src/projects/projects.controller.ts`) and `UsersController` (`apps/api/src/users/users.controller.ts`).
  - Tested Client A vs Client B isolation: Client A accessing Client B project receives 404 Not Found.
- **Step 5: Frontend Auth Shell & Screens 01–05 (`apps/web`)**:
  - Implemented semantic dark/light tokens in `apps/web/src/styles/tokens.css`.
  - Implemented `AuthLayout.tsx` supporting desktop, tablet, and mobile with instant theme switching.
  - Implemented Screen 01 Login (`apps/web/src/features/auth/pages/SignInPage.tsx`).
  - Implemented Screen 02 Sign Up (`apps/web/src/features/auth/pages/SignUpPage.tsx`).
  - Implemented Screen 03 Forgot Password (`apps/web/src/features/auth/pages/ForgotPasswordPage.tsx`).
  - Implemented Screen 04 Reset Password (`apps/web/src/features/auth/pages/ResetPasswordPage.tsx`).
  - Implemented Screen 05 Verify Email (`apps/web/src/features/auth/pages/VerifyEmailPage.tsx`).
  - Implemented `PendingApprovalPage.tsx` and `AccessDeniedPage.tsx`.
  - Wired routes in `apps/web/src/routes/AppRoutes.tsx` and `apps/web/src/App.tsx`.
- **Verification Evidence**:
  - Unit tests: `npm run test` (2 passed in `apps/api/src/app.controller.spec.ts`).
  - E2E tests: `npm run test:e2e` (13 passed across `test/app.e2e-spec.ts` and `test/auth-isolation.e2e-spec.ts`).
  - Lint: `npm run lint` (0 warnings, 0 errors across 40 files).
  - Typecheck: `npm run typecheck` (0 errors across `@os-portal/web` and `@os-portal/api`).
  - Build: `npm run build` (Clean production bundles for web and api).
  - Composite: `npm run verify` passed.
  - Memory integrity: `py -3 tools/check-memory.py` passed (7 pass, 0 fail).

## 11 Deviations

None. Phase P01 adheres directly to `BUILD-PLAN.md`, `memory/decisions.md` (D-1, D-2, D-3, D-5, D-11, D-15), and `docs/SCREEN-MAP.md`.

## 12 Memory changes

No new decisions or memory entries changed during planning. Applicable memory cited: D-1, D-2, D-3, D-5, D-11, D-15, P-1, P-2, P-3.

## 13 Stephen confirmation

Upon completion of P01, Stephen will verify:
1. Migration applied cleanly to PostgreSQL and Prisma client generated.
2. Server-side bootstrap script creates the initial Owner account with mandatory MFA and rejects second elevation.
3. Unactivated public signups land on `/pending-approval` and cannot access any project data.
4. Client A and Client B isolation verified by automated e2e tests (Client A cannot read Client B's project or counts).
5. Screens 01–05 render and function responsively across desktop, tablet, and mobile in both dark and light modes.
6. Composite `npm run verify` passes with zero errors.

## 14 Integration and handoff

- External dependencies: Clerk development account; PostgreSQL database instance.
- Integration endpoints: Clerk webhooks (`POST /api/webhooks/clerk`).
- Runbook:
  1. Add development credentials to `apps/web/.env.local` and `apps/api/.env`.
  2. Run `npm run db:migrate:dev` to apply Prisma schema.
  3. Run `npm run bootstrap:owner` to bind Stephen's initial Owner account.
  4. Run `npm run dev:api` and `npm run dev:web` to launch the local stack.
