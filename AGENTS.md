# Coding Agent Instructions

The Git repository is the durable shared source of truth. Chat history, account memory, local summaries, and local folders are supporting context only; they must never be required to reconstruct active project state.

## Canonical continuity chain

Every task starts from the smallest authoritative chain:

Git state -> AGENTS.md -> .codex/CURRENT.md -> .codex/CURRENT_TASK.md -> .codex/CURRENT_HANDOFF.md -> .codex/PHASE_AND_CONTEXT_POLICY.md -> accepted specification

1. Read this file, then the three current records in order.
2. Read the phase/context policy and only the accepted specification named by the pointer.
3. Perform the Git handshake required by the current task.
4. Read additional source, tests, status, or historical evidence only when the active task needs it.

.codex/CURRENT.md is the active pointer. .codex/CURRENT_TASK.md bounds the work. .codex/CURRENT_HANDOFF.md records the latest transferable execution state. docs/WORK_CONTINUATION.md is the compact operator resume record, not a competing pointer.

## Task routing and specification gate

- Review the available skill registry and use the smallest applicable workflow. Record chosen skills in .codex/CURRENT_TASK.md.
- Route work with .codex/TASK_ROUTING.md; short owner requests also follow .codex/CAVEMAN_WORKFLOW.md.
- Follow .codex/USAGE_POLICY.md, including targeted reads, deterministic commands, and capped output for large commands.
- Non-trivial behavior, architecture, migration, deployment, destructive maintenance, or external action requires an accepted specification or amendment. Implement only that scope.
- Stop and record a material conflict, missing acceptance criterion, privacy/security uncertainty, migration need, unknown dirty work, or production crossover. Do not invent a resolution.

## Orchestration, writer lock, and delegation

This repository has one canonical model architecture. It applies to every active
task and cannot be changed by a nested instruction, historical specification, or
ad hoc delegation. The current task retains `REQUIRED_MODEL: GPT-5.6 SOL` to
identify the required top-level orchestrator; it never grants Sol write authority.

```text
ORCHESTRATOR_MODEL: GPT-5.6 Sol
ORCHESTRATOR_WRITES: FORBIDDEN
SOL_SUBAGENTS: FORBIDDEN
MAX_SOL_SUBAGENTS: 0

WRITER_MODEL: Terra MAX
MAX_TERRA_SUBAGENTS: 16
CANONICAL_BRANCH_WRITER_COUNT: 1
CANONICAL_ACTIVE_WRITER: one Terra Integration Writer
PARALLEL_TERRA: isolated non-overlapping worktrees or patch scopes only

READER_MODEL: Luna MAX
LUNA_WRITES: FORBIDDEN
MAX_LUNA_SUBAGENTS: 16

DELEGATION_DEPTH: 1
SUBAGENT_SPAWNER: Sol only
MODEL_SUBSTITUTION: forbidden unless Earl explicitly amends the task
```

### Sol: sole read-only orchestrator

- GPT-5.6 Sol is the only top-level planner, router, reviewer, and acceptance
  authority. Sol may read evidence, normalize scope, maintain the delegation
  ledger, spawn bounded Terra MAX and Luna MAX children, and produce the final
  owner-facing handoff.
- Sol never edits a repository file, creates a patch, stages, commits, pushes,
  merges, rebases, resets, cleans, deploys, migrates, mutates a provider, or
  rotates recovery pointers.
- Sol child agents are forbidden. No agent may create a Sol child or ask another
  agent to do so. Every child-task creation remains with Sol and has depth one.

### Terra MAX: writer class

- Terra MAX is the only model class permitted to mutate repository or provider
  state when the accepted task authorizes that mutation. Sol may use zero through
  sixteen Terra MAX children, never more than the task requires.
- Each repository task with writes has exactly one `TERRA_INTEGRATION_WRITER`.
  That Terra is the only writer on the canonical task branch/worktree, recorded
  as `ACTIVE_WRITER: TERRA_MAX:<task-or-agent-id>`.
- Additional Terra writers require exclusive, non-overlapping paths and isolated
  worktrees or bounded patch artifacts. They never share a canonical registry,
  current pointer, release file, migration, generated manifest, lockfile, or
  external resource with another active Terra. The Terra Integration Writer owns
  canonical integration and conflict resolution after Sol review.
- Terra does not spawn agents, invoke Sol as a child, broaden scope, or claim
  acceptance without evidence.

### Luna MAX: read-only reviewer class

- Luna MAX is the read-only mapper, reviewer, and auditor class. Sol may use zero
  through sixteen Luna MAX children for bounded mapping, review, security/privacy
  audit, test-gap analysis, or final contradiction audit.
- Luna never edits tracked repository state, writes patches, takes the writer
  lock, stages, commits, pushes, merges, deploys, migrates, mutates providers, or
  spawns agents. Luna reports findings to Sol; Terra performs any authorized repair.

