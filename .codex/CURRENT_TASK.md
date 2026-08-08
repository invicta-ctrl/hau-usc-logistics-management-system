# Current Bounded Task

INTENT: REPOSITORY_MAINTENANCE + TESTING + STAGING_SANDBOX
MODE: EXECUTE
OBJECTIVE: Apply the accepted source/build/CI cleanup and implement fail-closed permanent-staging repository safeguards without changing production.
TARGET: maintenance/v0.7.2.1-repository-normalization
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md
AUTHORITY: Earl approval; accepted V0.7.2.1 specification; AGENTS.md; current continuity chain
REQUIRED_MODEL: CODEX for bounded implementation; Sol review before integration; escalate security, data, authorization, migration, recovery, or production-boundary decisions
ACTIVE_WRITER: CODEX
GIT_UPSTREAM: NONE - sanctioned local no-push maintenance branch
RISK: HIGH - artifact mode, email containment, and staging reset boundaries are safety-critical; production remains excluded
SCOPE: Approved unused-source/export removal; preview-only tracked dist; isolated staging/production/local Worker artifacts; duplicate CI removal; CodeQL/Renovate integration; staging status/seed/reset guards; exact recipient containment; staging-only release banner; focused and complete repository verification.
OUT_OF_SCOPE: Production mutation or deployment, schema/migration changes, hard deletion or rewriting of immutable records, protected roster mutation, borrower/canvass refactors, protected design-worktree changes, and branch/PR/worktree cleanup before merge.
VERIFICATION: Accepted specification exact acceptance; focused unit/browser/Worker tests; npm run check; git diff --check; independent Sol review.
STOP_CONDITIONS: Production crossover; unclassified staging rows; missing backup/restore proof; missing or ambiguous recipient allowlist; privacy/auth/ledger/history uncertainty; migration need; artifact/SHA mismatch; unknown dirty overlap; unresolved P0/P1.
NEXT_EXACT_ACTION: Obtain owner-approved disposition for non-synthetic staging rows or authorize a new isolated staging D1; then complete backup/restore, lifecycle reseed, staging deploy/acceptance, and PR integration.

Repository implementation commit 9ebe5d1571eea6ee84e35bada5b8658730eb40eb completed the approved dead-code cleanup, artifact isolation, CI simplification, staging guards, mail containment, banner, and current-document/archive batch. `npm run check` passed 119 files/825 tests; `npm run test:e2e` passed 138 tests with 360 intentional project skips; local Worker/D1 acceptance passed 58 tests; tracked artifacts stayed byte-stable across isolated staging/production builds. Live read-only aggregate classification found non-synthetic/unclassified staging operational rows, so staging reset/deploy remains blocked before mutation. Production is untouched.
