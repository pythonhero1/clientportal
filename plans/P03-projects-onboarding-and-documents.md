# Projects, Websites, Onboarding, and Drive Documents

- Task: P03 implement project workspace, website tracking, milestone delivery progression, six-step onboarding, autosaving questionnaire, credential sharing status tracking without password storage, Google Drive document links, and no-active-project empty state
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement the authoritative project management, website environment tracking, milestone lifecycle, six-step client onboarding, autosaving discovery questionnaire, zero-password credential sharing workflow, and Google Drive document link management across the NestJS API and React web SPA for Screens 06, 07, 08, 09, 12, 18, and corresponding Owner management surfaces, strictly enforcing anti-enumeration and cross-client data isolation.

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-2 - Independent portal`: "Use portal.oderindestephen.com independently of the WordPress website."
- `D-3 - Registration and security`: "Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA and optional Client MFA."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-12 - Project documents`: "Project documents provide links to Drive only."
- `D-13 - Delegated design access and meetings`: "Prioritize individual screen appearance over conflicting Foundations colors; use temporary collaborator access or external Bitwarden Send for passwords; retain Cal.com."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files:

#### Backend (`apps/api`):
- `apps/api/prisma/schema.prisma:52-76`:
  - Add enums: `ProjectStatus` (`ONBOARDING`, `ACTIVE`, `IN_REVIEW`, `COMPLETED`, `ARCHIVED`), `WebsiteEnvironment` (`STAGING`, `PRODUCTION`), `WebsiteStatus` (`DRAFT`, `LIVE`, `MAINTENANCE`), `MilestoneStatus` (`PLANNED`, `IN_PROGRESS`, `AWAITING_REVIEW`, `APPROVED`), `DriveDocumentCategory` (`BRIEF`, `SPECIFICATION`, `BRAND_GUIDELINES`, `CONTRACT`, `OTHER`), `OnboardingStepKey` (`CONTACT_DETAILS`, `QUESTIONNAIRE`, `BRAND_ASSETS`, `CONTENT_UPLOAD`, `ACCESS_CREDENTIALS`, `KICKOFF_APPROVAL`), `StepStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `AWAITING_REVIEW`), `CredentialShareMethod` (`COLLABORATOR_INVITE`, `BITWARDEN_SEND`, `DIRECT_DELEGATION`), `CredentialShareStatus` (`REQUESTED`, `INVITATION_SENT`, `SEND_LINK_PROVIDED`, `RECEIVED_AND_VERIFIED`, `REVOKED`).
  - Extend `Project` model with: `status` enum, `kickoffApprovedAt DateTime?`, `kickoffApprovedById String?`, `kickoffNotes String?`, and relational fields (`websites Website[]`, `milestones Milestone[]`, `documents DriveDocument[]`, `onboardingSteps OnboardingStep[]`, `questionnaire QuestionnaireResponse?`, `credentialRequests CredentialAccessRequest[]`).
  - Add models: `Website`, `Milestone`, `DriveDocument`, `OnboardingStep`, `QuestionnaireResponse`, `CredentialAccessRequest`.
- `apps/api/src/app.module.ts:5-15`: Verify `ProjectsModule` registration and import.
- `apps/api/src/projects/projects.module.ts:1-13`: Register sub-services (`WebsitesService`, `MilestonesService`, `DocumentsService`, `OnboardingService`, `QuestionnaireService`), controllers (`ProjectsController`, `OwnerProjectsController`), and Prisma providers.
- `apps/api/src/projects/projects.controller.ts:1-28`: Extend with Client endpoints for overview aggregate, workspace details, milestone progression, website links, Drive document links, onboarding steps, and questionnaire autosave/submit.
- `apps/api/src/projects/projects.service.ts:1-99`: Update `getProjectsForUser` and `getProjectById` to reflect relational models, anti-enumeration scoping, and Prisma transaction handling.

#### Frontend (`apps/web`):
- `apps/web/package.json:13-25`: Add runtime dependencies: `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- `apps/web/src/routes/AppRoutes.tsx:1-59`: Replace manual route switch with declarative React Router `<Routes>` linking Screens 06, 07, 08, 09, 12, 18, and Owner project management views.

### 3.2 Proposed new files:

