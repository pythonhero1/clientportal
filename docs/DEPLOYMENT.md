# Deployment and recovery

No host has been identified, connected or changed. This document is the provider-neutral runbook to specialize after the hosting plan is known.

## Verify the existing provider

Confirm the provider and plan, what 7Gb measures, supported Node versions, long-running processes, process supervision, WebSocket upgrade/proxy support, TLS/DNS, SPA fallback routing, API proxy configuration, environment secrets, scheduled/background work, persistent logs and outbound network access.

Confirm managed PostgreSQL connection/pool limits and migration access, private S3-compatible storage support and quotas, upload CORS, inspection capacity for 500 MB objects, backup features and region. Database, object storage and Drive storage are different capacities.

If the current plan serves static files/PHP only, retain what it can safely host and propose a compatible Node service for Stephen to review. Do not install a server daemon into an unsupported shared hosting account or buy a provider replacement from this generic runbook.

## Prepare environments

1. Choose approved staging and production resources and credentials separately.
2. Configure secret injection and browser publishable values. Validate required variables at startup without logging their values.
3. Configure the approved portal origin, TLS, API and WebSocket routing and strict allowed origins.
4. Set up private buckets, limited service credentials and authorized multipart/download behavior.
5. Configure the selected Clerk application, Cal.com event/webhook, reviewed payment provider if any, and browser push keys.
6. Establish backup and deletion-reconciliation procedures before introducing production data.

## Prepare the release candidate

1. Confirm all production blockers and business-policy choices are resolved.
2. Record Git commit, dependency lockfile, configuration version and migration list.
3. Run the agreed clean-install/type/lint/test/build checks and full acceptance matrix.
4. Build compatible web/API artifacts from the same reviewed source revision.
5. Create and verify a recoverable pre-migration backup. Rehearse migration against staging.
6. Prepare the exact provider commands, health checks, smoke tests, monitoring and rollback/forward-fix instructions in a release plan.
7. Present the concrete release candidate, evidence and remaining risks to Stephen. Publication follows his explicit authorization for that candidate/environment.

Preparing source, checks and a staging candidate does not require repeatedly asking for permission inside an approved task. Production publication and destructive data operations must be covered by explicit scope authorization.

## Production change sequence

Use the reviewed provider-specific plan. Apply existing reviewed migrations once using the production migration command, not schema reset or unreviewed schema push. Deploy the compatible API and web artifacts in the order established by their contract/migration compatibility. Confirm health, auth callbacks, process supervision, socket connectivity and provider webhook configuration.

Smoke-test with Stephen's Owner account and two isolated Clients: sign-in/activation, project scope, document link, upload/download, message persistence/reconnect, authorized invoice, meeting lifecycle, support and push subscriptions. Do not expose real secrets in smoke-test evidence.

## Rollback

Keep the prior immutable application artifact and its configuration reference. If the new build fails, restore the compatible application build according to the reviewed plan and recheck service health. Database changes require their own compatibility decision; destructive down-migrations are not an automatic rollback strategy.

Prefer an expand-and-contract schema change and a forward fix when reverting would destroy data. Restore a database only with explicit authorization and after evaluating newer writes, object versions, payment/provider events and deletion records. Record the incident and reconciliation.

## Recovery rehearsal

Restore a chosen database recovery point and the required object versions into an isolated environment. Check record counts and referential integrity, sample downloads and version feedback, invoice totals, membership history and application startup. Reapply authorized deletion/tombstone state before allowing user access. Reconcile provider events that occurred after the recovery point without duplicating financial actions.

Measure actual recovery time and observed data-loss window against the proposed targets. Save dated evidence and any limitations. Do not claim a backup is restorable solely because its upload succeeded. Drive-link metadata does not back up Drive document contents.

## Handoff

Give Stephen the source/lockfile, approved migration history, secret variable names without values, account ownership checklist, setup and environment instructions, backup/recovery steps, monitoring view, test evidence, known issues and basic Owner operating guide. Revoke temporary collaborator access and expire external credential shares when no longer required.
