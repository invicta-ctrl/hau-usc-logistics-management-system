# v0.7.0 Phase 12 Inventory & Pantry Workspace Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Accepted result

- `/app/inventory` now opens an exception-first Inventory Overview over the
  canonical inventory and pantry catalog, with on-hand, reserved, and
  available-to-promise kept visibly distinct.
- Inventory Management, Pantry, Restocking, Lending Operations, Receiving,
  Release Desk, Movement History, and Condition & Stock Alerts are complete
  destinations over the existing shared services rather than duplicate data or
  mutation paths.
- The essential-bootstrap inventory contract now accepts the bounded D1 item,
  ledger, reusable-asset, maintenance, and movement projections. The client
  preserves authoritative D1 balances instead of recomputing them from module
  collections that are intentionally absent.
- Movement and asset history remains append-only, bounded to 100 rows per
  projection, and filtered with the selected operational context when the
  relevant collection is present.
- Inventory row actions and workspace destinations follow server capability
  projections. UI visibility remains separate from server authorization.

## Repository evidence

- Product/runtime candidate:
  `f37671ce63087bc0b90a2775e5a3f1b15a15b25d`.
- `npm run check`: PASS — 61 Vitest files / 417 tests plus governance, lint,
  deterministic builds, Apps Script parity, standalone verification, Worker
  types, and Cloudflare dry run.
- Full Playwright: 118 passed / 284 intentional skips / zero failed.
- Full local Worker/D1 acceptance: 26 / 26 PASS.
- Focused Inventory desktop/mobile and fail-closed capability gate: 5 passed / 1
  intentional cross-viewport skip / zero failed.
- Complete logical diff inspection, generated-artifact rebuild, ESLint, and
  `git diff --check`: PASS.

## Staging evidence

- Worker: `hau-usc-logistics-staging`.
- Accepted candidate:
  `f37671ce63087bc0b90a2775e5a3f1b15a15b25d`.
- Worker version: `9f333ad5-98d2-4e68-87bc-d05c70c41d5c`.
- Cache-busted health/readiness/version: `STAGING`, release `0.7.0`, exact
  candidate, D1/R2/protected configuration ready, schema 19 / migration 0019.
- Governed background/logo scenario: 1 / 1 PASS.
- Owner authentication, Inventory & Pantry operational scope, refreshed direct
  route, preserved System Owner identity, eight Inventory destinations, exact
  D1-to-UI balance parity, movement/alert surfaces, Admin return, ten
  department-account checks, reversible Access Management lifecycle, cleanup,
  sign-out, and public/internal-shell separation: 1 / 1 PASS.
- Two pre-mutation test-harness attempts exposed a brittle session-response
  wait and then a browser/API CSRF desynchronization. The test was corrected to
  refresh through the browser-owned session; the complete gate then passed.
- Reconciliation found all 29 accumulated `SMOKE.%` staging accounts disabled
  and zero active synthetic smoke accounts.

## Remote and safety evidence

- PR #9 at `f37671ce63087bc0b90a2775e5a3f1b15a15b25d`: open draft,
  clean/mergeable, exact head, 6 / 6 checks passed.
- Branch and upstream were equal after the product push.
- No schema migration was required; staging remains schema 19.
- No inventory, balance, lendable-policy, or event truth was invented.
- No production Worker upload, production D1/R2 write, merge, tag, release, or
  production smoke occurred.

## Next accepted slice

Phase 13 — complete Materials & Documentation over the governed request,
canvass, quote, budget, procurement, cumulative receiving, evidence,
provenance, and controlled-release pipeline.