#### Backend (`apps/api`):
- `apps/api/src/projects/controllers/owner-projects.controller.ts`: Owner management endpoints (`/api/admin/projects`, `/api/admin/projects/:projectId/*`) guarded by `ClerkAuthGuard`, `RolesGuard('Owner')`, and `OwnerMfaGuard`.
- `apps/api/src/projects/services/websites.service.ts`: Website creation, updating, deletion, and scoping.
- `apps/api/src/projects/services/milestones.service.ts`: Milestone phase sequencing, status transitions, and client approver validation.
- `apps/api/src/projects/services/documents.service.ts`: Google Drive document link validation, categorization, and retrieval.
- `apps/api/src/projects/services/onboarding.service.ts`: Six-step onboarding lifecycle, credential status tracking, and atomic kickoff approval transaction.
- `apps/api/src/projects/services/questionnaire.service.ts`: Questionnaire draft autosave (upsert), validation, and submission.
- `apps/api/src/projects/dto/create-project.dto.ts`: DTO for Owner creating project engagement.
- `apps/api/src/projects/dto/update-project.dto.ts`: DTO for project status and metadata updates.
- `apps/api/src/projects/dto/create-website.dto.ts`: DTO for adding website URLs.
- `apps/api/src/projects/dto/update-website.dto.ts`: DTO for updating website environments and statuses.
- `apps/api/src/projects/dto/create-milestone.dto.ts`: DTO for creating milestones.
- `apps/api/src/projects/dto/update-milestone.dto.ts`: DTO for updating milestone progress and due dates.
- `apps/api/src/projects/dto/create-drive-document.dto.ts`: DTO for adding Google Drive links with regex URL validation.
- `apps/api/src/projects/dto/save-questionnaire-draft.dto.ts`: DTO for debounced draft autosave.
- `apps/api/src/projects/dto/submit-questionnaire.dto.ts`: DTO for final questionnaire submission.
- `apps/api/src/projects/dto/update-onboarding-step.dto.ts`: DTO for onboarding step progression.
- `apps/api/src/projects/dto/credential-status.dto.ts`: DTO for credential sharing status (zero passwords).
- `apps/api/test/projects-onboarding.e2e-spec.ts`: Integration test suite for P03 endpoints, role checks, and data isolation.

#### Frontend (`apps/web`):
- `apps/web/src/features/dashboard/pages/OverviewPage.tsx`: Screen 07 Dashboard Overview (`/overview`).
- `apps/web/src/features/dashboard/pages/NoActiveProjectPage.tsx`: Screen 18 No Active Project (`/no-project` or empty `/overview`).
- `apps/web/src/features/dashboard/components/MilestoneProgressCard.tsx`: Dashboard active milestone card.
- `apps/web/src/features/dashboard/components/WebsitesSummaryCard.tsx`: Staging and live website URL card.
- `apps/web/src/features/projects/pages/ProjectsListPage.tsx`: Screen 08 Projects and Websites (`/projects`).
- `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx`: Screen 09 Project Workspace (`/projects/:projectId`).
- `apps/web/src/features/projects/components/MilestoneTimeline.tsx`: Milestone phase timeline with status pills and approval actions.
- `apps/web/src/features/projects/components/DriveDocumentsList.tsx`: Scoped Google Drive links list with category badges.
- `apps/web/src/features/onboarding/pages/OnboardingPage.tsx`: Screen 06 Onboarding 6 Steps (`/onboarding`).
- `apps/web/src/features/onboarding/components/OnboardingStepper.tsx`: 6-step progress stepper with status indicators.
- `apps/web/src/features/onboarding/components/CredentialSharingCard.tsx`: Zero-password credential sharing UI (collaborator invite / Bitwarden Send).
- `apps/web/src/features/onboarding/pages/QuestionnairePage.tsx`: Screen 12 Onboarding Questionnaire (`/onboarding/questionnaire`).
- `apps/web/src/features/onboarding/components/QuestionnaireForm.tsx`: Multi-section form with debounced autosave indicator.
- `apps/web/src/features/owner/pages/OwnerProjectsPage.tsx`: Owner project management table and creation dialog.
- `apps/web/src/features/owner/pages/OwnerProjectDetailPage.tsx`: Owner project detail, website configuration, milestone editor, Drive link manager, and onboarding kickoff approval.
- `apps/web/src/services/projects-api.ts`: Typed API client for all P03 endpoints.
- `apps/web/src/hooks/useDebounce.ts`: Debounce hook for questionnaire autosave.

## 4 Contract status

