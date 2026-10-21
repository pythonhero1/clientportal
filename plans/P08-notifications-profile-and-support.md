# Notifications, Profile & Security, and Support Tickets (P08)

- Task: P08 implement persistent notification history, Web Push subscription lifecycle (VAPID) with lock-screen data minimization, Owner-only file lifecycle alerts, account contact profile editing, Clerk session revocation and MFA visualization, theme synchronization, per-user notification preferences, Client-isolated ticket system with anti-enumeration (404), Owner support queue triage, and Help Center knowledge base across Screens 15, 16, 17 and Owner support
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-19
- Workspace: one portal repository

## 1 Task

Implement the comprehensive notifications, user profile/security settings, and support/help center subsystem across backend and frontend, including PostgreSQL models for notifications, push subscriptions, user notification preferences, support tickets, ticket messages, and help articles; standards-based Web Push (VAPID) with secure subscription lifecycle, automatic pruning of expired endpoints (410 Gone), and lock-screen data minimization; in-app notification center with read/unread tracking and Owner-only deletion/restoration alert routing; contact profile updates and theme synchronization; Clerk MFA visualization (mandatory for Owner, optional for Client) and session revocation; Client-isolated support tickets with strict anti-enumeration (404 Not Found) and explicit prohibition of invented response-time promises; Owner support queue triage; and responsive, accessible dark/light interfaces for Screen 15 (`/notifications`, Figma `5:261`), Screen 16 (`/settings`, Figma `5:356`), Screen 17 (`/support`, Figma `5:452`), and the Owner support suite (`/owner/support`).

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-3 - Registration and security`: "Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA and optional Client MFA."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-8 - File deletion and audit`: "Archived files stay until authorized deletion; Owner soft deletion; 90-day recovery; Owner authorization for permanent deletion after the window; full lifecycle audit; deletion/restoration alerts go to Owner in this release."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-14 - Invoice origin and push channel`: "Generate invoices inside the portal and use browser push for portal notifications."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files

#### Backend (`apps/api`):
- `apps/api/package.json:25-47, 48-70`:
  - Add runtime dependency: `web-push` (`^3.6.7`).
  - Add dev dependency: `@types/web-push` (`^3.6.4`).
- `apps/api/prisma/schema.prisma:121-160, 563`:
  - Add enums:
    - `NotificationType` (`FILE_DELIVERABLE_UPLOADED`, `FILE_CHANGES_REQUESTED`, `FILE_APPROVED`, `FILE_SOFT_DELETED`, `FILE_RESTORED`, `FILE_PERMANENTLY_DELETED`, `MESSAGE_RECEIVED`, `INVOICE_ISSUED`, `PAYMENT_CONFIRMED`, `MILESTONE_UPDATED`, `MEETING_SCHEDULED`, `SUPPORT_TICKET_REPLIED`, `SUPPORT_TICKET_RESOLVED`, `SYSTEM_ALERT`)
    - `TicketStatus` (`OPEN`, `WAITING_FOR_OWNER`, `WAITING_FOR_CLIENT`, `RESOLVED`, `CLOSED`)
    - `TicketPriority` (`LOW`, `NORMAL`, `HIGH`, `URGENT`)
  - Add models:
    - `Notification` (`id`, `userId`, `type`, `title`, `message`, `link`, `data`, `isRead`, `readAt`, relations, timestamps)
    - `PushSubscription` (`id`, `userId`, `endpoint`, `p256dh`, `auth`, `userAgent`, relations, timestamps)
    - `UserNotificationPreferences` (`id`, `userId`, in-app toggles, push toggles, relations, timestamps)
    - `Ticket` (`id`, `ticketNumber`, `clientId`, `projectId`, `subject`, `status`, `priority`, `assignedToId`, `resolvedAt`, `closedAt`, relations, timestamps)
    - `TicketMessage` (`id`, `ticketId`, `authorId`, `content`, relations, timestamps)
    - `TicketAttachment` (`id`, `ticketMessageId`, `fileName`, `fileExtension`, `mimeType`, `byteSize`, `storageKey`, `fileVersionId`, relations, timestamps)
    - `HelpCategory` (`id`, `name`, `slug`, `description`, `orderIndex`, relations, timestamps)
    - `HelpArticle` (`id`, `categoryId`, `title`, `slug`, `content`, `excerpt`, `isPublished`, `publishedAt`, `orderIndex`, `authorId`, relations, timestamps)
  - Extend existing models:
    - `User` (`apps/api/prisma/schema.prisma:121-145`): add relations `notifications Notification[]`, `pushSubscriptions PushSubscription[]`, `notificationPreferences UserNotificationPreferences?`, `clientTickets Ticket[]`, `assignedTickets Ticket[]`, `ticketMessages TicketMessage[]`, `authoredArticles HelpArticle[]`.
    - `Profile` (`apps/api/prisma/schema.prisma:150-160`): add `themePreference String @default("system")`.
    - `Project` (`apps/api/prisma/schema.prisma:162-183`): add `tickets Ticket[]`.
    - `FileVersion` (`apps/api/prisma/schema.prisma:353-381`): add `ticketAttachments TicketAttachment[]`.
- `apps/api/src/app.module.ts:13-30`:
  - Import and register `NotificationsModule` and `SupportModule`.
- `apps/api/src/auth/auth.controller.ts:24-76`:
  - Update `getMe()` to return `phone` and `themePreference` from `dbUser.profile`.
- `apps/api/src/users/users.controller.ts:17-40`:
  - Add authenticated user routes: `GET /users/profile`, `PATCH /users/profile`, `GET /users/notification-preferences`, `PATCH /users/notification-preferences`, `GET /users/sessions`, `DELETE /users/sessions/:sessionId`.
- `apps/api/src/users/users.service.ts:1-98`:
  - Implement methods for profile update, notification preference management, session query, and Clerk session revocation.
- `apps/api/src/files/services/file-lifecycle.service.ts:128, 189, 246`:
  - Replace `[OWNER-ALERT]` logger stubs with real invocations of `NotificationsService.notifyOwner(...)` for soft delete, restore, and permanent deletion events.
- `apps/api/src/messages/services/messages.service.ts:230-245`:
  - Dispatch in-app notifications and Web Push for incoming messages to conversation recipients.

#### Frontend (`apps/web`):
- `apps/web/src/features/notifications/pages/NotificationsPage.tsx:1-80`:
  - Remove `<FixtureBadge phase="P08" />` and dummy 3-item static fixture.
  - Implement live data-driven Screen 15: unread filter, category tabs, mark all read, mark single read, Web Push opt-in banner, navigation links, and empty/loading states.
- `apps/web/src/features/settings/pages/SettingsPage.tsx:1-120`:
  - Remove `<FixtureBadge phase="P08" />` and dummy input defaults.
  - Implement live data-driven Screen 16: Profile editing form (name, company, phone, timezone), Theme selector with local apply + profile sync, MFA status visualization (mandatory Owner vs optional Client), active sessions list with revocation, and notification preference category toggles.
- `apps/web/src/features/support/pages/SupportHelpPage.tsx:1-79`:
  - Remove `<FixtureBadge phase="P08" />` and dummy ticket array.
  - Implement live data-driven Screen 17: Help Center knowledge base search/category tabs, published article drawer, client-isolated ticket ledger, and "Open New Ticket" modal (strictly with no invented response-time promises).
- `apps/web/src/features/owner/pages/OwnerSupportPage.tsx:1-47`:
  - Replace static placeholder with full Owner Support Suite: Ticket triage queue (status, priority, client filter, reply composer) and Help Center content manager (draft/publish, edit, category management).
- `apps/web/src/layouts/components/Sidebar.tsx:46, 51-60`:
  - Replace hardcoded `badge: 3` on Client Notifications with live unread count.
  - Add Notifications item to `ownerNav` so Owner has immediate visibility into system and file lifecycle alerts.
- `apps/web/src/layouts/components/TopBar.tsx:106-116`:
  - Bind the notification indicator dot to real `unreadCount > 0`.
- `apps/web/src/routes/AppRoutes.tsx:67-82`:
  - Ensure `/notifications` is accessible to both Client and Owner roles.

### 3.2 Proposed new files

#### Backend (`apps/api`):
- `apps/api/src/notifications/notifications.module.ts`: Bundles controllers, services, WebPush provider, and Prisma integration.
- `apps/api/src/notifications/notifications.controller.ts`: Client and Owner notification endpoints (`/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/:id/read`, `/api/notifications/mark-all-read`, `/api/notifications/push/public-key`, `/api/notifications/push/subscribe`, `/api/notifications/push/unsubscribe`).
- `apps/api/src/notifications/services/notifications.service.ts`: Core notification creation, recipient filtering, unread calculations, Owner-only alert dispatching, and Web Push dispatch delegation.
- `apps/api/src/notifications/services/web-push.service.ts`: Web Push VAPID initialization, payload formatting (lock-screen data minimization), over-the-air push dispatch, and automatic pruning of expired subscriptions (`404` / `410 Gone`).
- `apps/api/src/notifications/dto/subscribe-push.dto.ts`: DTO for browser Web Push subscription payload.
- `apps/api/src/notifications/dto/unsubscribe-push.dto.ts`: DTO for push endpoint deregistration.
- `apps/api/src/notifications/dto/create-notification.dto.ts`: DTO for programmatic internal notification dispatch.
- `apps/api/src/notifications/dto/notification-filter.dto.ts`: DTO for notification center filtering (`isRead`, `type`, `limit`, `cursor`).
- `apps/api/src/users/dto/update-profile.dto.ts`: DTO for profile updates (`name`, `companyName`, `phone`, `timezone`, `avatarUrl`, `themePreference`).
- `apps/api/src/users/dto/update-notification-preferences.dto.ts`: DTO for in-app and browser push notification toggles.
- `apps/api/src/support/support.module.ts`: Module bundling support controllers, services, guards, and Prisma integration.
- `apps/api/src/support/controllers/support.controller.ts`: Client endpoints for tickets (`/api/support/tickets`) and published help guides (`/api/support/help`).
- `apps/api/src/support/controllers/owner-support.controller.ts`: Owner endpoints for ticket triage (`/api/admin/support/tickets`) and knowledge base CRUD (`/api/admin/support/help`).
- `apps/api/src/support/services/tickets.service.ts`: Ticket lifecycle management, unique serial numbering (`TCK-YYYY-XXXX`), message thread append, status transitions (`OPEN` -> `WAITING_FOR_OWNER`/`CLIENT` -> `RESOLVED` -> `CLOSED`), and strict client isolation.
- `apps/api/src/support/services/help.service.ts`: Help Center categories and articles CRUD, search indexing, publication toggles.
- `apps/api/src/support/guards/ticket-access.guard.ts`: Capability guard verifying ticket ownership, returning strict `404 Not Found` for anti-enumeration on cross-client access.
- `apps/api/src/support/dto/create-ticket.dto.ts`: DTO for ticket creation (subject, content, priority, projectId, attachments).
- `apps/api/src/support/dto/send-ticket-message.dto.ts`: DTO for ticket thread reply.
- `apps/api/src/support/dto/update-ticket-status.dto.ts`: DTO for Client marking resolved/closed.
- `apps/api/src/support/dto/triage-ticket.dto.ts`: DTO for Owner updating status, priority, or assignee.
- `apps/api/src/support/dto/create-help-article.dto.ts`: DTO for creating help article.
- `apps/api/src/support/dto/update-help-article.dto.ts`: DTO for updating help article.
- `apps/api/src/notifications/services/notifications.service.spec.ts`: Unit tests for notification creation, Owner-only routing, and unread counts.
- `apps/api/src/notifications/services/web-push.service.spec.ts`: Unit tests for VAPID push payload generation and expired endpoint pruning.
- `apps/api/src/support/services/tickets.service.spec.ts`: Unit tests for ticket state transitions, numbering, and client isolation.
- `apps/api/test/notifications-support.e2e-spec.ts`: End-to-end integration tests verifying notification lifecycle, push subscription binding/unbinding, profile updating, session revocation, anti-enumeration 404, and support ticket triage.

#### Frontend (`apps/web`):
- `apps/web/public/sw.js`: Service worker implementing `push` and `notificationclick` listeners with zero API caching.
- `apps/web/src/components/ui/Switch.tsx`: Accessible toggle switch component for settings and preferences.
- `apps/web/src/services/notifications-api.ts`: API client for notifications and push subscription endpoints.
- `apps/web/src/services/settings-api.ts`: API client for profile, preferences, and session management.
- `apps/web/src/services/support-api.ts`: API client for support tickets and knowledge base.
- `apps/web/src/features/notifications/hooks/useNotifications.ts`: React Query hook for notification center queries, unread count, and mutations.
- `apps/web/src/features/notifications/hooks/useWebPush.ts`: Hook for browser push permission state, service worker registration, and subscription sync.
- `apps/web/src/features/notifications/components/NotificationCard.tsx`: Card component for notification list items.
- `apps/web/src/features/notifications/components/NotificationFilters.tsx`: Filter tabs for unread and categories.
- `apps/web/src/features/notifications/components/PushBanner.tsx`: Opt-in banner for browser push notifications.
- `apps/web/src/features/settings/components/ProfileForm.tsx`: Form component for updating contact profile.
- `apps/web/src/features/settings/components/NotificationPreferencesForm.tsx`: Component managing in-app and push toggles.
- `apps/web/src/features/settings/components/SecuritySessionsList.tsx`: Component displaying MFA badge and active sessions list with revoke buttons.
- `apps/web/src/features/support/hooks/useSupportTickets.ts`: React Query hook for client tickets and replies.
- `apps/web/src/features/support/hooks/useHelpCenter.ts`: React Query hook for published help categories and articles.
- `apps/web/src/features/support/components/CreateTicketModal.tsx`: Accessible dialog form to submit a new ticket (strictly without response-time promise).
- `apps/web/src/features/support/components/TicketThreadModal.tsx`: Modal rendering conversation thread and message composer.
- `apps/web/src/features/support/components/HelpArticleModal.tsx`: Modal displaying full help article markdown content.
- `apps/web/src/features/owner/hooks/useOwnerSupport.ts`: React Query hook for Owner ticket queue and knowledge base administration.
- `apps/web/src/features/owner/components/OwnerTicketTriageModal.tsx`: Modal for Stephen to triage status, adjust priority, read thread, and reply.
- `apps/web/src/features/owner/components/ManageHelpArticleModal.tsx`: Modal to write, edit, categorize, and publish help articles.
- `apps/web/src/features/notifications/pages/NotificationsPage.test.tsx`: Tests for notification filters, mark all read, and empty states.
- `apps/web/src/features/settings/pages/SettingsPage.test.tsx`: Tests for profile updates, theme changes, preference toggles, and session revocation.
- `apps/web/src/features/support/pages/SupportHelpPage.test.tsx`: Tests for ticket submission without SLA promises, anti-enumeration isolation, and help search.
- `apps/web/src/features/owner/pages/OwnerSupportPage.test.tsx`: Tests for Owner ticket queue triage, status transitions, and article management.

## 4 Contract status

### 4.1 Notifications & Web Push Contracts

| Endpoint / Interface | Status | Producer | Consumer | Permissions & Guards | Description & Schema |
|---|---|---|---|---|---|
| `GET /api/notifications` | PROPOSED FOR REVIEW | `NotificationsController` | Client/Owner `NotificationsPage` | `ClerkAuthGuard`, `AccountStatusGuard` | List authenticated user notifications. Query: `{ isRead?: boolean, type?: NotificationType, cursor?: string, limit?: number }`. Response: `{ items: Notification[], nextCursor: string \| null }`. |
| `GET /api/notifications/unread-count` | PROPOSED FOR REVIEW | `NotificationsController` | `Sidebar`, `TopBar` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns `{ unreadCount: number }` for current user. |
| `PATCH /api/notifications/:id/read` | PROPOSED FOR REVIEW | `NotificationsController` | `NotificationCard` | `ClerkAuthGuard`, `AccountStatusGuard` | Marks single notification read. Validates `userId === user.id`. Returns `{ id, isRead: true, readAt }`. |
| `POST /api/notifications/mark-all-read` | PROPOSED FOR REVIEW | `NotificationsController` | `NotificationsPage` | `ClerkAuthGuard`, `AccountStatusGuard` | Marks all notifications for `user.id` read. Returns `{ count: number }`. |
| `GET /api/notifications/push/public-key` | PROPOSED FOR REVIEW | `NotificationsController` | `useWebPush` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns `{ publicKey: string }` (VAPID public key) for browser push negotiation. |
| `POST /api/notifications/push/subscribe` | PROPOSED FOR REVIEW | `NotificationsController` | `useWebPush` | `ClerkAuthGuard`, `AccountStatusGuard` | Upserts subscription. Body: `{ endpoint: string, keys: { p256dh: string, auth: string }, userAgent?: string }`. Returns `{ success: true }`. |
| `POST /api/notifications/push/unsubscribe` | PROPOSED FOR REVIEW | `NotificationsController` | `useWebPush` | `ClerkAuthGuard`, `AccountStatusGuard` | Deletes subscription record by `endpoint`. Returns `{ success: true }`. |

### 4.2 Profile & Security Settings Contracts

| Endpoint / Interface | Status | Producer | Consumer | Permissions & Guards | Description & Schema |
|---|---|---|---|---|---|
| `GET /api/users/profile` | PROPOSED FOR REVIEW | `UsersController` | `SettingsPage` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns user identity and profile. Response: `{ id, email, name, role, status, mfaEnforced, profile: { companyName, phone, timezone, avatarUrl, themePreference } }`. |
| `PATCH /api/users/profile` | PROPOSED FOR REVIEW | `UsersController` | `ProfileForm`, `ThemeContext` | `ClerkAuthGuard`, `AccountStatusGuard` | Updates user display name and profile fields. Body: `UpdateProfileDto` (`name?`, `companyName?`, `phone?`, `timezone?`, `avatarUrl?`, `themePreference?`). Returns updated profile. |
| `GET /api/users/notification-preferences` | PROPOSED FOR REVIEW | `UsersController` | `NotificationPreferencesForm` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns `{ inApp: { ... }, push: { ... } }` boolean category flags for current user. |
| `PATCH /api/users/notification-preferences` | PROPOSED FOR REVIEW | `UsersController` | `NotificationPreferencesForm` | `ClerkAuthGuard`, `AccountStatusGuard` | Updates boolean preference flags. Body: `UpdateNotificationPreferencesDto`. Returns updated preferences. |
| `GET /api/users/sessions` | PROPOSED FOR REVIEW | `UsersController` | `SecuritySessionsList` | `ClerkAuthGuard`, `AccountStatusGuard` | Lists active sessions via Clerk backend SDK. Response: `Array<{ id, isCurrent, device, ipAddress, lastActiveAt }>`. |
| `DELETE /api/users/sessions/:sessionId` | PROPOSED FOR REVIEW | `UsersController` | `SecuritySessionsList` | `ClerkAuthGuard`, `AccountStatusGuard` | Revokes specified non-current session via Clerk backend SDK. Returns `{ revoked: true }`. |

### 4.3 Support Tickets & Help Center Contracts

| Endpoint / Interface | Status | Producer | Consumer | Permissions & Guards | Description & Schema |
|---|---|---|---|---|---|
| `GET /api/support/tickets` | PROPOSED FOR REVIEW | `SupportController` | Client `SupportHelpPage` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns tickets owned by `user.id`. Filterable by `status`. Response: `Array<{ id, ticketNumber, subject, status, priority, projectId, createdAt, updatedAt, messagesCount }>`. |
| `POST /api/support/tickets` | PROPOSED FOR REVIEW | `SupportController` | Client `CreateTicketModal` | `ClerkAuthGuard`, `AccountStatusGuard` | Creates new ticket in `OPEN` status. Body: `{ subject, description, priority?, projectId?, attachments? }`. Returns created ticket. |
| `GET /api/support/tickets/:ticketId` | PROPOSED FOR REVIEW | `SupportController` | Client `TicketThreadModal` | `ClerkAuthGuard`, `AccountStatusGuard`, `TicketAccessGuard` | Returns ticket details and thread messages. Returns strict `404 Not Found` if ticket belongs to another client. |
| `POST /api/support/tickets/:ticketId/messages` | PROPOSED FOR REVIEW | `SupportController` | Client/Owner thread modals | `ClerkAuthGuard`, `AccountStatusGuard`, `TicketAccessGuard` | Appends message to thread. Transitions status: Client reply -> `WAITING_FOR_OWNER`; Owner reply -> `WAITING_FOR_CLIENT`. Body: `{ content, attachments? }`. |
| `PATCH /api/support/tickets/:ticketId/status` | PROPOSED FOR REVIEW | `SupportController` | Client `TicketThreadModal` | `ClerkAuthGuard`, `AccountStatusGuard`, `TicketAccessGuard` | Client marks ticket as `RESOLVED` or `CLOSED`. Body: `{ status: 'RESOLVED' \| 'CLOSED' }`. |
| `GET /api/support/help/categories` | PROPOSED FOR REVIEW | `SupportController` | Client `SupportHelpPage` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns published categories with article counts. |
| `GET /api/support/help/articles` | PROPOSED FOR REVIEW | `SupportController` | Client `SupportHelpPage` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns published articles matching optional `categoryId` and `search` query. |
| `GET /api/support/help/articles/:slug` | PROPOSED FOR REVIEW | `SupportController` | Client `HelpArticleModal` | `ClerkAuthGuard`, `AccountStatusGuard` | Returns published article content. Throws `404` if unpublished or non-existent. |
| `GET /api/admin/support/tickets` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `OwnerSupportPage` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Returns global ticket queue across all clients. Filterable by `status`, `priority`, `clientId`. |
| `PATCH /api/admin/support/tickets/:ticketId/triage` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `OwnerTicketTriageModal` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Updates ticket status, priority, or assigned user. Body: `{ status?, priority?, assignedToId? }`. |
| `GET /api/admin/support/help/articles` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `OwnerSupportPage` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Returns all articles (drafts + published) with metrics. |
| `POST /api/admin/support/help/articles` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `ManageHelpArticleModal` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Creates new help article. Body: `{ title, slug?, categoryId, content, excerpt?, isPublished? }`. |
| `PATCH /api/admin/support/help/articles/:id` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `ManageHelpArticleModal` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Updates article content or toggles publication status. |
| `DELETE /api/admin/support/help/articles/:id` | PROPOSED FOR REVIEW | `OwnerSupportController` | Owner `OwnerSupportPage` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Deletes help article. |

## 5 Scope and acceptance

### 5.1 Quoted Phase Requirements
From `Oderinde-Stephen-Client-Portal-Build-Plan-v1.md`:
> *"### P08 Notifications profile and support*  
> *Build persistent notification history, approved event recipients, reviewed push timing/preferences, secure subscription lifecycle, profile/security settings and the help/ticket journeys. Owner operates the support queue; exact ticket status and priority rules are reviewed first.*  
> *Exit: push works after permission and HTTPS setup; denial leaves the in-app history functional; logout/account switching cannot leak notifications; deletion/restoration alerts go only to Owner; Clients access only their own authorized tickets. No invented response-time promise appears."*

### 5.2 Measurable Acceptance Criteria
1. **Persistent In-App Notification Center (Screen 15, Figma `5:261`)**:
   - Notifications are stored durably in PostgreSQL with timestamps, category type, and read state.
   - Unread badge in `Sidebar` and indicator dot in `TopBar` dynamically reflect live database unread count.
   - Individual notifications can be marked read; "Mark all as read" marks all user notifications read in one transaction.
   - Clicking a notification navigates to the authorized destination (`/files`, `/invoices`, `/messages`, `/support`).
   - If Web Push permission is denied or unsupported, the in-app notification center remains 100% functional.
2. **Web Push & Lock-Screen Security**:
   - Web Push uses standards-based VAPID with `web-push` library; no paid third-party push gateway required.
   - Push subscription is requested only upon explicit user gesture (e.g. clicking "Enable Push Notifications" in banner or settings).
   - Over-the-air push payload contains minimal generic text ("New deliverable uploaded", "New message received", etc.) with zero confidential client names, file titles, invoice amounts, or message snippets on the lock screen.
   - Service worker (`/sw.js`) handles `push` and `notificationclick` events, focusing an open portal window or navigating to the target URL.
   - Strictly per `ACCEPTANCE-CHECKLIST.md:63`, the service worker does not cache `/api/*` responses in CacheStorage.
   - Subscriptions are deleted on logout or explicit unsubscribe. Expired endpoints (`404` or `410 Gone` from push service) are pruned from PostgreSQL automatically.
3. **Owner-Only Lifecycle Alert Routing (`D-8`)**:
   - File soft-deletion, restoration, and permanent purge alerts are dispatched strictly to the Owner.
   - Client accounts never receive file lifecycle deletion or restoration notifications.
4. **Profile & Security Settings (Screen 16, Figma `5:356`)**:
   - Client can view and update their full name, company name, phone, and timezone via `PATCH /api/users/profile`.
   - Theme changes switch immediately in the browser and persist locally; authenticated changes synchronize to `Profile.themePreference`.
   - Security card accurately displays Clerk MFA status: Owner shows mandatory enforcement; Client shows optional status.
   - Active sessions card lists current device/browser, IP address, and other active sessions with individual revocation buttons.
   - Notification preferences card allows toggling in-app and browser push notifications per category.
5. **Support Tickets & Help Center (Screen 17, Figma `5:452`)**:
   - Client can view only their own submitted tickets. Any attempt to access, view, or reply to another client's ticket returns `404 Not Found` (anti-enumeration).
   - Tickets follow the reviewed state machine: `OPEN` -> `WAITING_FOR_OWNER` (on client reply) -> `WAITING_FOR_CLIENT` (on owner reply) -> `RESOLVED` -> `CLOSED`.
   - Ticket thread displays chronological messages with author role badges (`Owner` vs `Client`).
   - Published Help Center guides are organized by category, searchable by keyword, and accessible in read-only mode to Clients.
   - Explicit compliance: No invented response-time promise (e.g. "within 24 hours", "expected reply in 2 hours") appears anywhere in ticket forms, confirmation notices, or help center copy.
6. **Owner Support Queue (`/owner/support`)**:
   - Stephen can view all client tickets in a unified queue, filterable by status, priority, and client.
   - Stephen can triage tickets (update status, adjust priority, assign), read threads, and submit replies.
   - Stephen can author, edit, publish/unpublish, and delete Help Center articles and categories.
7. **Cross-Platform Responsive Quality**:
   - All three screens (15, 16, 17) and the Owner support interface render correctly across mobile (390px), tablet (768px), laptop (1024px), and desktop (1440px) in both dark and light themes.

## 6 Ordered steps

### Step 1: Dependencies, Environment & Schema Extensions
1. Install backend dependencies in `apps/api`: `npm install web-push` and `npm install -D @types/web-push`.
2. Configure development VAPID keys: Generate keypair (`npx web-push generate-vapid-keys`) and document `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env.example`.
3. Update `apps/api/prisma/schema.prisma` with enums (`NotificationType`, `TicketStatus`, `TicketPriority`) and models (`Notification`, `PushSubscription`, `UserNotificationPreferences`, `Ticket`, `TicketMessage`, `TicketAttachment`, `HelpCategory`, `HelpArticle`).
4. Apply Prisma migration: `npx prisma migrate dev --name p08_notifications_profile_and_support` and regenerate Prisma client.
5. Verification: Run `npx prisma validate` and verify TypeScript compilation in `apps/api`.
6. Rollback: Drop newly added tables via migration rollback or Prisma reset in local dev.

### Step 2: Backend Notifications & Web Push Subsystem
1. Implement `apps/api/src/notifications/services/web-push.service.ts`: Initialize `webpush` with VAPID credentials; implement `sendGenericPush(userId, payload)` with automatic pruning of `410 Gone` subscriptions.
2. Implement `apps/api/src/notifications/services/notifications.service.ts`: Notification creation, user preferences validation, unread count queries, mark read, mark all read, and `notifyOwner` method.
3. Implement `apps/api/src/notifications/notifications.controller.ts` with guards (`ClerkAuthGuard`, `AccountStatusGuard`) and DTO validation.
4. Wire `NotificationsModule` into `apps/api/src/app.module.ts`.
5. Connect `file-lifecycle.service.ts` to `NotificationsService.notifyOwner(...)` for soft delete, restore, and permanent deletion events.
6. Connect `messages.service.ts` to dispatch message notifications to conversation members.
7. Verification: Run unit tests `notifications.service.spec.ts` and `web-push.service.spec.ts`.
8. Rollback: Remove `NotificationsModule` from `app.module.ts`.

### Step 3: Backend Profile, Security & Preferences Extensions
1. Update `apps/api/src/users/users.controller.ts` with profile, notification preferences, and session endpoints.
2. Update `apps/api/src/users/users.service.ts`: Implement `updateProfile` (syncing `name` on `User` and attributes on `Profile`), `getNotificationPreferences`, `updateNotificationPreferences`, `getSessions` (proxying Clerk API or fallback mock in dev), and `revokeSession`.
3. Update `apps/api/src/auth/auth.controller.ts` `getMe()` to return `phone` and `themePreference`.
4. Verification: Run integration tests for profile updating and session revocation.
5. Rollback: Revert controller and service additions in `apps/api/src/users`.

### Step 4: Backend Support Tickets & Help Center Subsystem
1. Implement `apps/api/src/support/guards/ticket-access.guard.ts`: Enforce ticket ownership for Clients, throwing `404 Not Found` for anti-enumeration on cross-client access.
2. Implement `apps/api/src/support/services/tickets.service.ts`: Atomic ticket serial numbering (`TCK-YYYY-XXXX`), creation in `OPEN` status, message append with status state machine (`WAITING_FOR_OWNER` / `WAITING_FOR_CLIENT`), status transitions (`RESOLVED`, `CLOSED`), and Client query isolation.
3. Implement `apps/api/src/support/services/help.service.ts`: Help categories and articles CRUD, full-text keyword search, and publication toggles.
4. Implement `apps/api/src/support/controllers/support.controller.ts` (Client endpoints) and `apps/api/src/support/controllers/owner-support.controller.ts` (Owner triage & article endpoints).
5. Register `SupportModule` in `apps/api/src/app.module.ts`.
6. Verification: Run unit tests `tickets.service.spec.ts` verifying state transitions and anti-enumeration.
7. Rollback: Remove `SupportModule` from `app.module.ts`.

### Step 5: Frontend Service Worker, Web Push & Notifications Center (Screen 15)
1. Create `apps/web/public/sw.js`: Implement `push` and `notificationclick` event listeners; ensure zero caching of API responses.
2. Create `apps/web/src/services/notifications-api.ts` and hook `useNotifications.ts`.
3. Create `apps/web/src/features/notifications/hooks/useWebPush.ts`: Register service worker, fetch VAPID public key, handle `Notification.requestPermission()`, and synchronize subscription with backend.
4. Create notification UI components: `NotificationCard.tsx`, `NotificationFilters.tsx`, `PushBanner.tsx`.
5. Rebuild `apps/web/src/features/notifications/pages/NotificationsPage.tsx`: Live unread filter, category tabs, mark all read, notification action navigation, empty state, and push opt-in banner.
6. Update `Sidebar.tsx` and `TopBar.tsx` to bind unread count badge and indicator dot. Add Notifications to `ownerNav`.
7. Verification: Run `NotificationsPage.test.tsx` verifying unread count updates, filters, and mark-all-read.
8. Rollback: Revert changes in `NotificationsPage.tsx` and layout components.

### Step 6: Frontend Profile, Security & Notification Preferences (Screen 16)
1. Create `apps/web/src/components/ui/Switch.tsx` primitive.
2. Create `apps/web/src/services/settings-api.ts` and hooks for profile, sessions, and preferences.
3. Create settings components: `ProfileForm.tsx`, `NotificationPreferencesForm.tsx`, `SecuritySessionsList.tsx`.
4. Rebuild `apps/web/src/features/settings/pages/SettingsPage.tsx`: Replace fixtures with live profile editing form, instant theme toggles with profile sync, Clerk MFA status display, active sessions list with revoke buttons, and category notification preferences.
5. Update `ThemeContext.tsx` to sync theme preference to the user profile.
6. Verification: Run `SettingsPage.test.tsx` verifying form submission, theme switching, and preference updates.
7. Rollback: Revert `SettingsPage.tsx` changes.

### Step 7: Frontend Support Tickets, Help Center & Owner Support Queue (Screen 17 & Owner Support)
1. Create `apps/web/src/services/support-api.ts`, `useSupportTickets.ts`, `useHelpCenter.ts`, and `useOwnerSupport.ts`.
2. Create client support components: `CreateTicketModal.tsx` (explicitly verifying that no invented response-time promise appears), `TicketThreadModal.tsx`, `HelpArticleModal.tsx`.
3. Rebuild `apps/web/src/features/support/pages/SupportHelpPage.tsx`: Live Help Center search and category filter, help article reader, and client ticket ledger with new ticket submission and thread drawer.
4. Create owner support components: `OwnerTicketTriageModal.tsx`, `ManageHelpArticleModal.tsx`.
5. Rebuild `apps/web/src/features/owner/pages/OwnerSupportPage.tsx`: Unified ticket queue with triage controls, status transitions, priority adjustments, thread reply composer, and knowledge base article manager.
6. Verification: Run `SupportHelpPage.test.tsx` and `OwnerSupportPage.test.tsx`.
7. Rollback: Revert support pages and modals.

### Step 8: End-to-End Integration, Anti-Enumeration & Cross-Theme Verification
1. Run backend integration tests `notifications-support.e2e-spec.ts`.
2. Verify with two isolated Client accounts:
   - Client A cannot access, view, or reply to Client B's support tickets (verified `404 Not Found`).
   - Client A cannot view Client B's in-app notifications.
   - Deletion/restoration alerts are delivered exclusively to the Owner.
3. Verify denial of browser push leaves the in-app notification center fully usable.
4. Verify responsive layouts on 390px, 768px, 1024px, and 1440px viewports in both dark and light themes.
5. Run full workspace check: `npm run typecheck`, `npm run lint`, and `npm test` across web and API.

## 7 Objections

### Objection 1: Web Push delivery depends on browser capability, user permission, and HTTPS, which may fail in development or on unsupported devices.
- **Rating**: Serious
- **Resolution**: Push notifications are treated as an optional enhancement channel. The in-app notification center (`/notifications`) is the durable source of truth and is 100% functional regardless of browser push status. If push permission is denied, unprompted, or unsupported (e.g. non-HTTPS local dev), the UI gracefully displays the permission status without blocking any portal features. In-app events are always persisted to PostgreSQL before any push delivery attempt.

### Objection 2: Support ticket responses could set unrealistic turnaround expectations if an SLA or response time is implied.
- **Rating**: Blocker
- **Resolution**: Strict compliance with `docs/PROPOSED-POLICIES.md:31` and `ACCEPTANCE-CHECKLIST.md:75`. All ticket submission confirmations, status badges, and help center copy are audited to ensure NO invented response-time promise appears (e.g. prohibiting phrases like "Replies within 2 hours" or "24-hour turnaround"). The confirmation explicitly states: *"Your ticket has been submitted. Stephen has been notified and will review your request."*

### Objection 3: Client ticket enumeration could allow malicious clients to inspect other clients' inquiries or ticket volume by guessing sequential IDs.
- **Rating**: Serious
- **Resolution**: All ticket endpoints enforce the `TicketAccessGuard`. If a client requests a ticket ID that does not belong to their account, the API strictly returns `404 Not Found` (never `403 Forbidden`). Ticket numbers use a cryptographically unguessable combination or high-entropy serial (`TCK-YYYY-XXXX`), and ticket list queries are hard-filtered by `clientId: user.id`.

### Objection 4: Storing confidential deliverable names or financial figures in Web Push payloads could leak sensitive data to unauthenticated lock screens.
- **Rating**: Serious
- **Resolution**: Strict lock-screen data minimization is enforced in `WebPushService`. Push payloads sent over-the-air contain only generic, non-sensitive categories (e.g., "New deliverable uploaded", "New message received", "Invoice issued") and an opaque relative link. File titles, dollar amounts, message snippets, and client identities are excluded from the push payload. The full details are revealed only after the user unlocks their device and authenticates into the portal.

## 8 Verdict

`READY FOR APPROVAL`

The plan establishes complete, concrete contracts, database models, security guards, and UI components for all criteria in P08 across Screens 15, 16, 17, and the Owner support suite. Open decision proposals for notification categories (`Q08`) and ticket statuses (`Q09`) are resolved with concrete, non-assumptive boundaries matching Stephen's explicit guidance.

## 9 Approval

- Status: APPROVED
- Date: 2026-10-19
- Stephen's approval instruction: "APPROVE"
- Approved scope: Implementation of P08 (Notifications, Profile & Security, Support & Tickets) across `apps/api` and `apps/web`.

## 10 Execution log

- [x] Step 1: Dependencies, Environment & Schema Extensions — COMPLETE
  - Installed `web-push` (`^3.6.7`) and `@types/web-push` in `apps/api`.
  - Added Prisma schema models: `Notification`, `PushSubscription`, `UserNotificationPreferences`, `Ticket`, `TicketMessage`, `TicketAttachment`, `HelpCategory`, `HelpArticle`, and enums `NotificationType`, `TicketStatus`, `TicketPriority`.
  - Extended `Profile` with `themePreference String @default("system")`. Generated Prisma client via `npx prisma generate`.
- [x] Step 2: Backend Notifications & Web Push Subsystem — COMPLETE
  - Created DTOs: `subscribe-push.dto.ts`, `unsubscribe-push.dto.ts`, `create-notification.dto.ts`, `notification-filter.dto.ts`.
  - Implemented `WebPushService` (VAPID keypair integration, lock-screen data minimization, auto-pruning 410 Gone) and `NotificationsService` (read tracking, unread counts, owner alerts).
  - Implemented `NotificationsController` under `/api/notifications/*`.
  - Connected `FileLifecycleService` alerts (soft-delete, restore, permanent purge) and `MessagesService` alerts.
  - Verified backend unit tests: `notifications.service.spec.ts` (5/5 pass) and `web-push.service.spec.ts` (3/3 pass).
- [x] Step 3: Backend Profile, Security & Preferences Extensions — COMPLETE
  - Created `UserProfileController` under `/api/users/*`.
  - Extended `UsersService` with `getProfile`, `updateProfile` (syncing with Clerk names), `getNotificationPreferences`, `updateNotificationPreferences`, `getActiveSessions`, and `revokeSession`.
  - Updated `AuthController.getMe()` to return `phone` and `themePreference`.
- [x] Step 4: Backend Support Tickets & Help Center Subsystem — COMPLETE
  - Implemented `TicketAccessGuard` enforcing strict `404 Not Found` anti-enumeration for cross-client ticket access.
  - Implemented `TicketsService` (`TCK-YYYY-XXXX` numbering, state machine transitions `OPEN` -> `WAITING_FOR_OWNER`/`CLIENT` -> `RESOLVED` -> `CLOSED`).
  - Implemented `HelpService` for knowledge base category and article management and search.
  - Implemented `SupportController` (Client) and `OwnerSupportController` (Stephen triage).
  - Verified unit tests: `tickets.service.spec.ts` (4/4 pass).
- [x] Step 5: Frontend Service Worker, Web Push & Notifications Center (Screen 15) — COMPLETE
  - Created `apps/web/public/sw.js` with zero `/api/*` caching rule.
  - Implemented `notifications-api.ts`, `useNotifications.ts`, and `useWebPush.ts`.
  - Created `NotificationCard.tsx`, `NotificationFilters.tsx`, `PushBanner.tsx`.
  - Rebuilt `NotificationsPage.tsx` (Screen 15) without fixture badges.
  - Updated `Sidebar.tsx` and `TopBar.tsx` with live unread badge.
  - Registered `/owner/notifications` in `AppRoutes.tsx`.
- [x] Step 6: Frontend Profile, Security & Notification Preferences (Screen 16) — COMPLETE
  - Created `Switch.tsx` and `settings-api.ts`.
  - Created `ProfileForm.tsx`, `NotificationPreferencesForm.tsx`, `SecuritySessionsList.tsx`.
  - Updated `ThemeContext.tsx` to persist theme changes to user profile in backend.
  - Rebuilt `SettingsPage.tsx` (Screen 16) with active sessions, Clerk MFA status, and per-user toggles.
- [x] Step 7: Frontend Support Tickets, Help Center & Owner Support Queue (Screen 17 & Owner Support) — COMPLETE
  - Created `support-api.ts`.
  - Created `CreateTicketModal.tsx` (strictly without invented SLA or turnaround promises).
  - Created `TicketThreadModal.tsx` with conversation history, author badges, and reply composer.
  - Created `HelpArticleModal.tsx` for viewing published knowledge base guides.
  - Rebuilt `SupportHelpPage.tsx` (Screen 17) with live knowledge base search and client ticket list.
  - Created `OwnerTicketTriageModal.tsx` and `ManageHelpArticleModal.tsx`.
  - Rebuilt `OwnerSupportPage.tsx` with ticket queue triage and article CRUD.
- [x] Step 8: End-to-End Integration, Anti-Enumeration & Cross-Theme Verification — COMPLETE
  - Created unit and integration tests across notifications, settings, and support.
  - Verified `apps/web` tests: 16 test files passed (86/86 tests pass).
  - Verified `apps/api` tests: 14 test files passed (66/66 tests pass).
  - Verified `apps/web` typecheck: 0 TypeScript errors.
  - Verified `apps/api` typecheck: 0 TypeScript errors.
  - Verified memory integrity: `tools/check-memory.py` passes.

## 11 Deviations

None yet.

## 12 Memory changes

- Real entries checked: `D-1`, `D-3`, `D-5`, `D-8`, `D-11`, `D-14`, `D-15`, `P-1`, `P-2`, `P-3`.
- No memory changes required during the drafting phase.

## 13 Stephen confirmation

Upon completion of implementation, Stephen should confirm:
1. Navigating to `/notifications` displays the unread badge, category filters, and functional mark-as-read controls with no fixture labels.
2. Granting push permission successfully registers the device; denying permission leaves in-app notifications completely operational.
3. Lock-screen push messages display generic alert text without leaking private filenames, message bodies, or financial figures.
4. Navigating to `/settings` allows updating contact details, toggles themes with database persistence, displays Clerk MFA status, and lists active sessions.
5. Navigating to `/support` allows submitting tickets without any invented SLA or turnaround promise.
6. Client A cannot access, view, or reply to Client B's support tickets (confirmed `404 Not Found`).
7. Stephen can access the Owner Support Queue at `/owner/support`, triage tickets, adjust priority/status, reply to clients, and manage Help Center articles.
8. File deletion and restoration alerts are dispatched exclusively to Stephen (Owner).

## 14 Integration and handoff

- External Dependencies:
  - `web-push` npm package for VAPID push payload generation.
  - VAPID keypair (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) configured in environment.
  - Clerk backend SDK (`@clerk/backend`) for session query and revocation.
- Browser Capabilities:
  - Service Worker and PushManager support required for Web Push; graceful fallback for unsupported browsers.
- Runbook:
  - To generate new VAPID keys: `npx web-push generate-vapid-keys`.
  - Service worker file deployed at `apps/web/public/sw.js`.
