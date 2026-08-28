# P11 Production-Equivalent Operational Workflows

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LIVE
ROUTE: SOLO

## Authority and boundary

P11 exercised only the private-manifest-bound isolated Playground. Production, main, Google Drive, Figma, and unrelated provider resources were not mutated. The live runtime was deployed from product commit `ca28bde`; later branch commits through the P11 checkpoint change only audit/reconciliation tooling and documentation. No credential, provider identifier, bookmark value, or private row identifier is recorded here.

## Operational result

The live Playground completed the accepted production-equivalent workflow matrix against real backend state:

- requests: create, staff review, accept, reject, reserve/route, ready, partial release, full release, and completion;
- inventory: inspect, authorized cycle adjustment, exact replay, ledger consequence, and downstream projection;
- restocking: open, partial receipt, exact replay, final receipt, completion, and ledger consequence;
- lending: submit, review, approve, reserve, ready, handoff, on-loan state, return, and history;
- procurement: submit, review, canvass, preferred selection, and transitions through `READY_TO_RELEASE`;
- events: an operational relationship was created and read back;
- Administration: staging-safe account-status no-op and exact replay, reference create/replay/archive/history, and read-only system status;
- authorization: a fresh System Owner session exposed the required capabilities, while an unauthenticated business read returned HTTP 401 without a protected projection;
- integrations: evidence R2 remained available and Google Drive remained `NOT_CONFIGURED`, so no Google mutation occurred.

The final reconciliation observed seven P11 requests: one accepted, four completed, and two rejected. It observed two partial and four completed release consequences, two cycle-adjustment ledger entries, two receive ledger entries, two restock receipts with the restock complete, one returned lending lifecycle with history, one procurement deliverable ready for release with one preferred canvass, and one event relationship.

## Idempotency and integrity

Private aggregate-only D1 verification recorded six release confirmations, two cycle-adjustment operations, two restock receipts, one each for lending approval/handoff/return, one canvass save, one preferred-canvass selection, four deliverable transitions, one event link, one account-status mutation, and one reference creation. Exact replay was proven for the supported duplicate paths. Foreign-key violations were zero.

Fresh browser diagnostics recorded zero console errors. The one failed request was the deliberate unauthenticated denial probe (`GET /api/bootstrap/overview`), which returned HTTP 401 as required.

## Preserved attempts and repair

- Attempt A stopped on an overlong public idempotency key before a business request row existed. The Playground session and public rate-limit-event residue are preserved.
- Attempt B completed request and inventory-cycle paths, then stopped on a legitimate restock unit (`sachet`) rejected by the canonical unit vocabulary. Its earlier workflow evidence and pre-receipt evidence upload are preserved.
- The bounded product repair added `sachet` to the countable-unit vocabulary with regression coverage and was deployed to the isolated Playground from `ca28bde`.
- Attempt C completed all remaining business workflows and stopped only because the Administration account-status request omitted the required expected revision. Completed consequences were not replayed.
- The reconciliation pass completed only the remaining Administration-safe work, then verified all accumulated P11 projections and aggregate idempotency records. A projection-only correction matched canvasses through their supported deliverable/line relationships; it did not repeat business workflows.

## Live lifecycle state before reset

Read-only inspection after P11 remained schema 32 / migration `0032_staff_account_activity_history.sql`, baseline `PGBL-20260828-COVERAGE-V2` version 2, and reset generation 4. The fixed isolated D1 identity matched. The workspace correctly reports `DIRTY` with an active test session, ten sessions, nineteen aggregate transient rows, zero foreign-key violations, a reversible D1 bookmark, and the sealed clean bookmark still present. This residue is the required input to P12; it was not silently normalized.

## Verification

```text
P11 live reconciliation: PASS
Baseline safety Vitest: PASS - 1 file, 14 tests
Full Vitest: PASS - 164 files, 1212 tests
Cloudflare build: PASS - 1679 modules
Reconciliation harness syntax: PASS
Targeted ESLint: PASS
Prettier: PASS
git diff --check: PASS
Live D1 inspection: PASS - generation 4, sessions 10, transient total 19, FK violations 0
Production mutation: NONE
Google mutation: NONE
```

## Next exact action

Begin P12 reset architecture. Use the guarded lifecycle tooling against the exact fixed Playground Worker/D1/R2 tuple, preserve a private pre-reset export and evidence, restore the governed baseline without deleting unclassified R2 objects, advance generation only after verification, and prove the required consecutive reset cycles without claiming CLEAN on any failed attempt.
