# Integrations

Provider features and SDK generations must be checked during implementation. No API requests, webhooks, external accounts or production credentials have been configured by this package.

## Clerk

Keep Clerk as the identity provider. Verify sessions with the current official backend SDK in NestJS guards, including the configured issuer and authorized application origin. Do not accept a decoded token without verifying it.

Use the current official React SDK for the selected generation. On the research date the React quickstart describes `@clerk/react`; do not mix those examples with older `@clerk/clerk-react` component APIs. Pin the installed SDK generation during P00/P01.

Reconcile verified, replay-safe Clerk webhooks with application users. Store application role, activation and membership in the portal database. Only a trusted procedure can create Stephen's initial Owner role. Enforce Owner MFA on backend access, not only with a settings reminder.

Public signup, email verification, pending approval, invitation acceptance, password reset, recovery and session revocation need explicit UI states. Clerk's authentication/security emails are distinct from the selected portal push-notification channel.

## Cal.com

Use the supplied Cal.com direction, with a hosted embed for booking and provider-supported reschedule/cancel controls. Use verified server webhooks and a permitted API reconciliation path for portal meeting records. Do not rebuild availability or create a second booking database as the authority for free slots.

Stephen must configure the Cal.com account, relevant event type, connected calendar, allowed booking access and webhook capabilities. Calendar-provider choice and account plan are not selected merely by choosing Cal.com.

Map a verified booking to an authorized portal user/project. Do not attach a booking to an arbitrary project ID received from a public embed. Deduplicate repeated and out-of-order events. Test booking, reschedule and cancellation, timezone conversion and the project's combined meetings/milestones/invoice calendar. Expose only permitted calendar entries.

## Google Drive documents

Store an Owner-provided HTTPS Drive link, display title and explicit project classification. Validate allowed domains and URL shape without fetching arbitrary internal URLs. Opening the document remains subject to Google account access.

Do not auto-change sharing to anyone with a link. Do not synchronize Drive files, request broad Drive OAuth permissions, mirror documents into S3 or implement signatures for this release. Owner verifies the actual recipients in Drive. This does not remove the separate Files and Feedback upload/version workflow.

## Client platform access

Prefer a temporary collaborator invitation on the platform being worked on. This avoids transferring a permanent password. Provide a clear instruction and access-status step in onboarding.

When credentials must be transferred, use external Bitwarden Send with appropriate expiration and access controls. Configure the actual delivery method/recipient with Stephen. Do not copy secret text or a decryption-bearing Send link into ordinary portal messages, uploads, logs or questionnaire fields. The portal records requested/shared/confirmed access status and any non-secret platform name, not the credential payload. Owner confirms receipt before this onboarding step is complete. Revoke temporary access and expire sharing after handoff.

This is a delegated choice of approach, not evidence that Stephen already has a Bitwarden account or a selected paid plan. Check available controls in the account during setup.

## Payments

Internally generated invoices are approved. A gateway is not selected. Create a reviewed billing contract only after currency, business identity, numbering, tax behavior and collection method are explicit.

If online payments are selected, choose a hosted checkout supported by Stephen's registered account. Verify signed server webhooks, amount/currency/receiver, event identity and idempotency. Never mark paid from the browser return URL. If bank transfer is selected, Owner records and audits a verified settlement. Preserve the original issued invoice and use a defined correction/credit process rather than rewriting history.

## Browser push

Use standards-based Web Push with VAPID and a service worker; no paid push provider is required by this recommendation. Store subscriptions per authenticated activated user/device and keep their authorization current. Request permission after a user gesture. Production requires HTTPS and a supported browser.

Persist the in-app event first. Push carries a minimal generic message and an opaque navigation reference, with authorization rechecked on open. Avoid message bodies, amounts, credential data or confidential filenames on a lock screen. Unsubscribe/rebind on logout and account changes, and remove expired endpoints when the push service reports them gone.

Browser support and user permission affect push availability. The in-app Notifications screen remains usable if permission is denied. Event selection, delivery timing and preferences are proposals until reviewed. Do not add email, SMS or WhatsApp portal alerts from the earlier yes answer.
