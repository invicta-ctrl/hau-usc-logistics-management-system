# Current Work Pointer — frontend-design-integration temporary integration branch

PROGRAM: HAU-USC Logistics
MILESTONE: FRONTEND_INTEGRATION_FI01_SHARED_DESIGN_FOUNDATION
RELEASE: v0.8.3_FINAL_FUNCTIONAL_BASELINE
RELEASE_STATE: FRONTEND_INTEGRATION_FI01_SHARED_FOUNDATION;FI01_ACCEPTANCE_REPAIR_IN_PROGRESS
STATUS: FI01_ACCEPTANCE_REPAIR_IN_PROGRESS
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: TERRA_MAX:/root/fi01_integration_writer
TERRA_WRITER: TERRA_MAX:/root/fi01_integration_writer
LOCK_HOLDER: TERRA_MAX:/root/fi01_integration_writer
WRITER_LOCK: HELD
LOCK_STATUS: HELD
LOCK_CONTINUITY: OPEN
HANDOFF_STATUS: FI01_ACCEPTANCE_REPAIR_IN_PROGRESS
REQUIRED_MODEL: One Terra-class sole branch writer per accepted FI slice, unless Earl issues another explicit task-specific override. FI-00 was executed by Claude Code / Claude Opus 5 under such an override, which has now expired.
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi01-shared-design-foundation.md
CONTROLLING_OWNER_TASK: 2026-08-21_FI01_SHARED_DESIGN_FOUNDATION_V2
FUNCTIONAL_BASELINE: CURRENT_FROZEN_V083_MAIN
FINAL_FUNCTIONAL_AUTHORITY: origin/main@86553349f5c2ebefaa637c30828c560a301f99ba;tree=db95ebaafb7de421d02b12f0158bc1a93953edde;Production=v0.8.3;FROZEN_CANDIDATE=f8e63372bc8afcb6d092970b7f9fc9ee72fd3580;BACKEND_API_AUTH_DATA_CONTRACTS_WIN
RUNTIME_PARITY_TO_MAIN: FI00_BASELINE_PASS; FI-01 intentionally changes the bounded shared CSS/build-output scope only; no backend/API/auth/data/migration/runtime-contract path changed
GOVERNANCE: PASS;check:agents passes after converging to main scripts/check-agent-instructions.mjs and .codex/agents/*.toml
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F + FIGMA_MAKE_V39
VISUAL_AUTHORITY: DESIGN_BASELINE_2026-08-20-F;Figma_Design=hXJElH4p72KfgAaoUyfNOC;Figma_Make=rP9W9MQlZkyQrUx38TVsFS@v39
MAKE_SOURCE_STATUS: RECOVERABLE_FROM_GIT;output/design/make-adoption/theme.css sha256 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d;NO_FIGMA_CALL_OR_MUTATION
HISTORICAL_ARTIFACTS: CONTAINED_AND_PRESERVED;archive/frontend-design-pre-fi00-2026-08-21 -> f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970;1078 files and 136,496,010 bytes removed from the active tree, zero unrecoverable
BRANCH_ROLE: TEMPORARY_FRONTEND_INTEGRATION_WORK_BRANCH;promoted only by clean-lineage squash or a fresh promotion branch;deleted after Production acceptance and no-unique-work proof
FRONTEND_IMPLEMENTATION: FI01_SHARED_FOUNDATION_ACCEPTED_ON_WORK_BRANCH;D02=PASS;D04=PASS;D08=OPEN_FOR_FI02
DEPLOY: NOT_AUTHORIZED
START_HERE: docs/design/FRONTEND_INTEGRATION_START_HERE.md
FI00_RECEIPT: docs/design/FRONTEND_FI00_RECONCILIATION_RECEIPT.md
CONTRACT_MATRIX: docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md
SOURCE_DISPOSITION: docs/design/FRONTEND_SOURCE_DISPOSITION.md
FIGMA_SOURCE_REGISTER: docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
EXECUTION_PLAN: docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md
ACCEPTANCE_MATRIX: docs/design/FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md
CODEX_HANDOFF: docs/design/CODEX_FRONTEND_INTEGRATION_HANDOFF.md
BLOCKER: FALSE; accepted FI-01 canonical-consumption and continuity repair is in progress. D-08 remains OPEN_FOR_FI02.
VALIDATION: FI-01 published evidence: npm run build PASS; focused npx eslint src/v5 PASS; build-make-theme --check, verify-make-theme, verify-make-landing-theme, and theme-source --check PASS; D41 contrast PASS; current-app Playwright matrix PASS at 320/390/768/1024/1440; governance/Prettier/diff/secret checks PASS. Acceptance-repair verification is in progress because tokens.css and v4.css changed. Full npm lint remains only the pre-existing unrelated prototypes/public-portals-r3 browser-global configuration failure.
NEXT_EXACT_ACTION: FI01_REPAIR_CANONICAL_CONSUMPTION_AND_CLOSEOUT

## What FI-00 settled

Current `origin/main` is merged into this branch and is authoritative for every
product, runtime, security, data, build, and governance contract. The approved
frontend and Figma evidence is preserved. Obsolete and bulky historical
artifacts were removed from the active tree only after each one was proven
recoverable from the immutable archive tag. Full evidence is in
`docs/design/FRONTEND_FI00_RECONCILIATION_RECEIPT.md`.

## Historical branch pointers retained

The pre-v0.8.3 branch pointer, its v0.7.x runtime facts, the Phase 9 intake
pointer, and the complete pre-FI-00 tree remain preserved in Git history and in
`archive/frontend-design-pre-fi00-2026-08-21`. They are not current authority.
