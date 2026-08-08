# v0.7.0 Phase 3 Public Request Center Handoff

Decision: **PHASE 3 ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Delivered

- Direct no-login `/request` experience with shared requester/event/date/purpose information shown once.
- One category-aware Add Request Item composer and one requested-items list for Inventory Item, Food, Materials, Venue / Facility, Logistics / Equipment, and Other.
- Governed active/requestable reference choices without stock, storage, audit, account, or other requester data.
- Idempotent `FOR_REVIEW` submission with no reservation, inventory ledger, or physical-stock movement.
- Private Request ID plus high-entropy tracking code; only an HMAC digest is persisted.
- Same-origin JSON mutation enforcement, privacy-safe tracking failures, and D1-backed submit/track attempt limits.
- Revoked credential-less `SYSTEM-PUBLIC-REQUEST` actor, excluded from and immutable through Access Management.
- Additive migration `0011_public_request_tracking.sql`.

## Staging migration and reconciliation

- Private pre-0011 SQL export: 115,812 bytes; SHA-256 `d98132b30af2e420e5e319ce4ccfd4c573a8626c52569e1d57d827e2515fc88f`.
- Before migration: schema 10, 13 accounts, six verified emails, zero requests, inventory balance 8, zero public system actors.
- After migration: schema 11 / migration 0011, 14 accounts, six verified emails, zero verified-email collisions, zero requests, inventory balance 8, one protected public actor, and both public tables present.
- Three authorized staging acceptance runs created three synthetic `FOR_REVIEW` public requests and three synthetic account-lifecycle records. Final aggregate: 17 accounts, three requests, three private-access rows, inventory balance still 8, and one protected public actor.
- Private provider identifiers, credentials, secret values, and tracking codes remain outside Git.

## Verification

- `npm run check`: PASS — governance, lint, 57 Vitest files / 393 tests, builds, Apps Script/parity, standalone artifacts, Cloudflare types, and dry-run.
- Fresh local Worker/D1: PASS — 16 / 16.
- Full Playwright: PASS — 93 passed, 219 intentional project/viewport skips, zero failures across 312 scheduled tests.
- Deployed staging auth/Access Management and public Request Center: PASS — 2 / 2 on final runtime.
- Cache-busted `/api/health`, `/api/readiness`, and `/api/version`: PASS — STAGING, v0.7.0, exact runtime `6fbf377bb96f9e5123a24c8e1d81726ae5769532`, schema 11, migration 0011, ready true.

## Recovery and boundary

- The pre-0011 staging export and private migration/deploy logs are retained outside Git with hashes.
- The previous immutable Worker version remains available; the formal rollback rehearsal remains Phase 24.
- Production Worker upload/deploy, production secrets/migration/data, Google writes, PR merge, tag, and release did not occur.

## Next accepted phase

Phase 4 — Public Lending Center without login. `/lending` still requires a staff account and therefore does not satisfy Phase 4.
