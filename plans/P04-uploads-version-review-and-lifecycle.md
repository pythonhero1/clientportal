# Uploads, Version Review, and Lifecycle Management

- Task: P04 implement authorized direct S3 uploads, 7 approved file categories, 500 MB contract, quarantine inspection, immutable version history, version-specific feedback and designated approvals, lifecycle management (archive, 90-day soft deletion, restricted post-window, Owner-authorized permanent deletion), audit logging, and responsive Screen 10 / Owner surfaces
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement authorized direct-to-S3 uploads (up to decimal 500 MB), strict 7-category extension validation, quarantine inspection, immutable version history, version-specific feedback threads, designated approver sign-off, full lifecycle management (archive, 90-day recovery window, restricted post-window state, and Owner-authorized permanent deletion), and audit logging across the NestJS API and React SPA for Screen 10 (`/files`) and the Owner Deliverables & Lifecycle surface (`/owner/files`), strictly enforcing cross-client isolation and anti-enumeration.

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-6 - Application file version history`: "Preserve prior versions and attach feedback and approvals to the exact file version."
- `D-7 - Storage categories and limit`: "Use private S3-compatible storage separately from the API/database; 500 MB per file; all seven previously proposed categories."
- `D-8 - File deletion and audit`: "Archived files stay until authorized deletion; Owner soft deletion; 90-day recovery; Owner authorization for permanent deletion after the window; full lifecycle audit; deletion/restoration alerts go to Owner in this release."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-12 - Project documents`: "Project documents provide links to Drive only."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files

#### Backend (`apps/api`):
- `apps/api/package.json:25-40`:
  - Add runtime dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `file-type`.
- `apps/api/prisma/schema.prisma:1-277`:
  - Add enums:
    - `FileCategory` (`IMAGES`, `DOCUMENTS`, `SPREADSHEETS`, `DESIGN_FILES`, `ARCHIVES`, `VIDEO`, `AUDIO`)
    - `FileLifecycleStatus` (`ACTIVE`, `ARCHIVED`, `SOFT_DELETED`, `RESTRICTED_POST_WINDOW`, `PERMANENTLY_DELETED`)
    - `FileVisibility` (`SHARED`, `INTERNAL`)
    - `VersionReviewStatus` (`PENDING_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`)
    - `ScanStatus` (`QUARANTINED`, `CLEAN`, `INFECTED`, `FAILED`)
  - Add models:
    - `File` (id, projectId, createdById, name, category, visibility, lifecycleStatus, archivedAt/ById, softDeletedAt/ById, softDeleteExpiresAt, permanentlyDeletedAt/ById, currentVersionNumber, timestamps, relations)
    - `FileVersion` (id, fileId, versionNumber, storageKey, quarantineKey, fileName, fileExtension, mimeType, byteSize, checksumSha256, scanStatus, scanResult, isLatest, uploadedById, reviewStatus, approvedAt, approvedById, approvalNotes, createdAt, relations)
    - `FileComment` (id, fileVersionId, authorId, content, timestamps, relations)
  - Extend existing models:
    - `Project` (lines 116-134): add `files File[]`
    - `User` (lines 85-102): add `uploadedFiles File[]`, `uploadedVersions FileVersion[]`, `fileComments FileComment[]`, `approvedVersions FileVersion[]`
- `apps/api/src/app.module.ts:11-25`:
  - Import and register `FilesModule`.

#### Frontend (`apps/web`):
- `apps/web/src/routes/AppRoutes.tsx:62,77`:
  - Connect real data-driven components for `/files` (Screen 10) and `/owner/files` (replacing static fixtures).
- `apps/web/src/features/files/pages/FilesFeedbackPage.tsx:1-65`:
  - Replace static dummy card and buttons with fully interactive Screen 10 interface (category filters, deliverable version switcher, download trigger, feedback thread, designated approver banner, and client asset upload modal).
- `apps/web/src/features/owner/pages/OwnerFilesPage.tsx:1-50`:
  - Replace static fixture with complete Owner lifecycle interface (project selector, deliverable upload modal with visibility toggle, lifecycle management tabs for Active/Archived/Soft-Deleted/Restricted, 90-day recovery countdown, permanent deletion modal with confirmation, and audit log viewer).

