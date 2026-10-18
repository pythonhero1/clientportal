# Decision register

Updated 18 October 2026. Current explicit answers override earlier scope. An approval to create this workflow is not approval to deploy the application.

## Current decisions

| Area | Current decision | Basis |
| --- | --- | --- |
| Business | Stephen's business and clients only | Current answer 3 |
| Development | Windows; Antigravity 2.24.0; no existing application or repository | Current answer 1 |
| Launch scope | All 18 client screens; Owner and Client roles only | Current answer 2 |
| Domain | portal.oderindestephen.com; independent of WordPress | Earlier approved architecture |
| Core stack | React/TypeScript; separate NestJS/TypeScript; managed PostgreSQL; Prisma | Earlier approved architecture |
| Authentication | Clerk; public signups need approval; verified invited Clients activate with assigned access | Earlier approved architecture, with Owner replacing removed Admin authority |
| Security | Controlled initial Owner; mandatory Owner MFA; optional Client MFA; recovery and privileged-action audits | Earlier approved architecture, narrowed to current roles |
| Client experience | English; desktop, tablet, mobile; dark and light | Current answer 4 |
| Design precedence | Individual screen appearance before conflicting Foundations colors | Selection delegated in answer 4 |
| File storage | Private S3-compatible storage, separate from PostgreSQL/API; 500 MB/file; seven approved categories | Earlier approved architecture |
| File versions | Preserve prior versions; feedback/approval attaches to the exact version | Earlier approved architecture |
| File deletion | Archive until authorized deletion; Owner soft deletion; 90-day recovery; Owner-authorized permanent deletion after window; full audit | Earlier approved architecture, narrowed to Owner |
| Deletion alerts | Owner only in the current two-role release | Earlier Owner/authorized Admin recipient choice; current removal of Admin role |
| Documents | Links to Drive only for project documents | Current answer 6 |
| Credentials | Temporary collaborator access, or external Bitwarden Send where credentials must be transferred | Selection delegated in answer 6 |
| Invoice origin | Generate invoices inside the portal | Current answer 7 |
| Meetings | Cal.com booking interface with verified provider integration | Retained from Figma under delegated choice in answer 8 |
| Messaging foundation | Persistent NestJS WebSockets; project/general/direct/group conversations | Earlier approved architecture |
| Discovery | Clients see authorized collaborators and Owner; unrelated Clients are not discoverable | Earlier approved privacy decision, narrowed to current roles |
| Groups | Owner controls creation/membership; new participants see only messages from joining | Earlier approved permissions, narrowed to Owner |
| Notifications | Browser push is selected; in-app history remains one of the 18 screens | Current answer 10 and release scope |
| Planning identity | Stephen is the approver | Current answer 13 |
| Launch date | Target 21 October 2026, Africa/Lagos | Current answer 2; no time specified |

## Superseded scope

Earlier plans included Owner, Admin, Team Member and Client. Current answer 2 removes Admin and Team Member from the first release. Do not build those dashboards, grant those roles or seed sample staff accounts. Their earlier authorized duties fall to Owner in this release; the earlier rules do not grant Clients additional powers.

## Inherited workflow behavior

The supplied kit plans before implementation and uses task approval. Stephen named the approver but did not choose a different gate. The package retains task approval and continuous execution within approved scope. This is inherited template behavior, not a newly approved switch to phase approval.

## Recommendations awaiting review

Supporting libraries, hosting topology, provider accounts, retention/recovery values, notification events/timing, invoice rules and the message-removal policy are recommendations or open decisions. Their full status is in `OPEN-DECISIONS.md` and `PROPOSED-POLICIES.md`. Do not move these into active decision memory until approved or explicitly delegated.
