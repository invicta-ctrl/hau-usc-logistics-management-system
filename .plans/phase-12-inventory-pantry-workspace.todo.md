# Phase 12 Inventory & Pantry Workspace

## Summary

Complete `/app/inventory` as the primary stock-truth and circulation execution
workspace over the existing canonical inventory, lending, restocking,
receiving, Release Desk, reusable-asset, and append-only movement services.

## Type

Feature / bug fix / security / testing

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 12;
`.codex/DESIGN_REFERENCE_DIGEST.md`; `docs/DOMAIN_RULES.md`;
`docs/LENDING_HUB_GUIDE.md`; `docs/RESTOCK_SAFETY_WORKFLOW.md`; and the
hash-verified accepted `D:\Documents\UIUX workshop\Inventory\INVENTORY.html`
reference.

## Requirements mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Inventory Overview and Inventory Management | 1, 2 |
| 2 | Pantry | 2 |
| 3 | Restocking and validated Receiving | 2 |
| 4 | Lending Operations and shared Release Desk | 2 |
| 5 | Global append-only Movement History | 1, 2 |
| 6 | Condition and stock alerts | 1 |
| 7 | Distinct on-hand, reserved, and ATP truth | 1 |
| 8 | Reusable assets, overdue, damage, and maintenance | 1 |
| 9 | Partial/full release and circulation invariants | 2, 3 |
| 10 | Capability-bound desktop/mobile acceptance | 3 |

Coverage: 10 / 10 Phase 12 requirement groups mapped.

## Vertical slices

1. Repair the essential-bootstrap inventory contract and preserve authoritative
   D1 balances, reusable assets, condition, maintenance, and movement data.
2. Add the exception-first Inventory Overview and complete Inventory, Pantry,
   Restocking, Lending, Receiving, Release Desk, Movement History, and Alerts
   destinations over existing shared workflows.
3. Add focused REST-authenticated desktop/mobile and negative-capability tests,
   run repository and staging acceptance, checkpoint exact evidence, and keep
   production untouched.

## Safety

- No direct editing or deletion of ledger, reservation, lending, or asset history.
- No duplicated stock, receiving, release, or circulation mutation path.
- No invented inventory, balance, condition, maintenance, or lendable policy.
- No client-side role or amber accent grants capability.
- No production action.

## Validation

- [ ] Essential-bootstrap inventory contract and exact-balance regression
- [ ] Inventory destination and stock/condition alert tests
- [ ] Capability-bound shared-workflow regression
- [ ] Mobile navigation, keyboard focus, and no-overflow tests
- [ ] `npm run check`
- [ ] Full Playwright
- [ ] Exact staging health/readiness and live Phase 12 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
