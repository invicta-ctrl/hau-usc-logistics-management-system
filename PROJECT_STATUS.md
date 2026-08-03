# Project Status

## v0.7.1 final-review findings repaired - correction review active

- Recovery branch `fix/v0.7.1-production-recovery` started from synchronized
  `main` at `9fb1b4e6b4e956419fa65dee55268b10c0a55da6` under the accepted
  `.codex/specs/v0.7.1-production-recovery.md` contract.
- Read-only provider truth shows production remains healthy on immutable
  v0.7.0, schema 29, with no verified staging D1/R2 binding incident.
- Slices 2 through 8 repair the client/runtime contract, authentication and
  portal shell, Staff Directory/Access Management, canonical workspace and
  quantity contracts, Canvass and Inventory governance, presentation polish,
  and release pipeline/domain preparation.
- Release-candidate code/test head
  `42f1970efbccd8c275be2cc4bc77246b5a9c97ab` passes `npm run check` with 88
  Vitest files / 576 tests, the full browser matrix with 130 passes / 326
  intentional skips, the local Worker/D1 matrix 38/38, and a binding-free
  Cloudflare preview dry-run.
- Static preview and exact-SHA package workflows contain no production
  bindings or deployment credentials. Canonical production hosts and the exact
  private workers.dev recovery hostname fail closed outside their accepted
  routes; request-only and opaque-origin runtime boundaries have direct proof.
- The first complete-candidate Sol review at `d3d4cc8` found no P0/P1, two P2s,
  and one P3. Reusable classified inventory now requires actual condition and
  maintenance outcomes; preview smoke derives the fixed Worker target from the
  authenticated Cloudflare account and withholds the URL; handoff domains are
  corrected to `*.hausc.org`.
- Production was not deployed or changed. Domain activation, private staging
  and production configuration, deployment, migration, smoke, and monitoring
  remain owner-gated. One fresh correction re-review remains, authorized only
  because confirmed P2s caused material workflow changes.

## v0.7.0 production launch and closure accepted

- Production source, annotated `v0.7.0` tag, and published release are exact
  `dc98d670fdd63f649037616c5a2d51e5c62ca4ae`; `main` is canonical.
- Production Worker/static assets, D1 schema 29, dedicated R2 bindings,
  protected configuration, Google Drive evidence, Google Sheets roster, public
  routes, and all five internal workspaces are operational and separated from
  staging.
- Controlled production smoke, responsive authorization/privacy denial,
  operational health, monitoring, recovery, and reconciliation pass with zero
  unresolved P0/P1 or mandatory `UNRUN`.
- Production truth: one active owner, 15 starter accounts, 397 imported safely
  pending items, one approved YDD series/two September days/seven activities,
  six published brand slots, and zero active synthetic/session/limiter state.
- Final zero-session 1,235,351-byte export SHA-256 is
  `1018c5e6e19c2e2da50c0910950ca40c6cbc54a77a47537951622c40621e8452`;
  independent restore integrity is `ok` with zero foreign-key violations.
- Durable closure: `.codex/V0_7_PHASE_29_PRODUCTION_CLOSURE_HANDOFF.md`.

## v0.7.0 Phase 26 final freeze accepted - Phase 27 active

- Frozen product/staging candidate
  `4cba9f09ebd88085f1f93f0c4d37fbb8c185c4c3` is healthy on schema 29 /
  migration 0029 with the required staging bindings and readiness true.
- A bounded compatibility repair prevents malformed retained history metadata
  from failing lending projection; focused regression coverage and live HTTP
  200 acceptance pass without deleting immutable history.
- `npm run check` passes 76 Vitest files / 495 tests and every repository gate;
  the controlled deployed browser matrix passes 15 / 15 and exact-product-head
  CI passes 6 / 6.
- Final reconciliation leaves no active synthetic workflow, event, evidence,
  session, or limiter state; the temporary owner is disabled and denied.
- Immutable hashes, schema identity, D1 export/bookmark, safe R2 inventory,
  Worker-version capture, rollback evidence, and the complete launch package
  are preserved privately.
- Production remains untouched and NO-GO. Phase 27 branch consolidation,
  reference preservation, merge-identity rebinding, and affected-gate reruns
  are active.

## v0.7.0 Phase 25 production preflight accepted — Phase 26 active

- Exact candidate `73612344a7e0b1f533ff56a3e24695176bb9a75e` is pushed and
  bound to a complete outside-Git production authorization package.
- Distinct production Worker/D1/R2/Google targets, complete protected secrets,
  observability, approved target labels, fresh export/bookmark, rollback, and
  negative fail-closed cases pass the production launch preflight.
- The dedicated roster reader passed a live read-only 128-row/13-column source
  check; six private OAuth-created production Drive roles were verified without
  exposing provider identifiers or cell values.
- `npm run check` passes 75 Vitest files / 494 tests and every repository gate;
  the exact production Wrangler package passes dry-run without upload.
- Production remains untouched and NO-GO. Phase 26 exact-candidate staging,
  full deployed browser, CI, and immutable final-freeze evidence are active.

## v0.7.0 Phase 24 backup/retention/rollback accepted — Phase 25 active

- A fresh private 3,265,192-byte schema-29 D1 export has integrity `ok`, zero
  foreign-key violations, and SHA-256
  `ba8c039a5ebbdfb56103fd49baee5d3eade9b06985023d826d4e8fc1fcd28c42`.
- A Time Travel bookmark, encrypted 127-row Google source snapshot, 464 rows of
  R2 metadata, and retained prior/final Worker version mappings are preserved
  outside Git.
- All 42 labeled synthetic accounts are disabled or revoked; 30 append-only
  guards remain. Numeric evidence retention awaits HAU policy, so no automated
  purge is authorized.
- The real staging rollback `d095685 → 7c47f22 → d095685` passed identity,
  compatibility, auth/request/lending/release smoke, and byte-identical D1
  reconciliation. Production was untouched.
- Phase 25 production authorization, resource separation, and fail-closed
  read-only preflight is active. Production remains NO-GO.

## v0.7.0 Phase 23 accessibility/performance/capacity accepted — Phase 24 active

- Exact staging runtime `d095685e223be2697cc72582d35967e70cfd5163`
  is healthy on schema 29 / migration 0029; production was untouched.
- Live acceptance passed 5 / 5 across 390 px, approximately 820 px, and
  1366 px, including keyboard, focus, labels/errors, accessible names,
  contrast, touch targets, reduced motion, overflow, and desktop 200% zoom.
- Page, bootstrap, route, API, D1, payload, repeated-request, and polling
  behavior was measured. Bounded login/request/lending limits failed closed;
  focused capacity/concurrency/idempotency coverage passed 52 / 52.
- `npm run check` passes 74 Vitest files / 480 tests and every repository gate;
  exact product-head PR #9 CI passes 6 / 6.
- The temporary owner is disabled with zero sessions and HTTP 403 denial. All
  Phase 23 limiter rows are removed; immutable enable/disable and correction
  audits remain.
- Phase 24 backup, cleanup, retention, and real staging rollback rehearsal is
  active. Production remains NO-GO.

## v0.7.0 Phase 22 full staging acceptance complete — Phase 23 active

- Exact staging runtime `7c47f229c43e36bcf28273998a48b36aeb3aaedd`
  is healthy on schema 29 / migration 0029; production was untouched.
- Private sampled observability passed six traces and six structured
  application logs with timings, correlation IDs, application-message
  redaction, and staging-only binding proof.
- Reusable assets can enter later loans after return while every historical
  assignment remains retained. Materials scope changes now render canonical
  server truth without fabricated zero values or stale in-flight results.
- `npm run check` passes 74 Vitest files / 477 tests and every repository gate.
  Focused Materials and Request Center staging reruns pass, and the final
  deployed operations matrix passes 10 / 10.
- Final reconciliation leaves zero fixture sessions, active reservations,
  active requests, and active public lending. Temporary credentials are
  denied; two synthetic items and seven asset instances are archived; prior
  department/event snapshots are restored; 50 cleanup audits remain.
- Phase 23 accessibility, responsiveness, performance, and bounded capacity
  acceptance is active. Production remains NO-GO.

## v0.7.0 Phase 21 operational health accepted — Phase 22 active

- The protected System Owner surface reports 16 safe operational metrics for
  release, Worker/API, D1, bindings, authentication, provider/storage state,
  evidence failures, rate limits, inventory alerts, and recovery checkpoints.
- Unavailable email/roster provider state and unrecorded backup/rollback state
  render as `ATTENTION`, `NOT_CONFIGURED`, or `Not recorded`; no synthetic
  healthy state is shown.
- Desktop and 390×844 staging acceptance passed without overflow. The live DTO
  and UI omit credentials, account/provider identifiers, raw errors, object
  keys, OAuth values, private URLs, and personal data.
- Administrator UI controls are hidden and the owner API returns 403
  `SYSTEM_OWNER_REQUIRED`. Both synthetic actors are disabled, sessions are
  zero, and immutable create/disable audits remain.
- Repository acceptance passed 74 Vitest files / 477 tests, Worker 34 / 34,
  browser 127 / 311 intentional skips, and exact-product-head PR #9 CI 6 / 6.
- Exact runtime `3c5b7aa1b1166775fffce9ef8e5275e0eef65021` is healthy and ready
  on staging schema 28. Production was untouched.
- Phase 22 full staging and operations acceptance is active.

## v0.7.0 Phase 20 privacy, consent, and support accepted — Phase 21 active

- Accessible Privacy Notice and Acceptable Use dialogs explain collected data,
  purposes, authorized reviewers, private tracking, borrower responsibility,
  evidence/photo consent, governed retention, correction, and support paths.
- Public services reject missing acknowledgments and record the policy version
  plus boolean acceptance in protected audit metadata. No institutional
  contact, legal basis, or retention duration was invented.
- Privacy-safe errors, URLs, structured logs, requester PDF receipts, lending
  receipts, unauthorized responses, and the absence of analytics were audited.
- Repository acceptance passed 73 Vitest files / 474 tests and every required
  gate; fresh Worker acceptance passed 34 / 34; the responsive browser matrix
  passed 127 with 311 intentional skips.
- Exact runtime `4709e844f1bfcb0309cb1a2feeca2f66d9aeab89` is healthy and ready
  on schema 28; deployed 390px/1440px policy acceptance passed; exact-head PR
  #9 CI passed 6 / 6. No live workflow fixture was created and production was
  untouched.
- Phase 21 Owner Operational Health is active and must expose safe redacted
  status only.

## v0.7.0 Phase 19 governed brand assets accepted — Phase 20 active

- Migration 0028 adds the owner-only brand capability, six-slot registry,
  immutable retained versions, publication pointers, optimistic revisions,
  replay safety, and append-only lifecycle history/audit.
- Protected System Owner workflows cover upload, preview, publish, replace,
  rollback, alt text, and version history. Administrator is read only.
- Staging reconciles six published slots, seven retained versions, and fifteen
  lifecycle/history rows. Media type is derived from bytes; size, dimensions,
  SVG safety, content hashes, duplicates, and environment separation fail
  closed.
- Repository acceptance passed 72 Vitest files / 467 tests and every required
  gate; the full responsive browser matrix passed 127 with 311 intentional
  skips; fresh local Worker/D1/R2 acceptance passed 34 / 34.
- Exact runtime `f8b19f6be042c995ad0ae01f420d15ac191cfdad` is healthy and ready
  on schema 28 / migration `0028_brand_asset_governance.sql`; PR #9 passed all
  6 / 6 checks. The synthetic owner was disabled and sessions revoked after
  deployed mobile/desktop acceptance. Production remains NO-GO.
