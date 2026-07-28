# Changelog

## Unreleased - v0.7.0 Phase 20 privacy and consent (2026-07-28)

### Added

- Accessible Privacy Notice and Acceptable Use dialogs for requester and
  borrower paths, covering data use, authorized review, private tracking,
  borrower responsibility, evidence/photo consent, governed retention,
  corrections, and role-based support.
- Required privacy, acceptable-use, evidence/photo, and borrower-responsibility
  acknowledgments with server-side validation and safe versioned audit metadata.

### Privacy

- No institutional contact, legal basis, or retention duration was invented;
  unavailable policy detail is stated truthfully.
- Public tracking codes remain out of URLs and browser storage; lending receipts
  expose neither tracking codes nor internal ticket IDs; structured logs remain
  redacted and unknown production errors remain generic.

### Verified

- `npm run check`: 73 Vitest files / 474 tests plus all repository gates.
- Focused policy/redaction tests: 14 / 14; local Worker/D1/R2: 34 / 34; full
  Playwright: 127 passed / 311 intentional skips; exact-head PR #9 CI: 6 / 6.
- Exact staging runtime `4709e84` passed cache-busted readiness and live
  390px/1440px Request Center/Lending Center policy acceptance without creating
  workflow fixtures.

### Boundary

- Production was not deployed, migrated, seeded, promoted, merged, tagged, or
  otherwise modified.

## Unreleased - v0.7.0 Phase 19 governed brand assets (2026-07-28)

### Added

- Schema 28 owner-only brand capability, six-slot registry, immutable retained
  versions, published pointers, optimistic revisions, replay records, and
  append-only lifecycle history/audit.
- Protected Brand Assets upload, preview, publish, replace, rollback, alt-text,
  and version-history workflow backed by versioned private R2 objects.

### Fixed

- Public brand delivery now follows D1-published pointers with a bounded legacy
  fallback, while the login, shared shell, requester/borrower identity,
  favicon, and catalog placeholders use governed routes automatically.
- Upload validation now derives PNG/JPEG/WebP/SVG type from bytes, enforces
  dimensions and size, sanitizes SVG, hashes content, and rejects duplicates.
- Private candidate routing includes `/api/*`, `/brand/*`, and `/media/*`;
  owner bootstrap accepts `brand.manage`; requester event ordering is fully
  qualified for local Worker/D1 execution.

### Verified

- `npm run check`: 72 Vitest files / 467 tests plus all repository gates.
- Full Playwright: 127 passed / 311 intentional skips; fresh local Worker/D1/R2:
  34 / 34 passed; exact-head PR #9 CI: 6 / 6 passed.
- Staging schema 28 reconciles six published slots, seven retained versions,
  fifteen lifecycle/history rows, owner-only mutation, responsive browser
  acceptance, fail-closed media rejection, and post-test fixture cleanup.

### Boundary

- Production was not deployed, migrated, seeded, promoted, merged, tagged, or
  otherwise modified.

## Unreleased - v0.7.0 Phase 18 event readiness (2026-07-28)

### Added

- Schema 27 Main Events → Event Days → Activities hierarchy with server-owned
  IDs/codes, included activity items, nullable operational values, operational
  record links, optimistic revisions, and append-only Activity History.
- Protected Administrator and Director Event Management for dates/times,
  venues, committees, deadlines, request windows, status, readiness,
  preparation progress, links, and audited corrections.
- Deterministic authenticated YDD 2026 staging seed that records August 10/12
  as superseded history, rejects duplicates/unexpected activities, and
  reconciles the approved September 1–2 hierarchy.

### Fixed

- Upcoming-event, Request Center, Release Desk, and requester projections now
  use active authoritative Event Days and Activities instead of empty or
  synthetic event fallback.
- Missing committee/deadline/window fields render `Not added yet`; null
  readiness and progress render `Not assessed` rather than zero percent.
- TBA activities use their governed Event Day for upcoming-event inclusion and
  sorting; empty roadmap data renders a truthful unpublished/not-assessed state
  instead of `NaN%`.
- Requests now persist the linked main event, event day, and activity derived
  from the selected active hierarchy.

### Verified

- ESLint and 71 Vitest files / 464 tests pass.
- Fresh migrations 0001–0027 pass; focused local Worker authorization,
  null/TBA, and history coverage passes.
- Protected Event Management passes at 390×844 mobile and 1440×900 desktop.
- Exact implementation commit `d54e733f3936513bb2305e53fa95d984060c28a4`
  passes the complete `npm run check`, including deterministic Apps Script
  parity, distribution verification, Cloudflare types, and deployment dry-run.
- A verified private pre-0027 export was created; staging migration 0027 is
  applied; exact candidate `41e2ead` was deployed; the approved seed and replay
  reconcile one series / two active days / seven activities with no active
  August schedule or duplicates.
- Live review found and rejected omitted TBA/zero-readiness/empty-roadmap
  output. Repair `a342c7a2d8b03b21ad400705575adada0a69591a` passes its
  focused Worker/browser regression, ESLint, 71 / 464 Vitest, and generated
  build. Exact staging redeploy, repeated browser acceptance, and exact-head CI
  subsequently passed at exact runtime
  `80c0db43cc06145ada09434fd55f3fd31c0873f7`.
- Added preview-state compatibility for the Event Days bootstrap collection.
  The complete repository gate passes; the six-width browser matrix passes
  127 / 311 intentional skips; live mobile/desktop acceptance passes; seed
  replay remains 2 days / 7 activities; and PR #9 exact-head CI passes 6 / 6.

### Boundary

- The owner approved September 1–2 YDD 2026 and superseded the August 10/12
  plan. Unknown operational values remain owner-review-required and are not a
  Phase 18 data blocker. Production was not modified.

## Unreleased - v0.7.0 Phase 17 inventory data readiness (2026-07-28)

### Added

- Ledger-only production inventory import with idempotent opening-balance
  movements, duplicate-ID quarantine, private owner review, and full
  reconciliation SQL.
- D1 migration 0024 to migrate legacy opening metadata into the immutable
  ledger and reject future direct nonzero opening writes.
- Regression coverage for opening balances, replay safety, duplicate source
  IDs, classification review, and migration guards.
- Owner-approved safe-classification amendment and additive D1 migration 0025
  with explicit `UNVERIFIED` / `NEEDS_CLASSIFICATION` state, fail-closed
  lending triggers, and append-only classification history.
- Protected Needs Classification queue with search, filters, progress,
  pagination, individual review, safe non-lendable bulk review, explicit
  lending confirmation, condition/maintenance gates, and physical asset-tag
  registration that never derives instances from opening quantity.
- Server-side classification revalidation for lending submission, approval,
  and handoff.

### Verified

- Authoritative private snapshot: 397 unique item IDs, zero missing units,
  zero invalid/negative openings.
- Isolated D1: migrations through schema 24, import, and exact replay passed;
  397 imported / 0 rejected; zero opening-ledger count/quantity difference,
  zero negative stock, and zero active mock inventory.
- Current `npm run check` passed with 71 files / 463 tests and every repository
  gate. Isolated schema-25 Worker/D1 acceptance passed 31 / 31, full browser
  coverage passed 126 with 306 intentional skips, and the focused Inventory
  classification API/queue browser scenarios passed.

### Boundary

- All 397 items may import only in the conservative pending-classification
  state and remain non-lendable until authorized physical review. Phase 17 is
  not yet accepted; staging gates remain pending, and
  production was not migrated, imported, deployed, promoted, merged, tagged,
  or released.

## Unreleased - v0.7.0 Phase 16 Shared Release Desk and System Status (2026-07-28)

### Added

- One canonical Shared Release Desk proof across full, partial, corrected, and final recipient-confirmed release projections.
- Protected System Owner presentation for primary R2, Drive backup queues/failures, oldest pending, latest success/reconciliation, and restore-required counts.
- Exact local and staging acceptance for request, line, recipient, evidence, ledger, correction, idempotency, scope, and authorization invariants.

### Fixed

- Replay a fully consumed release correction before mutable remaining-quantity validation while preserving actor and scope authorization.
- Route protected evidence status through every browser runtime adapter and refresh the governed Owner session before final staging cleanup.

### Verified

- `npm run check`: 70 Vitest files / 457 tests; local Worker/D1: 30 / 30; browser matrix: 126 passed / 306 intentional skips.
- Exact staging runtime `ac83af8`, schema 23, passed the complete Shared Release Desk, verified private backup, protected System Status, archive, reconciliation, and 6 / 6 draft PR checks.

### Boundary

- Phase 16 is accepted on staging and Phase 17 is next. Production was not deployed, migrated, written, promoted, merged, tagged, or released.

## Unreleased - v0.7.0 Phase 16 hybrid evidence storage sub-slice (2026-07-28)

### Added

- Private R2 authoritative evidence writes with post-write verification, protected D1 metadata, governed retention, and asynchronous Google Drive backup jobs.
- Owner-protected evidence status, archive, reconciliation, and fail-safe restore with append-only activity and audit evidence.
- Bounded retry, duplicate-delivery idempotency, verification-before-`SYNCED`, and redacted technical diagnostics.

### Fixed

- Replaced an over-length Google Drive custom-property idempotency value with its deterministic SHA-256 marker while retaining the full evidence-ID/checksum key in protected D1 metadata.
- Preserved a bounded HTTP status suffix in protected Drive failure codes without exposing raw provider errors.

### Verified

- `npm run check`: 70 Vitest files / 456 tests; local Worker/D1: 30 / 30.
- Exact staging runtime `5f2645d`, schema 23, passed focused hybrid evidence acceptance, governed Owner restore, independent R2/Drive checksum reconciliation, synthetic cleanup, and 6 / 6 PR checks.

### Boundary

- Phase 16 remains active for the broader Shared Release Desk and protected System Status acceptance. No production deployment, migration, data write, promotion, merge, tag, or release occurred.

## Unreleased - v0.7.0 Phase 9 Administrator workspace (2026-07-26)

### Added

- Exception-first Administrator Control Center with nine actionable access, evidence, reference, inventory, request, lending, release, environment, and cross-workspace signals.
- Complete Operations destination map, including distinct Release Desk, validated Receiving, and Evidence status paths.
- Real read-only Operational Health, Evidence status, and governed Brand Asset surfaces inside the existing authorized control desk.

### Fixed

- System Owner can see Lending Usage when its server capability projection includes `lending.usage.view`.

### Verified

- `npm run check`: 61 Vitest files / 416 tests; full Playwright 104 passed / 250 intentional skips.
- Exact staging runtime `e3d3c76`, schema 19, passed governed brand and complete owner-authenticated Administrator/Access Management acceptance; PR #9 passed 6 / 6 checks.

