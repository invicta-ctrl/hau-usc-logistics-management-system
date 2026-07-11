# Website Audit Reference - 11 July 2026

This repository was refactored against `HAU_USC_Logistics_Prototype_Website_Audit_2026-07-11.pdf` (22 pages). The audit reviewed the 227 KB authoritative single-file prototype through static code inspection, responsive renders, and targeted logic probes.

## Preserved strengths

- HAU-USC institutional visual identity and custom design system.
- End-to-end request, matching, canvass, procurement, receiving, Release Desk, lending, restocking, and inventory concepts.
- Request submission separated from physical stock deduction.
- Predictive item search, available-to-promise, partial routing, EIT provenance, and append-only ledger direction.

## Confirmed P0 defects reproduced by the audit

1. Paired event transfers generated duplicate ledger transaction IDs.
2. Repeated receiving overwrote `quantityReceived` while ledger receipts accumulated.
3. Repeated returns posted multiple `LOAN_RETURN` movements.
4. Repeated handoffs posted multiple `LOAN_OUT`/`ISSUE` movements.
5. Service calls accepted event transfers greater than the event-item balance.
6. Request review used asynchronous reservation work inside `forEach`, allowing accepted states without reservations.
7. Restock receiving completed sibling lines sharing one parent request.

The current Vitest integration suite recreates these probes and verifies the repaired behavior.

## Additional required remediations

- Reservation-aware atomic release.
- Explicit transition maps and parent-status derivation.
- Rollback-safe split operations and one full/partial/none/new routing engine.
- Semantic/category/role validation for event transfers.
- Raw negative-balance visibility.
- Mobile bottom navigation, readable text/targets, collapsed secondary actions, sticky request review.
- Skip link, `aria-current`, dialog focus trap/inert/restoration, inline field errors, named tables, live announcements, and application confirmation modals.
- Modular source, active-view rendering, migration pipeline, structured errors, and automated tests.
- Sanitized requester payload and server-owned identity/authorization/locking/idempotency in the future backend.

The original PDF remains the authoritative review artifact supplied to the project. This Markdown reference exists so maintainers can understand the implementation basis without relying on chat history.
