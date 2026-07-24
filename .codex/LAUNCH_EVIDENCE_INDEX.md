# HAU-USC Logistics v0.7.0 Launch Evidence Index

Decision: **PRODUCTION NO-GO — PHASE 4 PRESERVED; PHASE 2/3 CORRECTION AWAITS STAGING**

| Area | Evidence | Result |
| --- | --- | --- |
| Accepted master prompt | `.codex/specs/v0.7.0-production-master.md`; source SHA-256 `9bf903dcd1172be7bf6dbbadf903c5f33cc4aaa44adc9b6c693df6d201e5d067` | ADOPTED |
| Efficiency contract | `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; source SHA-256 `22658a6afddebe26270845a6e4678685b1a0875da0fb73ed2943ea08f6d37d67` | ADOPTED |
| Git handshake | exact pushed Phase 4 runtime `8e5c25d`, upstream parity before status checkpoint | PASS |
| PR #9 / CI | exact head `a3059a8`; validate, verify, build, browser-smoke, deploy, report-build-status | 6 / 6 PASS |
| Live staging identity | cache-busted health/readiness/version | STAGING, exact `8e5c25d`, D1 connected, schema 12, migration 0012 |
| Public surfaces | `/request`, `/lending` | HTTP 200; public SPA returned |
| Version endpoint | `/api/version` | PASS — exact environment/version/candidate |
| All-ref preservation | private bundle SHA-256 `39b5dff168b705fb68b71d7dd822e02077ed0e58c9401119e716d0738c735b93` | PASS |
| Branch/PR inventory | `.codex/V0_7_BRANCH_INVENTORY.md` | INITIAL CLASSIFICATION COMPLETE |
| Cloudflare auth | bundled Wrangler read-only inventory | PASS |
| Staging Worker/D1 | provider inventory and live health | PRESENT / HEALTHY |
| Production Worker/D1 | provider inventory | D1 PRESENT; Worker reserved/not uploaded |
| Staging/production R2 | provider inventory | BOTH PRESENT AND DISTINCT |
| Workers Logs/Traces | deployed staging configuration | ENABLED; live event sampling deferred to Phase 22 |
| Protected Cloudflare secrets | staging provider inventory | 3 / 3 PRESENT; production package private/unapplied |
| Google workbook | connector metadata read | 36 sheets readable |
| Drive mappings | connector metadata read | 7 / 7 readable |
| Canonical inventory | `01_ITEM_MASTER` bounded read | 1 approved item |
| Upcoming events | `13_EVENTS`, requests, composite requests | 0 approved rows — owner values required before freeze |
| Brand asset registry | `21_BRANDING` | 0 rows |
| Five role visual references | hashes match `.codex/DESIGN_REFERENCE_DIGEST.md` | PASS; large files not reread |
| Phase 1 repository acceptance | `npm run check` | PASS — 56 Vitest files / 389 tests plus all repository gates |
| Fresh local Worker/D1 | self-managed Playwright config | PASS — 15 / 15 |
| v0.7 Phase 1 staging deployment | runtime `8b4af047642e6db6f0314ce70bfb611ed8c7679d` | DEPLOYED / HEALTHY |
| Staging health/readiness/version | cache-busted live probes | PASS — release 0.7.0, exact runtime, schema 9, R2 and protected config ready |
| Staging auth/Access Management | deployed Playwright | PASS — 1 / 1 |
| Phase 2 staff login | `.codex/V0_7_PHASE_2_LOGIN_HANDOFF.md` | PASS ON STAGING |
| Verified-email migration | pre-export, migration 0010, aggregate reconciliation | PASS — zero verified collisions; ambiguous duplicates remain unverified |
| Phase 2 repository acceptance | `npm run check`; full Playwright | PASS — 57 files / 392 unit tests; 92 browser passes / 214 intentional skips |
| Phase 2 staging smoke | deployed Playwright at `edf6dcb` | PASS — auth, Access Management, and verified-email login |
| Phase 3 public Request Center | `.codex/V0_7_PHASE_3_PUBLIC_REQUEST_HANDOFF.md` | PASS ON STAGING |
| Public-request migration | private pre-export, migration 0011, aggregate reconciliation | PASS — protected system actor, two public tables, inventory unchanged |
| Phase 3 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 393 unit tests; 16 / 16 Worker; 93 browser passes / 219 intentional skips |
| Phase 3 staging smoke | deployed Playwright at `6fbf377` | PASS — 2 / 2 auth/access and public submit/private track |
| Phase 4 public Lending Center | `.codex/V0_7_PHASE_4_PUBLIC_LENDING_HANDOFF.md` | PASS ON STAGING |
| Public-lending migration | private pre-export, migration 0012, aggregate reconciliation | PASS — three tables, committee route, inventory unchanged |
| Phase 4 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 393 unit tests; 17 / 17 Worker; 94 browser passes / 224 intentional skips |
| Phase 4 staging smoke | deployed Playwright at `8e5c25d` | PASS — 3 / 3 auth/access, request, and lending |
| Real public-lending catalog | governed staging aggregate | 0 approved items — Phase 5 policy/data input required; synthetic smoke fixture archived |
| Phase 2/3 correction candidate | `db74a7d30ec05bf8c0bdc23b6c3c0362ba06cdab` | COMMITTED LOCALLY — push and staging acceptance pending |
| Governed Brand & Media slots | login background, USC logo, DOL logo, favicon uploaded to staging R2 and hash-verified | R2 PASS; live Worker routing pending exact-SHA deploy |
| Corrected Request Center | guided source-grounded creation, separate private tracking, verified related-request lookup | LOCAL PASS — 398 unit tests, 17 / 17 Worker, 94 / 318 browser with 224 intentional skips |
| Migration 0013 | `0013_public_request_guidance.sql` | LOCAL PASS; staging application/reconciliation pending |
| Phase 1 rollback input | private anchor SHA-256 `39080a81dbdfb208700b7f9e24317fd27e6e36c6acd76246c6efa57df7fd1d52` | CAPTURED; rehearsal remains Phase 24 |
| Backup/rollback rehearsal | pending | UNRUN |
| Production authorization/deployment/smoke | pending | NOT AUTHORIZED UNTIL GATES PASS |

Private account IDs, database IDs, folder IDs, workbook IDs, deployment IDs, credentials, and secret values remain outside Git and are intentionally omitted.