### Boundary

- No migration or production action occurred. Advanced access, brand lifecycle, and owner operational-health mutations remain in their later master phases. Production remains NO-GO; Phase 10 is active.

## Unreleased - v0.7.0 Phase 8 System Owner and operational scope (2026-07-26)

### Added

- Protected `SYSTEM_OWNER` authorization with every existing capability and access to all five real workspaces plus Release Desk.
- Server-governed committee, location, event, and office scope catalogs with URL recovery, read filtering, fail-closed validation, and consequential audit context.
- Migration 0019 and local/deployed owner, scope, route, filtering, audit, and Access Management regression coverage.

### Verified

- `npm run check`: 61 Vitest files / 416 tests; local Worker 25 / 25; full Playwright 100 passed / 242 intentional skips.
- Exact staging runtime `ffe7181`, schema 19, passed governed brand and complete System Owner/authentication/scope/Access Management acceptance; PR #9 passed 6 / 6 checks.

### Boundary

- One approved staging credential was promoted privately and its sessions revoked; no secret entered Git. No production mutation occurred. Production remains NO-GO; Phase 9 is active.

## Unreleased - v0.7.0 Phase 7 shared internal shell (2026-07-26)

### Added

- One authenticated context bar for five real internal routes with responsive workspace switching, governed operational scope, breadcrumb, environment/release, attention, and account controls.
- Safe Administrator route switching that preserves the authenticated actor and server capability projection.
- Live acceptance coverage for all ten approved department accounts and their Access Management rows/reset controls.

### Fixed

- Queue an Admin account-directory search entered while the initial directory request is still loading.
- Open the shared-shell account menu before the deployed sign-out assertion.

### Verified

- `npm run check`: 60 Vitest files / 409 tests; full Playwright: 99 passed / 237 intentional skips / zero failures.
- Exact staging runtime `6c1906a`, schema 18, passed governed branding, full authentication/Access Management, five-workspace switching, 10 / 10 account login/identity reconciliation, and 6 / 6 PR checks.

### Boundary

- No migration or production action occurred. Production remains NO-GO; Phase 8 is active.

## Unreleased - v0.7.0 Phase 5 canonical lendable catalog (2026-07-24)

### Added

- Governed lending fields on the canonical Inventory Management catalog, borrower-safe and staff-only projections, and one authoritative availability model.
- Reusable asset instances, ticket assignment, condition/photos, maintenance, append-only movements, and bounded R2 catalog-image delivery.
- Additive migration `0014_lending_catalog_assets.sql`.

### Verified

- `npm run check`: 58 Vitest files / 401 tests; local Worker/D1: 18 / 18; full Playwright: 94 passed / 224 intentional skips / zero failures.
- Staging migration/reconciliation, exact-SHA deployment, four deployed scenarios, post-smoke cleanup, and six PR checks passed at runtime `fc9ef1c`.

### Boundary

- The real public catalog remains empty, the synthetic fixture is archived and `NOT_LENDABLE`, and production remains NO-GO.

## Unreleased - v0.7.0 Phase 2/3 targeted correction (2026-07-24)

### Added

- Governed R2-backed login background, DOL logo, HAU-USC logo, and favicon routes with responsive shared lockups.
- Source-grounded guided public Request Center with distinct creation and private-tracking flows plus verified related-request linking.
- Additive migration `0013_public_request_guidance.sql`.

### Verified

- `npm run check`: 57 Vitest files / 398 tests; local Worker/D1: 17 / 17; full Playwright: 94 passed / 224 intentional skips / zero failures.
- Staging migration 0013, exact-SHA deployment, governed asset hash checks, three responsive login checks, and four deployed acceptance scenarios passed at runtime `6c4cff6`.

### Boundary

- The Phase 4 Lending Center backend is preserved. The synthetic lending smoke fixture is archived, real public eligibility remains empty, and production remains NO-GO.

## Unreleased - v0.7.0 Phase 4 public Lending Center (2026-07-22)

### Added

- Direct no-login `/lending` with borrower-safe catalog filters, validated external-borrower multi-item submission, and private group tracking.
- Canonical `FOR_REVIEW` ticket routing, HMAC-digest tracking, D1 attempt limits, and additive migration `0012_public_lending_tracking.sql`.

### Verified

- `npm run check`: 57 Vitest files / 393 tests; local Worker/D1: 17 / 17; full Playwright: 94 passed / 224 intentional skips / zero failures.
- Staging migration/reconciliation and three deployed scenarios passed at exact runtime `8e5c25d`, schema 12 / migration 0012; zero reservations and unchanged real inventory.

### Boundary

- No email verification is claimed. The real public-lending catalog remains empty pending Phase 5 governance; the synthetic smoke fixture is archived. Production actions remain incomplete.

## Unreleased - v0.7.0 Phase 3 public Request Center (2026-07-22)

### Added

- Direct no-login `/request` with one unified category-aware composer, governed reference choices, and private request tracking.
- HMAC-digest tracking, same-origin JSON enforcement, D1 attempt limits, and additive migration `0011_public_request_tracking.sql`.

### Verified

- `npm run check`: 57 Vitest files / 393 tests; local Worker/D1: 16 / 16; full Playwright: 93 passed / 219 intentional skips / zero failures.
- Staging migration/reconciliation and deployed acceptance passed at exact runtime `6fbf377`, schema 11 / migration 0011; inventory balance remained unchanged.

### Boundary

- Public no-login lending, remaining workspaces/operations, final staging/rollback gates, and all production actions remain incomplete.

## Unreleased - v0.7.0 Phase 2 secure staff login (2026-07-22)

### Added

- HAU-inspired `Staff sign in`, governed R2 background delivery, accessible password visibility, safe recovery guidance, and explicit session/account/service states.
- Unique verified profile-email login with additive migration `0010_verified_login_email.sql`.

### Verified

- `npm run check`: 57 Vitest files / 392 tests; full Playwright: 92 passed / 214 intentional skips / 0 failures.
- Staging auth/Access Management/email-login smoke passed at exact runtime `edf6dcb`, schema 10.
- Duplicate legacy emails remain unverified and Access-ID-only; zero verified-email collisions exist.

### Boundary

- Public no-login request/lending, remaining workspaces/operations, final staging/rollback gates, and all production actions remain incomplete.

## Unreleased - v0.7.0 Phase 1 Cloudflare operations foundation (2026-07-22)

### Added

- Durable v0.7.0 production-completion specification, branch/PR inventory, and all-ref preservation evidence.
- Distinct staging/production D1 and R2 resources, fail-closed private config separation, protected secret packages, R2 `BRAND_ASSETS`, Workers Logs, sampled Traces, redacted structured request logs, correlation headers, and `/api/version`.
- Versioned password-pepper support that keeps explicit legacy hashes verifiable while all new protected hashes use the secret-managed pepper.
- Self-contained fresh local Worker/D1 acceptance launcher.

### Verified

- `npm run check`: 56 Vitest files / 389 tests and every repository gate passed.
- Fresh local Worker/D1 Playwright: 15 / 15 passed.
- Live staging auth/Access Management: 1 / 1 passed.
- Deployed runtime `8b4af04` reports STAGING, release 0.7.0, schema 9/migration 0009, D1/R2/protected configuration ready, and safe correlation IDs.

### Boundary

- Production Worker upload/deployment, production migrations/data, merge/tag/release, and production smoke remain gated by later phases.
- The governed event source is empty; approved future event values are required once before final freeze and will not be invented.

## Unreleased - v0.6 Phase 3 Task 3 staging authentication/access repair (2026-07-22)

### Added

- Administrator-only Access Management with a safe account directory, governed account actions, two-step Access ID changes, session revocation, and append-only history/reservations.
- Ordered D1 migration `0008_access_management.sql`, a deployed staging auth/access smoke gate, and fail-closed production authorization tooling.

### Fixed

- Invalid unknown-account login no longer violates the non-null audit entity constraint or renders a generic service-unavailable error.
- Authentication errors no longer remount/refocus the Access ID field; standard username/current-password autocomplete remains supported.
- Access Management remains reachable when the unrelated legacy Reference Administration endpoint is unavailable.

### Verified

- Deployed staging candidate `a5a942eaa14a2639d7eeaee5b7f5cbbe276ffc68` reports STAGING, schema 8, migration 0008, and ready true.
- `npm run check`: 55 Vitest files / 382 tests; full Playwright: 91 passed / 209 intentional skips / 0 failures; fresh local workerd/D1: 14 / 14; deployed auth/access smoke: 1 / 1.

### Boundary

- Production is NO-GO. Gate E authorization, full live acceptance, rollback rehearsal, final reviews, production authorization, production actions, PR merge, and production promotion remain incomplete or prohibited.

## Unreleased - v0.6 Phase 3 local Cloudflare/D1 staging candidate (2026-07-22)

### Added

- Cloudflare Worker with Static Assets, API routing, health/readiness, D1 authentication/session/rate-limit repositories, scoped operational services, safe logging/errors, and security headers.
- Seven ordered D1 migrations covering the operational domain, authorization, rate limiting, revisions, import boundary, transaction guards, and target-entity committee scope.
- Deterministic read-only Google Sheet export, explicit Sheet-to-D1 mapping, validation/import/reconciliation tooling, fictional local seed/proof, and exact-candidate private staging authorization tooling.
- Local workerd Chromium acceptance for all five role routes plus Cloudflare architecture, Google sidecar, D1 migration/rollback, and local acceptance guidance.
- Real D1 canvass, preferred-quote, deliverable transition, split routing, restock detail/transition, cumulative receiving, and fail-closed evidence-reference boundaries.

### Changed

- Enabled the complete frontend for REST/Worker bootstrap while preserving request-only privacy and action-driven refresh.
- Added explicit recipient confirmation to the REST adapter and persistent server-side capability/entity-scope checks for operational and privileged API families.
- Added a distinct local HTTP authentication cookie name; deployed HTTPS continues to use secure `__Host-` cookies.
- Repaired same-origin HTTP bootstrap so the staging SPA calls its co-located Worker when no separate API base URL is configured.

### Verified

- `npm run check`: 52 Vitest files / 369 tests with all repository, generated-artifact, Apps Script, Cloudflare type, and dry-run gates passing.
- Local workerd/D1 Chromium: 10 / 10; full repository Playwright: 90 passed / 204 intentional skips / 0 failed.
- `dist/index.html`: 455,685 bytes / SHA-256 `d78f4fc3c741e67349b60d8fe3615767767db0ef55d98acf58243d4aaa5e1782`.
- Frozen code candidate `62abc6d1e1d6b3079e8508381b7c336c636080e5` is pushed and matched draft PR #9; all six remote checks passed on 2026-07-22.

