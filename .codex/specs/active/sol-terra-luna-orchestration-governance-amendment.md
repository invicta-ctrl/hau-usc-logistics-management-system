# Accepted Amendment: Sol/Terra/Luna Orchestration Governance

Accepted: 2026-08-10, Asia/Manila

Authority: Earl's submitted `HAU_USC_Logistics_AGENTS_Sol_Terra_Luna_Orchestration_Governance_Repair_Prompt_2026-08-10.md`

Execution status: complete. Initial governance commit
`4825f02dfa96b9e5e6fe018d1bfd252d7720f47d` is complete, and the bounded
post-commit closure-truth documentation repair is complete. Luna's pre-commit
final content audit PASS occurred before this closure commit; an independent
read-only exact-SHA audit follows normal closure commit/push before Sol's owner
handoff. This repository-governance amendment preserves the completed Design
Gate and does not authorize Design Gate implementation, runtime change, or
provider mutation.

## Decision

- GPT-5.6 Sol is the sole top-level orchestrator and is read-only.
- Sol subagents are forbidden; `MAX_SOL_SUBAGENTS: 0`.
- Terra MAX is the only writer model class. Sol may spawn zero through 16 Terra
  MAX children, with exactly one `TERRA_INTEGRATION_WRITER` owning the canonical
  task branch/worktree.
- Additional Terra writers require isolated, non-overlapping worktrees or bounded
  patch scopes. The canonical Terra Integration Writer owns integration and
  conflict resolution.
- Luna MAX is the read-only mapper, reviewer, and auditor class. Sol may spawn
  zero through 16 Luna MAX children.
- Delegation depth is one. Only Sol may spawn children; Terra and Luna never
  recurse or create a Sol child.
- No silent model substitution is allowed. An unavailable required model route is
  a stop-and-report condition until Earl explicitly amends the task.
- The canonical branch retains one singular writer lock:
  `ACTIVE_WRITER: TERRA_MAX:<task-or-agent-id>` while a Terra Integration Writer
  is active. Sol and Luna never hold the lock.

## Why this amendment supersedes prior routing language

Older product specifications and historical checkpoints used generic `CODEX`,
Codex-only-writer, two-read-only-child, or legacy Terra/Luna routing language.
That language is superseded only for model orchestration, delegation, and
canonical writer ownership. Their accepted product scope, release safeguards,
data/ledger invariants, privacy rules, rollback evidence, and historical facts
remain preserved and authoritative within their original scope.

The active Design DNA research amendment remains the product-scope pointer. Its
`Required model: CODEX` line is historical routing language only; the current
chain's `GOVERNANCE_AMENDMENT` field makes this amendment controlling for
orchestration without changing the Design Gate objective or next owner decision.

## Preserved historical contradictions

The following files are intentionally preserved as accepted product or release
evidence and are not edited merely to make repository-wide searches empty. Their
model-routing statements do not govern a new task after this amendment:

| Preserved file                                                                 | Historical model-routing wording now superseded             | Still-preserved scope                                         |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `.codex/specs/active/v0.8.1-design-dna-research-amendment.md`                  | `Required model: CODEX`                                     | Design research and Earl's implementation gate                |
| `.codex/specs/active/v0.8.1-v5-backend-integration-steer.md`                   | `Required model: CODEX`                                     | V5 backend-integration constraints                            |
| `.codex/specs/active/v0.8.1-v5-owner-visual-feedback-amendment.md`             | `Required model: CODEX`                                     | Owner visual-feedback boundaries                              |
| `.codex/specs/active/isolated-staging-playground-and-git-governance.md`        | `Required model: CODEX`                                     | Exact-candidate, staging, production, and recovery safeguards |
| `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-1.md`            | `The main Codex agent is the only writer.`                  | Schema-30 inventory/ledger acceptance evidence                |
| `.codex/specs/active/v0.7.3-rollout-stabilization.md`                          | `One active writer: CODEX.` and the two-read-only-child cap | v0.7.3 no-op intake and stabilization evidence                |
| `.codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md` | Legacy task-owner model labels                              | Repository-normalization and sandbox evidence                 |

Archived `.codex/archive/**` records are historical evidence as well. They do
not override active governance and are not part of the active contradiction
scan.

## Required implementation records

The decision is implemented by these canonical active records:

- `AGENTS.md` defines the repository-wide role, cap, lock, ledger, isolation, and
  no-substitution policy.
- `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, and
  `.codex/CURRENT_HANDOFF.md` retain `REQUIRED_MODEL: GPT-5.6 SOL` and mirror the
  explicit orchestrator, writer, reader, cap, depth, spawner, and substitution
  fields. They retain the product objective and Design Gate next owner action.
- `.codex/USAGE_POLICY.md`, `.codex/PHASE_AND_CONTEXT_POLICY.md`, and
  `.codex/TASK_ROUTING.md` normalize execution, routing, lock, and ledger rules.
- `.codex/config.toml` uses
  `max_concurrent_threads_per_session = 32`, `max_depth = 1`, and
  `interrupt_message = false`.
- `.codex/agents/log-triage.toml` and `.codex/agents/repo-mapper.toml` are
  `gpt-5.6-luna` / maximum-reasoning / read-only profiles.
- `scripts/check-agent-instructions.mjs` and
  `tests/unit/codex-governance.test.js` reject obsolete active policy language
  and configuration/profile drift.

## Boundaries and verification

This amendment authorizes only governance/documentation changes, focused
governance tests, formatting, and deterministic checks. It does not authorize
frontend or backend implementation, generated artifact changes, migrations,
deployments, D1/R2/Google/provider writes, production mutation, merge, tag,
recovery-pointer rotation, or Design Gate execution.

Initial authorized normal commit/push
`4825f02dfa96b9e5e6fe018d1bfd252d7720f47d` to the existing branch and draft
PR followed the required pre-final Sol review, Luna review/recheck, focused
governance checks, and protected Git authorization revalidation. The completed
post-commit closure-truth repair received Luna's pre-commit final content audit
PASS before this closure commit. An independent read-only exact-SHA audit follows
normal closure commit/push before Sol's owner handoff. This amendment does not
authorize a force-push, merge, deployment, provider/data action, or
recovery-pointer change.

For the initial governance commit, before the Terra writer transferred the
candidate, it inventoried tracked and untracked `AGENTS.md` files, reviewed the
complete logical diff, ran focused governance-unit coverage plus `check:agents`,
`check:continuation`, formatting, and `git diff --check`, and completed a
targeted active-governance contradiction scan. Pre-final Sol review and Luna
review/recheck passed. The completed closure-truth repair reran its focused
checks and received Luna's pre-commit final content audit PASS before this
closure commit. The independent read-only exact-SHA audit follows normal closure
commit/push before Sol's owner handoff. The frozen playground/runtime SHA and
production SHA remain unchanged.

## Next owner gate

After this governance amendment closes, Earl reviews the Design Gate and
explicitly approves, rejects, or amends the proposed Institutional Logistics
Ledger direction and bounded `admin.overview` first slice. No design
implementation or deployment is authorized before that decision.
