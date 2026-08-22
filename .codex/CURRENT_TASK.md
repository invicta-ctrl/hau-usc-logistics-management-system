# Current Bounded Task — FVR-001 post-removal verification and delivery

INTENT: FRONTEND_CUTOVER
MODE: EXECUTE
OBJECTIVE: Verify and deliver the Figma-native FI-00 through FI-03 frontend while preserving all accepted backend and security contracts.
TARGET: frontend-design-integration worktree, generated frontend artifacts, branch delivery, and conditional clean-lineage propagation.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-22-fvr001-atomic-figma-frontend-cutover.md
AUTHORITY: Earl current instruction -> AGENTS.md -> .agents/PROJECT_POLICY.md -> accepted FVR-001 specification and amendments -> repository functional contracts -> live Figma Make visual authority.
REQUIRED_MODEL: GPT-5.6_TERRA_MAX
ACTIVE_WRITER: NONE
RISK: HIGH;DESTRUCTIVE_LEGACY_REMOVAL_ALREADY_AUTHORIZED_AND_EXECUTED;PRODUCTION_FORBIDDEN
SCOPE: FI-00_THROUGH_FI-03_FIGMA_NATIVE_CUTOVER_AND_ATOMIC_BRANCH_DELIVERY
IN_SCOPE: one final verification pass; bounded forward repair; complete diff review; one coherent commit; push/readback; current-chain closeout; writer-lock release; conditional main and parked-baseline propagation.
OUT_OF_SCOPE: FI-04 implementation; backend/API/auth/data/schema/migration/provider semantic change; Figma write; Playground mutation; Production deployment or data write.
DELIVERABLES: deterministic Figma frontend artifacts, zero active legacy implementation paths/references, green accepted verification, pushed branch, and truthful propagation/handoff state.
VERIFICATION: install/lockfile integrity; lint with classified exceptions; build; verify:dist; unit; frontend E2E; Cloudflare build/dry-run; guarded Playground read-only smokes; zero-reference inventory; complete diff review.
STOP_CONDITIONS: unknown dirty work; conflicting writer; security/privacy ambiguity; required backend change; mandatory gate failure without bounded safe repair; Production crossover; inability to preserve separate main-worktree governance changes or parked-branch unique history.
STATUS: COMPLETE_AT_ATOMIC_PUBLICATION_CHECKPOINT
NEXT_EXACT_ACTION: PUBLISH_THIS_COMMIT_VERIFY_REMOTE_PARITY_THEN_CONDITIONALLY_PROMOTE_MAIN_AND_UPDATE_V084_BASELINE
