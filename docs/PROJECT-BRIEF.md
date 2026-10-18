# Project brief

Updated 18 October 2026. Stephen is the approver.

The portal serves Stephen's business and its clients. Clients use it to complete onboarding, follow their websites and projects, exchange files and feedback, review invoices, communicate, schedule meetings and obtain support. Stephen operates those services through the Owner interface.

The release includes all 18 client screens in the supplied Figma file and the minimum Owner interface needed to operate their real workflows. Owner pages do not have supplied Figma frames; their layout must be proposed using the same visual system. No Admin or Team Member interface is included in this release.

## Established scope

- Independent application at `portal.oderindestephen.com`; WordPress remains separate.
- Windows development in Antigravity 2.24.0, starting with no application code or repository.
- English; desktop, tablet and mobile; dark and light themes.
- React/TypeScript frontend and separate NestJS/TypeScript backend.
- Managed PostgreSQL and Prisma; database provider remains open.
- Clerk with verified identities, public registration requiring Owner activation, and verified invitations activating with assigned access.
- Controlled initial Owner setup; mandatory Owner MFA; optional Client MFA; secure recovery and audit records.
- Private S3-compatible application files, application version history, version-specific feedback and approvals, 500 MB/file and the previously approved seven file categories.
- Project documents are private Google Drive links. Ordinary file uploads and their review history remain separate features.
- Project, general, direct and group messaging with PostgreSQL persistence and NestJS WebSockets; protected client discovery; Owner-controlled group creation/membership; new members see history only from joining.
- Browser push plus the in-app notification history shown in Figma.
- Internally generated invoices. Currency, payment method/provider and invoice business rules remain open.
- Cal.com selected under Stephen's instruction to choose the meeting integration.

## Delegated choices

Individual Figma screen appearance takes priority over conflicting older Foundations colors. A semantic token system extends those screens to light mode.

Temporary collaborator invitations are the preferred way to grant platform access. Where passwords must be transferred, use Bitwarden Send externally. The portal records access status and instructions rather than becoming a password vault.

## Target

21 October 2026, Africa/Lagos, with no launch time supplied. The three-day window is aggressive for a new application with 18 screens and several provider integrations. The plan preserves the requested scope; it does not promise the date or trade away release checks.

## Unresolved answers

The hosting provider/plan is unnamed and the meaning of `7Gb` is not known. Yes answers to several multi-option questions do not select payment methods, conversation removal/rejoining behavior, detailed support policies or timing for notifications. These are recorded in `OPEN-DECISIONS.md`; the build must not invent approvals for them.
