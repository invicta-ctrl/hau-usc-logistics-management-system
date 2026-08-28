# P07 Clean Baseline v2 Pre-Apply Checkpoint

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: LOCAL_CANDIDATE_VERIFIED;LIVE_RESET_AND_INSTALL_NOT_STARTED
ROUTE: SOLO

## Authority and mutation boundary

P07 is authorized to reset and repopulate the fixed isolated Playground D1/R2 resources. Production remains read-only and may be consulted only when the accepted privacy-filtered baseline is stale or incomplete. This checkpoint used the already privacy-filtered v1 source and performed no new Production read.

At this checkpoint:

- Playground remains at the previously recorded generation 3 `DIRTY` state with one active session/transient record;
- no P07 D1, R2, Worker, deployment, provider, Production, main, Google, or Figma mutation has occurred;
- the current repository source is `2b39ce9b5593a771f5473d882ef2a8d85453a725`, tree `d52cb387a005c608ded68c67e4eb715dd4de93bb`;
- all baseline inputs, generated databases, SQL, manifests, bookmarks, and detailed reports remain private outside Git.

## Source-baseline decision

The preserved v1 baseline passed schema 32, migration `0032_staff_account_activity_history.sql`, integrity, foreign-key, inventory reconciliation, and R2 parity checks. It remains immutable evidence under baseline ID `PGBL-20260827-59beb9c28963`.

It was not accepted as the P07 operational baseline because it lacked lendable inventory, active workflow variety, event-to-operation links, canonical person/account/staff activity links, and governed reference records/links. A new Production read was unnecessary: these gaps could be filled deterministically from staging-safe synthetic coverage without changing the privacy-filtered source rows.

## Accepted local v2 candidate

| Field                                      | Verified value                                                     |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Baseline ID                                | `PGBL-20260828-COVERAGE-V2`                                        |
| Baseline version                           | `2`                                                                |
| Source baseline ID                         | `PGBL-20260827-59beb9c28963`                                       |
| Source classification                      | `DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ`    |
| Coverage overlay                           | `PLAYGROUND_BASELINE_COVERAGE_V2`                                  |
| Captured at                                | `2026-08-28T10:00:00.000Z`                                         |
| Schema / migration                         | `32` / `0032_staff_account_activity_history.sql`                   |
| Candidate database SHA-256                 | `E40F87B35F0FBC1DF68987C8D6038D4C226BB40728EE4B2EEAEE3045721EBF18` |
| Candidate SQL SHA-256                      | `99E191F580D0DBF1AC55D3ACD9CF303FF2C58FFD0713A4374A62D04B6AFF0E87` |
| Additive live overlay SHA-256              | `D69C5B3D32ABBC19A6FEABF617BBA3A2BDC25302F15FAC937F074AD9FBD63006` |
| Fresh v1 + overlay verification DB SHA-256 | `2B80C433D30F983130D06A3BDAF201E0A293DF28CA23E5A251CC5937904C4A40` |

The privacy transform remains the accepted v1 `baseline-data.mjs` transform, SHA-256 `4E14316BE67A8937D7FD6FD8A8CB2E6149BA24D7AABCA5CC9227B849B3202D6C`; v2 adds only deterministic staging-safe coverage. The detailed transform report remains private.

## Domain and workflow coverage

| Domain                 | Aggregate coverage                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory              | 399 items, 399 aliases, 410 posted ledger entries; 396 in stock, 1 low stock, 2 out of stock; 2 lendable and 2 consumable items across 2 categories                               |
| Requests               | 8 requests, 11 lines, 6 reservations; accepted, for-review, partial, archived, completed, procured, ready-release, and to-procure states represented; 1 active reservation        |
| Lending                | 8 tickets, 4 handoffs, 2 returns; for-review, ready-to-claim, on-loan/overdue, completed consumable, returned, and cancelled states represented                                   |
| Release                | 3 release records                                                                                                                                                                 |
| Restocking / receiving | 3 restock requests, 3 receipts, 5 receiving records; open, partial, and received states represented                                                                               |
| Procurement            | 2 suppliers and 2 canvass records                                                                                                                                                 |
| Events                 | 2 series, 3 days, 8 activities, and 2 operational links                                                                                                                           |
| Administration         | 63 accounts, 10 active accounts, 7 roles, 38 capabilities, 122 role-capability links, 1 canonical person, 1 account link, 1 staff assignment, and 2 immutable staff activity rows |
| Governed references    | 1 reference record and 1 reference link                                                                                                                                           |
| Evidence / brand       | 2 evidence records and 6 brand slots                                                                                                                                              |

The System Owner role contains the required event, administration, system, reference, and brand capabilities. The private report retains the complete role-capability matrix.

## Inventory and R2 reconciliation

- Local v2 inventory reconciliation: 20/20 checks accepted, 0 discrepancies, 0 quarantine rows, disposition `RECONCILED`.
- R2 brand baseline and working namespaces remain at 7 objects and 6,667,873 bytes each with aggregate SHA-256 `EE4A5E7E52C21F129A3B7985F00CF5D335970F66F68705FF756BA23AD7F98C81`; parity passed.
- Evidence baseline control and working application sets each contain 2 objects; no private Production evidence object is copied into Playground.
- The additive overlay contains no `DROP`, `DELETE`, `ALTER`, or `CREATE TABLE` statement and does not write `playground.working_state`.

## Deterministic tooling and verification

Added private-path-gated tooling for:

- aggregate-only baseline audit;
- deterministic v2 candidate creation from an existing sanitized baseline;
- additive-only overlay export;
- fresh-v1 local overlay verification;
- fixed-identity live install with preflight, pre-apply bookmark, postflight coverage, exported reconciliation, distinct clean bookmark, and verified rollback.

Verification completed before this checkpoint:

- targeted Prettier: PASS;
- targeted ESLint: PASS;
- baseline tests: 2 files / 15 tests passed;
- fresh v1 + regenerated v3 overlay: integrity `ok`, 0 foreign-key violations, inventory `RECONCILED`;
- required live-coverage counts after local overlay: lendable 2, active reservations 1, active lending 3, event links 2, canonical people 1, account links 1, staff activity 2, reference records 1, reference links 1.

Failed v2-a, v2-b, and the first v2-c overlay-verification artifacts remain preserved privately as failure evidence. They must not be reused as current inputs.

## Next exact action after checkpoint push

1. Reconfirm clean Git/upstream parity and fixed Playground resource identity.
2. Run the accepted reset exactly once from the preserved v1 manifest, producing a new private reset report and generation 4 clean state; if the command is ambiguous, reconcile live state instead of repeating it.
3. Apply the v3 additive overlay with the v2 installer. Require the pre-apply recovery bookmark, exact schema/migration/generation/clean preflight, coverage postflight, private live export, inventory reconciliation, and a distinct clean v2 bookmark.
4. Write a new private v2 manifest and install report; never overwrite the v1 manifest.
5. Verify D1/R2 isolation and Production mutation zero, then close P07 and advance to P08.

STOP: Any identity mismatch, unknown live state, missing bookmark, reset ambiguity, failed privacy/integrity/reconciliation check, unverified rollback, or Production crossover stops the live operation.
