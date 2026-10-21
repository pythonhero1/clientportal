# Cal.com Booking Integration and Unified Project Calendar

- Task: P07 implement Cal.com booking embed, HMAC-SHA256 signed webhook processing, provider-supported reschedule/cancel actions, replay-safe meeting reconciliation, anti-tampering booking tokens, unified project calendar combining authorized meetings, milestones, and billing-scoped due invoices, and responsive interfaces for Screen 14 (`/meetings`, Figma `5:180`) and Owner meeting administration (`/owner/meetings`)
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-19
- Workspace: one portal repository

## 1 Task

Implement the complete Cal.com booking integration and unified project calendar engine across backend and frontend, including PostgreSQL models for scheduled meetings and provider sync state; HMAC-SHA256 webhook signature verification (`X-Cal-Signature-256`) with audit-logged replay deduplication; cryptographically signed booking tokens preventing malicious cross-project injection; provider-supported reschedule and cancellation action hooks; a unified project calendar aggregating authorized meetings, project milestones, checkpoint deadlines, and strictly billing-restricted due invoices (hidden with 404/omission from non-billing collaborators); dual timezone presentation (`Africa/Lagos` per D-15 and browser-detected local time); and responsive, accessible interfaces for Client Screen 14 (`/meetings`, Figma `5:180`) and the Owner meeting administration suite (`/owner/meetings`).

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-13 - Delegated design access and meetings`: "Prioritize individual screen appearance over conflicting Foundations colors; use temporary collaborator access or external Bitwarden Send for passwords; retain Cal.com."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files

#### Backend (`apps/api`):
- `apps/api/prisma/schema.prisma:121-185, 520-563`:
  - Add enum:
    - `MeetingStatus` (`ACCEPTED`, `RESCHEDULED`, `CANCELLED`, `REJECTED`)
  - Add model:
    - `Meeting` (`id`, `calBookingUid`, `calBookingId`, `projectId`, `clientId`, `title`, `description`, `status`, `startTime`, `endTime`, `timezone`, `meetingUrl`, `rescheduleUrl`, `cancelUrl`, `cancellationReason`, `rescheduledFromUid`, `rescheduledToUid`, `attendees`, `metadata`, `createdById`, timestamps)
  - Extend existing models:
    - `User` (`apps/api/prisma/schema.prisma:121-148`): add `clientMeetings Meeting[] @relation("ClientMeetings")`.
    - `Project` (`apps/api/prisma/schema.prisma:162-183`): add `meetings Meeting[]`.
- `apps/api/src/app.module.ts:13-33`:
  - Import and register `MeetingsModule` and `CalendarModule`.
- `apps/api/src/webhooks/webhooks.module.ts:1-13`:
  - Register `CalComWebhookController` and `CalComWebhookService`.

#### Frontend (`apps/web`):
- `apps/web/src/routes/AppRoutes.tsx:23, 30-37, 66, 73-82`:
  - Import `OwnerMeetingsPage`.
  - Connect real data-driven `MeetingsCalendarPage` for `/meetings` (Screen 14, Figma `5:180`).
  - Register `<Route path="/owner/meetings" element={<OwnerMeetingsPage />} />` under Owner shell.
- `apps/web/src/layouts/components/Sidebar.tsx:51-62`:
  - Add `{ to: '/owner/meetings', label: 'Meetings & Schedule', icon: Calendar }` to `ownerNav`.
- `apps/web/src/routes/AppRoutes.test.tsx:103-106`:
  - Maintain existing Screen 14 rendering test and add Owner `/owner/meetings` route test.
- `apps/web/src/features/meetings/pages/MeetingsCalendarPage.tsx:1-74`:
  - Replace static placeholder mockup (`<FixtureBadge phase="P07" />` and dummy cards) with live interactive client calendar and booking management interface.

### 3.2 Proposed new files

#### Backend (`apps/api`):
- `apps/api/src/meetings/meetings.module.ts`: NestJS module bundling controllers, services, guards, and Prisma integration for meetings.
- `apps/api/src/meetings/meetings.controller.ts`: Client endpoints under `/api/projects/:projectId/meetings` and `/api/meetings` protected by `ClerkAuthGuard`, `AccountStatusGuard`, and `ProjectAccessGuard`.
- `apps/api/src/meetings/controllers/owner-meetings.controller.ts`: Owner endpoints under `/api/admin/meetings` protected by `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), and `OwnerMfaGuard`.
- `apps/api/src/meetings/services/meetings.service.ts`: Meeting querying, status updates, client assignment, and cryptographic HMAC-SHA256 signed booking token issuance.
- `apps/api/src/meetings/dto/create-booking-token.dto.ts`: DTO for requesting a signed booking token for a specific project.
- `apps/api/src/meetings/dto/update-meeting.dto.ts`: DTO for Owner updating meeting notes, project association, or status.
- `apps/api/src/calendar/calendar.module.ts`: NestJS module bundling unified calendar aggregation.
- `apps/api/src/calendar/calendar.controller.ts`: Client endpoint `/api/projects/:projectId/calendar` aggregating meetings, milestones, checkpoints, and conditional invoices.
- `apps/api/src/calendar/controllers/owner-calendar.controller.ts`: Owner endpoint `/api/admin/calendar` aggregating cross-project calendar events.
- `apps/api/src/calendar/services/calendar.service.ts`: Aggregation engine combining `Meeting`, `Milestone`, and `Invoice` with strict `isDesignatedBillingContact` visibility filtering.
- `apps/api/src/webhooks/calcom-webhook.controller.ts`: Public webhook endpoint `/api/webhooks/calcom` receiving signed POST requests from Cal.com.
- `apps/api/src/webhooks/calcom-webhook.service.ts`: Service handling raw body HMAC-SHA256 signature verification (`X-Cal-Signature-256`), audit-logged idempotency deduplication, tamper-proof project/user matching, and event dispatch (`BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`).
- `apps/api/src/meetings/services/meetings.service.spec.ts`: Unit tests for booking token creation/verification, tamper-detection, and meeting scoping.
- `apps/api/src/calendar/services/calendar.service.spec.ts`: Unit tests for calendar event aggregation, timeline sorting, and billing contact filtering.
- `apps/api/src/webhooks/calcom-webhook.service.spec.ts`: Unit tests for webhook signature validation, replay protection, and status transitions.
- `apps/api/test/calendar-meetings.e2e-spec.ts`: E2E integration test suite verifying Cal.com webhook lifecycle, tamper-resistance, client isolation, timezone output, and billing-contact calendar privacy.

