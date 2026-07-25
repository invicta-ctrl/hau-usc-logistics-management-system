# Phase 7 Shared Internal Shell

## Summary

Complete the accepted Phase 7 internal-shell gap without reopening settled
authentication, routing, workflow, D1, ledger, or role-authorization contracts.

## Type

Feature

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 7.

## Requirements Mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Preserve five real direct routes and server authorization | 1, 4 |
| 2 | Preserve governed USC/DOL R2 branding, sidebar, mobile navigation, topbar | 1, 2 |
| 3 | Add truthful workspace and operational-scope controls, including real Admin route switching | 2 |
| 4 | Add breadcrumbs, account menu, environment/release identity, and attention count | 2 |
| 5 | Preserve accessible tables, forms, filters, dialogs, and drawers | 1, 4 |
| 6 | Remove production preview/no-write/synthetic messaging | 3 |
| 7 | Keep role accents secondary and labeled | 1, 2 |
| 8 | Verify responsive desktop/mobile behavior and all five experiences | 4 |

Coverage: 8 / 8 Phase 7 requirement groups mapped.

## Status

In Progress

## Existing Accepted Foundation

- `/app/admin`, `/app/director`, `/app/food`, `/app/inventory`, and
  `/app/materials` already route through one authenticated application.
- The Worker, D1 operational service, canonical authorization, shared
  navigation, role-specific views, responsive mobile navigation, governed
  branding, audit, evidence, and stable entities are accepted.
- Preserve server authorization while allowing the authenticated Administrator
  to open the five real workspace routes without logout or impersonation.
  Phase 8 will add the stronger System Owner and governed operational-scope
  model; Phase 7 does not invent those grants.

## Implementation

1. Preserve the current direct-route and server-authorization contracts.
2. Add one accessible internal context bar sourced from the authenticated
   bootstrap state:
   - real workspace selector that changes the URL and role workspace while
     preserving Administrator identity; unauthorized users retain only their
     server-assigned destination;
   - current operational scope selector;
   - breadcrumb trail synchronized to active navigation;
   - environment and release indicator;
   - attention count linking to the operational overview;
   - account details menu that adopts the existing sign-out action.
3. In REST mode only, replace demo defaults and preview-only freshness copy
   with truthful authenticated/server wording. Preserve local mock preview
   behavior and test fixtures.
4. Add focused desktop/mobile browser coverage, run the complete repository
   and Playwright gates, deploy to staging, and verify direct routes plus live
   shell behavior.

## Files

- `src/visual/runtime-extensions.js`
- `src/visual/runtime.js`
- `src/styles/visual/runtime-extensions.css`
- `tests/e2e/role-experiences.spec.js`
- `tests/e2e/navigation-responsive.spec.js`
- Phase 7 durable handoff/status records after acceptance

## Safety

- No migration.
- No production mutation.
- No permission expansion.
- Workspace context never changes the authenticated actor, server capability
  projection, or API authorization.
- No workspace option may imply authority the server did not grant.
- No client control may bypass direct-route authorization.

## Validation

- [x] Focused shared-shell browser tests pass at 390px and 1366px
- [x] All five workspace routes are directly reachable only for their
      server-resolved experience
- [x] REST shell contains no prohibited preview/no-write/synthetic messaging
- [x] No page-level overflow
- [x] `npm run check` passes
- [x] Full Playwright passes
- [ ] Exact staging health and live shell smoke pass
- [ ] Exact-head PR checks pass
- [x] Production remains untouched
