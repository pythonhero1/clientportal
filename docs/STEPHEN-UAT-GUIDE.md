# Stephen User Acceptance Testing (UAT) Guide

**Project:** Oderinde Stephen Client Portal  
**Target Date:** Target Release 2026-10-21  
**Audience:** Oderinde Stephen (Project Owner)  

Welcome Stephen! This guide outlines a step-by-step acceptance walkthrough so you can test and verify all 18 client screens and the 5 Owner management modules in both Dark and Light themes across desktop, tablet, and mobile devices.

---

## 1. Getting Started & Theme Switcher

1. Open your browser and navigate to the portal URL (or local `http://localhost:5173`).
2. Log in using your Owner account credentials.
3. **Theme Verification:** In the navigation top bar (or under `/settings`), click the Theme toggle button. Verify that:
   - **Dark Theme:** Deep obsidian surfaces, accessible high-contrast text, clear borders.
   - **Light Theme:** Clean, crisp, neutral surfaces with legible typography.
   - Contrast remains comfortable across all screens.

---

## 2. Core Walkthrough Checklist

### Step 1: Client Overview & Active Engagement (Screen 07 & 18)
- Navigate to `/overview`.
- Observe the active milestone timeline, recent file deliverables, and upcoming meetings.
- Append `?empty=true` to the URL (`/overview?empty=true`) to verify Screen 18 (No Active Project empty state with helpful guidance).

### Step 2: Files & Deliverables Feedback (Screen 10 & `/owner/files`)
- Navigate to `/files`.
- Verify the deliverable categories: Brand Assets, Wireframes, High-Fidelity UI, Architecture.
- Open a deliverable card. Review version history (v1, v2) and version-specific feedback comments.
- As Owner, visit `/owner/files` to inspect file lifecycle controls: Soft-Delete (90-day recovery window) and Archive.

### Step 3: Real-Time Persistent Messaging (Screen 13 & `/owner/messages`)
- Open `/messages`.
- Verify the active connection status indicator ("Connected" green dot).
- Send a message in a discussion thread. Notice instant delivery and message history persistence.
- As Owner, visit `/owner/messages` to view multi-client channels and test creating a group channel.

### Step 4: Invoices & Financial Statements (Screen 11 & `/owner/invoices`)
- Navigate to `/invoices`.
- Verify itemized milestone invoices (e.g. `INV-2026-001`). Check due dates, settlement status badges, and download the PDF statement.
- As Owner, open `/owner/invoices`:
  - Test clicking "Issue Invoice" to generate a sequential invoice with itemized line items.
  - Test recording a manual payment (Bank transfer / Wire settlement).

### Step 5: Meetings & Calendar (Screen 14 & `/owner/meetings`)
- Navigate to `/meetings`.
- Switch between **Month View** and **Agenda View**.
- Click the "Schedule a Call" button to launch the integrated Cal.com booking modal.
- As Owner, visit `/owner/meetings` to triage meetings and assign booked sessions to specific client projects.

### Step 6: Notifications & Browser Web Push (Screen 15)
- Open `/notifications`.
- Filter by All, Deliverables, Invoices, and Messages.
- Click "Mark all as read" and observe the unread badge updating in the navigation bar.
- Test enabling Web Push notifications via the banner prompt.

### Step 7: Support & Knowledge Base (Screen 17 & `/owner/support`)
- Navigate to `/support`.
- Search the Knowledge Base articles and click an article to view formatted guides.
- Click "Open a Support Ticket". Fill in the subject, description, and priority.
- As Owner, open `/owner/support` to view the triage queue, reply to the ticket, and toggle status to `Resolved`.

### Step 8: Account & Security Settings (Screen 16)
- Open `/settings`.
- Update your profile details (name, company, phone, timezone).
- Review notification toggle switches.
- Inspect the active security sessions list.

---

## 3. How to Confirm Completion

Once you have reviewed the portal against your expectations:
- Respond in chat with `APPROVE` or `COMPLETION CONFIRMED`.
- If you notice any desired refinements, specify them directly and they will be addressed immediately.