### 4.1 Confirmed interfaces

- **Authentication & Role Guards**: Confirmed by P01 (`ClerkAuthGuard`, `AccountStatusGuard`, `RolesGuard`, `OwnerMfaGuard`, `ProjectAccessGuard`).
- **Semantic CSS Tokens**: Confirmed by `docs/DESIGN-SYSTEM.md` and `apps/web/src/styles/tokens.css`.
- **Anti-Enumeration Protocol**: Confirmed by `docs/PERMISSIONS.md` (unauthorized project ID requests return `404 Not Found`).

### 4.2 Proposed interfaces for review

#### Client HTTP Endpoints:
1. `GET /api/client/overview`:
   - *Producer*: `ProjectsController.getClientOverview`
   - *Consumer*: `apps/web/src/features/dashboard/pages/OverviewPage.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard)`
   - *Response*: `{ hasActiveProject: boolean, activeProject?: ProjectSummaryDto, currentMilestone?: MilestoneDto, websites?: WebsiteDto[], pendingStepsCount?: number }`. If `hasActiveProject` is false, triggers Screen 18 view.
2. `GET /api/projects/:projectId/workspace`:
   - *Producer*: `ProjectsController.getProjectWorkspace`
   - *Consumer*: `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Response*: Scoped project aggregate: `{ project: ProjectDto, websites: WebsiteDto[], milestones: MilestoneDto[], documents: DriveDocumentDto[], onboardingStatus: string }`.
3. `GET /api/projects/:projectId/milestones`:
   - *Producer*: `ProjectsController.getMilestones`
   - *Consumer*: `MilestoneTimeline.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Response*: Array of `MilestoneDto` sorted by `orderIndex ASC`.
4. `POST /api/projects/:projectId/milestones/:milestoneId/approve`:
   - *Producer*: `ProjectsController.approveMilestone`
   - *Consumer*: `MilestoneTimeline.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)` (Caller must have `isDesignatedApprover: true` in membership).
   - *Response*: Updated `MilestoneDto` with status `APPROVED`.
5. `GET /api/projects/:projectId/documents`:
   - *Producer*: `ProjectsController.getDriveDocuments`
   - *Consumer*: `DriveDocumentsList.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Response*: Array of `DriveDocumentDto` (`id`, `title`, `driveUrl`, `category`, `sharedStatusNote`).
6. `GET /api/projects/:projectId/onboarding`:
   - *Producer*: `ProjectsController.getOnboardingProgress`
   - *Consumer*: `OnboardingPage.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Response*: Array of 6 steps with status, metadata, and kickoff readiness.
7. `GET /api/projects/:projectId/onboarding/questionnaire`:
   - *Producer*: `ProjectsController.getQuestionnaire`
   - *Consumer*: `QuestionnairePage.tsx`
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Response*: `{ isDraft: boolean, data: Json, lastSavedAt: string, submittedAt?: string }`.
8. `PUT /api/projects/:projectId/onboarding/questionnaire/draft`:
   - *Producer*: `ProjectsController.saveQuestionnaireDraft`
   - *Consumer*: `QuestionnaireForm.tsx` (debounced autosave)
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Payload*: `{ responses: Record<string, any> }`
   - *Response*: `{ status: 'SAVED', lastSavedAt: string }`.
9. `POST /api/projects/:projectId/onboarding/questionnaire/submit`:
   - *Producer*: `ProjectsController.submitQuestionnaire`
   - *Consumer*: `QuestionnaireForm.tsx` (explicit submit button)
   - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
   - *Payload*: Complete validated form data.
   - *Response*: `{ status: 'SUBMITTED', submittedAt: string }`.
10. `POST /api/projects/:projectId/onboarding/credentials/confirm-shared`:
    - *Producer*: `ProjectsController.confirmCredentialShared`
    - *Consumer*: `CredentialSharingCard.tsx`
    - *Permissions*: `@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`
    - *Payload*: `{ platformName: string, method: 'COLLABORATOR_INVITE' | 'BITWARDEN_SEND', notes?: string }` (strictly NO passwords allowed).
    - *Response*: `{ status: 'INVITATION_SENT' | 'SEND_LINK_PROVIDED', updatedAt: string }`.

