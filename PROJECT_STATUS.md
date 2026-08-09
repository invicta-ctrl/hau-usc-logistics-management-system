# Project Status

## Current state

- **Milestone:** V0.8.0 Inventory Truth and Ledger Lock, Slice 3 of 3 stopped at NO-GO.
- **Branch/HEAD:** `release/v0.8.0-inventory-truth-ledger-lock` at `GIT_HEAD`, preserved at `GIT_UPSTREAM` from canonical-main baseline `88bfdf026e716ffdc779cb2ce7534978f36df0f3`.
- **Writer:** none; the final-slice lock was released without freezing a candidate.
- **Authority:** `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-3.md` is the accepted bounded specification. `docs/INVENTORY_TRUTH_BASELINE.md`, `docs/INVENTORY_V080_FINAL_FINDING_REGISTER.md`, and `docs/INVENTORY_V080_RECONCILIATION.md` record the frozen contract and reconciliation boundary.
- **Migration decision:** `MIGRATION_DECISION: NONE_REQUIRED`; no migration was created or applied.
- **Runtime:** Repository candidate identity is v0.8.0 at the checked-out candidate. Production remains unchanged v0.7.2 at `84eacfcdb47a3985fed48e3ba14bb413946d4410`, schema 30/0030. Isolated staging remains unchanged until the recovery and deployment gates pass.
- **Next action:** Earl must provide the exact private v0.8.0 staging configuration and
  authorization paths, approve a sequencing/commit-budget amendment, and decide the
  bounded disposition of the repeatable Inventory classification browser-test failure.

## Slice 3 stopped result

All four Slice 1 gaps have final status `CLOSED_BY_REPAIR`. Deterministic local
reconciliation independently verifies balance, reservation, Release, Lending,
receiving, transfer, cycle-count, idempotency, audit/history, integrity, and foreign
keys. The server/domain contract and v0.8.1-v0.8.4 consumer boundaries are frozen.

D1 remains the one structured operational authority. No migration or immutable-history
rewrite occurred. Production and staging remain untouched. Slice 3 work is preserved
uncommitted because the exact private staging target package is unavailable and the
repository requires committed/pushed/CI candidate evidence before remote access while
the accepted prompt orders staging acceptance before push/PR/CI.

## Verification to date

- Gate 0 Git provenance, Slice 2 continuity, governance, and handoff verification passed.
- Exact-source focused Inventory command/reconciliation Vitest: 4 files / 29 tests passed.
- Canonical two-generation local sandbox: integrity `ok`, zero foreign-key violations,
  reconciliation 20/20 with zero blocking/quarantine discrepancies.
- Canonical `npm run check`: 124 Vitest files / 860 tests, deterministic build and
  Apps Script/dist parity, Cloudflare types, staging build, and Wrangler dry-run passed.
- Affected Inventory/Lending browser matrix: 17 passed / 37 intentionally skipped.
  Exact-source local Worker/browser ran 57/58; a one-worker focused retry failed later
  in the same Inventory classification interaction, so the required gate is not green.
- Fresh high-risk logical review is green with zero unresolved P0/P1. Private recovery,
  isolated staging, protected PR, and exact-head CI were not performed.

## Resume

Read `AGENTS.md` -> `.codex/CURRENT.md` -> `.codex/CURRENT_TASK.md` ->
`.codex/CURRENT_HANDOFF.md`, then the accepted Slice 3 specification and named
Inventory final registers. Do not claim the writer lock or run remote staging commands
until Earl's amendment and exact private paths are present in the continuity chain.
