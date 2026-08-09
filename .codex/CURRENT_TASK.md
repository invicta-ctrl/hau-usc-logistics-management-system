# Current Bounded Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: BUG_FIX, TESTING, REPOSITORY_MAINTENANCE, MIGRATION_VERIFICATION, INCIDENT_SAFETY
MODE: EXECUTE
OBJECTIVE: Audit and finish the preserved v0.8.0 Slice 3 work, close only proven release blockers, freeze one exact candidate, obtain exact-head CI/staging/recovery acceptance, and conditionally promote that exact release through protected main to production.
TARGET: release/v0.8.0-inventory-truth-ledger-lock from committed Slice 2 SHA c5f53ddf44aaf28ab4a3e43b74d42f66d09e257d
SKILLS: lean-ctx for targeted repository work; cloudflare-deploy for exact Worker/D1/R2 authentication, isolation, recovery, deployment, and rollback checks; repository-native Playwright and release tooling remain authoritative
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.8.0-staging-production-master-release.md
AUTHORITY: Earl's directly submitted master-release prompt; live Git; AGENTS/current chain; base Slice 3 specification; current launch/staging/recovery/production runbooks; exact live provider evidence
REQUIRED_MODEL: CODEX with fresh independent high-risk review before production; no subagent may edit
ACTIVE_WRITER: CODEX
GIT_UPSTREAM: origin/release/v0.8.0-inventory-truth-ledger-lock
RISK: CRITICAL - production release, recovery, D1/R2, authentication, Inventory ledger, exact release identity
DELIVERABLE: RELEASED only after clean audit/local/CI/staging/recovery/production gates and exact closeout; otherwise STOPPED or ROLLED_BACK with all evidence preserved
SCOPE: accepted v0.8.0 Slice 3 plus bounded Inventory classification harness and release/recovery guard repairs and the exact staging/production release actions authorized by the master amendment
OUT_OF_SCOPE: Slice 4, migration 0031, broad UI/design/auth/data-history repair, force push, non-exact deploy, unsafe staging mutation, production auth bypass, Google/provider writes, playground implementation, v0.8.1+
VERIFICATION: complete diff/invariant/security/migration audit; focused/direct-caller/Worker-D1/browser/canonical gates; exact-head CI/review; private staging and production recovery/restore; exact-SHA staging/production identity, smoke, isolation, and reconciliation; tag/release parity
STOP_CONDITIONS: any master prompt hard stop, especially red required gate after two bounded attempts, unresolved P0/P1, migration need, unknown dirty work, target/SHA/schema/binding/privacy drift, failed recovery, staging failure, production preflight discrepancy, or cross-environment reachability
RESULT: ACTIVE
NEXT_EXACT_ACTION: Create the one final Slice 3 candidate commit, push the existing release branch, prepare/reuse one draft PR, and require exact-head CI before any Cloudflare access.

Phase 0/local audit evidence: current branch/HEAD/upstream and recorded dirty Slice 3 paths match the prior stop handoff; upstream divergence is 0/0; origin main remains `88bfdf026e716ffdc779cb2ce7534978f36df0f3`; origin release remains `c5f53ddf44aaf28ab4a3e43b74d42f66d09e257d`; v0.7.2 remains the latest GitHub release and resolves to production baseline `84eacfcdb47a3985fed48e3ba14bb413946d4410`; no v0.8.0 tag exists; no competing writer or unknown work was found. The browser blocker was a stale-element harness race and is green (focused 3x, adjacent 3/3, full 58/58 after correction CAS repair). Canonical `npm run check` passes 125 files/868 tests; focused release/recovery/private-path/reconciliation checks pass; all 73 paths are mapped; privacy, governance, handoff, lint, build/parity, types, dry-run, and diff checks are green. Live Cloudflare target checks remain deliberately deferred until the committed/pushed/CI-green candidate per repository remote preconditions.