- Phase 20 Privacy, Consent, and Support is active. Institutional policy,
  contact, and retention values must not be invented.

## v0.7.0 Phase 18 approved-event source gate — resolved and accepted

- The owner designated the complete September 1–2 Youth Development Days 2026
  record as authoritative and superseded the August 10/12 planning schedule.
  The schedules were not merged.
- Schema 27, protected Administrator/Director event management, deterministic
  seeding, links, truthful null/TBA presentation, and append-only Activity
  History/audit passed staging acceptance.
- Staging reconciles one event series, two active September days, seven
  activities, no active August days, and no duplicates at exact runtime
  `80c0db43cc06145ada09434fd55f3fd31c0873f7`.
- Unknown operational values remain nullable and owner-review-required; they
  are not fabricated and did not block acceptance. Production was untouched.

## v0.7.0 Phase 17 inventory data readiness accepted on staging — Phase 18 active

- A private immutable snapshot of the authoritative 397-row item master was
  captured and hash-validated without modifying Google data or exposing source
  identifiers.
- The import now creates append-only idempotent opening-balance ledger
  movements, keeps catalog opening metadata at zero, quarantines duplicate IDs,
  and reports complete reconciliation.
- Fresh isolated D1 migrations through schema 26, import, and exact replay
  passed with 397 imported / 0 rejected, zero opening count/quantity
  difference, zero negative stock, and zero active mock inventory.
- The owner-approved safe-classification amendment permits all 397
  `TO_CLASSIFY` rows to import as `UNVERIFIED` / `NEEDS_CLASSIFICATION` while
  remaining non-lendable and excluded from lending submission, approval, and
  handoff.
- Additive schemas 25–26, append-only classification history, a protected
  search/filter/progress queue, individual review, safe non-lendable bulk
  review, explicit lending confirmation, condition/maintenance gating, and
  physical asset-tag creation are implemented locally.
- Repository acceptance passed 71 Vitest files / 464 tests and every required
  gate; isolated Worker/D1 acceptance passed 31 / 31 on schema 26; full browser
  coverage passed 126 with 306 intentional skips; focused Inventory queue/API
  browser evidence remains green.
- A private backup preceded migrations 0024–0026. Staging imported 397 / 397
  rows with zero rejected, replayed exactly, and reconciled zero unsafe
  lending, opening differences, negative balances, scope gaps, duplicate
  handoffs/returns, and active mock inventory.
- Live owner acceptance classified one synthetic reusable asset with explicit
  physical verification and audited history; a separate pending item was
  denied by the lending API with no ticket. Cleanup archived both items and
  the asset, disabled lending, and retained append-only history.
- Exact runtime `03b408826d993be0c79692e15b86b38fc97dadf6` is healthy and ready
  on schema 26 / migration `0026_fail_closed_legacy_inventory.sql`; the pushed
  product head passed all 6 / 6 PR checks.
- Phase 17 is accepted. Phase 18 must now read only approved future-event
  sources and create the required owner-review queue if the previously empty
  governed source remains empty. Production remains NO-GO.

## v0.7.0 Phase 16 Shared Release Desk accepted on staging — Phase 17 active

- Exact runtime `ac83af82aec2e42ae839d8b4975947ebf0a1526a` is healthy and ready on schema 23 / migration `0023_hybrid_evidence_storage.sql`.
- One canonical Shared Release Desk now proves reservation, stock revalidation, partial/completed/final handoff, explicit recipient and evidence, duplicate-safe replay, append-only ISSUE movements, Owner-only correction, compensating reversal, and scoped request/release/inventory projections.
- The protected System Status presents all seven required R2/Drive/reconciliation/restore metrics only to the System Owner and keeps storage identifiers, OAuth values, and raw provider errors out of ordinary UI.
- Verification: `npm run check` passed with 70 Vitest files / 457 tests; local Worker/D1 passed 30 / 30; full browser coverage passed 126 / 306 intentional skips; focused exact-runtime staging acceptance passed 1 / 1; draft PR #9 passed 6 / 6 checks.
- The synthetic event/item baseline is restored, on-hand is `1`, effective reserved is `0`, and all Release Desk acceptance evidence is `ARCHIVED` with both private copies retained. Production was untouched and remains NO-GO.

## v0.7.0 Phase 9 Administrator workspace accepted on staging — Phase 10 active

- Exact runtime `e3d3c761369f09807d90982576818a6c8406e637` is healthy and ready on schema 19 / migration `0019_system_owner_operational_scope.sql`.
- The Administrator Control Center now prioritizes nine actionable exception signals and opens the relevant existing workflow. All required Operations destinations are present, including a distinct Release Desk, validated Receiving, and Evidence status.
- Access Management, Reference Data, Link Registry, Audit & System, Operational Health, and governed Brand Assets are real control destinations; later advanced lifecycle phases remain separate.
- Verification: `npm run check` passed with 61 Vitest files / 416 tests; full Playwright passed 104 / 250 intentional skips; deployed brand and owner-authenticated Control Center/Access acceptance passed 2 / 2; PR #9 passed 6 / 6 checks.
- Production remains NO-GO. Phase 10 owns completion of the Director workspace.

## v0.7.0 Phase 8 System Owner accepted on staging — Phase 9 active

- Exact product/runtime `ffe71817583518ac396d33554820bb1407fce756` is healthy and ready on schema 19 / migration `0019_system_owner_operational_scope.sql`.
- One protected System Owner can enter every real workspace and Release Desk without impersonation. Governed committee, location, event, and office scopes filter server reads, reject invalid context, and never grant authority.
- Consequential operational audits capture the real actor/role, active workspace, selected scope, reason, time, and correlation identifier. Normal Administrator permissions remain capability-bound.
- Verification: `npm run check` passed with 61 Vitest files / 416 tests; local Worker passed 25 / 25; full Playwright passed 100 / 242 intentional skips; deployed brand and complete owner/auth/Access Management acceptance passed 2 / 2; PR #9 passed 6 / 6 checks.
- Production remains NO-GO. Phase 9 owns completion of the Administrator workspace.

## v0.7.0 Phase 7 shared internal shell accepted on staging — Phase 8 active

- Exact product/test runtime `6c1906ad299edfb878de7f86615287370eca90a8` is healthy and ready on schema 18 / migration `0018_authenticated_request_center.sql`.
- One authenticated internal shell now owns all five real workspace routes, responsive navigation, safe Administrator workspace switching, governed scope/context, breadcrumbs, release/attention identity, and the account menu without impersonation or permission expansion.
- The ten approved department accounts are active and freshly verified 10 / 10; every Admin Accounts row shows the correct department/status and reset control. Plaintext credentials remain outside Git.
- Verification: `npm run check` passed with 60 Vitest files / 409 tests; full Playwright passed 99 / 237 intentional skips; deployed brand and auth/Access Management passed 2 / 2; PR #9 passed 6 / 6 checks.
- Production remains NO-GO. Phase 8 owns System Owner global access and governed operational scope.

## v0.7.0 Phase 5 canonical lendable catalog accepted on staging — Phase 6 active

- Exact staging runtime `fc9ef1ccc5fef9018d37157a13078773c9018a13` is healthy and ready on schema 14 / migration `0014_lending_catalog_assets.sql`.
- The canonical Inventory Management catalog now owns governed lending fields, borrower-safe presentation, staff-only availability/return signals, reusable asset instances, condition/maintenance history, and one authoritative availability model.
- Verification: `npm run check` passed with 58 Vitest files / 401 tests; local Worker/D1 passed 18 / 18; full Playwright passed 94 / 318 scheduled with 224 intentional skips; deployed staging acceptance passed 4 / 4; PR #9 passed 6 / 6 checks.
- The audited synthetic item is archived and `NOT_LENDABLE`; zero real public catalog items and zero reservations remain. No institutional item policy was invented.
- Production remains NO-GO. Phase 6 now owns the complete internal Office Lending Hub.

## v0.7.0 Phase 2/3 targeted correction accepted on staging — Phase 5 active

- Exact runtime `6c4cff601b04b64d9327ac1308d2cc2cab59e584` corrects live governed brand routing/login presentation and restores the guided source-grounded Request Center with separate private tracking.
- Local acceptance passed: `npm run check` with 398 tests, local Worker/D1 17 / 17, and full Playwright 94 passed / 224 intentional skips / zero failures.
- Official DOL/HAU-USC assets and the campus background passed live MIME and source-hash verification; responsive login checks passed at 1366, 820, and 390 pixels.
- Migration 0013 and four deployed acceptance scenarios passed. The synthetic lending fixture is re-archived, the accepted Phase 4 backend is preserved, and production remains NO-GO.

## v0.7.0 Phase 4 public Lending Center accepted on staging — Phase 5 active

- Exact staging runtime `8e5c25df3e498b6627b5ebc88db0c8cf9b71c849` is healthy and ready on schema 12 / migration `0012_public_lending_tracking.sql`.
- `/lending` is direct no-login, catalog-first, validates external borrowers, routes multi-item submissions into canonical internal `FOR_REVIEW` tickets, privately tracks them, and creates no reservation or stock movement.
- Verification: `npm run check` passed with 57 Vitest files / 393 tests; local Worker/D1 passed 17 / 17; full Playwright passed 94 / 318 scheduled with 224 intentional skips; deployed staging acceptance passed 3 / 3.
- The only technical smoke item was synthetic/audited and is archived. Real public-lending eligibility remains empty; Phase 5 must complete the governed canonical catalog without inventing policy.
- Production remains NO-GO.

## v0.7.0 Phase 3 public Request Center accepted on staging — Phase 4 active

- Exact staging runtime `6fbf377bb96f9e5123a24c8e1d81726ae5769532` is healthy and ready on schema 11 / migration `0011_public_request_tracking.sql`.
- `/request` is a direct no-login, unified composer with governed choices, idempotent `FOR_REVIEW` submission, private HMAC-backed tracking, distributed attempt limiting, and no stock movement.
- Verification: `npm run check` passed with 57 Vitest files / 393 tests; local Worker/D1 passed 16 / 16; full Playwright passed 93 / 312 scheduled with 219 intentional skips; deployed staging acceptance passed 2 / 2.
- Production remains NO-GO. Phase 4 now owns the genuinely no-login `/lending` catalog, borrowing request, and private tracking boundary.

## v0.7.0 Phase 2 staff login accepted on staging — Phase 3 active

- Exact staging runtime `edf6dcb361a8ade04f43ff06a774f6672305aa9a` is healthy and ready on schema 10 / migration `0010_verified_login_email.sql`.
- Delivered the HAU-inspired staff login, governed R2 background slot, accessible password visibility, recovery/state UX, and unique verified-email sign-in without weakening server authorization.
- Reconciliation preserved all accounts and produced zero verified-email collisions; ambiguous legacy duplicates remain safely Access-ID-only.
- Verification: `npm run check` passed with 57 Vitest files / 392 tests; full Playwright passed 92 / 306 scheduled with 214 intentional skips; deployed staging smoke passed 1 / 1.
- Production remains NO-GO. Phase 3 now owns the genuinely no-login `/request` flow and private tracking boundary.

## v0.7.0 Phase 1 staging foundation accepted — Phase 2 active