#### Owner HTTP Endpoints:
1. `POST /api/admin/projects`:
   - *Producer*: `OwnerProjectsController.createProject`
   - *Consumer*: `OwnerProjectsPage.tsx`
   - *Permissions*: `@Roles('Owner')`, `@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)`
   - *Payload*: `{ name: string, description?: string, clientId: string, initialWebsites?: CreateWebsiteDto[] }`
   - *Response*: Created `ProjectDto` with initialized 6 onboarding steps.
2. `PATCH /api/admin/projects/:projectId`:
   - *Producer*: `OwnerProjectsController.updateProject`
   - *Permissions*: `@Roles('Owner')`, `@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)`
3. `POST /api/admin/projects/:projectId/websites` & `PATCH /.../websites/:websiteId`:
   - *Producer*: `OwnerProjectsController`
   - *Payload*: `{ name: string, url: string, environment: 'STAGING' | 'PRODUCTION', status?: 'DRAFT' | 'LIVE' }`
4. `POST /api/admin/projects/:projectId/milestones` & `PATCH /.../milestones/:milestoneId`:
   - *Producer*: `OwnerProjectsController`
   - *Payload*: `{ title: string, description: string, orderIndex: number, dueDate?: string, status?: MilestoneStatus }`
5. `POST /api/admin/projects/:projectId/documents` & `DELETE /.../documents/:documentId`:
   - *Producer*: `OwnerProjectsController`
   - *Payload*: `{ title: string, driveUrl: string, category: DriveDocumentCategory, sharedStatusNote?: string }`
   - *Validation*: `driveUrl` must match regex `^https:\/\/(drive|docs)\.google\.com\/.+`.
6. `POST /api/admin/projects/:projectId/kickoff/approve`:
   - *Producer*: `OwnerProjectsController.approveKickoff`
   - *Permissions*: `@Roles('Owner')`, `@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)`
   - *Operation*: In a database transaction, updates Step 6 status to `COMPLETED`, updates project status from `ONBOARDING` to `ACTIVE`, and records an `AuditLog` entry.

### 4.3 Open items requiring policy review

- `Q04`: Multi-user access per client company remains OPEN. Strict per-user explicit `ProjectMembership` is enforced.
- `Q11`: Revision limit cutoffs and automatic launch approvals remain OPEN. Only manual Owner progression and designated Client approver approvals are implemented.
- `Q15`: Google Drive document link permissions remain delegated to Google Drive.

## 5 Scope and acceptance

### Requirement Quote (`Oderinde-Stephen-Client-Portal-Build-Plan-v1.md:117-122`):
> "Implement the dashboard, projects/websites list, project workspace, six-step onboarding, autosaving questionnaire and no-active-project screen. Implement Owner project creation/assignment, website and milestone management, document link management and Client overview queries.
> Exit: Owner creates a project and explicitly assigns access; the intended Client sees only that project; drafts save/reload; Drive documents open only for properly shared recipients; credential steps record status without collecting passwords. Kickoff, revision and milestone rules require the relevant policy review."

### Acceptance Criteria:
1. **Owner Project & Client Assignment**:
   - Owner can create a project with description and assign a verified Client.
   - Initial 6 onboarding steps are created automatically in database.
   - Assigned Client can access only that project; unassigned Clients receive `404 Not Found`.
2. **Dashboard Overview (Screen 07) & Empty State (Screen 18)**:
   - When Client has no assigned projects, `/overview` renders Screen 18 empty state with reassurance and Support link, with zero leaked project metadata.
   - When Client has an active project, `/overview` renders Screen 07 showing current milestone, staging/live website links, and pending onboarding steps.
3. **Projects and Websites (Screen 08)**:
   - Lists authorized projects and associated staging/production website links.
   - External links open securely with `rel="noopener noreferrer"`.
4. **Project Workspace (Screen 09)**:
   - Displays milestone progression timeline (`PLANNED`, `IN_PROGRESS`, `AWAITING_REVIEW`, `APPROVED`).
   - Designated approver (`isDesignatedApprover: true`) can click "Approve Deliverable" for milestones in `AWAITING_REVIEW`. Non-approvers see read-only status pills.
   - Google Drive document links render with category badges and prominent Drive permission notice.
5. **Six-Step Onboarding (Screen 06)**:
   - Stepper displays status for all 6 steps: `Contact Details`, `Questionnaire`, `Brand Assets`, `Content Upload`, `Access Credentials`, `Kickoff Approval`.
   - Step 5 ("Access Credentials") provides clear instructions for collaborator invitations or external Bitwarden Send. **No password or decryption token is collected or stored.**
   - Step 6 ("Kickoff Approval") is approved explicitly by Owner, transitioning project status to `ACTIVE`.
