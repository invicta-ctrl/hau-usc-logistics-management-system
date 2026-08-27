# FM-R08 / FM-R09 Checkpoint — Consecutive Playground Reset Proofs

STATUS: PASS
CHECKPOINT_DATE: 2026-08-28 Asia/Manila
MODE: PLAYGROUND-ONLY RESET AND RECONCILIATION
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/fi00-fi12-playground-candidate
BRANCH: release/v0.8.3-fi12-playground
RESET_TOOLING_SOURCE_COMMIT: da6de450a98a54a8515f8c4ef2b4df349089d20f
RESET_TOOLING_SOURCE_TREE: 4610e50b4996384c338c28ee3fae9aea191946b2
PRODUCTION_MUTATION: ZERO

## Reset proof one

- Generation advanced from zero to one.
- Eleven sessions present at the frozen boundary were invalidated.
- All enumerated transient authentication, application, rate-limit, and reporting-outbox tables reconciled to zero.
- Schema 32, migration `0032_staff_account_activity_history.sql`, foreign keys, and the two-object D1-to-R2 privacy-filtered evidence linkage passed.
- The pre-reset authenticated browser session reloaded to the signed-out public landing page with zero console errors. No session material was inspected or recorded.

## Reset proof two

- Generation advanced from one to two.
- All enumerated transient tables remained zero.
- Schema, migration, foreign keys, D1-to-R2 linkage, and sealed-to-working R2 brand/evidence parity passed again.
- The accepted post-reset D1/R2 projection was identical to proof one; timestamps, recovery bookmarks, generation values, and the proof-one session input were excluded from equivalence comparison.

## Restored safe counts

| Classification | Count |
| --- | ---: |
| Inventory items / aliases | 399 / 399 |
| Posted ledger rows | 407 |
| Accounts / active accounts / active roles | 63 / 10 / 7 |
| Requests / request lines / reservations | 6 / 8 / 5 |
| Lending tickets / handoffs / returns | 4 / 2 / 2 |
| Release confirmations | 3 |
| Restock requests / receipts | 1 / 2 |
| Receiving records / suppliers / canvass references | 4 / 2 / 2 |
| Evidence metadata / events | 2 / 8 |

## Isolation and evidence

- The exact isolated Playground D1/R2 tuple, rollback availability, email-disabled state, public readiness/version endpoints, and custom-domain Access protection passed after proof two.
- The Production Worker identity and Production binding tuple remained unchanged from the accepted receipt.
- No routine reset read Production, and Production mutation remained zero.
- Private reports retain recovery bookmarks, provider identifiers, object keys, hashes, and detailed command output outside Git. No secret or private evidence body is recorded here.

NEXT_ACTION: Enter FM-R11; run the complete repository-required candidate gate, build and Cloudflare validation, freeze exact deployment identities and rollback, then deploy only the isolated Playground if every gate remains green.
