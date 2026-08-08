# HAU-USC Logistics v0.6 system and role guide

## Current delivery boundary

Phase 2 provides one responsive, role-aware logistics application over the verified Phase 1
identity, authorization, and transaction contracts. The repository implementation and its
fictional preview are complete for TERRA review. Phase 3 infrastructure, migration,
reconciliation, deployment proof, production promotion, and PR merge are not implied.

The internal application uses server-issued Access IDs. First login replaces the temporary
password and confirms contact details; it does not let a user choose a role or committee.
Every privileged read and mutation remains controlled by server-derived capabilities and
current state.

## Shared application

All roles use the same navigation, typography, spacing, cards, tables, forms, dialogs,
status language, accessibility patterns, and responsive behavior. Role accents provide
orientation only and never grant authority.

| Experience         | Primary operational view                                                                     | Shared destinations                                              | Authority boundary                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Administrator      | Exceptions, reference data, access proposals, routing, and system health                     | Reference Administration and approved shared visibility          | System authority does not imply release or inventory authority; access expansion requires a different reviewer |
| Director           | Event-series readiness, committee progress, blockers, and leadership decisions               | Request, procurement, release, lending, and inventory workspaces | Leadership visibility does not imply protected configuration or system administration                          |
| Food Committee     | Food requirements, deadlines, canvassing/procurement, receiving, and distribution            | Request Center, Procurement, Release Desk, and stock context     | Orange role scope does not bypass procurement, receiving, evidence, or release capabilities                    |
| Inventory & Pantry | Stock exceptions, pantry, lending, replenishment, receiving, and movements                   | Inventory, Lending, Restocking, and Release Desk                 | Amber role scope does not permit direct ledger edits or bypass current-state validation                        |
| Materials          | Specifications, canvass, quote comparison, procurement, deliverables, receiving, and release | Request Center, Procurement, Release Desk, and Inventory         | Blue role scope does not grant purchasing, receiving, transfer, or release authority                           |

## Shared workflows

- **Overview:** role-scoped metrics and governed links into the existing workspaces.
- **Request Center:** Event Logistics and Catalog Restock requests. Submission records a
  request for review; it never deducts physical stock.
- **Office Lending Hub:** borrower submission, approved-source review, claim/issue,
  handoff, overdue, return, and completion.
- **Release Desk:** controlled partial or complete event/loan handoff with selected lines,
  recipient identity, releasing staff/time, recipient confirmation, notes, and optional
  evidence.
- **Restocking:** review, canvass, budget, procurement, and line-level cumulative receiving.
- **Procurement & Deliverables:** canvass comparison, quote quality signals, procurement,
  cumulative receiving, evidence, event-item provenance, and release readiness.
- **Inventory Management:** catalog search, on-hand, reserved, available-to-promise,
  provenance, movements, archive, and restore.
- **Reference Administration:** controlled proposals and review for approved domains;
  roster-owned identity and sync health remain read-only.

## Operational truth

- Physical quantity is derived from the opening baseline plus append-only ledger movements.
- `availableToPromise = onHand - reserved`; the three quantities are never collapsed.
- Request submission is not reservation, receipt, release, or issue.
- Receiving records the quantity received now and accumulates it against the line total.
- Release validates every selected line and aggregate stock/event-item balance before any
  mutation; a failed preflight records no partial physical change.
- Posted ledger records, audit history, and immutable receipt/release evidence are not
  edited in place.
- Browser eligibility messages assist the operator; the server reauthorizes and revalidates
  the current state before every protected action.

## Responsive and accessibility behavior

Desktop uses the shared sidebar. Mobile uses five primary destinations and an accessible
More panel for the remaining shared/admin destinations. Forms stack without hiding required
actions; mobile Request, Lending, and Release views are verified at 390 px. Keyboard
comboboxes, visible labels, status text, focusable actions, and non-color authority labels
remain required.

## Operator start

1. Confirm the visible environment label before working.
2. Sign in with the issued Access ID and complete activation if required.
3. Start from the role overview and open the workspace named by the exception or task.
4. Recheck event/request identity, quantity, unit, status, and evidence before a protected
   action.
5. Refresh if the application reports newer operational data; do not overwrite a dirty form.
6. Treat all local/shareable records as fictional preview data.

See `REQUEST_CENTER_GUIDE.md`, `LENDING_HUB_GUIDE.md`,
`ADMIN_DIRECTOR_GUIDE.md`, `RESTOCK_SAFETY_WORKFLOW.md`,
`VENUE_EQUIPMENT_REFERENCE_WORKFLOW.md`, and `DEMO_RUNBOOK.md` for focused procedures.
