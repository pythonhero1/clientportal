# Acceptance checklist

All implementation checks are NOT YET ATTEMPTED. This is the release checklist, not a record of test passes. Save actual results and evidence in the relevant task plan during implementation.

## Account and isolation

- [ ] Public signup requires verified identity and Owner activation before project access.
- [ ] Verified invitations activate only the intended Client with explicitly assigned access.
- [ ] Initial Owner setup cannot be triggered through public signup or submitted roles.
- [ ] Owner MFA is enforced on protected backend operations; recovery is demonstrated.
- [ ] Client A, Client B and an inactive account are tested independently.
- [ ] Clients cannot read unrelated project metadata, counts, search results, messages, invoices, calendar events, document links or notification payloads.
- [ ] Role/project checks cover HTTP, WebSockets, file issuance and background recipients.
- [ ] Profile changes and session revocation use supported Clerk flows and safe server reconciliation.

## All 18 screens

- [ ] Every row in SCREEN-MAP.md has real data/actions, including error and empty states.
- [ ] Dark and light themes work on desktop, tablet and mobile for all 18 screens.
- [ ] No Owner controls or unimplemented buttons are presented as working Client actions.
- [ ] Fixture names, amounts, dates and counts have not become production data.
- [ ] Keyboard navigation, focus, form errors, dialogs and 200 percent zoom are usable.
- [ ] Text/control contrast is checked in the effective rendered themes.
- [ ] External Clerk and Cal.com surfaces remain usable and understandable.

## Projects and onboarding

- [ ] Owner can create a Client engagement, website and project and assign explicit grants.
- [ ] The assigned Client can access only the intended projects and files.
- [ ] Questionnaire autosave, explicit save, failure/retry and reload preserve input.
- [ ] All six onboarding steps reflect actual completion; access sharing requires confirmation.
- [ ] Kickoff, milestone, revision and approval transitions match the reviewed policy.
- [ ] Project documents open via Drive links with recipient permissions verified in Drive.
- [ ] No client password or decryption-bearing sharing link is stored in ordinary portal data.
- [ ] No-active-project behavior works without leaking another Client's project.

## Files and review

- [ ] All seven approved categories are accepted/validated as intended.
- [ ] Invalid type, oversize, interrupted and malicious/unsupported inspection results are handled.
- [ ] An actual maximum-sized upload passes through the selected provider without Node buffering the entire file.
- [ ] Completed objects are verified server-side before becoming available.
- [ ] File versions are immutable and feedback/approval remains bound to its exact version.
- [ ] Internal files are never available to Clients.
- [ ] Owner archive/soft delete/restore/permanent deletion permissions are enforced.
- [ ] The 90-day recovery boundary, restricted post-window state and authorization are tested with a controlled clock.
- [ ] No storage lifecycle rule automatically purges protected archived/deleted versions.
- [ ] Audit entries cover the full lifecycle and record safe actor/object/outcome metadata.

## Messages and notifications

- [ ] Stephen has selected the outstanding removal/rejoining/privacy policy.
- [ ] Messages persist before acknowledgement and survive reconnect/restart.
- [ ] Duplicate sends and out-of-order events do not create duplicate visible messages.
- [ ] Join/removal/rejoin history tests match the selected membership periods.
- [ ] Only Owner creates/manages groups, without exposing unrelated Clients.
- [ ] Attachment access follows file-version permission checks.
- [ ] In-app history and read/unread behavior persist per account.
- [ ] Push permission is requested after a user action, with allowed/denied/unsupported states.
- [ ] Subscription/logout/account switching cannot send another account's private information.
- [ ] Approved notification recipients and timing are implemented, including Owner-only file lifecycle alerts.
- [ ] Push content remains safe on a lock screen and opens an authorization-checked destination.
- [ ] The service worker does not cache private API responses for offline browsing.

## Billing meetings and support

- [ ] Currency, seller details, invoice numbering, tax behavior and collection method are explicit.
- [ ] Issued invoices/PDFs use real data, stable numbers and decimal-safe money.
- [ ] Only Owner and designated billing contacts can view invoices.
- [ ] Browser redirects cannot mark paid; server evidence and idempotent events are checked.
- [ ] Repeated/out-of-order payment and Cal.com events are safe.
- [ ] Booking, reschedule and cancellation reconcile correctly across timezone displays.
- [ ] Calendar entries are scoped to authorized projects and billing access.
- [ ] Clients can create/read only their own authorized tickets; Owner replies and changes reviewed statuses.
- [ ] Published help content is real and no invented response-time promise appears.

## Release and recovery

- [ ] Hosting plan and 7Gb meaning are verified against the actual deployment requirements.
- [ ] Budget, region, database, object storage and scanner capacity are approved.
- [ ] A clean install, typecheck, lint, relevant tests and production builds pass.
- [ ] Development, staging and production keys/data are separated.
- [ ] HTTPS, SPA routing, API proxy, WebSocket reconnect and process restart are verified on staging.
- [ ] Real provider webhook signatures, idempotency and replay handling are verified.
- [ ] Logs contain no credentials, raw session tokens, private sharing links or sensitive push data.
- [ ] A database/object restore rehearsal succeeds and reconciles deletion records.
- [ ] A specific previous build and migration rollback/forward-fix plan are available.
- [ ] Stephen completes Owner/Client user acceptance and explicitly authorizes production launch.
- [ ] Production smoke tests pass, and source/runbooks/known issues are handed over.

Any unchecked release requirement remains visible. It must not be silently replaced by a screenshot or a claim that the deadline was met.
