# Phase 8 System Owner and Operational Scope

## Summary

Add the accepted System Owner role and a server-validated operational context
without weakening normal Administrator capabilities, impersonating another
actor, or allowing client-visible workspaces/scopes to grant authority.

## Type

Feature / security / migration

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 8.

## Requirements Mapping

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | System Owner opens and operates every authorized workspace/module | 1, 2 |
| 2 | Normal Administrator retains global read plus capability-based writes | 1, 2 |
| 3 | Workspace switching preserves actor and refreshes server projection | 2, 4 |
| 4 | Governed committee/location/event/office scope catalog | 3 |
| 5 | Invalid/unauthorized scope rejected server-side and never grants permission | 3, 4 |
| 6 | Consequential audit context records actor/workspace/scope/reason/time/correlation | 3, 4 |
| 7 | Keyboard, focus, announcement, mobile, reduced-motion behavior | 2, 4 |
| 8 | Exact migration, staging account assignment, rollback, reconciliation | 1, 4 |

Coverage: 8 / 8 Phase 8 requirement groups mapped.

## Status

Local implementation and acceptance passed; staging migration, owner assignment,
deployment, and live acceptance remain pending.

## Vertical slices

1. Add `SYSTEM_OWNER` to the canonical role/capability registry, D1 governance
   registry, session/bootstrap contracts, and server tests. It receives every
   existing capability, resolves to the Administrator entry workspace, and is
   excluded from ordinary starter-account creation or self-escalation paths.
2. Extend the shared workspace control for System Owner context and prove every
   real route/module, including Release Desk, while preserving actual identity
   and capability-bound actions. Keep normal Administrator writes unchanged.
3. Project a bounded operational-scope catalog from governed committees,
   inventory storage locations, event series, events, and office operations.
   Validate URL context server-side, apply read filtering, and attach validated
   context to consequential audit metadata without using it as a grant.
4. Add focused unit/Worker/browser regressions, apply migration 0019 to staging
   only after a private backup, assign the verified owner account without
   exposing its identifier, reconcile sessions/role/capabilities/audit, deploy
   exact SHA, and run live workspace/scope acceptance.

## Safety

- No production mutation.
- No normal Administrator capability expansion.
- No UI-only authorization or role impersonation.
- No public/requester shell access.
- No `SYSTEM_OWNER` creation or promotion through ordinary Access Management.
- Invalid context fails closed; context filters but never grants authority.
- Owner assignment is bound to the verified private staging credential and a
  reversible, audited staging-only operation.

## Validation

- [x] Focused canonical authorization/session tests
- [x] Focused D1 Worker owner/scope tests
- [x] Focused desktop/mobile workspace and scope tests
- [x] `npm run check`
- [x] Full Playwright (100 passed / 242 intentionally skipped)
- [ ] Private pre-0019 staging export and hash
- [ ] Migration 0019 and owner assignment reconciliation
- [ ] Exact staging health/readiness and live Phase 8 smoke
- [ ] Exact-head PR checks
- [ ] Production remains untouched