- Active specification: `.codex/specs/v0.7.0-production-master.md`; Phase 1 runtime `8b4af047642e6db6f0314ce70bfb611ed8c7679d` is deployed to staging.
- Infrastructure: distinct staging/production D1 and R2 resources exist; the production Worker remains intentionally unuploaded. Private config separation passes; staging protected secrets, Logs, Traces, R2, correlation logging, and health/readiness/version are operational.
- Verification: `npm run check` passes 56 Vitest files / 389 tests; fresh local Worker/D1 passes 15 / 15; deployed auth/Access Management passes 1 / 1.
- Production remains NO-GO. Full product phases, staging operations acceptance, backup/rollback rehearsal, branch consolidation, final freeze, production authorization, merge/tag/release, production deployment, and smoke remain incomplete.
- Approved inventory currently contains one canonical item. Approved future events and brand-asset registry rows are empty; event values must be obtained before final freeze rather than invented.
- Next action: Phase 2 HAU-inspired staff-login acceptance, then continuous public Request/Lending and workspace completion.

## v0.6 Phase 3 active - local Cloudflare/D1 candidate verified; remote staging authorization required

- Phase/stage: `PHASE_3_LOCAL_CANDIDATE_VERIFIED_PRIVATE_GATE_REQUIRED`; Phase 2 predecessor/handoff is `38a86069039ef18081aaa0e1c1fe2c25acde6613`; partial handoff: `.codex/PHASE_3_STAGING_CANDIDATE_HANDOFF.md`.
- Delivered locally: Workers Static Assets and same-origin API routing; D1 authentication, activation, sessions, logout, distributed rate limiting, operations, migrations, guards, scope, idempotency, import/reconciliation; read-only Sheet exporter; private authorization tooling; Cloudflare/Google/D1/rollback documentation.
- Local evidence: workerd/D1 Chromium acceptance passes 10/10 across request-only privacy, all five role experiences, split allocation/release/lending, canvass/procurement/cumulative receiving, restock receiving, duplicate guards, and fail-closed evidence; repository acceptance passes with 52 Vitest files / 369 tests and full Playwright passes 90 / 204 intentional skips / 0 failures; a fictional outside-Git export imported twice and reconciled without duplication.
- Frozen repository candidate: `62abc6d1e1d6b3079e8508381b7c336c636080e5`, exact range `38a86069039ef18081aaa0e1c1fe2c25acde6613..62abc6d1e1d6b3079e8508381b7c336c636080e5`; pushed at local/upstream/PR-head parity. Draft PR #9 was open and mergeable and all six checks passed on 2026-07-22.
- External boundary: no Cloudflare/Google identity or target read, remote D1 access, deployment, approved Sheet export/import, Drive/evidence operation, staging workflow mutation, rollback rehearsal, production action, `main` update, or PR merge occurred.
- Remaining gate: provide a valid outside-Git package matching the frozen candidate's branch/SHA/artifact/Worker/mapping/migration hashes and approving Gate B. Until then Phase 3 and the working staging website remain incomplete.

## v0.6 Phase 2 complete - ready for manual Phase 3 model switch

- Phase/stage: `PHASE_2_TERRA_COMPLETE` at exact delivery checkpoint `de194f5c37cadf2eb2983cfe3450a1c99ceed735`; durable handoff: `.codex/PHASE_2_TERRA_HANDOFF.md`.
- Delivered: one shared shell; Administrator, Director, Food, Inventory & Pantry, and Materials experiences; Request Center; Lending Hub; Release Desk; Inventory/Restocking; Canvass; Procurement/Deliverables; inherited login/onboarding; responsive mobile behavior; 13 tracked previews; and focused operator/role guides.
- Final acceptance: `npm run check` passes with 49 Vitest files / 356 tests and deterministic build/package validation. Opt-in preview generation passes 3 / 3 with 3 intentional project skips. Normal complete Playwright passes 90 / 204 intentional project/viewport skips / 0 failures without changing tracked preview hashes. `dist/index.html` is 455,779 bytes / SHA-256 `369ef83f8cdfe520049ae26fc853e70072ed54f9196a2899adff09dbd93ea8ed`.
- Remote: draft PR #9 is open and mergeable at exact head `de194f5`; `validate`, `verify`, `build`, `report-build-status`, automatic `deploy`, and `browser-smoke` all pass. No manual deployment, production promotion, institutional write, `main` update, or PR merge occurred.
- Remaining gates: Phase 3 still owns Worker/D1 persistence, distributed controls, migration/reconciliation, integration hardening, and final program acceptance. Venue/Equipment activation still requires an approved external reference/routing list. Production remains gated.
- Next action: manually switch to GPT-5.6 Sol High in a fresh task and perform the repository/PR/CI start handshake before reading and executing the Phase 3 specification.

## v0.6 Phase 2 active - Gate 6 shared operational workflows checkpointed

- Phase/stage: `PHASE_2_GATE_6_OPERATIONAL_WORKFLOWS_CHECKPOINTED` at code commit `478c2feef3040469c820f356ec8a329a32fbc606`.
- Release Desk: exact selected-line quantities, recipient identity/role/department, notes, releasing staff/time, explicit recipient attestation, and optional photo capture are retained in one traceable confirmation. Server preflight now validates every selected line and aggregate balance before mutation while preserving the lock, idempotency, authorization, audit, reservation, and append-only ledger contracts.
- Inventory/Restocking: on-hand, reserved, and available-to-promise remain ledger-derived and separate; existing aliases, predictive search, provenance, movement history, archive/restore, accepted restock statuses, revision checks, preferred-quote gates, immutable receipts, and line-isolated cumulative receiving are verified unchanged.
- Canvass/Procurement: large-list search/filter/pagination, comparison, preferred quotes, price history, safe evidence/source links, and explicit stale/missing-unit/mismatch indicators are present. Deliverable receiving is limited to `PROCURED`/`PARTIALLY_RECEIVED`, labels each entry as received now, and exposes cumulative received/remaining/total values without changing domain invariants.
- Verification: `npm run check` passes with 49 Vitest files / 356 tests, deterministic build/parity/package verification, Apps Script validation, and standalone verification. Focused Gate 6 Playwright passes 6 / 6 at 390px and 1366px; full Playwright passes 90 / 186 intentional skips / 0 failures. `dist/index.html` is 455,785 bytes with SHA-256 `1fc85c15b361136824ab9c8156b67b30607dcb2157a3bbfc21a4155fd02240e8`.
- Remote: draft PR #9 head matches `478c2fe`; `validate`, `verify`, `build`, `report-build-status`, automatic `deploy`, and `browser-smoke` all pass. No manual deployment, production promotion, institutional write, `main` update, or PR merge occurred.
- Next action: prepare and inspect the deterministic Phase 2 experience previews, then complete the minimum authoritative guides and final Phase 2 handoff.

## v0.6 Phase 2 active - Gate 5 Request Center and Lending Hub checkpointed

- Phase/stage: `PHASE_2_GATE_5_REQUEST_LENDING_CHECKPOINTED` at code commit `09315fbb68119aa55e16bba26b4926b60b3dfba9`.
- Delivered: the Request Center retains Event Logistics and Catalog Restock, same-event original-request selection, combined dates, predictive item search, explicit Issue/Canvass/Split presentation, and review-only submission with no stock deduction. Event Step 4 exposes Food, Materials, and Venue & Equipment together and omits every untouched child.
- Lending: new tickets accept only one to eight Student ID digits at both client and Apps Script service boundaries. Approval requires an authorized reviewer to attest the approved active USC source for officers/staff or the approved Angelite/student identity rule; domain-only approval is explicitly insufficient and the source/reviewer are retained in history/audit metadata.
- Boundaries: form/ticket separation, loan and consumable lifecycles, inventory eligibility, server stock revalidation, reservations, idempotency, duplicate handoff/return prevention, authentication, authorization, and append-only ledger rules remain unchanged. No schema migration or external-system action was needed.
- Verification: `npm run check` passes with 46 Vitest files / 348 tests, deterministic build/parity/package verification, and Apps Script validation. Focused Request/Lending/composite Playwright passes 29 / 31 intentional skips across configured viewports. `dist/index.html` is 448,084 bytes with SHA-256 `a4698f75f7c2b2bb4129be0f7c655945ed40d0d9c8c9f8540a8401de876e839c`.
- Next action: push and verify this checkpoint and PR #9 CI, then complete only Gate 6 operational workflow acceptance.

## v0.6 Phase 2 active - Materials & Documentation experience checkpointed

- Phase/stage: `PHASE_2_MATERIALS_DOCUMENTATION_EXPERIENCE_CHECKPOINTED` at code commit `67c542263431c813cb5ae6488cbdacf38e74fbae`.
- Delivered: the supplied S0002 `MATERIALS.html` reference was read in isolation and recorded in `.codex/DESIGN_REFERENCE_DIGEST.md`; the shared role layer now presents canvassing, budget, procurement, and release-readiness signals with governed links into the existing Request Center, Procurement & Deliverables, Release Desk, and Inventory workspaces.
- Boundaries: exact specification, event/request identity, quote freshness/evidence, cumulative receiving, deliverable quantities, and provenance remain connected. The blue accent and Materials ownership communicate scope only; quote preference, purchase, receipt, stock transfer, and release remain capability-bound and server-validated.
- Verification: focused role unit tests pass 4 / 4; the combined role browser proof passes 8 / 16 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with 46 Vitest files / 345 tests, build/parity/package verification, and Apps Script validation.
- Next action: push and verify this checkpoint, then audit and complete only Gate 5 Request Center and Office Lending Hub acceptance.

## v0.6 Phase 2 active - Inventory & Pantry experience checkpointed

- Phase/stage: `PHASE_2_INVENTORY_PANTRY_EXPERIENCE_CHECKPOINTED` at code commit `bf350fe1f1bbd06c547cdcf8bbf71fa66b5035c6`.
- Delivered: the S0002 Inventory reference was read in isolation and recorded in `.codex/DESIGN_REFERENCE_DIGEST.md`; the shared role layer now presents exception-first catalog attention, circulation, and release-readiness signals with governed links into the existing Inventory, Lending, Restocking, and Release workspaces.
- Boundaries: on-hand, reserved, and available-to-promise remain distinct. The amber accent and Inventory ownership communicate scope only; reservations, receipts, loans, returns, releases, transfers, and corrections remain capability-bound, revalidated, and ledger-aware.
- Verification: focused role unit tests pass 3 / 3; the combined role browser proof passes 6 / 12 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with 46 Vitest files / 344 tests, build/parity/package verification, and Apps Script validation.
- Next action: push and verify this checkpoint, then begin only the authorized Materials & Documentation role slice.

## v0.6 Phase 2 active - Food experience checkpointed

- Phase/stage: `PHASE_2_FOOD_EXPERIENCE_CHECKPOINTED` at code commit `a6bcd7e3be934479496ce6fc05e43903989420a0`.
- Delivered: the S0002 Food reference was read in isolation and recorded in `.codex/DESIGN_REFERENCE_DIGEST.md`; the shared role layer now presents deadline-first food requirements, sourcing/budget, cumulative receiving, and controlled-distribution signals with links into existing shared workspaces.
- Boundaries: the orange accent and Food ownership communicate scope only. Procurement, receiving, evidence, and Release Desk authority remain capability-bound and server-validated; no service, transaction, ledger, or authorization contract changed.
- Verification: focused role unit tests pass 2 / 2; Food responsive browser proof passes 2 / 4 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with 46 Vitest files / 343 tests, build/parity/package verification, and Apps Script validation.
- Next action: push and verify this checkpoint, then begin only the authorized Inventory & Pantry role slice.

## v0.6 Phase 2 active - Director experience checkpointed

