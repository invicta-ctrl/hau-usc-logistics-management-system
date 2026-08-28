# P07 Reset Attempt A Recovery Checkpoint

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: FAILED_ATTEMPT_RECONCILED;DETERMINISTIC_FIX_VERIFIED;RETRY_NOT_STARTED

## Attempt result

The first P07 reset command exited with `Playground reset provider command failed (d1)` and did not create a reset success report. The command was not repeated.

Read-only reconciliation established the exact end state:

- fixed Playground D1 identity: PASS;
- D1 schema/migration: `32` / `0032_staff_account_activity_history.sql`;
- D1 reset generation: `3`;
- D1 working state: `DIRTY`, active test session true;
- D1 sessions/transient total: `1` / `1`;
- D1 foreign-key violations: `0`;
- D1 baseline ID/version remain unset, matching the pre-attempt generation-3 state;
- a current reversible D1 bookmark remains available;
- the sealed v1 bookmark is a non-empty string captured `2026-08-27T13:48:58.650Z`;
- R2 brand baseline/working: 7 objects, 6,667,873 bytes, exact hash parity `EE4A5E7E52C21F129A3B7985F00CF5D335970F66F68705FF756BA23AD7F98C81`;
- R2 evidence: accepted isolated exception state, baseline 4 objects and working 2 objects;
- the temporary read-only R2 inspection Worker was removed;
- Production mutation: `NONE`.

The reset attempt may have idempotently reconciled the working R2 namespaces before the later D1 failure. The read-only evidence proves their accepted end state; it does not infer whether bytes were rewritten. D1 conclusively remained at the pre-attempt state.

## Deterministic root cause

The installed Wrangler `d1 time-travel restore` implementation prompts for confirmation unless `--json` is supplied. The reset helper launched Wrangler non-interactively without `--json`, so the restore could not complete through the intended API path. The same defect existed in the v2 installer's emergency rollback command.

Repair:

- reset restore now supplies `--json` and requires parseable JSON success;
- installer rollback now supplies `--json` and requires parseable JSON success before state verification;
- a regression assertion protects both non-interactive restore paths;
- private-path-gated D1 and read-only R2 inspection tools preserve aggregate recovery evidence without printing provider identities, bookmarks, object keys, or private paths.

Focused formatting, ESLint, and 3 test files / 13 tests pass after the repair.

## Retry boundary

Attempt B is permitted only after this recovery checkpoint is committed and pushed, Git/upstream parity is reconfirmed, D1 remains at the reconciled generation-3 state, and a fresh private reset report path is proven absent. Attempt B must use the corrected non-interactive restore path. Any ambiguous outcome must again be reconciled before another action.

No P07 v2 overlay install has been attempted.
