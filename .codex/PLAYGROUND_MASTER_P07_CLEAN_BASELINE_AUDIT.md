# P07 Clean Operational Baseline Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS

## Outcome

The fixed isolated Playground now runs clean baseline `PGBL-20260828-COVERAGE-V2`, version 2, at reset generation 4. It is derived from the accepted privacy-filtered v1 baseline with deterministic staging-safe coverage and no new Production read.

```text
SOURCE_CLASSIFICATION = DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ
PRODUCTION_READ = NONE_DURING_P07
PRODUCTION_MUTATION = NONE
SCHEMA_MUTATION = NONE
RESET_GENERATION = 4
WORKING_STATE = CLEAN
ACTIVE_TEST_SESSION = FALSE
TRANSIENT_TOTAL = 0
FOREIGN_KEY_VIOLATIONS = 0
INVENTORY_RECONCILIATION = RECONCILED
```

## Baseline identity and privacy

| Field                            | Verified value                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Baseline ID / version            | `PGBL-20260828-COVERAGE-V2` / `2`                                                           |
| Source baseline                  | `PGBL-20260827-59beb9c28963`                                                                |
| Coverage overlay                 | `PLAYGROUND_BASELINE_COVERAGE_V2`                                                           |
| Privacy transform                | `baseline-data.mjs-sha256:4E14316BE67A8937D7FD6FD8A8CB2E6149BA24D7AABCA5CC9227B849B3202D6C` |
| Sanitized v1 export SHA-256      | `59BEB9C289631B03F41E93FB0146614F7692862655EE708F76F188473DAB2F3E`                          |
| Schema / migration               | `32` / `0032_staff_account_activity_history.sql`                                            |
| Local candidate database SHA-256 | `E40F87B35F0FBC1DF68987C8D6038D4C226BB40728EE4B2EEAEE3045721EBF18`                          |
| Additive overlay SHA-256         | `D69C5B3D32ABBC19A6FEABF617BBA3A2BDC25302F15FAC937F074AD9FBD63006`                          |
| Private live export SHA-256      | `2712B1EC0A42C66FDE118DE06A77C90946456C57709795E1AD118E03D6DA1B15`                          |
| Private v2 manifest SHA-256      | `C730ADA15C071A6246FD49670DF7472D2072784FFD4511AC30FB6521BA299F26`                          |
| Private install report SHA-256   | `1C7AD9CCE071333B9A77CD0FDFFFAAD81572FAB2DDCF66BF785D5E61092742F2`                          |

The accepted exclusions remain Production credentials, sessions/tokens, protected identity provenance/fingerprints, staff activity audit context, personal/contact fields, private evidence objects/metadata, transient state, and other provider-origin private envelopes. Synthetic staging accounts and the v2 coverage rows are explicitly classified.

## Reset and recovery evidence

Reset attempt A failed without a success report. D1 and R2 were reconciled before any retry. The installed Wrangler implementation proved that `d1 time-travel restore` requires `--json` for the non-interactive API path. Reset and installer rollback were repaired and regression-gated.

Corrected attempt B passed:

- generation advanced 3 -> 4;
- one prior session was invalidated;
- all tracked transient tables are zero;
- D1-to-R2 evidence linkage passed;
- the temporary reset Worker was removed;
- the reset is now a no-repeat action.

The v2 install then passed in one attempt. It captured a pre-apply recovery bookmark, applied the additive overlay without schema mutation, exported and reconciled live D1, and captured a distinct v2 clean bookmark. No rollback was required.

## Live operational coverage

| Coverage gate                 | Live count |
| ----------------------------- | ---------: |
| Lendable inventory            |          2 |
| Active reservations           |          1 |
| Active lending                |          3 |
| Event operational links       |          2 |
| Canonical people              |          1 |
| Account-person links          |          1 |
| Immutable staff activity rows |          2 |
| Governed reference records    |          1 |
| Governed reference links      |          1 |

The complete local baseline contains 399 inventory items, 8 requests, 8 lending tickets, 3 release confirmations, 3 restock requests, 2 suppliers, 2 event series/8 event activities, 63 accounts, 7 roles, 38 capabilities, and 122 role-capability links. Inventory reconciliation executed 20 checks: 20 accepted, 0 discrepant, 0 quarantined, disposition `RECONCILED`.

## R2, roles, and frontend identity

- Brand baseline/working: 7 objects, 6,667,873 bytes, exact SHA-256 parity `EE4A5E7E52C21F129A3B7985F00CF5D335970F66F68705FF756BA23AD7F98C81`.
- Evidence: baseline control 2, working application 2, Production private objects copied 0, accepted exceptions preserved.
- System Owner includes required event, administration, system, reference, and brand capabilities; the complete seven-role capability matrix remains in the private aggregate audit.
- The frontend application source used for the baseline audit remains P06 commit `2B39CE9B5593A771F5473D882EF2A8D85453A725`, tree `D52CB387A005C608DED68C67E4EB715DD4DE93BB`. P07 repository changes are private-path-gated baseline/reset tooling, tests, and checkpoints only.

## Verification

- baseline aggregate audit: PASS;
- local v2 database integrity and foreign keys: PASS;
- regenerated overlay on fresh v1: PASS;
- full Playground suite after restore repair: 11 files / 44 tests passed;
- generation-4 reset report and independent live state: agreement;
- live v2 postflight: PASS;
- live exported inventory reconciliation: `RECONCILED`;
- fixed D1 identity and reversible bookmark availability: PASS;
- no provider identity, bookmark, private path, credential, object key, or row identity committed.

P07 is complete. P08 may use the clean backend baseline to reproduce and repair the owner-observed Overview, Request, Lending, Release, Restocking, and Procurement route defects.