#### Frontend (`apps/web`):
- `apps/web/src/services/meetings-api.ts`: API client handling project meetings, booking token generation, and single meeting details.
- `apps/web/src/services/calendar-api.ts`: API client handling unified project calendar queries.
- `apps/web/src/features/meetings/hooks/useMeetings.ts`: React Query hook for project meetings.
- `apps/web/src/features/meetings/hooks/useProjectCalendar.ts`: React Query hook for aggregated calendar events with month/year navigation and type filters.
- `apps/web/src/features/meetings/components/CalendarMonthView.tsx`: Accessible, responsive calendar grid component with day cells, event badges, and keyboard navigation.
- `apps/web/src/features/meetings/components/CalendarAgendaView.tsx`: Chronological timeline list view for mobile and compact desktop viewing.
- `apps/web/src/features/meetings/components/CalComEmbedModal.tsx`: Responsive modal rendering Cal.com hosted embed with signed booking token and automatic theme synchronization (`dark`/`light`).
- `apps/web/src/features/meetings/components/MeetingDetailModal.tsx`: Modal displaying meeting details, organizer, attendees, video call link (Google Meet), and provider reschedule/cancel triggers.
- `apps/web/src/features/meetings/components/CalendarFilterBar.tsx`: Filter buttons for toggling event types (`Meetings`, `Milestones`, and `Invoices` when authorized).
- `apps/web/src/features/meetings/components/TimezoneBadge.tsx`: Visual indicator displaying current timezone and allowing toggle between Stephen's local time (`Africa/Lagos`) and user's browser timezone.
- `apps/web/src/features/owner/pages/OwnerMeetingsPage.tsx`: Owner administrative meeting management surface with project filter, status filter, Cal.com configuration status card, and manual meeting assignment.
- `apps/web/src/features/owner/hooks/useOwnerMeetings.ts`: React Query hook for Owner meetings management.
- `apps/web/src/features/owner/components/AssignMeetingProjectModal.tsx`: Modal allowing Stephen to link an external or unassigned booking to a specific project.
- `apps/web/src/features/meetings/pages/MeetingsCalendarPage.test.tsx`: Component tests for Screen 14 client interactions, view toggling, and Cal.com modal launch.
- `apps/web/src/features/owner/pages/OwnerMeetingsPage.test.tsx`: Component tests for Owner meeting administration.