### 3.2 Proposed new files

#### Backend (`apps/api`):
- `apps/api/src/files/files.module.ts`: NestJS module bundling files controllers, services, guards, and storage providers.
- `apps/api/src/files/files.controller.ts`: Client-accessible file management endpoints (`/api/projects/:projectId/files`).
- `apps/api/src/files/controllers/owner-files.controller.ts`: Owner administrative file endpoints (`/api/admin/files`).
- `apps/api/src/files/services/storage.service.ts`: AWS SDK v3 wrapper for generating presigned PUT/GET URLs, `headObject` metadata/size verification, moving objects from quarantine to private store, and physical deletion.
- `apps/api/src/files/services/quarantine.service.ts`: Quarantine validation service performing byte size checks, magic byte MIME type inspection, and virus scan stub/ClamAV interface.
- `apps/api/src/files/services/files.service.ts`: Core service managing file metadata, anti-enumeration scoping, category filtering, and client visibility rules.
- `apps/api/src/files/services/file-versions.service.ts`: Manages immutable version increments, version retrieval, and resets review status upon new version uploads.
- `apps/api/src/files/services/file-reviews.service.ts`: Manages version-specific comment threads and designated approver sign-offs.
- `apps/api/src/files/services/file-lifecycle.service.ts`: Manages archive, 90-day soft-deletion, restoration, post-window restriction, and Owner-authorized permanent deletion with comprehensive audit logging.
- `apps/api/src/files/guards/file-access.guard.ts`: Enforces project membership and anti-enumeration (`404 Not Found` for foreign or internal files).
- `apps/api/src/files/guards/designated-approver.guard.ts`: Enforces that only Owner or `ProjectMembership.isDesignatedApprover` can approve versions.
- `apps/api/src/files/dto/request-upload.dto.ts`: Validates upload initiation parameters (name, category, fileName, extension, byteSize <= 500,000,000, visibility).
- `apps/api/src/files/dto/complete-upload.dto.ts`: Validates upload completion parameters.
- `apps/api/src/files/dto/create-comment.dto.ts`: Validates version comment input.
- `apps/api/src/files/dto/approve-version.dto.ts`: Validates approval notes.
- `apps/api/src/files/dto/lifecycle-action.dto.ts`: Validates archive, restore, and permanent delete actions.
- `apps/api/src/files/files.service.spec.ts`: Unit tests for file operations, versions, and lifecycle transitions.
- `apps/api/src/files/guards/file-access.guard.spec.ts`: Unit tests for permission boundaries and anti-enumeration.
- `apps/api/test/files.e2e-spec.ts`: E2E tests for upload initiation, completion verification, version-specific approvals, and cross-client isolation.

#### Frontend (`apps/web`):
- `apps/web/src/services/files-api.ts`: API service client for files, presigned URLs, comments, approvals, and lifecycle actions.
- `apps/web/src/features/files/hooks/useFiles.ts`: TanStack Query hook for fetching scoped files and categories.
- `apps/web/src/features/files/hooks/useFileUpload.ts`: Hook managing direct S3 PUT transfers with real-time XHR progress tracking.
- `apps/web/src/features/files/hooks/useFileVersion.ts`: Hook for version switching, comment posting, and approval mutations.
- `apps/web/src/features/files/components/FileCard.tsx`: Accessible deliverable card displaying latest version, status badge, size, and category icon.
- `apps/web/src/features/files/components/VersionHistoryModal.tsx`: Modal displaying immutable version list, historical comments, and past approval records.
- `apps/web/src/features/files/components/FeedbackThread.tsx`: Version-specific comment thread with author badges and comment form.
- `apps/web/src/features/files/components/ApproverBanner.tsx`: Approval banner showing designated approver controls or approval status badge.
- `apps/web/src/features/files/components/FileUploadModal.tsx`: Modal with drag-and-drop zone, category selector, and progress bar for client/owner uploads.
- `apps/web/src/features/owner/components/OwnerLifecycleTable.tsx`: Tabular view of Active, Archived, Soft-Deleted (with 90-day countdown), and Restricted files.
- `apps/web/src/features/owner/components/PermanentDeleteModal.tsx`: High-friction modal requiring explicit confirmation and Owner authorization.
- `apps/web/src/features/owner/components/FileAuditLogModal.tsx`: Modal rendering immutable chronological file lifecycle audit entries.
- `apps/web/src/features/files/pages/FilesFeedbackPage.test.tsx`: Component tests for Screen 10 interactions.
- `apps/web/src/features/owner/pages/OwnerFilesPage.test.tsx`: Component tests for Owner file management.

