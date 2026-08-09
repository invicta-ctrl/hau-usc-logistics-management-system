# Current Bounded Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: REPOSITORY_MAINTENANCE, ARCHITECTURE, TESTING
MODE: EXECUTE
OBJECTIVE: Convert isolated staging into the permanent Isolated Staging Playground, establish safe production-derived D1/R2 baseline parity and resettable working state, and hardcode the permanent Git/release model.
RESULT: IMPLEMENTED_AWAITING_EXACT_PLAYGROUND_DEPLOYMENT
TARGET: release/v0.8.1-isolated-staging-playground plus playground-only Cloudflare resources
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/isolated-staging-playground-and-git-governance.md
AUTHORITY: Earl's accepted 2026-08-09 owner execution prompt, protected Git history, live provider truth, and repository deployment/recovery runbooks
SKILLS: lean-ctx (local allowlist blocked; narrow native fallback), cloudflare-deploy, Hallmark for the scoped playground UI, GitHub publishing workflow at the PR gate
REQUIRED_MODEL: CODEX
STARTING_SHA: df3fdb96e62ab396c63e3300b58fb70c6ab960a5
PRODUCTION_SHA: 3059098ff2a2935fec59df52748ccae420aadba7
PRODUCTION_VERSION: v0.8.0
CANDIDATE_SHA: PENDING_FREEZE
PR: PENDING
RUNTIME: playground clean/working D1 and R2 are isolated, parity-verified with privacy exceptions, and reset-proven; Worker deployment pending
SCHEMA: 30
LATEST_MIGRATION: 0030_production_access_and_operations.sql
NEW_MIGRATION: NONE
DELIVERABLE: verified governance, one-way clean baselines, reset/refresh/session guards, playground UI/module switcher, denial tests, candidate-to-playground CI, production non-mutation, and exact handoff
VERIFICATION: Git/release/provider handshake; recovery proof; D1/R2 parity and reset mutation proof; production before/after fingerprints; focused/canonical/browser/workflow/governance/handoff checks; complete diff and P0/P1 review
RISK: HIGH
SCOPE: accepted specification, root governance, playground-only Cloudflare config/resources/runtime, private baseline/reset/recovery tooling, CI, tests, bounded GitHub branch/PR and initial recovery-pointer writes after proof
OUT_OF_SCOPE: production deployment/business mutation/migration, automatic promotion, Google/provider-email writes, frontend baseline integration, v0.8.1 product features, M1/M2, unrelated cleanup, force push, unknown branch deletion
STOP_CONDITIONS: environment/binding ambiguity, production crossover, unknown dirty work, privacy/access uncertainty, missing recovery, migration need, failed integrity/FK/parity, exact-identity drift, automatic production path, unresolved P0/P1, or two failed targeted repair rounds
EXTERNAL_WRITES: bounded GitHub branch/PR; playground-only Cloudflare Worker/D1/R2; production read-only export/copy source; no production deployment or business mutation
ACTIVE_WRITER: CODEX
HANDOFF_STATUS: IN_PROGRESS
NEXT_EXACT_ACTION: Freeze the clean exact candidate, deploy it only to the Isolated Staging Playground, run acceptance and production-nonmutation reconciliation, publish the bounded PR, and stop for Earl.
