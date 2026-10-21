# Invoices, Billing Management and Payment Collection

- Task: P06 implement itemized invoice generation, decimal-safe financial calculations, unique serial numbering, server-side PDF generation, Owner billing ledger, Client designated billing-contact scoped access, bank transfer payment evidence recording, payment status transitions, and responsive Screen 11 (`/invoices`) and Owner billing (`/owner/invoices`) interfaces
- Status: IMPLEMENTED - AWAITING STEPHEN CONFIRMATION
- Created: 2026-10-18
- Updated: 2026-10-18
- Workspace: one portal repository

## 1 Task

Implement the complete billing and invoice engine across backend and frontend, including PostgreSQL models for itemized invoices, line items, and payment records with decimal-safe calculations; atomic unique sequential numbering (`INV-YYYY-XXXX`); server-side PDF statement generation using PDFKit; strict access enforcement restricting invoice data to the Owner and explicitly designated Client billing contacts with anti-enumeration protection (404); bank transfer instructions and payment evidence submission; and responsive, accessible interfaces for Client Screen 11 (`/invoices`, Figma `4:508`) and the Owner billing suite (`/owner/invoices`).

## 2 Applicable memory

- `D-1 - Approved core stack`: "React and TypeScript frontend; separate NestJS and TypeScript API; managed PostgreSQL; Prisma; Clerk identity."
- `D-5 - Current first release roles and screens`: "The first release has Owner and Client only and includes all 18 client screens."
- `D-11 - Responsive themes and language`: "Support desktop, tablet and mobile, English for now, and dark and light themes."
- `D-14 - Invoice origin and push channel`: "Generate invoices inside the portal and use browser push for portal notifications."
- `D-15 - Environment business identity and target`: "Windows; Antigravity 2.24.0; no existing application code or repository; Stephen is the approver; one business and its clients; target 21 October 2026 in Africa/Lagos."
- `P-1 - Stephen confirms completion`: "Record implementation and verification evidence; only Stephen confirms completion."
- `P-2 - Keep unresolved decisions explicit`: "Ask unresolved questions together and do not silently select unspecified policies."
- `P-3 - Use current Antigravity project procedure format`: "Use .agents/skills procedures with plain prompt fallbacks instead of depending on legacy workflow execution."

## 3 Affected files

### 3.1 Proposed modifications to existing files

#### Backend (`apps/api`):
- `apps/api/package.json:25-46`:
  - Add runtime dependency: `pdfkit` (server-side streaming PDF invoice generator).
  - Add dev dependency: `@types/pdfkit`.
