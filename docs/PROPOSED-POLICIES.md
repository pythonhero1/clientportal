# Proposed policies for Stephen to review

All values here are proposals. Stephen asked for retention/recovery proposals and delegated several implementation choices; he has not approved all policies in this document. Keep these out of active decision memory until selected. Existing approved file-retention rules override this page.

## Conversation membership

Propose immediate loss of portal access to a conversation when a participant is removed, including its earlier messages. Existing copies already read or downloaded cannot be recalled. On rejoining, propose visibility only from the new join timestamp. Keep each membership period for audit and permission testing.

Propose blocking groups that introduce unrelated Clients to one another. Owner can still create groups of explicitly authorized project collaborators. The current release has no Admin or Team role. Keep message edit/delete, read receipts and typing out of implementation until Stephen chooses them; do not silently treat omission as an approved permanent product policy.

Stephen's earlier yes does not choose among the opposing removal/rejoining rules. This policy requires a precise answer before that production behavior is implemented.

## Notifications

Propose immediate eligible push attempts for a new message, a file awaiting the recipient's review, a meeting change, an issued invoice and a support reply. Persist the event before attempting delivery. Deletion/restoration events go to Owner only under the established recipient rule.

Propose per-user preferences for non-security portal push categories. Keep payment/meeting reminders disabled until their intervals are selected. An in-app record does not guarantee a browser push is delivered. Do not automatically add email digests.

Notification event recipients other than the established deletion/restoration rule need a reviewed event matrix, particularly billing contacts and designated file approvers.

## Onboarding and approvals

Use the six visible onboarding steps: contact details, questionnaire, brand assets, content upload, access credentials and kickoff approval. Propose autosave with explicit saved/error state for questionnaire drafts. File upload steps complete only after safe upload completion; access completes after Owner confirms authorized receipt.

Propose Owner's explicit kickoff confirmation after required inputs and Client scope acceptance. Propose project milestones moving through planned, in progress, awaiting review and approved states, with the exact allowed transitions reviewed in P03. Do not enforce a revision count or automatic launch approval until Stephen supplies that business rule.

## Support

Propose one Owner-operated support queue. A Client submits and reads only their authorized requests; Owner can reply and change status. Proposed statuses are open, waiting for Owner, waiting for Client and resolved. Reopening and priority levels must be reviewed with the support plan. Proposed help articles are Owner-maintained and visible to activated users.

Do not display an invented response-time promise or automatically close unanswered tickets. The support screens are in scope; this operating policy remains a proposal because yes did not select between the earlier alternatives.

## Retention

| Record type | Proposal | Important boundary |
| --- | --- | --- |
| Archived project files | Keep until authorized deletion | Already approved; no automatic purge |
| Soft-deleted files | 90-day recovery; then restricted until authorized permanent deletion | Already approved; eligibility is not an automatic deletion job |
| Messages | Keep during active work; review at 12 months after project closure | Proposed review point, not automatic erasure |
| Audit records | Keep for at least 24 months, then review | Proposed; confirm obligations before any purge |
| Resolved support requests | Review 12 months after closure | Proposed; no automatic purge at launch |
| In-app notification history | Review after 180 days | Proposed; preserve linked audit records separately |
| Push subscriptions | Remove on invalid endpoint, logout/unbind or user unsubscribe | Technical recommendation for current account isolation |
| Invoices/payment evidence | Set after business jurisdiction and accounting needs are confirmed | Do not invent a retention or tax-compliance claim |

Any retention job must have a reviewed scope, actor, audit, dry run and exclusion rules. Soft deletion and permanent destruction are separate operations.

## Backups and recovery

Propose an encrypted daily PostgreSQL backup with 30 days of recovery points, plus provider point-in-time recovery if the selected plan supports it within the approved budget. Proposed launch recovery objectives are at most 24 hours of database data loss and recovery within 8 hours. These are targets to test, not commitments already met.

Use a separately recoverable copy of private object versions and a checked inventory. Bucket versioning alone is not the same as an independent backup. Confirm cost, encryption, region and access before provisioning. Google Drive documents remain in the account owner's own backup/sharing responsibilities; copying a link does not back up its contents.

Test restoring into an isolated environment. Reconcile database records, object versions, notification state and deletion audit/tombstones before restoring user access. An old backup can contain previously deleted data; the recovery runbook must reapply authorized deletion state. Explain any provider backup-aging limits before claiming permanent destruction from every copy.

Before launch, Stephen reviews these values and the actual provider capability. If a provider cannot meet them, present a revised concrete option; do not claim that 7Gb proves backup or capacity suitability.
