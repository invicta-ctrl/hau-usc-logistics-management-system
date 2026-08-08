# Project Status

## Current state

- **Milestone:** V0.8.0 Inventory Truth and Ledger Lock, Slice 1 complete.
- **Branch/HEAD:** `release/v0.8.0-inventory-truth-ledger-lock` at `GIT_HEAD`, preserved at `GIT_UPSTREAM` from canonical-main baseline `88bfdf026e716ffdc779cb2ce7534978f36df0f3`.
- **Writer:** NONE; the Slice 1 writer lock is released.
- **Authority:** `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-1.md` is the completed accepted specification. `docs/INVENTORY_TRUTH_BASELINE.md` is the durable schema-30 Inventory map and invariant matrix.
- **Migration decision:** `MIGRATION_DECISION: NONE_REQUIRED`; no migration was created or applied.
- **Runtime:** Production remains unchanged v0.7.2 at `84eacfcdb47a3985fed48e3ba14bb413946d4410`, schema 30/0030. Isolated staging remains unchanged v0.7.2 at `c4fa46f267733eeceb5d82a825431c6337f8e4e0`, schema 30/0030.
- **Next action:** Await Earl's bounded Slice 2 prompt/approval. Do not implement Slice 2 automatically.

## Slice 1 result

Schema 30's posted signed ledger is the one physical on-hand truth. Active
unconsumed reservations reduce available-to-promise but do not change on-hand.
Request submission records demand without posting inventory. Receiving, release,
lending handoff/return, opening balance, correction, and cycle-count commands use
explicit ledger/history effects within authorized D1 batches.

INV-01 through INV-10 are mapped to implementation boundaries and focused evidence.
The Slice 1 additions strengthen the Worker/D1 lifecycle proof for request
non-deduction, reservation-only availability effects, and exactly-once lending
handoff/return effects. No runtime file or migration changed.

Four non-critical gaps are reserved for Slice 2:

- `V080-S1-INV-01` P2: the production client claims an event-item transfer method that the Worker/D1 capability and mutation maps do not implement.
- `V080-S1-INV-02` P2: active reservations have no standalone governed cancellation/release command.
- `V080-S1-INV-03` P2: cycle-count adjustment has no stale-balance concurrency guard for distinct accepted commands.
- `V080-S1-INV-04` P3: no-server presentation reducers infer signs incorrectly for positive reversals/adjustments; authoritative D1-supplied production balances are unaffected.

## Verification

- Pre-edit `npm run handoff:verify` and `npm run check:governance`: passed.
- Focused Vitest: 12 files, 92 tests passed.
- Focused Worker/D1: 7 tests passed.
- RV-01 reservation top-up/concurrency: 2 tests passed.
- Strengthened D1 Request/reservation/release/lending lifecycle: 1 test passed.
- Final changed-file lint/format, governance/handoff, diff, and secret/PII checks are recorded in the current handoff and final Slice 1 report.

## Resume

Read `AGENTS.md` -> `.codex/CURRENT.md` -> `.codex/CURRENT_TASK.md` ->
`.codex/CURRENT_HANDOFF.md`, then the completed Slice 1 specification and
`docs/INVENTORY_TRUTH_BASELINE.md`. Run `npm run handoff:verify` before accepting
or transferring state.
