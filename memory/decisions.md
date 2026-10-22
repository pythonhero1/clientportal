# Decisions

Only actual approved decisions and explicitly delegated selections belong here. Proposals remain in docs. Current explicit instructions override older decisions.

### D-1 - Approved core stack
- Decision: React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity.
- Source: Earlier explicit architecture approvals recovered for this portal.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Core application stack.
- Status: active
- Date: 2026-10-18

### D-2 - Independent portal
- Decision: Use portal.oderindestephen.com independently of the WordPress website.
- Source: Earlier explicit domain and application separation approval.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Application and deployment scope.
- Status: active
- Date: 2026-10-18

### D-3 - Registration and security
- Decision: Public registrations require approval; verified invitations activate assigned access; controlled initial Owner setup; mandatory privileged MFA and optional Client MFA.
- Source: Earlier explicit authentication/security approvals; privileged authority is now Owner only.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Identity and activation.
- Status: active
- Date: 2026-10-18

### D-4 - Earlier four role scope
- Decision: Earlier planning included Owner, Admin, Team Member and Client.
- Source: Earlier role approval, replaced by Stephen's current answer 2.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Historical scope only; do not implement this role set.
- Status: superseded by D-5
- Date: 2026-10-18

### D-5 - Current first release roles and screens
- Decision: The first release has Owner and Client only and includes all 18 client screens.
- Source: Current answer 2: first release all 18 screens, only owner and client.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Current release; overrides the earlier role set.
- Status: superseded by D-17
- Date: 2026-10-18

### D-6 - Application file version history
- Decision: Preserve prior versions and attach feedback and approvals to the exact file version.
- Source: Earlier explicit file-history approval.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Private uploaded files and deliverable review.
- Status: active
- Date: 2026-10-18

### D-7 - Storage categories and limit
- Decision: Use private S3-compatible storage separately from the API/database; 500 MB per file; all seven previously proposed categories.
- Source: Earlier explicit storage/category/limit approval.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Images, documents, spreadsheets, design files, ZIP, video and audio; see FILE-LIFECYCLE.
- Status: active
- Date: 2026-10-18

### D-8 - File deletion and audit
- Decision: Archived files stay until authorized deletion; Owner soft deletion; 90-day recovery; Owner authorization for permanent deletion after the window; full lifecycle audit; deletion/restoration alerts go to Owner in this release.
- Source: Earlier lifecycle approvals, narrowed by the current Owner/Client-only role scope.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Application file lifecycle; no automatic purge.
- Status: active
- Date: 2026-10-18

### D-9 - Persistent collaboration messaging
- Decision: Use NestJS WebSockets and PostgreSQL history for project, general, direct and group conversations.
- Source: Earlier explicit messaging architecture approvals.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Messaging foundation.
- Status: active
- Date: 2026-10-18

### D-10 - Protected discovery and group entry
- Decision: Clients cannot discover unrelated Clients; Owner controls groups/membership; newly joined participants see history only from joining.
- Source: Earlier explicit privacy/group/history approvals, narrowed to current roles.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Conversation discovery and first join; removal/rejoining remain open.
- Status: active
- Date: 2026-10-18

### D-11 - Responsive themes and language
- Decision: Support desktop, tablet and mobile, English for now, and dark and light themes.
- Source: Current answer 4.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Every client screen.
- Status: active
- Date: 2026-10-18

### D-12 - Project documents
- Decision: Project documents provide links to Drive only.
- Source: Current answer 6.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Project document area; does not remove the separate uploaded-file workflow.
- Status: active
- Date: 2026-10-18

### D-13 - Delegated design access and meetings
- Decision: Prioritize individual screen appearance over conflicting Foundations colors; use temporary collaborator access or external Bitwarden Send for passwords; retain Cal.com.
- Source: Selections made under Stephen's explicit delegation in answers 4, 6 and 8.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Design precedence, credential approach and meeting provider; account configuration remains open.
- Status: active
- Date: 2026-10-18

### D-14 - Invoice origin and push channel
- Decision: Generate invoices inside the portal and use browser push for portal notifications.
- Source: Current answers 7 and 10; all 18 screens also retain in-app notification history.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Payment methods/currency and notification event timing remain open.
- Status: active
- Date: 2026-10-18

### D-15 - Environment business identity and target
- Decision: Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos.
- Source: Current answers 1, 2, 3 and 13.
- Rejected: Specific alternative reasoning was not recorded here; do not invent it.
- Applies to: Project setup, ownership and target date; no promised launch time.
- Status: active
- Date: 2026-10-18

### D-16 - Production hosting providers
- Decision: Host frontend SPA on Cloudflare Pages, backend API and WebSockets on Render, and managed PostgreSQL on Supabase.
- Source: Stephen instruction: "I will perfer option 2, Cloudflare page, render, supabase".
- Rejected: Traditional self-managed Linux VPS, Vercel, Railway.
- Applies to: Production hosting and deployment topology.
- Status: active
- Date: 2026-10-21

### D-17 - Admin role naming and isolated login boundary
- Decision: Rename privileged role from Owner to Admin; host dedicated Admin login at /admin with no signup page; enforce strict credential isolation where Admin credentials cannot sign in to the Client portal and Client credentials cannot sign in to the Admin console.
- Source: Stephen's explicit instruction on 2026-10-22 to change owner to Admin, route admin login through portal.oderindestephen.com/admin, reject admin details on client login and client details on admin login, and omit signup page on admin.
- Rejected: Shared login endpoints; allowing cross-role login between client and admin; public signup page for admin.
- Applies to: Identity, authentication, routing, and access control.
- Status: active
- Date: 2026-10-22




