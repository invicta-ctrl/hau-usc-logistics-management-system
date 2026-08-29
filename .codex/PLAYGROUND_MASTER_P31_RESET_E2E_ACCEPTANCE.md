# P31 Reset End-to-End Acceptance

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LIVE_PLAYGROUND_TWO_INDEPENDENT_CYCLES
ROUTE: SOLO

## Accepted runtime and baseline

| Identity | Verified value |
| --- | --- |
| Deployed source | `ab356898651317b1441ece72dcc95a9139b9fa21` |
| Deployed tree | `23caaf499f961dbe450f99946d78324d49172c22` |
| Staging entry artifact SHA-256 | `3bfa8b83a9bc06d1066cffa9f5467aa34f44e812ec83b3ecf5bba7349d934e0b` |
| Environment | isolated Playground / `STAGING` |
| Schema/latest migration | `32` / `0032_staff_account_activity_history.sql` |
| Baseline | `PGBL-20260828-COVERAGE-V2` / version `2` |

## Cycle acceptance

Both independent cycles used real Playground Worker, D1, and R2 state. Each began from a newly mutated workspace, exercised the complete supported live workflow matrix, changed profile/contact/theme/avatar state, proved D1 and governed R2 divergence, invoked the guarded reset path, and then proved restoration, old-session invalidation, new System Owner entry, and critical-route health.

| Evidence | Cycle 1 | Cycle 2 |
| --- | --- | --- |
| Starting reset generation | `6` DIRTY | `7` DIRTY |
| Supported workflow mutation | PASS | PASS |
| Profile/contact/theme/avatar mutation | PASS | PASS |
| D1 and governed R2 mutation | PASS | PASS |
| Guarded reset result | generation `7` PASS | generation `8` PASS |
| Baseline/domain/inventory/profile/theme restoration | PASS | PASS |
| D1-to-R2 linkage | PASS | PASS |
| Old session rejected | PASS | PASS |
| New System Owner entry and core routes | PASS | PASS |
| Sessions/transient rows/FK after reset | `0` / `0` / `0` | `0` / `0` / `0` |

The workflow mutation set covered request, review, reserve, release, receive, restock, lending handoff and return, procurement, events, administration, and R2-backed evidence. No fixture-backed substitute was accepted as live proof.

## Fail-closed recovery evidence

The original sealed schema-30 SQL could not directly restore the schema-32 runtime. A private reconstruction applied migrations `0031` and `0032`, generated the coverage-v2 baseline, and passed schema, migration, integrity, foreign-key, baseline-ID, and baseline-version checks. A direct provider replacement import was rejected before partial mutation, so the accepted route used a verified clean time-travel timestamp.

The first cycle then exposed two missing baseline evidence objects. The repair path accepted only fixed privacy-safe `playground-redacted/` object references, wrote constant redacted placeholders to the isolated baseline bucket, copied them to working state, and reverified count, key digest, and all-present linkage without printing object keys. Cycle 2 passed without repair.

After the two accepted cycles, an optional housekeeping attempt resolved to an older DIRTY point and failed closed before R2 mutation because five workflow evidence references were not baseline-safe keys. The operator preserved that evidence, restored the already verified clean timestamp, reran the same guarded reconciliation, and reverified generation `8` CLEAN. This housekeeping recovery is not counted as a third acceptance cycle.

## Final live state

- Working state: `CLEAN`; active test session false.
- Reset generation: `8`.
- Sessions: `0`.
- Transient rows: `0`.
- Evidence references: `2`, both privacy-safe and present in governed working R2.
- Foreign-key violations: `0`.
- Current reset receipt timestamp resolves to a recovery point.
- Production mutation: NONE.
- Main mutation: NONE.
- Google, email, scheduled-job, and Figma mutation: NONE.

## Private evidence

Cycle reports, pre-reset exports, session canaries, screenshots, rebuilt baseline artifacts, reset receipts, and R2 inspection reports remain outside Git. Repository evidence contains no provider identifiers, object keys, bookmarks, session material, private hashes, or data rows.

## P32 handoff

P31 is complete. Reconcile the permanent `Playground` branch against this accepted lineage, prove that any existing `Playground` ref contains no unpreserved unique work, update it only after preservation evidence is complete, and verify remote parity. Keep `main` unchanged and preserve the temporary reconciliation branch until permanent-branch parity is proven.
