# Current Codex Work Pointer

Program: HAU-USC Logistics v0.7.0 continuous production completion
Phase: Phase 2 — Modern HAU-inspired staff login
Required model: GPT-5.6 Sol — High
Status: ACTIVE — PHASE 1 STAGING FOUNDATION ACCEPTED; PRODUCTION NO-GO

Repository: `D:\Documents\Codex\HAU-USC Logistics\active\hau-usc-logistics-management-system`
Branch: `chore/v0.6-codex-continuity-bootstrap`
Phase 1 deployed runtime: `8b4af047642e6db6f0314ce70bfb611ed8c7679d`
Phase 1 test-only follow-up: `1ddfb9a8a67d201d98af7cbc622e9067f4e3b93f`
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

## Current blockers and next action

Production remains NO-GO. Approved upcoming-event values are absent and must be obtained once before final production freeze; do not invent them.

One smallest safe next action: complete Phase 2 staff-login visual and functional acceptance against the deployed v0.7 staging foundation without changing authentication/authorization invariants.

Durable evidence: `.codex/PRODUCTION_LAUNCH_HANDOFF.md`, `.codex/LAUNCH_EVIDENCE_INDEX.md`, and `.codex/V0_7_BRANCH_INVENTORY.md`.
