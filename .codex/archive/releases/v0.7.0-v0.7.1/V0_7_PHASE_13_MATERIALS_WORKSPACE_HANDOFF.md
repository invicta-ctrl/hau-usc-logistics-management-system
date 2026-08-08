# v0.7.0 Phase 13 Materials & Documentation Workspace Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Accepted result

- `/app/materials` now opens a process-oriented Materials Overview over the
  canonical D1 request, deliverable, event, canvass, supplier, receiving, and
  release records.
- Materials Queue, Canvassing, Procurement, Suppliers, Price History,
  Receiving, Deliverables, and Release Desk are complete destinations over the
  existing shared workflows rather than a duplicate Materials data model.
- The D1 Materials work-queue projection preserves stable event, request,
  request-line, and deliverable identity; exact specification; requested,
  received, and released quantities; budget/procurement/receipt state; and
  bounded quote evidence.
- Historical prices remain reference-only. Supplier-private identifiers are
  not projected into the overview, and release remains in the shared
  capability-protected Release Desk.
- Navigation and actions follow server capability projections. UI visibility
  remains separate from server authorization.

## Repository evidence

- Product/runtime candidate:
  `653c6f846fc219f0c01ece83726583d8a7c80188`.
- `npm run check`: PASS — 61 Vitest files / 417 tests plus governance, lint,
  deterministic builds, Apps Script parity, standalone verification, Worker
  types, and Cloudflare dry run.
- Full Playwright: 123 passed / 297 intentional skips / zero failed.
- Full local Worker/D1 acceptance: 27 / 27 PASS.
- Focused Materials desktop/mobile and fail-closed capability gate: 5 passed /
  1 intentional cross-viewport skip / zero failed.
- Complete logical diff inspection, generated-artifact rebuild, ESLint, and
  `git diff --check`: PASS.

## Staging evidence

- Worker: `hau-usc-logistics-staging`.
- Accepted candidate:
  `653c6f846fc219f0c01ece83726583d8a7c80188`.
- Worker version: `33f417ea-646f-4900-80dd-4cbe1ca97cbd`.
- Cache-busted health/readiness/version: `STAGING`, release `0.7.0`, exact
  candidate, D1/R2/protected configuration ready, schema 19 / migration 0019.
- Complete deployed suite: 5 / 5 PASS — governed brand; System Owner Materials
  scope and route; canonical queue response; all eight destinations; shared
  canvass/deliverables/receiving/release surfaces; authentication and Access
  Management lifecycle; requester privacy; borrower-safe public surface; and
  internal-shell isolation.
- The governed Materials queue truthfully contains zero scoped deliverables.
  No event, quote, supplier, receipt, release, or stock data was invented.
- The Request Center submission/PDF branch was not run because the governed
  staging source has no approved event series. The borrower submission branch
  was not run because the governed public lending catalog has no approved
  lendable item. Both surfaces passed their fail-closed and privacy assertions.
- Reconciliation found 31 accumulated `SMOKE.%` accounts disabled and zero
  active synthetic smoke accounts.

## Remote and safety evidence

- PR #9 at `653c6f846fc219f0c01ece83726583d8a7c80188`: open draft,
  mergeable, exact head, 6 / 6 checks passed.
- Branch and upstream were equal after the product push.
- No schema migration was required; staging remains schema 19.
- The pre-deploy rollback point is Phase 12 Worker version
  `9f333ad5-98d2-4e68-87bc-d05c70c41d5c`.
- No production Worker upload, production D1/R2 write, merge, tag, release, or
  production smoke occurred.

## Next accepted slice

Phase 14 — complete Advanced Access Management: governed workspace, committee,
location, and optional event-scope assignment; presets; effective-access
preview; bounded capability overrides; credential lifecycle; session
revocation; audit history; and last-owner/last-Administrator protection.
