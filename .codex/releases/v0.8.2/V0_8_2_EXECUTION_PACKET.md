# v0.8.2 Data Foundation Execution Packet

STATUS: COMPLETE_A5_OWNER_AUTHORIZED
BASE_BRANCH: main
BASE_SHA: f3addc1e55711641f5977a80c84e844c88f68dff
BASE_TREE: 03679fe5b8c1e4b1d8280b4797a683f0fdff67ee
BRANCH: release/v0.8.2-data-foundation
ACCEPTED_SPEC: .codex/specs/active/v0.8.2-data-foundation-a5-accepted.md

## Entry gates

- v0.8.1 S17 is complete and Production remains v0.8.1 on the recorded
  candidate, schema 30, and migration 0030.
- The companion's post-S17 freshness check passed for the Worker bindings/cron,
  schema/migration, and DATA-A/B/C seams.
- The completed S12 scoped-revision runtime/test change is a v0.8.4 rebaseline
  item, not part of this DATA-A/B/C scope.

## Stage plan

1. S00 — owner-authorized data/privacy boundary: PASS.
2. S01 — companion freshness baseline: PASS.
3. S02 — branch and Terra writer lock: IN_PROGRESS.
4. S03 — DATA-A/B/C focused implementation or verified no-op: NEXT.
5. S04 — focused tests, privacy proof, and read-only reconciliation evidence.
6. S05 — governed integration handoff; no deployment or external mutation.

## S17 durable closure

- S02-S05 bounded DATA-A/B/C work, verification, and integration: PASS.
- S06 serial release gate: PASS.
- S07-S08 isolated Playground dispatch and acceptance: PASS.
- S09-S10 preflight and fresh recovery evidence: PASS.
- S11-S12 protected main parity and Production deploy: PASS.
- S13-S14 public/authenticated read-only smoke and reconciliation: PASS.
- S15-S16 lease-protected pointer rotation and temporary release-branch cleanup: PASS.
- S17 durable closure: PASS. Any V83 work requires its own current intake; frontend adoption remains outside this release path.

## Exact allowed paths

- `src/services/legacy-runtime-adapter.js`
- `src/server/d1/operational-service.js`
- `scripts/d1/reconcile-inventory-truth.mjs`
- `src/server/evidence/`
- `src/worker/index.js`
- directly corresponding focused tests and the current-chain records.

## Prohibited actions

No source import/writeback, migration, provider/Production action, secret
operation, deployment, email, Sheets write, Drive write, D1/R2 mutation, or
automatic repair. Keep protected source and provider material outside Git and
logs.

## Completion condition

Only a focused, privacy-preserving DATA-A/B/C candidate or an evidence-backed
verified no-op may advance to S04. Any broader change requires a new accepted
amendment.
