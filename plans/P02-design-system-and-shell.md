# Design System and Responsive Shell

- Task: P02 implement semantic tokens, dark and light themes, responsive AppShell navigation, shared accessible UI components, all-screen routing structure (Screens 01–18 and Owner surfaces), persistent theme preferences, error/empty/loading/forbidden states, and labeled fixture previews
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement the authoritative design system tokens for dark and light themes, responsive authenticated AppShell navigation (desktop persistent sidebar, tablet compact navigation, mobile drawer), reusable accessible UI primitives, declarative route hierarchy for all 18 client screens and Owner management surfaces, persistent theme preference with zero-flash boot, and visible fixture labels so that every screen renders responsively across 390px, 768px, 1024px, and 1440px viewports with keyboard focus and WCAG AA contrast.

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

### Proposed modifications to existing files:
- `apps/web/package.json:13-25`: Add runtime UI dependencies (`react-router-dom`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`, `clsx`, `tailwind-merge`) and devDependencies (`tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`). Add `"test": "vitest run"` script.
- `apps/web/vite.config.ts:1-17`: Add Tailwind CSS Vite plugin and configure Vitest test environment (`environment: 'jsdom'`).
- `apps/web/index.html:1-14`: Add synchronous `<script>` in `<head>` to read stored theme or system preference and apply `data-theme` before initial paint, eliminating Flash of Unstyled Content (FOUC).
- `apps/web/src/index.css:1-63`: Remove Vite template styles (`#root` 1126px width restriction and text-align center), import Tailwind CSS directives, and configure root responsive layout defaults.
- `apps/web/src/App.css:1-185`: Remove obsolete template CSS (`.hero`, `.base`, `#center`, `.ticks`).
- `apps/web/src/styles/tokens.css:1-68`: Reconcile semantic CSS variables with `docs/DESIGN-SYSTEM.md` table: restore `--border` to `#24334B` (Dark) / `#CBD5E1` (Light); align canvas, surface, text, and link tokens; define `--focus-ring`, `--card-surface`, and badge tokens.
- `apps/web/src/App.tsx:1-15`: Wrap application in `ThemeProvider`, `BrowserRouter`, and global `ErrorBoundary`.
- `apps/web/src/routes/AppRoutes.tsx:1-59`: Replace manual `useState`/`popstate` switch with declarative `react-router-dom` route hierarchy (`<Routes>`, `<Route>`, `<Outlet />`), nesting authenticated screens inside `AppShell` and auth screens in `AuthLayout`.
- `apps/web/src/layouts/AuthLayout.tsx:17-30`: Connect to shared `useTheme()` hook and enforce 2px accessible focus ring on theme toggle.

### Proposed new files in `apps/web`:

#### Theme & State Management:
- `apps/web/src/contexts/ThemeContext.tsx`: Context providing `theme` (`'system' | 'dark' | 'light'`), `resolvedTheme` (`'dark' | 'light'`), and `setTheme` with `localStorage` persistence and system `prefers-color-scheme` listener.
- `apps/web/src/hooks/useTheme.ts`: Hook consuming `ThemeContext`.

#### Responsive Shell Layout:
- `apps/web/src/layouts/AppShell.tsx`: Root authenticated shell with responsive sidebar, top bar, mobile drawer, skip-to-content link, role-aware navigation, and `<Outlet />`.
- `apps/web/src/layouts/components/Sidebar.tsx`: Desktop persistent sidebar (width 16rem / 256px) and tablet compact sidebar (width 5rem / 80px) with brand header, navigation links, and active state pill indicators.
- `apps/web/src/layouts/components/TopBar.tsx`: Responsive header with mobile hamburger button, breadcrumb hierarchy, project context dropdown, notification bell button, and user menu.
- `apps/web/src/layouts/components/MobileDrawer.tsx`: Accessible mobile slide-over drawer (viewport < 768px) with focus trap and escape dismissal.
- `apps/web/src/layouts/components/NavItem.tsx`: Reusable navigation item with Lucide icon, route matching, badge count, and visible focus rings.
- `apps/web/src/layouts/components/UserMenu.tsx`: Dropdown menu displaying user name, email, role badge (`Owner` vs `Client`), theme mode switcher, and sign-out action.

#### Accessible Shared UI Primitives (`apps/web/src/components/ui/`):
- `apps/web/src/components/ui/Button.tsx`: Accessible button supporting variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`), sizes (`sm`, `md`, `lg`), loading spinner state, and visible focus rings.
- `apps/web/src/components/ui/Input.tsx`: Form input component with label, error text, helper text, accessible ARIA attributes, and focus-visible styling.
- `apps/web/src/components/ui/Badge.tsx`: Status pills supporting variants (`success`, `warning`, `danger`, `neutral`, `accent`, `fixture`).
- `apps/web/src/components/ui/Tabs.tsx`: Accessible tab primitive built on `@radix-ui/react-tabs` with keyboard arrow navigation.
- `apps/web/src/components/ui/Dialog.tsx`: Modal dialog built on `@radix-ui/react-dialog` with backdrop, focus trap, and escape key listener.
- `apps/web/src/components/ui/Card.tsx`: Structured surface container with header, content, and footer slots utilizing semantic surface and border tokens.
- `apps/web/src/components/ui/Skeleton.tsx`: Animated pulse skeleton for loading states.
- `apps/web/src/components/ui/Spinner.tsx`: Accessible SVG loading spinner with `aria-live` announcement.
- `apps/web/src/components/ui/EmptyState.tsx`: Reusable empty state view with illustration/icon, title, description, and primary call-to-action button.
- `apps/web/src/components/ui/Toast.tsx` & `apps/web/src/contexts/ToastContext.tsx`: Accessible toast notification system.
- `apps/web/src/components/ui/FixtureBadge.tsx`: Prominent fixture banner and badge clearly marking mockup screens awaiting backend domain connections.

#### Error & Fallback Feedback:
- `apps/web/src/components/feedback/ErrorBoundary.tsx`: React error boundary catching render crashes with user-facing recovery options.
- `apps/web/src/components/feedback/NotFoundPage.tsx`: In-shell 404 page for unmatched routes.
- `apps/web/src/components/feedback/ForbiddenPage.tsx`: In-shell 403 page for unauthorized cross-role attempts.

#### Client Screens 06–18 (Scaffolded with Labeled Fixtures):
- `apps/web/src/features/onboarding/pages/OnboardingPage.tsx`: Screen 06 Onboarding (`/onboarding`).
- `apps/web/src/features/dashboard/pages/OverviewPage.tsx`: Screen 07 Dashboard Overview (`/overview`).
- `apps/web/src/features/projects/pages/ProjectsListPage.tsx`: Screen 08 Projects & Websites (`/projects`).
- `apps/web/src/features/projects/pages/ProjectWorkspacePage.tsx`: Screen 09 Project Workspace (`/projects/:projectId`).
- `apps/web/src/features/files/pages/FilesFeedbackPage.tsx`: Screen 10 Files & Feedback (`/files`).
- `apps/web/src/features/invoices/pages/InvoicesPage.tsx`: Screen 11 Invoices (`/invoices`).
- `apps/web/src/features/onboarding/pages/QuestionnairePage.tsx`: Screen 12 Onboarding Questionnaire (`/onboarding/questionnaire`).
- `apps/web/src/features/messages/pages/MessagesPage.tsx`: Screen 13 Messages & Support (`/messages`).
- `apps/web/src/features/meetings/pages/MeetingsCalendarPage.tsx`: Screen 14 Meetings & Calendar (`/meetings`).
- `apps/web/src/features/notifications/pages/NotificationsPage.tsx`: Screen 15 Notifications (`/notifications`).
- `apps/web/src/features/settings/pages/SettingsPage.tsx`: Screen 16 Profile & Security (`/settings`).
- `apps/web/src/features/support/pages/SupportHelpPage.tsx`: Screen 17 Help Center & Ticket (`/support`).
- `apps/web/src/features/dashboard/pages/NoActiveProjectPage.tsx`: Screen 18 No Active Project (`/no-project`).

#### Owner Management Surfaces:
- `apps/web/src/features/owner/pages/OwnerDashboardPage.tsx`: Owner Overview (`/owner`).
- `apps/web/src/features/owner/pages/OwnerClientsPage.tsx`: Client invitations and pending approval queue (`/owner/clients`).
- `apps/web/src/features/owner/pages/OwnerProjectsPage.tsx`: Project creation and client assignment (`/owner/projects`).
- `apps/web/src/features/owner/pages/OwnerFilesPage.tsx`: File review, approvals, and 90-day lifecycle management (`/owner/files`).
- `apps/web/src/features/owner/pages/OwnerInvoicesPage.tsx`: Invoice creation, issuance, and payment tracking (`/owner/invoices`).
- `apps/web/src/features/owner/pages/OwnerSupportPage.tsx`: Support ticket queue and resolution (`/owner/support`).

#### Automated Test Suite:
- `apps/web/src/styles/tokens.test.ts`: Automated WCAG AA contrast ratio verification (4.5:1 text, 3:1 controls) for dark and light tokens.
- `apps/web/src/contexts/ThemeContext.test.tsx`: Theme preference persistence and system detection unit tests.
- `apps/web/src/layouts/AppShell.test.tsx`: AppShell navigation, responsive layout toggles, and mobile drawer accessibility tests.
- `apps/web/src/routes/AppRoutes.test.tsx`: Route integration test verifying all 18 client screens, owner routes, and 404 fallback render without throwing.

## 4 Contract status

### 4.1 Confirmed interfaces
- Auth token and session contract: Confirmed via Clerk SDK and existing `GET /api/auth/me` endpoint.
- Route prefix: Confirmed as client SPA root with `/api` proxy target `http://localhost:3000`.
- Semantic token contract: Confirmed by `docs/DESIGN-SYSTEM.md` (canvas, surface, surface raised, inset surface, border, text, muted text, primary, primary link, success, warning, danger).

### 4.2 Proposed interfaces for review
- Client route structure (`docs/SCREEN-MAP.md`):
  - `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email` (AuthLayout)
  - `/overview`, `/onboarding`, `/projects`, `/projects/:projectId`, `/files`, `/invoices`, `/onboarding/questionnaire`, `/messages`, `/meetings`, `/notifications`, `/settings`, `/support`, `/no-project` (AppShell)
- Owner route structure:
  - `/owner`, `/owner/clients`, `/owner/projects`, `/owner/files`, `/owner/invoices`, `/owner/support` (AppShell with Owner role indicator)
- Component API contracts: Standard React TypeScript props for Button, Input, Badge, Dialog, Drawer, Card, Skeleton, EmptyState.

## 5 Scope and acceptance

Quote from `Oderinde-Stephen-Client-Portal-Build-Plan-v1.md:111-115`:
> "Create semantic tokens, both themes, navigation, shared controls and route structure. Connect the selected theme to persistent preference. Cover loading, empty, error, forbidden and pending states. Propose the minimum Owner navigation and working management surfaces.
> Exit: representative pages match the Figma desktop composition, work at the selected narrow widths and 200 percent zoom, and support keyboard use in both themes. Screens using fixtures are labeled until connected."

### Measurable Acceptance Criteria:
1. **Semantic Tokens**: `tokens.css` matches `docs/DESIGN-SYSTEM.md`. `--border` is `#24334B` (Dark) and `#CBD5E1` (Light). Unit tests verify all text/surface combinations satisfy WCAG AA contrast (4.5:1 normal text, 3:1 control boundaries).
2. **Themes**: Dark, light, and system modes supported. Selection persists in `localStorage`. Boot script in `index.html` prevents Flash of Unstyled Content (FOUC).
3. **Responsive Shell**:
   - Desktop (>= 1024px): Persistent sidebar (256px), readable content area, top bar.
   - Tablet (768px – 1023px): Compact sidebar (80px) with icons and tooltip/popover labels.
   - Mobile (< 768px): Top bar with hamburger trigger, slide-over drawer with accessible focus trap.
   - Viewport testing passes at 390px, 768px, 1024px, 1440px and at 200% zoom without horizontal overflow.
4. **All 18 Screens & Owner Views**:
   - All 18 client screens in `docs/SCREEN-MAP.md` are mounted to valid browser routes.
   - All 6 Owner management views (`/owner/*`) are mounted and accessible under Owner role context.
   - Unbuilt screens display high-contrast `FixtureBadge` ("PREVIEW FIXTURE - Live data connected in Phase P0x") to prevent mistaking mockup content for implemented backend features.
5. **Shared UI Library**: Reusable Button, Input, Badge, Tabs, Dialog, Card, Skeleton, EmptyState, and Toast primitives built with visible 2px focus rings (`--focus-ring`) and accessible ARIA attributes.
6. **State Handling**: Global `ErrorBoundary` catches unexpected crashes; `NotFoundPage` (404) handles invalid URLs; `ForbiddenPage` (403) handles unauthorized cross-role access; loading skeletons render during route transitions.
7. **Verification Gate**: `npm run verify` (typecheck + lint + unit/e2e tests + build) passes with zero errors across `@os-portal/web` and `@os-portal/api`.

## 6 Ordered steps

### Step 1: Install Dependencies & Setup Test Harness (`apps/web`)
- Add runtime UI libraries (`react-router-dom`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`, `clsx`, `tailwind-merge`) to `apps/web/package.json`.
- Add devDependencies (`tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`).
- Configure `apps/web/vite.config.ts` for Tailwind CSS and Vitest environment.
- Add test script to `apps/web/package.json` (`"test": "vitest run"`).
- *Verification*: Run `npm.cmd install` from root; run `npm.cmd run typecheck --workspace @os-portal/web`.
- *Rollback*: Revert changes to `apps/web/package.json` and `apps/web/vite.config.ts`, run `npm.cmd install`.

### Step 2: Semantic Tokens, Clean Baseline CSS & FOUC Prevention
- Reconcile `apps/web/src/styles/tokens.css` with `docs/DESIGN-SYSTEM.md`: restore `--border` hex values, align canvas/surface/link colors, define `--focus-ring` (Dark `#2F6DF6`, Light `#1D4ED8`), and add component tokens.
- Add pre-hydration theme script to `apps/web/index.html` to eliminate FOUC.
- Clean `apps/web/src/index.css`: remove `#root` 1126px width restriction and dead template rules; import Tailwind CSS directives.
- Clean `apps/web/src/App.css`: remove dead template code.
- Implement `apps/web/src/styles/tokens.test.ts` to programmatically verify WCAG AA contrast ratios (4.5:1 for text, 3:1 for borders).
- *Verification*: Run `npm.cmd run test --workspace @os-portal/web` to verify contrast test passes.
- *Rollback*: Revert changes to `tokens.css`, `index.html`, and `index.css`.

### Step 3: Global Theme Context & Preferences
- Implement `apps/web/src/contexts/ThemeContext.tsx` supporting `'system'`, `'dark'`, `'light'` with `localStorage` persistence and `matchMedia` listener.
- Implement `apps/web/src/hooks/useTheme.ts`.
- Implement `apps/web/src/contexts/ThemeContext.test.tsx` verifying persistence and theme switching.
- Refactor `apps/web/src/layouts/AuthLayout.tsx` to consume `useTheme()`.
- *Verification*: Run unit tests in `apps/web`; verify theme toggle switches `data-theme` attribute on root element.
- *Rollback*: Revert `ThemeContext.tsx`, `useTheme.ts`, and `AuthLayout.tsx`.

### Step 4: Shared Accessible UI Component Library
- Implement in `apps/web/src/components/ui/`:
  - `Button.tsx` (primary, secondary, outline, ghost, danger, link; loading state; focus rings)
  - `Input.tsx` (accessible text fields with label, error, ARIA descriptions)
  - `Badge.tsx` (status pills: success, warning, danger, neutral, accent, fixture)
  - `Card.tsx` (surface card container with tokenized borders)
  - `Tabs.tsx` (Radix-backed accessible keyboard tab bar)
  - `Dialog.tsx` (Radix-backed modal dialog with focus trap and escape dismissal)
  - `Skeleton.tsx` (pulse loading skeleton)
  - `Spinner.tsx` (accessible SVG spinner)
  - `EmptyState.tsx` (empty list / no data container)
  - `Toast.tsx` & `ToastContext.tsx` (temporary user feedback notifications)
  - `FixtureBadge.tsx` (prominent visual marker for mockup views)
- *Verification*: Run `npm.cmd run typecheck --workspace @os-portal/web` and `npm.cmd run lint --workspace @os-portal/web`.
- *Rollback*: Remove `apps/web/src/components/ui/` directory.

### Step 5: Responsive Shell & Navigation
- Implement in `apps/web/src/layouts/`:
  - `AppShell.tsx`: Root authenticated shell with responsive layout, skip link (`#main-content`), and `<Outlet />`.
  - `components/Sidebar.tsx`: Desktop persistent sidebar (256px) and tablet compact navigation (80px) with role badge.
  - `components/TopBar.tsx`: Responsive top bar with mobile menu trigger, breadcrumbs, notifications bell, and user menu.
  - `components/MobileDrawer.tsx`: Slide-over drawer for viewports < 768px.
  - `components/NavItem.tsx`: Nav item with active indicator pill, Lucide icon, and keyboard focus.
  - `components/UserMenu.tsx`: Dropdown with user avatar, name, role badge, theme picker, and logout action.
- Implement `apps/web/src/layouts/AppShell.test.tsx` verifying desktop, tablet, and mobile drawer toggling.
- *Verification*: Run unit tests in `apps/web`; verify clean render and responsive class application.
- *Rollback*: Revert `apps/web/src/layouts/` additions.

### Step 6: Route Hierarchy & All 18 Screens + Owner Views
- Implement feedback pages: `ErrorBoundary.tsx`, `NotFoundPage.tsx` (404), `ForbiddenPage.tsx` (403).
- Implement scaffolded screens with `FixtureBadge`:
  - Client Screens 06–18: Onboarding (`/onboarding`), Overview (`/overview`), Projects (`/projects`), Workspace (`/projects/:projectId`), Files (`/files`), Invoices (`/invoices`), Questionnaire (`/onboarding/questionnaire`), Messages (`/messages`), Meetings (`/meetings`), Notifications (`/notifications`), Settings (`/settings`), Support (`/support`), No Project (`/no-project`).
  - Owner Views: `/owner`, `/owner/clients`, `/owner/projects`, `/owner/files`, `/owner/invoices`, `/owner/support`.
- Configure `apps/web/src/routes/AppRoutes.tsx` with `react-router-dom`:
  - Auth routes under `AuthLayout` (Screens 01–05).
  - Client routes under `AppShell` with Client role context (Screens 06–18).
  - Owner routes under `AppShell` with Owner role context.
  - 404 catch-all route.
- Implement `apps/web/src/routes/AppRoutes.test.tsx` checking that all routes mount without runtime exceptions.
- *Verification*: Run `npm.cmd run test --workspace @os-portal/web` and `npm.cmd run build --workspace @os-portal/web`.
- *Rollback*: Revert routes and feature page additions.

### Step 7: Composite Verification & Memory Integrity
- Run full composite verification gate from root:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run test:e2e`
  - `npm.cmd run build`
- Run `py -3 tools/check-memory.py` to ensure memory integrity.
- Verify git status to confirm no untracked secrets or invalid build artifacts.
- Update plan execution log and submit plan for Stephen's confirmation.
- *Rollback*: Revert any failing step before submission.

## 7 Objections

### O1 Installing UI libraries and Tailwind CSS requires explicit approval
- *Rating*: Blocker
- *Concern*: `AGENTS.md` mandates that all dependency and tool additions require Stephen's approval with the applicable implementation plan. Modifying `package.json` before approval violates the gate.
- *Resolution*: All proposed packages (`react-router-dom`, `lucide-react`, `@radix-ui/*`, `tailwindcss`) are explicitly documented in Section 3 and Section 6 of this plan. No source code or `package.json` modifications will be made until Stephen explicitly approves this plan.

### O2 Risk of fixture-only mockup screens mistaken for completed backend functionality
- *Rating*: Serious
- *Concern*: Mounting all 18 screens in P02 before the respective backend services (P03–P08) are implemented risks stakeholder confusion, where users might assume file uploads, billing, or messaging are working features.
- *Resolution*: Enforce a prominent, non-dismissible `FixtureBadge` / banner on screens 06–18 ("PREVIEW FIXTURE - Live data connected in Phase P0x"). Keep action buttons disabled or displaying non-mutating preview toasts, and document this distinction explicitly.

### O3 React 19 compatibility with UI primitives
- *Rating*: Serious
- *Concern*: `apps/web/package.json` pins React to `^19.2.8`. Some UI libraries or Radix primitives historically declared peer dependencies locked to React 18, which can cause npm install failures.
- *Resolution*: Use current releases of `@radix-ui` and `react-router-dom` that support React 19. If any specific primitive encounters an unresolvable peer conflict, provide an accessible native alternative (such as HTML `<dialog>` with standard ARIA and keydown focus management) rather than forcing `--legacy-peer-deps`.

### O4 Absence of supplied Owner reference frames in Figma
- *Rating*: Serious
- *Concern*: Figma only supplied frames for the 18 client screens; no Owner frames were provided (`BUILD-PLAN.md:93`). Creating ad-hoc Owner views could result in visual inconsistency or unauthorized divergence.
- *Resolution*: Reuse the exact layout shell, tokens, typography, and UI primitives established for the Client screens. Maintain a clean, professional tabular/card layout for Owner workflows (Client approvals, project assignments, file review, invoices, ticket queue) and clearly label the view with an "Owner Workspace Management" banner.

### O5 Flash of opposite theme on initial page load (FOUC)
- *Rating*: Minor
- *Concern*: Theme preference resolved inside React's `useEffect` executes after the browser's initial paint. If a user selects light mode, a brief dark flash will occur on page refresh.
- *Resolution*: Inject a small synchronous inline `<script>` in the `<head>` of `apps/web/index.html` that reads `localStorage.getItem('theme')` or system preference and applies `data-theme` to `<html>` before DOM rendering begins.

### O6 Keyboard accessibility and WCAG AA contrast compliance in light mode
- *Rating*: Minor
- *Concern*: Existing auth inputs had `outline: 'none'`, and light mode is a design extension not present in the original Figma design (`docs/DESIGN-SYSTEM.md:7`). Without automated contrast testing, light theme text may fail accessibility standards.
- *Resolution*: Enforce visible 2px focus rings (`outline: 2px solid var(--primary); outline-offset: 2px`) on all interactive elements. Add automated unit tests (`tokens.test.ts`) verifying that all token color pairs meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text and UI boundaries).

## 8 Verdict

READY FOR APPROVAL.
The implementation plan is concrete, follows the 14-section template, resolves all gaps identified in the codebase audit, meets all P02 exit criteria, provides complete coverage for all 18 screens and Owner management surfaces, and preserves strict data and role isolation boundaries.

## 9 Approval
 
- Status: APPROVED
- Date: 2026-10-18
- Stephen's approval instruction: "APPROVE"
- Approved scope: Phase P02 Design System and Responsive Shell as defined in Sections 3, 5, and 6 of this plan: semantic tokens, dark/light themes, responsive AppShell navigation, shared accessible UI components, all-screen routing structure (Screens 01-18 and Owner surfaces), persistent theme preferences, error/empty/loading/forbidden states, and labeled fixture previews.

## 10 Execution log

- **2026-10-18**: Completed exhaustive codebase gap analysis via research subagent.
- **2026-10-18**: Formulated comprehensive 14-section plan `plans/P02-design-system-and-shell.md`.
- **2026-10-18**: Stephen explicitly approved implementation scope (`APPROVE`).
- **2026-10-18**: Installed and configured required frontend dependencies (`react-router-dom`, `lucide-react`, `@radix-ui/*`, `clsx`, `tailwind-merge`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `jsdom`).
- **2026-10-18**: Reconciled semantic tokens in `tokens.css` with `docs/DESIGN-SYSTEM.md` and added WCAG AA contrast test suite in `tokens.test.ts` (10/10 passed).
- **2026-10-18**: Built persistent `ThemeContext` (`dark`, `light`, `system`), system preference listener, and injected zero-flash boot script into `index.html`. Automated tests in `ThemeContext.test.tsx` (4/4 passed).
- **2026-10-18**: Built accessible UI primitives: `Button`, `Input`, `Badge`, `FixtureBadge`, `Card`, `Skeleton`, `Spinner`, `EmptyState`, `Tabs`, `Dialog`, `ToastContext`.
- **2026-10-18**: Built responsive `AppShell` with persistent 256px desktop sidebar, 80px tablet compact sidebar, mobile drawer, skip link, and role switching. Automated tests in `AppShell.test.tsx` (4/4 passed).
- **2026-10-18**: Scaffolded Screens 06–18 and 6 Owner views with declarative routing in `AppRoutes.tsx`, error boundary, 404, and 403 pages. Automated route integration suite in `AppRoutes.test.tsx` (27/27 passed).
- **2026-10-18**: Ran full verification gate (`npm.cmd run verify`): TypeScript compilation (0 errors across web & api), oxlint (0 errors across web & api), Vitest unit tests (45 passed in web, 2 passed in api), Vite build (success), NestJS build (success).
- **2026-10-18**: Ran full end-to-end suite (`npm.cmd run test:e2e`): 3 test files, 26 tests passed.
- **2026-10-18**: Ran memory integrity checker (`python tools/check-memory.py`): PASS (7 pass, 0 warn, 0 fail).
- Implementation status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION.

## 11 Deviations

None.

## 12 Memory changes

No memory changes. Applicable memory cited: D-1, D-5, D-11, D-13, D-15, P-1, P-2, P-3.

## 13 Stephen confirmation

Upon completion of P02, Stephen will verify:
1. `tokens.css` matches `docs/DESIGN-SYSTEM.md` and automated contrast tests pass WCAG AA standards.
2. Dark, light, and system theme preferences persist across reloads without initial theme flash (FOUC).
3. The responsive AppShell renders cleanly across desktop (persistent sidebar), tablet (compact navigation), and mobile (slide-over drawer) at 390px, 768px, 1024px, 1440px viewports and 200% zoom.
4. All 18 client screens and 6 Owner management views are accessible via browser routes and render within the responsive shell.
5. Unbuilt feature screens are clearly labeled with `FixtureBadge` to distinguish mockup fixtures from live backend features.
6. Reusable Button, Input, Badge, Dialog, Tabs, Card, Skeleton, and EmptyState components support keyboard navigation with visible focus rings.
7. Composite verification (`npm run verify`) and memory integrity checks (`py -3 tools/check-memory.py`) pass with zero errors.

## 14 Integration and handoff

- External dependencies: npm packages (`react-router-dom`, `lucide-react`, `@radix-ui/*`, `tailwindcss`).
- Runbook:
  1. Once approved, install dependencies with `npm.cmd install`.
  2. Implement semantic tokens, CSS resets, and FOUC boot script.
  3. Implement ThemeContext and shared UI components.
  4. Implement AppShell and route hierarchy for Screens 01–18 and Owner views.
  5. Run `npm.cmd run verify` to confirm all builds and tests pass cleanly.
