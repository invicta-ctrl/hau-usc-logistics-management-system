# Phase 11 Food Workspace

## Summary

Complete `/app/food` as a deadline-first Food operations workspace over the
existing scoped Food service, shared procurement/receiving workflows, and
shared Release Desk. Preserve aggregate-only dietary handling and capability
boundaries.

## Type

Feature / security / testing

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 11;
`.codex/DESIGN_REFERENCE_DIGEST.md`; `docs/FOOD_COMMITTEE_WORKFLOW.md`; and the
hash-verified accepted `D:\Documents\UIUX workshop\Food\Food.html` reference.

## Requirements mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Food Overview and Food Work Queue | 1 |
| 2 | Suppliers & Quotes and Procurement | 2 |
| 3 | Receiving and shared Release Desk | 2 |
| 4 | Workflow Reference | 1 |
| 5 | Deadline-first event/sub-event grouping | 1 |
| 6 | Headcount, servings, dietary/allergen/halal context | 1 |
| 7 | Supplier/quote, budget, receiving, and distribution state | 1, 2 |
| 8 | Capability-bound actions and server validation | 2, 3 |
| 9 | Desktop/mobile direct-route, keyboard, and overflow acceptance | 3 |

Coverage: 9 / 9 Phase 11 requirement groups mapped.

## Vertical slices

1. Add a real Food Overview, rich scoped queue, actionable deadline/attention
   metrics, event grouping, and governed workflow reference.
2. Route Suppliers & Quotes, Procurement, Receiving, and Release Desk to their
   existing shared workflows with server-capability projection; never duplicate
   persistence or treat historical prices as authority.
3. Add focused REST-authenticated Food desktop/mobile tests, run repository and
   staging acceptance, checkpoint exact evidence, and keep production untouched.

## Safety

- No person-level dietary, medical, supplier-contact, TIN, or payment data.
- No duplicated procurement, receiving, evidence, or release mutation path.
- No historical supplier price presented as current authority.
- No client-side role or orange accent grants capability.
- No invented events, quantities, suppliers, quotes, budgets, or receipts.
- No production action.

## Validation

- [ ] Focused authenticated Food destination tests
- [ ] Deadline/event grouping and aggregate dietary-context regression
- [ ] Capability-bound shared-workflow regression
- [ ] Mobile navigation, keyboard focus, and no-overflow tests
- [ ] `npm run check`
- [ ] Full Playwright
- [ ] Exact staging health/readiness and live Phase 11 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
