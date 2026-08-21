# Current Work Pointer — frontend-design-integration temporary integration branch

PROGRAM: HAU-USC Logistics
MILESTONE: FRONTEND_INTEGRATION_FI00_ADOPTED
RELEASE: v0.8.3_FINAL_FUNCTIONAL_BASELINE
RELEASE_STATE: FRONTEND_INTEGRATION_FI00_ADOPTED
STATUS: FI00_BRANCH_RECONCILIATION_IN_PROGRESS
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: CLAUDE_OPUS5_HIGH:FI00_FRONTEND_BRANCH_RECONCILIATION
TERRA_WRITER: NONE
LOCK_HOLDER: CLAUDE_OPUS5_HIGH:FI00_FRONTEND_BRANCH_RECONCILIATION
WRITER_LOCK: HELD
LOCK_STATUS: HELD
LOCK_CONTINUITY: OPEN
HANDOFF_STATUS: FI00_IN_PROGRESS
REQUIRED_MODEL: Claude Code / Claude Opus 5, High reasoning, as sole branch-local FI-00 writer under Earl explicit 2026-08-21 task-specific override; no subagents, no model substitution, no second writer.
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi00-branch-reconciliation.md
CONTROLLING_OWNER_TASK: 2026-08-21_FI00_FRONTEND_BRANCH_RECONCILIATION
FUNCTIONAL_BASELINE: FROZEN_V083_MAIN
FINAL_FUNCTIONAL_AUTHORITY: origin/main@86553349f5c2ebefaa637c30828c560a301f99ba;tree=db95ebaafb7de421d02b12f0158bc1a93953edde;Production=v0.8.3;FROZEN_CANDIDATE=f8e63372bc8afcb6d092970b7f9fc9ee72fd3580;BACKEND_API_AUTH_DATA_CONTRACTS_WIN
VISUAL_BASELINE: VERIFIED_FIGMA_DESIGN_AND_MAKE
VISUAL_AUTHORITY: DESIGN_BASELINE_2026-08-20-F;Figma_Design=hXJElH4p72KfgAaoUyfNOC;Figma_Make=rP9W9MQlZkyQrUx38TVsFS@v39
MAKE_SOURCE_STATUS: RECOVERABLE_FROM_GIT;theme.css sha256 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d;NO_FIGMA_CALL_OR_MUTATION
BRANCH_ROLE: TEMPORARY_FRONTEND_INTEGRATION_WORK_BRANCH;deleted after Production acceptance and no-unique-work proof
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY: NOT_AUTHORIZED
START_HERE: docs/design/FRONTEND_INTEGRATION_START_HERE.md
CONTRACT_MATRIX: docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md
SOURCE_DISPOSITION: docs/design/FRONTEND_SOURCE_DISPOSITION.md
FIGMA_SOURCE_REGISTER: docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
EXECUTION_PLAN: docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md
ACCEPTANCE_MATRIX: docs/design/FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md
CODEX_HANDOFF: docs/design/CODEX_FRONTEND_INTEGRATION_HANDOFF.md
BLOCKER: TRUE;FI-00_REQUIRED;this branch is 191 commits behind origin/main and would delete 135 files main has, including migrations 0031 and 0032 and the whole src/v5/integration adapter layer; a merge of origin/main into this branch and two owner decisions must precede any frontend implementation.
VALIDATION: Documentation and reference preparation only. Focused Markdown formatting, git diff --check, governance and handoff validation, complete diff review, and push readback. No product test suite was run because no runtime code changed.
NEXT_EXACT_ACTION: FI00_MERGE_CURRENT_MAIN_INTO_FRONTEND_BRANCH

## Superseded Phase 9 recommendation

The Phase 9 intake recommended starting frontend implementation on a fresh
branch cut from final main and never merging this branch. Earl's 2026-08-21
directive replaces that: `frontend-design-integration` is the temporary
frontend-integration work branch and is promoted through the protected `main`
lineage. FI-00 exists to reconcile the branch to final main before any
implementation. See `docs/design/FRONTEND_INTEGRATION_START_HERE.md` section 7.

## Historical branch pointers retained

The pre-v0.8.3 branch pointer, its v0.7.x runtime facts, and the Phase 9 intake
pointer remain preserved in Git history. They are not current authority.