- Phase/stage: `PHASE_2_DIRECTOR_EXPERIENCE_CHECKPOINTED` at code commit `c54d68af372865be272eda0331f8258b7d84858f`.
- Delivered: the S0002 Director reference was read in isolation and recorded in `.codex/DESIGN_REFERENCE_DIGEST.md`; the shared overview now adds server-derived event-series, leadership-decision, blocker, and release-readiness signals plus governed links to the existing request, procurement, release, lending, and inventory workspaces.
- Boundaries: the Director experience remains one shared application. Its Management & Access explanation grants no role, capability, configuration, environment, service, or ledger path; existing server authorization remains authoritative.
- Verification: focused role unit tests pass 2 / 2; responsive browser proof passes 2 / 4 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with 46 Vitest files / 342 tests, build/parity/package verification, and Apps Script validation.
- Next action: push and verify this checkpoint, then begin only the already-authorized Food role slice.

## v0.6 Phase 2 active - Administrator control desk checkpointed

- Phase/stage: `PHASE_2_ADMINISTRATOR_CONTROL_DESK_CHECKPOINTED` at code commit `658410b24b6556131d11901551911d553a1832b7`.
- Delivered: the S0002 Administrator reference was read in isolation and recorded in `.codex/DESIGN_REFERENCE_DIGEST.md`; the existing authorized Reference Administration workspace now leads with exception-first governance context and four explicit control areas: Access Management, Reference Data, Link Registry, and Audit & System.
- Boundaries: each control card selects an existing server-authorized domain only. It cannot grant a role or capability, alter a service, bypass second review, mutate a ledger, or expose protected configuration. Roster-owned and Sync Health domains remain read-only.
- Verification: focused Administrator unit tests pass 10 / 10; focused browser proof passes 6 / 24 intentional skips; `npm run check` passes with 45 Vitest files / 341 tests, build/parity/package verification, and Apps Script validation.
- Next action: stop pending a new explicitly authorized role slice; do not ingest another role reference automatically.

## v0.6 Phase 2 active - shared shell/design-system milestone verified

- Phase/stage: `PHASE_2_SHARED_SHELL_CHECKPOINTED`.
- Branch/PR: `chore/v0.6-codex-continuity-bootstrap`; draft PR #9 remains open at remote handoff `d8af7bb4a5e986fc4dfd166ae664f5758c46a1fd`, cleanly mergeable with successful `validate`, `verify`, and `browser-smoke` checks.
- Delivered: S0003 was ingested once and condensed into `.codex/DESIGN_REFERENCE_DIGEST.md`; the shared internal shell now has durable visual tokens, role-scoped accents, shared panel/status/action grammar, a compact mobile header, five primary mobile destinations, and a More panel for remaining existing destinations.
- Boundaries: all navigation delegates to existing handlers; no authorization, session, ledger, transaction, deployment, data, or external-system behavior changed. The generated legacy visual baseline remains untouched and derived artifacts were rebuilt.
- Verification: `npm run check` passes with 45 Vitest files / 341 tests, and the complete `npx playwright test --reporter=dot` gate completed with `status: passed` (216 tests scheduled; no failed tests). Build/parity/package verification and responsive browser proofs at 390, 768, and 1366px also pass. The next bounded action is Administrator-only S0002 ingestion and experience work.

## v0.6 Phase 1 complete - ready for manual Phase 2 model switch

- Phase/stage: `PHASE_1_COMPLETE_READY_FOR_MANUAL_MODEL_SWITCH`.
- Branch: `chore/v0.6-codex-continuity-bootstrap`.
- Verified implementation checkpoint: `c07e6e6ad5777710a68bef4d1d2aa553b964c108`.
- Rollback checkpoint before the authentication foundation: `aeb05c71937b8479f66d08a9a64800b005343784`.
- Draft pull request: PR #9, `feat(v0.6): establish Phase 1 security foundation`; `validate`, `verify`, and `browser-smoke` pass at implementation checkpoint `c07e6e6`.
- Delivered: history-preserving v0.5 integration; locked v0.6 architecture/security/threat/migration contracts; portable authentication, first-login activation, session/CSRF, account lifecycle, password reset, canonical authorization, cookie/HTTP, synthetic repository, client gateway, and focused negative tests.
- Local verification: `npm run check` passed with governance, lint, 44 Vitest files / 340 tests, deterministic build, 33 Apps Script sources / 55 required functions, generated parity, and eight standalone artifacts; full Playwright passed 73 / 143 intentional skips / 0 failed.
- Privacy review: changed-source sensitive-token and sensitive-filename scans returned zero matches; no private config, institutional record, raw credential, or external identifier entered Git.
- External boundary: source branch and draft PR only. No Apps Script deployment, Sheet/Drive write, D1 migration, Cloudflare deployment, production action, `main` update, or PR merge occurred.
- Remaining known risk: the in-memory repository and sliding-window limiter are synthetic Phase 1 adapters, not multi-instance production infrastructure. Phase 3 must supply reviewed Worker/D1 persistence, distributed rate limiting, transport wiring, migration/reconciliation, secrets, and deployment hardening before cutover.
- Intentionally unrun: no live Cloudflare Worker/D1, Apps Script, Sheet, Drive, institutional-account, migration, deployment, or production test; those actions were outside Phase 1 authority.
- Next required model/spec: GPT-5.6 Terra and `.codex/specs/v0.6-phase-2-terra.md` in a new Codex task.

## Current implemented baseline

- Implemented repository baseline: `0.5.0`
- v0.6 transition preparation date: `2026-07-21`
- Active continuity branch: `chore/v0.6-codex-continuity-bootstrap`
- Preserved launch-readiness predecessor: `81efe82618048b79a821f93bd95a0be00eaeff43`
- `main` / merge-base checkpoint at continuity setup: `91a30ee2de015bce1471a2d4fd71d9325af3e936`
- Preserved predecessor relationship at continuity setup: `63` commits ahead / `0` behind `main`
- Historical PR #2: **closed, not merged**
- Historical branch `feat/apps-script-backend-and-launch-readiness`: absent as a remote branch when continuity setup began
- Integrated source branch: `integration/v0.5-baseline` at `12cdfd4de73120bfeedf49582c83e1861ae36b99`
- Baseline status: Slices 1-3 staging-accepted; Slices 4-12 committed and CI-verified; Slice 13 Gate E remains partial
- Accepted Slice 12 starting commit: `6fa6222adde5e8314d2defc40e0cd6686fff953b` (Slice 11 final evidence checkpoint)
- Current repository checkpoint: Slice 13 mobile containment `24ef0b9d435eca1522e9b72dc449167453266618` is pushed and CI-green on top of progressive-bootstrap repair `4211711c78ce382a54b57a96aca01d17252ffd6c`; Gates A-D are complete and Gate E is partially complete
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Pull request: draft PR #7, open and unmerged on `integration/v0.5-baseline`; PR #6 was closed automatically by GitHub during the branch rename and is retained as the audit trail
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Current staging deployment: accepted current demo recovered to immutable Version 13; immutable Version 12 is the separately verified backup; isolated repair candidate Version 26 retains exact-source parity
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**
- Live readiness: Gates A-D pass; Gate E trace/privacy/performance/private-owner load rows pass, but operational role workflows and separation-of-duties evidence require distinct authenticated institutional test identities; production remains untouched.

The removed historical branch ref did not erase its implementation history. The preserved predecessor commit is the non-destructive base of the current continuity branch.

## Integrated v0.5 baseline evidence

### Slice 13 — full staging operational acceptance

- Stage: `SLICE_13_GATE_E_PARTIAL_DISTINCT_TEST_IDENTITIES_REQUIRED` from
  source checkpoint `24ef0b9d435eca1522e9b72dc449167453266618` on
  `integration/v0.5-baseline`; local/upstream parity and PR #7 `validate`,
  `verify`, and `browser-smoke` are green.
- Ready: exact repository candidate, generated hashes, automated validation,
  privacy/authorization contracts, rollback-aware runbooks, seven-folder
  source contract, and complete executable readiness/acceptance matrix in
  `docs/STAGING_OPERATIONAL_ACCEPTANCE.md`. A fail-closed private-package
  initializer/validator refuses Git-resident records and reports only missing
  field names and consecutively authorized gates.
- Readiness-tool verification: implementation commit `3591550` initially
  failed Linux verify because four tests used Windows-only fixture paths;
  repair `eecbf8f` uses platform-native absolute paths. Run `29479074729`
  passed `validate`; run `29479074714` passed `verify` and `browser-smoke`.
  PR #7 remains open, draft, mergeable, and unmerged.
- Present but not authority: private staging clasp candidates and historical
  deployment/backup/parity records remain outside Git. They may be used only
  after the owner names the exact current target/config and action categories.
- Completed live dependencies: named owner/operator/signatories, approved
  operational and backup workbooks, acceptance window/stop authority, storage
  headroom, active operator session, restricted seven-folder mapping, private
  authorization through Gate F, launch backup, additive schema, Drive,
  migration dry run, reconciliation, triggers, safe synthetic access seed,
  revocation proof, authorization v2 activation, and exact isolated deployment.
- Remaining blocker: the sole authenticated owner is `ADMINISTRATOR`, which is
  intentionally not an operational reviewer. At least one distinct signed-in
  DOL operational identity and one distinct access-review identity are needed
  to finish AUTH-01/FUNC-01 and permission separation. Do not grant the owner
  temporary overrides or edit roles directly to bypass self-escalation.
- Authorization update: the protected private package validates through Gate F
  and records the current-demo target, owner/operator/tester/signatory labels,
  approved fixture/evidence boundary, window/stop authority, capacity/session,
  and all seven restricted Drive mappings without placing their identifiers or
  private values in Git.
- Current Gate E evidence: TRACE-01, PRIV-01, PERF-01, and the approved
  private-owner LOAD-01 envelope pass. One namespaced public request reached
  `FOR_REVIEW` with one line, one audit/history chain, one revision advance,
  zero stock movement, and zero error rows. All other must-pass rows remain
  unsigned unless independently completed.
- Version 26 evidence: all six exact target widths reach READY without page
  overflow or unlabeled visible controls; five warm starts complete in
  4.413-5.701 seconds; a bounded two-session near-live rehearsal was restored
  to manual-only; and a fresh pull matches all 39 candidate files with no
  temporary runner. Exact sync latency, multi-browser, and manual accessibility
  evidence remain unsigned.
- Incident recovery: a live progressive-bootstrap compatibility failure on
  accepted Version 18 was repaired in source and the accepted pointer was
  recovered to verified Version 13. Version 12 independently passes internal
  and requester-only checks. Isolated Version 26 contains the source and
  mobile repairs and remains non-accepted until every required Gate E row is
  signed.
- Actions not performed after the operational-role blocker: no review,
  reservation, receipt, release, lending, evidence upload, production action,
  PR merge, `main`, hosting, or database action. The only accepted-pointer move
  was the documented rollback recovery.
- Downstream: Slice 14 is blocked on signed Slice 13 acceptance; Slices 15-16
  remain blocked on stable measured V1 and later owner decisions.

## Historical Slice 12 - Bounded near-live active-module refresh

- Stage: `SLICE_12_COMMITTED_PUSHED_CI_GREEN_ACCEPTED` from accepted checkpoint
  `6fa6222adde5e8314d2defc40e0cd6686fff953b` on
  `integration/v0.5-baseline`.
- Locked behavior: 15-second default with bounded jitter; one scoped revision
  call maximum while visible, online, and focused/recently active; unchanged
  token causes no module fetch; changed token refreshes only the active bounded
  module; dirty input is deferred; manual/post-mutation refresh remains.
- Current-limit preflight: official Google documentation rechecked 2026-07-16
  lists six minutes per execution, 30 simultaneous executions per user, 1,000
  per script, and ten concurrent `google.script.run` calls per page. These are
  safety ceilings, not operating targets.
- Evidence boundary: repository modeling uses 1/10/30 active-session scenarios.
  Live p95, institutional concurrency, and operational acceptance remain Slice
  13 staging work requiring separate authorization and named owners.