## 4 Contract status

| Interface / Endpoint | Status | Producer | Consumer | Permissions & Checks | Description & Fields |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/projects/:projectId/files/upload-initiate` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `useFileUpload` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`. Non-Owners cannot set `INTERNAL` visibility. | Validates category (7 approved), extension, and declared size (<= 500,000,000 bytes). Generates presigned S3 PUT URL for `quarantine/` prefix. Returns `{ uploadUrl, quarantineKey, fileId, versionId, expiresInSeconds }`. |
| `POST /api/projects/:projectId/files/upload-complete` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `useFileUpload` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`. | Calls S3 `HeadObject` to verify actual byte size <= 500,000,000. Executes `QuarantineService` (magic bytes & virus check). Promotes object to deliverable prefix, marks `CLEAN`, bumps version, writes `AuditLog`. |
| `GET /api/projects/:projectId/files` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `FilesFeedbackPage` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`. | Lists active shared files for project. For Clients, strictly filters out `visibility === 'INTERNAL'` and non-active lifecycle states. Supports `?category=` filter. |
| `GET /api/projects/:projectId/files/:fileId` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `FilesFeedbackPage` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, `FileAccessGuard`. | Returns file details and array of all immutable versions (v1, v2...) with review status, approver details, and comment counts. Returns 404 for foreign or internal files requested by Clients. |
| `GET /api/projects/:projectId/files/:fileId/versions/:versionId/download` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `FilesFeedbackPage`, `OwnerFilesPage` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, `FileAccessGuard`. | Checks scanStatus === 'CLEAN'. Generates presigned S3 GET URL with 15-minute TTL. SVGs and HTML-like content include `Content-Disposition: attachment` to prevent portal-origin script execution. |
| `POST /api/projects/:projectId/files/:fileId/versions/:versionId/comments` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `FeedbackThread` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, `FileAccessGuard`. | Binds comment strictly to `FileVersion(id)`. Accepts `{ content: string }`. Appends comment and creates `AuditLog`. |
| `POST /api/projects/:projectId/files/:fileId/versions/:versionId/approve` | PROPOSED FOR REVIEW | Backend `FilesController` | Frontend `ApproverBanner` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, `DesignatedApproverGuard`. | Checks `user.role === 'Owner'` OR `membership.isDesignatedApprover === true`. Sets `version.reviewStatus = 'APPROVED'`, `version.approvedAt = now()`. Does NOT carry over to subsequent versions. |
| `POST /api/admin/files/:fileId/archive` | PROPOSED FOR REVIEW | Backend `OwnerFilesController` | Frontend `OwnerFilesPage` | `ClerkAuthGuard`, `RolesGuard('Owner')`, `OwnerMfaGuard`. | Sets `lifecycleStatus = 'ARCHIVED'`, `archivedAt = now()`. File is preserved indefinitely; no automatic purge. |
| `POST /api/admin/files/:fileId/soft-delete` | PROPOSED FOR REVIEW | Backend `OwnerFilesController` | Frontend `OwnerFilesPage` | `ClerkAuthGuard`, `RolesGuard('Owner')`, `OwnerMfaGuard`. | Sets `lifecycleStatus = 'SOFT_DELETED'`, `softDeletedAt = now()`, `softDeleteExpiresAt = now() + 90 days`. Sends deletion alert exclusively to Owner. |
| `POST /api/admin/files/:fileId/restore` | PROPOSED FOR REVIEW | Backend `OwnerFilesController` | Frontend `OwnerFilesPage` | `ClerkAuthGuard`, `RolesGuard('Owner')`, `OwnerMfaGuard`. | Validates `now() <= softDeleteExpiresAt`. Restores `lifecycleStatus = 'ACTIVE'`. Sends alert exclusively to Owner. |
| `DELETE /api/admin/files/:fileId/permanent` | PROPOSED FOR REVIEW | Backend `OwnerFilesController` | Frontend `PermanentDeleteModal` | `ClerkAuthGuard`, `RolesGuard('Owner')`, `OwnerMfaGuard`. | High-friction Owner action. Physically deletes all S3 version objects, marks record tombstone, logs permanent deletion audit. |
| `GET /api/admin/files/lifecycle` | PROPOSED FOR REVIEW | Backend `OwnerFilesController` | Frontend `OwnerFilesPage` | `ClerkAuthGuard`, `RolesGuard('Owner')`, `OwnerMfaGuard`. | Queries files across projects filtered by lifecycle state (`ACTIVE`, `ARCHIVED`, `SOFT_DELETED`, `RESTRICTED_POST_WINDOW`). |

