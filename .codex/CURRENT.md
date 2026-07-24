# Current Codex Work Pointer

Program: HAU-USC Logistics v0.7.0 continuous production completion
Phase: Phase 5 — Complete lendable inventory catalog
Required model: GPT-5.6 Sol — High
Status: ACTIVE — PHASE 2/3 CORRECTION AND PHASE 4 STAGING ACCEPTED; PRODUCTION NO-GO

Repository: `D:\Documents\Codex\HAU-USC Logistics\active\hau-usc-logistics-management-system`
Branch: `chore/v0.6-codex-continuity-bootstrap`
Correction deployed runtime: `6c4cff601b04b64d9327ac1308d2cc2cab59e584`
Upstream: `origin/chore/v0.6-codex-continuity-bootstrap`

## Active accepted specification

- `.codex/specs/v0.7.0-production-master.md`
- `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`
- Master prompt source SHA-256: `9bf903dcd1172be7bf6dbbadf903c5f33cc4aaa44adc9b6c693df6d201e5d067`.
- Shared contract source SHA-256: `22658a6afddebe26270845a6e4678685b1a0875da0fb73ed2943ea08f6d37d67`.

The v0.7.0 master prompt supersedes the earlier v0.6 phase-stop and production-gating prompts for this continuous owner-authorized launch program. Safety, privacy, recovery, fail-closed authorization, and truthful-evidence requirements remain mandatory.

## Phase 0 verified truth

- Working tree was clean before this checkpoint; local and upstream were equal (`0 0`).
- Draft PR #9 is open, mergeable, and clean at `a3059a8`; all six checks passed on that exact SHA.
- Live staging health/readiness reports STAGING, exact SHA `a3059a8`, D1 connected, schema 9, and migration `0009_public_portal_entitlements.sql`.
- `/request` and `/lending` return public SPA surfaces. `/api/version` is missing and remains a Phase 1 defect.
- Cloudflare authentication is valid. Only the staging D1 exists; no production D1, production Worker, or R2 bucket exists.
- The current staging configuration has Workers Logs and Traces disabled and no protected Cloudflare secrets registered.
- The approved Google workbook and all seven Drive mappings are readable. The canonical item master has one approved item; the governed events and branding tables have zero data rows.
- The five supplied role HTML files exactly match `.codex/DESIGN_REFERENCE_DIGEST.md`; their large contents were not reread.
- A verified all-ref preservation bundle exists outside Git at `%USERPROFILE%\.hau-usc-private\v0.7.0-launch\pre-v0.7.0-all-refs.bundle`, SHA-256 `39b5dff168b705fb68b71d7dd822e02077ed0e58c9401119e716d0738c735b93`.

## Phase 1 completion

- Distinct staging and production D1 databases and R2 buckets exist. The production Worker name/configuration is reserved but no production code/version/traffic was uploaded.
- Private v0.7 staging and production Wrangler configs pass the fail-closed separation preflight outside Git.
- Staging has three protected secrets applied; the distinct production secret package exists outside Git but is not applied before the production Worker exists.
- The staging Worker is deployed with R2 `BRAND_ASSETS`, Workers Logs, sampled Traces, structured redacted correlation logging, protected password pepper support, and safe health/readiness/version endpoints.
- Live staging reports application/release `0.7.0`, exact runtime `8b4af04`, D1 schema 9/migration 0009, R2 ready, protected configuration ready, and correlation headers.
- `npm run check` passed with 56 Vitest files / 389 tests. The corrected fresh local Worker suite passed 15 / 15. Deployed auth/Access Management smoke passed 1 / 1 after a cache-race regression fix in the test harness.
- Current PR CI for the test-only follow-up was still running when this checkpoint was prepared; verify the documentation checkpoint head before relying on remote acceptance.

## Phase 2 completion

