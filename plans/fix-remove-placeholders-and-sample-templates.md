# Fix: Remove all placeholder data, demo fallbacks, and sample templates

- Task: fix-remove-placeholders-and-sample-templates
- Status: APPROVED
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Strip out all hardcoded sample fixtures, mock records, demo fallbacks, and placeholder defaults across frontend and backend so Stephen tests live database entities and clean empty states.

## 2 Applicable memory
- `D-1`: React/TypeScript frontend; separate NestJS TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-3`: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA.
- `D-5`: The first release has Owner and Client only and includes all 18 client screens.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Modify: `apps/web/src/features/owner/pages/OwnerClientsPage.tsx`
- Modify: `apps/web/src/features/owner/pages/OwnerDashboardPage.tsx`
- Modify: `apps/web/src/features/projects/pages/ProjectsListPage.tsx`
- Modify: `apps/web/src/features/dashboard/pages/OverviewPage.tsx`
- Modify: `apps/web/src/features/onboarding/pages/OnboardingPage.tsx`
- Modify: `apps/web/src/features/onboarding/pages/QuestionnairePage.tsx`
- Modify: `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx`
- Modify: `apps/web/src/features/owner/pages/OwnerProjectsPage.tsx`
- Modify: `apps/web/src/features/owner/components/CreateInvoiceModal.tsx`
- Modify: `apps/web/src/features/settings/components/ProfileForm.tsx`
- Modify: `apps/web/src/services/projects-api.ts`
- Modify: `apps/web/src/services/files-api.ts`
- Modify: `apps/web/src/services/invoices-api.ts`
- Modify: `apps/api/src/files/services/file-lifecycle.service.ts`
- Modify: `apps/api/src/projects/projects.service.ts`
- Modify: `apps/api/src/users/users.controller.ts`
- Modify: `apps/api/src/users/users.service.ts`

## 4 Contract status
- `GET /api/admin/users/pending`: Proposed & implemented to fetch real users with `status: 'PENDING_APPROVAL'`.
- `GET /api/admin/users/clients`: Proposed & implemented to fetch active client records for project assignment.
- `POST /api/admin/users/:userId/reject`: Proposed & implemented to suspend/reject pending registrations.
- `GET /api/projects`: Existing contract returning `Project[]`; removed fallback to mock array.
- `GET /api/admin/files/lifecycle`: Existing contract; removed fallback to mock file array.
- `GET /api/admin/invoices`: Existing contract; removed fallback to mock invoices array.

## 5 Scope and acceptance
- Acceptance 1: `OwnerClientsPage` displays live pending registrations from `/api/admin/users/pending` or clean empty state "No client registrations pending approval" (no hardcoded David Adeleke).
- Acceptance 2: `OwnerDashboardPage` displays live metrics or clean zeroes (0 Registrations, 0 Projects, 0 Deliverables, $0.00), not hardcoded "1 Registration", "2 Projects", "1 Deliverable", "$3,500.00".
- Acceptance 3: `ProjectsListPage` displays live projects from `/api/projects` or clean empty state "No projects in workspace" (no hardcoded "E-Commerce Website Redesign" or "Client Portal Full-Stack Engineering").
- Acceptance 4: `OverviewPage` displays real client project milestones/docs or clean empty states, without hardcoded fallback milestones or static Drive links.
- Acceptance 5: `QuestionnairePage` starts with blank form fields, not pre-filled with "Acme Retail Co." or luxury accessory templates.
- Acceptance 6: `ProjectWorkspacePage` displays real deliverables or clean empty state, without hardcoded "v2.1 Wireframes & Component Specs".
- Acceptance 7: `files-api.ts` and `invoices-api.ts` have empty mock arrays (`[]`), preventing prototype sample data from leaking when backend has zero records.
- Acceptance 8: Backend `file-lifecycle.service.ts` and `projects.service.ts` return empty arrays instead of "Stephen Showcase Website" and "Brand Guidelines" demo records.

## 6 Ordered steps
1. Backend: Implement `GET /admin/users/pending`, `GET /admin/users/clients`, and `POST /admin/users/:userId/reject` in `users.controller.ts` and `users.service.ts`.
2. Backend: Purge mock arrays in `file-lifecycle.service.ts` and `projects.service.ts`.
3. Frontend Services: Purge mock arrays in `files-api.ts`, `invoices-api.ts`, and `projects-api.ts`.
4. Frontend Owner Suite: Update `OwnerClientsPage.tsx`, `OwnerDashboardPage.tsx`, `OwnerProjectsPage.tsx`, and `CreateInvoiceModal.tsx`.
5. Frontend Client Pages: Update `ProjectsListPage.tsx`, `OverviewPage.tsx`, `OnboardingPage.tsx`, `QuestionnairePage.tsx`, `ProjectWorkspacePage.tsx`, and `ProfileForm.tsx`.
6. Verification: Run TypeScript check (`tsc -b --noEmit` and Nest build check), run test suites, verify memory integrity.
7. Git commit, push to GitHub `main`, triggering automated deployment to Render and Cloudflare Pages.

## 7 Objections
1. Objection (Blocker): Removing mock fallback data in services might cause tests or empty UI views to crash with null reference exceptions if code expects non-empty arrays.
   - Resolution: Every component must handle empty arrays (`[]`) gracefully with proper empty states (`projects.length === 0`, `pendingApprovals.length === 0`, etc.) and optional chaining.
2. Objection (Serious): If backend database currently has zero projects, client overview will render `NoActiveProjectPage`.
   - Resolution: This is the correct, intended production behavior for an account without an assigned project per `BUILD-PLAN.md` and Figma. Stephen can create projects via the Owner Suite.
3. Objection (Minor): Build scripts or unit tests might rely on mock fixtures in `files-api` or `invoices-api`.
   - Resolution: Unit tests provide their own explicit mocks/stubs. Run all unit tests to confirm zero regressions.

## 8 Verdict
READY FOR IMPLEMENTATION. Approved per Stephen's explicit instructions: "Remove all placeholder now so I can test it properly" and "The samples and placeholder template are stil there".

## 9 Approval
- Approver: Stephen Oderinde
- Approved Date: 2026-10-22
- Exact Instruction: "Remove all placeholder now so I can test it properly" and "The samples and placeholder template are stil there"
- Scope: Purge all prototype fixtures, sample data, and placeholder templates across frontend and backend.

## 10 Execution log
- Implementation in progress.

## 11 Deviations
- None.

## 12 Memory changes
- Checked: No changes to active memory rules required; `7 pass, 0 warn, 0 fail` preserved.

## 13 Stephen confirmation
- Awaiting Stephen testing on live Cloudflare Pages and Render environments after deployment.

## 14 Integration and handoff
- Changes deploy via Git push to GitHub `main` -> Cloudflare Pages (frontend) and Render (backend).
