# HAU-USC Logistics v0.7.0 Production Launch Handoff

Decision: **PRODUCTION NO-GO — PHASES 0–8 AND FOLLOW-UP AMENDMENT ACCEPTED ON STAGING**

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
| 5. Backup | PARTIAL — pre-0010 through pre-0016 staging SQL exports retained; formal rehearsal pending |
| 6. Migrations | PARTIAL — staging through 0019 applied/reconciled; later and production migrations pending |
| 7. Import/reconciliation | PENDING |
| 8. Staging deployment | PASS THROUGH PHASE 8 runtime `ffe7181` |
| 9. Staging acceptance | PASS THROUGH PHASE 8; full master Phase 22 pending |
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

## Phase 5 evidence

- The canonical Inventory Management catalog now owns governed lending fields, borrower-safe presentation, staff metrics, and reusable asset instances; no second inventory exists.
- One authoritative availability view/service is used for public listing and server-side lending validation.
- Traceable asset reservation, handoff, return, condition, photo, maintenance, and append-only movement contracts are implemented.
- Migration 0014 is applied and reconciled on staging; all pre-existing data is preserved.
- `npm run check` passed with 58 Vitest files / 401 tests; local Worker/D1 passed 18 / 18; full Playwright passed 94 / 318 scheduled with 224 intentional skips.
- Cache-busted identity and four deployed scenarios passed at exact runtime `fc9ef1c`, schema 14. The audited fixture is archived, with zero active public items and zero reservations.
- Durable handoff: `.codex/V0_7_PHASE_5_LENDING_CATALOG_HANDOFF.md`.

## Phase 6 / Follow-Up Amendment Slice 1 evidence

- Internal lending review/issue/return, borrower classification, removal of
  public lending tracking, governed advertisements, balanced/clickable branding,
  and role-protected Lending Usage are implemented.
- Migrations 0015 and 0016 are applied and reconciled on staging after a
  private pre-migration export.
- Repository acceptance passed: 401 unit tests, 19 local Worker tests,
  94 browser passes / 224 intentional skips, and the complete repository gate.
- Deployed staging acceptance passed 4 / 4 at exact runtime `fb94a1f`,
  schema 16.
- Live amendment checks passed for the approved poster hash, two-ad rotation
  and controls, pause/reduced-motion behavior, mobile layout, logo link, and
  Lending Usage authorization.
- Temporary acceptance data is reconciled: the second ad is archived, the
  synthetic lending item is archived/`NOT_LENDABLE`, and the governed public
  catalog is truthfully empty.
- PR #9 exact head is clean/mergeable with 6 / 6 checks passed.
- Durable handoff:
  `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_1_HANDOFF.md`.

## Phase 6 / Follow-Up Amendment Slice 2 evidence

- Exact ten department requester accounts, server-owned identity, one-time
  server-generated credentials, Access Management controls, and audit history
  are implemented and accepted.
- Migration 0017 is applied and reconciled on staging after a private export
  with SHA-256
  `8b2a39ced6450fd78837585bcdd2d4d8d8a4afe6cd2ba056034a5858e50a48d7`.
- Repository acceptance passed: 404 unit tests, 21 local Worker tests,
  94 browser passes / 224 intentional skips, and the complete repository gate.
- Live staging is healthy at exact runtime `5cc171a`, schema 17. Ten mapped
  `REQUESTER` accounts are in `STARTER`; seed replay, activation gating,
  revocation/restoration, and privacy reconciliation passed.
- The exact outside-Git credential handoff was atomically created and
  owner-restricted.
- PR #9 exact-head checks passed 6 / 6.
- Durable handoff:
  `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_2_HANDOFF.md`.

## Phase 6 / Follow-Up Amendment Slice 3 evidence

- The Request Center now requires a mapped department session and derives
  requester identity server-side.
- New/Additional requests, department-scoped Tracking, governed choices,
  atomic `FOR_REVIEW` submission, confirmed success, and private-safe PDF
  receipts are implemented and accepted.
- Migration 0018 is applied and reconciled on staging after a private export
  with SHA-256
  `2154d88cc1791b37f0c9e972c090c39ca5d09ff87dddf109123af9aac29472d9`.
