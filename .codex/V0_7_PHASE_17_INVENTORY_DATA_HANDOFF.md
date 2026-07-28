# v0.7.0 Phase 17 Inventory Production Data Handoff

Status: **ACTIVE — SAFE CLASSIFICATION LOCAL PASS — STAGING PENDING — PRODUCTION NO-GO**

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
- Focused regression coverage verifies ledger-only openings, duplicate
  quarantine, private classification review, migration guards, and
  reconciliation SQL.

## Isolated D1 proof

- Migrations 0001–0024 applied successfully in a fresh isolated D1 database.
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

- Product/checkpoint commit:
  `009de29d27e2e86168e255b037039020a60a2f08`, pushed with upstream
  parity.
- Focused Vitest: 2 files / 12 tests passed.
- ESLint on the changed importer and regression test: passed.
- `npm run check`: passed, including 71 Vitest files / 462 tests and all
  repository gates.
- Wrangler migration rehearsal: schema 24 and all migration commands passed.
- Draft PR #9 remained open and mergeable; exact-product-head validation,
  verification, browser smoke, Pages build/deploy, and build-status checks
  passed 6 / 6.
- Current schema-25 repository acceptance passed 71 Vitest files / 463 tests
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
Ready to Claim, or handoff. Phase 17 still requires staging proof of this denial,
one controlled classification, audited history, later explicit lending
enablement, fixture reconciliation, exact-head CI, and full import replay.

## External-state boundary

- Staging remains on accepted Phase 16 runtime
  `ac83af82aec2e42ae839d8b4975947ebf0a1526a`, schema 23.
- No staging or production database migration/import occurred.
- No Worker deployment, provider write, production promotion, merge, tag, or
  release occurred.

## Resume action

Review the complete diff, create and push the exact candidate, and recapture
the source snapshot against that SHA. Then perform a private staging backup,
apply migrations 0024
and 0025, import once and replay once, reconcile all Phase 17 invariants,
deploy the exact candidate, run the classification/fail-closed browser
acceptance and exact-head CI, and continue directly to Phase 18 only after the
Phase 17 gate passes.
