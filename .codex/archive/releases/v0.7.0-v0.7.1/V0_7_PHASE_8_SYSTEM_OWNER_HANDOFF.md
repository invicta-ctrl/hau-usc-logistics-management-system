# v0.7.0 Phase 8 System Owner and Operational Scope Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Accepted result

- `SYSTEM_OWNER` is a protected canonical role with every existing capability,
  all five real role-workspace destinations, and Release Desk access.
- Workspace changes preserve the real authenticated owner. They update the URL,
  title, breadcrumb, navigation, accent, workspace presentation, and refreshed
  server capability projection without impersonation.
- Ordinary Administrator global reads and capability-bound writes remain
  unchanged. Ordinary Access Management cannot create, assign, or mutate a
  System Owner account.
- The operational-scope catalog is built from governed committees, inventory
  locations, event series/events, and office/non-event context. Invalid scope
  fails closed; a valid scope filters reads and never grants a capability.
- Consequential operational mutations record actual actor/account, actor role,
  active workspace, committee/location/event context, selected scope, reason,
  timestamp, and correlation identifier.

## Repository evidence

- Product/runtime candidate:
  `ffe71817583518ac396d33554820bb1407fce756`.
- `npm run check`: PASS — 61 Vitest files / 416 tests plus governance, lint,
  deterministic builds, Apps Script parity, standalone verification, Worker
  types, and Cloudflare dry run.
- `npm run test:e2e:cloudflare:local`: PASS — 25 / 25.
- `npm run test:e2e`: PASS — 100 passed / 242 intentional skips / zero failed.
- Focused owner direct-route/refresh, scope, invalid-context, server-filter,
  audit-enrichment, mobile, focus, and reduced-motion regressions passed.
- Complete logical diff inspection and `git diff --check`: PASS.

## Migration and staging evidence

- Private pre-Phase 8 export:
  `D:\Documents\Codex\private-config\hau-usc-logistics-v0.6-phase3-20260722\staging-pre-phase8-system-owner-20260726.sql`.
- Export SHA-256:
  `3332b991c9c36f16d837584e4363db9375809bbf2ad8a574685a9d7e609cbc45`.
- Migration `0019_system_owner_operational_scope.sql` applied successfully;
  schema metadata and migration ledger reconcile at 19 / 0019.
- Exactly one approved private staging account is `ACTIVE` as System Owner.
  Sixteen pre-promotion sessions were revoked; reconciliation found zero active
  owner sessions before fresh acceptance login.
- The owner promotion/reconciliation audit is durable in staging D1. Plaintext
  credentials remain outside Git and are not reproduced in this handoff.
- Worker version: `0500db8f-931c-41a4-814f-1f4c4626d360`.
- Cache-busted health/readiness/version: `STAGING`, release `0.7.0`, exact
  `ffe7181`, D1/R2/protected configuration ready, schema 19 / migration 0019.
- Governed background/logo scenario: 1 / 1 PASS.
- Live owner authentication, scope switching, route refresh, identity
  preservation, all ten department Account rows/reset controls, reversible
  account lifecycle, fail-closed enumeration, audit history, cleanup, sign-out,
  and public/internal-shell separation: 1 / 1 PASS.

## Remote and safety evidence

- PR #9 at `ffe71817583518ac396d33554820bb1407fce756`: open draft,
  clean/mergeable, exact head, 6 / 6 checks passed.
- Branch and upstream were equal before this durable checkpoint.
- No production Worker upload, production D1/R2 write, merge, tag, release, or
  production smoke occurred.
- Formal rollback rehearsal remains Phase 24; the private export and prior
  immutable Worker version are retained rollback inputs.

## Next accepted slice

Phase 9 — audit and complete the Administrator workspace as the next bounded
master-prompt vertical slice while preserving the accepted Phase 0–8 behavior.
