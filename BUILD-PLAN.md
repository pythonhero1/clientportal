# Oderinde Stephen Client Portal Build Plan

Version 1.0 | 18 October 2026 | Approver Stephen | Target 21 October 2026 | Timezone Africa/Lagos

## Purpose and current position

Build an independent client portal for Stephen's business using Google Antigravity on Windows. The first release includes all 18 client screens in Figma, an Owner interface to operate their workflows, English, desktop/tablet/mobile layouts, and dark/light themes.

The application is starting from scratch. This package supplies the implementation method, decisions, setup guide and checks; it contains no working portal or configured hosting. The October 21 date is a target. Launch requires the agreed scope to work and the release checks to pass.

Current status: planning prepared; application implementation NOT YET ATTEMPTED. Independent foundation work can proceed after its task plan is approved. Hosting, payments and some messaging/business policies still need precise answers before their affected production behavior is implemented.

## Confirmed choices and delegated selections

Keep the approved React/TypeScript frontend, separate NestJS/TypeScript backend, managed PostgreSQL, Prisma and Clerk. The current release has Owner and Client only; the earlier Admin and Team Member scope is superseded. Keep controlled Owner setup, mandatory Owner MFA, optional Client MFA and backend project access control.

Preserve private S3-compatible application files, 500 MB per file, seven approved file categories, immutable application versions, version-specific feedback and approval, the 90-day recovery window and Owner authorization for permanent deletion after that window. Archived or deleted project files must not be automatically purged.

Stephen delegated design precedence, credential handling and the meeting integration. Use the individual Figma screens ahead of conflicting older Foundations colors. Use temporary collaborator invitations, with external Bitwarden Send when passwords must be transferred. Retain Cal.com. Project documents are Google Drive links only; application file uploads remain a separate feature.

Internally generated invoices and browser push are selected. Actual invoice currency, collection method/provider, notification event timing and message removal/rejoining are not established by the short yes answers. Keep their proposed policies clearly marked for review.

## Recommended implementation tools

This table is a proposed supporting baseline for Stephen to review with the first implementation plan. It extends the approved core stack without silently replacing it.

| Area | Tool or approach | Why it fits |
| --- | --- | --- |
| Application language | TypeScript in frontend and backend | One language for interfaces, forms and server behavior |
| Runtime | Current patched Node.js 24 LTS | Supported runtime line compatible with current tool requirements |
| Repository | One Git repository with npm workspaces | Keeps the web/API changes and contract checks together |
| Frontend | React with Vite and React Router | Fits an authenticated portal without adding a second server framework |
| UI and themes | Tailwind CSS 4, semantic CSS tokens, selective Radix primitives | Reproduces Figma while supporting accessible dialogs and both themes |
| Server data | TanStack Query | Handles request state, cache invalidation and authenticated fetches |
| Forms | React Hook Form and Zod | Handles questionnaire drafts and client-side validation |
| Backend | NestJS with its standard Express adapter | Modular API, guards and provider integrations |
| Backend validation | Reviewed DTOs with class-validator and class-transformer | Validates server input independently of the browser |
| API contracts | NestJS OpenAPI plus generated frontend types | Reduces frontend/backend field drift |
| Database | Managed PostgreSQL with Prisma | Approved relational storage and reviewed migrations |
| Identity | Clerk official React and backend SDKs | Uses the approved authentication service |
| Real time | NestJS Socket.IO gateway and PostgreSQL message history | Persists messages and supports reconnect/history |
| File storage | AWS SDK v3 against a private S3-compatible provider | Supports authorized object transfers without database binary storage |
| Background work | PostgreSQL transactional outbox and one supervised worker | Durable retries without requiring Redis at the initial scale |
| Push | Web Push, VAPID and a service worker | Browser push without committing to a paid notification platform |
| Invoice output | Server-side PDF generation with a reviewed library such as PDFKit | Creates a stable issued invoice after billing rules are explicit |
| Verification | Vitest, Testing Library, API integration tests, Playwright | Checks behavior, permissions and complete browser journeys |
| Code quality | TypeScript strict mode, ESLint and formatting | Catches routine errors before integration |
| Automation | Repository CI after Stephen chooses the remote | Runs the same build, type and test checks before release |

Use the current stable compatible versions during the approved bootstrap, record them and commit the lockfile. Use npm ci afterwards. Do not keep upgrading during the launch build without a reason. Check the installed Clerk generation and Prisma requirements rather than copying older examples.

