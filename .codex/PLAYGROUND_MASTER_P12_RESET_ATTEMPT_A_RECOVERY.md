# P12 Reset Attempt A — Preflight Recovery

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PREFLIGHT_STOP_RECONCILED;LIVE_RESET_NOT_STARTED

## Attempt disposition

P12 reset attempt A stopped during `TARGET_PREFLIGHT` because the installed Wrangler `r2 bucket list` command does not support `--json`. The fail-closed script created a private error report and released its private reset lock. It did not capture a pre-reset export or bookmark because the target preflight had not completed, and it did not begin D1 restore or R2 reconciliation.

Read-only reconciliation proves the original live state is unchanged apart from the deliberately staged canary session:

```text
schema/migration: 32 / 0032_staff_account_activity_history.sql
baseline: PGBL-20260828-COVERAGE-V2 version 2
reset generation: 4
working state: DIRTY; active test session true
sessions: 11
transient total: 20
foreign-key violations: 0
reversible bookmark: available
sealed clean bookmark: available
reset lock: absent
pre-reset export from attempt A: absent
Production mutation: NONE
Google mutation: NONE
```

The staged canary remains valid and must be used for the corrected cycle rather than recreated.

## Deterministic repair

The R2 identity preflight now uses the supported human-readable `wrangler r2 bucket list` output captured privately by the operator process and checks that all four exact manifest-bound Playground bucket names are present. It does not print that inventory. A regression assertion forbids reintroducing the unsupported `--json` form.

Focused verification passes: syntax, 3 Vitest files / 24 tests, targeted ESLint, Prettier, and `git diff --check`.

## Retry boundary

Commit and push this recovery checkpoint, confirm clean HEAD/upstream parity, reconfirm generation 4 / 11 sessions / 20 transient rows / FK zero and the absence of the reset lock, then run corrected cycle 1 once with a new private report/export basename. Do not overwrite or delete attempt A evidence. Any further ambiguous outcome requires another read-only reconciliation before action.
