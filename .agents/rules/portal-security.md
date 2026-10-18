---
trigger: glob
description: Apply authentication and isolation rules to portal API and database changes
globs: "apps/api/**, packages/contracts/**"
---

# Portal API rules

Read `docs/PERMISSIONS.md`, `docs/FILE-LIFECYCLE.md` and relevant open decisions.

Authorize in the backend on every operation and WebSocket event. Resolve the activated portal user from verified Clerk identity. Check project/conversation membership and role from trusted data. Never trust a submitted role, company ID, uploader identity, invoice amount or object-storage key.

Owner MFA is mandatory. Prevent public Owner assignment, cross-client search/count leaks, unauthorized Drive-link retrieval and unprotected file URLs. Keep client passwords out of portal data.

Use decimal-safe money operations, transactional invoice numbers and verified idempotent provider webhooks. Persist messages before acknowledgement. Recheck membership after reconnect and before sending history or push payloads.

Private uploads require authorized issuance, server validation of completed objects, size/type checks and safe handling before release. Version objects are immutable. No automatic deletion of archived or soft-deleted project files.

Keep auth, project access and audit behavior meaningful in tests. Proposed retention and message removal policies remain unapproved until Stephen selects them.