### Canonical lock and task ledger

- The singular `ACTIVE_WRITER` lock protects the canonical branch. A conflicting
  active writer is a stop condition. Read-only work must not race the writer.
- The current task/handoff records every delegated Terra or Luna with agent ID,
  model, role, mode, scope, worktree or patch, owned and excluded paths,
  dependencies, status, and output evidence. No ledger row may name Sol as a child.
- No silent model substitution is permitted. Stop and report an unavailable or
  mismatched Sol, Terra MAX, or Luna MAX route.
- Before handoff, update the three current records together. Release the lock
  only when the pointer says `ACTIVE_WRITER: NONE` and
  `HANDOFF_STATUS: READY_FOR_HANDOFF`.

## Permanent Git branch and playground release policy

The repository uses environment-independent Git history. Staging/playground and production are deployment environments, never permanent Git branches.

### Permanent retained branches

The only permanent retained branch pointers are:

- `main` — current accepted production lineage.
- `backup/last-known-good` — immediately previous verified production state.
- `regression/r1` — next older retained verified production state.
- `regression/r2` — next older retained verified production state.
- `regression/r3` — oldest retained recovery pointer.

Do not create or retain permanent `staging`, `playground`, `production`, `prod`, `develop`, `dev`, `working`, or `next` branches.

Immutable tags/releases and verified recovery artifacts preserve history beyond these five movable pointers.

### Temporary implementation branch

At most one production-bound implementation branch may be active unless Earl explicitly authorizes otherwise.

Use one of:

- `release/vX.Y.Z-<slug>` for planned releases/features;
- `fix/vX.Y.Z-<slug>` for bounded fixes;
- `hotfix/vX.Y.Z-<slug>` only for a true urgent production patch.

The temporary branch is the active writer branch. It is deleted after accepted production release or explicit closure.

### Mandatory release path after v0.8.0

Every production-bound version, feature, update, fix, patch, or hotfix after `v0.8.0` follows:

`temporary branch -> focused verification -> frozen exact candidate -> Isolated Staging Playground -> automated acceptance -> Earl manual testing -> Earl explicit production GO -> protected accepted main lineage -> production -> smoke/reconciliation -> rotate recovery pointers -> delete temporary branch`

No normal direct-to-production path exists after `v0.8.0`.

A green CI run or successful playground deployment is not production approval.

Production promotion requires Earl's explicit GO for the exact tested candidate.

If code changes after Earl tests a candidate, that approval is invalid. Freeze and deploy a new candidate and obtain new approval.

### Candidate identity

Record the exact candidate commit/tree and deterministic application artifact identity used in the playground.

Protected merge mechanics may create a different commit SHA on `main`; if so, prove that the accepted `main` tree/application artifact is identical to the exact playground-tested candidate before production.

Never silently rebuild different source for production.

### Recovery pointer rotation

Move recovery pointers only after the new production release passes required production smoke, reconciliation, and rollback-readiness checks.

After successful production acceptance:

- previous `regression/r2` -> `regression/r3`
- previous `regression/r1` -> `regression/r2`
- previous `backup/last-known-good` -> `regression/r1`
- previous accepted `main` -> `backup/last-known-good`
- new accepted release remains `main`

Never rotate pointers merely because a PR merged.

### Environment rule

The Isolated Staging Playground and Production must use distinct provider bindings. Never solve environment parity by pointing playground code at production D1, R2, secrets, queues, or mutable production resources.

Production data may flow one way into an isolated playground baseline under the accepted refresh runbook. Playground data never synchronizes back into production.

## Required Git handshake

Before edits, record repository root, branch, HEAD, upstream, and git status --short. Fetch and compare an upstream only when network access is authorized. A missing upstream, divergence, wrong branch, or unexpected dirty work is a stop condition unless the current task explicitly marks a local no-push branch as sanctioned. Never reset, clean, force-push, discard, or overwrite unknown work.

## Safety and verification

- Keep credentials, private configuration, provider identifiers, recipient addresses, roster data, recovery material, and personal data out of Git, logs, and handoffs.
- Preserve migrations, immutable ledger/audit/history/evidence records, backups, rollback material, release tags, and the approved legacy visual baseline.
- Production promotion, provider writes, database mutation, migration application, access seeding, Drive/Sheet changes, and PR/branch cleanup require the exact authorization and runbook named by the accepted task.
- Run focused checks for changed code. Documentation-only work uses the relevant governance and continuity checks; do not claim runtime verification that did not run.
- Before a handoff, review the logical diff; update PROJECT_STATUS.md, CHANGELOG.md, docs/WORK_CONTINUATION.md, and the current chain with verified facts; then report unrun checks and external-state uncertainty honestly.
