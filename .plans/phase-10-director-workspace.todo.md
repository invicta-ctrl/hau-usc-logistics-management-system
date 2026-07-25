# Phase 10 Director Workspace

## Summary

Complete `/app/director` as a decision-first leadership workspace over the
existing server-authorized operational data. Provide progressive detail and
bounded Management & Access without exposing or duplicating the Administrator
Control Center.

## Type

Feature / security / testing

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 10, and the Director decisions
in `.codex/DESIGN_REFERENCE_DIGEST.md`.

## Requirements mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Executive Overview and Decision Queue | 1 |
| 2 | Event Planning, Event Series, and Sub-events | 1 |
| 3 | Committee Readiness and cross-committee progress | 1 |
| 4 | Request and Procurement Progress | 1 |
| 5 | Release Readiness, Lending Status, and Inventory Alerts | 1 |
| 6 | Decisions, blockers, deadlines, event progress, and exceptions prioritized | 1 |
| 7 | Bounded Management & Access from server projection | 2 |
| 8 | No Administrator control-center access by default | 2, 3 |
| 9 | Desktop/mobile direct-route, keyboard, and overflow acceptance | 3 |

Coverage: 9 / 9 Phase 10 requirement groups mapped.

## Vertical slices

1. Add actionable Director decision/readiness metrics and the complete
   leadership destination map using existing queues and workflow filters.
2. Project the real role, committee scope, operational scope, and bounded
   capability summary inside Management & Access; never expose Admin controls.
3. Add focused REST-authenticated Director desktop/mobile tests, run repository
   and staging acceptance, checkpoint exact evidence, and keep production
   untouched.

## Safety

- No Administrator capabilities or control surfaces granted to Director.
- No duplicated event, request, procurement, release, lending, or inventory
  persistence path.
- No invented event rows or readiness values.
- No production action.

## Validation

- [x] Focused authenticated Director destination tests
- [x] Bounded Management & Access / no-Admin regression
- [x] Mobile navigation, keyboard focus, and no-overflow tests
- [x] `npm run check`
- [x] Full Playwright
- [ ] Exact staging health/readiness and live Phase 10 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
