---
name: portal-release
description: Prepare and verify a concrete portal deployment and recovery candidate. Use for staging or production release planning after the host and policies are known.
---

# Prepare a portal release

Read AGENTS.md, docs/OPEN-DECISIONS.md, docs/DEPLOYMENT.md and the full acceptance checklist.

1. Verify actual provider/plan capabilities and what 7Gb measures. Never invent a hosting topology or purchase services.
2. Resolve production blockers. Record source commit, artifacts, lockfile, configuration reference, migration sequence and test evidence.
3. Prepare exact deployment, smoke-test, monitoring and rollback/forward-fix steps. Verify database/object recovery and deletion reconciliation.
4. Complete authorized staging preparation and checks. Present a concrete production candidate before asking Stephen to authorize publication.
5. If release authorization already covers the exact candidate/environment, continue without asking again. Do not add destructive data operations outside that scope.
6. After deployment, verify auth, project isolation, file access, messaging, invoices, booking, tickets, push and supervised restart. Record outcomes and the handoff.

October 21 is a target, not permission to bypass missing checks or replace features with fixtures. Report exact unfinished work if release criteria fail.

