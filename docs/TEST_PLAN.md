# Test Plan

## Automated unit coverage

- Ledger-derived on-hand/reserved/available-to-promise and raw negative exceptions.
- Full/partial/none/new routing.
- Transition maps and parent derivation.
- Cumulative, partial, final, damaged/rejected, over-receipt, and idempotent receipt rules.
- Partial release, reservation consumption, over-release, and retry safety.
- Handoff/return idempotency and lost/damaged restoration.
- Event transfer compatibility, balance, provenance, and paired ID uniqueness.
- Multi-line restock parent behavior.
- Asia/Manila date-only helpers, business-week/exam-week rules, and year-boundary IDs.
- Requester bootstrap sanitization and centralized permissions.
- Legacy state migration.

## Integration coverage

- Request from stock through controlled release.
- Partial-stock split.
- Cumulative deliverable receiving.
- Line-level multi-line restock.
- Loan handoff/return audit probes.
- Competing scarce-stock allocations.
- Evidence metadata attachment.
- Six reproduced audit probes.

## Playwright coverage

- Navigation across modules.
- Mobile bottom navigation and More drawer.
- Request composer and keyboard autocomplete.
- Request-only payload isolation.
- Mobile inventory overflow actions.
- Modal focus containment/restoration.
- Responsive smoke at 320, 390, 768, 1024, 1366, and 1440 px.

Run `npm run check` and `npm run test:e2e`. If Playwright browsers cannot be installed in the execution environment, record the suite as provided but unrun; do not call it passing.
