# Current Bounded Task — FVR-02 A2 activation and local-preview repair slice

INTENT: FRONTEND_RECOVERY
MODE: EXECUTE
TASK_ROUTING:
  PRIMARY: SOFTWARE_FEATURE/FRONTEND_RECOVERY
  SECONDARY: BUG_FIX/TESTING/GOVERNANCE/FIGMA_DESIGN_TO_CODE/MOTION/ACCESSIBILITY
  MODE: EXECUTE
  TARGET: frontend-design-integration worktree, Figma-native frontend, public media chain, hero motion, preview Module Index, local preview supervisor
  SKILLS: lean-ctx+figma+figma-design-to-code+figma-implement-design+figma-implement-motion+impeccable+create-plan
  RISK: HIGH

OBJECTIVE: Authority/governance activation of the two FVR-02-A2 amendments (Ox-first routing; local preview resilience) followed by the persistent local preview supervisor repair slice. Product changes and the preview Module Index remain out of scope.

SLICE_STATUS: FVR-02-A2 local preview final corrective slice implemented and unit-verified; first (346f4bf), second (ac2d722), third (2d66d9d), fourth (b718ba1), fifth (ee412d4), and sixth (9ad2d35) passes all failed parent/Ox review; live runtime acceptance deferred to parent.

TARGET: frontend-design-integration worktree; generated frontend artifacts; guarded Playground preview; public media/CurrentSection chain; HeroSection/HeroMotion; preview Module Index/Surface Preview/Test Real Login Flow; local preview supervisor/launcher.

CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-22-fvr02-full-frontend-recovery-media-motion-index.md
ACCEPTED_AMENDMENTS: .codex/specs/accepted/2026-08-22-fvr02-a2-ox-first-routing.md;.codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md

AUTHORITY: Earl current instruction -> accepted FVR-02 spec -> accepted FVR-02-A2 amendments -> live Figma Make (implementation/composition/motion/source) -> live Figma Design (docs/annotations/variables/assets) -> accepted backend/API/auth/data/security contracts -> current Figma-native source/tests -> verified mirrors fallback only -> V5 historical archaeology only.

REQUIRED_MODEL: GPT-5.6_SOL_MAX
ACTIVE_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2
WRITER_LOCK: ACQUIRED
PHASE: A2_LOCAL_PREVIEW_REPAIR_THEN_RESUME_FVR02

RECLASSIFICATION: FI-00 REVALIDATE; FI-01 REVALIDATE; FI-02 FUNCTIONAL PRESERVE_IF_VERIFIED; FI-02 VISUAL/MEDIA/MOTION REOPENED; FI-03 FUNCTIONAL PRESERVE_IF_VERIFIED; FI-03 VISUAL REVALIDATE; PREVIEW MODULE INDEX NOT_IMPLEMENTED; FI-04 BLOCKED.

IN_SCOPE (this activation): author the two accepted A2 amendment specs; update the branch-local AGENTS.md appendix for Ox-first routing; update current-chain records; two path-limited commits.

OUT_OF_SCOPE (this activation): implementing the preview supervisor, product/FI repairs, media population, or Module Index; backend/API/auth/data/schema/migration/provider semantic change; Figma write; Production deployment; Production data write; history rewrite/force-push/reset/clean; mutation of unknown or unrelated work; `.ai-bridge/`; AGENTS.md universal body; PROJECT_POLICY.

DELIVERABLES: branch-local AGENTS.md Ox-first appendix; two self-contained accepted A2 amendment specs; corrected current-chain records; two isolated commits with verified path sets; passing governance check and git diff --check.

VERIFICATION: `scripts/check-agent-instructions.mjs` pass; `git diff --check` pass; exact commit path sets (AGENTS.md only; then amendments + CURRENT* only); status showing only preserved `.ai-bridge/` afterward.

STOP_CONDITIONS: conflicting active writer; unknown dirty work; missing or contradictory authority; live-source failure unresolved; required backend/auth/data/schema/migration/provider semantic change; Production crossover; unsafe Playground mutation without rollback; mandatory verification failure; Ox/model route unavailable for a required gate; hero authority conflict; Index safe-signal absence; scope expansion beyond authority/governance activation.

DELEGATION:
- AGENT: DeepSeek V4 Pro #1 (/root/ds1_fvr02_writer_v2); MODEL: DeepSeek V4 Pro; ROLE: canonical frontend writer; MODE: WRITE; SCOPE: accepted FVR-02 repairs, preview supervisor (next dispatched work), and current-chain records; OWNED_PATHS: canonical frontend source, directly coupled tests, preview tooling, current-chain records, FVR-02 spec and amendments; EXCLUDED: AGENTS.md universal body, PROJECT_POLICY, product/plan/source outside accepted scope, commits/pushes unless authorized, Figma/provider/Playground/Production writes; STATUS: ACTIVE_FVR02.

MODEL_CONTRACT (A2 Ox-first): Ox Alpha is the default read-only subagent for all safe review/scout/audit domains via openrouter/stealth/ox-alpha; DeepSeek #1 stays canonical writer; additional DeepSeek is exceptional heavy-analysis only with WHY_DEEPSEEK_NOT_OX; fork_turns none/narrow capsules for Ox; no silent substitution; one writer; concurrency ceiling unchanged; Ox writer failover only under separately accepted FVR-02-A1 exhaustion authority.

LISTENER_EVIDENCE: 2026-08-22 read-only observation -> http://127.0.0.1:4173/ NO_LISTENER, HTTP actively refused. No preview started/stopped or external state mutated during this activation.

STATUS: ACTIVE_FVR02
NEXT_EXACT_ACTION: parent performs live runtime acceptance of the persistent preview (start/status/restart/stop and owned-child forced exit against the real private manifest), then resume FVR-02 audit-first phases under Ox-first routing.
