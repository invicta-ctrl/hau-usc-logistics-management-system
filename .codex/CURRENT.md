# Current Codex Work Pointer

Program: HAU-USC Logistics v0.7.0 continuous production completion
Phase: Phase 6 — Follow-Up Amendment Slice 1: Lending, Media, and Internal Hub
Required model: GPT-5.6 Sol — High
Status: ACTIVE — PHASES 0–5 ACCEPTED ON STAGING; PRODUCTION NO-GO

Repository: `D:\Documents\Codex\HAU-USC Logistics\active\hau-usc-logistics-management-system`
Branch: `chore/v0.6-codex-continuity-bootstrap`
Phase 5 deployed runtime: `fc9ef1ccc5fef9018d37157a13078773c9018a13`
Upstream: `origin/chore/v0.6-codex-continuity-bootstrap`

## Active accepted specification

- `.codex/specs/v0.7.0-production-master.md`
- `.codex/specs/v0.7.0-follow-up-amendment.md`
- `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`
- Master prompt source SHA-256: `9bf903dcd1172be7bf6dbbadf903c5f33cc4aaa44adc9b6c693df6d201e5d067`.
- Shared contract source SHA-256: `22658a6afddebe26270845a6e4678685b1a0875da0fb73ed2943ea08f6d37d67`.
- Follow-up amendment source SHA-256: `4087844f5f32786c45ccde3d31cb55d66e4c259a556276295500032e036389c5`.

The accepted follow-up amendment supersedes only the product behaviors it explicitly changes, including public Request Center access/tracking and public Lending Center tracking. Safety, privacy, recovery, fail-closed authorization, truthful evidence, inventory/ledger invariants, and the master-prompt production gates remain mandatory.

## Accepted completion through Phase 5

- Phase 0: repository, provider, data-source, branch, and all-ref preservation truth established.
- Phase 1: distinct staging/production D1 and R2, private fail-closed configs, staging secrets/observability, health/readiness/version, and staging foundation accepted.
- Phase 2: secure branded staff login, unique verified-email support, password/recovery/state UX, and governed Brand & Media delivery accepted.
- Phase 3: source-grounded guided public Request Center with separate HMAC-backed private tracking accepted.
- Phase 4: public borrower-safe Lending Center, canonical `FOR_REVIEW` tickets, and private tracking accepted without submission-time reservation or stock movement.
- Phase 5: canonical governed lending catalog, one authoritative availability model, reusable assets, asset condition/maintenance/movement history, and public/staff data separation accepted.
- Official campus background, DOL logo, HAU-USC logo, and favicon are served through governed R2 slots and passed source-hash and responsive staging checks.

Durable handoffs:

- `.codex/V0_7_PHASE_2_LOGIN_HANDOFF.md`
- `.codex/V0_7_PHASE_3_PUBLIC_REQUEST_HANDOFF.md`
- `.codex/V0_7_PHASE_4_PUBLIC_LENDING_HANDOFF.md`
- `.codex/V0_7_PHASE_2_3_CORRECTION_HANDOFF.md`
- `.codex/V0_7_PHASE_5_LENDING_CATALOG_HANDOFF.md`

## Phase 5 final evidence

- Code commits: `b77b1ae60214501cdeea7d4ef2ef917e819aab9e`, followed by remote-compatible migration trigger fix `fc9ef1ccc5fef9018d37157a13078773c9018a13`.
- `npm run check`: 58 Vitest files / 401 tests plus every repository gate passed.
- Fresh local Worker/D1: 18 / 18 passed.
- Full Playwright: 94 passed / 224 intentional skips / zero failures.
- Live staging: exact runtime `fc9ef1c`, schema 14 / migration 0014, healthy and ready.
- Deployed staging: 4 / 4 governed brand, auth/access, public request, and public lending scenarios passed.
- PR #9 exact head: open draft, clean/mergeable, 6 / 6 checks passed.
- Cleanup: synthetic lending item archived and `NOT_LENDABLE`; zero active public catalog items and zero reservations.

## Current blockers and next action

Production remains NO-GO. Approved upcoming-event values and approved real public-lending item policy/data are absent and must not be invented.

One smallest safe next action: finish the known uncommitted Phase 6 internal-lending review/issue/return slice, then execute Amendment Slice 1 catalog diagnosis, borrower classification, public tracking removal, advertisement system, balanced/clickable logos, and role-protected Lending Usage without weakening server authorization or ledger invariants.

Durable launch evidence: `.codex/PRODUCTION_LAUNCH_HANDOFF.md`, `.codex/LAUNCH_EVIDENCE_INDEX.md`, and `.codex/V0_7_BRANCH_INVENTORY.md`.
