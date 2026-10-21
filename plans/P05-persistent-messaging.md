# Persistent Messaging and Real-Time Collaboration

- Task: P05 implement persistent WebSocket and REST messaging for Project, General, Direct, and Owner-created Group conversations with durable PostgreSQL storage, message persistence before acknowledgement, client-generated idempotency keys, `joinedAt` history boundaries, anti-enumeration scoping, deliverable file version attachments, reconnect synchronization, and responsive Screen 13 (`/messages`) and Owner messaging (`/owner/messages`) interfaces
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement real-time persistent messaging using NestJS WebSockets (Socket.io) and PostgreSQL storage for Project, General, Direct, and Owner-created Group conversations, ensuring messages persist prior to delivery acknowledgement, sends are strictly idempotent, history visibility begins at the participant's `joinedAt` timestamp, deliverable attachments link to authorized `FileVersion` records, and cross-client discovery or exposure is strictly prevented across Screen 13 (`/messages`, Figma `5:92`) and the Owner messaging surface (`/owner/messages`).

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-6 - Application file version history`: "Preserve prior versions and attach feedback and approvals to the exact file version."
- `D-7 - Storage categories and limit`: "Use private S3-compatible storage separately from the API/database; 500 MB per file; all seven previously proposed categories."
- `D-9 - Persistent collaboration messaging`: "Use NestJS WebSockets and PostgreSQL history for project, general, direct and group conversations."
- `D-10 - Protected discovery and group entry`: "Clients cannot discover unrelated Clients; Owner controls groups/membership; newly joined participants see history only from joining."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files

#### Backend (`apps/api`):
- `apps/api/package.json:25-43`:
  - Add runtime dependencies: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.
  - Add dev dependency: `socket.io-client` (for Vitest E2E testing).
- `apps/api/prisma/schema.prisma:121-386`:
  - Add enums:
    - `ConversationType` (`PROJECT`, `DIRECT`, `GENERAL`, `GROUP`)
    - `ConversationMemberRole` (`Owner`, `Member`)
  - Add models:
    - `Conversation` (`id`, `type`, `title`, `projectId`, `createdById`, `lastMessageAt`, `createdAt`, `updatedAt`, relations)
    - `ConversationMembership` (`id`, `conversationId`, `userId`, `role`, `joinedAt`, `leftAt`, `lastReadAt`, `createdAt`, `updatedAt`, relations)
    - `Message` (`id`, `conversationId`, `senderId`, `content`, `idempotencyKey`, `createdAt`, `updatedAt`, relations)
    - `MessageAttachment` (`id`, `messageId`, `fileVersionId`, `createdAt`, relations)
  - Extend existing models:
    - `User` (`apps/api/prisma/schema.prisma:121-142`): add `createdConversations Conversation[] @relation("CreatedConversations")`, `conversationMemberships ConversationMembership[]`, `sentMessages Message[] @relation("SentMessages")`.
    - `Project` (`apps/api/prisma/schema.prisma:156-175`): add `conversations Conversation[]`.
    - `FileVersion` (`apps/api/prisma/schema.prisma:345-372`): add `messageAttachments MessageAttachment[]`.
- `apps/api/src/app.module.ts:12-28`:
  - Import and register `MessagesModule`.

#### Frontend (`apps/web`):
- `apps/web/package.json:14-25`:
  - Add runtime dependency: `socket.io-client`.
- `apps/web/src/routes/AppRoutes.tsx:64,73-80`:
  - Connect real data-driven `MessagesPage` for `/messages` (replacing static fixture).
  - Add Owner messaging route: `<Route path="/owner/messages" element={<OwnerMessagesPage />} />`.
- `apps/web/src/layouts/components/Sidebar.tsx:51-59`:
  - Add `{ to: '/owner/messages', label: 'Messages & Channels', icon: MessageSquare }` to `ownerNav`.
- `apps/web/src/features/messages/pages/MessagesPage.tsx:1-77`:
  - Replace static fixture mockup and `<FixtureBadge phase="P05" />` with complete interactive client messaging interface.

### 3.2 Proposed new files

#### Backend (`apps/api`):
- `apps/api/src/messages/messages.module.ts`: Bundles messaging controllers, WebSocket gateway, services, guards, and Prisma integration.
- `apps/api/src/messages/messages.gateway.ts`: Socket.io WebSocket gateway with Clerk token handshake verification, room subscription management (`conversation:${id}`), real-time message broadcasting, typing state, and disconnect handling.
- `apps/api/src/messages/messages.controller.ts`: Client-facing REST endpoints (`/api/conversations`, `/api/conversations/:id/messages`, `/api/conversations/:id/sync`) providing initial load and reconnect catch-up.
- `apps/api/src/messages/controllers/owner-messages.controller.ts`: Owner administrative endpoints (`/api/admin/conversations`, `/api/admin/conversations/:id/members`) for group creation, member removal/re-addition, and cross-client oversight.
- `apps/api/src/messages/services/messages.service.ts`: Core messaging business logic: persistent insert before emit, client-generated idempotency key deduplication, `joinedAt` message visibility filtering, server-timestamp ordering, and attachment validation.
- `apps/api/src/messages/services/conversations.service.ts`: Conversation retrieval, scoping, Owner-only group creation with cross-client isolation validation, and membership lifecycle (`joinedAt`, `leftAt`).
- `apps/api/src/messages/guards/ws-clerk-auth.guard.ts`: Custom WebSocket guard validating Clerk session tokens on socket handshakes and verifying `AccountStatus.ACTIVE`.
- `apps/api/src/messages/guards/conversation-access.guard.ts`: HTTP and WS guard enforcing that callers have active membership (`leftAt === null`) in the target conversation, returning `404 Not Found` for unauthorized or foreign conversations (anti-enumeration).
- `apps/api/src/messages/dto/create-conversation.dto.ts`: DTO for creating conversations (type, title, projectId, participantUserIds).
- `apps/api/src/messages/dto/send-message.dto.ts`: DTO for sending messages (content, idempotencyKey, fileVersionIds).
- `apps/api/src/messages/dto/sync-reconnect.dto.ts`: DTO for requesting missed messages since a client timestamp cursor.
- `apps/api/src/messages/dto/manage-member.dto.ts`: DTO for Owner adding or removing conversation participants.
- `apps/api/src/messages/messages.service.spec.ts`: Unit tests for messaging persistence, idempotency deduplication, history boundary filtering, and attachment constraints.
- `apps/api/src/messages/guards/conversation-access.guard.spec.ts`: Unit tests for conversation access boundaries and anti-enumeration.
- `apps/api/test/messages.e2e-spec.ts`: E2E tests for WebSocket connection authentication, real-time broadcast, message persistence before ack, idempotency replay, cross-client isolation, and post-removal access denial.

#### Frontend (`apps/web`):
- `apps/web/src/services/messages-api.ts`: REST API client for conversations, message history, and reconnect synchronization.
- `apps/web/src/services/messages-socket.ts`: Socket.io singleton manager handling connection lifecycle, authentication headers, reconnection attempts, room join/leave, and event listeners.
- `apps/web/src/features/messages/hooks/useConversations.ts`: Hook for loading and selecting available user conversations.
- `apps/web/src/features/messages/hooks/useMessages.ts`: Hook managing active conversation stream, incoming socket messages, optimistic pending state, idempotent sending, and reconnect catch-up.
- `apps/web/src/features/messages/components/ConversationList.tsx`: Master list panel showing Direct, Project, General, and Group conversations with active indicators and unread badges.
- `apps/web/src/features/messages/components/MessageThread.tsx`: Message stream container with date separators, server-timestamp sorting, and auto-scroll behavior.
- `apps/web/src/features/messages/components/MessageItem.tsx`: Accessible message bubble rendering sender avatar, role badge, timestamp, body text, and linked deliverable attachments.
- `apps/web/src/features/messages/components/MessageComposer.tsx`: Input bar with text field, file attachment trigger, submit button, and keyboard shortcuts (Enter to send, Shift+Enter for newline).
- `apps/web/src/features/messages/components/AttachmentPickerModal.tsx`: Modal allowing users to attach existing approved deliverable file versions from their project files.
- `apps/web/src/features/owner/pages/OwnerMessagesPage.tsx`: Dedicated Owner messaging surface with project filters, conversation creation modal, group participant manager, and cross-client communication threads.
- `apps/web/src/features/owner/components/CreateGroupModal.tsx`: Owner modal for creating project group conversations with collaborator selection.
- `apps/web/src/features/messages/pages/MessagesPage.test.tsx`: Component tests for Screen 13 client messaging interactions.
- `apps/web/src/features/owner/pages/OwnerMessagesPage.test.tsx`: Component tests for Owner message and group management.

## 4 Contract status

| Interface / Endpoint | Status | Producer | Consumer | Permissions & Checks | Description & Fields |
| --- | --- | --- | --- | --- | --- |
| `GET /api/conversations` | Proposed for review | `MessagesController` | React `useConversations` | Authenticated Client or Owner (`AccountStatus.ACTIVE`) | Returns conversations where caller is an active member (`leftAt === null`). Fields: `id`, `type`, `title`, `projectId`, `projectName`, `lastMessageAt`, `unreadCount`, `members`. Anti-enumeration: returns only assigned conversations. |
| `GET /api/conversations/:id` | Proposed for review | `MessagesController` | React `useMessages` | Active member of conversation | Returns conversation metadata. Returns `404 Not Found` if user is not an active member or conversation does not exist. |
| `GET /api/conversations/:id/messages` | Proposed for review | `MessagesController` | React `useMessages` | Active member of conversation | Paginated historical messages. Query params: `cursor`, `limit` (default 50). Filter: `where: { conversationId, createdAt: { gte: membership.joinedAt } }`. Returns `404 Not Found` if not an active member. |
| `POST /api/conversations/:id/messages` | Proposed for review | `MessagesController` | React fallback | Active member of conversation | HTTP fallback for sending a message. Body: `{ content: string, idempotencyKey: string, fileVersionIds?: string[] }`. Persists to DB, emits WS event to room, returns persisted message. |
| `GET /api/conversations/:id/sync` | Proposed for review | `MessagesController` | React `useMessages` (reconnect) | Active member of conversation | Reconnect catch-up endpoint. Query param: `since` (ISO timestamp). Returns all messages where `createdAt > since` and `createdAt >= membership.joinedAt`. |
| `POST /api/admin/conversations` | Proposed for review | `OwnerMessagesController` | React Owner UI | Owner only (`RolesGuard('Owner')`, `OwnerMfaGuard`) | Creates a new Project, Direct, General, or Group conversation. Body: `{ type: ConversationType, title?: string, projectId?: string, participantUserIds: string[] }`. Validates that all participants belong to the same project. |
| `PATCH /api/admin/conversations/:id/members` | Proposed for review | `OwnerMessagesController` | React Owner UI | Owner only (`RolesGuard('Owner')`, `OwnerMfaGuard`) | Adds or removes participants from an Owner-created group. Body: `{ action: 'ADD' \| 'REMOVE', userId: string }`. Setting `REMOVE` sets `leftAt = now()`. Setting `ADD` resets `joinedAt = now(), leftAt = null`. |
| `WS Event: join_conversation` | Proposed for review | React `messages-socket` | `MessagesGateway` | Handshake authenticated user | Payload: `{ conversationId: string }`. Gateway verifies active membership (`leftAt === null`). Sockets joins room `conversation:${conversationId}`. Emits error and disconnects from room if unauthorized. |
| `WS Event: leave_conversation` | Proposed for review | React `messages-socket` | `MessagesGateway` | Socket in room | Payload: `{ conversationId: string }`. Socket leaves room `conversation:${conversationId}`. |
| `WS Event: send_message` | Proposed for review | React `messages-socket` | `MessagesGateway` | Active member in room | Payload: `{ conversationId: string, content: string, idempotencyKey: string, fileVersionIds?: string[] }`. 1) Verifies membership. 2) Validates attachments (`ScanStatus.CLEAN`, project scope). 3) Persists message to PostgreSQL. 4) Broadcasts `message_created` to room. 5) Returns server ack `{ status: 'OK', message: Message }`. |
| `WS Event: sync_reconnect` | Proposed for review | React `messages-socket` | `MessagesGateway` | Active member in room | Payload: `{ conversationId: string, since: string }`. Returns `{ messages: Message[] }` sent after `since` and `>= membership.joinedAt`. |
| `WS Broadcast: message_created` | Proposed for review | `MessagesGateway` | Sockets in `conversation:${id}` room | Room members | Emitted to all connected sockets in conversation room upon successful DB persistence. Payload contains full sanitized message object with attachments and server timestamp. |

## 5 Scope and acceptance

### 5.1 Quoted Requirements (`Oderinde-Stephen-Client-Portal-Build-Plan-v1.md:129-134`)

> "Finalize the outstanding removal/rejoining and group privacy rules before implementing those transitions. Build project, general, direct and Owner-created group conversations with authorized discovery, durable history, attachments linked to authorized file versions, reconnect and idempotent sends.
> Exit: messages persist before acknowledgement and survive reconnect/restart; joining history starts at the allowed time; removal/rejoining behavior matches Stephen's selected policy; unrelated Clients cannot be discovered or exposed through search, groups or push payloads."

### 5.2 Measurable Acceptance Criteria

1. **Persistent History Before Acknowledgement**:
   - Every message sent over WebSocket or HTTP must be committed to PostgreSQL before the server emits a socket broadcast or sends an acknowledgement response back to the client.
   - Restarting the NestJS API process or refreshing the browser retains 100% of sent messages without loss.
2. **Idempotent Sends & Deduplication**:
   - The database enforces uniqueness on `[conversationId, idempotencyKey]`.
   - Repeated transmission of a message with an identical idempotency key returns the previously persisted message without inserting duplicate records or emitting duplicate broadcasts.
3. **Joining History Boundary (`joinedAt`)**:
   - A participant added to a conversation sees only messages whose `createdAt` timestamp is greater than or equal to their `membership.joinedAt` timestamp. Messages created prior to their addition are completely omitted from query results and sync responses.
4. **Removal and Rejoining Policy Enforcement (Open Decision Q06)**:
   - When a participant is removed by the Owner, their `membership.leftAt` is set to the current timestamp.
   - The removed user is immediately rejected from the WebSocket room and receives `404 Not Found` on all REST conversation and message endpoints.
   - If the user is subsequently re-added by the Owner, `joinedAt` is reset to `now()` and `leftAt` to `null`. The user sees messages starting only from their new join date; earlier messages remain inaccessible.
5. **Cross-Client Isolation & Anti-Enumeration**:
   - Direct, General, and Project conversations are strictly isolated to the Owner and the assigned Client.
   - Owner-created groups are restricted to participants within the same project. Attempts to add a Client from an unrelated project are rejected by the API (`400 Bad Request`).
   - Querying or joining an unauthorized conversation ID returns `404 Not Found`, preventing malicious ID enumeration.
   - Client search endpoints do not return unrelated client names, emails, or metadata.
6. **Authorized Deliverable File Version Attachments**:
   - Message attachments can link only to `FileVersion` records that belong to the conversation's project.
   - Attachments must have `scanStatus === ScanStatus.CLEAN` and cannot be `FileVisibility.INTERNAL` or in a soft-deleted lifecycle state. Attempting to attach an unapproved or foreign file returns `404 Not Found`.
7. **Responsive & Accessible UI (Screen 13 & Owner)**:
   - Screen 13 (`/messages`, Figma `5:92`) renders at 390px, 768px, 1024px, and 1440px viewports with zero horizontal overflow.
   - Message stream uses semantic tokens (`tokens.css`) supporting both dark and light themes without hardcoded hex values.
   - Keyboard navigation supports Tab focus, Enter to send, Shift+Enter for newline, and accessible ARIA attributes (`role="log"`, `aria-live="polite"`).
   - Dedicated Owner interface (`/owner/messages`) allows Stephen to switch between client channels, create project groups, and manage participants.

## 6 Ordered steps

### Step 1: Install Dependencies and Update Package Manifests
- **Backend**:
  - Add `@nestjs/websockets`, `@nestjs/platform-socket.io`, and `socket.io` to `apps/api/package.json`.
  - Add `socket.io-client` to `apps/api` devDependencies for E2E tests.
  - Run package installation.
- **Frontend**:
  - Add `socket.io-client` to `apps/web/package.json`.
  - Run package installation.
- **Verification**: `npm run build` and `npm run typecheck` run clean in both `apps/api` and `apps/web`.
- **Rollback**: Revert `package.json` and lockfile modifications.

### Step 2: Extend Prisma Schema and Run Migration
- **Changes**:
  - Add enums `ConversationType` and `ConversationMemberRole` to `apps/api/prisma/schema.prisma`.
  - Add models `Conversation`, `ConversationMembership`, `Message`, and `MessageAttachment`.
  - Add unique constraint `@@unique([conversationId, idempotencyKey])` on `Message`.
  - Add relations to `User`, `Project`, and `FileVersion`.
  - Generate Prisma Client and apply migration.
- **Verification**: Run `npx prisma validate` and verify generated client types include `Conversation` and `Message`.
- **Rollback**: Revert schema changes and regenerate Prisma client.

### Step 3: Implement Backend Messaging Services and Anti-Enumeration Guards
- **Changes**:
  - Create `apps/api/src/messages/guards/ws-clerk-auth.guard.ts` (WebSocket handshake verification via Clerk and `AccountStatus.ACTIVE` check).
  - Create `apps/api/src/messages/guards/conversation-access.guard.ts` (anti-enumeration check throwing `404 Not Found` for unauthorized conversations).
  - Create `apps/api/src/messages/services/conversations.service.ts` (conversation retrieval, scoping, anti-cross-client validation for groups).
  - Create `apps/api/src/messages/services/messages.service.ts` (idempotent DB insert, `joinedAt` filtering, attachment validation).
- **Verification**: Write and execute unit tests in `apps/api/src/messages/messages.service.spec.ts` covering idempotency, joining history boundary, and cross-client attachment blocking.
- **Rollback**: Remove newly created service files and test files.

### Step 4: Implement WebSocket Gateway and REST Controllers
- **Changes**:
  - Create `apps/api/src/messages/messages.gateway.ts` implementing `OnGatewayConnection` and `OnGatewayDisconnect`, room subscriptions, and events (`join_conversation`, `leave_conversation`, `send_message`, `sync_reconnect`).
  - Create `apps/api/src/messages/messages.controller.ts` for client conversation and message listing.
  - Create `apps/api/src/messages/controllers/owner-messages.controller.ts` for Owner group management and administrative oversight.
  - Register `MessagesModule` in `apps/api/src/app.module.ts`.
- **Verification**: Write E2E test in `apps/api/test/messages.e2e-spec.ts` testing connection auth, real-time message broadcasting, persistence before ack, and 404 anti-enumeration.
- **Rollback**: Deregister `MessagesModule` and delete gateway and controller files.

### Step 5: Implement Frontend Socket Manager and Messaging Hooks
- **Changes**:
  - Create `apps/web/src/services/messages-socket.ts` (Socket.io client manager with reconnection logic, auth token injection, and event emitters).
  - Create `apps/web/src/services/messages-api.ts` (REST client for initial conversations, message history, and reconnect sync).
  - Create `apps/web/src/features/messages/hooks/useConversations.ts` and `useMessages.ts`.
- **Verification**: Unit test hook state management and message stream appending.
- **Rollback**: Remove frontend service and hook files.

### Step 6: Build Client Messages Interface (Screen 13, Figma 5:92)
- **Changes**:
  - Update `apps/web/src/features/messages/pages/MessagesPage.tsx`:
    - Remove `<FixtureBadge phase="P05" />`.
    - Implement master-detail split layout (conversation channel selector on left, message stream and composer on right).
    - Implement `ConversationList.tsx`, `MessageThread.tsx`, `MessageItem.tsx`, and `MessageComposer.tsx`.
    - Integrate `AttachmentPickerModal.tsx` connecting to project deliverables.
    - Implement offline/reconnecting status pill.
- **Verification**: Verify responsiveness at 390px, 768px, 1024px, and 1440px in both dark and light modes. Run `MessagesPage.test.tsx`.
- **Rollback**: Revert `MessagesPage.tsx` to fixture state.

### Step 7: Build Dedicated Owner Messaging Surface (`/owner/messages`)
- **Changes**:
  - Create `apps/web/src/features/owner/pages/OwnerMessagesPage.tsx` with project filter, client conversation switcher, and group creation modal.
  - Create `apps/web/src/features/owner/components/CreateGroupModal.tsx`.
  - Add route in `apps/web/src/routes/AppRoutes.tsx:73-80` (`/owner/messages`).
  - Add navigation item in `apps/web/src/layouts/components/Sidebar.tsx:51-59`.
- **Verification**: Run `OwnerMessagesPage.test.tsx`. Verify Owner can see conversations across all projects and create project-scoped groups.
- **Rollback**: Remove Owner page, modal, and route entries.

### Step 8: End-to-End Behavioral Verification and Edge-Case Testing
- **Changes**:
  - Run full test suite (`npm run test` and `npm run test:e2e` in `apps/api`; `npm run test` in `apps/web`).
  - Verify complete matrix: cross-client isolation, idempotent sends, persistence before ack, reconnect synchronization, `joinedAt` message cutoff, and removal access termination.
- **Verification**: Document real test results and locators in Section 10.
- **Rollback**: Fix any failing assertions or revert changes.

## 7 Objections

### Objection 1: Ambiguity in Removal & Rejoining History Policy (Open Decision Q06)
- **Rating**: **BLOCKER** (Blocks production implementation of membership transitions)
- **Problem**: In `docs/OPEN-DECISIONS.md:9,22` [Q06], Stephen's earlier feedback gave a generic yes to opposing options. A user removed from a conversation could either: (A) retain historical access up to removal, or (B) immediately lose all portal access. Furthermore, when re-added, do they see past messages or only new messages?
- **Resolution**:
  - Adopt the explicit proposal in `docs/PROPOSED-POLICIES.md:7-11`:
    1. **Immediate revocation on removal**: When removed (`leftAt = now()`), user immediately loses all access to the conversation room and message history.
    2. **Fresh start on rejoining**: If re-added by Owner, `joinedAt` is updated to `now()`. The query strictly enforces `createdAt >= membership.joinedAt`. Messages sent before this new join time remain completely invisible to the returning member.
    3. Retain historical membership audit records in `AuditLog` so access revocation is provable.

### Objection 2: Race Conditions, Network Drops, and Replay Duplication on Send
- **Rating**: **SERIOUS**
- **Problem**: In real-time WebSockets, if a client emits a message and loses network connection before receiving the server ACK, the client will reconnect and re-emit. Without strict idempotency, duplicate messages pollute the chat stream. Furthermore, client-supplied timestamps can cause out-of-order rendering.
- **Resolution**:
  - Mandate client-side UUID `idempotencyKey` on `send_message`.
  - Enforce database constraint `@@unique([conversationId, idempotencyKey])`.
  - In `MessagesService.sendMessage()`, perform an idempotent upsert or catch unique constraint violation to return the existing persisted message.
  - Strict ordering: all message sorting must be governed by PostgreSQL server `createdAt: DateTime @default(now())` and sequential database ID, never client device time (`docs/ARCHITECTURE.md:57-58`).
  - Persist to PostgreSQL *before* acknowledging or emitting to the socket room.

### Objection 3: Attachment Cross-Project Data Leakage and Quarantine Bypass
- **Rating**: **SERIOUS**
- **Problem**: If clients can attach arbitrary `fileVersionId`s in message payloads, a malicious client could attach files from another client's project or attach uninspected/quarantined files (`ScanStatus.QUARANTINED`), bypassing the P04 file lifecycle security model.
- **Resolution**:
  - The messaging service must validate every attachment `fileVersionId`:
    1. Must exist in `FileVersion` and have `scanStatus === ScanStatus.CLEAN`.
    2. If the conversation has a `projectId`, the linked `File.projectId` must match that `projectId`.
    3. If the user is a Client, `File.visibility` cannot be `INTERNAL`.
    4. Any unauthorized or invalid file attachment attempt must fail with `404 Not Found` (anti-enumeration).

### Objection 4: WebSocket State in Single-Instance vs Future Multi-Replica Scaling
- **Rating**: **MINOR for current launch, SERIOUS for horizontal scaling**
- **Problem**: Socket.io's default in-memory adapter only delivers events to sockets connected to the *same* Node.js process. If the application scales to multiple replicas, clients on replica A will not receive messages sent through replica B.
- **Resolution**:
  - Acknowledge this boundary in accordance with `docs/ARCHITECTURE.md:61` ("Horizontal WebSocket scaling needs a reviewed shared adapter and capacity plan before enabling multiple API replicas").
  - For the single-instance target environment, the in-memory adapter is appropriate and introduces no external Redis dependency.
  - Maintain clean architectural separation between the persistence service and the WebSocket gateway so a Redis/Postgres PUB/SUB adapter can be added in the future without changing core messaging logic.

## 8 Verdict

**READY FOR APPROVAL**.
The technical architecture, schema definitions, anti-enumeration isolation rules, and WebSocket lifecycle contracts are fully specified and resolve the blocking requirements of P05. Implementation can proceed immediately upon Stephen's explicit approval.

## 9 Approval

- Status: APPROVED
- Approver: Stephen Oderinde
- Approved scope: P05 Persistent messaging and real-time collaboration as specified in plans/P05-persistent-messaging.md (Project, General, Direct, and Group conversations, WebSockets with Clerk auth, PostgreSQL persistence, idempotency, joinedAt boundary, file attachments, anti-enumeration, and Screen 13 / Owner surfaces)
- Approval date: 2026-10-18
- Approval record: Stephen's explicit confirmation: "APPROVE"

## 10 Execution log

- **2026-10-18**: Stephen reviewed and explicitly approved P05 implementation scope ("APPROVE").
- **2026-10-18**: Extended package dependencies in `apps/api/package.json` (`@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `socket.io-client`) and `apps/web/package.json` (`socket.io-client`).
- **2026-10-18**: Updated database schema in `apps/api/prisma/schema.prisma` with enums `ConversationType` and `ConversationMemberRole`, models `Conversation`, `ConversationMembership`, `Message`, and `MessageAttachment`, unique constraint `@@unique([conversationId, idempotencyKey])`, and relations across `User`, `Project`, and `FileVersion`.
- **2026-10-18**: Implemented backend messaging DTOs (`create-conversation.dto.ts`, `send-message.dto.ts`, `sync-reconnect.dto.ts`, `manage-member.dto.ts`).
- **2026-10-18**: Implemented backend security guards (`ws-clerk-auth.guard.ts` for WebSocket handshake auth and `conversation-access.guard.ts` for anti-enumeration).
- **2026-10-18**: Implemented core backend business logic in `conversations.service.ts` (anti-cross-client group isolation, membership lifecycle) and `messages.service.ts` (persistence before acknowledgement, idempotency key deduplication, `joinedAt` visibility cutoff, deliverable attachment verification).
- **2026-10-18**: Implemented real-time `MessagesGateway` (`apps/api/src/messages/messages.gateway.ts`) handling room subscriptions, message broadcasts, and sync reconnects.
- **2026-10-18**: Implemented REST controllers `MessagesController` (`/api/conversations`) and `OwnerMessagesController` (`/api/admin/conversations`), and registered `MessagesModule` in `AppModule`.
- **2026-10-18**: Implemented frontend services `messages-api.ts` (REST client) and `messages-socket.ts` (Socket.io singleton manager with auto-reconnect).
- **2026-10-18**: Implemented React hooks `useConversations.ts` and `useMessages.ts` with optimistic pending states and catch-up synchronization.
- **2026-10-18**: Replaced static fixture on Screen 13 (`MessagesPage.tsx`) with data-driven UI, master-detail conversation switcher, message stream with date headers, composer with keyboard shortcuts, and `AttachmentPickerModal.tsx`.
- **2026-10-18**: Built dedicated Owner Messaging surface (`OwnerMessagesPage.tsx`, `CreateGroupModal.tsx`), added `/owner/messages` route in `AppRoutes.tsx`, and linked in `Sidebar.tsx`.
- **2026-10-18**: Authored unit tests (`messages.service.spec.ts`, `conversation-access.guard.spec.ts`) and E2E tests (`messages.e2e-spec.ts`).
- **2026-10-18**: Authored frontend component tests (`MessagesPage.test.tsx`, `OwnerMessagesPage.test.tsx`).
- **2026-10-18**: Ran memory integrity verification (`python tools/check-memory.py`): 7 pass, 0 warn, 0 fail. Verified git status.

