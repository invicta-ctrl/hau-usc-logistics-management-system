# Inventory v0.8.0 Reconciliation

This is the sanitized, aggregate-only reconciliation record for the final candidate.
Private exports, provider identifiers, actor details, raw rows, recovery coordinates,
and configuration fingerprints remain outside Git.

## Deterministic local / Worker-D1 fixtures

- **Environment:** `LOCAL_TEST`
- **Schema / migration:** `30` / `0030_production_access_and_operations.sql`
- **Candidate/runtime SHA:** exact checked-out candidate at execution time
- **Checks executed:** 20 independent truth, reservation, Request/Release, Lending,
  receiving, transfer, cycle-count, idempotency, audit/history, trigger, integrity, and
  foreign-key checks
- **Accepted checks:** 20
- **Rejected/discrepant checks:** 0
- **Known nonblocking imported-history observations:** 8 in the canonical two-generation
  synthetic import fixture; each has exact `imported_source_rows` provenance and clean
  current truth/counters/ledger/FK/integrity
- **Quarantine-required:** 0
- **Blocking discrepancies:** 0
- **Invariant result:** `RECONCILED`
- **Private evidence:** not applicable; deterministic fixtures contain synthetic data

The reconciler treats runtime-native command effects and proven imports separately.
Missing canonical command idempotency on an exact, repository-imported historical row is
`KNOWN_NONBLOCKING` only while current quantities, counters, ledger effects, integrity,
and foreign keys remain correct. A bare `SYSTEM-IMPORT` marker or `IMPORT:` prefix is not
provenance. Malformed provenance is `QUARANTINE_REQUIRED`; any truth-changing mismatch is
`BLOCKS_CANDIDATE` even when imported.

## Isolated staging

- **Environment:** `ISOLATED_STAGING`
- **Schema / migration:** required `30` / `0030_production_access_and_operations.sql`
- **Candidate/runtime SHA:** required exact frozen v0.8.0 candidate
- **Checks executed:** the same aggregate-only reconciliation over the fresh private D1
  export and isolated restore
- **Accepted/rejected/quarantine counts:** recorded in the owner-private recovery manifest
  and final owner decision packet after the frozen candidate operation
- **Invariant result required for deployment:** `RECONCILED`
- **Private evidence location:** owner-private Slice 3 recovery directory outside Git

The staging evidence command fails closed before deployment if the isolated target,
backup, restore identity, immutable-history availability, or reconciliation is not exact.

## Production read-only

- **Environment:** `PRODUCTION_READ_ONLY`
- **Mutation:** prohibited
- **Execution:** only through a protected existing read/export path that cannot expose
  private data or mutate D1/R2/bindings/provider/Google state
- **Result:** recorded in the final owner decision packet; inability to obtain a safe
  read-only export is an explicit unperformed limitation, never inferred green evidence

## Discrepancy dispositions

| Disposition           | Meaning and candidate effect                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `RECONCILED`          | Independent derivation and effect checks agree; no action is required.                           |
| `KNOWN_NONBLOCKING`   | Proven legacy/import representation differs, but authoritative truth and integrity remain exact. |
| `QUARANTINE_REQUIRED` | Meaning/provenance is insufficient; no guessed correction is allowed.                            |
| `BLOCKS_CANDIDATE`    | Authoritative truth or an accepted v0.8.0 invariant is violated; production GO is blocked.       |

The repository command is `npm run reconcile:inventory -- ...`. Its normal output is
aggregate-only JSON. Errors use stable codes and do not print private absolute paths.
