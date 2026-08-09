# Project Status

## Current state

- **Milestone:** V0.8.0 Inventory Truth and Ledger Lock, Slice 2 complete.
- **Branch/HEAD:** `release/v0.8.0-inventory-truth-ledger-lock` at `GIT_HEAD`, preserved at `GIT_UPSTREAM` from canonical-main baseline `88bfdf026e716ffdc779cb2ce7534978f36df0f3`.
- **Writer:** NONE; the Slice 2 writer lock is released.
- **Authority:** `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-2.md` is the accepted bounded specification. `docs/INVENTORY_TRUTH_BASELINE.md` and `docs/INVENTORY_SLICE_2_REPAIR_REGISTER.md` record post-repair truth.
- **Migration decision:** `MIGRATION_DECISION: NONE_REQUIRED`; no migration was created or applied.
- **Runtime:** Production remains unchanged v0.7.2 at `84eacfcdb47a3985fed48e3ba14bb413946d4410`, schema 30/0030. Isolated staging remains unchanged v0.7.2 at `c4fa46f267733eeceb5d82a825431c6337f8e4e0`, schema 30/0030.
- **Next action:** Await Earl's bounded Slice 3 prompt/approval. Do not implement Slice 3 automatically.

## Slice 2 result

All four Slice 1 gaps reproduced and were repaired under the current schema-30
contract. Event-item transfers now post an authorized atomic ledger pair with one
logical mapping and retry/concurrency protection. Accepted Request and ready Lending
cancellations atomically release reservations; reserved reusable assets are restored
before handoff. Cycle counts reject a stale same-snapshot command, and local fallback
reducers consume explicit signed quantity.

D1 remains the one structured operational authority. No migration, historical-data
reconciliation, immutable-history rewrite, deployment, provider/Google write, or
production/staging mutation occurred. The post-repair INV-01 through INV-10 matrix is
PASS or PASS_WITH_EXISTING_EVIDENCE only.

## Verification

- Pre-edit and post-repair `npm run handoff:verify` and `npm run check:governance`: passed.
- Slice 2 focused Vitest: 2 files, 9 tests passed; adjacent unit/contract: 6 files, 76 tests passed.
- Focused local Worker/D1 Request/release/lending and cumulative receiving: 2 tests passed.
- Full `npm run check`: governance, lint, build, 122 Vitest files / 843 tests,
  Apps Script parity, dist verification, Cloudflare types, staging-mode build, and
  Wrangler dry-run passed.
- `git diff --check`, logical diff review, canonical handoff secret scan, and targeted
  added-line private-key/token/key/email scan pass.

## Resume

Read `AGENTS.md` -> `.codex/CURRENT.md` -> `.codex/CURRENT_TASK.md` ->
`.codex/CURRENT_HANDOFF.md`, then the completed Slice 1 specification and
`docs/INVENTORY_TRUTH_BASELINE.md`. Run `npm run handoff:verify` before accepting
or transferring state.
