# HAU-USC Logistics v0.7.0 Production Launch Handoff

Decision: **PRODUCTION NO-GO — PHASE 4 PRESERVED; PHASE 2/3 CORRECTION AWAITS STAGING**

## Phase 0 repository and remote truth

- Candidate branch: `chore/v0.6-codex-continuity-bootstrap`.
- Reconciled start: `a3059a8264aa74bc1f5ec0113cc59826a62cf2ff`; clean and equal to upstream.
- PR #9: open draft, mergeable/CLEAN, six checks passed at the exact start SHA.
- Staging: healthy and ready at exact start SHA; D1 schema 9 / migration `0009_public_portal_entitlements.sql`.
- Public `/request` and `/lending` routes load. Safe `/api/version` is missing.

## Provider and data truth

- Cloudflare operator authentication is valid.
- Existing: staging Worker; distinct staging/production D1 databases; distinct staging/production R2 buckets.
- Production Worker: reserved in the validated private configuration; intentionally not uploaded or deployed before the final merged release exists.
- Staging Workers Logs and sampled Traces are enabled. Three protected staging secrets are applied; a distinct production package is retained privately and unapplied.
- Google workbook and seven governed Drive mappings are readable.
- Approved item master: one canonical item.
- Approved events: zero rows. Approved brand assets: zero rows.
- No production provider mutation, merge, tag, release, D1 write, Google write, or smoke write occurred in Phase 0.

## Preservation and branch reconciliation

- All refs were bundled and verified outside Git before consolidation.
- PRs #1, #2, #6, and #7 are contained.
- PR #8 contributes one accepted policy patch, now integrated into `AGENTS.md`.
- PRs #3 and #4 are superseded by the accepted Worker/D1 and repository-governance architecture.
- PR #5 is preserved as historical post-launch QR scope; it is not merged into launch-critical v0.7 code.

## Milestones

| Milestone | State |
| --- | --- |
| 1. Git/PR/CI verified | PASS |
| 2. Private v0.7 configs | PASS — distinct pair and secret packages retained outside Git |
| 3. Cloudflare staging/production resources | PASS FOR D1/R2; staging Worker deployed; production Worker intentionally deferred |
| 4. Google mappings | PASS READ-ONLY; event source empty |
| 5. Backup | PARTIAL — pre-0010 through pre-0012 staging SQL exports retained; formal rehearsal pending |
| 6. Migrations | PARTIAL — staging through 0012 applied/reconciled; later and production migrations pending |
| 7. Import/reconciliation | PENDING |
| 8. Staging deployment | PASS THROUGH PHASE 4 runtime `8e5c25d` |
| 9. Staging acceptance | PENDING |
| 10. Rollback rehearsal | PENDING |
| 11. Consolidation merge/tag/release | PENDING |
| 12. Production deployment | PENDING |
| 13. Production smoke | PENDING |

## Phase 1 evidence

- Repository gate: 56 Vitest files / 389 tests plus governance, lint, builds, generated parity, Apps Script verification, Cloudflare types, and dry-run passed.
- Fresh local Worker/D1: 15 / 15 passed.
- Live staging auth/Access Management smoke: 1 / 1 passed.
- Health/readiness/version: HTTP 200, exact runtime, release 0.7.0, R2/protected configuration/D1 ready, correlation headers present.
- Pre-deploy immutable rollback input hash: `39080a81dbdfb208700b7f9e24317fd27e6e36c6acd76246c6efa57df7fd1d52`.

## Phase 2 evidence

- Secure HAU-inspired staff login, governed R2 background slot, accessible password controls, safe recovery guidance, and explicit authentication-state presentation are deployed.
- D1 migration 0010 adds unique verified-email login. Duplicate legacy emails remain unverified and Access-ID-only.
- `npm run check` passed with 57 Vitest files / 392 tests. Full Playwright passed 92 / 306 scheduled with 214 intentional skips.
- Cache-busted live identity and the deployed auth/Access Management/email-login smoke passed at exact runtime `edf6dcb`, schema 10.
- Durable handoff: `.codex/V0_7_PHASE_2_LOGIN_HANDOFF.md`.

## Phase 3 evidence

- `/request` opens without login and provides one unified request/item flow with governed public-safe choices.
- Submission is idempotent, creates `FOR_REVIEW`, returns private HMAC-backed tracking, and produces no stock movement.
- Migration 0011 added public tracking/rate-limit persistence plus one protected revoked credential-less system actor.
- `npm run check` passed with 57 Vitest files / 393 tests; fresh local Worker/D1 passed 16 / 16; full Playwright passed 93 / 312 scheduled with 219 intentional skips.
- Cache-busted live identity and deployed auth/public-request smoke passed 2 / 2 at exact runtime `6fbf377`, schema 11.
- Durable handoff: `.codex/V0_7_PHASE_3_PUBLIC_REQUEST_HANDOFF.md`.

## Phase 4 evidence

- `/lending` opens without login and provides a borrower-safe catalog before validated external-borrower identity collection.
- Multi-item submission creates canonical committee-routed `FOR_REVIEW` tickets with private group tracking and no reservation or stock movement.
- Migration 0012 adds only public lending profile/tracking/link/rate-limit state and the service-actor committee route.
- `npm run check` passed with 57 Vitest files / 393 tests; local Worker/D1 passed 17 / 17; full Playwright passed 94 / 318 scheduled with 224 intentional skips.
- Cache-busted identity and three deployed smoke scenarios passed at exact runtime `8e5c25d`, schema 12.
- The real staging public catalog is empty. The audited synthetic acceptance fixture is archived; Phase 5 must supply the complete governed canonical catalog contract.
- Durable handoff: `.codex/V0_7_PHASE_4_PUBLIC_LENDING_HANDOFF.md`.

## Immediate repair target

Correction candidate `db74a7d30ec05bf8c0bdc23b6c3c0362ba06cdab` is locally accepted with `npm run check` (398 tests), local Worker/D1 17 / 17, and full Playwright 94 passed / 224 intentional skips / zero failures. It restores live Worker routing for governed Brand & Media slots, responsive official logo lockups, the source-grounded guided Request Center, separate private tracking, and secure related-request verification. Migration 0013 is additive. The accepted Phase 4 Lending Center backend remains intact.

Push the candidate, back up staging D1, apply migration 0013, deploy the exact SHA, and run live correction acceptance. Resume Phase 5 only after that acceptance is durable. Do not upload or deploy a production Worker before final freeze, merge, and production authorization validation.

Approved upcoming-event values must be requested once before final freeze because the governed source is empty. Do not invent them.