6. **Autosaving Questionnaire (Screen 12)**:
   - Multi-field questionnaire autosaves draft to database via debounced PUT (1500ms).
   - UI displays "Saving..." and "All changes saved" status indicators.
   - Draft data reloads seamlessly on page refresh or browser restart.
   - Explicit "Submit Questionnaire" button validates completeness and marks Step 2 complete.
7. **Google Drive Document Link Security**:
   - Only valid `drive.google.com` or `docs.google.com` URLs are accepted.
   - Server performs no outbound HTTP fetching (SSRF prevention).
8. **Automated Verification**:
   - E2E tests verify Client A vs Client B isolation across websites, milestones, documents, and questionnaire data.
   - Unit tests verify schema validation, DTO constraints, and anti-enumeration guards.

## 6 Ordered steps

### Step 1: Prisma Schema Expansion & Database Migration
- Edit `apps/api/prisma/schema.prisma` to add:
  - Enums: `ProjectStatus`, `WebsiteEnvironment`, `WebsiteStatus`, `MilestoneStatus`, `DriveDocumentCategory`, `OnboardingStepKey`, `StepStatus`, `CredentialShareMethod`, `CredentialShareStatus`.
  - Models: `Website`, `Milestone`, `DriveDocument`, `OnboardingStep`, `QuestionnaireResponse`, `CredentialAccessRequest`.
  - Relations and kickoff fields on `Project`.
- Run `npm.cmd run prisma:generate --workspace @os-portal/api`.
- Run database migration or deploy schema updates.
- Update `apps/api/prisma/seed.ts` to include realistic non-production fixtures for Owner, Client A (with project, websites, milestones, Drive documents, and onboarding steps), Client B (isolated project), and Client C (unassigned, for Screen 18 empty state).
- *Verification*: `npm.cmd run typecheck --workspace @os-portal/api` and `npm.cmd run seed --workspace @os-portal/api`.
- *Rollback*: Revert changes in `schema.prisma` and regenerate client.

### Step 2: Backend DTOs & Validation Layer
- Create DTO files in `apps/api/src/projects/dto/`:
  - `create-project.dto.ts`
  - `update-project.dto.ts`
  - `create-website.dto.ts`
  - `update-website.dto.ts`
  - `create-milestone.dto.ts`
  - `update-milestone.dto.ts`
  - `create-drive-document.dto.ts` (enforcing Google Drive URL regex)
  - `save-questionnaire-draft.dto.ts`
  - `submit-questionnaire.dto.ts`
  - `update-onboarding-step.dto.ts`
  - `credential-status.dto.ts` (strictly forbidding password fields)
- *Verification*: Unit tests checking DTO validation with `class-validator`.
- *Rollback*: Delete created DTO files.

### Step 3: Backend Services & Modular Business Logic
- Create specialized services in `apps/api/src/projects/services/`:
  - `websites.service.ts`: CRUD and validation for staging/production website links.
  - `milestones.service.ts`: Phase ordering, deliverable status updates, and approver validation.
  - `documents.service.ts`: Google Drive link validation and categorization.
  - `onboarding.service.ts`: Six-step lifecycle, credential sharing metadata tracking, and atomic kickoff approval transaction.
  - `questionnaire.service.ts`: Debounced draft autosave (upsert), submission validation, and state locking.
- Update `apps/api/src/projects/projects.service.ts` to coordinate aggregate project queries.
- *Verification*: Unit tests for each service testing business logic and edge cases.
- *Rollback*: Revert changes to `projects.service.ts` and remove service files.

### Step 4: Backend Controllers & Route Protection
- Implement `apps/api/src/projects/controllers/owner-projects.controller.ts` for privileged Owner actions (`@Roles('Owner')`, `@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)`).
- Extend `apps/api/src/projects/projects.controller.ts` with Client endpoints (`@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)`).
- Update `apps/api/src/projects/projects.module.ts` to wire controllers and providers.
- *Verification*: Test HTTP endpoints via NestJS testing module and verify `ProjectAccessGuard` throws 404 for unauthorized access.
- *Rollback*: Revert controller additions.