### Boundary

- This is not a completed Phase 3 or deployed staging system. Remote Cloudflare/Google access, approved Sheet migration, Drive/evidence integration, rollback rehearsal, production promotion, `main` update, and PR merge remain blocked.

## Unreleased - v0.6 Phase 2 TERRA complete (2026-07-22)

### Added

- Thirteen tracked fixed-clock previews covering inherited login/onboarding, all five internal experiences, Request Center, Lending Hub, Release Desk, and representative 390 px adaptations.
- System/role, Request Center, Lending Hub, Administrator/Director, and demo guidance plus the durable `.codex/PHASE_2_TERRA_HANDOFF.md`.
- Opt-in preview generation so routine browser and CI runs do not rewrite tracked review artifacts.

### Fixed

- Restored the Administrator control-desk hero gradient and white-heading contrast by removing a conflicting generic panel surface; added a browser regression assertion and regenerated all derived HTML through `npm run build`.

### Verified

- Final delivery checkpoint `de194f5c37cadf2eb2983cfe3450a1c99ceed735` is pushed and matches draft PR #9.
- `npm run check` passes with 49 Vitest files / 356 tests; opt-in preview generation passes 3 / 3 with 3 intentional project skips; normal complete Playwright passes 90 / 204 intentional project/viewport skips / 0 failures without changing preview hashes.
- `dist/index.html` is 455,779 bytes / SHA-256 `369ef83f8cdfe520049ae26fc853e70072ed54f9196a2899adff09dbd93ea8ed`.
- Remote `validate`, `verify`, `build`, `report-build-status`, automatic `deploy`, and `browser-smoke` pass at the exact delivery checkpoint. No manual deployment, production promotion, institutional write, `main` update, or PR merge occurred.

## Unreleased - v0.6 Phase 2 Gate 6 shared operational workflows (2026-07-22)

### Added

- Explicit required recipient attestation in the Release Desk, with durable confirmation metadata and responsive UI proof for partial physical handoffs.
- Canvass stale-quote, missing-unit, linked-unit-mismatch, and safe evidence/source-link presentation in the library and quote comparison.
- Cumulative deliverable receiving presentation for quantity received now, total received, quantity remaining, and approved total.

### Changed

- Moved Release recipient/scope/line/balance/reservation validation ahead of stock and ledger mutation, rejected duplicate or mixed-scope release lines, and retained the existing lock/idempotency/audit/append-only contracts.
- Limited event-deliverable receiving to `PROCURED` or `PARTIALLY_RECEIVED` and kept subsequent partial receipts selectable until the approved quantity is complete.
- Returned complete internal Release and Canvass DTO fields needed for line history, recipient confirmation, evidence links, source links, preferred quote, notes, and price history.

### Verified

- `npm run check` passes with 49 Vitest files / 356 tests and `npm run test:e2e` passes 90 / 186 intentional skips / 0 failures.
- Focused Gate 6 Playwright passes 6 / 6 at 390px and 1366px; draft PR #9 checks `validate`, `verify`, `build`, `report-build-status`, automatic `deploy`, and `browser-smoke` pass at `478c2feef3040469c820f356ec8a329a32fbc606`.

## Unreleased - v0.6 Phase 2 Gate 5 Request Center and Lending Hub (2026-07-22)

### Added

- Explicit Event Step 4 presentation for Food, Materials, and Venue & Equipment together, with focused proof that one, two, or all sections may be completed and untouched sections create no child.
- A shared borrower-identity policy for one-to-eight digit Student IDs and borrower-specific approved-source requirements.
- A reviewer confirmation step that records the approved identity source and authorized reviewer without storing a new free-text identity record.

### Changed

- Enforced digits-only Student IDs in the maintained browser layer and Apps Script service boundary.
- Required approved active USC source verification for officers/staff and the approved Angelite/student identity rule before a ticket can move from `FOR_REVIEW` to `READY_TO_CLAIM`; email domain alone is not accepted.

### Verified

- `npm run check` passes with 46 Vitest files / 348 tests, deterministic build/parity, Apps Script validation, and standalone verification. Focused Request Center, Lending Hub, and composite browser proof passes 29 / 31 intentional skips across configured viewports.
- Request submission leaves ledger movements and reservations unchanged; existing server-side transition, duplicate handoff/return, authentication, authorization, and ledger protections remain intact.

## Unreleased - v0.6 Phase 2 Materials & Documentation experience (2026-07-22)

### Added

- A traceable Materials & Documentation layer inside the shared overview, with canvassing, budget, procurement, and release-readiness signals derived from current runtime state.
- Governed action links into the existing Request Center, Procurement & Deliverables, Release Desk, and Inventory workspaces while retaining exact specification, quote-evidence, cumulative-receiving, and provenance context.
- Materials-specific digest decisions and focused unit/mobile/desktop browser coverage.

### Verified

- Focused role unit tests pass 4 / 4; the combined role browser proof passes 8 / 16 intentional skips at 390px and 1366px; `npm run check` passes with 46 Vitest files / 345 tests, deterministic build/parity, Apps Script validation, and standalone verification.

## Unreleased - v0.6 Phase 2 Inventory & Pantry experience (2026-07-22)

### Added

- An exception-first Inventory & Pantry layer inside the shared overview, with catalog-attention, circulation, and stock-release signals derived from current runtime state.
- Governed action links into the existing Inventory, Lending, Restocking, and Release workspaces while retaining distinct on-hand, reserved, and available-to-promise semantics.
- Inventory-specific digest decisions and focused unit/mobile/desktop browser coverage.

### Verified

- Focused role unit tests pass 3 / 3; the combined role browser proof passes 6 / 12 intentional skips at 390px and 1366px; `npm run check` passes with 46 Vitest files / 344 tests, deterministic build/parity, Apps Script validation, and standalone verification.

## Unreleased - v0.6 Phase 2 Food experience (2026-07-22)

### Added

- A deadline-first Food layer inside the shared overview, with food-line, sourcing/budget, cumulative receiving, and controlled-distribution signals derived from current runtime state.
- Governed Food action links into the existing Request Center, Procurement & Deliverables, Release Desk, and Inventory workspaces.
- Food-specific digest decisions and focused unit/mobile/desktop browser coverage.

### Verified

- Focused role unit tests pass 2 / 2; Food responsive browser proof passes 2 / 4 intentional skips at 390px and 1366px; `npm run check` passes with 46 Vitest files / 343 tests, deterministic build/parity, Apps Script validation, and standalone verification.

## Unreleased - v0.6 Phase 2 Director experience (2026-07-22)

### Added

- A decision-first Director layer inside the existing shared overview, with event-series, decision, cross-workflow blocker, and release-readiness signals derived from current runtime state.
- Governed Director action links into the existing Request Center, Procurement & Deliverables, Release Desk, Lending Hub, and Inventory workspaces, plus a bounded Management & Access explanation.
- Director-specific digest decisions and focused unit/mobile/desktop browser coverage.

### Changed

- Recognize the canonical Phase 1 `administrator` and `inventory-pantry` experience IDs in shared role-accent styling while preserving legacy aliases.

### Verified

- Focused role unit tests pass 2 / 2; focused responsive browser proof passes 2 / 4 intentional skips at 390px and 1366px; `npm run check` passes with 46 Vitest files / 342 tests, deterministic build/parity, Apps Script validation, and standalone verification.

## Unreleased - v0.6 Phase 2 Administrator control desk (2026-07-22)

### Added

- An exception-first Administrator control desk in the existing authorized Reference Administration workspace, with explicit Access Management, Reference Data, Link Registry, and Audit & System entry points.
- Administrator-specific digest decisions and focused browser coverage proving that control cards select existing domains and preserve the read-only system-health boundary.

### Changed

- Elevated the existing server-authorized reference workspace with explicit governance language, durable control-area states, and responsive control cards; no capability, service, transaction, or ledger behavior changed.

### Verified

- Focused Administrator unit tests pass 10 / 10; focused browser proof passes 6 / 24 intentional skips; `npm run check` passes with 45 Vitest files / 341 tests, build/parity, and Apps Script validation.

## Unreleased - v0.6 Phase 2 shared shell and design system (2026-07-22)

### Added

- `.codex/DESIGN_REFERENCE_DIGEST.md`, recording the one-time S0003 source hash, source hierarchy, visual tokens, role accents, responsive rules, interaction grammar, prohibited patterns, and role-specific extraction placeholders.
- A shared, accessible mobile navigation surface with primary destinations and a More panel that delegates to the existing role-scoped navigation rather than creating a separate application or permission path.
- Focused unit and responsive E2E coverage for the shared shell and breakpoint-aware navigation.

### Changed

- Updated the non-generated visual runtime extension with the S0003 maroon/gold/paper system, role accent variables, compact mobile header, shared cards/status/actions, and safe bottom spacing for actionable content.
- Regenerated the all-in-one, guided-demo, seven module-shareable, and Apps Script package artifacts through the documented build pipeline.

### Verified

- `npm run check` passed with 45 Vitest files / 341 tests, and `npx playwright test --reporter=dot` completed with `status: passed` (216 scheduled; no failed tests). Focused responsive proofs at 390, 768, and 1366px also pass; no deployment, migration, institutional-data write, access seed, PR merge, or production action occurred.

## Unreleased - v0.6 Phase 1 authentication and security foundation (2026-07-21)

### Added

- Locked `docs/V0_6_ARCHITECTURE_AND_SECURITY.md` covering the three product surfaces, five internal experiences, account lifecycle, canonical role/scope routing, cryptography, protected-action order, threat model, Phase 3 migration boundary, and v0.5 rollback.
- Portable server authentication modules for PBKDF2 password credentials, digest-only opaque tokens, activation and authenticated sessions, CSRF, reset, account disable/revoke, canonical authorization, synthetic repositories, HTTP routing, and secure cookie serialization.
- HTTP-mode Access ID login and starter-account activation UI that collects profile and password fields while preserving server-owned role and committee assignments.
- Focused unit and browser regressions for password/token handling, cookies, safe HTTP responses, enumeration resistance, starter replay/expiry, role preservation, session invalidation, capability/scope denial, CSRF, client contracts, and the request-only authentication boundary.

### Changed

