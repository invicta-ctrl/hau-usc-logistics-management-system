# Current Work Pointer — frontend-design-integration temporary integration branch

PROGRAM: HAU-USC Logistics
MILESTONE: FRONTEND_INTEGRATION_FI02_PUBLIC_LANDING_PORTAL_SHELL_COMPLETE
RELEASE: v0.8.3_FINAL_FUNCTIONAL_BASELINE
RELEASE_STATE: FI02_COMPLETE
STATUS: FI02_STATUS_PASS
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
TREE: GIT_TREE
UPSTREAM: origin/frontend-design-integration@GIT_HEAD;NORMAL_FI02_PUSH_READBACK_0_0
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
TERRA_WRITER: NONE
LOCK_HOLDER: NONE
WRITER_LOCK: RELEASED
LOCK_STATUS: RELEASED
LOCK_CONTINUITY: CLOSED
HANDOFF_STATUS: READY_FOR_FI03
REQUIRED_MODEL: One Terra-class sole branch writer completed FI-02; no writer is active until a separately accepted FI-03 task acquires a new lock.
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi02-public-landing-portal-shell.md
CONTROLLING_OWNER_TASK: 2026-08-21_FI02_PUBLIC_LANDING_AND_PORTAL_SHELL; durably adopted before product edits
ACCEPTED_AMENDMENT: .codex/specs/active/frontend-integration-live-local-preview-amendment.md;FI-LIVE-PREVIEW-01
D08_STATUS: PASS; accessibility overrides literal low-contrast Figma ink; active/emphasized FI-01 semantic foregrounds meet WCAG AA and inactive/secondary foregrounds remain muted only when AA-compliant.
OWNER_AMENDMENT: 2026-08-21_ADVERTISEMENT_STATE_PROJECTION_ACCEPTED; existing advertisement API is projected only into truthful loading, populated, empty, request-error, and media-failure presentation states.
AMENDMENT_SCOPE: `src/v5/integration/runtime.js` public.landing projection and `src/v5/src/registry.js` existing state registration only; backend/API/auth/data/provider/Playground/Production behavior remained frozen.
FI02_STATUS: PASS
PUBLIC_LANDING: REAL
PUBLIC_PORTAL_SHELL: REAL
ADVERTISEMENT_STATES: PASS; loading, populated, empty, request-error, and media-failure are truthful existing-API projections.
ROUTE_PARITY: PASS; only `#/public.signin`, `#/public.request-intake`, `#/public.lending-intake`, `#/public.policy`, approved official HTTPS destinations, and existing authored-theme control ship; `public.register` remains absent/unsupported.
PUBLIC_PRIVACY: PASS; no static fallback advertisement, direct browser API/D1/R2 access, unpublished/internal data, provider identifier, or fabricated user-facing record.
ACCESSIBILITY: PASS; semantic landmarks, keyboard focus, reduced motion, light/dark themes, and D-08 AA semantic foreground correction verified.
LOCAL_PREVIEW: CLOSED; guarded loopback-only preview was verified at 127.0.0.1:4173 against the isolated Playground proxy, then stopped with no listener retained.
FUNCTIONAL_BASELINE: CURRENT_FROZEN_V083_MAIN
FINAL_FUNCTIONAL_AUTHORITY: origin/main@86553349f5c2ebefaa637c30828c560a301f99ba;tree=db95ebaafb7de421d02b12f0158bc1a93953edde;Production=v0.8.3;FROZEN_CANDIDATE=f8e63372bc8afcb6d092970b7f9fc9ee72fd3580;BACKEND_API_AUTH_DATA_CONTRACTS_WIN
RUNTIME_PARITY_TO_MAIN: FI00_BASELINE_PASS; FI-01 shared foundation and FI-02 frontend-only changes accepted.
GOVERNANCE: PASS; FI-02 final validation, complete logical diff review, normal commit/push, and remote readback are required before closeout is reported.
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F + FIGMA_MAKE_V39
VISUAL_AUTHORITY: accepted Git mirror; live Figma connector requires reauthentication and was not retried; output/design/make-adoption/theme.css sha256 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d.
MAKE_SOURCE_STATUS: RECOVERABLE_FROM_GIT;NO_FIGMA_CALL_OR_MUTATION
PREDECESSOR_FI01: ACCEPTED; D02=PASS; D04=PASS.
FI02_RECEIPT: docs/design/FRONTEND_FI02_PUBLIC_LANDING_PORTAL_SHELL_RECEIPT.md
BRANCH_ROLE: TEMPORARY_FRONTEND_INTEGRATION_WORK_BRANCH; no main merge/deployment under FI-02.
DEPLOY: NOT_AUTHORIZED
START_HERE: docs/design/FRONTEND_INTEGRATION_START_HERE.md
FI00_RECEIPT: docs/design/FRONTEND_FI00_RECONCILIATION_RECEIPT.md
FI01_RECEIPT: docs/design/FRONTEND_FI01_DESIGN_FOUNDATION_RECEIPT.md
CONTRACT_MATRIX: docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md
FIGMA_SOURCE_REGISTER: docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
EXECUTION_PLAN: docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md
ACCEPTANCE_MATRIX: docs/design/FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md
CODEX_HANDOFF: docs/design/CODEX_FRONTEND_INTEGRATION_HANDOFF.md
BLOCKER: FALSE; FI-02 is complete. A new FI-03 acceptance, sole-writer lock, and revalidation are required before any further product work.
NEXT_EXACT_ACTION: FI-03_SIGNIN_VERIFICATION_APPLICATION_STATUS
