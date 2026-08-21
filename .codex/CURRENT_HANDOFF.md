# Current Environment Handoff

FROM: CLAUDE_OPUS_5:frontend_integration_preparation_2026-08-21
TO: CODEX — FI-00 ACCEPTED INTEGRATION BASELINE
PROGRAM: HAU-USC Logistics — frozen v0.8.3 frontend design integration
STATUS: FRONTEND_INTEGRATION_PREPARATION_COMPLETE
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
TREE: GIT_TREE
UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
TERRA_WRITER: NONE
LOCK_HOLDER: NONE
WRITER_LOCK: RELEASED
LOCK_STATUS: RELEASED
LOCK_CONTINUITY: CLOSED
HANDOFF_STATUS: READY_FOR_CODEX_FRONTEND_INTEGRATION
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_TASK: .codex/CURRENT_TASK.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
CONTROLLING_OWNER_TASK: 2026-08-21_FRONTEND_INTEGRATION_PREPARATION_CLAUDE_OPUS_5

PREPARATION_START_SHA: c4356570bd0442304303989e0e7cc97e31d481f7
PREPARATION_START_TREE: cf0f28dc794afc32492057ab14d80aa086431cc6
FROZEN_MAIN_SHA: 86553349f5c2ebefaa637c30828c560a301f99ba
FROZEN_MAIN_TREE: db95ebaafb7de421d02b12f0158bc1a93953edde
FROZEN_PRODUCT_RELEASE: v0.8.3 -> 07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e
FROZEN_PRODUCTION_CANDIDATE: f8e63372bc8afcb6d092970b7f9fc9ee72fd3580;tree=5788251d483f23ec5e19048e1a946b3a00450436;verified ancestor of origin/main
PRODUCTION_SCHEMA: schema32
PRODUCTION_MIGRATIONS: 0031_canonical_identity_foundation.sql;0032_staff_account_activity_history.sql;32 files total

FUNCTIONAL_BASELINE: FROZEN_V083_MAIN;backend, API, auth, capability, and data contracts win over every visual reference
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F;Figma_Design=hXJElH4p72KfgAaoUyfNOC;Figma_Make=rP9W9MQlZkyQrUx38TVsFS@Version39;pending edits NONE
FIGMA_SOURCE_STATUS: RECOVERABLE_FROM_GIT;output/design/make-adoption/theme.css sha256 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d matches the v39 identity in the baseline register
INTEGRATION_DIRECTION: frozen v0.8.3 contracts and runtime -> selectively ported visual layer; never a wholesale frontend replacement
BRANCH_ROLE: TEMPORARY_FRONTEND_INTEGRATION_WORK_BRANCH

COMPLETED: Seven preparation documents under docs/design/, branch-local continuity records, and reconciliation notes on the Phase 9 intake. The frozen-main contract inventory, Figma and Make source register, source-disposition map, FI-00 to FI-16 execution plan, and Playground and Production acceptance matrix are complete. Frontend implementation has not started.

FRONTEND_RUNTIME_CHANGES: 0
BACKEND_CHANGES: 0
SERVICE_CONTRACT_CHANGES: 0
AUTH_MODEL_CHANGES: 0
MIGRATIONS: 0
PROVIDER_WRITES: 0
FIGMA_WRITES: 0
PLAYGROUND_WRITES: 0
PRODUCTION_WRITES: 0
LIVE_PRODUCTION_CHANGED: NO

VALIDATION: Deterministic extraction of the route, capability, operation, state, and transition inventories from frozen main; Figma Make sha256 reconciliation against the durable baseline register; path existence checks for every referenced file; contract-matrix coverage and source-disposition completeness checks; Markdown formatting; git diff --check; check:governance and handoff:verify; complete logical diff review; normal push and readback. The product test suite was not run because no runtime code changed.

EXTERNAL_ACTIONS: Git documentation commit and normal push only. Two read-only Figma calls (whoami, get_metadata) that mutated nothing. No provider, database, recovery, deployment, or Production action.

FIRST_CODEX_SLICE: FI-00 Integration baseline and branch reconciliation
FIRST_CODEX_OWNED_PATHS: .codex/CURRENT.md;.codex/CURRENT_TASK.md;.codex/CURRENT_HANDOFF.md;.codex/specs/active/<new frontend-integration spec>;the merge commit reconciling origin/main into this branch
FIRST_CODEX_REQUIRED_READS: AGENTS.md;.agents/PROJECT_POLICY.md;.codex/CURRENT.md;.codex/CURRENT_TASK.md;.codex/CURRENT_HANDOFF.md;docs/design/FRONTEND_INTEGRATION_START_HERE.md;docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md FI-00 section;docs/design/FRONTEND_SOURCE_DISPOSITION.md DO_NOT_MIGRATE list;git diff --name-status origin/main frontend-design-integration
FIRST_CODEX_DO_NOT_REPEAT: the Figma audit;the Make capture;the route/capability/operation/state inventory;the source classification;the historical v5 browser matrix;any use of v0.7.2 as current authority

BLOCKER: TRUE;FI-00_REQUIRED. This branch is 191 commits behind origin/main and merging it into main as-is would delete 135 files, including migrations 0031 and 0032 and the whole src/v5/integration adapter layer. Two owner decisions are also outstanding: the branch strategy that supersedes the Phase 9 recommendation, and the disposition of 1,170 branch-only design-evidence files totalling 138,815,428 bytes. Figma defects D-08, D-04, and D-02 remain open and block FI-01 and FI-02.

UNVERIFIED_ITEMS: live Figma Design page count (a read-only probe returned one page where the audit records 28; consistent with the desktop bridge, not evidence of change); live Figma Make version (no MCP tool reads a /make/ URL); 54 inferred colours on Figma page 15; original authorship of the preserved RequestCenterRoute.tsx edit.

OWNER_DECISIONS_REQUIRED: branch strategy confirmation;design-evidence promotion disposition;typeface reality (D-04);blur ladder reconciliation (D-02);landing hero ink and state semantics (D-08);whether scripts/design/** joins the work-branch toolchain;any dependency or verification expansion;separate Playground deploy authority and separate Production GO.

ROLLBACK_POINT: c4356570bd0442304303989e0e7cc97e31d481f7

NEXT_EXACT_ACTION: CODEX_FI_00_ACCEPTED_INTEGRATION_BASELINE

RESUME_COMMANDS: Read the governance chain and the three current records; read docs/design/FRONTEND_INTEGRATION_START_HERE.md; verify the packet against current HEAD using each document's STALE_IF block; obtain the two owner decisions; merge origin/main into this branch with --no-ff resolving every behavior path in main's favour; prove `git diff --name-status origin/main HEAD | grep '^D' | wc -l` returns 0; run npm run check; write the accepted frontend-integration specification; update the three current records; stop before FI-01.

PROHIBITED_ACTIONS: No frontend implementation before FI-00 is accepted. No rebase, reset, clean, force-push, or history rewrite. No merge into main outside the FI-15 protected path. No tag, deployment, migration, provider write, or Production action without that action's exact accepted authority. No Figma mutation. No hand-edited generated artifact. No fixture, mock actor, fake count, or preview control in a user-facing surface. No client-side authorization. No new runtime dependency without a separate owner decision.
