# Current Work Pointer

PROGRAM: HAU-USC Logistics
MILESTONE: Isolated Staging Playground + Git Branch Governance + Production Parity
STATUS: COMPLETE_AWAITING_EARL_MANUAL_TESTING
BRANCH: release/v0.8.1-isolated-staging-playground
HEAD: GIT_HEAD
UPSTREAM: origin/release/v0.8.1-isolated-staging-playground
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
WORKTREE_STATE: GIT_STATUS
ACCEPTED_RELEASE_SHA: 3059098ff2a2935fec59df52748ccae420aadba7
FINAL_CANDIDATE_SHA: THIS_COMMIT_AT_EXACT_WORKFLOW_DISPATCH
TAG: v0.8.0
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_HANDOFF
REQUIRED_MODEL: CODEX
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/isolated-staging-playground-and-git-governance.md
BLOCKER: NONE
MIGRATION_DECISION: NONE_REQUIRED
SCHEMA: 30
LATEST_MIGRATION: 0030_production_access_and_operations.sql
RUNTIME: exact PR #23 candidate deployed by the frozen manual workflow to isolated playground D1/R2; acceptance and CLEAN reset state verified
PRODUCTION: exact deployed SHA 3059098ff2a2935fec59df52748ccae420aadba7; no task mutation authorized
RELEASE_EVIDENCE: v0.8.0 tag/live identity reverified; private D1/R2 baseline, parity, reset, rollback, live-operator, production-nonmutation, and exact workflow evidence captured
NEXT_EXACT_ACTION: Earl manually tests the exact PR #23 playground candidate. If accepted, submit a separate explicit production GO task; do not merge, deploy production, rotate pointers, start frontend integration, or begin M1/M2 from this handoff.
