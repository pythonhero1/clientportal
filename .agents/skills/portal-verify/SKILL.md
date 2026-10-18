---
name: portal-verify
description: Verify portal behavior, project isolation, themes and all-screen acceptance with real evidence. Use for a task review or release candidate; never substitute a build pass for business tests.
---

# Verify the portal

Read the relevant approved plan, docs/SCREEN-MAP.md and docs/ACCEPTANCE-CHECKLIST.md. Inspect the actual scripts and environment before running commands.

1. Scope checks to the changed behavior and unresolved concerns; use the full checklist for a release candidate.
2. Run type/lint/relevant tests/build as applicable. Test authorization with Owner, two distinct Clients and an inactive user.
3. Exercise real persistence and failure paths for files, money, provider events and conversation membership. Confirm selected policies rather than inventing test expectations.
4. Inspect required screens in dark/light and desktop/tablet/mobile. Check keyboard, focus, zoom and private data in embeds/notifications.
5. Record commands, environment, observed outcome and safe evidence. Mark not-run checks NOT YET ATTEMPTED. A screenshot does not prove server permission checks.
6. Fix in-scope failures, then rerun the affected checks. Do not claim Stephen's Windows machine or production was checked unless it actually was.

Return verified outcomes, failures, unattempted work and the release impact. Update the plan; only Stephen confirms completion.

