# v0.7.0 Phase 6 / Follow-Up Amendment Slice 2 Handoff

Decision: **PASS ON STAGING — PRODUCTION NO-GO**

Accepted commit and deployed runtime:
`5cc171afcf993cd16dd9061d008a29a51b41fb29`

## Accepted scope

- Added the exact ten governed USC department/office identities with stable
  department IDs, account IDs, display names, and recommended Access IDs.
- Added one atomic Administrator-only initialization operation. It creates all
  ten `REQUESTER` accounts or none, refuses partial/conflicting state, and is
  safely replayable without reissuing credentials.
- Reused the accepted PBKDF2/password-pepper, activation, session, CSRF,
  rate-limit, lockout, revocation, and audit mechanisms.
- Initial and reset passwords are generated server-side with cryptographic
  randomness. D1 stores only credential hashes and metadata; API directory
  responses do not expose password or temporary-credential material.
- Authenticated department identity is server-owned and included in session
  contracts. Users cannot choose or mutate the mapped department.
- Administrator Access Management exposes department identity, password
  change/reset times, secure one-time credential exports, search/sort, history,
  revoke, restore, and reset controls.
- An unactivated revoked account restores to `STARTER`, preserving mandatory
  first-login activation rather than bypassing it.

## Repository acceptance

- Focused Access Management unit tests — PASS, 9 / 9.
- Fresh local Worker/D1 — PASS, 21 / 21.
- `npm run check` — PASS, including governance, lint, 58 Vitest files /
  404 tests, builds, generated parity, Apps Script verification, Cloudflare
  type checks, and deployment dry-run.
- Full Playwright — PASS, 94 passed / 224 intentional skips / zero failed.

## Staging migration and recovery

- Pre-migration D1 export retained outside Git:
  `staging-pre-0017-5cc171a.sql`.
- Backup SHA-256:
  `8b2a39ced6450fd78837585bcdd2d4d8d8a4afe6cd2ba056034a5858e50a48d7`.
- Migration `0017_department_requester_accounts.sql` applied and reconciled.
- Live schema version is 17 with ten active governed department rows.
- The deployed Worker binds the staging D1 and R2, release `0.7.0`, and exact
  candidate SHA. No production resource was changed.

## Live department-account acceptance

- Exactly ten mapped department accounts exist; all ten are `REQUESTER` and
  `STARTER`, with ten distinct stable department mappings.
- One-time seed replay returned no credentials and created no duplicates.
- All ten initial passwords were unique and policy-compliant; no credential
  values were printed.
- A Department of Logistics starter login required activation. Revocation
  immediately invalidated its session, restoration returned it to `STARTER`,
  and the original unconsumed one-time credential again reached activation.
- Directory reconciliation proved all ten department/display/Access-ID
  mappings and no serialized password credential fields.
- The exact outside-Git handoff exists at
  `D:\Documents\Logistics Website Access codes.txt`, contains only the ten
  newly generated initial credentials and required metadata, and is
  ACL-restricted to the local owner account.

## Deployed and remote acceptance

- Health reports `STAGING`, release `0.7.0`, exact SHA `5cc171a`, schema 17,
  and migration 0017.
- Deployed brand, authentication/Access Management, and public-request
  regression scenarios passed 3 / 3.
- The public-lending scenario passed 1 / 1 using the reversible governed
  staging fixture. The fixture was restored to `ARCHIVED / NOT_LENDABLE`;
  the public catalog again reconciles to zero items.
- PR #9 remains open and draft. Exact-head checks passed 6 / 6:
  `validate`, `verify`, `build`, `browser-smoke`, `deploy`, and
  `report-build-status`.

## Next accepted slice

Implement Follow-Up Amendment Slice 3: require authenticated department access
for `/request`; derive identity from the server session; add New, Additional,
and scoped Tracking flows; preserve atomic `FOR_REVIEW` submission; implement
the approved choices, confirmed success state, and private-safe branded PDF
receipt.