- Merged exact v0.5 integration candidate `12cdfd4de73120bfeedf49582c83e1861ae36b99` into the continuity branch at `aeb05c71937b8479f66d08a9a64800b005343784`, preserving predecessor history and leaving `main` and PR #7 untouched.
- REST/HTTP mutations now send the current in-memory CSRF token when present.
- HTTP-mode internal startup now authenticates before application bootstrap; public request-only mode remains outside the internal login gate.
- Regenerated the all-in-one, guided-demo, and seven module shareables through the documented build pipeline.

### Verified

- Implementation commit `c07e6e6ad5777710a68bef4d1d2aa553b964c108` passes `npm run check`: agent/continuation governance, lint, 44 Vitest files / 340 tests, deterministic build, 33 Apps Script source files / 55 required functions, generated parity, and standalone verification.
- Full Playwright passes 73 tests with 143 intentional project/viewport skips and zero failures.
- Draft PR #9 passes remote `validate`, `verify`, and `browser-smoke` checks at implementation checkpoint `c07e6e6`.
- `git diff --check`, targeted Prettier verification, changed-source sensitive-token scan, and sensitive-filename scan pass.
- No Apps Script/Cloudflare deployment, migration, Sheet/Drive write, production action, `main` update, or PR merge occurred.

## Unreleased — v0.6 continuity bootstrap (2026-07-21)

### Added

- Repository-native `.codex/CURRENT.md` operational pointer so a fresh Codex/ChatGPT task can recover the active phase, branch context, specification, next action, and hard stops without prior chat history.
- `.codex/BOOTSTRAP.md` fresh-session recovery procedure.
- Three accepted model-routed v0.6 execution specifications under `.codex/specs/`: Phase 1 Sol High, Phase 2 Terra, and Phase 3 Sol High.
- `.codex/specs/README.md` phase/model routing index.
- Account-portable continuity rules in `AGENTS.md`, including the required `AGENTS.md -> .codex/CURRENT.md -> active spec -> targeted context` entry path.

### Changed

- Created `chore/v0.6-codex-continuity-bootstrap` from preserved launch-readiness commit `81efe82618048b79a821f93bd95a0be00eaeff43` after the former remote feature branch was no longer present.
- Updated `PROJECT_STATUS.md` to distinguish the implemented 0.4.0 baseline from the new v0.6 transition and to record current GitHub truth: historical PR #2 is closed and unmerged.
- Phase 1 now explicitly starts with read-only baseline reconciliation so v0.6 cannot accidentally start from stale `main` and discard the preserved launch-readiness history.

### Verified

- Preserved predecessor `81efe82618048b79a821f93bd95a0be00eaeff43` still exists and was verified 63 commits ahead / 0 behind `main` (`91a30ee2de015bce1471a2d4fd71d9325af3e936`) at continuity setup.
- GitHub workflow runs associated with the preserved predecessor completed successfully for both `CI` and `Apps Script static check`.
- Historical PR #2 was verified closed and not merged.
- The old `feat/apps-script-backend-and-launch-readiness` branch ref was not present when continuity setup began; the preserved predecessor commit was used non-destructively as the new continuity branch base.
- Continuity changes are documentation/specification/instruction changes only; no application source, generated artifact, Apps Script source, dependency, Sheet, Drive, deployment, migration, or production state was changed.
- No new runtime test suite is claimed for the documentation-only continuity commits; unchanged application code retains its previously verified test/CI evidence.

## Unreleased — integrated v0.5 baseline evidence

## Unreleased - Slice 13 Gate D completion and Gate E checkpoint

- Contained the live 320 px Reference Administration overflow through the
  approved runtime-extension layer and added a Chromium 320 px regression.
  Commit `24ef0b9` passes 39 Vitest files / 323 tests, full Playwright, and PR
  #7 `validate`, `verify`, and `browser-smoke`; the original visual baseline is
  unchanged.
- Published immutable isolated Version 26 and verified exact live widths 320,
  390, 768, 1024, 1366, and 1440 without document-level overflow or unlabeled
  visible controls. Five warm starts complete in 4.413-5.701 seconds.
- Rehearsed near-live mode in two isolated sessions, then restored both to
  manual refresh only. Exact sync latency was not captured, so SYNC-01 remains
  partial. The temporary runner was removed and a fresh pull matched all 39
  candidate files with zero differences or extras.
- Refreshed the protected private authorization record from current Drive
  label readback and owner confirmation; it retains accepted demo Version 13,
  rollback Version 12, and validates through Gate F without exposing private
  identifiers.
- Repaired the progressive bootstrap read projection so unresolved legacy
  handling and lending-policy values fail closed consistently with the full
  bootstrap, while mutation validation remains strict. Commit `4211711`
  passes 39 Vitest files / 323 tests, full Playwright, and PR #7 `validate`,
  `verify`, and `browser-smoke`; generated artifact hashes are unchanged.
- During bounded near-live activation, accepted Version 18 exposed the legacy
  projection failure. The flag was immediately restored to manual-only,
  temporary audited runners were removed, and exact 39-file parity was
  re-proved without changing an item row or inventory ledger.
- Verified immutable Versions 13 and 12 in both internal and requester-only
  modes, recovered the accepted current-demo pointer to Version 13, and
  designated Version 12 as the distinct verified backup. Isolated Version 26
  retains the repair candidate; Version 18 is preserved as incident evidence.
- Completed the protected private authorization record with the recovered
  current-demo and backup labels; it validates through Gate F and keeps all
  private identifiers outside Git.

- Completed private authorization and Gates B-D against the owner-approved
  current demo. Created and verified the launch backup, additive schema,
  seven restricted Drive mappings, migration dry run, reconciliation, and
  canonical triggers without applying a migration or touching production.
- Deployed the reviewed source only to an isolated test deployment, proved
  exact 39-file pull-back parity, preserved owner-only access, and retained
  immutable versions needed for incident recovery and comparison.
- Repaired revision-scoped bootstrap performance and canonical authorization
  mapping. The earlier checkpoint `9b7e627798a8939efd9e043484145bb7d91eb8bb`
  passes 39 Vitest files / 323 tests and GitHub `validate`, `verify`, and
  `browser-smoke`.
- Activated authorization v2 after a clean mapping dry run. Five access rows
  reconcile with zero duplicate IDs, four mapped active subjects, one inactive
  synthetic revocation subject, complete audit/history evidence, and no
  activation error row.
- Gate E currently passes trace, request-only privacy, performance, and the
  approved private-owner load envelope. One synthetic public request reached
  `FOR_REVIEW` with no stock movement and reconciled audit/history/revision.
- Gate E is not complete: the sole authenticated administrator is correctly
  denied operational review/reserve/receive/release/lending capabilities, and
  self-escalation/separation rules prohibit using that same identity as its own
  operational reviewer. Distinct institutional operational and access-review
  identities are required; no control was bypassed.

## Unreleased - Guided offline demo and usability review

- Added `hau-usc-logistics-guided-demo.html`, a generated self-contained
  presenter artifact that opens from `file://` and walks the seven primary
  modules in the same order as the canonical registry.
- Added accessible open/close, Previous, Next, Restart, and Open module
  controls; Escape returns focus to the launcher, updates are announced, touch
  targets are bounded, and reduced-motion preferences are respected.
- Added a timed 12-minute presenter runbook, safety/claim guardrails, fallback
  direct module entry points, and a prioritized usability backlog focused on
  clarity, next actions, cognitive load, responsive interaction,
  accessibility, and operator confidence.
- Local proof passes `npm run check` with 39 Vitest files / 317 tests, full
  Playwright with 70 passed / 128 intentional skips / 0 failed, focused
  `file://` traversal of all seven steps, visual review at 390 px and 1366 px,
  standalone verification, and `git diff --check`.
- Independent read-only review is PASS after reconciling the documented tour
  order, enforcing exact generated-artifact parity, and expanding guided
  control coverage at both 390 px and 1366 px.
- Implementation commit `9b452bf208828b378ad91fd461b25a1f9573a764` is
  pushed at parity. GitHub runs `29483577291` and `29483577272` pass
  `validate`, `verify`, and `browser-smoke` against that exact SHA.
- No generated HTML was hand-edited. No Google resource, upload, deployment,
  staging, production, merge, hosting, or database action occurred.

## Unreleased - Separate shareable HTML modules

- Preserved the canonical all-in-one shareable and added seven deterministic,
  self-contained HTML entry points for Overview, Request Center, Office
  Lending Hub, Release Desk, Restocking, Procurement & Deliverables, and
  Inventory Management.
- Added one ordered module registry shared by authoritative visual assembly,
  generation, verification, and tests. Output names use numeric ordering and
  lowercase kebab-case under `shareable-html-modules/`.
- Each file opens directly in its named module while retaining complete offline
  styles, runtime, navigation, and cross-module workflows. Verification rejects
  missing, stale, extra, externally dependent, or incorrectly activated files.
- Local proof passes `npm run check` with 38 Vitest files / 313 tests, a
  34-module build, 33 Apps Script sources / 55 functions, generated parity,
  and all eight standalone artifacts. Full Playwright passes 68 tests with 124
  intentional skips and zero failures; the focused `file://` proof opens all
  seven module artifacts in Chromium. A second build retained every shareable
  hash, and `git diff --check` passes.
- Focused commit `472013d2b807d7efff6f63a6a9db218303258783` is pushed at
  parity. GitHub runs `29480998590` and `29480998709` pass `validate`,
  `verify`, and `browser-smoke` against that exact SHA.
- No generated HTML was hand-edited. No upload, deployment, Apps Script/Sheets/
  Drive access, external write, staging, production, merge, hosting, or
  database action occurred.

## Unreleased - Slice 13 staging-readiness pack

- Recorded the exact Slice 12 candidate/evidence checkpoint and distinguished
  repository readiness from current Google Workspace authorization.
- Added a dependency inventory, private owner-authorization record, ordered
  preflight/backup/setup/test/rollback gates, must-pass operational acceptance
  matrix, evidence/redaction rules, stop conditions, and a minimal complete
  unblock package.
- Added a fail-closed private authorization-package initializer and validator.
  It refuses in-repository packages, binds safe labels to the reviewed commits
  and artifact hashes, checks all owner/resource/fixture/tester/window/evidence
  dependencies and explicit action decisions, and prints no supplied values.
- Initialized the safe private Slice 13 record outside Git and recorded the
  owner task message as approval for every Gate B-F action category. The
  package now includes a deterministic synthetic-only fixture manifest,
  bounded namespace, mutation/retention rules, private evidence boundary,
  redaction/disposal policy, and verified current-user/SYSTEM-only ACL. Safe
  inventory proved that six preserved clasp configs resolve to two targets and
  that filename labels cannot safely select one. The package remains
  invalid/authorized through `NONE` until live owner/target/tester/window/
  capacity/session/deployment/Drive facts are completed; no private value or
  external resource was exposed.