The existing hosting provider is not yet identified. Do not buy replacements or assume that 7Gb means RAM or usable file storage. Managed database and object-storage vendors remain conditional on the host, budget, region and capacity review.

## Windows setup and first run

1. Extract the kit into the exact project root and open that folder in Antigravity 2.24.0. Read START-HERE.md and START-PROMPT.md.
2. Check Git, Node.js and npm. Install Node.js 24 LTS and Git from their official Windows installers if missing. Python 3 is needed for the included memory checker. Docker and WSL are optional, not initial requirements.
3. Confirm AGENTS.md, the two always-on rules and the six project skills are recognized. Use the plain file prompt if slash discovery is unavailable. Do not create a competing root instruction file.
4. Review P00 with Stephen. Only after its scope is approved, scaffold the two applications, establish one npm workspace lockfile and implement the documented scripts.
5. Use separate local environment files for the browser and API. Never put server secrets in VITE_ variables or Git. The supplied example files contain no credentials.
6. Configure development Clerk, a non-production PostgreSQL database and private development storage after their accounts/choices are explicit. Use fixture-only previews for independent UI work, clearly labeled as previews.

Preflight commands in PowerShell are:

```powershell
git --version
node --version
npm.cmd --version
py -3 --version
py -3 tools/check-memory.py
```

The application setup commands, workspace script contract and account checklist are in SETUP-WINDOWS.md. These commands have been documented, not executed on Stephen's computer.

## Architecture and data ownership

Use a React SPA and one modular NestJS service. Prefer one public portal origin with a reverse-proxied API and WebSocket path if the hosting provider supports it. PostgreSQL owns application records, membership, invoice state, message history and audits. Private S3-compatible storage owns uploaded binary versions. Clerk owns identity and session security. Cal.com owns booking availability. Drive owns external document access.

Plan one repository with apps/web and apps/api. Add generated shared contracts only when both applications consume them. Keep ordinary modules rather than creating microservices. A single initial API instance avoids introducing a shared WebSocket adapter before capacity requires one.

Review the schema in P01. Separate activation, role, project membership, file permissions, designated approver and billing contact. A company name or matching email domain never automatically grants access. Establish HTTP and WebSocket contracts before connecting real behavior.

Use transactions for file-version transitions, invoice numbering, payment events and domain/outbox records. Persist a message before acknowledging it. Treat provider events as untrusted until verified and deduplicated. A browser payment redirect or booking callback must not become the final financial or meeting record.

## Figma implementation method

Map every frame in docs/SCREEN-MAP.md before implementation. Reproduce the actual screen at its supplied desktop size, then adapt its layout for tablet and mobile. Preserve meaningful hierarchy and actions instead of shrinking the desktop canvas.

Build semantic dark/light tokens and a reusable shell first. The dark reference comes from actual screens; the light palette is a required design extension. Use rem typography, visible focus and meaningful state labels. Check keyboard navigation, dialogs, validation, external embeds and contrast in both themes.

Figma's example names, prices, counts, deadlines and status badges are fixture content. Replace them with real authorized data. Do not expose Owner actions in Client pages or treat an attractive fixture screen as an implemented feature.

Clerk authentication/recovery must work through its supported SDK flows while matching the design. Add pending approval and denied-access states that the static Figma screens do not specify. Owner pages use the same system but need a reviewed layout because no Owner frames were supplied.

## Ordered implementation phases

Each phase becomes a concrete task plan with affected files, reviewed contracts, acceptance criteria, objections and rollback. A phase is not automatically approved by being listed here.

### P00 Workspace and reproducible foundation

Inspect tools, initialize Git, scaffold the web/API workspaces, pin dependencies, establish strict TypeScript, linting, test and build scripts, separate environment examples, and a real health check. Add CI after the remote is selected. Record exact versions and commands.

Exit: a clean dependency install builds both applications; the API starts and the browser can reach it through the development proxy. Secrets are ignored. The baseline has no production data, public Owner signup or fabricated integrations.

### P01 Database identity and authorization

Review the Prisma schema and migration strategy. Integrate Clerk, account activation, verified invitations, the controlled Owner bootstrap, MFA, secure recovery and Owner/Client/project guards. Implement the login, signup, forgot password, reset password and verify email journeys.

Exit: an unactivated account cannot read project data; Client A cannot access Client B through routes, IDs, counts or socket events; Owner MFA and invitation checks work. Authentication flows pass against the chosen development Clerk configuration.

### P02 Design system and responsive shell