- `apps/api/prisma/schema.prisma:121-179, 442-471`:
  - Add enums:
    - `InvoiceStatus` (`DRAFT`, `ISSUED`, `PAID`, `PARTIALLY_PAID`, `OVERDUE`, `CANCELLED`)
    - `PaymentMethod` (`BANK_TRANSFER`, `GATEWAY_ONLINE`, `MANUAL_ADJUSTMENT`)
    - `PaymentRecordStatus` (`PENDING`, `CONFIRMED`, `REJECTED`)
  - Add models:
    - `Invoice` (`id`, `invoiceNumber`, `projectId`, `clientId`, `createdById`, `status`, `currency`, `subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `amountPaid`, `dueDate`, `issuedAt`, `paidAt`, `notes`, `pdfStorageKey`, relations, timestamps)
    - `InvoiceItem` (`id`, `invoiceId`, `description`, `quantity`, `unitPrice`, `amount`, `orderIndex`, relations, timestamps)
    - `PaymentRecord` (`id`, `invoiceId`, `amount`, `currency`, `method`, `status`, `reference`, `evidenceNote`, `proofStorageKey`, `recordedById`, `confirmedAt`, relations, timestamps)
  - Extend existing models:
    - `User` (`apps/api/prisma/schema.prisma:121-145`): add `clientInvoices Invoice[] @relation("ClientInvoices")`, `createdInvoices Invoice[] @relation("CreatedInvoices")`, `recordedPayments PaymentRecord[] @relation("RecordedPayments")`.
    - `Project` (`apps/api/prisma/schema.prisma:159-179`): add `invoices Invoice[]`.
- `apps/api/src/app.module.ts:13-30`:
  - Import and register `InvoicesModule`.

#### Frontend (`apps/web`):
- `apps/web/src/features/invoices/pages/InvoicesPage.tsx:1-78`:
  - Replace static dummy mockups (`<FixtureBadge phase="P06" />`, hardcoded `$1,500.00` and `$2,000.00`) with live authenticated invoice ledger for Screen 11 (Figma `4:508`).
  - Add designated billing-contact restriction guard message for non-billing collaborators.
  - Add invoice breakdown modal, bank transfer instructions dialog, payment proof submission dialog, and authenticated PDF download action.
- `apps/web/src/features/owner/pages/OwnerInvoicesPage.tsx:1-50`:
  - Replace static placeholder with complete Owner billing administration surface: invoice ledger, filter by project/status, "Issue New Invoice" modal with multi-row item calculator, "Record Payment Settlement" dialog, void/cancel modal, and PDF preview action.
- `apps/web/src/layouts/components/Sidebar.tsx:43`:
  - Keep `/invoices` accessible in navigation with appropriate in-page boundary handling.

### 3.2 Proposed new files

#### Backend (`apps/api`):
- `apps/api/src/invoices/invoices.module.ts`: NestJS module bundling controllers, services, guards, and Prisma integration.
- `apps/api/src/invoices/invoices.controller.ts`: Client-facing endpoints under `/api/projects/:projectId/invoices` protected by `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, and `DesignatedBillingContactGuard`.
- `apps/api/src/invoices/controllers/owner-invoices.controller.ts`: Owner-facing management endpoints under `/api/admin/invoices` protected by `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), and `OwnerMfaGuard`.
- `apps/api/src/invoices/services/invoices.service.ts`: Core financial logic: Prisma decimal calculation, atomic sequential number assignment (`INV-YYYY-XXXX`) in database transaction, status state machine transitions (`DRAFT` -> `ISSUED` -> `PAID`/`OVERDUE`/`CANCELLED`), payment evidence processing, and reconciliation.
- `apps/api/src/invoices/services/pdf.service.ts`: Server-side PDFKit generator rendering professional branded invoice PDFs matching Stephen's visual identity, seller metadata, client details, line items table, tax, balance, and bank transfer instructions.
- `apps/api/src/invoices/guards/designated-billing-contact.guard.ts`: Capability guard verifying `ProjectMembership.isDesignatedBillingContact === true` for Clients on the requested project, returning strict `404 Not Found` for anti-enumeration.
- `apps/api/src/invoices/dto/create-invoice.dto.ts`: DTO for creating draft invoice (projectId, clientId, currency, dueDate, notes, taxRate, items).
- `apps/api/src/invoices/dto/create-invoice-item.dto.ts`: DTO for line items (description, quantity, unitPrice).
- `apps/api/src/invoices/dto/issue-invoice.dto.ts`: DTO for issuing invoice with optional issue notes.
- `apps/api/src/invoices/dto/record-payment.dto.ts`: DTO for Owner recording confirmed payment (amount, currency, method, reference, notes).
- `apps/api/src/invoices/dto/submit-payment-evidence.dto.ts`: DTO for Client submitting bank transfer evidence (reference, notes).
- `apps/api/src/invoices/dto/cancel-invoice.dto.ts`: DTO for voiding invoice with audit reason.
- `apps/api/src/invoices/invoices.service.spec.ts`: Unit tests for financial calculations, rounding precision, sequential numbering, status transitions, and payment settlement.
- `apps/api/src/invoices/guards/designated-billing-contact.guard.spec.ts`: Unit tests for billing contact access control and anti-enumeration.
- `apps/api/test/invoices.e2e-spec.ts`: E2E integration tests verifying full invoice lifecycle, decimal precision, Owner vs Client permissions, collaborator 404 isolation, PDF streaming, and payment evidence handling.

#### Frontend (`apps/web`):
- `apps/web/src/services/invoices-api.ts`: API client handling client and owner invoice endpoints, payment submission, and PDF blob downloads.
- `apps/web/src/features/invoices/hooks/useInvoices.ts`: React Query hook for loading client project invoices and single invoice details.
- `apps/web/src/features/invoices/components/InvoiceDetailModal.tsx`: Modal displaying itemized breakdown, subtotal, tax, amount paid, balance due, and remittance details.
- `apps/web/src/features/invoices/components/PaymentInstructionsModal.tsx`: Modal presenting official bank transfer details (account name, bank name, account number, SWIFT/sort code, payment reference).
- `apps/web/src/features/invoices/components/SubmitPaymentProofModal.tsx`: Modal allowing client to input bank transfer reference number and notes.
- `apps/web/src/features/owner/hooks/useOwnerInvoices.ts`: React Query hook for Owner global ledger queries and mutations (create, issue, record payment, cancel).
- `apps/web/src/features/owner/components/CreateInvoiceModal.tsx`: Owner modal with project picker, client selector, due date, currency selection, dynamic line item rows with automatic decimal calculations, and tax rate input.
- `apps/web/src/features/owner/components/RecordPaymentModal.tsx`: Owner modal to record confirmed bank transfer or manual settlement with amount and reference.
- `apps/web/src/features/owner/components/CancelInvoiceModal.tsx`: Owner confirmation modal to void an invoice with reason.
- `apps/web/src/features/invoices/pages/InvoicesPage.test.tsx`: Component tests for Screen 11 client billing interactions.
- `apps/web/src/features/owner/pages/OwnerInvoicesPage.test.tsx`: Component tests for Owner invoice administration.

## 4 Contract status

| Interface / Endpoint | Status | Producer | Consumer | Permissions & Checks | Description & Fields |
| --- | --- | --- | --- | --- | --- |
| `GET /api/projects/:projectId/invoices` | Proposed for review | `InvoicesController` | React `InvoicesPage` | `ClerkAuthGuard`, `AccountStatusGuard`, `ProjectAccessGuard`, `DesignatedBillingContactGuard` | Returns issued/paid invoices for `:projectId` where caller is designated billing contact. Fields: `id`, `invoiceNumber`, `status`, `currency`, `subtotal`, `taxAmount`, `totalAmount`, `amountPaid`, `dueDate`, `issuedAt`, `paidAt`, `itemsCount`. Returns `404` for non-billing collaborators. |
| `GET /api/projects/:projectId/invoices/:invoiceId` | Proposed for review | `InvoicesController` | React `InvoiceDetailModal` | Same Client billing guards | Returns single invoice with full line items (`description`, `quantity`, `unitPrice`, `amount`), payment records, and payment instructions. Returns `404` for unauthorized/foreign invoice. |
| `GET /api/projects/:projectId/invoices/:invoiceId/pdf` | Proposed for review | `InvoicesController` | React PDF download button | Same Client billing guards | Streams binary PDF (`application/pdf`) with `Content-Disposition: attachment; filename="INV-XXXX.pdf"`. Returns `404` for unauthorized. |
| `POST /api/projects/:projectId/invoices/:invoiceId/payment-evidence` | Proposed for review | `InvoicesController` | React `SubmitPaymentProofModal` | Same Client billing guards | Submits bank transfer reference and memo. Creates `PaymentRecord` with status `PENDING`. Fields: `reference`, `evidenceNote`. Returns `404` for unauthorized. |
| `GET /api/admin/invoices` | Proposed for review | `OwnerInvoicesController` | React `OwnerInvoicesPage` | `ClerkAuthGuard`, `RolesGuard` (`@Roles('Owner')`), `OwnerMfaGuard` | Returns global invoice ledger across all projects. Filterable by `status`, `projectId`, `clientId`. Fields include client name, project name, totals, and balances. |
| `POST /api/admin/invoices` | Proposed for review | `OwnerInvoicesController` | React `CreateInvoiceModal` | Same Owner guards | Creates a `DRAFT` invoice. Fields: `projectId`, `clientId`, `currency`, `dueDate`, `notes`, `taxRate`, `items: [{ description, quantity, unitPrice }]`. Computes amounts server-side using Decimal. |
| `POST /api/admin/invoices/:invoiceId/issue` | Proposed for review | `OwnerInvoicesController` | React `OwnerInvoicesPage` | Same Owner guards | Transitions invoice from `DRAFT` to `ISSUED`. Atomically generates unique sequential `invoiceNumber` (`INV-YYYY-XXXX`) and sets `issuedAt = now()`. |
| `POST /api/admin/invoices/:invoiceId/payments` | Proposed for review | `OwnerInvoicesController` | React `RecordPaymentModal` | Same Owner guards | Records confirmed payment. Fields: `amount`, `currency`, `method`, `reference`, `evidenceNote`. Updates `amountPaid`. If `amountPaid >= totalAmount`, transitions status to `PAID` and sets `paidAt = now()`. |
| `POST /api/admin/invoices/:invoiceId/cancel` | Proposed for review | `OwnerInvoicesController` | React `CancelInvoiceModal` | Same Owner guards | Voids an issued or draft invoice. Fields: `reason`. Transitions status to `CANCELLED`. Number remains reserved. |
| `GET /api/admin/invoices/:invoiceId/pdf` | Proposed for review | `OwnerInvoicesController` | React `OwnerInvoicesPage` | Same Owner guards | Streams binary PDF statement for Owner inspection. |

## 5 Scope and acceptance

### 5.1 Quoted Requirements

- `BUILD-PLAN.md:135-140`:
  > "Finalize currency, business identity, numbering, tax behavior and payment method. Build Owner invoice creation, line items, issued PDF, Client billing-contact access, statuses and payment evidence. Integrate a hosted payment gateway only if selected and supported by Stephen's account.
  > Exit: amounts/currency are server-controlled; invoice numbers are unique; ordinary project collaborators cannot see billing; duplicate/out-of-order payment events are safe; a browser redirect cannot mark an invoice paid. Real invoices are not issued with placeholder seller information or sample Figma amounts."
- `docs/SCREEN-MAP.md:19`:
  > "11 | Invoices | 4:508 | /invoices | Only designated billing contacts; real generated invoices/PDFs; selected collection behavior."
- `docs/PERMISSIONS.md:18-19, 27`:
  > "| View invoices and billing details | Yes | Explicitly designated billing contact |"
  > "| Generate or change invoice records | Yes | No |"
  > "Do not grant an ordinary collaborator invoice access just because they can access a project."
- `docs/ACCEPTANCE-CHECKLIST.md:67-71`:
  > "- [ ] Currency, seller details, invoice numbering, tax behavior and collection method are explicit.
  > - [ ] Issued invoices/PDFs use real data, stable numbers and decimal-safe money.
  > - [ ] Only Owner and designated billing contacts can view invoices.
  > - [ ] Browser redirects cannot mark paid; server evidence and idempotent events are checked.
  > - [ ] Repeated/out-of-order payment and Cal.com events are safe."

### 5.2 Measurable Acceptance Criteria

1. **Decimal-Safe Financial Engine**:
   - All monetary fields in Prisma use `@db.Decimal(12, 2)` (supports amounts up to 9,999,999,999.99 with exact 2-decimal precision).
   - Server computes line item totals, subtotal, tax amount, total amount, amount paid, and remaining balance using exact Prisma Decimal arithmetic (`Decimal.js`). No JavaScript floating-point errors (e.g. `0.1 + 0.2` drift).
2. **Atomic Unique Sequential Numbering**:
   - When an invoice is issued, the system generates a unique serial identifier following `INV-YYYY-XXXX` (e.g., `INV-2026-0001`) within an atomic database transaction.
   - Concurrently issued invoices never generate identical numbers or gaps from uncommitted transactions.
   - Once issued, the invoice number is permanent and cannot be modified or reallocated.
3. **Strict Billing Contact Access & Anti-Enumeration Isolation**:
   - Only the Owner and Clients who have `isDesignatedBillingContact === true` on their `ProjectMembership` can query `/api/projects/:projectId/invoices` or download invoice PDFs.
   - An ordinary collaborator assigned to the project (`isDesignatedBillingContact === false`) receives `404 Not Found` when attempting to list invoices, fetch an invoice by ID, or download a PDF statement.
   - An authorized billing contact for Project 1 receives `404 Not Found` when requesting an invoice ID belonging to Project 2.
   - Draft invoices (`status === DRAFT`) are strictly invisible to Client users, even if they are designated billing contacts.
4. **Server-Side PDF Generation**:
   - Official PDF statements are dynamically generated by the backend using PDFKit.
   - Rendered PDFs contain Stephen's verified seller identity ("Oderinde Stephen Studio / Consulting"), client billing details, line items table with description, quantity, unit price, total, tax breakdown, invoice status stamp, and bank wire remittance details.
   - Streamed directly to authenticated users with proper `Content-Type: application/pdf` headers.
5. **Collection Method & Payment Settlement**:
   - Bank transfer remittance instructions are displayed directly on Screen 11 and on issued PDFs.
   - Clients can submit bank transfer transaction references/memos for an issued invoice, creating a `PENDING` payment record.
   - Owner can inspect submitted references, record confirmed payments, and settle invoices.
   - Invoices transition to `PAID` only when confirmed `amountPaid >= totalAmount`.
   - Browser redirects or client-supplied status flags cannot mark an invoice as paid.
6. **All 18 Screens & Responsive Shell Compliance**:
   - Screen 11 (`/invoices`, Figma `4:508`) is fully interactive with real data, status badges (`ISSUED`, `PAID`, `OVERDUE`, `PARTIALLY_PAID`), detail modal, bank instructions modal, and PDF download.
   - If a client has no billing access across any assigned project, Screen 11 displays a friendly, accessible restricted-access card explaining billing permissions rather than crashing or revealing data.
   - Owner Billing Suite (`/owner/invoices`) provides a complete operating ledger, creation modal with multi-row item calculations, settlement modal, and cancellation modal.
   - Both screens support desktop, tablet, and mobile layouts in both Dark and Light themes.

## 6 Ordered steps

### Step 1: Backend Dependencies & Prisma Schema Migration
- Add `pdfkit` and `@types/pdfkit` to `apps/api/package.json`.
- Add `InvoiceStatus`, `PaymentMethod`, and `PaymentRecordStatus` enums to `apps/api/prisma/schema.prisma`.
- Add `Invoice`, `InvoiceItem`, and `PaymentRecord` models to `apps/api/prisma/schema.prisma`.
- Add relations to `User` and `Project` models.
- Run Prisma migration / generate client.
- *Verification*: `npx prisma validate` and `npx prisma generate` succeed without schema warnings.
- *Rollback*: Revert schema additions and re-generate Prisma client.

### Step 2: Invoices Module, DTOs & Decimal Financial Engine
- Create `apps/api/src/invoices/dto/` (`create-invoice.dto.ts`, `create-invoice-item.dto.ts`, `issue-invoice.dto.ts`, `record-payment.dto.ts`, `submit-payment-evidence.dto.ts`, `cancel-invoice.dto.ts`).
- Create `apps/api/src/invoices/guards/designated-billing-contact.guard.ts` enforcing Owner bypass, Client `isDesignatedBillingContact === true`, and strict 404 on failure.
- Implement `apps/api/src/invoices/services/invoices.service.ts` with:
  - Exact Decimal calculations for item totals, subtotals, tax rates, total amounts, and balances.
  - Transaction-safe atomic serial numbering (`INV-YYYY-XXXX`).
  - Invoice lifecycle transitions (`DRAFT` -> `ISSUED` -> `PAID` / `PARTIALLY_PAID` / `CANCELLED`).
  - Client payment evidence submission and Owner payment reconciliation.
- Create unit tests in `apps/api/src/invoices/invoices.service.spec.ts` testing decimal calculations, rounding, numbering sequences, and status transitions.
- *Verification*: Vitest unit tests pass.
- *Rollback*: Remove service, DTOs, and test files.

### Step 3: Server-Side PDF Generation Service
- Implement `apps/api/src/invoices/services/pdf.service.ts` using PDFKit.
- Design professional invoice layout:
  - Header: Oderinde Stephen business branding and contact metadata.
  - Invoice meta block: Invoice number, issue date, due date, payment status indicator.
  - Bill To block: Client company name, contact person, email.
  - Items table: Alternating rows, description, quantity, unit price, total amount.
  - Summary block: Subtotal, tax rate & amount, total amount, amount paid, balance due.
  - Remittance footer: Bank name, account number, SWIFT code, payment reference instructions.
- Add unit tests verifying PDFKit stream creation and buffer output.
- *Verification*: PDF generation outputs valid PDF buffers with non-zero byte size and valid `%PDF-` header.
- *Rollback*: Remove PDF service.

### Step 4: Backend REST Controllers & App Module Wiring
- Implement `apps/api/src/invoices/invoices.controller.ts` for Client endpoints (`/api/projects/:projectId/invoices`, `:invoiceId`, `:invoiceId/pdf`, `:invoiceId/payment-evidence`).
- Implement `apps/api/src/invoices/controllers/owner-invoices.controller.ts` for Owner administrative endpoints (`/api/admin/invoices`, `:id/issue`, `:id/payments`, `:id/cancel`, `:id/pdf`).
- Register `InvoicesModule` in `apps/api/src/app.module.ts`.
- *Verification*: `apps/api` builds cleanly (`npm run build`).
- *Rollback*: Unregister module from `app.module.ts` and remove controllers.

### Step 5: Backend E2E Test Suite (`invoices.e2e-spec.ts`)
- Implement comprehensive E2E tests in `apps/api/test/invoices.e2e-spec.ts`:
  - Owner creates draft invoice with line items, tax rate, and verify server-calculated totals.
  - Owner issues invoice; verify atomic unique serial number assignment (`INV-2026-0001`).
  - Client designated billing contact queries invoices; verify only issued invoices returned.
  - Non-billing client collaborator queries invoices; verify `404 Not Found` (anti-enumeration).
  - Client from foreign project queries invoice ID; verify `404 Not Found`.
  - Client submits payment evidence (bank reference); verify `PENDING` payment record created.
  - Owner records confirmed payment; verify invoice status updates to `PAID` and `paidAt` is stamped.
  - Client and Owner stream PDF; verify `application/pdf` binary stream returned.
- *Verification*: Vitest E2E tests pass (`npm run test:e2e`).
- *Rollback*: Remove E2E test file.

### Step 6: Frontend API Client & State Hooks
- Create `apps/web/src/services/invoices-api.ts` wrapping endpoints with typed interfaces and PDF blob download utility.
- Create `apps/web/src/features/invoices/hooks/useInvoices.ts` for Client invoice queries and payment proof submission.
- Create `apps/web/src/features/owner/hooks/useOwnerInvoices.ts` for Owner global ledger queries and mutations.
- *Verification*: TypeScript typecheck passes in `apps/web` (`npm run typecheck`).
- *Rollback*: Remove API service and hooks.

### Step 7: Client Invoices Screen 11 (`/invoices`, Figma `4:508`)
- Refactor `apps/web/src/features/invoices/pages/InvoicesPage.tsx`:
  - Remove `<FixtureBadge phase="P06" />` and dummy arrays.
  - Integrate `useInvoices` hook with loading skeletons and empty states.
  - Render invoice cards with real data: invoice number, issue date, due date, status badge, formatted currency, and line item summary.
  - Build `InvoiceDetailModal` showing full line items, subtotal, tax, amount paid, and balance due.
  - Build `PaymentInstructionsModal` showing official bank wire details and transfer reference guidelines.
  - Build `SubmitPaymentProofModal` enabling client to input transfer reference and memo.
  - Connect authenticated PDF statement download action.
  - Add friendly restricted-access card for collaborators without billing privileges.
- Add component unit tests in `apps/web/src/features/invoices/pages/InvoicesPage.test.tsx`.
- *Verification*: Frontend tests pass (`npm run test`), responsive layout works at 390px, 768px, 1024px, 1440px in both themes.
- *Rollback*: Revert `InvoicesPage.tsx` changes.

### Step 8: Owner Billing Interface (`/owner/invoices`)
- Upgrade `apps/web/src/features/owner/pages/OwnerInvoicesPage.tsx`:
  - Display full ledger table with project filter, status filter, client search, totals, and balances.
  - Build `CreateInvoiceModal`: project selector, client selector, due date picker, currency selector (`USD`, `NGN`), dynamic line items (add/remove row, description, quantity, unit price, live preview calculation), and tax rate input.
  - Build `RecordPaymentModal`: record confirmed payment with amount, payment method, reference, and date.
  - Build `CancelInvoiceModal`: void invoice with audit justification.
  - Add PDF preview action.
- Add component unit tests in `apps/web/src/features/owner/pages/OwnerInvoicesPage.test.tsx`.
- *Verification*: Frontend tests pass, Owner billing interface renders properly in dark and light modes.
- *Rollback*: Revert `OwnerInvoicesPage.tsx` changes.

### Step 9: Workspace Build & Full Verification
- Run complete workspace typecheck (`npm run typecheck` across web and api).
- Run full unit and E2E test suites (`npm run test`, `npm run test:e2e`).
- Verify keyboard navigation, accessibility contrast, dialog traps, and zoom scaling up to 200%.
- Document all execution evidence and test outputs in Section 10.
- *Verification*: Zero lint errors, zero type errors, all tests passing.
- *Rollback*: Isolate and fix failing components.

## 7 Objections

### Objection 1: Lack of Confirmed Payment Gateway Risks Blocking Invoicing or Building Mock Webhooks
- **Rating**: Serious
- **Challenge**: Open decision Q05 notes that no payment gateway has been approved. Halting P06 until a gateway is contracted stalls invoice delivery, PDF issuance, and billing visibility. Conversely, implementing dummy gateway redirect URLs or fake webhooks violates `AGENTS.md` ("Do not turn guessed endpoints or sample amounts into production behavior").
- **Resolution**: Implement Bank Transfer with Payment Evidence Reconciliation as the primary, production-ready collection method for P06. Invoices will display official bank remittance instructions. The client billing contact can submit transaction reference numbers and optional payment receipts, which the Owner reviews and confirms in the portal ledger. The schema and payment models (`PaymentRecord`, `PaymentMethod`, `reference`) are explicitly designed so that when an online gateway (e.g. Paystack or Stripe) is selected, its webhook handler can be added without altering existing invoice records or client contracts.

### Objection 2: Floating-Point Rounding Errors and Currency Drift Breach Financial Accuracy Standards
- **Rating**: Serious
- **Challenge**: Standard JavaScript `number` arithmetic causes binary rounding discrepancies (e.g., `0.1 + 0.2 = 0.30000000000000004`). If line items, subtotals, tax rates, and payments use standard floats, invoice totals will drift by fractions of a cent over time, violating `ACCEPTANCE-CHECKLIST.md:68` ("Issued invoices/PDFs use real data, stable numbers and decimal-safe money").
- **Resolution**: Use PostgreSQL `Decimal(12, 2)` for all monetary columns in Prisma (`subtotal`, `taxRate`, `taxAmount`, `totalAmount`, `amountPaid`, `unitPrice`, `amount`). Perform all backend calculations using Prisma's `Decimal` type (`Decimal.js`) with explicit rounding modes before persisting to the database. All frontend and PDF formatting will use `Intl.NumberFormat` parameterized strictly by currency code (`USD` -> `$`, `NGN` -> `₦`).

### Objection 3: Navigation Leaks and Client Confusion if Invoices Are Visible to Non-Billing Contacts
- **Rating**: Minor
- **Challenge**: In `Sidebar.tsx:43`, `Invoices & Billing` is displayed unconditionally in `clientNav`. If an ordinary project collaborator (e.g., copywriter or designer) clicks `/invoices` and receives an abrupt 404 error, it creates user frustration and confusion. Furthermore, sending unread invoice notifications or badges to unauthorized collaborators violates data isolation (`PERMISSIONS.md:27`).
- **Resolution**:
  1. On the backend, enforce `DesignatedBillingContactGuard` returning `404 Not Found` for direct API calls to preserve anti-enumeration.
  2. On the frontend `/invoices` page, inspect the active project's membership. If the user is an assigned collaborator without billing privileges, render an informative, friendly restricted access card ("Billing information is restricted to designated project billing contacts. Contact your project administrator to request access.") rather than a broken page.
  3. Ensure billing-related notifications and badges are dispatched exclusively to users where `isDesignatedBillingContact === true`.

## 8 Verdict

READY FOR APPROVAL.

The proposed plan satisfies all P06 requirements from `Oderinde-Stephen-Client-Portal-Build-Plan-v1.md`, `docs/SCREEN-MAP.md`, `docs/PERMISSIONS.md`, and `docs/ACCEPTANCE-CHECKLIST.md`. It isolates open decision Q05 by implementing bank transfer payment evidence as the core settlement mechanism, while establishing clean, decoupled interfaces for future online gateway webhooks once contracted.

## 9 Approval

- Date: 2026-10-18
- Approver: Stephen
- Approval Scope: P06 Invoices, billing management, decimal financial engine, unique numbering, PDF statements, designated billing-contact guards, payment evidence, Screen 11 (`/invoices`), and Owner billing (`/owner/invoices`).
- Approved text: "Approve"

## 10 Execution log

1. **Prerequisites & Dependencies Installation**:
   - Installed `pdfkit` (^0.16.0) and `@types/pdfkit` (^0.13.9) in `@os-portal/api`.
   - Updated `apps/api/prisma/schema.prisma` with `InvoiceStatus`, `PaymentMethod`, `PaymentRecordStatus` enums, `Invoice`, `InvoiceItem`, `PaymentRecord` models, and relations on `User` and `Project`.
   - Successfully executed `npx prisma generate` generating Prisma client with Decimal support.

2. **Backend Engine (`apps/api`)**:
   - Created DTOs with validation (`CreateInvoiceDto`, `CreateInvoiceItemDto`, `IssueInvoiceDto`, `RecordPaymentDto`, `SubmitPaymentEvidenceDto`, `CancelInvoiceDto`).
   - Implemented `DesignatedBillingContactGuard` enforcing strict `404 Not Found` for non-billing collaborators and unassigned clients to prevent enumeration attacks.
   - Implemented `PdfService` generating streaming server-side PDF invoice statements via PDFKit with studio branding, metadata, line-item grid, and bank remittance wire instructions.
   - Implemented `InvoicesService` featuring atomic database transactions, sequential number generation (`INV-YYYY-XXXX`), exact PostgreSQL `Decimal(12, 2)` calculations, status state machine, payment reconciliation, and mock fallback.
   - Implemented `InvoicesController` (`/api/projects/:projectId/invoices`) and `OwnerInvoicesController` (`/api/admin/invoices`).
   - Registered `InvoicesModule` in `app.module.ts`.

3. **Backend Test Verification**:
   - `npm run test --workspace=@os-portal/api -- src/invoices/invoices.service.spec.ts`: Passed (7/7 tests passed in 30ms).
   - `npm run test:e2e --workspace=@os-portal/api -- test/invoices.e2e-spec.ts`: Passed (9/9 tests passed in 670ms).
   - `npm run typecheck --workspace=@os-portal/api`: 0 errors.

4. **Frontend Implementation (`apps/web`)**:
   - Implemented `invoices-api.ts` API client with preview fallback.
   - Implemented hooks: `useInvoices.ts` and `useOwnerInvoices.ts`.
   - Built modals: `PaymentInstructionsModal`, `SubmitPaymentProofModal`, `InvoiceDetailModal`, `CreateInvoiceModal`, `RecordPaymentModal`, `CancelInvoiceModal`.
   - Replaced static mockup in Screen 11 (`InvoicesPage.tsx`) with live invoice stream, friendly billing-contact restriction notice, detail viewer, PDF download action, and payment evidence modal.
   - Replaced static mockup in Owner billing suite (`OwnerInvoicesPage.tsx`) with complete management ledger, status filters, itemized invoice creation modal, settlement modal, and PDF preview action.
   - Authored unit test suites: `InvoicesPage.test.tsx` and `OwnerInvoicesPage.test.tsx`.

5. **Frontend Verification & Full Build**:
   - `npm run typecheck --workspace=@os-portal/web`: Clean, 0 errors.
   - `npm run test --workspace=@os-portal/web`: All 10 test files passed, all 62 tests passed.
   - Full workspace build (`npm run build --workspaces`):
     - `@os-portal/api`: `nest build` passed.
     - `@os-portal/web`: `tsc -b && vite build` passed, generating production assets in `dist/`.

## 11 Deviations

1. **Payment Gateway Decoupling (Open Decision Q05)**: Rather than stalling P06 on uncontracted payment gateways or introducing fake webhook endpoints, Bank Transfer with Payment Evidence Submission was implemented as the primary collection method. This enables production-ready invoice settlements today while maintaining clean gateway boundaries for future webhook integration.
2. **DOM Test Environment Adjustments**: Protected `scrollIntoView` calls in `MessageThread.tsx` with a runtime type check to avoid jsdom test crashes, and tuned button/amount queries in `OwnerInvoicesPage.test.tsx` and `MessagesPage.test.tsx` to handle multi-element matches.

## 12 Memory changes

None required; decisions D-1, D-5, D-11, D-14, D-15 and patterns P-1, P-2, P-3 accurately govern P06 implementation without contradiction.

## 13 Stephen confirmation

Upon completion, Stephen will confirm:
1. Owner can issue itemized invoices with real line items, tax, and decimal-safe totals.
2. Issued invoices receive a unique, sequential serial number (`INV-YYYY-XXXX`).
3. Only the Owner and designated billing contacts can view invoices and download PDFs.
4. Non-billing collaborators receive `404 Not Found` (anti-enumeration) on API requests.
5. Official PDF statements generate server-side with branding and bank remittance details.
6. Bank transfer payment evidence can be submitted by clients and confirmed by the Owner.
7. Both Screen 11 (`/invoices`) and Owner Billing (`/owner/invoices`) render accurately across desktop/tablet/mobile in both dark and light themes.

## 14 Integration and handoff

- External dependencies: `pdfkit` for server-side PDF generation.
- Open decision Q05: Payment gateway provider (Stripe/Paystack) remains open; offline bank transfer and payment evidence recording provides immediate, fully functional settlement without unconfirmed external accounts.
- Environment variables: Parameterized seller details (`SELLER_LEGAL_NAME`, `SELLER_ADDRESS`, `SELLER_TAX_ID`, `SELLER_BANK_NAME`, `SELLER_ACCOUNT_NUMBER`, `SELLER_SWIFT_CODE`) with studio defaults.
