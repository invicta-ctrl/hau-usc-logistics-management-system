# v0.7.0 Phase 17 Inventory Production Data Handoff

Status: **ACTIVE — OWNER REVIEW REQUIRED — PRODUCTION NO-GO**

Date: 2026-07-28

## Authoritative source and snapshot

- The production inventory workbook was opened through the owner's existing
  authenticated browser session and read without modifying Google data.
- A private immutable export was written outside Git and bound to repository
  checkpoint `cb1861dca2bc42bb63a4a3eafd78c624b30654dd`.
- Snapshot SHA-256:
  `9049d68401c179d67bf0544d886ffda4b279be170067b10001b840a32b02768f`.
- `01_ITEM_MASTER` tab SHA-256:
  `6b2601f23f2caf8b58f2387cb093c193daa0c674538420d64275ba12aa546f1d`.
- The private export contract validator passed without printing workbook
  identifiers or source row values.

Source reconciliation:

| Check | Result |
| --- | ---: |
| Item rows | 397 |
| Unique governed item IDs | 397 |
| `ACTIVE` | 394 |
| `VERIFY` | 3 |
| Missing units | 0 |
| Invalid or negative opening quantities | 0 |
| Zero opening quantities | 2 |
| `TO_CLASSIFY` handling rows | 397 |
| Quarantined rows after parser repair | 0 |

## Repository repair

- `migration/google-sheets-to-d1.v1.json` now maps catalog
  `opening_quantity` to zero.
- `scripts/migration/prepare-import.mjs` creates one idempotent append-only
  `OPENING_BALANCE` ledger movement for every positive approved source
  opening, quarantines every occurrence of a duplicate source ID, accepts the
  source's governed approval marker, and emits a private owner-review queue.
- `migrations/0024_inventory_opening_ledger.sql` migrates legacy nonzero
  catalog openings to the ledger, asserts count and quantity parity, resets
  catalog metadata to zero, recreates ledger-only balances, and blocks future
  direct nonzero opening writes.
- Focused regression coverage verifies ledger-only openings, duplicate
  quarantine, private classification review, migration guards, and
  reconciliation SQL.

## Isolated D1 proof

- Migrations 0001–0024 applied successfully in a fresh isolated D1 database.
- The prepared 397-row import applied successfully and an exact replay applied
  successfully.
- Reconciliation after replay:

| Check | Result |
| --- | ---: |
| Imported source rows | 397 |
| Rejected source rows | 0 |
| Catalog rows with nonzero opening metadata | 0 |
| Opening-ledger count difference | 0 |
| Opening-ledger quantity difference | 0 |
| Negative inventory balances | 0 |
| Unsafe lendable unclassified items | 0 |
| Active mock inventory items | 0 |
| Pending inventory classifications | 397 |

Verification:

- Focused Vitest: 2 files / 12 tests passed.
- ESLint on the changed importer and regression test: passed.
- `npm run check`: passed, including 71 Vitest files / 462 tests and all
  repository gates.
- Wrangler migration rehearsal: schema 24 and all migration commands passed.

## Required owner review

The approved source does not classify any of the 397 items as reusable or
consumable. One private queue therefore contains exactly 397 rows and one
reason code. Each row requires:

1. `inventoryKind`
2. `isLendable`
3. `lendingAudience`
4. `assetInstanceCountIfReusable`
5. `conditionIfReusable`
6. `maintenanceStateIfReusable`

These values cannot be inferred from item names, quantities, or category
labels. Reusable asset instances, condition, maintenance state, and final
lending availability cannot be accepted until the queue is resolved.

## External-state boundary

- Staging remains on accepted Phase 16 runtime
  `ac83af82aec2e42ae839d8b4975947ebf0a1526a`, schema 23.
- No staging or production database migration/import occurred.
- No Worker deployment, provider write, production promotion, merge, tag, or
  release occurred.

## Resume action

Resolve the private review queue from an approved owner source. Then freeze a
new exact candidate, recapture the source snapshot against that SHA, perform a
private staging backup, apply migration 0024, import once and replay once,
reconcile all Phase 17 invariants, deploy the exact candidate, run browser
acceptance and exact-head CI, and continue directly to Phase 18 only after the
Phase 17 gate passes.
