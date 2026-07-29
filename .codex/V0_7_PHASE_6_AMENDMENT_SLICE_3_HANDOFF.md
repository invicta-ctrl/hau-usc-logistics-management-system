# v0.7.0 Phase 6 / Follow-Up Amendment Slice 3 Handoff

Decision: **PASS ON STAGING — PRODUCTION NO-GO**

Accepted commit and deployed runtime:
`ef4c74c06b85449c3b806d0ba490bb4d4578ed39`

## Accepted scope

- `/request` now requires an authenticated department requester session.
- Requester account, stable department ID, and department display name are
  derived server-side; the client cannot select or alter department identity.
- The guided workflow supports `NEW` and `ADDITIONAL` requests against governed
  event-series/sub-event records and the exact approved venue, logistics, and
  equipment choices, plus governed custom lines.
- Duplicate active New requests are rejected with a safe path to the existing
  request and Additional flow.
- Additional request selection, tracking, request details, lines, additions,
  and visible history are scoped to the authenticated department.
- Public Request Center APIs and private tracking codes are disabled. The
  Lending Center remains public and its accepted backend is unchanged.
- Each submission atomically commits the request header, lines, initial
  history, audit event, idempotency record, and revision at `FOR_REVIEW`.
  Submission creates no reservation, inventory ledger entry, or stock change.
- Confirmed success exposes the required receipt summary and actions. The
  generated branded PDF is mobile/print readable and excludes credentials,
  session material, private identifiers, internal notes, and audit data.

## Repository acceptance

- `npm run check` — PASS: governance, lint, 59 Vitest files / 406 tests,
  builds, generated parity, Apps Script checks, Cloudflare types, and dry-run.
- Fresh local Worker/D1 — PASS, 21 / 21.
- Full Playwright — PASS, 94 passed / 224 intentional skips / zero failed.
- Focused authenticated 390px Request Center and PDF regression — PASS, 1 / 1.
- `git diff --check` — PASS.

## Staging migration and recovery

- Pre-migration D1 export retained outside Git:
  `staging-pre-0018-ef4c74c.sql`.
- Backup SHA-256:
  `2154d88cc1791b37f0c9e972c090c39ca5d09ff87dddf109123af9aac29472d9`.
- Migration `0018_authenticated_request_center.sql` applied and reconciled.
- Because the exact SQL file was applied directly, its verified
  `d1_migrations` bookkeeping row was added explicitly after schema
  reconciliation. Both ledgers report version 18 / migration 0018.
- The new department foreign-key column exists and no requester-linked request
  is missing its department mapping.
- No production resource was changed.

## Live staging acceptance

- Health reports `STAGING`, release `0.7.0`, exact SHA `ef4c74c`, schema 18,
  migration 0018, and healthy D1/R2/static/protected dependencies.
- Deployed staging acceptance passed 4 / 4:
  governed brand/login; authentication and Access Management; authenticated
  New + Additional + scoped Tracking + PDF; and both public lending borrower
  classes.
- The live request proof created one New request and one Additional child for
  the mapped DOL department, with two lines, two initial history rows, and two
  append-only audit rows.
- Reconciliation proved zero reservations and zero inventory-ledger rows for
  the accepted requests.
- The requests were archived after proof while history/audit evidence was
  preserved. The event fixture is cancelled/inactive.
- The lending fixture is restored to `ARCHIVED / NOT_LENDABLE`; the public
  catalog is again truthfully empty.
- DOL was rotated back to `STARTER`; the owner-restricted outside-Git handoff
  was refreshed without printing credential values.

## Remote acceptance

- PR #9 remains open and draft.
- Exact head is `ef4c74c06b85449c3b806d0ba490bb4d4578ed39`.
- All six exact-head checks passed: `validate`, `verify`, `build`,
  `browser-smoke`, `deploy`, and `report-build-status`.

## Next accepted slice

Execute Follow-Up Amendment Slice 4: consolidate the 58-case amendment
acceptance evidence on live staging, review the complete amendment diff and
data truth, then resume the next unfinished master-prompt phase. Production
remains gated.