## 4 Contract status

| Interface / Endpoint | Status | Producer | Consumer | Permissions & Checks | Description & Fields |
| --- | --- | --- | --- | --- | --- |
| `POST /api/webhooks/calcom` | Proposed for review | `CalComWebhookController` | Cal.com Webhook Dispatcher | Public with HMAC-SHA256 `X-Cal-Signature-256` verification (offline test fallback when secret unset) | Ingests Cal.com webhook events (`BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`). Validates signature against `CALCOM_WEBHOOK_SECRET`. Checks `AuditLog` for duplicate UID/event. Verifies signed booking token to ensure project membership before associating booking. Returns `{ received: true }` or `{ received: true, duplicate: true }`. |
| `POST /api/projects/:projectId/meetings/booking-token` | Proposed for review | `MeetingsController` | React `CalComEmbedModal` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard` | Generates short-lived HMAC-SHA256 signed tracking token for `:projectId`. Payload: `{ projectId, userId, expiresAt }`. Returns `{ token: string, expiresAt: string, calUsername: string, eventSlug: string }`. Returns `404` for unauthorized project. |
| `GET /api/projects/:projectId/meetings` | Proposed for review | `MeetingsController` | React `MeetingsCalendarPage` | Same Client project guards | Returns list of meetings associated with `:projectId` and caller's client account. Fields: `id`, `calBookingUid`, `title`, `description`, `status`, `startTime`, `endTime`, `timezone`, `meetingUrl`, `rescheduleUrl`, `cancelUrl`, `attendees`. Returns `404` for foreign project. |
| `GET /api/projects/:projectId/calendar` | Proposed for review | `CalendarController` | React `MeetingsCalendarPage` | Same Client project guards | Aggregates calendar items for month/range. Returns `{ events: CalendarEvent[], timezone: string }`. If caller has `isDesignatedBillingContact === true`, includes `INVOICE` items (`status`, `dueDate`, `totalAmount`, `balanceDue`); otherwise **strictly omits** invoice items. Returns `404` for foreign project. |
| `GET /api/meetings` | Proposed for review | `MeetingsController` | React Global Shell | `ClerkAuthGuard`, `AccountStatusGuard` | Returns user's upcoming meetings across all assigned projects. |
| `GET /api/admin/meetings` | Proposed for review | `OwnerMeetingsController` | React `OwnerMeetingsPage` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Returns global list of all meetings across all clients/projects. Filterable by `projectId`, `status`, `from`, `to`. Fields include client name, project title, Cal.com UID, meeting URL, and attendee details. |
| `PATCH /api/admin/meetings/:meetingId` | Proposed for review | `OwnerMeetingsController` | React `AssignMeetingProjectModal` | Same Owner guards | Manually reassigns meeting `:meetingId` to a specific `projectId`, updates notes, or flags status. Fields: `projectId`, `description`. |
| `GET /api/admin/calendar` | Proposed for review | `OwnerCalendarController` | React `OwnerMeetingsPage` | Same Owner guards | Returns master calendar containing all meetings, milestones, and all invoices across all projects. |

## 5 Scope and acceptance

### 5.1 Quoted Requirements

- `BUILD-PLAN.md:141-146`:
  > "### P07 Cal.com and the project calendar
  > Configure the selected event type and calendar in Cal.com. Embed booking, expose provider-supported reschedule/cancel actions, verify webhooks, reconcile meetings and combine authorized meetings, milestones, due invoices and deadlines in the project calendar.
  > Exit: a real test booking, reschedule and cancellation produce the correct Client/Owner view in the correct timezone; repeated events do not duplicate bookings; unrelated calendar data never appears."
- `docs/INTEGRATIONS.md:15-22`:
  > "Use the supplied Cal.com direction, with a hosted embed for booking and provider-supported reschedule/cancel controls. Use verified server webhooks and a permitted API reconciliation path for portal meeting records. Do not rebuild availability or create a second booking database as the authority for free slots.
  > Stephen must configure the Cal.com account, relevant event type, connected calendar, allowed booking access and webhook capabilities. Calendar-provider choice and account plan are not selected merely by choosing Cal.com.
  > Map a verified booking to an authorized portal user/project. Do not attach a booking to an arbitrary project ID received from a public embed. Deduplicate repeated and out-of-order events. Test booking, reschedule and cancellation, timezone conversion and the project's combined meetings/milestones/invoice calendar. Expose only permitted calendar entries."
- `docs/SCREEN-MAP.md:22, 30`:
  > "14 | Meetings and Calendar | 5:180 | /meetings | Cal.com booking/reschedule/cancel and scoped project calendar, synchronized from trusted events."
  > "No Owner reference screens were supplied. Propose the minimum matching Owner interface to operate Client approval/invitations, project/website assignment, milestones/onboarding, Drive links, file versions/review/lifecycle, invoices, messages/groups, meetings, push configuration and support/help content."
- `docs/ACCEPTANCE-CHECKLIST.md:71-73`:
  > "- [ ] Repeated/out-of-order payment and Cal.com events are safe.
  > - [ ] Booking, reschedule and cancellation reconcile correctly across timezone displays.
  > - [ ] Calendar entries are scoped to authorized projects and billing access."
- `docs/PERMISSIONS.md:31-33`:
  > "Authorize every query and mutation in NestJS. Scope lists, counts, search, activity feeds, calendar events, file issuance, Drive-link metadata and push recipients. Returning an ID, document title or invoice total can itself disclose another Client's information."

### 5.2 Measurable Acceptance Criteria

1. **HMAC Webhook Verification:**
   - Valid `X-Cal-Signature-256` matching `process.env.CALCOM_WEBHOOK_SECRET` returns HTTP 200 and processes event.
   - Missing or invalid signature returns HTTP 400 `Invalid Cal.com webhook signature.`
   - In offline test mode (`NODE_ENV === 'test'` or secret unset), webhook processes mock payload safely.
2. **Replay & Idempotency Safety:**
   - Re-delivering the exact same Cal.com webhook event UID returns HTTP 200 `{ received: true, duplicate: true }` without inserting a second meeting record or altering audit logs.
3. **Anti-Tampering Project Association:**
   - Client opening Cal.com embed receives an HMAC-signed token linking their `userId` and `projectId`.
   - Webhook verifying the token checks database membership (`ProjectMembership`). If valid, meeting is linked to `projectId` and `clientId`.
   - If a malicious client modifies `metadata[projectId]` to a victim project ID without a valid signed token proving membership, the webhook refuses project association and logs a security audit warning.
4. **Lifecycle Reconciliation (Booking, Reschedule, Cancel):**
   - `BOOKING_CREATED`: Creates `Meeting` with status `ACCEPTED`.
   - `BOOKING_RESCHEDULED`: Updates `startTime`, `endTime`, `rescheduledFromUid`, and marks status `RESCHEDULED` or updates existing record.
   - `BOOKING_CANCELLED`: Updates status to `CANCELLED`, stores `cancellationReason`, and preserves record in history.
5. **Billing-Scoped Unified Calendar Aggregation:**
   - Querying `GET /api/projects/:projectId/calendar` returns combined timeline of Meetings, Milestones, and Invoices.
   - For an authorized user who is a designated billing contact (`isDesignatedBillingContact === true`), due invoices appear with due date, status, total, and balance.
   - For a collaborator who is NOT a designated billing contact (`isDesignatedBillingContact === false`), invoices are **completely omitted** from the calendar events list.
   - Querying calendar for an unauthorized `projectId` returns HTTP 404 (anti-enumeration).
6. **Dual Timezone Presentation:**
   - Server returns UTC ISO timestamps.
   - Frontend defaults to Stephen's business timezone `Africa/Lagos` (per D-15) and offers a one-click toggle to the client's detected browser timezone with clear badge indication.
7. **Complete Responsive UI:**
   - Client Screen 14 (`/meetings`, Figma `5:180`) supports Month grid view and Agenda list view across desktop, tablet, and mobile in dark and light themes.
   - Owner management page (`/owner/meetings`) displays all client meetings, project filters, status badges, and action to launch host booking or manually assign projects.

## 6 Ordered steps

### Step 1: Database Schema Expansion (Prisma)
- Edit `apps/api/prisma/schema.prisma` to add `MeetingStatus` enum, `Meeting` model, and relations to `User` (`clientMeetings`) and `Project` (`meetings`).
- Run `npx prisma generate` in `apps/api` to generate updated Prisma client types.
- Verification: Run TypeScript check on `apps/api` to verify schema compilation.
- Rollback: Revert `schema.prisma` edits and re-run `prisma generate`.

### Step 2: Cal.com Webhook Ingestion & Signature Verification
- Create `apps/api/src/webhooks/calcom-webhook.controller.ts` and `apps/api/src/webhooks/calcom-webhook.service.ts`.
- Register in `apps/api/src/webhooks/webhooks.module.ts`.
- Implement HMAC-SHA256 signature checking using `req.rawBody` and `crypto.timingSafeEqual`.
- Implement `AuditLog` idempotency checking for `calBookingUid`.
- Implement event routing for `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`.
- Verification: Create and execute unit tests in `apps/api/src/webhooks/calcom-webhook.service.spec.ts`.
- Rollback: Remove the two webhook files and unregister from `webhooks.module.ts`.

### Step 3: Meetings Module, Token Signing & Scoped Endpoints
- Create `apps/api/src/meetings/meetings.module.ts`, `meetings.controller.ts`, `controllers/owner-meetings.controller.ts`, and `services/meetings.service.ts`.
- Implement cryptographically signed booking token generator in `MeetingsService`.
- Implement project-scoped meetings list endpoint with `ClerkAuthGuard`, `AccountStatusGuard`, and `ProjectAccessGuard`.
- Implement Owner meetings management endpoints under `/api/admin/meetings`.
- Register `MeetingsModule` in `apps/api/src/app.module.ts`.
- Verification: Run unit tests `apps/api/src/meetings/services/meetings.service.spec.ts`.
- Rollback: Remove meetings module files and remove from `app.module.ts`.

### Step 4: Unified Calendar Aggregation Engine
- Create `apps/api/src/calendar/calendar.module.ts`, `calendar.controller.ts`, `controllers/owner-calendar.controller.ts`, and `services/calendar.service.ts`.
- Implement multi-entity query merging `Meeting`, `Milestone`, and `Invoice`.
- Enforce strict `isDesignatedBillingContact` check: if caller is not billing contact and not Owner, exclude all `Invoice` records.
- Implement anti-enumeration 404 for unassigned projects.
- Register `CalendarModule` in `apps/api/src/app.module.ts`.
- Verification: Run unit tests `apps/api/src/calendar/services/calendar.service.spec.ts`.
- Rollback: Remove calendar module files and remove from `app.module.ts`.

### Step 5: Backend E2E Test Suite
- Create `apps/api/test/calendar-meetings.e2e-spec.ts`.
- Verify webhook signature validation (valid, invalid, offline).
- Verify idempotency on repeated deliveries.
- Verify tamper-proof project matching with signed tokens.
- Verify status transitions (create -> reschedule -> cancel).
- Verify calendar aggregation and billing contact invoice segregation (Client A billing sees invoice; Client A collaborator does not; Client B gets 404 on Client A's project).
- Verification: Execute `npm run test:e2e -- calendar-meetings.e2e-spec.ts` in `apps/api`.
- Rollback: Remove the test file.

### Step 6: Frontend API Clients & React Query Hooks
- Create `apps/web/src/services/meetings-api.ts` and `apps/web/src/services/calendar-api.ts`.
- Create `apps/web/src/features/meetings/hooks/useMeetings.ts`, `useProjectCalendar.ts`, and `apps/web/src/features/owner/hooks/useOwnerMeetings.ts`.
- Implement authenticated API calls with token passing and error handling.
- Verification: Run TypeScript build in `apps/web` to confirm types.
- Rollback: Remove new service and hook files.

### Step 7: Frontend Calendar & Booking Components
- Create `apps/web/src/features/meetings/components/CalendarMonthView.tsx` (accessible grid).
- Create `apps/web/src/features/meetings/components/CalendarAgendaView.tsx` (chronological list).
- Create `apps/web/src/features/meetings/components/CalComEmbedModal.tsx` (clean zero-dependency iframe embed with signed token and theme matching).
- Create `apps/web/src/features/meetings/components/MeetingDetailModal.tsx` (meeting metadata, video link, reschedule/cancel triggers).
- Create `apps/web/src/features/meetings/components/CalendarFilterBar.tsx` and `TimezoneBadge.tsx`.
- Verification: Run component tests for calendar views.
- Rollback: Remove component files.

### Step 8: Client Screen 14 (`/meetings`, Figma `5:180`) Implementation
- Update `apps/web/src/features/meetings/pages/MeetingsCalendarPage.tsx`:
  - Replace fixture badge and static text with interactive header, "Schedule Call" button triggering embed modal, month/agenda toggle, timezone switcher (`Africa/Lagos` vs local), and event filters.
  - Connect to `useProjectCalendar` and `useMeetings`.
- Verification: Run `npm test -- MeetingsCalendarPage.test.tsx` in `apps/web`.
- Rollback: Revert `MeetingsCalendarPage.tsx` to fixture state.

### Step 9: Owner Meetings Suite (`/owner/meetings`) & Shell Integration
- Create `apps/web/src/features/owner/pages/OwnerMeetingsPage.tsx` and `components/AssignMeetingProjectModal.tsx`.
- Update `apps/web/src/routes/AppRoutes.tsx` to register `/owner/meetings`.
- Update `apps/web/src/layouts/components/Sidebar.tsx` to add "Meetings & Schedule" to `ownerNav`.
- Update `apps/web/src/routes/AppRoutes.test.tsx` to test `/owner/meetings`.
- Verification: Run `npm test -- AppRoutes.test.tsx OwnerMeetingsPage.test.tsx` in `apps/web`.
- Rollback: Revert AppRoutes and Sidebar changes; remove owner meetings page.

### Step 10: Full Verification & Linting
- Run full test suite in `apps/api` (`npm test`, `npm run test:e2e`).
- Run full test suite and build in `apps/web` (`npm test`, `npm run build`).
- Verify zero regression in existing test suites (`auth-isolation`, `projects-onboarding`, `files`, `messages`).
- Verification: Document exact command outputs and locators in Section 10.
- Rollback: Fix any detected regressions.

## 7 Objections

### Objection 1 (Blocker): An attacker could tamper with public Cal.com booking embed URLs to inject arbitrary `projectId` metadata and associate meetings with competitor/victim projects.
- Severity: Blocker
- Rationale: Cal.com embeds run on client browsers where query parameters can be manipulated (e.g. `?metadata[projectId]=prj_victim`). If the webhook handler trusts this metadata unconditionally, unrelated clients' calendars could be polluted or disclosed.
- Resolution: Multi-tier anti-tampering protocol:
  1. The portal issues a short-lived HMAC-SHA256 signed booking token (`POST /api/projects/:projectId/meetings/booking-token`) containing `{ projectId, userId, expiresAt }`.
  2. When the webhook arrives, the backend validates the token signature and expiration.
  3. The backend independently verifies that the attendee email matches the `User` and confirms active `ProjectMembership`. If membership is absent, project association is **rejected** and logged in `AuditLog`.

### Objection 2 (Serious): Confidential invoices would leak to unauthorized client team members if the unified calendar naively aggregates all project events.
- Severity: Serious
- Rationale: P07 requires combining meetings, milestones, and due invoices on the project calendar. Under `D-5` and `docs/PERMISSIONS.md:18-19`, ordinary project collaborators (e.g. developers, designers) must never see billing information or invoice totals.
- Resolution: Strict capability filtering in `CalendarService`:
  - When building the calendar event feed, check caller role and membership:
    - If `user.role === 'Owner'`, include all project invoices.
    - If `user.role === 'Client'`, check `ProjectMembership.isDesignatedBillingContact`. If `false`, strictly omit all invoice events from the response.
    - Add explicit test in `calendar-meetings.e2e-spec.ts` proving that a non-billing client collaborator sees milestones and meetings but zero invoices.

### Objection 3 (Serious): Timezone discrepancies between Stephen in Nigeria (`Africa/Lagos`) and international clients could lead to missed appointments.
- Severity: Serious
- Rationale: Cal.com schedules slots in specific timezones. If the portal converts times ambiguously or without explicit timezone labels, clients may expect meetings at the wrong local time.
- Resolution: Strict timezone contract:
  - All database timestamps are stored in UTC (`DateTime` in PostgreSQL).
  - Webhook payloads parse ISO strings directly into UTC.
  - The UI defaults to Stephen's business timezone `Africa/Lagos` (per D-15) and provides an immediate toggle to the client's browser local timezone with a persistent `TimezoneBadge` showing the exact offset (e.g. `WAT / UTC+1`).

### Objection 4 (Minor): The official `@calcom/embed-react` npm package has peer dependency conflicts with React 19 (`^18.2.0` vs portal's `^19.2.8`).
- Severity: Minor
- Rationale: Forcing installation with `--legacy-peer-deps` risks bundling issues and version instabilities in modern React 19 setups.
- Resolution: Zero-dependency responsive embed:
  - Implement `<CalComEmbedModal />` using a high-performance responsive iframe container loading `https://cal.com/${calUsername}/${eventSlug}?embed=true` with prefilled parameters and postMessage communication for modal auto-closing on successful booking.