- External boundary: no deployment, migration/import, Script Property change,
  Apps Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action is authorized.
- Rollback: disable near-live polling remotely and preserve manual/on-mutation
  scoped refresh; use a focused code revert without rewriting data.
- Delivered locally: per-scope revision storage and invalidation, compact
  authorized endpoint, 15-second jittered single-flight controller,
  active-module-only refresh, dirty/modal deferral and abandoned-modal cleanup,
  request-only token isolation, stale/manual-only UX, fail-closed remote flag,
  safe counters, adapters, docs, tests, and regenerated artifacts.
- Verification: `npm run check` passes 36 Vitest files / 303 tests, a 34-module
  build, 33 Apps Script sources / 55 functions, deterministic generated parity,
  and two 411,048-byte artifacts. Full Playwright passes 67 / 119 intentional
  skips / 0 failed; focused near-live proof, privacy/diff review, and final
  implementation validation pass.
- Generated evidence: standalone SHA-256
  `b65d717f22fd085acaa19d847ca827964f891374e1a03b9d0578add5ba833580`;
  Apps Script `Index.html` 1,022 bytes / SHA-256
  `bf52d20bbbc8d2a35b39351500edf7c65db93ab2dbddb18cd77c1587389d6035`;
  `AppScript.html` 343,759 bytes / SHA-256
  `a35f25e5f3c4ca2ccd8922434ea72cfa8776d449fd9850da6129bfe77bc04645`.
- Remote evidence: implementation commit
  `a563f2f179b710ac7c0d46a8af05a4349a5e625b` is at local/upstream/PR
  parity. Run `29477031867` passed `validate`; run `29477031799` passed
  `verify` and `browser-smoke`. PR #7 remains open, draft, and mergeable.
- Next gate: commit and verify this evidence record, then perform Slice 13
  staging-readiness preflight. No live staging action is implied or authorized
  by the repository checkpoint.

## Historical Slice 11 - Restock Safety

- Stage: `SLICE_11_COMMITTED_PUSHED_CI_GREEN_ACCEPTED` from accepted checkpoint
  `d067eb43e74e6da4fa5cc85977fafa1d6e1df55d` on
  `integration/v0.5-baseline`.
- Delivered locally: stable request-line-derived restock identities; bounded
  queue/detail/timeline and disabled reasons; separated scoped capabilities;
  preferred-quote/reason/confirmation prerequisites; optimistic revision,
  lock, idempotency, history, and audit; exact line/item/unit receiving;
  immutable purchase receipts and ledger entries; reconciliation protection;
  receipt-derived completion; parent derivation without sibling mutation;
  fail-closed writes; adapters; responsive UI; schema/docs/tests.
- Verification: governance/lint, 36 Vitest files / 296 tests, 34-module build,
  33 Apps Script sources / 54 functions, deterministic generated parity, two
  406,243-byte artifacts, full Playwright 67 / 119 intentional skips / 0
  failed, focused mobile/desktop workflow proof, privacy review, and
  `git diff --check` pass. Final implementation validation is PASS after
  exact-unit hardening.
- Generated evidence: standalone SHA-256
  `b4ccc05c6ce40e020b23567ef27fc3c0e7377dcaae1c0782b776bb5313f450ec`;
  Apps Script `Index.html` is 1,022 bytes / SHA-256
  `bf52d20bbbc8d2a35b39351500edf7c65db93ab2dbddb18cd77c1587389d6035`;
  `AppScript.html` is 339,054 bytes / SHA-256
  `c5771eb265712e6f77fe17ebcc269ebe120c75a2c8539b2654062afbe42f469f`.
- Remote evidence: implementation commit
  `d5cf2247f1997b18d8d2b8ef9fb367b0e7214d51` is at local/upstream/PR parity;
  run `29474985205` passed `validate` and run `29474985252` passed `verify`
  and `browser-smoke`. PR #7 remains open, draft, and mergeable.
- Final evidence checkpoint:
  `6fa6222adde5e8314d2defc40e0cd6686fff953b` is pushed at parity; run
  `29475144749` passed `validate`, and run `29475144793` passed `verify` and
  `browser-smoke`.
- External boundary: no deployment, live schema execution, migration/import,
  Script Property change, Apps Script/Sheets/Drive external write, PR merge,
  Cloudflare, database, staging, or production action occurred.
- Rollback: set `HAU_RESTOCK_WORKFLOW_ENABLED=false`, retain read-only review
  and immutable records, and revert only the focused Slice 11 commit if code
  rollback is required.

## Current Slice 10 - Authorized reference-data administration

- Stage: `SLICE_10_COMMITTED_PUSHED_CI_GREEN_ACCEPTED` from
  accepted checkpoint `4374fad7d3420c650abbe565bf03be00f2e208d4` on
  `integration/v0.5-baseline`.
- Delivered locally: canonical server operations and capabilities; bounded
  allowlisted domain projections; controlled add/update/archive/restore;
  effective dates, aliases, and dependency checks; append-before-supersede
  versioning; explicit `APPLYING` reconciliation; idempotency, lock, history,
  and audit; read-only roster/sync health; emergency revocation-only policy;
  distinct-review permission/routing flow; active responsive UI; schema/docs;
  adapters; and synthetic fixtures/tests.
- Authorization and safety: `DIRECTOR` remains operational oversight and does
  not inherit legacy administration; non-admin reads fail closed; raw Sheets,
  permanent delete, roster-source mutation, requester/reviewer self-grants,
  and dormant grants in emergency revocation are denied. Hidden views do not
  issue bootstrap calls.
- Verification: governance/lint pass; 34 Vitest files / 284 tests pass; build
  transforms 33 modules; 33 Apps Script sources / 54 functions, deterministic
  parity, and two 393,977-byte standalone artifacts pass; full Playwright
  passes 65 / 115 intentional skips / 0 failures; sensitive scan and
  `git diff --check` pass. Final implementation validation is PASS after the
  targeted safety and integration repairs.
- Generated evidence: standalone SHA-256
  `aa856fa30b205dc621d715db5d7d4d3254ea2d1bff666ba5d309df6918a85127`;
  Apps Script `Index.html` is 1,022 bytes / SHA-256
  `bf52d20bbbc8d2a35b39351500edf7c65db93ab2dbddb18cd77c1587389d6035`;
  `AppScript.html` is 327,085 bytes / SHA-256
  `94eaae333a7bf19a423d101bb19b60954f8cb72f03d5810addacdfd5737cd9db`.
- Remote evidence: implementation commit
  `ece5bf846399c2793ab088214ba2a1693d3693ae` is at local/upstream/PR parity;
  run `29472954664` passed `validate` and run `29472954676` passed `verify`
  and `browser-smoke`. PR #7 remains open, draft, and mergeable.
- External boundary: no deployment, live schema execution, migration/import,
  Script Property change, Apps Script/Sheets/Drive external write, PR merge,
  Cloudflare, database, staging, or production action occurred.
- Rollback: set `HAU_REFERENCE_ADMIN_WRITES_ENABLED=false`, preserve all
  versions/change/history/audit rows, use compensating revisions, and revert
  only the focused Slice 10 commit if code rollback is required.

## Current Slice 9 - Venue and Equipment reference/request workflow

- Stage: `SLICE_9_LOCAL_GATES_AND_INDEPENDENT_REVIEW_PASS_READY_COMMIT` from accepted
  checkpoint `a0b4e7f46620056b5fc73036bea69bfcf8da0f83` on
  `integration/v0.5-baseline`.
- Delivered locally: additive empty live reference/route schema; exact active,
  effective, revision, requestability, unit, category, and route validation;
  safe predictive search; constrained Other triage; immutable route/reference
  snapshots and amendment provenance; three-committee routing only;
  confirmation/blocker/return/evidence completion gates; scoped queue/update;
  feature flag; adapters; active source UI; synthetic mock/test fixtures.
- Verification: governance, lint, 32 Vitest files / 262 tests, 32-module build,
  32 Apps Script sources / 54 functions, generated parity, two verified
  365,301-byte standalone artifacts, full Playwright 61 passed / 101 intentional
  skips / 0 failed, sensitive scan, and `git diff --check` pass. Final
  independent review is PASS after targeted effective-revision, server-clock,
  legacy-preview, replay-immutability, and evidence-validation repairs.
- External boundary: no deployment, migration/import, Script Property change,
  Apps Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production change occurred. Live reference tables remain empty.
- Rollback: set `HAU_VENUE_EQUIPMENT_REQUESTS_ENABLED=false` for new specialized
  selection while preserving stored children, snapshots, history, queue access,
  and evidence; use a focused revert for code rollback.

## Current Slice 8 - Materials Committee workflow

- Stage: `SLICE_8_COMMITTED_PUSHED_CI_GREEN_ACCEPTED_PENDING_EVIDENCE_COMMIT` from
  accepted starting checkpoint `290dc629fd9c0765bca39144224798c65b667eaa`
  on `integration/v0.5-baseline`.
- Scope delivered: versioned controlled Materials category/specification,
  exact quantity/unit, required-by and usage, sourcing preference, live catalog
  validation, immutable legacy source provenance and amendment history, exact
  `ACTIVE`/category and `VERIFY` denial, one stock-or-procurement path,
  approved-substitution audit, blockers, path-matching evidence, completion
  rechecks, Materials-scoped queue/update, authorization/revision/idempotency,
  active UI, and fail-closed feature control.
- Verification: `npm run check` passes 30 Vitest files / 244 tests, a 31-module
  build, 31 Apps Script sources / 51 required functions, deterministic package
  parity, and two 329,544-byte standalone artifacts. Full Playwright passes
  61 / 101 intentional skips / 0 failures. The changed-scope sensitive scan and
  `git diff --check` pass. Independent final review is PASS with no findings.
- Generated evidence: standalone SHA-256
  `8c34bf25f14fc09b8bd2e89433fdbba7c4c23ec0ca402b05b4b69a8f748e4216`;
  Apps Script `Index.html` is 926 bytes / SHA-256
  `8d9035ee09f9eb514bcb374a9b399714bac693c02898825b196555f3c0621485`;
  `AppScript.html` is 265,782 bytes / SHA-256
  `946a2424d5c30e23b12128049bc60a5551279b8ad9f146b4405ccc1100b32faf`.
- Remote evidence: implementation commit
  `1f05b526e457a946e0575b4aed2660c249105923` is pushed and matched PR #7.
  Apps Script run `29390112932` passed `validate` in 12 seconds; CI run
  `29390112933` passed `verify` in 16 seconds and `browser-smoke` in 2 minutes.
  The PR remained open, draft, and mergeable.
- External boundary: no deployment, migration, Script Property change, Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.
- Rollback: set `HAU_MATERIALS_REQUESTS_ENABLED=false` for new Materials
  sections while retaining versioned stored children/history; use a focused
  revert of the eventual Slice 8 commit for code rollback.

## Current Slice 7 - Food Committee workflow

- Stage: `SLICE_7_COMMITTED_PUSHED_CI_GREEN_ACCEPTED` from accepted starting
  checkpoint `5c9bb501e01eeee961bae01279f2c0188d0429ce` on
  `integration/v0.5-baseline`.
- Scope delivered: versioned controlled Food fields, aggregate-only dietary
  handling, server-owned lead-time derivation, sourcing and completion-evidence
  gates, Food-scoped queue/detail projection, canonical authorization,
  revision/idempotency guards across generic and specialized mutation paths,
  durable history/audit, and mock/service/active-UI parity.
- Privacy and authority: public guessed-ID reads fail closed; Food users cannot
  receive sibling payloads; delivery evidence is revalidated by type/entity/
  component/upload status; Administrator system authority remains separate
  from Director operational oversight. No person-level dietary narrative,
  private supplier/contact/TIN/payment data, credentials, or Google resource
  URL was introduced.
