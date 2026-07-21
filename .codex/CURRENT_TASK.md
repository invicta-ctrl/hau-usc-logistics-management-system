# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: REPOSITORY_MAINTENANCE, ARCHITECTURE, SECURITY, AUTHENTICATION, TESTING
MODE: execute
TARGET: HAU-USC Logistics v0.6 Phase 1 on `chore/v0.6-codex-continuity-bootstrap`
SKILLS: none; no available skill directly covers this repository-native authentication foundation
AUTHORITY: owner instruction; `.codex/specs/v0.6-phase-1-sol-high.md`; `AGENTS.md`; `.codex/CURRENT.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`
RISK: high
DELIVERABLE: verified v0.5 baseline integration, locked v0.6 architecture/security contracts, authentication and first-login onboarding foundation, focused negative tests, and Phase 2 handoff
VERIFICATION: focused tests during implementation; final `npm run check`; final Playwright where relevant; diff review; exact commit/push/CI evidence
STOP CONDITIONS: production promotion, operational institutional-data writes, migration application, destructive history rewrite, sensitive-data exposure, two failed focused repair rounds, or completed Phase 1 manual-model-switch boundary

## Active bounded unit

Complete Phase 1 only. Preserve the integrated v0.5 repository baseline and all domain/security invariants. Do not begin broad role-dashboard, Request Center, Lending Hub, Cloudflare/D1 migration, or Phase 2 design work.

## Verified starting facts

- Preserved predecessor `81efe82618048b79a821f93bd95a0be00eaeff43` remains intact.
- `origin/integration/v0.5-baseline` at `12cdfd4de73120bfeedf49582c83e1861ae36b99` is the exact v0.5 source candidate.
- PR #7 is open, draft, mergeable, and CI-green (`validate`, `verify`, `browser-smoke`).
- The integration head is being merged into the v0.6 continuity branch without modifying `main` or merging PR #7.
- Production remains outside Phase 1.