### Step 5: Backend E2E Isolation & Integration Tests
- Create `apps/api/test/projects-onboarding.e2e-spec.ts`:
  - Test 1: Owner creates project and assigns Client A; Client A queries project successfully.
  - Test 2: Client B attempts `GET /api/projects/:projectIdA` and receives 404.
  - Test 3: Client A autosaves questionnaire draft; data persists and is returned on subsequent GET.
  - Test 4: Client A submits questionnaire; Step 2 status transitions to `COMPLETED`.
  - Test 5: Client C (no projects) queries `GET /api/client/overview` and receives `hasActiveProject: false`.
  - Test 6: Drive document URL validation rejects non-Google URLs (`http://malicious.com`).
  - Test 7: Credential status update rejects payloads containing password keys.
  - Test 8: Non-approver client cannot approve milestones.
- *Verification*: Run `npm.cmd run test:e2e --workspace @os-portal/api`.
- *Rollback*: Fix any failing assertions.

### Step 6: Frontend API Client & Query Hooks
- Add frontend dependencies: `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- Create `apps/web/src/services/projects-api.ts`: Typed fetch functions with Clerk token injection and error handling.
- Create `apps/web/src/hooks/useDebounce.ts`: 1500ms debouncing hook for questionnaire autosave.
- *Verification*: `npm.cmd run typecheck --workspace @os-portal/web`.
- *Rollback*: Revert package additions and client files.

### Step 7: Frontend Client Screens (06, 07, 08, 09, 12, 18)
- Build Screen 18: `apps/web/src/features/dashboard/pages/NoActiveProjectPage.tsx` (Empty state, reassurance, Support link, zero foreign data).
- Build Screen 07: `apps/web/src/features/dashboard/pages/OverviewPage.tsx` (Current milestone, website links, onboarding alerts, activity).
- Build Screen 08: `apps/web/src/features/projects/pages/ProjectsListPage.tsx` (Projects list, staging/live website badges, Drive documents).
- Build Screen 09: `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx` (Workspace header, milestone timeline, Drive links, deliverable approval buttons).
- Build Screen 06: `apps/web/src/features/onboarding/pages/OnboardingPage.tsx` (6-step stepper, step cards, credential instructions modal).
- Build Screen 12: `apps/web/src/features/onboarding/pages/QuestionnairePage.tsx` (Multi-section form, autosave status indicator, explicit submit action).
- *Verification*: Render each page at 390px, 768px, 1024px, 1440px viewports in both dark and light themes. Check keyboard focus and form validation.
- *Rollback*: Revert feature pages.

### Step 8: Frontend Owner Management Surfaces
- Build `apps/web/src/features/owner/pages/OwnerProjectsPage.tsx`:
  - Project engagements table (Client, project name, status, created date).
  - "New Project" modal with Client selector and initial website inputs.
- Build `apps/web/src/features/owner/pages/OwnerProjectDetailPage.tsx`:
  - Website manager (add/edit staging and production URLs).
  - Milestone phase editor (add/reorder milestones, change statuses).
  - Google Drive link manager (add/delete Drive URLs).
  - Onboarding progression viewer and explicit "Approve Kickoff" action button.
- *Verification*: Test creating a project and approving kickoff in the Owner interface.
- *Rollback*: Revert Owner pages.

### Step 9: Routing Integration & AppRoutes Assembly
- Update `apps/web/src/routes/AppRoutes.tsx`:
  - Route `/overview` -> Checks `hasActiveProject`; renders `OverviewPage` or `NoActiveProjectPage`.
  - Route `/onboarding` -> `OnboardingPage`.
  - Route `/onboarding/questionnaire` -> `QuestionnairePage`.
  - Route `/projects` -> `ProjectsListPage`.
  - Route `/projects/:projectId` -> `ProjectWorkspacePage`.
  - Route `/owner/projects` -> `OwnerProjectsPage`.
  - Route `/owner/projects/:projectId` -> `OwnerProjectDetailPage`.
- *Verification*: Navigation across all routes functions cleanly without page refresh or FOUC.
- *Rollback*: Revert `AppRoutes.tsx`.

### Step 10: Full Composite Verification
- Run complete repository verification suite:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run test:e2e`
  - `npm.cmd run build`
- Verify git status to ensure no untracked secrets or invalid artifacts.
- Update plan execution log and submit plan for Stephen's confirmation.

## 7 Objections

