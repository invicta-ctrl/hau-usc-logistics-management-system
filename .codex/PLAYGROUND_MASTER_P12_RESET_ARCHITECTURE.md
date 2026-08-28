# P12 Guarded Reset Architecture — Live Acceptance

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LIVE_TWO_CONSECUTIVE_CYCLES
ROUTE: SOLO

## Outcome

The fixed isolated Playground completed two consecutive guarded reset cycles and now rests at clean baseline `PGBL-20260828-COVERAGE-V2` version 2, reset generation 6.

```text
schema/migration: 32 / 0032_staff_account_activity_history.sql
working state: CLEAN; active test session false
sessions: 0
transient total: 0
foreign-key violations: 0
reversible bookmark: available
sealed clean bookmark: available
reset lock: released
Production mutation: NONE
Google mutation: NONE
```

## Architecture delivered

The reset operator validates the exact isolated Worker/D1/R2 tuple against provider inventory and live STAGING/Playground health before mutation, holds an exclusive private lock, captures a reversible Time Travel point, creates a private D1 export, and verifies that export through a local SQLite restore before touching live state.

It restores the sealed D1 baseline non-interactively, keeps the lifecycle in `RESETTING` while R2 is reconciled, removes the temporary fixed-binding reset Worker, advances generation, and marks `CLEAN` only after schema, migration, all ten transient tables, foreign keys, and D1-to-R2 evidence linkage pass. A verified-target failure records a private error report and attempts to mark the workspace `ERROR`; it never reports `CLEAN` on failure.

R2 reset scope is classification-aware. Governed public-brand/demo objects and redacted Playground evidence are reconciled to baseline. Unclassified objects are preserved and counted, not deleted. Both accepted cycles preserved zero unclassified brand objects and seven unclassified evidence objects. Brand namespace parity passes. Full evidence namespace parity remains `DIFFERENT` because sealed controls and preserved unclassified objects are intentionally not treated as working governed evidence; the governed D1-to-R2 evidence linkage passes.

## Attempt A disposition

Attempt A stopped during target preflight because the installed Wrangler `r2 bucket list` command has no `--json` option. It produced a private error report, released the lock, and performed no D1 export, D1 restore, R2 reset, generation change, Production mutation, or Google mutation. Live reconciliation proved generation 4 / 11 sessions / 20 transient rows unchanged. The unsupported CLI form was replaced with private captured output checked against all four exact manifest-bound bucket names, regression-gated, committed, and pushed before retry.

## Cycle 1

The corrected first cycle preserved and locally restored a private pre-reset D1 export, invalidated eleven sessions, restored the sealed D1/R2 baseline, and advanced generation 4 -> 5. Direct post-reset inspection proved `CLEAN`, zero sessions/transients, zero FK violations, governed evidence linkage pass, and R2 read-only inspection pass.

The pre-reset canary was then rejected with HTTP 401. A new System Owner convenience session entered successfully and loaded the application root, seven core bootstrap modules, Events, Administration, and evidence status. Google Drive remained disabled and evidence R2 available. That deliberate smoke left generation 5 `DIRTY` with one session/transient row, providing the independent input for cycle 2.

## Cycle 2

The second cycle again preserved and locally restored a distinct private pre-reset D1 export, invalidated the smoke session, restored D1/R2, and advanced generation 5 -> 6. The second canary was rejected after reset. Final unauthenticated root, health, readiness, and Playground identity checks passed without admitting another session.

Final independent reconciliation proved generation 6 `CLEAN`, no active test session, zero sessions, zero aggregate transient rows, zero FK violations, both recovery points available, R2 read-only inspection pass, and no remaining reset lock or canary file. Both private pre-reset exports remain preserved.

## Verification

```text
Two consecutive live reset cycles: PASS
Old-session invalidation after each cycle: PASS
New Enter Playground plus core route smoke after cycle 1: PASS
Final root/health/readiness/Playground identity: PASS
Focused P12 Vitest before live reset: PASS - 3 files, 24 tests
Full Vitest after live acceptance: PASS - 164 files, 1216 tests
Cloudflare build: PASS - 1679 modules
Targeted ESLint: PASS
Prettier: PASS
git diff --check: PASS
Production mutation: NONE
Google mutation: NONE
```

## Next exact action

Begin P13 In-app Playground Reset Center. Add a Playground-only Administration -> System status control with current baseline/generation/state/last-reset consequences, System Owner/dedicated capability enforcement, exact confirmation, progress and final receipt, old-session-safe return to entry, and no usable Production control or endpoint.
