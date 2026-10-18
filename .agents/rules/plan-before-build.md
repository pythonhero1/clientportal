---
trigger: always_on
description: Create a concrete task plan and obtain Stephen's scope approval before implementation
---

# Portal implementation gate

Follow `AGENTS.md` and the 14-section template in `plans/README.md`.

Before application source, configuration, schema, test or deployment changes, write a plan file listing affected paths, acceptance criteria, interface status, ordered steps, checks, rollback and at least three genuine objections. For a one-file change without dependencies/contracts, two objections are enough.

Ask for approval only after the plan is concrete and reviewable. The inherited default is per-task approval. Do not infer a change to approval per phase. Stephen may explicitly approve a named scope in natural language or use APPROVE / APPROVE WITH CHANGES.

Once that scope is approved, continue it without repeated permission requests. Complete independent approved work even when another domain has a recorded blocker. Stop affected work for missing required information, material scope changes, irreversible actions outside scope or a real access failure. Explain exactly what is blocked.

Maintain execution evidence and deviations as work happens. Do not fake code locators in a new project. Proposed contracts can be reviewed in the plan; do not silently invent production endpoints or provider behavior.

Planning, evidence, memory and handoff updates need no additional implementation approval. Do not apply the gate to drafting the requested workflow itself.

October 21 is a target. Never skip authorization, data isolation or required release checks to make a date appear satisfied. All 18 client screens remain in scope unless Stephen changes it.
