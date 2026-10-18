# Permissions

The first release has Owner and Client only. A public signup is pending until Owner activates it. A verified invitation activates only the intended account with explicitly assigned access. Clerk identity and application authorization are separate checks.

## Current baseline

| Capability | Owner | Client |
| --- | --- | --- |
| Operate portal and manage projects/websites | Yes | No management grant by default |
| Approve or suspend Client activation | Yes | No |
| View project data | All in this business | Assigned authorized projects only |
| View internal files | Yes | No |
| View shared project files and versions | Yes | Authorized membership and file grants |
| Upload shared files | Yes | Authorized Client upload grant |
| Submit deliverables | Yes | No staff submission grant |
| Comment on a version | Yes | Authorized project/file access |
| Approve a deliverable | Yes | Explicitly designated approver for that project/version |
| View invoices and billing details | Yes | Explicitly designated billing contact |
| Generate or change invoice records | Yes | No |
| Create groups and manage membership | Yes | No |
| Discover or message people | Subject to conversation policy | Owner and authorized collaborators; no unrelated Clients |
| Soft-delete, restore or authorize permanent deletion | Owner, within approved lifecycle | No |
| Receive deletion/restoration activity alerts | Owner only | No |
| Manage profile and sessions | Own account, through supported Clerk flows | Own account, through supported Clerk flows |
| Manage help content and incoming support | Owner interface proposed | Read published help and submit own request |

The last support-management row is a proposed operating workflow awaiting task-plan review. Do not grant an ordinary collaborator invoice access just because they can access a project.

## Enforcement

Authorize every query and mutation in NestJS. Scope lists, counts, search, activity feeds, calendar events, file issuance, Drive-link metadata and push recipients. Returning an ID, document title or invoice total can itself disclose another Client's information.

Check object-to-project ownership in addition to project membership. A permitted project ID combined with another project's file ID must fail. Apply the same checks to WebSocket join, history, send, attachment and reconnect paths.

Use deny-by-default guards with explicit access grants, not hidden UI controls. Cache keys must include the authorized user/scope. Do not expose an Owner user selector or Owner-only summary through a Client endpoint.

## Initial Owner

Use a documented server-side bootstrap procedure that binds Stephen's verified Clerk user ID once. Require MFA before granting protected Owner operations. Never infer Owner status from being the first signup or from a submitted role/email domain. Keep bootstrap actions auditable and disable repeat elevation after the Owner exists.

## Pending rules

Multiple user accounts for one client company, account deletion effects, automatic company-wide access and removal/rejoining history are not settled. Use explicit project membership rather than inferring access from a company name or email domain. Do not implement a company invitation feature until its policy is reviewed.