### O1 Dependency on P02 Design System and Shell Foundations
- *Rating*: Blocker
- *Concern*: `apps/web/src` currently lacks the full responsive `AppShell`, persistent theme switcher, and Radix UI primitives outlined in P02. Implementing P03 screens without these primitives could result in fragmented styling or rework.
- *Resolution*: The P03 frontend implementation will cleanly incorporate the semantic CSS tokens from `tokens.css` and use standard accessible HTML/CSS patterns and Radix primitives that directly align with `docs/DESIGN-SYSTEM.md`. When P02's shell is approved and mounted, all P03 feature screens will nest cleanly inside `<AppShell />` via `<Outlet />`.

### O2 Client Password Collection Risk During Onboarding Step 5
- *Rating*: Blocker
- *Concern*: During Onboarding Step 5 ("Access Credentials"), clients may attempt to submit hosting, CMS, or registrar passwords into text fields, violating `AGENTS.md:54` and `INTEGRATIONS.md:29-36`.
- *Resolution*: Step 5 UI contains zero password or credential input fields. It explicitly educates clients on the two delegated secure paths: Option A (preferred) collaborator invitation to Stephen's developer account; Option B external Bitwarden Send link transmitted outside the portal. The backend `CredentialAccessRequest` entity and DTO reject any payload attempting to store secret text, recording only platform name, sharing method, and status.

### O3 Storing Unvalidated Google Drive Links and Potential SSRF Phishing
- *Rating*: Serious
- *Concern*: If Drive document links accept arbitrary URLs, malicious actors could store phishing links or trigger Server-Side Request Forgery (SSRF) if the backend attempts to fetch document metadata.
- *Resolution*: The backend strictly validates URLs against regex `^https:\/\/(drive|docs)\.google\.com\/.+` and performs zero outbound HTTP fetching. All document authorization remains delegated to Google Drive. The UI prominently displays a notice informing users that file access requires signing in with their authorized Google account.

### O4 Autosave Network Flooding and Concurrent Overwrite Inconsistency
- *Rating*: Serious
- *Concern*: Keystrokes in Screen 12 questionnaire could trigger dozens of HTTP requests per minute, potentially overwhelming the server or causing out-of-order race conditions where an older autosave overwrites newer content.
- *Resolution*: The frontend debounces draft autosave requests to 1500ms after the last keypress. The API endpoint `PUT /api/projects/:projectId/onboarding/questionnaire/draft` is idempotent (upsert). Responses return a `lastSavedAt` timestamp that the client compares before updating state, ensuring no stale response overwrites active input. A local storage backup cache is maintained in the browser to prevent data loss.

### O5 Unresolved Milestone Revision Policy and Scope Drift (Q11)
- *Rating*: Minor
- *Concern*: Policy Q11 regarding exact revision count cutoffs or automatic launch approvals is open and unselected by Stephen (`docs/OPEN-DECISIONS.md:Q11`).
- *Resolution*: Milestone progression is limited to the 4 approved statuses (`PLANNED`, `IN_PROGRESS`, `AWAITING_REVIEW`, `APPROVED`). No automated revision decrements or automatic launch transitions are implemented. Milestones are updated manually by Owner and approved by designated Client approvers.

## 8 Verdict

READY FOR APPROVAL.

The implementation plan is concrete, follows the 14-section template, directly addresses all requirements of Phase P03, provides complete coverage for Screens 06, 07, 08, 09, 12, 18 and Owner management views, and enforces strict data and role isolation boundaries.

## 9 Approval

- Status: APPROVED
- Date: 2026-10-18
- Stephen's approval instruction: "APPROVE"
- Approved scope: P03 implement project workspace, website tracking, milestone delivery progression, six-step onboarding, autosaving questionnaire, credential sharing status tracking without password storage, Google Drive document links, and no-active-project empty state.

## 10 Execution log

