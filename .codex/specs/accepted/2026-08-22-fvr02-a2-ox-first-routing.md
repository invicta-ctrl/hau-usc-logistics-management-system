# FVR-02-A2 — Ox-First Read-Only Audit/Review Routing

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-22
SLUG: fvr02-a2-ox-first-routing
PARENT: FVR-02 (2026-08-22-fvr02-full-frontend-recovery-media-motion-index.md)
SUPERSEDES: FVR-02-A1 default DeepSeek #2-#16 read-only review routing (DeepSeek-exhaustion Ox writer failover remains valid)
BRANCH: frontend-design-integration
ORCHESTRATOR: GPT-5.6 Sol Max (read-only)
CANONICAL_WRITER: DeepSeek V4 Pro #1
OX_MODEL: openrouter/stealth/ox-alpha
DEEPSEEK_MODEL: deepseek/deepseek-v4-pro

## Intent

MODEL_ROUTING_OPTIMIZATION within the running FVR-02, rebalancing routine read-only audit/review/scout workload from paid DeepSeek V4 Pro toward effectively free Ox Alpha while preserving or improving verification quality. Secondary intents: token efficiency, cost efficiency, multi-agent orchestration, and FVR continuity.

## Authority

Earl's explicit current instruction -> accepted FVR-02 spec -> this amendment -> branch-local AGENTS.md appendix -> `.agents/PROJECT_POLICY.md` (for non-model governance that remains in force). This changes model routing only; it does not create product implementation authority.

## In scope

- Ox Alpha becomes the default read-only subagent for all safe review/scout/audit domains.
- DeepSeek V4 Pro #1 remains the single canonical frontend writer.
- Additional DeepSeek children are exceptional heavy-analysis lanes only, each requiring a one-sentence `WHY_DEEPSEEK_NOT_OX`.
- Ox children use `fork_turns = none` or the narrowest permitted capsule; normal report cap 250-400 words, at most 5 material findings, or `VERDICT: CLEAN`.
- Explicit model override `openrouter/stealth/ox-alpha` through native Multi-Agent V2 spawn; a generic read-only worker/reviewer role may carry the override when no `ox_alpha` named role exists.
- Utilization receipt at meaningful checkpoints (no fabricated savings/tokens).

## Out of scope

- No change to the actual runtime concurrency ceiling; this rebalances routing within the existing ceiling.
- No writer-lock transfer by this amendment alone. Ox writer failover remains only under separately accepted FVR-02-A1 DeepSeek-exhaustion authority.
- No change to canonical writer identity, acceptance authority, tests, evidence requirements, security/privacy boundaries, data invariants, deployment gates, or Git preservation rules.
- No product, backend/API/auth/data/schema/migration/provider, Figma, Playground, or Production change.
- No silent model substitution. If the explicit Ox override fails, preserve the exact error and classify Ox unavailable; agent-role discovery failure is not model unavailability.

## Invariants

- One canonical writer at a time: DeepSeek V4 Pro #1, lock `ACTIVE_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2`.
- Sol Max is the sole top-level orchestrator/final reviewer; Sol writes are forbidden; only Sol spawns; delegation depth one; no recursion.
- Every read-only DeepSeek spawn carries `WHY_DEEPSEEK_NOT_OX`; no good answer -> route to Ox.
- Do not audit the audit: no duplicate subagents for unchanged source/diff/authority/test/external state.
- Subagent output is evidence/proposal, never final acceptance.

## Acceptance and verification

- Branch-local AGENTS.md appendix reflects Ox-first routing with `openrouter/stealth/ox-alpha`, reserved DeepSeek capacity, `fork_turns = none` Ox capsules, one writer, unchanged concurrency ceiling, and exhaustion-only Ox writer failover.
- Reverify `openrouter/stealth/ox-alpha` exists in the live router model catalog and Multi-Agent V2 model overrides are enabled (read-only).
- `scripts/check-agent-instructions.mjs` passes; `git diff --check` passes.
- No `WHY_DEEPSEEK_NOT_OX`-less read-only DeepSeek lane is dispatched.

## Rollback and stop conditions

- Rollback: revert the branch-local AGENTS.md appendix edit and remove this amendment (Git revert); no external state to roll back.
- Stop: conflicting writer; unknown dirty work; authority contradiction; explicit Ox override fails with a preserved error (classify Ox unavailable, do not substitute); security/privacy ambiguity; any scope expansion beyond model routing.

## Continuity

This amendment rebalances routing only. It does not restart, discard, or close FVR-02. Continue the same accepted FVR-02 work; at the next checkpoint print the model-utilization receipt.