Create semantic tokens, both themes, navigation, shared controls and route structure. Connect the selected theme to persistent preference. Cover loading, empty, error, forbidden and pending states. Propose the minimum Owner navigation and working management surfaces.

Exit: representative pages match the Figma desktop composition, work at the selected narrow widths and 200 percent zoom, and support keyboard use in both themes. Screens using fixtures are labeled until connected.

### P03 Projects websites onboarding and Drive documents

Implement the dashboard, projects/websites list, project workspace, six-step onboarding, autosaving questionnaire and no-active-project screen. Implement Owner project creation/assignment, website and milestone management, document link management and Client overview queries.

Exit: Owner creates a project and explicitly assigns access; the intended Client sees only that project; drafts save/reload; Drive documents open only for properly shared recipients; credential steps record status without collecting passwords. Kickoff, revision and milestone rules require the relevant policy review.

### P04 Uploads version review and lifecycle

Implement authorized direct uploads, all seven approved file categories, the 500 MB contract, resumable progress, safe inspection/quarantine, version history, feedback and designated approval. Implement archive, soft deletion, restoration, restricted post-window handling and the Owner-authorized permanent deletion operation.

Exit: unauthorized object issuance fails; invalid or uninspected uploads are not released; feedback remains attached to the reviewed version; replacement invalidates no history; the 90-day rules and audit events work. No object lifecycle rule silently purges protected files. Test a real maximum-sized transfer with the selected provider.

### P05 Persistent messaging

Finalize the outstanding removal/rejoining and group privacy rules before implementing those transitions. Build project, general, direct and Owner-created group conversations with authorized discovery, durable history, attachments linked to authorized file versions, reconnect and idempotent sends.

Exit: messages persist before acknowledgement and survive reconnect/restart; joining history starts at the allowed time; removal/rejoining behavior matches Stephen's selected policy; unrelated Clients cannot be discovered or exposed through search, groups or push payloads.

### P06 Invoices and selected collection method

Finalize currency, business identity, numbering, tax behavior and payment method. Build Owner invoice creation, line items, issued PDF, Client billing-contact access, statuses and payment evidence. Integrate a hosted payment gateway only if selected and supported by Stephen's account.

Exit: amounts/currency are server-controlled; invoice numbers are unique; ordinary project collaborators cannot see billing; duplicate/out-of-order payment events are safe; a browser redirect cannot mark an invoice paid. Real invoices are not issued with placeholder seller information or sample Figma amounts.

### P07 Cal.com and the project calendar

Configure the selected event type and calendar in Cal.com. Embed booking, expose provider-supported reschedule/cancel actions, verify webhooks, reconcile meetings and combine authorized meetings, milestones, due invoices and deadlines in the project calendar.

Exit: a real test booking, reschedule and cancellation produce the correct Client/Owner view in the correct timezone; repeated events do not duplicate bookings; unrelated calendar data never appears.

### P08 Notifications profile and support

Build persistent notification history, approved event recipients, reviewed push timing/preferences, secure subscription lifecycle, profile/security settings and the help/ticket journeys. Owner operates the support queue; exact ticket status and priority rules are reviewed first.

Exit: push works after permission and HTTPS setup; denial leaves the in-app history functional; logout/account switching cannot leak notifications; deletion/restoration alerts go only to Owner; Clients access only their own authorized tickets. No invented response-time promise appears.

### P09 Release verification deployment and handoff

Run the full acceptance checklist, all 18 screens in both themes and device classes, migration checks, integration failures, restore rehearsal and Stephen's user acceptance. Prepare an exact provider-specific deployment/rollback plan once the host is known.

Exit: approved scope works on staging; required checks pass; backup/restore is demonstrated; no open production blocker is disguised as complete. Stephen reviews the candidate and authorizes publication. Then verify production using Owner and two isolated Client accounts and document the handoff.

## Verification strategy

Use behavior tests for authorization, money, membership, file transitions and provider events. Use browser tests for complete journeys: Owner creates and assigns a project; Client completes onboarding, submits a file, receives review, communicates, views an authorized invoice, books a meeting and opens a support request.

Exercise denied access with two distinct Clients and an inactive account. Include identifiers from another project, search/count endpoints, temporary download issuance, WebSocket joins/history, notification recipients and calendar views. Test file and message state transitions against real persistence.

Use Playwright to inspect representative 390, 768, 1024 and 1440 CSS px viewports in both themes, plus the desktop Figma reference size and keyboard/zoom behavior. Verify all 18 screens, not only the dashboard. Record actual screenshots and results during implementation; none exist for the application yet.