- Bound the owner's `current demo` instruction to a newly protected private
  config whose fingerprint matches staging in two independent deployment
  backup sets and is distinct from production. Recorded expected Version 18 /
  rollback Version 13 labels for read-only Gate B verification and stored a
  private provenance note without Google identifiers.
- Independent review is PASS after aligning rollback rehearsal to Gate E,
  enforcing backup-before-setup order, resolving real paths, and sanitizing CLI
  errors. Linux CI exposed Windows-only test fixture paths in `3591550`; repair
  `eecbf8f` is green in `validate`, `verify`, and `browser-smoke`.
- Confirmed that private staging clasp candidates and historical deployment
  evidence exist outside Git but are not current target authority. No signed
  matrix, approved non-personal fixture, named tester/signatory roster, current
  owner/operator record, test window, or action-category authorization exists
  in the active workspace.
- No `clasp`, remote Google read, Apps Script/Sheets/Drive access, backup,
  setup, migration, seed, trigger, upload, deployment, staging write,
  production, merge, hosting, or database action occurred.

## Unreleased - Slice 12 Bounded near-live active-module refresh

- Replaced five-second global polling with a 15-second, bounded-jitter,
  single-flight scoped controller that runs only for visible, online,
  focused/recently-active internal sessions and backs off after failures.
- Added one compact re-authorized `api_getScopedRevision` contract, per-module
  CONFIG tokens, conservative operation-to-scope invalidation, and exactly-once
  global mutation revision behavior. Unknown operations and direct Sheet edits
  invalidate all modules.
- An unchanged token performs no module fetch; a changed token invalidates only
  the active bounded module. Dirty forms, request drafts, uploads, and active
  modal workflows defer refresh without overwriting input; abandoned closed
  modal drafts no longer leave stale dirty markers.
- Added request-only revision-token isolation, stale/last-updated/manual-only
  status, fail-closed `HAU_NEAR_LIVE_REFRESH_ENABLED`, safe manual and
  post-mutation refresh, late-response rejection, request/read counters,
  adapters, documentation, and synthetic browser network evidence.
- Verification passes `npm run check` (36 Vitest files / 303 tests, 34-module
  build, 33 Apps Script sources / 55 functions, deterministic parity, two
  411,048-byte artifacts), full Playwright (67 passed / 119 intentional skips /
  0 failed), focused 390 px proof, privacy/diff review, and final implementation
  validation after baseline-token, request-only, and modal-lifecycle repairs.
- Remote verification is green at focused implementation commit
  `a563f2f179b710ac7c0d46a8af05a4349a5e625b`: run `29477031867` passed
  `validate`; run `29477031799` passed `verify` and `browser-smoke`.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, staging, production, Cloudflare,
  database, or hosting action occurred. Live p95/quota/concurrency acceptance
  remains Slice 13 and is not claimed by repository evidence.

## Unreleased - Slice 11 Restock Safety

- Replaced consequential queue-row controls with authoritative detail review,
  server-returned allowed actions and disabled reasons, explicit confirmation,
  required reasons, and bounded timeline/quote/receipt projections.
- Defined each restock as the stable `RRQ-<Request_Line_ID>` projection of one
  durable catalog-restock line. Added schema `1.6.0` optimistic
  `Workflow_Revision`, exact line/item/unit validation, preferred-quote gates,
  cumulative receipt-derived completion, and parent-status derivation without
  implicit sibling mutation.
- Added scoped capabilities, fail-closed `HAU_RESTOCK_WORKFLOW_ENABLED`, script
  locking, idempotent replay, stale-revision denial, reconciliation protection,
  immutable `08_RESTOCK` plus `PURCHASE_RECEIPT` ledger appends, history, audit,
  adapters, active desktop/mobile UI, and authoritative refresh.
- Verification passes `npm run check` (36 Vitest files / 296 tests, 34-module
  build, 33 Apps Script sources / 54 required functions, deterministic parity,
  standalone verification), full Playwright (67 passed / 119 intentional skips
  / 0 failed), focused mobile/desktop restock proof, sensitive-data review,
  `git diff --check`, and final implementation validation after exact-unit
  hardening.
- Remote verification is green at implementation commit
  `d5cf2247f1997b18d8d2b8ef9fb367b0e7214d51`: run `29474985205` passed
  `validate`, and run `29474985252` passed `verify` and `browser-smoke`.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.

## Unreleased - Slice 10 Authorized reference-data administration

- Added a bounded Reference Administration workspace for organization,
  committees, venue/equipment, routing, lifecycle, permissions, roster-owned
  memberships, and synchronization health without exposing a raw-sheet grid.
- Added controlled add/update/archive/restore, effective dates and aliases,
  dependency protection, explicit before/after comparison, optimistic numeric
  revisions, script locking, idempotency, durable history/audit, and a
  fail-closed `HAU_REFERENCE_ADMIN_WRITES_ENABLED` control.
- Added distinct-review permission escalation and cross-office routing with an
  actionable reviewer comparison, required reason, stored-payload revalidation,
  stale-revision denial, requester/reviewer self-escalation denial, and
  revocation-only emergency access that rejects dormant role/scope grants.
- Hardened partial-write behavior by recording `APPLYING`, appending before
  superseding the exact expected revision, preserving the old record on append
  failure, detecting overlapping current revisions, and returning a visible
  reconciliation-required state instead of retrying or claiming success.
- Added schema v1.5 tables/columns, canonical operations/capabilities, adapters,
  active responsive UI, server-safe DTOs, synthetic unit/browser fixtures, and
  generated standalone/Apps Script parity. Closed an integration finding by
  deferring the admin workspace fetch until its view is opened.
- Verification passes governance/lint, 34 Vitest files / 284 tests, a 33-module
  build, 33 Apps Script sources / 54 required functions, deterministic parity,
  two 393,977-byte standalone artifacts, full Playwright 65 passed / 115
  intentional skips / 0 failures, sensitive scan, and `git diff --check`.
  Independent implementation validation is final PASS after targeted repairs.
- Remote verification is green at implementation commit
  `ece5bf846399c2793ab088214ba2a1693d3693ae`: run `29472954664` passed
  `validate`, and run `29472954676` passed `verify` and `browser-smoke`.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.

## Unreleased - Slice 9 Venue and Equipment reference/request workflow

- Added additive, initially empty live Venue and Equipment reference/route
  tables with stable IDs, revisions, effective dates, safe aliases/location,
  responsible office/authority, lead time, requestability, and return policy.
- Added bounded safe search, exact server validation, immutable reference/route
  snapshots, amendment provenance, constrained Other triage, and server-owned
  routing to exactly one of the three existing committees. Requestability is
  explicitly not a booking, reservation, approval, or stock guarantee.
- Added confirmation, blocker, Other disposition, return, linked evidence,
  revision/idempotency/locking, audit/history, scoped queue/update endpoints,
  adapters, feature flag, active predictive add/edit/remove UI, and workflow
  management UI. Stored specialized children remain actionable when new
  selection is disabled.
- Added synthetic-only fixtures and domain, Apps Script VM, adapter/package,
  and Playwright coverage. No institutional catalog was invented or imported.
- Local verification passes governance, lint, 32 Vitest files / 262 tests,
  32-module build, 32 Apps Script sources / 54 functions, deterministic parity,
  standalone verification, full Playwright 61 passed / 101 intentional skips /
  0 failed, sensitive scan, and `git diff --check`. Final independent review is
  PASS after targeted effective-revision, server-clock, preview-parity,
  replay-immutability, and exact evidence validation repairs.
- No deployment, migration/import, Script Property change, external Google
  write, PR merge, Cloudflare, database, staging, or production action occurred.

## Unreleased - Slice 8 Materials Committee workflow

- Added a versioned Materials specialization with controlled category,
  specification, required-by, usage, sourcing preference, exact quantity/unit,
  live catalog validation, and immutable legacy source provenance across
  amendments.
- Enforced exact `ACTIVE` status and controlled category, retained the dedicated
  `VERIFY` denial, prohibited automatic substitution/unit conversion, and
  required one stock-issue or procurement-receipt path.
- Added explicit substitution reference/reason with immutable before/after
  history and audit metadata, blocker controls, path-matching uploaded evidence,
  and full readiness rechecks at handoff and completion.
- Added the `COM_MATERIALS`-scoped server queue/update route, revision,
  idempotency, locking, authorization, parent projection, fail-closed
  `HAU_MATERIALS_REQUESTS_ENABLED` flag, active request/queue UI, and blank
  required operational inputs.
- Verification passes: `npm run check` (30 Vitest files / 244 tests, 31-module
  build, 31 Apps Script sources / 51 required functions, generated parity, and
  two 329,544-byte artifacts); full Playwright 61 passed / 101 intentional skips
  / 0 failures; changed-scope sensitive scan; `git diff --check`; and final
  independent review PASS with no findings.
- Implementation commit `1f05b526e457a946e0575b4aed2660c249105923` is
  pushed and matched draft PR #7. Runs `29390112932` and `29390112933` passed
  `validate`, `verify`, and `browser-smoke`.
- No deployment, migration, Script Property change, Apps Script/Sheets/Drive
  external write, private operational data access, PR merge, Cloudflare,
  database, staging, or production change was performed.

## Unreleased - Slice 7 Food Committee workflow

- Added a versioned, privacy-minimized Food specialization to composite Event
  Logistics requests with controlled service class, headcount/servings,
  service window/location, aggregate dietary status, sourcing mode/reference,
  server-owned lead-time state, and deterministic attention flags.
- Added server-scoped Food queue/detail and revision-safe Food mutation routes,
  canonical `COM_FOOD` authorization, public read denial, sibling-payload
  filtering, idempotency/locking, durable history/audit, and evidence validation
  before completion.
- Added the active rendered Food request fields and Food Committee queue/update
  workflow, including component-linked delivery-proof upload, plus mock and all
  adapter/service contracts. New submissions remain behind the fail-closed
  `HAU_FOOD_REQUESTS_ENABLED` flag while stored Food children remain readable.
- Preserved Food attention across generic reopen/amend paths and required Food
  revisions for transition/cancel/reopen/amend/add/assign/escalate operations.
- Hardened Apps Script template assembly so minified `$&` tokens in generated
  JavaScript are inserted literally rather than interpreted by string
  replacement.
- Verification passes: `npm run check` (28 Vitest files / 231 tests, 30-module
  build, 30 Apps Script sources / 49 required functions, deterministic generated
  parity, two 311,165-byte standalone artifacts); full Playwright 61 passed / 101
  intentional skips / 0 failures; focused rendered Food workflow; changed-file
  sensitive scan; `git diff --check`; and final independent review PASS.