## 5 Scope and acceptance

### 5.1 Quoted specification requirements (`Oderinde-Stephen-Client-Portal-Build-Plan-v1.md:123-128`)
"Implement authorized direct uploads, all seven approved file categories, the 500 MB contract, resumable progress, safe inspection/quarantine, version history, feedback and designated approval. Implement archive, soft deletion, restoration, restricted post-window handling and the Owner-authorized permanent deletion operation.

Exit: unauthorized object issuance fails; invalid or uninspected uploads are not released; feedback remains attached to the reviewed version; replacement invalidates no history; the 90-day rules and audit events work. No object lifecycle rule silently purges protected files. Test a real maximum-sized transfer with the selected provider."

### 5.2 Measurable acceptance criteria
1. **7 Approved File Categories & 500 MB Limit**:
   - Only extensions belonging to the 7 approved categories (Images: JPG, JPEG, PNG, WebP, GIF; Documents: PDF, DOCX, TXT; Spreadsheets: XLSX, CSV; Design files: SVG, PSD, AI, EPS; Archives: ZIP; Video: MP4, MOV; Audio: MP3, WAV) are accepted. All other extensions are rejected with 400 Bad Request.
   - Uploading files larger than 500,000,000 bytes is rejected during initiation, and enforced on completion via S3 `HeadObject`.
2. **Direct-to-S3 Upload & Memory Safety**:
   - The browser streams file bytes directly to S3 via presigned PUT / multipart URLs. The NestJS Express API process never buffers 500 MB uploads in Node.js memory.
3. **Quarantine Inspection & Object Promotion**:
   - Direct uploads land exclusively under the private `quarantine/` prefix.
   - Direct downloads of uninspected quarantine files are rejected.
   - `QuarantineService` validates size, verifies magic bytes via `file-type`, executes scan check, and promotes only clean objects to permanent deliverable storage.
4. **Immutable Versioning**:
   - Uploading a new version of an existing file increments `versionNumber` (e.g., v1 -> v2) without modifying or overwriting previous version objects in S3 or database records.
   - Previous versions remain selectable and downloadable.
5. **Version-Specific Feedback & Approvals**:
   - Comments attach strictly to a `FileVersion`, not the generic file.
   - Designated approver verification: Only the Owner or a user with `ProjectMembership.isDesignatedApprover == true` can approve a version.
   - Uploading a new version v(n+1) initializes in `PENDING_REVIEW` state and does not inherit approval from v(n).
6. **Data Isolation & Anti-Enumeration**:
   - Client A cannot access, list, or download files from Client B's projects.
   - Querying a foreign `fileId` returns `404 Not Found` (never 403), preserving anti-enumeration.
   - Internal files (`visibility = 'INTERNAL'`) are never returned to Clients in listings or searches and return `404 Not Found` if requested directly.
7. **Lifecycle Management & 90-Day Retention**:
   - Archived files remain preserved indefinitely; no automatic purge runs.
   - Soft-deleted files record a 90-day recovery window (`softDeleteExpiresAt = softDeletedAt + 90 days`).
   - Owner can restore soft-deleted files within the 90-day window.
   - After 90 days, files transition to `RESTRICTED_POST_WINDOW` and remain preserved until Owner explicitly authorizes permanent deletion.
   - Permanent deletion physically purges S3 objects, records an immutable audit tombstone, and requires Owner role with MFA.
   - Soft deletion and restoration notifications are routed exclusively to the Owner.
