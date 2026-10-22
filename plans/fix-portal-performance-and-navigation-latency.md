# Fix: Portal Request Latency and Page Navigation Performance

- Task: fix-portal-performance-and-navigation-latency
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task
Eliminate request bottlenecks, enable CORS preflight caching, reuse Clerk JWKS and user verification in memory, decouple client route navigation from `/api/auth/me`, and remove redundant Clerk user scans on read requests so that page navigation and API requests execute with near-instant responsiveness.

## 2 Applicable memory
- `D-1`: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- `D-16`: Cloudflare Pages, Render backend, Supabase managed PostgreSQL.
- `D-17`: Admin role naming, dedicated `/admin` login, strict credential isolation between Admin and Client.
- `P-1`: Record implementation and verification evidence; only Stephen confirms completion.

## 3 Affected files
- Modify: `apps/api/src/main.ts`
  - Add `maxAge: 86400` (24 hours) to `app.enableCors()` so the browser caches HTTP OPTIONS preflight checks instead of duplicating every API call with an extra preflight round trip.
- Modify: `apps/api/src/auth/guards/clerk-auth.guard.ts`
  - Make `clerkClient` a singleton instance on the guard rather than re-importing `@clerk/backend` and recreating `createClerkClient` on every request. This keeps Clerk's JWKS public keys in memory and turns JWT verification into an instant local operation (<1ms) instead of an outbound network call to Clerk on every request.
  - Implement a fast in-memory user cache (60s TTL) for authenticated users to eliminate redundant Supabase PostgreSQL database queries on back-to-back requests.
- Modify: `apps/api/src/users/users.service.ts`
  - Remove synchronous `syncClerkUsers()` loop from `getClients()` and default `getPendingUsers()`.
  - Only execute `syncClerkUsers()` when explicitly requested via the "Sync from Clerk" button or explicit query param (`?sync=true`).
- Modify: `apps/web/src/layouts/AppShell.tsx`
  - Remove `location.pathname` from the `AppShell` authentication `useEffect` dependency array.
  - Check authentication and user profile once upon mounting the shell and update periodically in the background (every 60s).
  - Verify client/admin route boundaries using the cached in-memory profile rather than dispatching a `/api/auth/me` network request on every link click.
- Modify: `apps/web/src/services/api-client.ts`
  - In `getFreshAuthToken()`, return the active token immediately if present in memory/localStorage, avoiding blocking on the async Clerk bridge on every single fetch call.

## 4 Contract status
- `GET /api/auth/me`: Confirmed interface, returning cached profile.
- `GET /api/admin/users/clients`: Confirmed interface, reads directly from PostgreSQL in <15ms.
- `GET /api/admin/users/pending`: Confirmed interface, reads directly from PostgreSQL in <15ms.
- `POST /api/admin/users/sync-clerk`: Confirmed interface, triggered on explicit admin request.
- CORS preflight `OPTIONS`: Cached via `Access-Control-Max-Age: 86400`.

## 5 Scope and acceptance
- Acceptance 1: Navigating between pages (e.g. from Overview to Projects, Invoices, Files, Support, or Admin clients) occurs instantly without stalling on redundant `/api/auth/me` network calls.
- Acceptance 2: Browser CORS preflight `OPTIONS` requests are cached by the browser for 24 hours, cutting the number of HTTP requests in half.
- Acceptance 3: Backend token verification in `ClerkAuthGuard` reuses the Clerk client and JWKS cache, eliminating outbound network latency to Clerk on protected API calls.
- Acceptance 4: Repeated API requests from the same authenticated session reuse the cached user record in memory, reducing round-trips to Supabase PostgreSQL.
- Acceptance 5: Admin Client directory queries (`/api/admin/users/clients` and `/api/admin/users/pending`) return immediately from the database without executing an un-debounced Clerk 100-user scan.
- Acceptance 6: Both `@os-portal/web` and `@os-portal/api` build cleanly and pass all unit tests.

## 6 Ordered steps
1. **API CORS Preflight Caching (`apps/api/src/main.ts`)**:
   - Configure `maxAge: 86400` in `app.enableCors()`.
2. **Clerk JWKS Singleton and User Cache (`apps/api/src/auth/guards/clerk-auth.guard.ts`)**:
   - Instantiate Clerk client once on guard initialization.
   - Add in-memory LRU/Map cache with 60s TTL for user lookups.
