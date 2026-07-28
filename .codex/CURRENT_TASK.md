# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: DATA_MIGRATION, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 17 inventory production data readiness
SKILLS: lean-ctx, github, cloudflare:wrangler, chrome
AUTHORITY: `.codex/specs/v0.7.0-production-master.md`; `.codex/specs/v0.7.0-follow-up-amendment.md`; `.codex/specs/v0.7.0-hybrid-evidence-storage-amendment.md`; `.codex/specs/v0.7.0-phase-17-safe-classification-amendment.md`; `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; owner-approved source values in the active task
RISK: high
DELIVERABLE: accepted, reconciled production inventory catalog on staging with ledger-only opening balances, visibly tracked pending classifications, and fail-closed lending
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

Owner decision applied:

- all 397 source rows may import in the conservative `UNVERIFIED` /
  `NEEDS_CLASSIFICATION` state;
- every pending row remains non-lendable and excluded from reservation,
  Ready to Claim, and handoff;
- authorized users complete classification and physical review through the
  protected website queue; no external spreadsheet classification is required.

Current local implementation:

- accepted focused Phase 17 safe-classification amendment;
- additive migration 0025 with fail-closed triggers and append-only
  classification history;
- protected search/filter/progress/pagination queue, individual review, and
  explicitly confirmed non-lendable-only bulk review;
- audited optimistic-concurrency classification, physical condition and
  maintenance review, explicit lending enablement, and explicitly tagged asset
  creation without deriving instances from opening quantity;
- server revalidation at lending submission, approval, and handoff;
- repository acceptance passed with 71 Vitest files / 463 tests and every
  governance, lint, build, generated-artifact, Apps Script, and Cloudflare
  dry-run gate;
- isolated Worker/D1 acceptance passed 31 / 31 on schema 25, including the
  protected, audited, idempotent, fail-closed classification workflow;
- full browser coverage passed 126 with 306 intentional skips; focused
  Inventory queue/API/browser evidence remains green.

Staging and production were not migrated, imported, deployed, written,
promoted, merged, tagged, or released in this checkpoint.

Durable evidence: `.codex/V0_7_PHASE_17_INVENTORY_DATA_HANDOFF.md`.

Next action: review the complete diff, create and push the verified candidate,
recapture the candidate-bound private source snapshot, then back
up/migrate/import/replay/deploy and accept Phase 17 on staging.

The primary agent is the only writer, browser operator, credential handler,
provider mutator, migration executor, deployer, merger, tagger, release
manager, and rollback operator.
