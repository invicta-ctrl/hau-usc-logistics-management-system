# Phase 9 Administrator Workspace

## Summary

Complete the real `/app/admin` workspace as an exception-first control center
over the existing server-authorized workflows. Reuse the accepted Request,
Lending, Release, Restocking, Procurement/Receiving, Inventory, Reference,
Access, audit, health, evidence, and governed brand surfaces; do not duplicate
their domain logic or pull later advanced lifecycle phases forward.

## Type

Feature / security / testing

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 9, and the Administrator
decisions in `.codex/DESIGN_REFERENCE_DIGEST.md`.

## Requirements mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Exception-first Administrator overview | 1 |
| 2 | Metrics cover access, evidence, reference, inventory, request/lending/release, environment, and cross-workspace attention | 1 |
| 3 | Every metric opens the relevant filtered destination | 1, 3 |
| 4 | Control Center exposes Access, Reference, Link Registry, Audit/System, Operational Health, and Brand Assets | 2 |
| 5 | Operations exposes all request queues, Lending Hub, Release Desk, Restocking, Procurement, Inventory, Receiving, and Evidence status | 1, 2 |
| 6 | Release Desk remains a distinct working destination | 1, 3 |
| 7 | Existing capability/server authorization remains authoritative | 2, 3 |
| 8 | Desktop/mobile keyboard and overflow acceptance | 3 |

Coverage: 8 / 8 Phase 9 requirement groups mapped.

## Vertical slices

1. Replace the generic Administrator summary with actionable exception metrics
   and a complete Operations destination map backed by the current server
   projection and existing filtered workflow controls.
2. Complete distinct read-only Operational Health, governed Brand Assets, and
   Evidence Status destinations inside the existing authorized control desk;
   retain current Access, Reference, routing, audit, and advertisement controls.
3. Add focused desktop/mobile regression coverage, run repository and deployed
   staging acceptance, record exact evidence, and keep production untouched.

## Safety

- No new role or capability and no client-side authority grant.
- No duplicate request, inventory, lending, release, receiving, evidence, or
  brand persistence path.
- No advanced access lifecycle, brand upload lifecycle, or owner health mutation
  ahead of Phases 14, 19, and 21.
- No production action.

## Validation

- [x] Focused Administrator overview/destination tests
- [x] Mobile navigation, keyboard focus, and no-overflow tests
- [x] Existing reference/access/role regressions
- [x] `npm run check`
- [x] Full Playwright (104 passed / 250 intentionally skipped)
- [ ] Exact staging health/readiness and live Phase 9 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