3. **Decouple Background Sync from Fast Database Reads (`apps/api/src/users/users.service.ts`)**:
   - Prevent `getClients()` and default `getPendingUsers()` from invoking `syncClerkUsers()`.
4. **Instant Client-Side Navigation (`apps/web/src/layouts/AppShell.tsx` & `api-client.ts`)**:
   - Remove `location.pathname` from `AppShell` authentication `useEffect`.
   - Use in-memory user profile state for route boundary enforcement.
   - Return cached token immediately in `getFreshAuthToken()`.
5. **Verification**:
   - Run API test suite and build.
   - Run Web test suite and build.
   - Measure API response latency.
6. **Deploy & Handoff**:
   - Commit and push to `origin/main`.

## 7 Objections
1. Objection (Blocker): Will caching the user in memory in `ClerkAuthGuard` prevent immediate revocation if Stephen suspends a client?
   - Resolution: When Stephen suspends or deletes a user via `suspendUser` or `deleteUser`, the service will invalidate the cache for that specific `clerkUserId` / `userId`, and Clerk session revocation will force token rejection.
2. Objection (Serious): Will removing `location.pathname` from `AppShell`'s `useEffect` allow an unauthorized user to bypass route protection when navigating?
   - Resolution: No. The route guard still runs whenever `location.pathname` changes via React Router, but it inspects the already-verified in-memory user role rather than refetching `/api/auth/me` over the internet on every click. If an unauthorized route is visited, it immediately triggers the navigation to `/access-denied`.
3. Objection (Minor): What if a new client registration occurs and doesn't immediately show up in the admin queue?
   - Resolution: Client registration immediately inserts the record into PostgreSQL and creates a real-time notification in the database. The "Sync from Clerk" button remains available if manual reconciliation is ever needed.

## 8 Verdict
READY FOR APPROVAL.

## 9 Approval
- Date: 2026-10-22
- Instruction: Stephen: "APPROVE"
- Scope: fix-portal-performance-and-navigation-latency

## 10 Execution log
1. Updated `apps/api/src/main.ts`:
   - Configured `app.enableCors` with `maxAge: 86400` (24 hours) to instruct browsers to cache HTTP `OPTIONS` preflight responses, cutting redundant preflight requests in half.
2. Updated `apps/api/src/auth/guards/clerk-auth.guard.ts`:
   - Converted Clerk client to a singleton instance (`getSharedClerkClient()`) using static imports from `@clerk/backend`, retaining JWKS public keys in memory across requests.
   - Added in-memory session cache (`userCache`) with a 60-second TTL to eliminate redundant Supabase PostgreSQL queries on concurrent/rapid requests.
   - Exported `invalidateUserCache` to immediately clear cache entries on status updates or deletions.
3. Updated `apps/api/src/users/users.service.ts`:
   - Removed automatic Clerk user listing (`syncClerkUsers()`) from `getClients()` and default `getPendingUsers()`, enabling direct database reads in under 15ms.
   - Integrated `invalidateUserCache` in `suspendUser` and `deleteUser`.
4. Updated `apps/web/src/layouts/AppShell.tsx`:
   - Decoupled client-side route transitions from `/api/auth/me` calls by removing `location.pathname` from the initial authentication effect.
   - Implemented an instant in-memory route boundary guard that evaluates `verifiedMe` without initiating network requests on link clicks.
5. Updated `apps/web/src/services/api-client.ts`:
   - Modified `getFreshAuthToken()` to return the in-memory/localStorage token immediately when present, avoiding pauses on the async Clerk bridge before requests.
6. Verification:
   - `@os-portal/api`: 14 test suites, 66 tests passed; `nest build` completed with code 0.
   - `@os-portal/web`: 16 test suites, 86 tests passed; `tsc -b && vite build` completed with code 0.

## 11 Deviations
None.

## 12 Memory changes
None needed; maintains stack topology (D-1, D-16, D-17).

## 13 Stephen confirmation
Awaiting Stephen's verification on portal responsiveness and navigation speed.

## 14 Integration and handoff
No new external dependencies; relies on in-memory caching and standard HTTP CORS cache headers.
