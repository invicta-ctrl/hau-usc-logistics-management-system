# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: SECURITY, TESTING, REPOSITORY_MAINTENANCE, DEPLOYMENT
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 16 Shared Release Desk and global owner access
SKILLS: github, cloudflare-deploy, control-chrome
AUTHORITY: `.codex/specs/v0.7.0-production-master.md`; `.codex/specs/v0.7.0-follow-up-amendment.md`; `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; owner authorization in the active task
RISK: high
DELIVERABLE: accepted Phase 16 implementation and staging evidence without weakening Phase 0–15 boundaries
VERIFICATION: focused tests, complete repository gate, deployed staging browser gate, health/readiness/schema identity, exact branch/upstream parity, and exact-head PR checks
STOP CONDITIONS: unknown work; specification contradiction; invalid fail-closed authorization; unreconciled material discrepancy; privacy exposure; irreversible data-loss risk; unresolved P0/P1; unavoidable owner-only browser action

## Active slice

Phase 16 — complete the Shared Release Desk and global System Owner access
defined by the accepted v0.7.0 production master specification.

Phase 15 is accepted on staging at exact candidate
`07b5dd006656e370cc2bf7df4ced785be61a2604`, schema 21 / migration
`0021_owner_protected_identity_roster.sql`.

Accepted Phase 15 evidence:

- approved read-only private source and data-minimized source adapter;
- 37 active protected directory entries, 90 quarantined source rows, one
  current fingerprint, and zero inconsistent sync runs;
- successful stale/superseded rejection, apply, replay, no-op rejection,
  rollback, re-apply, and D1 reconciliation;
- repaired atomicity defect with a focused Miniflare regression;
- 65 Vitest files / 437 tests and the complete repository gate;
- exact-candidate deployed staging acceptance passed 6 / 6 Chromium scenarios;
- exact-head PR checks passed 6 / 6.

Durable Phase 15 evidence:
`.codex/V0_7_PHASE_15_IDENTITY_ROSTER_IMPLEMENTATION_HANDOFF.md`.

Next action: read only the Phase 16 specification section and directly relevant
Release Desk routes, capability projections, source, and focused tests; then
implement the smallest coherent Phase 16 vertical slice.

The primary agent is the only writer, browser operator, credential handler,
provider mutator, migration executor, deployer, merger, tagger, release
manager, and rollback operator.