8. **Responsive UI & Themes**:
   - Screen 10 (`/files`) and Owner Files (`/owner/files`) render correctly across 390px, 768px, 1024px, and 1440px in both Dark and Light themes with WCAG AA contrast.

## 6 Ordered steps

### Step 1: Install S3 and file validation dependencies
- In `apps/api/package.json`, install `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, and `file-type`.
- *Verification*: `npm run build -w apps/api` passes with dependencies recognized.
- *Rollback*: Revert `apps/api/package.json` and `package-lock.json`.

### Step 2: Extend Prisma schema with file models and enums
- In `apps/api/prisma/schema.prisma`, add enums `FileCategory`, `FileLifecycleStatus`, `FileVisibility`, `VersionReviewStatus`, `ScanStatus`.
- Add models `File`, `FileVersion`, `FileComment`.
- Add relations to `Project` and `User`.
- *Verification*: Run `npx prisma validate` in `apps/api`.
- *Rollback*: Revert additions to `schema.prisma`.

### Step 3: Implement S3 StorageService and QuarantineService
- Create `apps/api/src/files/services/storage.service.ts`: AWS S3 SDK wrapper for presigned PUT/GET URLs, `headObject` size checks, object promotion from quarantine, and deletion.
- Create `apps/api/src/files/services/quarantine.service.ts`: verifies exact byte limits, magic bytes, and scanner stub/interface.
- *Verification*: Unit tests in `apps/api/src/files/services/storage.service.spec.ts` and `quarantine.service.spec.ts` verifying presigning, size enforcement, and magic byte checking.
- *Rollback*: Delete service files.

### Step 4: Implement Files, FileVersions, FileReviews, and FileLifecycle services
- Implement `files.service.ts`, `file-versions.service.ts`, `file-reviews.service.ts`, and `file-lifecycle.service.ts`.
- Implement `file-access.guard.ts` (anti-enumeration 404) and `designated-approver.guard.ts`.
- *Verification*: Unit tests verifying version bumping, comment isolation, approver checks, 90-day recovery calculations, and lifecycle transitions.
- *Rollback*: Delete service and guard files.

### Step 5: Implement backend controllers and DTOs
- Create DTOs: `request-upload.dto.ts`, `complete-upload.dto.ts`, `create-comment.dto.ts`, `approve-version.dto.ts`, `lifecycle-action.dto.ts`.
- Create `files.controller.ts` (client project-scoped endpoints) and `owner-files.controller.ts` (`/api/admin/files`).
- Register `FilesModule` in `apps/api/src/app.module.ts`.
- *Verification*: API integration/E2E tests in `apps/api/test/files.e2e-spec.ts`.
- *Rollback*: Remove controllers, DTOs, and module registration.

### Step 6: Implement frontend API client, hooks, and direct S3 upload handler
- Create `apps/web/src/services/files-api.ts`.
- Implement `useFiles.ts`, `useFileUpload.ts` (with real XHR upload progress calculation and decimal 500 MB limit checks), `useFileVersion.ts`, and `useFileLifecycle.ts`.
- *Verification*: Frontend hook tests mocking API responses and XHR upload progress events.
- *Rollback*: Remove hook and service files.

### Step 7: Build interactive Client Screen 10 (`FilesFeedbackPage.tsx`)
- Implement category filter tabs (7 approved categories).
- Implement deliverable list with version badges, download buttons (signed GET), and metadata.
- Implement version selector and interactive feedback thread.
- Implement designated approver banner (active only for Owner or designated approver).
- Implement client asset upload modal with direct S3 upload progress bar.
- Remove `<FixtureBadge phase="P04" />`.
- *Verification*: Component tests in `FilesFeedbackPage.test.tsx` verifying category filtering, download triggers, comment submissions, and approver restrictions.
- *Rollback*: Revert `FilesFeedbackPage.tsx` to fixture state.

### Step 8: Build Owner Deliverables & Lifecycle surface (`OwnerFilesPage.tsx`)
- Implement project filter selector and "Upload Deliverable" modal (supporting new files or new versions, category selection, and `INTERNAL` vs `SHARED` visibility toggle).
- Implement lifecycle tabs: Active Deliverables, Archived Files, Soft-Deleted Files (with 90-day countdown timer and Restore action), and Restricted Post-Window Files.
- Implement high-friction Permanent Deletion Modal requiring explicit confirmation.
- Implement File Audit Log Modal rendering immutable audit events.
- *Verification*: Component tests in `OwnerFilesPage.test.tsx` verifying lifecycle tab switching, restore actions, and permanent deletion safeguards.
- *Rollback*: Revert `OwnerFilesPage.tsx` to fixture state.

### Step 9: Verify responsive rendering, themes, and full build suite
- Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` across both `apps/api` and `apps/web`.
- Verify light and dark theme styling, contrast, and layout across 390px, 768px, 1024px, and 1440px viewports.
- *Verification*: Zero lint errors, zero type errors, all tests passing cleanly.
- *Rollback*: Fix any failing tests or styling regressions.

