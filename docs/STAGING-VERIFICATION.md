# Staging Verification Runbook & Checklist

**Project:** Oderinde Stephen Client Portal  
**Phase:** P09 Release Gate & Verification  
**Target Environment:** Staging / Pre-Production  

---

## 1. Automated Health Check Verification

The portal API provides structured health checks and endpoint readiness. Execute the following validation commands against the staging environment:

```bash
# 1. API Core Health & Database Connectivity
curl -s -o /dev/null -w "%{http_code}\n" https://api.staging.clientportal.example.com/api/health
# Expected: 200

# 2. Database Migrations Status
# Run on the server container / instance:
npm run db:migrate:status --workspace @os-portal/api
# Expected: All migrations applied up to 20261019_p09_support_notifications_meetings

# 3. Unauthenticated Access Protection (Guards)
curl -s -o /dev/null -w "%{http_code}\n" https://api.staging.clientportal.example.com/api/invoices
# Expected: 401 (Unauthorized - Clerk authentication required)

# 4. Multi-Tenant Project Isolation Check
curl -s -H "Authorization: Bearer <CLIENT_A_TOKEN>" \
  -o /dev/null -w "%{http_code}\n" \
  https://api.staging.clientportal.example.com/api/projects/proj_client_b_secret
# Expected: 404 (Not Found - Foreign tenant ID returns 404, never 403 or data leakage)

# 5. Persistent WebSocket Upgrade Handshake
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: api.staging.clientportal.example.com" \
  -H "Origin: https://staging.clientportal.example.com" \
  https://api.staging.clientportal.example.com/socket.io/?EIO=4&transport=websocket
# Expected: HTTP/1.1 101 Switching Protocols
```

---

## 2. 18-Screen Matrix Smoke Test Verification

Verify each screen across viewports (390px, 768px, 1024px, 1440px) and both Dark and Light themes:

| Screen # | Route | Purpose | Acceptance Criteria | Verified |
|---|---|---|---|---|
| Screen 01 | `/sign-in` | Clerk Sign In | SSO / Email sign-in renders cleanly in dark/light | [x] |
| Screen 02 | `/sign-up` | Account Request | Pre-registration screen with pending activation notice | [x] |
| Screen 03 | `/forgot-password` | Password Reset Request | Clerk password reset trigger | [x] |
| Screen 04 | `/reset-password` | Set New Password | Password reset confirmation | [x] |
| Screen 05 | `/verify-email` | Email Verification | Email code entry | [x] |
| Screen 06 | `/onboarding` | Client Welcome | 3-step onboarding overview, zero fixture badges | [x] |
| Screen 07 | `/overview` | Client Dashboard | Milestones, recent deliverables, unread counts | [x] |
| Screen 08 | `/projects` | Projects List | List of active and archived projects scoped to client | [x] |
| Screen 09 | `/projects/:projectId` | Project Workspace | Project overview, team contacts, deliverables preview | [x] |
| Screen 10 | `/files` | Files & Deliverables | Category tabs, version history, approval actions | [x] |
| Screen 11 | `/invoices` | Invoices & Billing | Itemized line items, PDF download link, settlement status | [x] |
| Screen 12 | `/onboarding/questionnaire` | Intake Questionnaire | Structured requirements questionnaire | [x] |
| Screen 13 | `/messages` | Persistent Messaging | Real-time chat, file attachments, online presence | [x] |
| Screen 14 | `/meetings` | Meetings & Schedule | Calendar agenda/month views, Cal.com booking modal | [x] |
| Screen 15 | `/notifications` | Notification Center | Deliverables, invoice receipts, filter tabs, Web Push | [x] |
| Screen 16 | `/settings` | Security & Settings | Profile update, notification switches, session list | [x] |
| Screen 17 | `/support` | Support & Knowledge Base | Knowledge base articles, ticket submission and tracking | [x] |
| Screen 18 | `/overview?empty=true` | No Active Project State | Empty state guidance when no active engagement exists | [x] |

---

## 3. Owner Suite Smoke Test Verification

| Owner Screen | Route | Purpose | Acceptance Criteria | Verified |
|---|---|---|---|---|
| Owner Deliverables | `/owner/files` | File Lifecycle & Approvals | Soft-delete, archive, version promotion, quarantine check | [x] |
| Owner Invoices | `/owner/invoices` | Invoices Management | Issue sequential `INV-YYYY-XXXX`, record payments, cancel | [x] |
| Owner Messaging | `/owner/messages` | Multi-client Channels | Group channels, direct messaging, member management | [x] |
| Owner Meetings | `/owner/meetings` | Meeting Triage | Cal.com booking reassignment, triage to active projects | [x] |
| Owner Support | `/owner/support` | Ticket Triage & KB Editor | Triage queue, reply composer, create/edit KB articles | [x] |
