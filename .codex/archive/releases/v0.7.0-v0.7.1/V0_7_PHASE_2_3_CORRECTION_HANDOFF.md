# v0.7.0 Phase 2/3 Targeted Correction Handoff

Decision: **CORRECTION ACCEPTED ON STAGING — PHASE 4 PRESERVED — PRODUCTION NO-GO**

## Delivered

- Phase 2 was reopened only to make the governed campus login background and official DOL/HAU-USC logo slots live through Worker-first R2 routes.
- The shared logo lockup is responsive and reused on login, authenticated shell, public Request Center, public Lending Center, requester and borrower portals, and favicon.
- Phase 3 was reopened only to restore a five-step, source-grounded Request Center with event-logistics and catalog-restock paths.
- Request creation and private tracking are separate. Related requests are exposed only after the requester proves the original Request ID and private tracking code.
- Migration `0013_public_request_guidance.sql` adds requester type, location, stock area, and needed date to existing public-request access metadata.
- The accepted Phase 4 public Lending Center backend, committee routing, private tracking, and no-stock-movement boundary remain intact.

## Repository and CI acceptance

- Implementation commit: `db74a7d30ec05bf8c0bdc23b6c3c0362ba06cdab`.
- Exact deployed and remote PR head: `6c4cff601b04b64d9327ac1308d2cc2cab59e584`.
- `npm run check`: PASS — governance, lint, 57 Vitest files / 398 tests, builds, generated parity, Apps Script checks, Cloudflare types, and dry-run.
- Fresh local Worker/D1: PASS — 17 / 17.
- Full Playwright: PASS — 94 passed, 224 intentional project/viewport skips, zero failures across 318 scheduled tests.
- Draft PR #9: exact head, mergeable, all six checks passed.

## Staging migration, deployment, and live acceptance

- Private pre-0013 SQL export: 172,689 bytes; SHA-256 `149de561682c36da29f172e02e88c5310a3508343450f267aa3bfd4e89234d21`.
- Migration and reconciliation: schema 13, latest migration `0013_public_request_guidance.sql`, four guidance columns present, prior data counts preserved, and zero reservations.
- Cache-busted health/readiness/version: PASS — STAGING, v0.7.0, exact runtime `6c4cff601b04b64d9327ac1308d2cc2cab59e584`, schema 13, ready true.
- Governed R2 assets: all four live routes returned `200 image/png`; downloaded bytes matched the supplied source hashes.
- Login visual evidence at 1366, 820, and 390 pixels: background route active, two visible loaded official marks, and no horizontal overflow.
- Deployed acceptance: PASS — 4 / 4 for governed branding, authentication/Access Management, guided public Request Center, and preserved public Lending Center.
- The clearly labeled synthetic lending item was activated only for the smoke and immediately re-archived. Final active public catalog item count is zero and reservations remain zero.

## Recovery and boundary

- Private backup, configuration, migration, deployment, asset, screenshot, fixture, and reconciliation evidence remain outside Git.
- The previous immutable Worker remains available. Formal rollback rehearsal remains Phase 24.
- Production Worker, production database, production R2, Google sources, PR merge, tag, and release were untouched.

## Next accepted phase

Resume Phase 5 — Complete Lendable Inventory Catalog. Do not invent institutional item eligibility or event values.
