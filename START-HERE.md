# Oderinde Stephen Client Portal

Version 1.0 | 18 October 2026 | Prepared for Stephen

This is the workflow and implementation plan for building the portal in Google Antigravity on Windows. It contains planning documents and agent instructions. The application has not been built or deployed.

## Start

1. Extract this package into the folder you will open as your project root, for example `C:\Projects\oderinde-client-portal`.
2. Read `docs/OPEN-DECISIONS.md`. The hosting answer, payment details and messaging policy need precise answers; they do not prevent preparing the workspace.
3. Follow `SETUP-WINDOWS.md` to check Git, Node.js 24 LTS and Python. Antigravity 2.24.0 is already installed according to Stephen.
4. Open that exact root folder in Antigravity. Confirm the two always-on rules and the project skills are visible. Start a new conversation after opening the folder.
5. Paste `START-PROMPT.md`, or invoke `/portal-start` if it appears in the skill list. The plain prompt works if discovery is unavailable.
6. Review `plans/P00-workspace-bootstrap.md`. It is a proposed implementation task, not an approval already given. The agent must show its concrete plan before asking Stephen to approve code changes.

## What is settled

- One portal for Stephen's business and clients at `portal.oderindestephen.com`, separate from the WordPress site.
- The first release covers all 18 client screens, with Owner and Client access only.
- Windows, a new codebase, English, desktop/tablet/mobile, dark and light themes.
- React and TypeScript, a separate NestJS TypeScript API, Prisma and managed PostgreSQL, Clerk authentication.
- Existing file versioning, private storage, 500 MB/file and deletion rules remain in force. Project documents are Google Drive links.
- Browser push is the selected notification channel; the Notifications screen remains the persistent in-app history.
- Target launch date: 21 October 2026 in Africa/Lagos. This is a target, not a verified delivery commitment.

## How the kit works

`AGENTS.md` is the root protocol. `.agents/rules/` holds short enforcement rules. `.agents/skills/` holds reusable procedures for starting, planning, building, verifying, releasing and resuming work. `memory/` preserves actual decisions and corrections. `plans/` records task approval and execution evidence.

The default approval behavior from the supplied kit is retained: Stephen approves a concrete task plan before application changes. A switch to approval per phase has not been selected. Approval already given for a task covers its documented steps; the agent should continue without repeated permission requests inside that scope.

## Read in this order

1. `BUILD-PLAN.md` - tools, Windows setup, architecture and ordered implementation.
2. `docs/DECISION-REGISTER.md` and `docs/OPEN-DECISIONS.md` - what can be relied on and what remains unresolved.
3. `docs/SCREEN-MAP.md` - every client screen and its completion criteria.
4. `docs/ACCEPTANCE-CHECKLIST.md` - what must work before release.
5. `docs/DEPLOYMENT.md` - hosting checks, deployment, recovery and handoff.

## Compatibility

Google's documentation, checked on 18 October 2026, announces that legacy `.agents/workflows/` execution ends on 19 October 2026. This package uses project skills under `.agents/skills/` instead. It does not install anything into ChatGPT's personal Skills workspace. See `docs/SOURCES.md`.

## Progress labels

Use `DRAFT`, `AWAITING APPROVAL`, `APPROVED`, `IN PROGRESS`, `BLOCKED`, or `IMPLEMENTED - AWAITING STEPHEN CONFIRMATION`. Only Stephen confirms completion. A polished screen using fixtures remains a preview until its real behavior is verified.