- `/login` now presents the accepted HAU-inspired cream/oxblood/gold staff sign-in hierarchy with a governed R2 `brand.login_background` delivery slot and safe gradient fallback; no third-party background is hotlinked.
- The form accepts Access ID or a unique activated profile email. Migration `0010_verified_login_email.sql` verifies only unique existing emails; ambiguous legacy duplicates remain safely Access-ID-only.
- Accessible eye/eye-off controls preserve value and selection, retain keyboard behavior, never submit the form, and cover login and activation passwords.
- Forgot-password recovery routes staff to the existing Administrator-governed one-time temporary-password flow without exposing account existence or changing role/scope.
- Session-expired, account-unavailable/locked, throttled, activation, and service-unavailable states retain safe server messages and security boundaries.
- `npm run check` passed with 57 Vitest files / 392 tests; full Playwright passed 92 / 306 scheduled with 214 intentional skips; fresh local Worker/D1 passed 15 / 15, with one later transient navigation timeout passing on focused rerun.
- Staging migration 0010 preserved all accounts, produced zero verified-email collisions, and left ambiguous duplicates unverified. Cache-busted health/readiness/version and deployed authentication/Access Management/email-login smoke passed at exact runtime `edf6dcb`.
- Durable evidence: `.codex/V0_7_PHASE_2_LOGIN_HANDOFF.md`.

## Phase 3 completion

- `/request` opens directly without a staff session and uses one shared-information form, one category-aware item composer, and one requested-items list.
- Public choices come from active, requestable governed references and omit stock balances, storage, other requesters, internal reasons, and internal workspaces.
- Submission creates one `FOR_REVIEW` parent with normal request lines, does not reserve or reduce stock, and returns a private tracking code whose digest alone is stored.
- Same-origin JSON enforcement, HMAC-protected tracking, privacy-safe not-found behavior, and distributed D1 attempt limits protect the public boundary.
- Migration `0011_public_request_tracking.sql` created the tracking/rate-limit tables and one revoked credential-less system actor that is hidden and immutable in Access Management.
- `npm run check` passed with 57 Vitest files / 393 tests; fresh local Worker/D1 passed 16 / 16; full Playwright passed 93 / 312 scheduled with 219 intentional skips.
- Staging migration/reconciliation, exact-SHA deployment, cache-busted health/readiness/version, and deployed authentication/public-request acceptance passed at runtime `6fbf377bb96f9e5123a24c8e1d81726ae5769532`, schema 11, migration 0011.
- Durable evidence: `.codex/V0_7_PHASE_3_PUBLIC_REQUEST_HANDOFF.md`.

## Phase 4 completion

- `/lending` opens directly without a staff session and presents a borrower-safe searchable/filterable catalog before identity collection.
- External Angelite borrowers can submit validated multi-item requests with Student ID, course/year, approved department, contact/email, pickup/due dates, purpose, and responsibility acknowledgment.
- Each selected canonical item becomes an existing internal `FOR_REVIEW` lending ticket routed to Inventory & Pantry; submission creates no reservation, ledger entry, or stock movement.
- Private HMAC-backed group tracking exposes only safe ticket/item/status/date information and is protected by same-origin JSON checks and D1 attempt limits.
- Migration `0012_public_lending_tracking.sql` adds only public lending tracking/profile/link/rate-limit state and routes the revoked credential-less service actor to the owning committee.
- `npm run check` passed with 57 Vitest files / 393 tests; fresh local Worker/D1 passed 17 / 17; full Playwright passed 94 / 318 scheduled with 224 intentional skips.
- Staging migration/reconciliation, exact-SHA deployment, cache-busted health/readiness/version, and deployed staff/request/lending acceptance passed 3 / 3 at runtime `8e5c25df3e498b6627b5ebc88db0c8cf9b71c849`, schema 12, migration 0012.
- The real staging catalog has zero approved `STUDENTS_AND_STAFF` items. One audited synthetic fixture proved the workflow and was archived immediately; Phase 5 must complete governed catalog fields and activation without inventing institutional policy.
- Durable evidence: `.codex/V0_7_PHASE_4_PUBLIC_LENDING_HANDOFF.md`.

## Current blockers and next action

Production remains NO-GO. Approved upcoming-event values are absent and must be obtained once before final production freeze; do not invent them.

The targeted Phase 2/3 correction passed live staging acceptance and the accepted Phase 4 Lending Center backend remains preserved. Durable evidence: `.codex/V0_7_PHASE_2_3_CORRECTION_HANDOFF.md`.

One smallest safe next action: implement the additive Phase 5 governed lending fields and authoritative availability model on the canonical Inventory Management catalog, without creating a second inventory or activating unapproved institutional items.

Durable evidence: `.codex/PRODUCTION_LAUNCH_HANDOFF.md`, `.codex/LAUNCH_EVIDENCE_INDEX.md`, and `.codex/V0_7_BRANCH_INVENTORY.md`.
