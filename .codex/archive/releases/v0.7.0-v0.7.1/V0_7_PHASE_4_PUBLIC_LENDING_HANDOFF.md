# v0.7.0 Phase 4 Public Lending Center Handoff

Decision: **PHASE 4 ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Delivered

- Direct no-login `/lending` with borrower-safe catalog browsing, search, category, availability, and reusable/consumable filters before personal information.
- Multi-item borrowing request for external Angelite borrowers with Student ID, course/year, approved department, contact/email, purpose, pickup/due dates, and responsibility acknowledgment.
- Existing canonical inventory items and existing internal lending tickets; no second lending inventory.
- One `FOR_REVIEW` internal ticket per selected item, routed to Inventory & Pantry, with no automatic approval, reservation, ledger, or stock movement.
- Private group ticket ID and HMAC-backed tracking code; only the digest is stored.
- Same-origin JSON mutation enforcement, privacy-safe tracking failures, and D1 submit/track attempt limits.
- Additive migration `0012_public_lending_tracking.sql`.

## Staging migration and reconciliation

- Private pre-0012 SQL export: 154,121 bytes; SHA-256 `f093988ff5a0063ffcf8d7dc8abcdc7fa31da9da675f413efc45b7b2db7fe68b`.
- Before migration: schema 11, 17 accounts, three requests, zero lending tickets/reservations, real inventory balance 8, and zero approved public-lending catalog items.
- After migration: schema 12 / migration 0012, all accounts/data preserved, three new public-lending tables, one active service route to Inventory & Pantry, and unchanged inventory.
- The real governed staging catalog had no `STUDENTS_AND_STAFF` item. One clearly labeled audited synthetic item was created for the authorized smoke and archived immediately afterward; no institutional item eligibility was changed.
- Final aggregate: 18 accounts, four logistics requests, one public lending request/link/ticket routed `FOR_REVIEW`, zero reservations, real inventory balance still 8, synthetic fixture archived, and zero active real public catalog items.

## Verification

- `npm run check`: PASS — governance, lint, 57 Vitest files / 393 tests, builds, Apps Script/parity, standalone artifacts, Cloudflare types, and dry-run.
- Fresh local Worker/D1: PASS — 17 / 17.
- Full Playwright: PASS — 94 passed, 224 intentional project/viewport skips, zero failures across 318 scheduled tests.
- Deployed staging authentication/Access Management, public Request Center, and public Lending Center: PASS — 3 / 3.
- Cache-busted health/readiness/version: PASS — STAGING, v0.7.0, exact runtime `8e5c25df3e498b6627b5ebc88db0c8cf9b71c849`, schema 12, migration 0012, ready true.
- Draft PR #9: exact code head, clean/mergeable, all six checks passed.

## Recovery and boundary

- The pre-0012 export and private migration/deploy/fixture logs are retained outside Git.
- The previous immutable Worker version remains available; formal rollback rehearsal remains Phase 24.
- Optional email verification was not claimed because no delivery/redemption provider is configured and live-tested.
- Production Worker, production migration/data/secrets, Google sources, PR merge, tag, and release were untouched.

## Next accepted phase

Phase 5 — Complete Lendable Inventory Catalog. The real staging catalog has no approved public-lending item and the existing canonical model lacks the complete governed field and reusable-asset contracts required by Phase 5.
