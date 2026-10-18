---
trigger: always_on
description: Preserve the portal scope and Stephen's approved decisions before every task
---

# Portal memory rules

Read root `AGENTS.md` first. Stephen approves implementation and confirms completion.

Current scope: one business portal, Owner and Client only, all 18 client screens, English, desktop/tablet/mobile, dark/light. React/TypeScript, separate NestJS/TypeScript API, managed PostgreSQL, Prisma, Clerk, private S3-compatible files and persistent WebSocket messaging.

Read matching `memory/corrections*.md`, architecture-related `memory/decisions*.md`, relevant `memory/patterns*.md`, the task plan and `docs/OPEN-DECISIONS.md`. Search the whole memory family. If code exists, consult the analysis gaps file but verify against current code.

New explicit instructions from Stephen override older plans. Record supersession. Never silently restore Admin or Team Member scope. Proposals are not approvals. A yes that does not distinguish opposing options leaves that choice open.

Write actual decisions and corrections immediately with their source. Keep proposals in documentation. Open and quote an entry before citing its ID. Memory is plain ASCII UTF-8, max 200 lines per file. Use an editor; avoid PowerShell redirection. Check the full family for duplicate IDs and subjects. Run the memory checker after changes.

Use real evidence for existing code. Do not describe planned paths, mocks or sample Figma values as working implementation. Do not read or print secret values to establish setup status.
