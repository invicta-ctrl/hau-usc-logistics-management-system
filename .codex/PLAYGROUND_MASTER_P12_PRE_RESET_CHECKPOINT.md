# P12 Guarded Reset Architecture — Pre-Reset Checkpoint

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: LOCAL_ARCHITECTURE_VERIFIED;LIVE_RESET_NOT_STARTED
ROUTE: SOLO

## Authority and starting state

P12 is authorized to reset only the fixed private-manifest-bound isolated Playground Worker/D1/R2 tuple. Production, main, Google Drive, Figma, baseline resources, and unclassified R2 objects remain outside the mutation boundary.

The live starting state is the accepted P11 consequence set: schema 32 / migration `0032_staff_account_activity_history.sql`, baseline `PGBL-20260828-COVERAGE-V2` version 2, reset generation 4, working state `DIRTY` with an active test session, ten sessions, nineteen aggregate transient rows, zero foreign-key violations, and both a current reversible bookmark and sealed clean reset bookmark available. No P12 live reset has started at this checkpoint.

## Reset architecture repair

The prior operator reset restored a sealed D1 bookmark and reconciled R2, but it did not yet satisfy the complete P12 contract. The bounded architecture now:

- validates a complete isolated Playground hostname, D1 name/identity, and four distinct Playground-classified R2 names;
- verifies the authenticated provider D1/R2 inventory plus live STAGING/Playground version, health, readiness, schema, and migration before mutation;
- acquires an exclusive private reset lock;
- captures a reversible pre-reset D1 bookmark;
- exports the current D1 to a new private SQL artifact and proves a local SQLite restore, integrity, foreign keys, schema, and migration before reset;
- restores the sealed clean D1 bookmark non-interactively;
- marks the in-progress state `RESETTING` until R2 and D1 verification finish;
- reconciles only governed brand/demo and redacted-evidence objects;
- preserves and counts unclassified working R2 objects instead of deleting them;
- removes the temporary fixed-binding reset Worker and private config;
- advances reset generation and marks `CLEAN` only after schema, migration, transient-zero, foreign-key, and D1-to-R2 evidence-linkage verification;
- records a private aggregate success report, or a private failure report plus `ERROR` marker when a verified target fails after preflight;
- releases the reset lock in all outcomes.

A private canary workflow stages a real Playground session before reset, proves that exact session is rejected after reset, admits a new System Owner Playground session, runs core route/API smoke with Google disabled and evidence R2 available, and carries the new canary into the second reset. The final verification proves that second canary is rejected and leaves no replacement session.

## Deterministic verification

```text
Reset/R2/canary syntax checks: PASS
Focused Vitest: PASS - 3 files, 24 tests
Targeted ESLint: PASS
Prettier: PASS
git diff --check: PASS
Live reset mutation: NOT STARTED
Production mutation: NONE
Google mutation: NONE
```

## Exact live sequence

1. Commit and push this architecture checkpoint; confirm clean HEAD/upstream parity.
2. Stage a private pre-reset canary session against the isolated Playground.
3. Run reset cycle 1 to generation 5 with a new private report/export path.
4. Prove the pre-reset canary is invalid, admit a new session, and run core route smoke.
5. Run reset cycle 2 to generation 6 with a second new private report/export path.
6. Prove the second canary is invalid, verify root/health/readiness/Playground identity, and reconcile final D1/R2 state.
7. Stop on any ambiguous or failed action; inspect the private report, live metadata, provider state, and preserved recovery artifacts before any retry.