## 8 Verdict

READY FOR APPROVAL.

The plan resolves all security, anti-tampering, billing privacy, and timezone boundaries. Implementation will commence upon Stephen's explicit approval.

## 9 Approval

- Approval Status: APPROVED
- Date: 2026-10-19
- Stephen's Exact Words: "APPROVE"
- Approved Scope: Full P07 scope as defined in Sections 5 and 6 of this plan, including Prisma schema updates, Cal.com webhook processing with HMAC-SHA256 signature verification and idempotency, signed booking token generation, meeting and calendar endpoints, billing-scoped calendar aggregation, Client Screen 14 (`/meetings`), and Owner meeting administration (`/owner/meetings`).

## 10 Execution log

- Database Schema & Prisma Client:
  - Extended `apps/api/prisma/schema.prisma` with `MeetingStatus` enum, `Meeting` model, and relations on `User` and `Project`.
  - Executed `npx.cmd prisma generate` successfully with exit code 0.
- Backend Services & Controllers:
  - Implemented `apps/api/src/webhooks/calcom-webhook.service.ts` with HMAC-SHA256 signature verification (`X-Cal-Signature-256`), replay protection via `AuditLog`, signed booking token verification, and lifecycle event handlers.
  - Implemented `apps/api/src/webhooks/calcom-webhook.controller.ts` (`POST /api/webhooks/calcom`).
  - Implemented `apps/api/src/meetings/services/meetings.service.ts` with meeting querying, client assignment, and cryptographic booking token issuance (`POST /api/projects/:projectId/meetings/booking-token`).
  - Implemented `apps/api/src/meetings/meetings.controller.ts` (`/api/projects/:projectId/meetings`, `/api/meetings/token`, `/api/meetings`).
  - Implemented `apps/api/src/meetings/controllers/owner-meetings.controller.ts` (`/api/admin/meetings`).
  - Implemented `apps/api/src/calendar/services/calendar.service.ts` with multi-entity aggregation (meetings, milestones, invoices with strict `isDesignatedBillingContact === true` capability check).
  - Implemented `apps/api/src/calendar/calendar.controller.ts` (`/api/projects/:projectId/calendar`) and `owner-calendar.controller.ts` (`/api/admin/calendar`).
  - Registered `MeetingsModule` and `CalendarModule` in `apps/api/src/app.module.ts`.