- Verification: full `npm run check` passes governance, lint, 28 Vitest files / 231
  tests, a 30-module build, 30 Apps Script sources / 49 functions, deterministic
  package assembly, and both 311,165-byte standalone artifacts. Full Playwright
  passes 61 / 101 intentional skips / 0 failures across 162 cases; the focused
  rendered Food submission/queue/update flow passes; changed-file sensitive
  scans and `git diff --check` pass. Final independent review is PASS.
- Generated evidence: standalone SHA-256
  `d35d9ebcc08b1b4d0be788057e9993f24d12602eb227cdb2f7421e5027b8ce73`;
  Apps Script `Index.html` is 841 bytes / SHA-256
  `6c8709cf75c5558156407f292308abd95ac2f034dfe8092b9f8a0955096bad0c`;
  `AppScript.html` is 247,320 bytes / SHA-256
  `c100b172d3c77cdee4edf67f762787cf87ba46af7e1a8643bebc9a592a2f20a8`.
- Packaging hardening: Apps Script template assembly now inserts generated
  partials with a replacement callback, preventing minified `$&` tokens from
  being interpreted as string-replacement directives; regression coverage is
  included.
- Remote evidence: implementation commit
  `e85e27558f02e6a1f8b3b51be514a0382df24a10` is pushed; PR #7 head matched
  it and remained open/draft/mergeable. Apps Script run `29388258079` passed
  `validate`; CI run `29388258076` passed `verify` and `browser-smoke`.
- Acceptance: the owner authorized uninterrupted continuation without another
  manager-approval prompt; the passed local, independent-review, push, and CI
  gates accept Slice 7 and unlock bounded Slice 8.
- External boundary: no deployment, migration, Script Property change, Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.
- Rollback: set `HAU_FOOD_REQUESTS_ENABLED=false` to stop new Food submissions
  while retaining stored versioned children for read/service continuity; use a
  focused revert of the eventual Slice 7 commit for code rollback.

## Current naming and visibility baseline

- Stage: `NAMING_BASELINE_IMPLEMENTED_PENDING_FINAL_CI`.
- Authority: `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system` on `integration/v0.5-baseline`; upstream parity was `0 0` and status clean before this documentation update.
- GitHub: only `integration/v0.5-baseline` and `main` remain as branches. PRs #3-#5 were closed without merge. Their exact heads, the superseded routing head, and the approved prototype snapshot are preserved by dated remote archive tags and the verified full-ref bundle.
- Review surface: GitHub closed PR #6 as a side effect of the branch rename and would not reopen it. Draft PR #7 replaces it at the unchanged head and keeps #6 as the linked audit trail.
- Workspace: legacy top-level HAU-USC folders moved intact under `D:\Documents\HAU-USC Logistics` using `active`, `backups`, `private-config`, and `source-material` categories. The older non-Git Context Vault snapshot moved to `D:\Documents\GitHub\archives` and the active Context Vault repository was not changed.
- Private configuration: both ignored Apps Script configurations are outside Git under `private-config\apps-script`; no values were printed or committed.
- Preservation: `hau-usc-all-refs-naming-cleanup-20260715-110336.bundle` contains 37 refs and complete history; 1,574,863 bytes; SHA-256 `EE76A23C590679F2E19B95B047FCB18B42F520B28C547A7799A4EA342E53C765`.
- Windows compatibility shell: the old `D:\Documents\DOL Website GitHub` directory contains no files but remains hidden while the running Codex workspace holds its empty `.git` directory handle. It can be deleted after this task/workspace releases the handle.
- Boundary: no PR merge, `main` update, product change, generated application edit, deployment, migration, Apps Script push, Sheet/Drive write, or production action occurred.

## Current Phase 3.5 - Repository and workspace final reconciliation

- Stage:
  `PHASE_3_5_COMMITTED_PUSHED_CI_GREEN_TAGGED_PENDING_MANAGER_ACCEPTANCE`.
- Authority: `D:\Documents\DOL Website GitHub` remains the single active
  checkout on `feat/live-sync-lending-search-catalog-controls` from clean,
  synchronized, CI-green starting head `6abfb411...`.
- Preservation: new 34-ref complete-history bundle, 1,559,241 bytes, SHA-256
  `924E52E027E40EAFB141A73C4431E0FAF0DA35432D84F36AA531E090B10BE04F`.
  The routing clone's six runtime files are preserved exactly with zero copy
  mismatches and metadata aggregate SHA-256
  `548C972D309A3DFADDFB7B0A76AC6DFC53CA6102516CAA6B3174E54D0AD49535`.
- Local structure: the clean deployment linked worktree moved through Git to
  `D:\Documents\HAU-USC Logistics System\worktrees\v1-deployment`; the
  redundant routing clone was removed only after remote/bundle/runtime parity.
- GitHub reconciliation: PR #1 and PR #2 were closed without merge because
  their complete heads are contained in active and bundled. Their head branches
  and the fully contained runtime-truthfulness branch were deleted remotely and
  verified absent after prune.
- Retained: PR #3-#6; active, main, deployment, SDD, QR, routing, and snapshot
  branches; every tag; all unique/private/unknown folders and backups.
- Codex placement: `.codex/config.toml`, `agents/repo-mapper.toml`, and
  `agents/log-triage.toml` are present in the authoritative checkout and nowhere
  else among current local HAU-USC checkouts. Root `AGENTS.md` already contains
  the required skill, intent, Caveman, cost, and sole-writer triggers.
- No product/generated source, deployment, migration, Apps Script, Sheets,
  Drive, Cloudflare, database, staging, production, or PR #6 merge occurred.
- Verification: governance passed 8 project files / 14 continuation fields;
  full `npm run check` passed 25 files / 216 tests, 28-module build, 29 Apps
  Script sources / 47 functions, generated parity, and two 293,406-byte
  artifacts. Git integrity, bundle, manifest, structure, PR/ref,
  Codex-placement, and diff checks pass.
- Remote result: checkpoint `efee2dda0148c5a70bd9c681e729a75372622b8e`
  is pushed at branch/PR parity. Actions runs `29385021439` and `29385021514`
  passed `validate` (13 seconds), `verify` (15 seconds), and `browser-smoke` (1
  minute 36 seconds).
- Lightweight tag `hau-usc-phase3.5-consolidation-efee2dd` is verified locally
  and remotely at the checkpoint. PR #6 remains open/draft/mergeable with
  corrected title `feat: complete HAU-USC v0.5 repository baseline` and a
  cumulative evidence body.
- Remaining gate: push this remote-verification record, verify final parity/CI
  and clean structure, then obtain manager acceptance.
- Complete evidence and rollback:
  `docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md`.

## Current Phase 3 - Repository and local workspace consolidation

- Stage: `PHASE_3_COMMITTED_PUSHED_CI_GREEN_TAGGED_PENDING_MANAGER_REVIEW`.
- Authority: `D:\Documents\DOL Website GitHub` remains the one authoritative
  active checkout on `feat/live-sync-lending-search-catalog-controls` from
  accepted starting checkpoint `048578d1db9fdda93b9ba95b94b74ac1791cfc8c`.
- Worktrees: reduced from eight registered entries to two. The authoritative
  checkout and clean `feat/v1-one-shot-demo-and-deployment` dependency remain;
  six patch-equivalent specialist worktrees were removed normally through Git.
- Branches: six bundled `codex/v1-*` refs and the fully contained local Apps
  Script launch-readiness ref were removed. `main`, the authoritative branch,
  and the deployment dependency remain locally. No remote ref or PR changed.
- Unique work: the separate clean planning clone at
  `D:\Documents\GitHub\hau-usc-logistics-management-system` remains because
  `feat/automated-codex-model-routing` contains four unique remote-backed commits.
- Preservation: current 47-ref complete-history bundle verified at 1,518,711
  bytes and SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`.
  Exact Drive/QA generated files and binary patches plus two distinct private
  configuration copies are hash-verified outside Git.
- Archives: historical prototype/analysis and pre-sync generated folders moved
  intact to dated archives. Potentially private `06. LOGISTICS`, Download
  exports, release evidence/backups, open PRs, remote branches, and rollback
  tags remain untouched.
- Verification: governance passed 8 files / 14 continuation fields; full
  `npm run check` passed 25 test files / 216 tests, 28-module build, 29 Apps
  Script sources / 47 functions, deterministic generated parity, and two
  293,406-byte artifacts. `git diff --check`, Git integrity, bundle verification,
  and external manifest parsing pass.
- Detailed classification and recovery are recorded in
  `docs/WORKSPACE_CONSOLIDATION.md`. Independent review passed with no remaining
  actionable findings.
- Checkpoint `58168edd4eec5ea0a063558dfb8071c4a7fd6c99` is pushed at branch/PR
  parity. PR #6 runs `29383790687` and `29383790688` passed `validate` (14
  seconds), `verify` (16 seconds), and `browser-smoke` (1 minute 45 seconds).
- Lightweight development-baseline tag `hau-usc-phase3-baseline-58168ed` is
  verified locally and remotely at the checkpoint commit. Manager acceptance
  remains before Phase 4 or Slice 7.
- No Slice 7 code, application/generated repository source, PR merge/close,
  deployment, migration, Apps Script, Sheets, Drive, Cloudflare, database, or
  production action occurred.

## Current Phase 2 - Caveman Light and efficiency layer

- Stage: `PHASE_2_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: repository-only intent/skill routing, Caveman Light short-command expansion, compact task/history/resume packets, bounded output/context tools, deterministic agent/continuation validators, and two read-only custom-agent profiles. Slice 7 and all external systems remain out of scope.
- Codex configuration: project `.codex/config.toml` limits concurrency to two threads and one delegation level; current official documentation supports the project config/custom-agent locations and the selected `gpt-5.6-terra`, low-reasoning, read-only profiles.
- Verification: governance checks pass 8 required project files and 14 continuation fields; focused Vitest passes 13 tests; repaired capped `npm run check` passes 25 files / 216 tests, a 28-module build, 29 Apps Script sources / 47 required functions, generated parity, and standalone verification. ESLint, targeted Prettier, and `git diff --check` pass.
- Review: the initial three findings are repaired. The re-review verified those repairs but found JSON's `\/` escape was still accepted; the second and final targeted round now rejects every escape outside the supported TOML subset. Final independent review is PASS with no actionable findings.
- Remote verification: implementation commit `8e82a8601e930ecf223a6e9170dc3d4dd9954bb1` is pushed; local, upstream, and PR #6 heads matched with local/upstream `0 0`. Actions runs `29379450091` and `29379450069` passed `validate` (14s), `verify` (16s), and `browser-smoke` (1m53s).
- Generated application artifacts remain unchanged. Local Playwright was not repeated because no browser/application source changed; accepted Slice 6 browser evidence is reused and PR CI will run after push.
- Strict Codex config parsing is unrun because the local `codex.exe` launcher is access-denied; no strict-parser pass is claimed. No deployment, migration, configuration outside the repository, Apps Script action, or Google Sheets/Drive write occurred.
- Rollback: focused `git revert 8e82a8601e930ecf223a6e9170dc3d4dd9954bb1`. Next gate is manager acceptance before consolidation or Slice 7.

## Current Slice 6 - Composite Event Logistics request foundation

