# Current Bounded Task

INTENT: REPOSITORY_MAINTENANCE / ARCHITECTURE_GOVERNANCE
MODE: EXECUTE
OBJECTIVE: Implement the bounded Sol/Terra/Luna orchestration governance amendment while preserving the completed Design Gate objective, frozen candidate boundary, and Earl's decision gate.
SECONDARY_INTENTS: DOCUMENTATION, MODEL_ROUTING, WRITER_LOCK_NORMALIZATION, TASK_ORCHESTRATION
SKILLS: lean-ctx for targeted governance reads and deterministic verification
RESULT: COMPLETE_AWAITING_OWNER_DECISION
TARGET: repository-scoped agent governance and directly conflicting model-routing records only
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.8.1-design-dna-research-amendment.md
AUTHORITY: Earl's 2026-08-10 Sol/Terra/Luna Orchestration Governance Repair directive; repository governance; accepted Design DNA research amendment for preserved product boundary
REQUIRED_MODEL: GPT-5.6 SOL
ORCHESTRATOR_MODEL: GPT-5.6 SOL
ORCHESTRATOR_WRITES: FORBIDDEN
WRITER_MODEL: TERRA MAX
READER_MODEL: LUNA MAX
MAX_SOL_SUBAGENTS: 0
MAX_TERRA_SUBAGENTS: 16
MAX_LUNA_SUBAGENTS: 16
DELEGATION_DEPTH: 1
SUBAGENT_SPAWNER: SOL_ONLY
MODEL_SUBSTITUTION: FORBIDDEN_UNLESS_EARL_EXPLICITLY_AMENDS_TASK
CANONICAL_INTEGRATION_WRITER: TERRA_MAX:terra_governance_writer
GOVERNANCE_AMENDMENT: .codex/specs/active/sol-terra-luna-orchestration-governance-amendment.md
STARTING_SHA: a578e72ba86d9c72908892aa6812831ac4a56e4e
FROZEN_DESIGN_RESEARCH_CANDIDATE_SHA: 433ac260092960328a586cf50ed7269f08e0a19b
ENDING_SHA: GIT_HEAD
PRODUCTION_SHA: 3059098ff2a2935fec59df52748ccae420aadba7
PRODUCTION_VERSION: v0.8.0
PLAYGROUND_RUNTIME_SHA: 433ac260092960328a586cf50ed7269f08e0a19b
PR: #23 DRAFT
SCHEMA: 30
LATEST_MIGRATION: 0030_production_access_and_operations.sql
NEW_MIGRATION: NONE
DELIVERABLE: one coherent repository-wide Sol/Terra/Luna governance policy, a canonical governance amendment, normalized current-chain routing, updated read-only profiles, and evidence preserving the Design Gate as the next owner decision
VERIFICATION: deterministic AGENTS.md inventory; complete logical diff; focused governance-unit coverage; agent-instruction, continuity, formatting, ledger/record coherence, and contradiction checks; Luna pre-commit final content audit; independent read-only exact-SHA audit after closure commit/push; Sol owner handoff
RISK: MEDIUM
SCOPE: AGENTS.md, directly conflicting governance records, active current-chain records, canonical governance amendment, governance validator/tests, and required documentation/status/continuation evidence only
OUT_OF_SCOPE: frontend/backend implementation, redesign code, DESIGN.md replacement, generated artifacts, migration, staging deployment/mutation, Production deployment/mutation, D1/R2/Google/provider-email writes, M1/M2, automatic promotion, merge, tag, recovery-pointer rotation, force push, unknown cleanup, and any Design Gate implementation
STOP_CONDITIONS: authority conflict, unknown work, competing writer, frozen-candidate invalidation risk, Production crossover, provider/data mutation, required runtime/product change, or model-routing substitution requirement
EXTERNAL_WRITES: initial governance commit/push 4825f02dfa96b9e5e6fe018d1bfd252d7720f47d completed after the pre-final Sol review, Luna review/recheck, required checks, and protected Git authorization re-verification; this closure is documentation-only, with normal closure commit/push authorized only after fresh protected Git revalidation and followed by an independent read-only exact-SHA audit before Sol's owner handoff; no runtime, provider, or data write
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_HANDOFF
BLOCKER: NONE
CANONICAL_INTEGRATION_WRITER_STATUS: COMPLETE
SOL_PREFINAL_REVIEW: PASS
LUNA_PREFINAL_AUDIT: PASS
LUNA_FINAL_CONTENT_AUDIT: PASS
LUNA_EXACT_SHA_AUDIT: REQUIRED_AFTER_CLOSURE_COMMIT_PUSH
NEXT_EXACT_ACTION: Earl reviews the Design Gate and explicitly approves, rejects, or amends the proposed Institutional Logistics Ledger direction and bounded `admin.overview` first slice; do not implement or deploy before that decision.

## Task-local delegation ledger

| AGENT_ID                | MODEL     | ROLE                               | MODE  | SCOPE                                                   | WORKTREE_OR_PATCH              | OWNED_PATHS                                                                                                      | EXCLUDED_PATHS                                                    | DEPENDENCIES                                   | STATUS   | OUTPUT / EVIDENCE                                                                                                                        |
| ----------------------- | --------- | ---------------------------------- | ----- | ------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| luna_governance_map     | LUNA MAX  | GOVERNANCE_MAPPING_AND_FINAL_AUDIT | READ  | Active governance mapping and final contradiction audit | Canonical worktree, read-only  | None                                                                                                             | All tracked repository paths                                      | Current-chain lock and combined candidate diff | COMPLETE | Pre-commit final content audit PASS; independent read-only exact-SHA audit follows closure commit/push; no repository or provider writes |
| terra_governance_writer | TERRA MAX | TERRA_INTEGRATION_WRITER           | WRITE | Canonical governance amendment integration              | Canonical task branch/worktree | AGENTS.md; .codex governance/current-chain records; governance validator/tests; required handoff/status evidence | Product/runtime/generated/migration/provider files and Luna scope | Sol task decomposition and Luna findings       | COMPLETE | Post-commit closure-truth repair complete; focused gates PASS; no new child count or product/runtime/provider write                      |
