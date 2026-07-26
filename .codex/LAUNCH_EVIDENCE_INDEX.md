# HAU-USC Logistics v0.7.0 Launch Evidence Index

Decision: **PRODUCTION NO-GO — PHASES 0–14 AND FOLLOW-UP AMENDMENT ACCEPTED ON STAGING**

| Area | Evidence | Result |
| --- | --- | --- |
| Accepted master prompt | `.codex/specs/v0.7.0-production-master.md`; source SHA-256 `9bf903dcd1172be7bf6dbbadf903c5f33cc4aaa44adc9b6c693df6d201e5d067` | ADOPTED |
| Efficiency contract | `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; source SHA-256 `22658a6afddebe26270845a6e4678685b1a0875da0fb73ed2943ea08f6d37d67` | ADOPTED |
| Git handshake | exact pushed Phase 14 candidate `eca00e6`, upstream parity before status checkpoint | PASS |
| PR #9 / CI | exact product head `eca00e6`; validate, verify, build, browser-smoke, deploy, report-build-status | 6 / 6 PASS |
| Live staging identity | cache-busted health/readiness/version | STAGING, exact `eca00e6`, D1 connected, schema 20, migration 0020 |
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
| Phase 2/3 correction | `.codex/V0_7_PHASE_2_3_CORRECTION_HANDOFF.md`; exact runtime `6c4cff6` | PASS ON STAGING |
| Governed Brand & Media slots | login background, USC logo, DOL logo, favicon | PASS — 200 image/png and source-hash parity |
| Corrected Request Center | guided source-grounded creation, separate private tracking, verified related-request lookup | PASS — 398 unit tests, 17 / 17 Worker, 94 / 318 browser, deployed smoke |
| Migration 0013 | `0013_public_request_guidance.sql` | PASS — schema 13, four guidance columns, reconciled |
| Phase 5 canonical lending catalog | `.codex/V0_7_PHASE_5_LENDING_CATALOG_HANDOFF.md`; exact runtime `fc9ef1c` | PASS ON STAGING |
| Phase 5 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 401 unit tests; 18 / 18 Worker; 94 browser passes / 224 intentional skips |
| Migration 0014 | `0014_lending_catalog_assets.sql`; private pre-export SHA-256 `27a724b944b7846606af6faefe762245e3840ddab80411197d0a766b7d6b68cc` | PASS — schema 14, governed fields, five asset tables, authoritative availability view |
| Phase 5 staging smoke | deployed Playwright at `fc9ef1c` | PASS — 4 / 4 brand, auth/access, request, and lending; fixture archived; zero reservations |
| Follow-up amendment | `.codex/specs/v0.7.0-follow-up-amendment.md`; source SHA-256 `4087844f5f32786c45ccde3d31cb55d66e4c259a556276295500032e036389c5` | ADOPTED |
| Phase 6 / Amendment Slice 1 | `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_1_HANDOFF.md`; exact runtime `fb94a1f` | PASS ON STAGING |
| Slice 1 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 401 unit tests; 19 / 19 Worker; 94 browser passes / 224 intentional skips |
| Migrations 0015–0016 | private pre-export SHA-256 `580aee95bda06388d5a46026b839141309881633eddb488a59637e31ab17c65d`; schema 16 | PASS — internal review fields, classified submissions, advertisements, idempotency |
| Slice 1 deployed acceptance | staging Playwright and live browser/API proof at `fb94a1f` | PASS — 4 / 4 suite; rotation, controls, pause, reduced motion, mobile, logo link, authorization |
| Approved advertisement media | staging public media round-trip | PASS — 139,336 bytes; source SHA-256 `1efd6ac8b69c408656b58c27c1b946d6bd8280ee3e4bf9b53aebe34b66490f30` |
| Slice 1 cleanup/reconciliation | D1 and public APIs | PASS — temporary ad archived; fixture archived/`NOT_LENDABLE`; governed public catalog count 0 |
| Slice 1 PR/CI | PR #9 exact head `fb94a1f` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 6 / Amendment Slice 2 | `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_2_HANDOFF.md`; exact runtime `5cc171a` | PASS ON STAGING |
| Slice 2 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 404 unit tests; 21 / 21 Worker; 94 browser passes / 224 intentional skips |
| Migration 0017 | private pre-export SHA-256 `8b2a39ced6450fd78837585bcdd2d4d8d8a4afe6cd2ba056034a5858e50a48d7`; schema 17 | PASS — ten governed departments and account identity/timestamp fields |
| Department account seed | live staging D1/API reconciliation | PASS — 10 / 10 mapped `REQUESTER` accounts; all `STARTER`; replay returned no credentials |
| Outside-Git credential handoff | `D:\Documents\Logistics Website Access codes.txt` | PASS — atomic, exact path, owner-restricted, untracked |
| Slice 2 deployed acceptance | health, API, session, revocation/restoration, staging Playwright | PASS — exact `5cc171a`; reversible fixture restored; public catalog count 0 |
| Slice 2 PR/CI | PR #9 exact head `5cc171a` | PASS — open draft, 6 / 6 checks |
| Phase 6 / Amendment Slice 3 | `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_3_HANDOFF.md`; exact runtime `ef4c74c` | PASS ON STAGING |
| Slice 3 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 406 unit tests; 21 / 21 Worker; 94 browser passes / 224 intentional skips |
| Migration 0018 | private pre-export SHA-256 `2154d88cc1791b37f0c9e972c090c39ca5d09ff87dddf109123af9aac29472d9`; schema 18 | PASS — department request foreign key/backfill and reconciled migration ledger |
| Slice 3 deployed acceptance | health, staging Playwright, D1 reconciliation | PASS — exact `ef4c74c`; 4 / 4 suite; New + Additional + scoped Tracking + PDF; zero request-time stock movement |
| Slice 3 cleanup | D1, public APIs, private handoff | PASS — requests archived with audit/history retained; fixtures inactive; public catalog 0; DOL `STARTER` |
| Slice 3 PR/CI | PR #9 exact head `ef4c74c` | PASS — open draft, 6 / 6 checks |
| Phase 6 / Amendment Slice 4 | `.codex/V0_7_PHASE_6_AMENDMENT_SLICE_4_HANDOFF.md`; exact runtime `afe9204` | PASS ON STAGING |
| Amendment 58-case matrix | `.codex/V0_7_AMENDMENT_58_CASE_ACCEPTANCE_MATRIX.md` | 58 / 58 PASS |
| Final amendment repository acceptance | `npm run check`; full Playwright | PASS — 60 files / 409 unit tests; 95 browser passes / 229 intentional skips |
| Governed inventory/event source | live read-only `01_ITEM_MASTER` and `13_EVENTS` | PASS — one active non-lendable item; zero approved events |
| Final amendment functional deployed acceptance | exact product/evidence commit `60a0138`; health; 4-case staging suite | PASS — 4 / 4, schema 18 / migration 0018 |
| Final amendment exact-head deployment/CI | exact candidate `afe9204`; Worker `c5863d69-e8fa-4b56-8760-e9ea21c9ed1f`; cache-busted health; governed brand/login smoke; PR checks | PASS — protected bindings present, schema 18 / migration 0018, 1 / 1 live smoke, 6 / 6 CI |
| Final amendment cleanup | D1/public API/private handoff reconciliation | PASS — catalog 0; visible fixture requests 0; request reservations/ledger 0; fixtures inactive; DOL `STARTER` |
| Phase 6 Internal Office Lending Hub | Slice 1 implementation plus final amendment matrix | PASS ON STAGING |
| Phase 7 shared internal shell | `.codex/V0_7_PHASE_7_SHARED_INTERNAL_SHELL_HANDOFF.md`; exact product/test runtime `6c1906a` | PASS ON STAGING |
| Phase 7 repository acceptance | `npm run check`; full Playwright | PASS — 60 files / 409 unit tests; 99 browser passes / 237 intentional skips |
| Five real internal routes | direct route/refresh, workspace URL/title/breadcrumb/accent/context, fail-closed unauthorized route tests | PASS |
| Department account activation | live fresh login/session reconciliation and Admin Accounts UI | PASS — 10 / 10 ACTIVE REQUESTER mappings; reset controls visible |
| Phase 7 deployed acceptance | governed R2 brand scenario; full auth/workspace/Access Management scenario | PASS — 2 / 2 at exact `6c1906a`, schema 18 |
| Phase 7 private backup | outside-Git pre-activation export SHA-256 `ddbdd9aefdde2b6013dcd8baf1702346bda89e68af180fbd19892e7e33011cb8` | CAPTURED |
| Phase 8 System Owner and operational scope | `.codex/V0_7_PHASE_8_SYSTEM_OWNER_HANDOFF.md`; exact runtime `ffe7181` | PASS ON STAGING |
| Phase 8 repository acceptance | `npm run check`; local Worker; full Playwright | PASS — 61 files / 416 unit tests; 25 / 25 Worker; 100 browser passes / 242 intentional skips |
| Migration 0019 | `0019_system_owner_operational_scope.sql`; private pre-export SHA-256 `3332b991c9c36f16d837584e4363db9375809bbf2ad8a574685a9d7e609cbc45` | PASS — schema 19, protected owner role/capabilities, reconciled migration ledger |
| Owner assignment and session boundary | private approved credential; D1 role/session reconciliation | PASS — exactly one ACTIVE owner; zero active pre-promotion sessions; no credential disclosed |
| Governed operational scope | committee/location/event/office catalogs, URL recovery, server filtering, invalid-scope denial, enriched audit context | PASS |
| Phase 8 deployed acceptance | governed brand plus owner auth/scope/route/Access Management lifecycle | PASS — 2 / 2 at exact `ffe7181`, schema 19 |
| Phase 8 PR/CI | PR #9 exact head `ffe7181` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 9 Administrator workspace | `.codex/V0_7_PHASE_9_ADMIN_WORKSPACE_HANDOFF.md`; exact runtime `e3d3c76` | PASS ON STAGING |
| Phase 9 repository acceptance | `npm run check`; full Playwright | PASS — 61 files / 416 unit tests; 104 browser passes / 250 intentional skips |
| Administrator Control Center | nine actionable exception metrics; eight complete Operations destinations; Access, Reference, Link, Audit, Health, Brand | PASS |
| Phase 9 deployed acceptance | governed brand plus owner-authenticated Control Center/Health/Brand/Access lifecycle | PASS — 2 / 2 at exact `e3d3c76`, schema 19 |
| Phase 9 PR/CI | PR #9 exact head `e3d3c76` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 10 Director workspace | `.codex/V0_7_PHASE_10_DIRECTOR_WORKSPACE_HANDOFF.md`; exact runtime `b789fab` | PASS ON STAGING |
| Phase 10 repository acceptance | `npm run check`; full Playwright | PASS — 61 files / 416 unit tests; 108 browser passes / 258 intentional skips |
| Director Executive Overview | eight actionable leadership metrics; ten complete destinations; governed progressive detail; bounded Management & Access | PASS |
| Phase 10 deployed acceptance | governed brand plus owner-authenticated refreshed Director route, identity/boundary, Admin return, and Access lifecycle | PASS — 2 / 2 at exact `b789fab`, schema 19 |
| Phase 10 PR/CI | PR #9 exact head `b789fab` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 11 Food workspace | `.codex/V0_7_PHASE_11_FOOD_WORKSPACE_HANDOFF.md`; exact runtime `7994734` | PASS ON STAGING |
| Phase 11 repository acceptance | `npm run check`; full Playwright | PASS — 61 files / 416 unit tests; 113 browser passes / 271 intentional skips |
| Food operations workspace | deadline-first event grouping; quantities; aggregate dietary context; sourcing/procurement/receiving/release; governed reference | PASS |
| Phase 11 deployed acceptance | governed brand plus owner-authenticated refreshed Food route, six destinations, identity, shared workflows, Admin return, and Access lifecycle | PASS — 2 / 2 at exact `7994734`, schema 19 |
| Phase 11 PR/CI | PR #9 exact head `7994734` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 12 Inventory & Pantry workspace | `.codex/V0_7_PHASE_12_INVENTORY_PANTRY_WORKSPACE_HANDOFF.md`; exact runtime `f37671c` | PASS ON STAGING |
| Phase 12 repository acceptance | `npm run check`; full Playwright; local Worker/D1 | PASS — 61 files / 417 unit tests; 118 browser passes / 284 intentional skips; 26 / 26 Worker tests |
| Inventory stock-truth workspace | eight complete destinations; authoritative on-hand/reserved/ATP; scoped bounded movement/assets; capability-bound actions | PASS |
| Phase 12 deployed acceptance | governed brand plus owner-authenticated refreshed Inventory route, exact D1/UI balance parity, eight destinations, Admin return, Access lifecycle, and cleanup | PASS — 2 / 2 at exact `f37671c`, schema 19 |
| Phase 12 PR/CI | PR #9 exact head `f37671c` | PASS — open draft, clean/mergeable, 6 / 6 checks |
| Phase 13 Materials workspace | `.codex/V0_7_PHASE_13_MATERIALS_WORKSPACE_HANDOFF.md`; exact runtime `653c6f8` | PASS ON STAGING |
| Phase 13 repository acceptance | `npm run check`; full Playwright; local Worker/D1 | PASS — 61 files / 417 unit tests; 123 browser passes / 297 intentional skips; 27 / 27 Worker tests |
| Materials acquisition pipeline | eight complete destinations; stable request/event/deliverable identity; exact/cumulative quantities; quote, budget, procurement, receipt, and shared release state | PASS |
| Phase 13 deployed acceptance | governed brand, canonical Materials scope/queue, eight destinations, shared workflows, auth/access lifecycle, requester privacy, borrower-safe public surface, and cleanup | PASS — 5 / 5 at exact `653c6f8`, schema 19 |
| Phase 13 PR/CI | PR #9 exact product head `653c6f8` | PASS — open draft, mergeable, 6 / 6 checks |
| Phase 14 Advanced Access Management | `.codex/V0_7_PHASE_14_ADVANCED_ACCESS_MANAGEMENT_HANDOFF.md`; exact runtime `eca00e6` | PASS ON STAGING |
| Phase 14 repository acceptance | `npm run check`; full Playwright; local Worker/D1 | PASS — 62 files / 426 unit tests; 126 browser passes / 306 intentional skips; 28 / 28 Worker tests |
| Migration 0020 | private pre-export SHA-256 `f94aa249e64851c637351328f21098c85bc3585bef289a654bec6533b9ca3301` | PASS — schema 20, durable access profiles, append-only policy changes and triggers |
| Effective access and account lifecycle | generated IDs, presets, governed scopes, preview/apply, direct-route enforcement, session revocation, one-time credentials, disable/archive/no delete | PASS |
| Phase 14 deployed acceptance | exact candidate, governed brand, Materials preservation, auth/access, advanced policy, requester privacy, borrower-safe public surface, reconciliation | PASS — 6 / 6; zero active Phase 14 or `SMOKE.%` synthetic accounts |
| Phase 14 PR/CI | PR #9 exact product head `eca00e6` | PASS — open draft, mergeable, 6 / 6 checks |
| Phase 15 protected identity roster implementation | `.codex/V0_7_PHASE_15_IDENTITY_ROSTER_IMPLEMENTATION_HANDOFF.md`; product commit `49f3dfd` | IMPLEMENTED; LIVE GATE BLOCKED |
| Phase 15 repository acceptance | `npm run check`; full Playwright; local Worker/D1 | PASS — 65 files / 433 unit tests; 126 browser passes / 306 intentional skips; 30 / 30 Worker tests |
| Migration 0021 | `0021_owner_protected_identity_roster.sql` | UNAPPLIED TO STAGING — protected projection, sync metadata, immutable rollback snapshots implemented locally |
| Approved private identity roster source | outside-Git template/setup checkpoint | BLOCKED — separate approved Sheet and Viewer-only service-account credential absent; no values invented |
| Phase 15 deployed preview/apply/rollback | staging Worker/D1/Google | UNRUN — awaits approved private source; Phase 14 staging remains accepted |
| Phase 1 rollback input | private anchor SHA-256 `39080a81dbdfb208700b7f9e24317fd27e6e36c6acd76246c6efa57df7fd1d52` | CAPTURED; rehearsal remains Phase 24 |
| Backup/rollback rehearsal | pending | UNRUN |
| Production authorization/deployment/smoke | pending | NOT AUTHORIZED UNTIL GATES PASS |

Private account IDs, database IDs, folder IDs, workbook IDs, deployment IDs, credentials, and secret values remain outside Git and are intentionally omitted.
