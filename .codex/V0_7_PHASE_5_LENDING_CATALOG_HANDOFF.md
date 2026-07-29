# v0.7.0 Phase 5 Lendable Inventory Catalog Handoff

Decision: **PHASE 5 ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Delivered

- One canonical Inventory Management catalog with additive governed lending fields; no second lending inventory was created.
- Borrower-safe name, Product ID, category, reusable/consumable type, image slot, description, availability, unit, duration, maximum quantity, eligibility, restrictions, and handling guidance.
- Staff-only on-hand, reserved, available-to-promise, ready, on-loan, overdue, damaged, maintenance, expected-return, and traceable-asset signals.
- Reusable asset instances with tag/serial, condition, state, current ticket, expected return, handoff/return evidence, photos, maintenance, and append-only movement history.
- One server-owned `lending_catalog_availability` view and catalog service used by both public listing and lending validation.
- Approval-time reservation and exact asset assignment when traceable assets exist; submission still creates no reservation or physical stock movement.
- Handoff and return update asset state and append movement history; damaged/maintenance returns are retained as controlled conditions.
- Bounded R2-backed `/brand/catalog/<asset-key>` delivery with traversal and malformed-key rejection.
- Additive migration `0014_lending_catalog_assets.sql`.

## Staging migration and reconciliation

- Private pre-0014 SQL export: 200,577 bytes; SHA-256 `27a724b944b7846606af6faefe762245e3840ddab80411197d0a766b7d6b68cc`.
- Before migration: schema 13, 20 accounts, six requests, six public requests, two public lending requests, two lending tickets, two inventory items, and zero reservations.
- The first remote attempt rejected the original multi-statement trigger with SQLite `incomplete input`; the D1 transaction rolled back completely. Schema 13, data, and migration history were unchanged.
- The trigger was expressed as a remote-compatible guarded trigger, verified locally, committed as `fc9ef1ccc5fef9018d37157a13078773c9018a13`, and the retry succeeded.
- After migration: schema 14 / migration 0014, all prior data preserved, 12 governed lending columns, five reusable-asset tables, one authoritative availability view, and zero reservations.
- The real governed staging catalog still has zero approved public items. The audited synthetic item used for smoke is archived and `NOT_LENDABLE`; no institutional eligibility was invented.

## Verification

- `npm run check`: PASS — governance, lint, 58 Vitest files / 401 tests, builds, generated parity, Apps Script validation, Cloudflare types, and dry-run.
- Fresh local Worker/D1: PASS — 18 / 18, including the traceable asset reserve/handoff/return lifecycle.
- Full Playwright: PASS — 94 passed, 224 intentional project/viewport skips, zero failures across 318 scheduled tests.
- Deployed staging governed brand, authentication/Access Management, public Request Center, and public Lending Center: PASS — 4 / 4.
- Post-smoke cleanup: PASS — synthetic catalog item archived and `NOT_LENDABLE`, zero active public catalog items, zero reservations.
- Cache-busted health/readiness/version: PASS — STAGING, v0.7.0, exact runtime `fc9ef1ccc5fef9018d37157a13078773c9018a13`, schema 14, migration 0014, ready true.
- Draft PR #9: exact head `fc9ef1c`, open, clean/mergeable, all six checks passed.

## Recovery and boundary

- The pre-0014 export and migration/deploy/smoke logs are retained outside Git under the private candidate directory.
- The previous immutable Worker version remains available; formal rollback rehearsal remains Phase 24.
- No approved real public-lending item, asset serial, maintenance record, image, or eligibility rule was invented.
- Production Worker, production migrations/data/secrets, Google sources, PR merge, tag, and release remain untouched.

## Next accepted phase

Phase 6 — Build the complete internal Office Lending Hub using the Phase 5 catalog and accepted Phase 4 backend. Preserve the canonical inventory, authorization, reservation, ledger, and append-only asset-history contracts.