- Stage: `SLICE_6_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: a feature-flagged, server-owned parent request with one independent child for each non-empty Food, Materials, and Venue & Equipment section; validation, exact duplicate consolidation, atomic idempotent creation, visible hierarchy, child lifecycle, derived parent status, cancellation/reopen/amend/add-section, assignment/escalation boundaries, history, and audit.
- Repository implementation: additive `24_COMPOSITE_REQUESTS` schema and `CompositeRequestService.gs`, nine Apps Script routes, canonical domain/service contracts, serialized mock mutations, feature-flagged source UI, and focused unit/Apps Script/browser tests. Existing `03_REQUESTS.Parent_Request_ID` remains untouched.
- Evidence: `npm run lint` passed; `npm test` passed with 24 files / 203 tests; `npm run verify` passed with 29 Apps Script sources / 47 required functions; full Playwright passed 61 / 101 intentional skips / 0 failed across 162 cases; the focused composite browser test passed; and `git diff --check` passed. Independent review is PASS after the concurrency repair.
- Generated evidence: standalone artifacts are 293,406 bytes each / SHA-256 `f9592c86f6e63377b82d656333b64188dea0c4284f2b23108cecb2dfd0866558`; Apps Script `Index.html` is 766 bytes / `9615ba949ac8479ed6b8057c6561370eedcdda0db997f238ef4c631b727a47de`; split outputs pass deterministic parity.
- Remote evidence: implementation commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` is pushed and PR #6 `validate`, `verify`, and `browser-smoke` are green in runs `29377313232` and `29377313250`.
- Privacy/external boundary: no newly introduced credentials, `.clasp` content, private identifiers, roster/student data, private contacts, supplier TINs, or evidence files/links; no Sheet/Drive/Apps Script external write, Script Property change, migration, or deployment occurred. `clasp status` and `clasp push --dry-run` remain unrun because no staging script is configured.
- Rollback: disable `HAU_COMPOSITE_REQUESTS_ENABLED` for new submissions; retain any created records for read continuity; use a focused revert to the `hau-usc-slice6-start-6548ca2` checkpoint if required. Do not reset or discard work. Slice 7 remains gated.

## Current Slice 5 - Committee Main Hub and Inventory and Pantry vertical slice

- Stage: `COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: one capability-aware Main Hub with active committee context, server-scoped queue/count/detail projections, bounded status-history/audit activity, recent completions, safe links, freshness/manual refresh state, and active-context propagation into existing inventory-family module reads.
- Queue defaults: new/unassigned, awaiting review, needs information, due soon (7 days), overdue, blocked, missing evidence, escalated, inventory attention, lending review/overdue, upcoming needs (14 days), and recent completions (30 days). Exact owner policy and institutional timezone boundary samples remain later staging inputs.
- Repository implementation: `apps-script/CommitteeDashboardService.gs`, bootstrap authorization/context reuse, additive 1.3.0 dashboard collections, active-context module requests, visual Main Hub source, generated artifacts, and focused synthetic/browser tests. No private roster, contact, supplier-TIN, evidence-link, credential, or external operational value was added.
- Evidence: `npm run check` passes with 22 Vitest files / 183 tests, build, Apps Script validation (28 source files / 38 required functions), generated parity, and standalone verification; `npm run verify` passes; full Playwright passes 56 with 100 intentional skips and 0 failures across 156 cases; `git diff --check` and the changed-scope sensitive scan pass. Independent review is PASS.
- Generated parity: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are 282,306 bytes each / SHA-256 `fe937a21807ee12dad4317b0ac3945d7a5ecf0a1389a6b307226a655db0f248d`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; the split Apps Script generated outputs passed deterministic parity.
- Implementation commit `a1784f15bc6a160ebf3c2405e9776b6517ce52e5` is pushed and PR #6 CI is green. Rollback checkpoint is `hau-usc-slice5-start-89a7acc`; use a focused revert if rejected and preserve the starting tag.
- No staging/production deployment, Script Property change, trigger activation, Sheet/Drive write, migration, or external operational-data access occurred. `clasp status` and `clasp push --dry-run` were not run because no staging script is configured; live volume timing and owner policy confirmation remain for the later staging slice.

## Current Slice 4 - Private roster synchronization and access freshness

- Stage: `COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: exact private-roster source validation, explicit/admin or scheduled sync, metadata-only run records, access and membership last-known-good snapshots, freshness expiry, emergency deny, safe admin health, and zero private-source reads during ordinary startup.
- Additive schema: `HAU_CONFIG.SCHEMA_VERSION=1.3.0`; roster access fields on `14_USERS_ACCESS`; `21_ACCESS_SYNC_RUNS`; `22_ACCESS_SYNC_SNAPSHOT`; and `23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT`. No schema migration or external setup was run.
- Repository implementation: `apps-script/RosterSyncService.gs`, access/config/authorization/setup wiring, synthetic VM coverage in `tests/unit/apps-script-roster-sync.test.js`, and updated setup/security documentation. No private source ID, source row, credential, roster record, or operational value is present in the changed files.
- Evidence: local `npm run check` passes with 21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification; `npm run verify` passes; full Playwright passes 50 with 100 intentional skips and 0 failures across 150 cases; `npm run lint`, `git diff --check`, and the changed-scope sensitive scan pass. Independent implementation review found no blocking issue. Commit `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` is pushed and PR #6 CI is green.
- Rollback checkpoint: local tag `hau-usc-slice4-start-a3fffb9` points to the approved starting HEAD. A rejected implementation must be reverted as a focused commit; do not reset or discard work.

## Current staging acceptance checkpoint - Phase E accepted

STAGING ACCEPTANCE: SLICES 1-3 PASSED

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`; implementation checkpoint: `fcb004e8be78d3d431164c95c7f847ab1033d927`.
- The accepted staging handoff reports Version 18 serving bootstrap contract v2 with authorization contract v1/absent. Version 13 remains available for rollback.
- Root cause identified in staging: the read-only bootstrap-module callback completed at approximately 40 seconds, beyond the former 30-second browser deadline. The fix gives `api_getBootstrapModule` a bounded 60-second client deadline while mutations and all other calls remain at 30 seconds.
- The staging handoff reports 32-file pull-back parity, preservation of the owner-only web-app manifest, a ready internal v2 workspace, and passing diagnostic and request-only privacy checks. No production or operational records were touched.
- Local verification after the fix: `npm run check` passed with 20 Vitest files / 164 tests; `npm run verify` passed; full Playwright passed 50 with 100 intentionally skipped and 0 failed across 150 cases; `git diff --check` passed; the sensitive-value scan passed.
- Generated parity: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are 274,348 bytes each / SHA-256 `63e25fc21657c725c5c40cab8500a702f74aaaa521efa156b6218bd690c91485`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; `AppScript.html` is 215,052 bytes / `6c3ee9ade3fe465d34ad0ffeefce6cd81aa8c37cb53023ded34df35a27fccbd1`.
- Independent review was reported as PASS in the staging handoff. The live staging claims above are accepted from that handoff and were not re-fetched in this session because the local Chrome bridge was unavailable.
- No Slice 4 work, production deployment, Google Sheets/Drive write, or private operational-data change had been performed at this historical Phase E handoff. The active Slices 4-16 continuation goal now authorizes a focused repository push after Slice 4 gates; that push has not yet occurred.

## Superseded staging acceptance checkpoint - Phase E previously blocked

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`; current local documentation checkpoint: `85aef6b`
- Phase D compatibility acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent.
- Phase E v2 direct read-only endpoint checks passed, but the live v2 workspace remained in slow startup and reached the retryable read-only-service timeout instead of ready.
- The existing staging deployment was immediately rolled back to immutable Version 13; the staging owner reports the bootstrap property is restored to `1`, while this checkout has no direct Script Property read path. Authorization contract v1/absent remains the required setting.
- A local synthetic end-to-end check covering the checked-in Apps Script DTO, authorization v1/absent behavior, JSON-safe callback normalization, and browser v2 validation passes; no local contract-shape defect or reproducible timeout was found.
- The exact marker `STAGING ACCEPTANCE: SLICES 1-3 PASSED` is absent. No push, production deployment, Slice 4 work, Sheet/Drive write, or private operational-data change is authorized from this blocked checkpoint.

## Slice 3 - canonical roles, committee scopes, and authorization contract (repository-only)

- Date: `2026-07-14` (`Asia/Manila`)
- Approved starting commit: `23c4f61e5f1b113d4b77c2955f1716139a03c121`
- Current stage: `PENDING_MANAGER_REVIEW`; implementation commit is pushed and PR #6 CI is green.
- Scope: server-owned canonical role/capability decisions, exactly three committee IDs, sanitized bootstrap authorization DTO, client projection, safe denial reasons, and additive legacy mapping dry-run/apply controls.
- Owner-auto-accepted defaults recorded from the planning package: six roles (`Requester`, `DOL Staff`, `Committee Head`, `Director`, `Administrator`, `Read-only Auditor`); `Food Committee`, `Inventory and Pantry Committee`, and `Materials Committee`; immutable canonical IDs; multiple memberships as rows; committee heads scoped to their committees with no release capability by default; Director oversight separated from Administrator reference/access/system administration.
- `HAU_AUTHORIZATION_CONTRACT_VERSION` defaults to legacy v1 when absent; canonical v2 is opt-in and is not activated in any external environment by this checkpoint.
- `14_USERS_ACCESS` additions and `20_USER_COMMITTEE_SCOPE` are additive schema definitions only. The mapping dry run reports unknown roles/committees, missing scope, and invalid overrides; apply requires explicit approval and does not rewrite immutable history. No migration or external write was run.
- Final local evidence: `npm run check` passes with ESLint, full Vitest (20 files / 161 tests), production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify` passes; full Chromium passes 49 with 95 intentionally skipped and 0 failed across 144 cases; `git diff --check` and the sensitive-value scan pass.
- Generated parity: standalone artifacts are 274,038 bytes each / SHA-256 `3646b8b799cecc954c3226580ca0a173da1b2cd61e94740b485597ebaaf11fa9`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; `AppScript.html` is 214,742 bytes / `986b0e4e5148172936ad5e680c0dd8400f5b13ff19c694e2187a7863b4bb8a2e`.
- Initial independent-review findings were repaired and covered by focused tests. The implementation-validator pass found no blocking issue; a second reviewer did not return a final response before handoff, so no re-review PASS is claimed. No sensitive/private values, roster rows, external identifiers, credentials, private supplier-TIN values, or operational records were introduced in the changed scope; regenerated standalone files retain only the pre-existing fictional preview baseline.
- No roster import, committee UI, composite request, catalog, restock, polling/live-update, hosting, database, deployment, staging/production, Google Sheets/Drive write, or private operational-data work was performed.

## Slice 2 - essential bootstrap and lazy module contracts (repository-only)

- Date: `2026-07-14` (`Asia/Manila`)
- Approved starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Current stage: `PENDING_MANAGER_REVIEW`; implementation, repairs, final local gates, push, and PR CI are complete.
- Remote ending SHA: `576393f1be28687d984ea7632a2501aa8d3fc30d`; local/upstream ahead/behind is `0 0`.
- Apps Script renders `HAU_BOOTSTRAP_CONTRACT_VERSION` from Script Properties: absent defaults to v1, explicit v2 requests an allowlisted essential DTO followed by one active-module DTO, and v1 retains the compatibility endpoint.
- Added bounded pagination/filtering across module collections, fail-closed explicit entity-scope filtering for committee-scoped sessions, strict JSON/sensitive-field validation, exact UTF-8 payload metrics with a 100 KiB server bound, safe public-reference caching, in-request Sheet-read deduplication, and generated-runtime integration.
- Verification: `npm run check` passed with 18 Vitest files / 143 tests; `npm run verify` passed; focused packaging passed 15/15; full Playwright passed 49 with 95 intentionally scoped skips and 0 failures across 144 cases.
- No deployment, `clasp` command, Google Sheets/Drive/Apps Script external write, staging/production action, private-data access, migration, database, hosting, committee, roster, composite-request, catalog, restock, or polling work was performed.
- Rollback: set `HAU_BOOTSTRAP_CONTRACT_VERSION=1` to use the compatibility endpoint; if code rollback is required after commit, revert the single focused Slice 2 commit. No external rollback is applicable to this local checkpoint.

## P0 Production Bootstrap Diagnosis and Recovery — repository-only checkpoint

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved starting commit: `2a9ac342ca584257e0bbf6ea09ffb9d4f892a7c7`
- Upstream: `origin/feat/live-sync-lending-search-catalog-controls`
- Ending commit: this focused P0 implementation commit; the exact SHA is recorded in the final handoff
- Scope: startup diagnosis, bootstrap-envelope validation, bounded recovery UI, safe client diagnostics, and local verification seams only

### Diagnosis and recovery

- The previous startup catch covered the remote request but left normalization, static-option preparation, runtime-extension installation, event binding, first render, and post-render work outside the same recoverable boundary. A failure after the response could therefore leave the loading overlay active without a Retry path.
- The P0 controller now emits named stages from shell readiness through ready, records safe client-side timings/counts, rejects malformed or unsupported JSON-safe envelopes before normalization, and keeps one active attempt at a time.
- An attempt token prevents an obsolete callback from completing a newer Retry attempt. The terminal UI finalizer is idempotent, clears the overlay on success, keeps it actionable on failure, reports a plain-language message with an opaque support code, and announces failure through an accessible live region with keyboard focus on Retry.
- Slow loading is reported locally after eight seconds without creating another request. The existing Apps Script adapter success/failure handling and 30-second timeout remain unchanged.
- Apps Script response sanitization now converts Date, non-finite, function, symbol, undefined, and bigint values into JSON-safe output before they reach the browser. No endpoint, payload, schema, or external data source was changed.

### Verification

- `npm ci`: passed; 139 packages installed and no vulnerabilities reported.
- `npm run lint`: passed.
- Focused P0 Vitest: 4 files / 29 tests passed.
- Full Vitest: 14 files / 116 tests passed.
- `npm run check`: passed, including lint, full Vitest, Vite build, Apps Script static/package checks, generated-file parity, and standalone verification.
- Focused P0 Vitest: 5 files / 30 tests passed during iteration; final full Vitest: 15 files / 118 tests passed.
- Focused packaged Apps Script Chromium suite at 390 px: 14 passed, including slow-state, finalizer, retry, and stage-failure coverage.
- Complete Playwright run across the six configured viewport projects: 138 cases, 48 passed, 90 intentionally scoped skips, 0 failed.
- Generated visual modules were regenerated from `legacy/HAU-USC_Logistics-Prototype.original.html`; generated standalone artifacts were rebuilt and verified at 252,036 bytes each with SHA-256 `40e211acf12a581436e2a28074a94fb60152eb9ad4d6667e2d46c6c6136080bd`. The generated Apps Script shell remained 615 bytes with SHA-256 `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.
- Synthetic local shell measurement at 390x844 rendered the loading surface in 81 ms; this is not a staging or production latency claim.

