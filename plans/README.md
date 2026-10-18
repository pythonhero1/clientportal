# Task plans

Create one file per implementation task. Never overwrite another task's history. Use `P00-workspace-bootstrap.md`, `P01-identity-and-access.md`, or a descriptive `fix-...md` name. Stephen is the approver.

The supplied kit's 14 sections are retained. State what is proposed, approved, implemented and actually tested separately. Use the full template for dependencies, interfaces, security or multi-file work. A one-file change without new dependencies/contracts may use two objections instead of three.

## Status

`DRAFT` -> `AWAITING APPROVAL` -> `APPROVED` -> `IN PROGRESS` -> `IMPLEMENTED - AWAITING STEPHEN CONFIRMATION`

Also use `BLOCKED`, `ABANDONED` or `SUPERSEDED BY <path>` when appropriate. Only Stephen confirms completion. Keep approval provenance and scope in section 9; a document's existence is not approval.

## Template

```markdown
# Task title

- Task: identifier and concrete result
- Status: DRAFT
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Workspace: one portal repository

## 1 Task
What changes for a user or developer, in one sentence.

## 2 Applicable memory
Open and quote actual matching entries. Do not invent an ID.

## 3 Affected files
List exact proposed files/paths and create/modify/remove actions.
For existing code include verified locators where useful.

## 4 Contract status
For each interface: confirmed, proposed for review, or open.
Identify producer, consumer, fields/errors and permission checks.

## 5 Scope and acceptance
Quote the relevant requirement and list measurable acceptance.

## 6 Ordered steps
Changes, verification and rollback for each meaningful step.

## 7 Objections
At least three genuine objections, rated blocker/serious/minor,
with a resolution or a clearly stated remaining decision.

## 8 Verdict
BLOCKED for named affected decisions, or READY FOR APPROVAL.
Describe independent scope that can proceed separately.

## 9 Approval
Date, Stephen's exact approval words and approved scope.
Leave explicit NOT YET APPROVED until approval is given.

## 10 Execution log
Actual changes and real evidence as implementation happens.
Unattempted work is NOT YET ATTEMPTED.

## 11 Deviations
Expected, observed, adjustment and reason; review scope impact.

## 12 Memory changes
Real entries changed, source and reason, or checked/no changes.

## 13 Stephen confirmation
Specific product/developer checks against section 5.

## 14 Integration and handoff
External dependencies, exact unresolved contracts and runbook.
Say not needed if all boundaries are resolved in this task.
```

Approval covers the named scope and ordered steps. Continue within it without repeated permission requests. For a materially changed business/security decision, revise the plan and seek a concrete scope decision. Planning and evidence maintenance remain autonomous.