- Implementation commit `e85e27558f02e6a1f8b3b51be514a0382df24a10` is
  pushed; PR #7 matched it. Actions runs `29388258079` and `29388258076`
  passed `validate`, `verify`, and `browser-smoke`.
- No deployment, migration, Apps Script/Sheets/Drive external write, private
  operational data access, PR merge, Cloudflare, database, staging, or
  production change was performed.

## Unreleased - Naming and visibility baseline

### Clear workspace and GitHub names

- Standardized the single active checkout as `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system` and renamed the active branch to `integration/v0.5-baseline`.
- Consolidated the legacy deployment configuration, institutional source, and repository-backup folders under `private-config`, `source-material`, and `backups` without changing file counts or byte counts. Archived the older non-Git Context Vault snapshot separately under `D:\Documents\GitHub\archives`.
- Moved both ignored Apps Script `.clasp.json` files to named restricted locations under `private-config\apps-script`; no private values entered Git or command output.
- Created and pushed five dated archive tags for the exact deployment, SDD, QR, routing, and approved-prototype heads. Created a second verified 37-ref complete-history bundle (1,574,863 bytes; SHA-256 `EE76A23C590679F2E19B95B047FCB18B42F520B28C547A7799A4EA342E53C765`).
- Closed PRs #3-#5 without merge, deleted their archived remote branches plus the routing and snapshot branches, and verified the branch list contains only `integration/v0.5-baseline` and `main`.
- GitHub closed PR #6 automatically during the active-branch rename and would not reopen it. Created draft PR #7 at the unchanged head and linked #6 as the preserved audit trail.
- Retired the clean deployment linked worktree after preserving its exact private configuration and branch tip. No product behavior, generated application source, merge, deployment, migration, external operational data, or production state changed.

## Unreleased - Phase 3.5 repository/workspace reconciliation

### Preservation and structure

- Froze clean synchronized Phase 3 head `6abfb411...`, rebuilt the complete
  local-folder/Git/worktree/branch/tag/PR inventory, and wrote the execution plan
  before cleanup.
- Created and verified a current 34-ref complete-history bundle (1,559,241
  bytes; SHA-256
  `924E52E027E40EAFB141A73C4431E0FAF0DA35432D84F36AA531E090B10BE04F`).
- Preserved the superseded routing clone's six runtime files exactly outside Git
  before removal: 6,791 bytes, zero mismatches, aggregate metadata SHA-256
  `548C972D309A3DFADDFB7B0A76AC6DFC53CA6102516CAA6B3174E54D0AD49535`.
- Moved the clean deployment dependency through `git worktree move` into the
  structured consolidation root and removed the verified redundant routing
  clone. Unique remote commits remain preserved by the remote ref and bundle.

### GitHub and Codex reconciliation

- Closed PR #1 and PR #2 without merge after proving their heads fully contained
  in active and bundled. Deleted their remote head branches plus the fully
  contained runtime-truthfulness branch; verified all three absent after prune.
- Retained PR #3-#6, every unique dependency branch, `main`, the historical
  snapshot, and all eight existing tags.
- Confirmed the requested project `.codex/config.toml`, `repo-mapper.toml`, and
  `log-triage.toml` active set exists only in the authoritative local checkout;
  the incompatible legacy routing config was not copied.
- Added the complete Phase 3.5 plan, folder/branch/PR maps, preservation proof,
  final-structure target, stop conditions, and rollback procedure.
- Verification passes: governance 8 files / 14 continuation fields; full
  `npm run check` 25 test files / 216 tests, 28-module build, 29 Apps Script
  sources / 47 functions, generated parity, two 293,406-byte artifacts, Git
  integrity, bundle, external manifest, structure, ref/PR, Codex placement, and
  diff checks.
- Checkpoint `efee2dda0148c5a70bd9c681e729a75372622b8e` is pushed and Actions
  runs `29385021439` / `29385021514` are green. Verified tag:
  `hau-usc-phase3.5-consolidation-efee2dd`.
- Corrected PR #6 from stale Slice 1 metadata to cumulative title
  `feat: complete HAU-USC v0.5 repository baseline` and current scope,
  validation, preservation, and boundary evidence; the PR remains a draft.
- No product behavior, generated application source, PR merge, deployment,
  migration, external operational data, or private configuration changed.

## Unreleased - Phase 3 workspace consolidation

### Repository and local workspace

- Classified Git branches, remote branches, six open draft PRs, rollback tags,
  eight registered worktrees, the independent planning clone, related archives,
  Downloads exports, generated folders, and private configuration using the
  accepted Phase 3 preservation labels.
