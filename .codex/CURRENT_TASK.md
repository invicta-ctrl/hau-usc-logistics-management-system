# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: SECURITY, TESTING, REPOSITORY_MAINTENANCE, DEPLOYMENT
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 16 Shared Release Desk and global owner access
SKILLS: lean-ctx, github, cloudflare-deploy, cloudflare:wrangler
AUTHORITY: `.codex/specs/v0.7.0-production-master.md`; `.codex/specs/v0.7.0-follow-up-amendment.md`; `.codex/specs/v0.7.0-hybrid-evidence-storage-amendment.md`; `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; owner authorization in the active task
RISK: high
DELIVERABLE: accepted Phase 16 hybrid evidence-storage sub-slice and staging evidence without weakening Phase 0–15 boundaries
VERIFICATION: focused tests, complete repository gate, deployed staging browser gate, health/readiness/schema identity, exact branch/upstream parity, and exact-head PR checks
STOP CONDITIONS: unknown work; specification contradiction; invalid fail-closed authorization; unreconciled material discrepancy; privacy exposure; irreversible data-loss risk; unresolved P0/P1; unavoidable owner-only browser action

## Active slice

Phase 16 remains active. The hybrid evidence-storage sub-slice is accepted on
staging at exact runtime
`5f2645d45106bad05ff3bcdab64c1d6bcc322c88`, schema 23 /
`0023_hybrid_evidence_storage.sql`.

Accepted evidence boundary:

- private R2 is the authoritative operational store;
- D1 atomically records protected metadata and the asynchronous backup job;
- Google Drive is a verified private secondary recovery copy and never blocks
  the synchronous operational transaction;
- duplicate delivery is idempotent, temporary failures retry, and exhausted
  failures remain Owner-reviewable;
- protected System Owner status, governed archive, and fail-safe restore are
  server-authorized;
- provider identifiers, raw errors, and credentials remain outside ordinary UI,
  logs, and Git.

Verification:

- `npm run check`: 70 Vitest files / 456 tests and every repository gate passed;
- local Worker/D1: 30 / 30 passed;
- focused deployed hybrid evidence acceptance: 1 / 1 passed;
- governed Owner restore and independent post-restore R2/Drive checksum
  reconciliation passed;
- exact-runtime PR #9 checks: 6 / 6 passed;
- all synthetic evidence records reconciled to `ARCHIVED`.

Durable evidence:
`.codex/V0_7_PHASE_16_HYBRID_EVIDENCE_HANDOFF.md`.

Next action: audit and prove the remaining Shared Release Desk operational path
and protected System Status presentation against Phase 16 and the hybrid
amendment. Do not advance Phase 17.

The primary agent is the only writer, browser operator, credential handler,
provider mutator, migration executor, deployer, merger, tagger, release
manager, and rollback operator.