Run type checks, linting, relevant unit/integration tests and production builds. Add a clean-install CI run and migration verification. An install/build pass does not prove access controls or payment correctness. Do not claim a browser push reached a user solely because a delivery endpoint accepted it.

## October 21 target schedule

| Date | Intended focus | Dependency |
| --- | --- | --- |
| October 18 | Confirm blockers; P00/P01 foundation; design-system start | Tool/account access and first task approval |
| October 19 | Core project/onboarding flows, responsive shell, uploads and messaging work | Schema, authorization and membership choices |
| October 20 | Billing, Cal.com, push/support integration and full journey verification | Real provider configuration and business rules |
| October 21 | Complete remaining verification, restore rehearsal, Stephen review and possible production launch | Every required release criterion passes |

This is a proposed sequencing target, not a promise that each day fits the workload. The scope is large for three days from a new repository. Do not replace working behavior with fixtures, remove requested screens or bypass security to report the date as met. If checks remain incomplete, report the exact remaining work and obtain a revised launch decision.

## Hosting deployment and recovery

First inspect the named provider/plan for long-running Node support, WebSocket proxying, TLS, SPA routing, supervised restarts, secrets, background jobs, logs and outbound integrations. Identify what 7Gb actually measures. A PHP-only shared plan cannot be treated as a NestJS deployment target.

Use managed PostgreSQL and private object storage separately from the web/API process. Keep development, staging and production separated. Confirm a cost and region before buying or provisioning services. The required database, storage and scanner capacity cannot be inferred from the file size limit alone.

Build and verify the release candidate, create a recoverable pre-migration backup, apply reviewed migrations once, deploy compatible web/API versions, configure HTTPS/provider callbacks and run smoke tests. Keep the previous build and a reviewed rollback strategy. Do not automatically run destructive rollback SQL or use production schema push/reset commands.

Stephen requested recovery proposals. The initial proposal is daily encrypted database backups with 30 days of points, object-version recovery, a 24-hour data-loss target and an 8-hour restore target, plus provider point-in-time recovery if supported and affordable. These values require review and a restore test. See docs/PROPOSED-POLICIES.md and docs/DEPLOYMENT.md.

## Daily Antigravity workflow

1. Start or resume using the project skill and read current memory, decisions and task state.
2. Create a concrete plan with scope, interfaces, files, checks, objections and rollback.
3. Have Stephen approve that task scope. Task approval is the inherited default; phase approval was not selected.
4. Implement the approved scope continuously, keeping the execution and deviation log current.
5. Verify real behavior and applicable browser views. Fix in-scope failures and rerun the relevant checks.
6. Update actual decisions/corrections, run the memory checker and commit reviewed work.
7. Report evidence and what Stephen should confirm. Keep incomplete work visible for the next session.

The procedures are packaged as project skills because Google's current documentation ends legacy workflow execution on October 19, 2026. Natural-language invocation by file path is included as a fallback. The supplied kit's 14-section task plans, memory families, objections and evidence discipline are retained in project-specific form.

## Decisions to resolve before affected work

The essential clarification batch is in docs/OPEN-DECISIONS.md: identify the hosting provider/plan and 7Gb allocation; specify invoice currency/business country/payment collection; select message removal/rejoining and unrelated-client group policy. Supporting notification, support, milestone and retention proposals can be reviewed with the applicable task plans.

Do not re-ask the approved core stack, role scope, 18-screen scope, device coverage, language, themes, Drive-link direction or Stephen's name. Do not label a proposal as approved because a deadline is near.

## Handoff and completion

Deliver source and lockfile, reviewed migrations, environment variable names without secret values, setup/deployment/recovery instructions, the screen and acceptance matrix, evidence of checks, known limitations and Owner operating instructions. Demonstrate creating a project, assigning a Client, issuing an invoice, sharing a document, reviewing a file, handling a ticket and restoring a file.

The final implementation report should say what works, what was tested, which checks failed or remain unattempted, and what Stephen needs to confirm. Only Stephen confirms completion. Do not describe this planning package as an implemented or deployed application.

## References

The technical choices were checked against official sources on 18 October 2026. The full source list is in docs/SOURCES.md, including Node.js LTS support, current Clerk/NestJS/Prisma setup guidance, Web Push, Cal.com, Bitwarden Send and Antigravity's workflow-to-skills migration notice.