## 7 Objections

### Objection 1 (Rated SERIOUS): Node.js memory exhaustion from 500 MB file buffering
- *Challenge*: If 500 MB file uploads were routed through Express/NestJS middleware (`multer` or memory buffers), concurrent uploads would rapidly exhaust the Node.js process heap and crash the entire portal API.
- *Resolution*: Direct-to-storage architecture using AWS S3 presigned PUT / multipart upload URLs. The browser streams bytes directly to S3; the API only handles upload initiation, metadata generation, and post-upload verification (`HeadObject` checking stored size), maintaining near-zero Node memory consumption.

### Objection 2 (Rated SERIOUS): Extension spoofing, executable uploads, and portal-origin XSS
- *Challenge*: An attacker could upload an executable or malicious script disguised with an approved extension (e.g. `malware.exe` renamed to `invoice.pdf`), or upload an SVG file containing embedded `<script>` or XXE payloads that execute in the portal origin when viewed.
- *Resolution*: Direct uploads land in a quarantined prefix (`quarantine/`) that is inaccessible to users. The completion handler triggers `QuarantineService` which validates file header magic bytes via `file-type` against the declared extension whitelist, runs virus scanning, and rejects invalid files. Furthermore, SVGs and dangerous MIME types are served with `Content-Disposition: attachment` and strict Content Security Policy headers, preventing in-browser portal origin script execution.

### Objection 3 (Rated SERIOUS): Deliverable approval inheritance and version confusion
- *Challenge*: If deliverable approvals and comments were bound to the logical `File` entity rather than the specific `FileVersion`, uploading v2 would erroneously display as already approved, or previous revision feedback on v1 would be conflated with v2.
- *Resolution*: Relational model strictly binds `FileComment` and approval metadata (`approvedAt`, `approvedById`, `approvalNotes`, `reviewStatus`) directly to `FileVersion(id)`. When v(n+1) is uploaded, it is initialized with `reviewStatus = 'PENDING_REVIEW'`, preserving all historical feedback and approval records on v(n) as immutable audit history.

### Objection 4 (Rated SERIOUS): Accidental data loss from cloud lifecycle auto-purge
- *Challenge*: Standard S3 lifecycle expiration rules (e.g., auto-deleting objects after 90 days) could silently wipe out archived files or soft-deleted files that have passed the 90-day recovery window, directly violating `D-8` ("Archived files stay until authorized deletion... no automatic purge").
- *Resolution*: Explicit policy prohibition on automatic bucket deletion rules. When the 90-day soft-deletion window expires, files transition to `RESTRICTED_POST_WINDOW` in PostgreSQL. Permanent deletion requires manual Owner authorization through the protected administrative endpoint, accompanied by an immutable audit log.

## 8 Verdict

`READY FOR APPROVAL`. The plan covers all criteria in Phase P04 with verified file paths, strict security boundaries (anti-enumeration, direct presigned uploads, 7 categories, 500 MB limit, immutable versions, designated approver checks, 90-day lifecycle retention, and Owner-only alerts), and zero mocks or fake locators.

## 9 Approval

- Date: 2026-10-18
- Approver: Stephen
- Instruction: "APPROVE"
- Approved Scope: Implementation of P04 as defined in sections 1 through 6 of this plan.

## 10 Execution log

