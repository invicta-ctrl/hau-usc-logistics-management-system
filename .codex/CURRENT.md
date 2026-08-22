# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics
MILESTONE: FVR-02_FULL_FRONTEND_RECOVERY_MEDIA_MOTION_INDEX
STATUS: ACTIVE_FVR02
PHASE: A2_LOCAL_PREVIEW_REPAIR_THEN_RESUME_FVR02
LOCAL_PREVIEW_REPAIR: FINAL_CORRECTION_UNIT_VERIFIED_PENDING_RUNTIME_ACCEPTANCE;REVIEWED_346f4bf_FAILED;ac2d722_FAILED;2d66d9d_FAILED;b718ba1_FAILED;ee412d4_FAILED
BRANCH: frontend-design-integration
HEAD: RESOLVE_FROM_LIVE_GIT_HEAD
BASELINE_HEAD: RESOLVE_FROM_LIVE_GIT
LAST_VERIFIED_AHEAD_BEHIND: BEHIND_0_AHEAD_7 (pre-correction; resolve current from live Git)
UPSTREAM: origin/frontend-design-integration@e93e5c97fdb44f85f1b6ac1b578c9014a77b6166
AHEAD_BEHIND: RESOLVE_FROM_LIVE_GIT
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: CLEAN_EXCEPT_PRESERVED_EXCLUDED_UNTracked `.ai-bridge/`
ACTIVE_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2
WRITER_LOCK: ACQUIRED
REQUIRED_MODEL: GPT-5.6_SOL_MAX
SOL_MAX_ROLE: top-level orchestrator and final reviewer, read-only, writes forbidden
CANONICAL_WRITER: DeepSeek V4 Pro #1
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-22-fvr02-full-frontend-recovery-media-motion-index.md
ACCEPTED_AMENDMENTS: .codex/specs/accepted/2026-08-22-fvr02-a2-ox-first-routing.md;.codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md

AUTHORITY: Earl instruction -> accepted FVR-02 spec -> accepted FVR-02-A2 amendments -> live Figma Make implementation/composition/motion/source -> live Figma Design docs/annotations/variables/assets -> accepted backend/API/auth/data/security contracts -> current Figma-native source/tests -> verified mirrors fallback only -> V5 historical archaeology only (never authority).

FVR001_CUTOVER_COMMIT: f7e5bf83205dbe58b5fb72126a4456747d92e906
FVR001_STATUS: CLOSED_PUBLISHED
GOVERNANCE_COMMIT: a7da2e46902273f6724b21dffc5854f11e920c26
GOVERNANCE_COMMIT_NOTE: branch-local AGENTS appendix, non-propagating

RECLASSIFICATION:
FI00_STATUS: REVALIDATE
FI01_STATUS: REVALIDATE
FI02_FUNCTIONAL_STATUS: PRESERVE_IF_VERIFIED
FI02_VISUAL_MEDIA_MOTION_STATUS: REOPENED
FI03_FUNCTIONAL_STATUS: PRESERVE_IF_VERIFIED
FI03_VISUAL_STATUS: REVALIDATE
PREVIEW_MODULE_INDEX_STATUS: NOT_IMPLEMENTED
FI04_STATUS: BLOCKED

MODEL_CONTRACT: GPT-5.6 Sol Max sole read-only orchestrator/final reviewer (Sol writes forbidden, only Sol spawns, depth one, no recursion/substitution). DeepSeek V4 Pro #1 sole canonical writer. Ox Alpha is the default read-only subagent for all safe review/scout/audit domains via explicit model override openrouter/stealth/ox-alpha; additional DeepSeek is exceptional heavy-analysis only with a one-sentence WHY_DEEPSEEK_NOT_OX. fork_turns none/narrow capsules for Ox; no silent substitution; one writer; non-propagation unchanged; actual runtime concurrency ceiling unchanged; Ox writer failover only under separately accepted FVR-02-A1 exhaustion authority.

FIRST_WAVE: Ox-first; routine read-only lanes default to Ox Alpha; DeepSeek reserved for the canonical writer and exceptional heavy-analysis lanes; no invented lane IDs or results.

LISTENER_EVIDENCE: 2026-08-22 read-only observation -> http://127.0.0.1:4173/ NO_LISTENER, HTTP actively refused (ERR_CONNECTION_REFUSED). No external mutation performed; no preview started or stopped during this activation.
PREVIEW_PLAN: .plans/fvr02-a2-local-preview-resilience.todo.md
PREVIEW_RECEIPT: .codex/FVR02_A2_LOCAL_PREVIEW_RECEIPT.md

GUARDED_PREVIEW: http://127.0.0.1:4173 (no healthy listener at A2 activation; identity/environment signal to be reverified by the A2 local preview repair)
PRODUCTION_DEPLOYMENT: FORBIDDEN
PRODUCTION_DATA_WRITE: FORBIDDEN
PROVIDER_WRITE: FORBIDDEN
FIGMA_WRITE: FORBIDDEN
BACKEND_SEMANTIC_CHANGE: FORBIDDEN (unless separately amended)
MIGRATION: FORBIDDEN

ROLLBACK: Git revert product commits; preserve FVR-001 and rollback tag; Playground repair only via recorded existing runbook recovery; no Production/Figma rollback because no writes.

OPEN_RISKS: hero-video authority conflict possible; public media baseline root cause unclassified; Ox Alpha/model route availability to be reverified at dispatch; safe existing server-validated Index signal unverified.

NEXT_EXACT_ACTION: parent performs live runtime acceptance of the persistent preview (start/status/restart/stop and owned-child forced exit against the real private manifest), then resume FVR-02 audit-first phases under Ox-first routing.
