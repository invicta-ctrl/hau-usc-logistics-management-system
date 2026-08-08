# v0.7.0 Phase 17 Inventory Production Data Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

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

| Check                                  | Result |
| -------------------------------------- | -----: |
| Item rows                              |    397 |
| Unique governed item IDs               |    397 |
| `ACTIVE`                               |    394 |
| `VERIFY`                               |      3 |
| Missing units                          |      0 |
| Invalid or negative opening quantities |      0 |
| Zero opening quantities                |      2 |
| `TO_CLASSIFY` handling rows            |    397 |
| Quarantined rows after parser repair   |      0 |

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
- `.codex/specs/v0.7.0-phase-17-safe-classification-amendment.md` records the
  owner's approval to import pending classifications in a conservative
  fail-closed state and complete physical review through the website.
- `migrations/0025_inventory_classification_workflow.sql` adds explicit
  `UNVERIFIED` / `NEEDS_CLASSIFICATION` state, condition and maintenance review,
  optimistic revisions, append-only classification history, and database
  triggers that block unclassified or unsafe reusable lending.
- The D1 service and protected Inventory workspace now provide search, status
  and kind filters, progress totals, pagination, individual review, a
  non-lendable-only confirmed bulk path, optional governed evidence, explicit
  lending confirmation, and physical asset-tag registration without deriving
  instances from stock quantity.
- Lending submission, approval, and handoff revalidate completed
  classification server-side.
- `migrations/0026_fail_closed_legacy_inventory.sql` conservatively repairs
  every legacy unclassified row to the same non-lendable boundary without
  deleting inventory, ledger, evidence, or history.
- Import reconciliation recognizes both authenticated requester ownership and
  public tracking ownership, while still reporting genuinely unscoped rows.
- Focused regression coverage verifies ledger-only openings, duplicate
  quarantine, private classification review, migration guards, and
  reconciliation SQL.

## Isolated D1 proof

- Migrations 0001–0026 applied successfully in a fresh isolated D1 database.
- The prepared 397-row import applied successfully and an exact replay applied
  successfully.
- Reconciliation after replay:

| Check                                      | Result |
| ------------------------------------------ | -----: |
| Imported source rows                       |    397 |
| Rejected source rows                       |      0 |
| Catalog rows with nonzero opening metadata |      0 |
| Opening-ledger count difference            |      0 |
| Opening-ledger quantity difference         |      0 |
| Negative inventory balances                |      0 |
| Unsafe lendable unclassified items         |      0 |
| Active mock inventory items                |      0 |
| Pending inventory classifications          |    397 |

Verification:

- Product/deployed staging commit:
  `03b408826d993be0c79692e15b86b38fc97dadf6`, pushed with upstream
  parity.
- Focused Vitest: 2 files / 12 tests passed.
- ESLint on the changed importer and regression test: passed.
- `npm run check`: passed, including 71 Vitest files / 464 tests and all
  repository gates.
- Wrangler migration rehearsal: schema 26 and all migration commands passed.
- Draft PR #9 remained open and mergeable; exact-product-head validation,
  verification, browser smoke, Pages build/deploy, and build-status checks
  passed 6 / 6.
- Current schema-26 repository acceptance passed 71 Vitest files / 464 tests
  plus governance, lint, build, generated-artifact, Apps Script, and
  Cloudflare dry-run gates.
- Current isolated Worker/D1 acceptance passed 31 / 31, including the protected,
  audited, idempotent, fail-closed classification scenario. Full browser
  coverage passed 126 with 306 intentional skips; the focused real Inventory
  workspace classification scenario also passed.

## Owner-approved pending-classification operation

The approved source does not classify any of the 397 items as reusable or
consumable. One private queue therefore contains exactly 397 rows and one
reason code. Each row remains visibly pending and non-lendable until an
authorized user records:

1. `inventoryKind`
2. `isLendable`
3. `lendingAudience`
4. `assetInstanceCountIfReusable`
5. `conditionIfReusable`
6. `maintenanceStateIfReusable`

These values cannot be inferred from item names, quantities, or category
labels. Pending rows may now import to staging only as `UNVERIFIED` /
`NEEDS_CLASSIFICATION`; they cannot enter public or staff lending, reservation,
Ready to Claim, or handoff.

Staging proved this contract end to end. One controlled synthetic item was
classified through the protected Inventory workspace with explicit physical
verification, reusable-asset registration, audited history, and explicit
lending enablement. A separate pending item was denied by the live lending API
with `LENDING_ITEM_UNAVAILABLE` and created no ticket. Lending was then disabled
again; both items and the registered asset were archived, while two append-only
classification history rows and one archive movement were preserved.

## External-state boundary

- A private pre-migration D1 export was captured before the Phase 17 repair.
- Staging migrations 0024–0026, the 397-row import, and one exact replay were
  applied. Final reconciliation reports schema 26, 397 imported / 0 rejected,
  397 active pending classifications, zero unsafe unclassified lending, zero
  opening-ledger differences, zero negative balances, zero scope gaps, zero
  duplicate handoffs/returns, and zero active mock inventory.
- Cache-busted health/readiness/version reports `STAGING`, release `0.7.0`,
  exact runtime `03b408826d993be0c79692e15b86b38fc97dadf6`, schema 26, migration
  `0026_fail_closed_legacy_inventory.sql`, and ready `true`.
- No production database, Worker, R2 object, Google source, merge, tag, release,
  or production smoke was touched.

## Resume action

Phase 17 is accepted. Continue directly to Phase 18 and identify approved
future event data without inventing names, dates, venues, committees, windows,
or deadlines. If the approved sources remain empty, create the bounded owner
review queue required by the master specification and stop only on the exact
missing owner values. Production remains NO-GO.
