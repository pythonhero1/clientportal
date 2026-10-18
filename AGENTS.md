# Oderinde Stephen Client Portal agent protocol

Stephen is the project owner and the person who approves implementation and confirms completion.
This is one project workspace and one future Git repository. The package currently contains planning and workflow files only.

## Scope and authority

- Build the independent portal, separate from Stephen's WordPress website.
- The current release has Owner and Client roles only. Earlier four-role planning is superseded.
- Cover all 18 client screens, English, desktop/tablet/mobile and both themes.
- The authoritative build plan is `BUILD-PLAN.md`; current decision status is in `docs/DECISION-REGISTER.md`.
- Read `docs/OPEN-DECISIONS.md` before touching an affected area.
- A current explicit instruction from Stephen takes precedence over older project documents. Record the change and reconcile affected files.
- Approved decisions override older plans. Delegated selections are identified as such. Proposed policies and unanswered questions are not approvals.
- Figma describes appearance and visible journeys. It does not establish hidden access, payment, retention or notification policies.

## Read before every task

1. Search all `memory/corrections*.md` trigger lines and read matching entries.
2. Read all `memory/decisions*.md` for architecture, models, access or contract work.
3. Read all `memory/patterns*.md` for implementation conventions.
4. Read the relevant task plan and product documents.
5. If a codebase analysis exists, read `docs/analysis/06-gaps.md` before building.

Analysis is a dated map. Open current code before citing a behavior or changing it. Cite real `path:line` evidence; never invent locators. Mark mocks, stubs and unattempted checks honestly.

## Stack boundary

Approved core: React and TypeScript; separate Node.js NestJS TypeScript API; managed PostgreSQL; Prisma; Clerk; private S3-compatible binary storage; persistent NestJS WebSocket messaging.

Recommended supporting tools are listed in `BUILD-PLAN.md` and require approval with the applicable implementation plan. Do not silently substitute Next.js, Firebase, Supabase Auth, WordPress, PHP, a custom password store, another ORM or a serverless-only API. Do not add Redis, a mobile app or multi-agency tenancy without a demonstrated need and a reviewed plan.

Planned code directories, not yet present: `apps/web`, `apps/api`, and shared contract output if justified by both applications. Do not cite those paths as existing implementation.

## Plan before implementation

Before source, configuration, schema, tests or deployment changes, write a concrete plan in `plans/` using its 14-section template. Include scope, affected files, interface status, steps, meaningful checks, objections and rollback.

The supplied kit's per-task approval gate is retained. Stephen has not selected approval per phase. Accept `APPROVE`, `APPROVE WITH CHANGES`, or an equally explicit instruction from Stephen approving the identified implementation scope. A generic yes to a multi-option policy question is not a selection among the options.

Do not ask again for actions already covered by an approved plan. Continue its independent work to completion. A material business/security change outside approved scope requires an updated concrete plan; routine implementation details inside the scope do not.

Planning documents, evidence, memory entries and handoff notes can be maintained without a separate implementation approval. Creating this requested kit does not approve future application implementation, hosting purchases or production publication.

## Access and data

- Enforce activation, role and project access in the API, WebSocket events, search, download authorization and job recipients.
- A Clerk-authenticated account is not automatically an activated portal account.
- Clients cannot discover unrelated clients. Count, search, error and push payloads must preserve that boundary.
- Initial Owner assignment uses a controlled server-side procedure with verified identity. Never grant ownership from client input or a public signup.
- Owner MFA is mandatory; Client MFA is optional. Do not store or verify portal passwords independently of Clerk.
- Store binary files privately. Application version history and version-specific feedback remain separate from Drive document links.
- No automatic purge of archived or soft-deleted files. Preserve the 90-day recovery rule and Stephen's explicit authorization for permanent deletion after the window.
- Store no client passwords in questionnaires, messages, ordinary uploads, analytics, logs or push payloads. Use the delegated external credential-sharing approach.
- Treat push subscriptions, temporary download links and credential-sharing links as sensitive data.

## Unresolved contracts and choices

Propose new contracts in a plan before implementing them. A proposed route or entity in documentation is not an already-confirmed external interface. Establish producer, consumer, fields, errors and permission checks together.

For an external provider, verify its official API and account capabilities before integration. Do not turn guessed endpoints or sample amounts into production behavior. Isolate only the affected task when a choice is unresolved.

## Memory

Write actual corrections to `memory/corrections.md`, approved/delegated decisions to `memory/decisions.md`, and established conventions to `memory/patterns.md`.
Keep proposals in product documents, not active decision memory. Do not invent rejected options or historical mistakes.

Before writing, search every shard of the family for a duplicate subject and ID. IDs are monotonic across the family. Keep each memory file at 200 lines or fewer; merge duplicates, archive superseded entries older than 30 days, then create a numbered shard if needed. Never remove active knowledge to meet the cap.

Write plain ASCII UTF-8 through an editor/file-edit API. Avoid PowerShell redirects and encoding-sensitive shell one-liners. Read back written headings, then run `python tools/check-memory.py` or `py -3 tools/check-memory.py` on Windows.

Entry formats:

```text
### D-n - Title
- Decision: What Stephen approved or explicitly delegated.
- Source: Exact instruction or identified previous approval.
- Rejected: Only alternatives actually rejected, or not recorded.
- Applies to: Scope.
- Status: active or superseded by another entry.
- Date: YYYY-MM-DD
```

Use `C-n` with Trigger, I did, Correct, Why and Date for corrections. Use `P-n` with Rule, Applies when and Date for conventions. Open and quote an entry before citing its ID as authority.

## Execution and verification

Batch independent read-only checks. Serialize edits to the same files. Do not launch additional agents unless Stephen requests them or an applicable instruction requires them.

Run meaningful checks for changed behavior. Permission isolation, approval transitions, money, webhooks, uploads and message membership need behavioral tests. A CSS token does not prove accessible contrast or responsive rendering. A successful build does not prove business behavior.

Report task scope, what changed, evidence of checks, limitations and the concrete next step. Distinguish tests actually run from commands only documented. Never claim the Windows machine, provider, Figma import or production environment was tested from this planning package.

Only Stephen confirms completion. Before that, use `IMPLEMENTED - AWAITING STEPHEN CONFIRMATION`. End agent work reports with a plan path/status when relevant and a short memory update count.