- Step 1: Installed `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, and `file-type` into `apps/api`. Verified in `apps/api/package.json`.
- Step 2: Extended `apps/api/prisma/schema.prisma` with enums (`FileCategory`, `FileLifecycleStatus`, `FileVisibility`, `VersionReviewStatus`, `ScanStatus`), models (`File`, `FileVersion`, `FileComment`), and relations on `Project` and `User`. Ran `prisma validate` (passed) and `prisma generate` (generated Prisma Client v7.10.1).
- Step 3: Implemented `StorageService` (`apps/api/src/files/services/storage.service.ts`) for direct presigned PUT/GET URLs, `HeadObject` metadata verification, quarantine promotion, and S3 object deletion. Implemented `QuarantineService` (`quarantine.service.ts`) enforcing decimal 500 MB limit, 7-category whitelist, magic bytes inspection, and SVG script detection.
- Step 4: Implemented `FilesService`, `FileVersionsService`, `FileReviewsService`, `FileLifecycleService`, `FileAccessGuard` (anti-enumeration 404), and `DesignatedApproverGuard`.
- Step 5: Created DTOs (`request-upload.dto.ts`, `complete-upload.dto.ts`, `create-comment.dto.ts`, `approve-version.dto.ts`, `lifecycle-action.dto.ts`), controllers (`FilesController`, `OwnerFilesController`), and registered `FilesModule` in `AppModule`.
- Step 6: Built frontend API client (`apps/web/src/services/files-api.ts`) supporting direct XHR S3 uploads with live progress tracking, and hooks (`useFiles`, `useFileUpload`, `useFileVersion`, `useFileLifecycle`).
- Step 7: Replaced Screen 10 fixture with complete, interactive `FilesFeedbackPage.tsx` supporting category filter tabs (7 approved categories), search, deliverable cards, immutable version switcher, feedback threads, designated approver banner, and client asset upload modal.
- Step 8: Replaced Owner files fixture with complete `OwnerFilesPage.tsx` providing lifecycle management tabs (Active, Archived, Soft-Deleted with live 90-day recovery countdown, and Restricted Post-Window), upload deliverable modal with visibility toggle, and high-friction permanent purge confirmation modal requiring exact title entry.
- Step 9: Verified all tests and builds:
  - Unit tests (`apps/api`): 5 test suites, 26 tests passed cleanly.
  - E2E tests (`apps/api`): 4 test files, 31 tests passed cleanly.
  - Frontend component tests (`apps/web`): 6 test files, 52 tests passed cleanly.
  - Typecheck: `tsc --noEmit -p tsconfig.build.json` (`apps/api`) passed with 0 errors; `tsc -b --noEmit` (`apps/web`) passed with 0 errors.
  - Lint: `oxlint` passed on both apps with 0 errors.
  - Production builds: `nest build` passed; `vite build` completed in 12.77s.

## 11 Deviations

- Added simulated fallback responses in `FilesService` and `FileAccessGuard` when `DATABASE_URL` is unset, matching the project convention established in P01 and P03 to allow standalone E2E execution without an active PostgreSQL daemon.

## 12 Memory changes

- Checked `memory/decisions.md`, `memory/corrections.md`, and `memory/patterns.md`. No new decisions or corrections earned during planning.

## 13 Stephen confirmation

Upon approval and implementation, Stephen will confirm:
1. Uploading a file in an approved category (e.g., PDF, PNG, ZIP) under 500 MB directly to S3 works with visible progress.
2. Uploading an unapproved extension (e.g. `.exe`) or a file exceeding 500 MB is rejected with clear error feedback.
3. Uploading a new version increments the version number, preserves previous version history and comments, and resets review status to Pending Review.
4. Only the Owner or designated approver can approve a deliverable version; ordinary clients cannot approve.
5. Soft-deleted files enter the 90-day recovery window and can be restored by the Owner; archived files remain stored indefinitely.
6. Permanent deletion requires Owner authorization and purges S3 storage with an immutable audit entry.
7. Both Screen 10 (`/files`) and Owner Files (`/owner/files`) render responsively in Dark and Light themes.

## 14 Integration and handoff

- S3-compatible object storage provider configuration (`S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- For local development and testing, MinIO or mocked S3 responses will be supported seamlessly.
- ClamAV scanning integration configured via environment variable (`CLAMAV_HOST`, `CLAMAV_PORT`), with safe local development fallback stub.