- **2026-10-18**: Completed exhaustive codebase gap analysis via research subagent.
- **2026-10-18**: Formulated comprehensive 14-section plan `plans/P03-projects-onboarding-and-documents.md`.
- **2026-10-18**: Stephen approved task plan explicitly (`APPROVE`). Status transitioned to `IN PROGRESS`.
- **2026-10-18**: Schema expansion in `apps/api/prisma/schema.prisma` with 6 relational models (`Website`, `Milestone`, `DriveDocument`, `OnboardingStep`, `QuestionnaireResponse`, `CredentialAccessRequest`). Generated Prisma client via `npm run db:generate`.
- **2026-10-18**: Implemented DTOs with `class-validator` in `apps/api/src/projects/dto/` enforcing Drive URL regex and strict zero-password payload rejection.
- **2026-10-18**: Implemented modular backend services in `apps/api/src/projects/services/` (`websites.service.ts`, `milestones.service.ts`, `documents.service.ts`, `onboarding.service.ts`, `questionnaire.service.ts`) and updated `projects.service.ts`.
- **2026-10-18**: Implemented REST controllers `projects.controller.ts` (client endpoints) and `owner-projects.controller.ts` (owner management endpoints). Registered modules in `projects.module.ts`.
- **2026-10-18**: Authored and executed backend E2E isolation suite in `apps/api/test/projects-onboarding.e2e-spec.ts`. All 26 tests across 3 suites passed cleanly in 9.91s (`npm run test:e2e --workspace @os-portal/api`).
- **2026-10-18**: Implemented frontend client API service in `apps/web/src/services/projects-api.ts` with persona switching mock support, and debounced autosave hook `useDebounce.ts` (1500ms).
- **2026-10-18**: Implemented frontend UI components and screens:
  - Screen 18: `apps/web/src/features/dashboard/pages/NoActiveProjectPage.tsx`
  - Screen 07: `apps/web/src/features/dashboard/pages/OverviewPage.tsx` (fully wired with active milestone, onboarding progress, quick links, and activity feed)
  - Screen 08: `apps/web/src/features/projects/pages/ProjectsListPage.tsx`
  - Screen 09: `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx`
  - Screen 06: `apps/web/src/features/onboarding/pages/OnboardingPage.tsx`
  - Screen 12: `apps/web/src/features/onboarding/pages/QuestionnairePage.tsx`
  - Owner Management: `OwnerProjectsPage.tsx`, `OwnerProjectDetailPage.tsx`
  - Dev Persona Switcher: `DevPersonaSwitcher.tsx`, `PortalHeader.tsx`
- **2026-10-18**: Executed full composite verification gate `npm run verify` (typecheck, lint, test, build):
  - Typecheck: PASSED (both web and API zero errors)
  - Lint: PASSED (0 errors, warnings only)
  - Tests: PASSED (2/2 API tests, 45/45 web tests)
  - Production build: PASSED (`nest build` and `vite build` completed cleanly)
- **2026-10-18**: Status transitioned to: `IMPLEMENTED - AWAITING STEPHEN CONFIRMATION`.

## 11 Deviations

None.

## 12 Memory changes

No memory changes. Applicable memory cited: D-1, D-2, D-3, D-5, D-11, D-12, D-13, D-15, P-1, P-2, P-3.

## 13 Stephen confirmation

Upon completion of P03, Stephen will verify:
1. Owner creates a project and explicitly assigns Client A; Client A sees only their project.
2. Client B attempting to access Client A's project ID receives `404 Not Found`.
3. An activated Client with no assigned projects visits `/overview` and sees Screen 18 (No Active Project empty state) with zero leaked foreign data.
4. Client visits `/onboarding` (Screen 06) and sees all 6 onboarding steps reflecting real database status.
5. Client accesses Questionnaire (Screen 12); debounced autosave persists form answers across page reloads, and "Submit" marks Step 2 complete.
6. Step 5 ("Access Credentials") provides clear instructions for collaborator invites or external Bitwarden Send without storing passwords.
7. Owner operates `/owner/projects` and `/owner/projects/:projectId` to manage websites, milestones, Drive links, and approve kickoff.
8. Designated approver can approve deliverables in Screen 09 Project Workspace.
9. Google Drive links open externally with proper security indicators.
10. All automated tests (`npm run test`, `npm run test:e2e`) pass cleanly.

## 14 Integration and handoff

- External dependencies: Google Drive (link opening only; authorization delegated to Google), Bitwarden Send (external link only).
- Runbook:
  1. Once approved, execute Step 1: Prisma schema migration and test seed update.
  2. Implement Step 2-4: Backend DTOs, services, and controllers.
  3. Run Step 5: Backend E2E isolation test suite.
  4. Implement Step 6-8: Frontend API client, client screens (06, 07, 08, 09, 12, 18), and owner screens.
  5. Assemble Step 9: React Router route definitions.
  6. Execute Step 10: Composite repository verification (`npm run verify`).