- Repository acceptance passed: 406 unit tests, 21 local Worker tests,
  94 browser passes / 224 intentional skips, and the complete repository gate.
- Deployed staging acceptance passed 4 / 4 at exact runtime `ef4c74c`,
  schema 18.
- Reconciliation proved zero request-time reservations/ledger movements.
  Acceptance requests are archived with history/audit retained; fixtures are
  inactive and the public lending catalog is truthfully empty.
- DOL is restored to `STARTER` and the outside-Git credential handoff is
  refreshed and owner-restricted.
- PR #9 exact-head checks passed 6 / 6.
- Durable handoff:
  `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_3_HANDOFF.md`.

## Phase 6 / Follow-Up Amendment Slice 4 evidence

- The complete amendment diff was reviewed. Long-list Event/Sub-event
  autocomplete was the only discovered product gap and was repaired.
- Final repository acceptance passed: 60 Vitest files / 409 tests, full
  Playwright 95 / 229 intentional skips, and every repository gate.
- Read-only governed-source verification confirmed one active inventory item
  that is explicitly not available for lending and zero approved event rows.
- Final functional staging runtime `60a0138`, schema 18, passed 4 / 4 deployed
  scenarios.
- Final accepted candidate `afe9204` preserved identical product code, passed
  cache-busted health and governed brand/login smoke, retained all protected
  bindings, and passed exact-head PR checks 6 / 6.
- The complete 58-case amendment matrix passed.
- Cleanup returned DOL to `STARTER`, archived all acceptance requests, retained
  history/audit, inactivated fixtures, and reconciled zero public catalog
  items, reservations, or inventory-ledger movements.
- Phase 6 is accepted on staging.
- Durable handoff:
  `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_4_HANDOFF.md`.

## Phase 7 shared internal shell evidence

- The five direct internal routes now use one authenticated shell with a
  URL-backed workspace selector, server-governed scope, breadcrumb, release,
  attention, and account context.
- Administrator switching preserves identity/capabilities; unauthorized direct
  routes fail closed and public/request-only surfaces cannot enter the shell.
- The ten governed department accounts are active, onboarding-complete, and
  freshly verified. Their Admin rows show the correct department/status and
  password-reset controls; plaintext credentials remain outside Git.
- Repository acceptance passed 409 unit tests and 99 browser tests. Live brand
  and complete auth/Access Management staging scenarios passed at exact
  product/test runtime `6c1906a`, schema 18.
- PR #9 at `6c1906a` passed all 6 / 6 exact-head checks.
- Durable handoff: `.codex/V0_7_PHASE_7_SHARED_INTERNAL_SHELL_HANDOFF.md`.

## Phase 8 System Owner and operational scope evidence

- A protected `SYSTEM_OWNER` role owns every existing capability, all five real
  workspaces, and Release Desk without creating an impersonation path.
- Committee, location, event, and office context is projected from governed
  references, validated and filtered server-side, recovered through direct
  routes, and recorded on consequential audit events. Scope never grants a
  capability; invalid context fails closed.
- Migration 0019 followed a private staging export, then reconciled schema 19,
  exactly one active private owner assignment, revoked pre-promotion sessions,
  and a durable owner audit row.
- Repository acceptance passed 416 unit tests, 25 local Worker tests, and 100
  browser tests. Live governed brand and complete owner/auth/scope/Access
  Management scenarios passed at exact runtime `ffe7181`.
- PR #9 at `ffe7181` passed all 6 / 6 exact-head checks.
- Durable handoff: `.codex/V0_7_PHASE_8_SYSTEM_OWNER_HANDOFF.md`.

## Immediate accepted target

The targeted Phase 2/3 correction is accepted on staging at exact runtime `6c4cff601b04b64d9327ac1308d2cc2cab59e584`, schema 13. Governed Brand & Media routes, responsive official lockups, source-grounded guided requests, separate private tracking, and secure related-request verification passed. The accepted Phase 4 Lending Center backend remains intact. Durable evidence: `.codex/V0_7_PHASE_2_3_CORRECTION_HANDOFF.md`.

Complete Phase 9 Administrator workspace. Do not
upload or deploy a production Worker before final freeze, merge, and production
authorization validation.

Approved upcoming-event values must be requested once before final freeze because the governed source is empty. Do not invent them.