### External boundary and remaining unknowns

- No Slice 2, committee, roster, composite-request, catalog, restock, polling, hosting, database, deployment, staging, production, Google Sheets, Google Drive, Apps Script deployment, trigger, or external write work was performed.
- `clasp status` and `clasp push --dry-run` were not run because no authorized staging-script verification was in scope. No live Apps Script response, live timing, deployment behavior, or production bootstrap volume is claimed by this checkpoint.
- The local synthetic fixtures prove realistic-volume sequencing and failure recovery but do not establish staging latency, Apps Script HTML Service behavior, or production data correctness.

### Rollback

- Before any push or deployment, rollback is simply to retain the approved starting checkpoint; after integration, use a focused `git revert` of this implementation commit rather than resetting or discarding work.
- If a later separately authorized deployment uses this commit, rollback must move only the deployment pointer to the preceding immutable version. No Sheet/Drive data, ledger, schema, or external records were changed by this checkpoint.

### Next action

Manager review of this local evidence and the focused diff. Do not push, deploy, or start another milestone without separate explicit authorization.

## Version 0.5.0 working revision

- Successful Apps Script mutations are followed by an authoritative bootstrap reload before success is rendered. A failed follow-up read does not repeat the recorded command.
- Internal clients check `api_getDataRevision` every five seconds while visible and online. Focus, visibility restoration, reconnect, and the visible Refresh control request immediate checks. Polling requests do not overlap and back off after repeated errors.
- Revision state is stored in `17_CONFIG`. Each successful non-replay mutation advances it exactly once; bootstrap, search, health, diagnostics, and other read-only operations do not advance it.
- An installable operational spreadsheet edit trigger advances the revision for relevant direct human edits. Trigger setup is idempotent and is not performed by repository commands.
- Dirty forms, local request drafts, pending uploads, and active modal workflows defer automatic refresh and show an Updates available banner.
- The Lending Hub uses predictive text selection with a hidden authoritative Item ID, accessible keyboard behavior, and specific availability/restriction messages.
- Server lending validation covers item existence/status, VERIFY, handling, borrower audience, quantity, maximum quantity, available-to-promise, and due dates at creation and again during approval/handoff.
- Authorized catalog managers can create, edit, relocate, archive, and restore items through locked, idempotent, audited APIs. Quantity truth remains append-only; unit and archive protections preserve dependencies and history.
- `Can_Manage_Catalog` is appended to access rows. ADMIN and DOL_DIRECTOR retain backward-compatible access when the cell is blank; other roles require an explicit true value.
- The `01_ITEM_MASTER`, `14_USERS_ACCESS`, and `17_CONFIG` changes are additive and safe to prepare before the new web deployment becomes active.

### Repository verification

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused new Chromium suite at 390 px: 4 passed.
- `npm run check`: passed, including the 22-module Vite build, 24-file/27-entry-point Apps Script static and packaging checks, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright/browser matrix across all six configured viewport projects: 38 passed, 40 intentionally scoped skips, 0 failed.
- A second build reproduced the byte-identical 238,891-byte standalone artifacts with SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f` and the 615-byte Apps Script shell with SHA-256 `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External-action record

- No `clasp push`, immutable Apps Script version, deployment update, Sheet/Drive write, live trigger change, production action, or PR #2 merge was performed for 0.5.0.
- Immutable staging Version 9 remains the live staging version. Production remains untouched.

### Launch-readiness foundation completed in 0.4.0

## Current v0.6 control state

Active phase: **Phase 1 — SOL High**

Current mode: **READ / VERIFY / RECONCILE before application-code implementation**

Canonical control files:

- `.codex/CURRENT.md` — active operational pointer
- `.codex/PHASE_AND_CONTEXT_POLICY.md` — mandatory token-efficiency, phase-stop, manual model-switch, and escalation rules
- `.codex/BOOTSTRAP.md` — fresh-session continuity procedure
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`
- `.codex/specs/README.md`

## Context-efficiency rule

A fresh Codex task should not reread the entire repository.

Minimum cold-start set:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. the active phase specification

Then run the Git handshake and read only the additional files/sections directly required by the current bounded milestone.

Do not repeatedly reread unchanged long documentation, generated artifacts, or historical continuation sections when their needed facts are already captured by the current pointer.

## Mandatory model-switch boundaries

Codex cannot automatically switch models, so phase completion is a hard task boundary.

- Phase 1 complete → pointer advances to Phase 2 / `GPT-5.6 Terra` / `READY FOR MANUAL MODEL SWITCH` → current Sol task stops.
- Phase 2 complete → pointer advances to Phase 3 / `GPT-5.6 Sol — High` / `READY FOR MANUAL MODEL SWITCH` → current Terra task stops.
- Phase 3 complete → pointer becomes `PROGRAM COMPLETE — PRODUCTION STILL GATED` → task stops before production promotion.

During Phase 2, a Sol-class architecture/security escalation sets the pointer to `SOL ESCALATION REQUIRED` and Terra stops for a manual model switch rather than improvising.

See `.codex/PHASE_AND_CONTEXT_POLICY.md` for the exact required terminal messages and transition procedure.

## Documentation reconciliation

Inherited 0.4.0 historical records may still contain old open/draft PR #2 wording. Current Git/GitHub state and `.codex/CURRENT.md` govern active branch/commit/PR/CI facts.

Do not execute a historical deployment or PR action merely because it appears in an old continuation block.

## Preserved 0.4.0 implementation

The preserved predecessor includes:

- approved visual baseline and generated visual modules;
- strict mock / Apps Script / future HTTP browser adapters;
- Apps Script authorization, server IDs, locks, idempotency, structured errors, audit/status history;
- append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration/reconciliation, backup, and triggers;
- privacy-safe evidence labels/filenames and permission-gated processing;
- request-only bootstrap sanitization;
- fail-closed staging/production configuration via Script Properties;
- deterministic parser-safe Apps Script packaging;
- browser/package regressions and staging diagnostics;
- trusted server-rendered request-only/environment attributes.

Detailed historical evidence remains in `docs/WORK_CONTINUATION.md`, relevant incident/runbook documents, and Git history. Do not reread all of it unless the current milestone needs a specific historical fact.

## Known staging state preserved from predecessor

Already completed and not to be repeated merely because the Codex account/session changes:

- dedicated staging Apps Script project/authenticated clasp setup;
- required `STAGING` Script Properties;
- staging database/schema setup;
- staging Drive root/evidence folders;
- migration dry-run and reconciliation;
- timestamped launch backup;
- overdue-lending and scheduled-backup triggers;
- parser-safe staging through Version 9;
- read-only acceptance of diagnostic, authorized internal, and request-only Version 9 entry points.

No production migration was applied and no production resource was modified.

## Data/invariant facts retained

- Earlier read-only validation found the four original legacy tabs matched the supplied backup value-for-value.
- `01_ITEM_MASTER` contained 397 records: 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, no missing units.
- Known date-serial anomalies remain `VERIFY`; no quantity was corrected.
- Posted ledger/history records remain immutable; use adjustments/reversals rather than destructive edits.

## Preserved verification evidence

At runtime-truthfulness checkpoint `7156c256414b797f4b0f19431b399009f31feebd`:

- focused Vitest: 2 files / 14 tests passed;
- `npm run check`: passed;
- Vitest: 10 files / 69 tests passed;
- Vite build: passed with 17 modules transformed;
- Apps Script static validation: passed;
- deterministic generated-package checks: passed;
- standalone artifact verification: passed at 210,112 bytes each;
- `npm run test:e2e`: 29 passed, 25 intentionally skipped, 0 failed.

At preserved predecessor `81efe82618048b79a821f93bd95a0be00eaeff43`, associated GitHub `CI` and `Apps Script static check` workflow runs completed successfully.

The current continuity/policy updates are documentation, specification, and instruction changes only. No new runtime test suite is claimed for them.

## Current hard boundaries

- Do not start from stale `main` if that would discard preserved launch-readiness history.
- Do not reset, clean, discard, overwrite, or force-push unknown work.
- Do not deploy Apps Script or create another staging version from the current continuity pointer.
- Do not apply migrations, seed final institutional access, perform operational Sheet/Drive writes, or touch production without explicit authorization and the required gates.
- Do not begin Phase 2 in the Phase 1 Sol task.
- Do not continue past any completed phase boundary without the required manual model switch.

## Next task

Start a fresh Codex task using **GPT-5.6 Sol — High** and follow only:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. `.codex/specs/v0.6-phase-1-sol-high.md`

Then perform the Git handshake and the current read-only baseline reconciliation. Read any additional files only when a specific reconciliation fact requires them.