- Backend Verification:
  - Compiled backend via `npm.cmd --prefix apps/api run build` (`nest build`) with exit code 0.
  - Executed unit tests: `meetings.service.spec.ts` (1 passed), `calendar.service.spec.ts` (2 passed), `calcom-webhook.service.spec.ts` (4 passed) — 7 passed.
  - Executed E2E integration tests: `apps/api/test/calendar-meetings.e2e-spec.ts` (16 passed) and `apps/api/test/meetings.e2e-spec.ts` (4 passed) — 20 passed.
  - Executed full backend unit test suite: 14 test files, 66 passed (`npm.cmd --prefix apps/api test`).
- Frontend Services, Hooks & Components:
  - Created `apps/web/src/services/meetings-api.ts` and `apps/web/src/services/calendar-api.ts`.
  - Created hooks: `useMeetings.ts`, `useProjectCalendar.ts`, and `useOwnerMeetings.ts`.
  - Implemented UI components: `TimezoneBadge.tsx`, `CalendarFilterBar.tsx`, `CalComEmbedModal.tsx`, `MeetingDetailModal.tsx`, `CalendarMonthView.tsx`, `CalendarAgendaView.tsx`, and `AssignMeetingProjectModal.tsx`.
  - Replaced fixture mockup in `apps/web/src/features/meetings/pages/MeetingsCalendarPage.tsx` with live interactive Screen 14 calendar suite.
  - Implemented Owner suite at `apps/web/src/features/owner/pages/OwnerMeetingsPage.tsx`.
  - Integrated `/owner/meetings` route in `apps/web/src/routes/AppRoutes.tsx` and sidebar link in `apps/web/src/layouts/components/Sidebar.tsx`.
