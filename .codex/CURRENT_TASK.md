# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: DATA_MIGRATION, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 17 inventory production data readiness
SKILLS: lean-ctx, github, cloudflare:wrangler, chrome
AUTHORITY: `.codex/specs/v0.7.0-production-master.md`; `.codex/specs/v0.7.0-follow-up-amendment.md`; `.codex/specs/v0.7.0-hybrid-evidence-storage-amendment.md`; `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; owner-approved source values in the active task
RISK: high
DELIVERABLE: accepted, reconciled production inventory catalog on staging with ledger-only opening balances and no unresolved required classification
VERIFICATION: immutable source snapshot/hash, mapping validation, invalid-row quarantine, idempotent local and staging import, zero-difference reconciliation, repository gate, deployed browser acceptance, exact-head CI
STOP CONDITIONS: unknown work; specification contradiction; unresolved required owner data; unreconciled material discrepancy; privacy exposure; irreversible data-loss risk; unresolved P0/P1; unavoidable owner-only browser action

## Active slice

Phase 17 is active and is not accepted.

Completed locally:

- identified and read the authoritative owner-approved inventory source;
- captured an immutable private snapshot outside Git;
- validated 397 unique source item IDs, 394 `ACTIVE`, 3 `VERIFY`, two
  zero-quantity rows, zero missing units, and zero negative openings;
- repaired the import contract so catalog opening metadata is always zero and
  approved opening stock is posted as idempotent `OPENING_BALANCE` ledger
  movements;
- added migration 0024 to move any legacy opening metadata into the immutable
  ledger and prevent future direct nonzero opening writes;
- added duplicate quarantine, one bounded private owner-review queue, and
  reconciliation for opening counts/quantity, classification, unsafe lending,
  mock inventory, and negative stock;
- proved the 397-row import and exact replay in isolated D1 with zero rejected
  rows, zero opening-ledger difference, zero negative stock, and zero active
  mock inventory.

Blocking owner-data gap:

- all 397 source rows still carry `TO_CLASSIFY` handling;
- each needs `inventoryKind`, `isLendable`, `lendingAudience`,
  `assetInstanceCountIfReusable`, `conditionIfReusable`, and
  `maintenanceStateIfReusable`;
- those values were never supplied, so they are retained in one private review
  queue and were not invented.

Staging and production were not migrated, imported, deployed, written,
promoted, merged, tagged, or released in this checkpoint.

Durable evidence: `.codex/V0_7_PHASE_17_INVENTORY_DATA_HANDOFF.md`.

Next action: obtain the six missing classification values per item through the
bounded owner review queue or an approved authoritative source, recapture a
candidate-bound snapshot, then continue Phase 17 migration/import/reconciliation
on staging.

The primary agent is the only writer, browser operator, credential handler,
provider mutator, migration executor, deployer, merger, tagger, release
manager, and rollback operator.