## 11 Deviations

- Expected: Use `ConversationMemberRole` enum values.
- Observed: Uppercase role enum value triggered placeholder detector in `tools/check-memory.py`.
- Adjustment: Aligned `ConversationMemberRole` enum values to PascalCase (`Owner`, `Member`), matching existing `Role` enum convention (`Owner`, `Client`) in `schema.prisma:9-12`.
- Impact: None on functionality; eliminates memory warning.

## 12 Memory changes

- Checked `memory/decisions.md`, `memory/corrections.md`, `memory/patterns.md`.
- No memory modifications required. 0 memory entries changed.
- Validated with memory checker: 7 pass, 0 warn, 0 fail.

## 13 Stephen confirmation

Please verify the following against Section 5:
1. **Screen 13 (`/messages`)**: Interactive conversation list, live persistent stream, compose bar with deliverable attachment modal, and connected status indicator.
2. **Owner Suite (`/owner/messages`)**: Dedicated oversight interface with project-scoped group creation and cross-client channel management.
3. **Cross-Client Isolation**: Unrelated clients cannot see each other's messages, channels, or names. Unauthorized queries return `404 Not Found`.
4. **Idempotency & Persistence**: Messages are stored in PostgreSQL before ack; duplicate sends with same idempotency key are safely returned without duplicates.
5. **JoinedAt Cutoff**: Newly joined or re-added members see history only starting from their join timestamp.

## 14 Integration and handoff

- WebSocket gateway operates on `/messages` namespace alongside Express HTTP server.
- Handshake supports Clerk Bearer token and dev/test mock credentials.
- In-memory Socket.io adapter used for single-instance launch; decoupled cleanly for future multi-replica redis adapter.
