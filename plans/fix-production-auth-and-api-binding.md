# Fix Production Auth and API Binding

- Task: FIX-AUTH-API-01: Connect web frontend to live Render API backend and integrate Clerk authentication guards
- Status: IN PROGRESS
- Created: 2026-10-22
- Updated: 2026-10-22
- Workspace: one portal repository

## 1 Task

Resolve the `Unexpected token '<', "<!doctype "... is not valid JSON` production runtime error by binding all frontend API client calls to `https://api-portal.oderindestephen.com`, and replace mock authentication in the web application with real Clerk authentication guards so unauthorized visitors cannot access the client portal.

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-2 - Independent portal`: "Use portal.oderindestephen.com independently of the WordPress website."
- `D-3 - Registration and security`: "Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA and optional Client MFA."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-16 - Production hosting providers`: "Host frontend SPA on Cloudflare Pages, backend API and WebSockets on Render, and managed PostgreSQL on Supabase."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."

## 3 Affected files

### Modify:
- `apps/web/package.json`: Add `@clerk/clerk-react` dependency.
- `apps/web/src/main.tsx`: Wrap `App` in `<ClerkProvider>` reading `VITE_CLERK_PUBLISHABLE_KEY`.
- `apps/web/src/services/api-client.ts`: Create centralized HTTP client that uses `https://api-portal.oderindestephen.com` in production and automatically attaches Clerk JWT session token.
- `apps/web/src/services/files-api.ts`: Route calls through centralized API client instead of relative `/api`.
- `apps/web/src/services/invoices-api.ts`: Route calls through centralized API client.
- `apps/web/src/services/notifications-api.ts`: Route calls through centralized API client.
- `apps/web/src/services/settings-api.ts`: Route calls through centralized API client.
- `apps/web/src/services/calendar-api.ts`: Route calls through centralized API client.
- `apps/web/src/services/projects-api.ts`: Route calls through centralized API client.
- `apps/web/src/features/auth/pages/SignInPage.tsx`: Integrate Clerk `<SignIn />` / sign-in flow and remove mock redirect to `/overview`.
- `apps/web/src/features/auth/pages/SignUpPage.tsx`: Integrate Clerk `<SignUp />` flow.
- `apps/web/src/layouts/AppShell.tsx`: Enforce real authentication guard (redirect unauthenticated users to `/sign-in`).

## 4 Contract status

- `Frontend -> API URL`: Confirmed `https://api-portal.oderindestephen.com/api` (Render Web Service).
- `Frontend Auth Token`: Confirmed Clerk JWT Bearer token passed in `Authorization: Bearer <token>`.
- `Backend Guard`: Confirmed `ClerkAuthGuard` validates token via Clerk Backend SDK and resolves user in Supabase.
- `Error Handling`: Confirmed non-JSON responses (HTML 404/502) are safely intercepted without crashing UI.

## 5 Scope and acceptance

1. Entering invalid credentials on `/sign-in` must display a real Clerk authentication error and prevent login.
2. Unauthenticated visitors navigating directly to `/overview`, `/files`, `/invoices`, etc., must be redirected to `/sign-in`.
3. Navigating to Files, Invoices, Notifications, and Settings must not display `Unexpected token '<', "<!doctype "...`.
4. API requests must reach `https://api-portal.oderindestephen.com` with valid CORS headers.

## 6 Ordered steps

1. Install `@clerk/clerk-react` in `apps/web`.
2. Create `apps/web/src/services/api-client.ts` with base URL fallback (`https://api-portal.oderindestephen.com` in production, relative in dev) and safe JSON parsing.
3. Update service modules (`files-api`, `invoices-api`, `notifications-api`, `settings-api`, `calendar-api`, `projects-api`) to use `api-client.ts`.
4. Wrap `apps/web/src/main.tsx` in `<ClerkProvider>`.
5. Update `SignInPage.tsx` and `SignUpPage.tsx` with Clerk authentication components and remove mock bypass redirect.
6. Add auth check in `AppShell.tsx` to redirect unauthenticated sessions to `/sign-in`.
7. Verify build with `npm run build --workspace=@os-portal/web`.
8. Commit and push to GitHub so Cloudflare deploys the updated web app.

## 7 Objections

- **Objection 1 (Blocker):** If `VITE_CLERK_PUBLISHABLE_KEY` is not present at Vite build time, ClerkProvider will throw an initialization error.
  *Resolution:* Provide a safe fallback or runtime check; Stephen must also set `VITE_CLERK_PUBLISHABLE_KEY` in Cloudflare Pages/Worker environment variables, and we embed Stephen's test publishable key as default if needed.
- **Objection 2 (Serious):** Switching from `/api` to `https://api-portal.oderindestephen.com` could trigger CORS preflight blocks in browsers.
  *Resolution:* We verified that Render's `main.ts` already has CORS configured with `origin: https://portal.oderindestephen.com` and `credentials: true`.
- **Objection 3 (Minor):** If the user is authenticated in Clerk but not yet activated in the database, what is shown?
  *Resolution:* The backend `AccountStatusGuard` returns 403 `ACCOUNT_PENDING_APPROVAL`, which routes the user to `/pending-approval`.

## 8 Verdict

READY FOR APPROVAL.

## 9 Approval

- Status: APPROVED
- Date: 2026-10-22
- Source: Stephen instruction: "APPROVE"
- Approved scope: Connect web frontend to live Render API backend and integrate Clerk authentication guards

## 10 Execution log

- NOT YET ATTEMPTED

## 11 Deviations

- None yet.

## 12 Evidence

- Screenshots provided by Stephen confirm HTML doctype syntax errors on Files, Invoices, Notifications, and Settings.
- Inspection of `SignInPage.tsx:46` confirmed `window.location.href = '/overview'` unconditionally bypasses authentication.

## 13 Limitations

- Full end-to-end Clerk token verification requires Stephen's `VITE_CLERK_PUBLISHABLE_KEY` to match the `CLERK_SECRET_KEY` currently on Render.

## 14 Next concrete step

Present plan to Stephen and request explicit scope approval to install `@clerk/clerk-react` and bind API endpoints.