- Frontend Verification:
  - Executed frontend tests: `MeetingsCalendarPage.test.tsx` (4 passed), `OwnerMeetingsPage.test.tsx` (3 passed), `AppRoutes.test.tsx` (28 passed) — 35 tests passed (`vitest run`).
  - Executed production frontend build: `npm.cmd --prefix apps/web run build` (`tsc -b && vite build`) built cleanly in 31.02s with exit code 0.
- Memory & System Integrity:
  - Executed `python tools/check-memory.py`: PASS (6 pass, 1 warn, 0 fail).

## 11 Deviations

1. Zero-dependency Cal.com Embed: The official `@calcom/embed-react` npm package has peer-dependency conflicts with React 19 (`^18.2.0` vs portal's `^19.2.8`). Per Objection 4, implemented `<CalComEmbedModal />` using a high-performance responsive iframe container loading `https://cal.com/${calUsername}/${eventSlug}?embed=true` with prefilled parameters and window `postMessage` listener for booking confirmation.
2. Support API Compatibility Helper: In `apps/web/src/services/support-api.ts`, added a compatibility `supportApi` object export wrapping `listClientTickets` and `createTicket` to ensure zero regression in Screen 17 (`SupportHelpPage.tsx`).

## 12 Memory changes

- Retained existing entries D-1 to D-15 and P-1 to P-3.
- Checked full memory family via `python tools/check-memory.py` with 0 failures.

## 13 Stephen confirmation

- Verification of real test booking, reschedule, and cancellation reflecting in both Client Screen 14 and Owner `/owner/meetings`.
- Verification of calendar event segregation: ordinary client collaborator cannot view due invoices on the calendar.
- Verification that unrelated clients receive HTTP 404 for foreign project calendar access.

## 14 Integration and handoff

- External dependency: Cal.com account and webhook configuration (see `docs/OPEN-DECISIONS.md:Q14`).
- Environment variables required:
  - `CALCOM_WEBHOOK_SECRET`: shared secret for webhook HMAC-SHA256 signature verification.
  - `CALCOM_DEFAULT_USERNAME` / `CALCOM_DEFAULT_EVENT`: fallback event slug (e.g. `stephen/30min`).
- Runbook:
  1. Configure Cal.com webhook URL to point to `https://portal.oderindestephen.com/api/webhooks/calcom` with triggers: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`.
  2. Copy signing secret into `CALCOM_WEBHOOK_SECRET` in `.env.api`.