- Created and verified a 47-ref complete-history Git bundle (1,518,711 bytes;
  SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`)
  before cleanup.
- Preserved exact Drive/QA dirty generated files and binary patches plus two
  distinct ignored private configurations outside Git before retiring anything.
- Removed six patch-equivalent specialist worktrees with normal Git worktree
  commands and deleted only their bundle-preserved local refs. Removed the fully
  contained local Apps Script launch-readiness ref normally.
- Retained the authoritative checkout, V1 Deployment dependency, unique planning
  clone, remote branches, all PRs, checkpoint tags, release backups, private
  institutional source, and unknown Downloads exports.
- Moved only classified historical prototype/analysis and pre-sync generated
  folders intact into dated archives with count/byte/aggregate-hash evidence.
- Added `docs/WORKSPACE_CONSOLIDATION.md` with classification, preservation,
  deliberate non-actions, and recovery instructions.
- Verification passes: governance 8 files / 14 continuation fields; full
  `npm run check` 25 test files / 216 tests, 28-module build, 29 Apps Script
  sources / 47 functions, generated parity, and two 293,406-byte artifacts; Git
  diff/integrity, bundle verification, and external manifest parsing.
- Independent read-only review passed after one targeted documentation repair
  round with no remaining actionable findings.
- Checkpoint `58168edd4eec5ea0a063558dfb8071c4a7fd6c99` is pushed and PR #6
  `validate`, `verify`, and `browser-smoke` checks are green. Verified baseline
  tag: `hau-usc-phase3-baseline-58168ed`.
- No product behavior, generated repository source, external operational system,
  deployment, migration, PR state, or remote ref changed.

## 0.5.0 - Unreleased

### Phase 2 - Caveman Light and efficiency layer

- Added concise project intent/skill routing, Caveman Light short-command handling, current-task/history/resume packets, and token/context discipline without changing product behavior.
- Added supported project-scoped Codex configuration with two-thread/one-level delegation limits and two `gpt-5.6-terra`, low-reasoning, read-only profiles for bounded repository mapping and captured-log triage.
- Added deterministic agent and continuation validators to `npm run check`, plus compact repo/context helpers and a capped command runner that preserves full ignored logs and true exit codes while limiting displayed output.
- Added focused governance tests for required triggers, strict custom-agent/config safety (including rejected non-TOML escapes), fail-closed Git status, marked UTF-8-bounded context, resume fields, output tails, true exit codes, Windows command shims, and full-log preservation. After two bounded independent-review repair rounds, local gates pass 25 Vitest files / 216 tests, build, Apps Script/generated parity, standalone verification, lint, formatting, and diff checks.
- Independent final review is PASS with no actionable findings; the reviewer directly rechecked restricted escape behavior and all original repaired findings.
- Phase 2 implementation commit `8e82a8601e930ecf223a6e9170dc3d4dd9954bb1` is pushed to PR #6. Actions runs `29379450091` and `29379450069` passed `validate` (14s), `verify` (16s), and `browser-smoke` (1m53s); local, upstream, and PR heads matched.
- No Slice 7 behavior, generated application source, consolidation/deletion, deployment, migration, Apps Script action, external configuration, or Google Sheets/Drive write was performed.

### Slice 6 - Composite Event Logistics request foundation

- Added a feature-flagged composite Event Logistics foundation with one server-owned parent and one independently trackable child per non-empty Food, Materials, and Venue & Equipment section; blank sections create no child.
- Added canonical validation, exact duplicate-line consolidation, server-generated IDs, one-append Apps Script creation, idempotent replay, locked mutation paths, versioned parent/child relationships, derived parent status/attention flags, lifecycle transitions, cancellation/reopen/amend/add-section rules, assignment/escalation boundaries, history, audit, and requester-scoped reads.
- Added service/adaptor contracts, serialized mock mutations for concurrent-submit safety, source UI hierarchy/review flow, generated visual/standalone/Apps Script parity, and focused unit, Apps Script VM, and Chromium coverage.
- Local gates pass: lint; Vitest 24 files / 203 tests; `npm run verify` with 29 Apps Script sources / 47 required functions; full Playwright 61 passed / 101 intentional skips / 0 failed across 162 cases; focused composite browser smoke; and `git diff --check`. Independent implementation review is PASS. Commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` is pushed and PR #6 `validate`, `verify`, and `browser-smoke` are green.
- No specialization, catalog, restock, polling/live-update, hosting, database, migration, deployment, staging/production change, Script Property change, Google Sheets/Drive write, or private operational-data access was performed. `HAU_COMPOSITE_REQUESTS_ENABLED` remains an external opt-in flag and was not changed here.

### Slice 5 - Committee Main Hub and Inventory and Pantry vertical slice

- Added one capability-aware Committee Main Hub with active Food, Inventory and Pantry, Materials, and Director contexts, safe quick links, freshness/manual refresh state, bounded queue counts, and bounded record identifiers for detail reconciliation.
- Added server-side queues for new/unassigned, review, needs-information, due-soon, overdue, blocked, missing-evidence, escalated, inventory attention, lending review/overdue, upcoming needs, and recent completions; activity is a safe projection of immutable status history and audit rows.
- Propagated the validated committee context into existing inventory, lending, and restocking module reads without granting action authority from membership alone; reused the resolved authorization context to avoid repeated membership reads.
- Added additive bootstrap schema 1.3.0 dashboard collections, synthetic Apps Script scope/read/privacy tests, keyboard/browser coverage across the configured viewports, and rollback-safe hiding when the server dashboard projection is unavailable.
- Regenerated visual, standalone, and Apps Script outputs only through `npm run extract:visual` and the build/check pipeline. Local gates pass: 22 Vitest files / 183 tests, full Playwright 56 passed / 100 skipped / 0 failed across 156 cases, Apps Script/generated parity, and sensitive-value scan. Commit `a1784f15bc6a160ebf3c2405e9776b6517ce52e5` is pushed and PR #6 CI is green.
- No deployment, external configuration, Google Sheets/Drive write, private operational-data access, migration, or Slice 6 work was performed. Owner queue/timezone/staff-display policy confirmation and real-volume staging timing remain deferred to the later acceptance slice.

### Slice 4 - Private roster synchronization and access freshness

- Added a fail-closed Apps Script roster boundary that reads a private source only during an explicit admin/scheduled sync and validates the exact five-column source schema, strict types, canonical roles/committees, duplicate normalized identities, and committee scope.
- Added additive `14_USERS_ACCESS` freshness fields, `21_ACCESS_SYNC_RUNS`, `22_ACCESS_SYNC_SNAPSHOT`, and `23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT`; activation updates only roster-managed access/membership rows and preserves a local last-known-good rollback snapshot.
- Added explicit approval/disable/freshness Script Property controls, idempotent locked admin sync and emergency-deny endpoints, an at-most-once idempotent trigger installer, safe admin health metadata, and stale/emergency fail-closed access without source reads during ordinary startup.
- Added synthetic coverage for source configuration, schema/type/identity/scope failures, timeout/partial reads, conflict and revocation planning, membership activation, stale/emergency denial, non-disclosure, locking, and source-read isolation. No external configuration, Sheet/Drive write, deployment, or trigger activation was performed.
- Local gates pass: `npm run check` with 21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification; `npm run verify`; full Playwright with 50 passed / 100 intentional skips / 0 failed across 150 cases; `npm run lint`; `git diff --check`; and the changed-scope sensitive scan. Independent implementation review found no blocking issue. Commit `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` is pushed; PR #6 `validate`, `verify`, and `browser-smoke` are green. Manager review is pending before Slice 5.

### Phase E staging acceptance completed

STAGING ACCEPTANCE: SLICES 1-3 PASSED

- Accepted the staging handoff for immutable Version 18 with `HAU_BOOTSTRAP_CONTRACT_VERSION=2` and authorization contract v1/absent; Version 13 remains the rollback target.
- Confirmed staging root cause and repair: the read-only bootstrap-module callback completed at approximately 40 seconds, beyond the former 30-second browser deadline. `api_getBootstrapModule` now has a bounded 60-second client deadline; mutations and all other adapter calls remain at 30 seconds.
- The handoff reports 32-file pull-back parity, the owner-only web-app manifest preserved, the live v2 internal workspace reaching ready, and diagnostic/request-only privacy checks passing. Production and operational records were untouched.
- Local gates passed after the fix: `npm run check` with 20 Vitest files / 164 tests, `npm run verify`, full Playwright with 50 passed / 100 intentional skips / 0 failed across 150 cases, `git diff --check`, and the sensitive-value scan. Independent review was reported as PASS.
- Generated output was refreshed by the build path and verified; no generated file was hand-edited. Implementation commit: `fcb004e8be78d3d431164c95c7f847ab1033d927`.
- The staging handoff was accepted from supplied evidence; the local Chrome bridge was unavailable for a second live fetch. No push or production promotion was performed, and Slice 4 remains out of scope.

### Controlled staging acceptance checkpoint (Phase E previously blocked)

- Phase D compatibility acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent.
- Phase E v2 direct read-only endpoint checks passed, but the live v2 workspace remained in slow startup and reached the retryable read-only-service timeout instead of ready.
- Applied the authorized rollback by restoring the existing staging deployment pointer to immutable Version 13; the staging owner reports the bootstrap property is restored to `1`, and authorization contract v1/absent remains in force.
- A local synthetic end-to-end diagnosis covering the checked-in Apps Script DTO, JSON-safe callback normalization, and browser v2 validator passed; no local contract-shape defect or reproducible timeout was found.
- The staging acceptance marker remains intentionally absent. No production deployment, push, Slice 4 work, or private operational-data change was performed.

### Slice 3 - Canonical roles, committee scopes, and authorization contract

- Added a server-owned canonical authorization registry with six roles, immutable role IDs, exactly three committee IDs, separate capability and scope decisions, safe denial reasons, and fail-closed inactive, unknown, ambiguous, and unreconciled mappings.
- Added sanitized authorization metadata to the essential bootstrap/current-user contract and a client projection that consumes server capabilities instead of granting access from visible UI roles.
- Added additive authorization fields to `14_USERS_ACCESS`, the `20_USER_COMMITTEE_SCOPE` membership schema, the `HAU_AUTHORIZATION_CONTRACT_VERSION` rollout property, and an approval-gated mapping dry run/apply path that preserves legacy labels and immutable history.
- Recorded the owner-auto-accepted role/committee defaults and migration controls in `docs/AUTHORIZATION_CONTRACT.md`.
- Regenerated visual and standalone artifacts through `npm run extract:visual` and `npm run build`; no generated file was hand-edited.
- Final local verification passes: `npm run check` with ESLint, 20 Vitest files / 161 tests, production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify`; full Chromium 49 passed / 95 intentionally skipped / 0 failed across 144 cases; and `git diff --check`.
- Sensitive-value scan passes over the changed scope with no `.clasp` files, credentials, private identifiers, contacts, roster rows, private supplier-TIN values, evidence links, or operational records; only schema references and synthetic/mock placeholders are present. Regenerated standalone files retain only the pre-existing fictional preview baseline. Initial review findings were repaired; the implementation-validator found no blocking issue; no re-review PASS is claimed because the second reviewer did not return before handoff.
- Implementation commit `5107afc57904dccc5214fcafc20aba65c0622632` is pushed to the feature branch; PR #6 `validate`, `verify`, and `browser-smoke` are green. Manager review is required before Slice 4.
- No roster import, external authorization activation, migration, deployment, staging/production write, or private operational-data change was performed.

### Slice 2 - Essential bootstrap and lazy module contracts

- Added versioned allowlisted essential/module read contracts with request-only privacy enforcement, bounded pagination/filtering, fail-closed entity scope checks, JSON-safety validation, and compatibility-preserving runtime selection.
- Added Apps Script module APIs beside the existing bootstrap endpoint, request-scoped repository read deduplication, exact UTF-8 payload metrics with a 100 KiB response bound, bounded public-reference caching, in-flight deduplication, stale-response cancellation, and active-module rendering.
- Made the rollout flag server-controlled through `HAU_BOOTSTRAP_CONTRACT_VERSION`; the safe default is v1 and explicit v2 enables the new path.
- Added synthetic contract/controller/Apps Script VM/adapter/packaging coverage and regenerated visual/standalone/Apps Script artifacts through the repository build path.
- Verification passes: 18 Vitest files / 143 tests, focused packaged Chromium 15/15, and full Playwright 49 passed / 95 intentionally skipped / 0 failed across 144 cases. Initial independent-review FAIL findings were repaired; current-snapshot re-review returned WARN/incomplete, so no re-review PASS is claimed.
- No deployment, external-system write, private operational-data change, or Slice 3+ feature work was performed.

- Working branch: `feat/live-sync-lending-search-catalog-controls`
- Starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Ending commit: `576393f1be28687d984ea7632a2501aa8d3fc30d`; pushed to the feature branch with local/upstream parity `0 0`
- Draft PR #6 is open and its `validate`, `verify`, and `browser-smoke` checks pass; manager review remains pending.

### P0 Production Bootstrap Diagnosis and Recovery

- Diagnosed the unhandled post-response startup failure boundary and added named bootstrap stages from request through first render and ready.
- Added contract validation before normalization, JSON-safety checks, one-active-attempt recovery, obsolete-callback protection, eight-second slow-state messaging, safe stage diagnostics, and an accessible Retry surface with an idempotent terminal finalizer.
- Added synthetic empty/realistic-volume fixtures and failure seams for transport, malformed responses, every post-response startup stage, timeout/late success, Retry, focus/live-region behavior, and packaged Apps Script execution.
- Preserved the existing Apps Script adapter timeout/callback behavior and made no endpoint, payload, schema, deployment, or external-system change.
- Verification: `npm ci`, `npm run check`, full Vitest (15 files / 118 tests), focused packaged Chromium (14 tests), and the six-project Playwright run (48 passed, 90 scoped skips, 0 failed across 138 cases). A synthetic 390x844 shell measurement rendered in 81 ms; staging p95 remains unrun.
- No staging/production deployment, Apps Script push, Google Sheets/Drive write, or other external action was performed.

### Added

- A compact `api_getDataRevision` read endpoint backed by `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` rows in `17_CONFIG`.
- Five-second internal polling while the document is visible and online, with focus, visibility, reconnect, and manual-refresh checks, non-overlapping requests, and bounded error backoff. This is polling, not WebSockets.
- An idempotent `setupOperationalEditTrigger()` installer and `handleOperationalSheetEdit(e)` handler so direct human edits to the configured operational spreadsheet advance the shared revision.
- Dirty-form and active-modal protection. Background changes show a non-blocking update banner with Refresh now and Continue editing choices instead of silently discarding input.
- Accessible predictive Lending Hub search with exact/prefix/token/substring ranking, keyboard navigation, an authoritative hidden Item ID, selected-item summary, and distinct out-of-stock, verification, audience, circulation, quantity, and no-match explanations.
- Website catalog APIs and controls for item lookup, creation, metadata editing, storage-context changes, archive, and restore.
- Dedicated `Can_Manage_Catalog` authorization with ADMIN and DOL_DIRECTOR fallback when the new cell is blank; no general grant to other existing users.
- Handling values `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, and `NON_CIRCULATING`, plus lending audiences `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, and the future-ready `DOL_INTERNAL_ONLY` value.

### Changed

- Apps Script mutations reload and normalize authoritative bootstrap state before rendering success. If the write succeeds and reload fails, the UI reports that the action was recorded, exposes a safe Refresh action, and never automatically resubmits the mutation.
- Retryable transport failures retain the same client request ID for an identical mutation attempt, so a response lost after a server commit replays idempotently instead of creating a duplicate. Mutation forms and release controls disable while in flight.
- Lending creation, approval, handoff, and return now revalidate item status, verification state, handling, borrower audience, available-to-promise quantity, maximum per-ticket quantity, and due-date rules on the server.
- Inventory creation, editing, storage updates, archive, and restore now use locked, idempotent, permission-checked Apps Script services with server IDs, before/after audit data, status history where applicable, and exactly one data-revision advance.
- Item creation records initial quantity through an append-only ledger movement only when the catalog manager also has receive or admin permission; catalog-only users must create at zero and use an approved receiving workflow. VERIFY and inactive items can never receive opening stock. Metadata edits cannot overwrite current stock, reservations, opening quantity, provenance, or posted history.
- Request-only bootstrap sanitization is determined server-side from the resolved identity as well as the trusted page mode; a public or REQUESTER caller cannot obtain internal bootstrap fields by sending `requestOnly: false`.
- Unit changes are blocked when ledger, reservation, lending, request-line, restock, or release history depends on the item. Archive is blocked unless quantity and active dependencies are clear; restore preserves historical records and returns verification-marked items to `VERIFY`.

### Schema

- Appended `Catalog_Type`, `Storage_Location`, `Reorder_Threshold`, `Lending_Audience`, `Default_Loan_Days`, `Maximum_Loan_Qty`, `Approval_Required`, `Updated_At`, `Updated_By`, and `Notes` to `01_ITEM_MASTER` without reordering existing columns.
- Appended `Can_Manage_Catalog` to `14_USERS_ACCESS`.
- Added `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` configuration rows to `17_CONFIG`.
- `setupDatabase()` remains additive and repeatable. Blank legacy metadata defaults fail closed: active circulating items default to `USC_STAFF_ONLY`; VERIFY, inactive, archived, and non-circulating items default to `NOT_AVAILABLE_FOR_LENDING`; returnable items default to three loan days; maximum quantity defaults conservatively to one; approval defaults to true.

### Verification to date

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused Chromium 390 px 0.5.0 suite: 4 passed.
- `npm run check`: passed, including a 22-module Vite build, Apps Script validation across 24 source files and 27 required entry points, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright matrix at 320, 390, 768, 1024, 1366, and 1440 px: 38 passed, 40 intentionally scoped skips, 0 failed.
- Deterministic rebuild: passed; the 238,891-byte `dist/index.html` and shareable copy remained byte-identical with SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f`, and the 615-byte `apps-script/Index.html` remained `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External actions

- No `clasp push`, Apps Script version creation, deployment update, Sheet/Drive write, trigger modification, production action, or PR #2 merge was performed.
- Immutable staging Version 9 and production remain untouched.

## 0.4.0 - 2026-07-12

### Added

- Production-oriented Google Apps Script backend with Sheet repositories, authorization, locking, idempotency, structured errors, append-only inventory, workflow services, evidence uploads, migration, reconciliation, setup, backup, and triggers.
- Strict Apps Script and future HTTP browser adapters while preserving mock development.
- Privacy-safe evidence labels/filenames, digest duplicate detection, configured Drive routing, and quarantine recovery.
- Apps Script staging bundle, manifest, clasp example, CI workflows, schema validation record, deployment/security/backup/migration/launch runbooks, and PostgreSQL/Supabase mapping.
- Repository-level ChatGPT web/Codex collaboration protocol, start-of-task Git handshake, one-writer rule, manager task packet, and Codex handoff packet.
- Regression coverage for missing runtime properties, explicit staging and production selection, and no hardcoded spreadsheet fallback.
- Parser-safe Apps Script packaging library, deterministic assembled-document validation, generated-file diagnostics/parity checks, and a staging-only diagnostic shell.
- Unit and Chromium regressions for literal `</script>` sequences, multiple script/style outputs, minified bootstrap identifiers, visible-source leakage, and mocked `api_getBootstrapData` execution.
- Failure-only CI diagnostic artifacts for concise verification and browser logs.

### Changed

- Wired approved visual actions to server adapters for request review, quote selection, receiving, release, lending, and event-item transfer.
- Request acceptance now preflights all stock decisions before applying reservations and line transitions.
- Restock and deliverable receipts accumulate by line and reject over-receipt before operational writes.
- Lending partial returns account for lost/damaged quantities without falsely restoring stock.
- Requester catalog/bootstrap payloads no longer expose exact stock balances, reservations, verification notes, or legacy trace fields; the UI defers authoritative stock routing to DOL review.
- Evidence uploads now require a server-side receive, release, or admin permission before file processing.
- Apps Script now resolves environment, operational spreadsheet ID, and backup spreadsheet ID only from required Script Properties.
- Setup, Drive configuration rows, migration/reconciliation access, launch backups, schema reports, and health checks now use the explicitly resolved environment target.
- Admin health checks report the active environment and target spreadsheet IDs for operator verification.
- Apps Script body, CSS, and JavaScript are now generated from separate Vite outputs instead of being extracted from the minified standalone HTML.
- Apps Script generated style/script partials now contain their complete executable elements, avoiding contextual force-printing inside outer container tags.

### Fixed

- Visual-baseline generated-notice removal now supports LF, CRLF, and no trailing newline while retaining strict comparison of all visual markup and unrelated comments.
- Removed hardcoded operational and backup spreadsheet IDs from runtime code, preventing staging from silently falling back to production.
- Initial setup can bootstrap the administrator when `14_USERS_ACCESS` has not yet been created or seeded.
- Health-check configuration details are now restricted to administrators.
- Raw-text closing sequences are escaped before JavaScript or CSS is embedded in Apps Script HTML.
- Visible-JavaScript detection no longer misclassifies ordinary UI text such as `Lead-time class`.
- Apps Script browser packaging verification is network-independent and executes from an assembled in-memory document.
- Corrected the controlled staging deployment after clasp 3.3.0 skipped a manifest-confirmation push, leaving Version 7 on stale raw script/style partials and causing `Exception: Malformed HTML content`.
- Preserved the existing staging `webapp` manifest settings while force-pushing the reviewed 29-file package, then updated the existing deployment ID to immutable Version 8.
- Propagated the server-trusted Apps Script request-only flag through `body[data-request-only]` so the sandboxed browser does not depend on the outer `/exec` query string.
- Added internal/request-only package assembly tests that assert one bootstrap call with the correct `requestOnly` payload and verify the request-only shell hides internal navigation.
- Apps Script runtime controls now use the trusted server-rendered environment instead of assuming staging.
- Generated body markup now carries both `data-request-only` and `data-app-environment`.
- Apps Script pages display `Apps Script · staging` or `Apps Script · production` according to the resolved Script Property environment.
- `Reset Demo Data` remains available in local mock mode but is hidden, disabled, removed from keyboard focus, and left without a click handler in Apps Script mode.
- The visual extractor now normalizes CRLF input before applying compatibility-runtime bridges, preventing Windows extraction from silently dropping the request-only privacy and accessibility repairs.

### Verified

- Live production/backup comparison was read-only and found the four legacy tabs unchanged.
- On Windows with `core.autocrlf=true`, the focused visual-baseline suite passed 4 tests and the full Vitest suite passed 55 tests across 9 files before staging isolation.
- GitHub `npm run check` passed after staging-isolation implementation, including lint, Vitest, build, Apps Script static validation, and artifact verification.
- GitHub Apps Script static validation passed after staging-isolation implementation.
- GitHub CI completed the earlier Playwright matrix at six viewport widths before the packaging incident.
- Packaging-repair code checkpoint `74f2f0f...` passed GitHub CI and Apps Script static validation.
- The repaired checkpoint passed 10 Vitest files / 67 tests, 23 Apps Script source files / 18 required functions, deterministic package parity, standalone artifact verification, and the six-viewport browser-smoke matrix.
- Generated Apps Script package sizes were 512 bytes (`Index.html`), 28,967 bytes (`AppBody.html`), 26,850 bytes (`AppStyles.html`), and 153,161 bytes (`AppScript.html`).
- A post-push remote pull matched all 29 reviewed staging files and confirmed one application script and one application style element.
- Version 8 `?diagnostic=1` passed body, style, inline-script, and harmless server-call checks.
- Version 8 internal `/exec` rendered the Apps Script staging workspace, cleared the loading overlay, and exposed no raw JavaScript.
- No operational Sheet/Drive workflow, migration application, trigger change, production action, or PR merge was performed during staging recovery.
- `npm run check` passed: ESLint, 10 Vitest files / 69 tests, Vite build, Apps Script static validation, deterministic package checks, and standalone artifact verification.
- `npm run test:e2e` passed with 29 tests and 25 intentional viewport-specific skips.
- Both standalone HTML artifacts verified at 210,112 bytes each.

### Known issues

- Historical launch-readiness documents may contain references to now-closed PR #2 or the deleted historical feature branch. Current GitHub state and `.codex/CURRENT.md` govern the v0.6 transition.
- A bounded end-to-end staging workflow remains pending from the 0.4.0 launch-readiness program, but it is not automatically authorized by the v0.6 continuity bootstrap.

## 0.3.2 - 2026-07-12

### Prepared

- Locked the shareable Final prototype as the approved visual direction for the upcoming demo.
- Added `docs/FINAL_DEMO_BASELINE.md` with launch instructions, guided demo order, safety boundary, and presentation acceptance checklist.
- Documented the earlier Revision 02 file as historical reference rather than the active visual baseline.

## 0.3.1 - 2026-07-12

### Restored

- Reinstated the exact archived Final prototype markup, palette, typography, spacing, navigation, panels, forms, tables, and responsive rules as the active visual layer.
- Restored the original preview interaction runtime so navigation and operational controls execute when the artifact is opened in a real browser.

### Added

- Reproducible extraction into shell fragments, seven view HTML modules, and eight ordered CSS modules.
- Visual-equivalence tests for markup, CSS cascade, and interaction hooks.
- Standalone artifact verification and classic inline-script output for direct `dist/index.html` use.
- Root-level `HAU-USC_Logistics-Prototype-Shareable.html`, regenerated from and hash-verified against the deployment bundle.

### Documented

- The compatibility-runtime boundary and the recommended view-by-view migration into the hardened modular service contract.

## 0.3.0 - 2026-07-11

### Added

- Vite + vanilla JavaScript ES-module repository with single-file output.
- Vitest domain/integration coverage and Playwright responsive smoke suite.
- Ledger-only quantity truth, revision-based indexes, state migrations, structured errors, correlation IDs, and idempotency records.
- Sanitized request-only bootstrap, centralized preview permissions, mobile bottom navigation, accessible modal/drawer infrastructure, reports, diagnostics, cycle-count and emergency-issue previews.
- Architecture, domain, data-model, Apps Script, accessibility, test-plan, roadmap, and limitation documentation.

### Fixed

- Duplicate transfer transaction IDs.
- Non-cumulative deliverable/restock receiving.
- Duplicate lending handoff and return postings.
- Service-level over-transfer acceptance.
- Unawaited reservation failure and partial mutation during acceptance.
- Restock receipt sibling auto-completion.
- Release validation against request remainder, reservation, and physical/event balance.
- Parent request statuses now derive from child lines.

### Preserved

- HAU-USC visual identity, request/stock routing, Release Desk, lending, restocking, procurement, canvass, inventory, request-only mode, status chips, cards, tables, mobile cards, and preview safeguards.
