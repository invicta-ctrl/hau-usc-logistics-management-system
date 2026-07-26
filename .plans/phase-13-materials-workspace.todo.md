# Phase 13 Materials & Documentation Workspace

## Summary

Complete `/app/materials` as the process-oriented acquisition and fulfillment
workspace over the existing canonical request, deliverable, canvass, supplier,
receiving, evidence, inventory-provenance, and Release Desk services.

## Type

Feature / bug fix / security / testing

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 13;
`.codex/DESIGN_REFERENCE_DIGEST.md`; and the hash-verified accepted
`D:\Documents\UIUX workshop\Materials\MATERIALS.html` reference.

## Requirements mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Materials Overview | 1, 2 |
| 2 | Materials Queue | 1, 2 |
| 3 | Canvassing | 2 |
| 4 | Procurement | 2 |
| 5 | Suppliers | 2 |
| 6 | Price History | 2 |
| 7 | Receiving | 2 |
| 8 | Deliverables | 2 |
| 9 | Shared Release Desk | 2 |
| 10 | Stable request/event identity and cumulative receiving | 1, 3 |
| 11 | Capability-bound desktop/mobile acceptance | 3 |

Coverage: 11 / 11 Phase 13 requirement groups mapped.

## Vertical slices

1. Repair the missing D1 Materials queue projection over canonical deliverables,
   request lines, events, canvass evidence, suppliers, and cumulative receipts.
2. Add the acquisition-exception Materials Overview and complete Queue,
   Canvassing, Procurement, Suppliers, Price History, Receiving, Deliverables,
   and Release Desk destinations over existing shared workflows.
3. Add focused REST-authenticated desktop/mobile and negative-capability tests,
   run repository and staging acceptance, checkpoint exact evidence, and keep
   production untouched.

## Safety

- No second Materials persistence model or Apps Script-only component copy in D1.
- No invented supplier, quote, budget, event, receipt, or stock truth.
- Historical prices remain reference-only and append-preserving.
- No client-side role or blue accent grants authority.
- No production action.

## Validation

- [ ] D1 Materials queue authorization/scope/projection regression
- [ ] Materials destination and acquisition-exception tests
- [ ] Capability-bound shared-workflow regression
- [ ] Mobile navigation, keyboard focus, and no-overflow tests
- [ ] `npm run check`
- [ ] Full Playwright and local Worker/D1 acceptance
- [ ] Exact staging health/readiness and live Phase 13 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
