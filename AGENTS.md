# Coding Agent Instructions

## Owner-reserved v0.8.4 forward-preparation amendment — 2026-08-21

- **STATUS:** ACCEPTED BY EARL'S CURRENT EXPLICIT INSTRUCTION
- **BRANCH:** `release/v0.8.4-live-operations-performance`
- **PURPOSE:** Prepare v0.8.4 `Live Operations + Performance` without starting product implementation before v0.8.3 closes.
- **PREPARATION_BASE_SHA:** `f8e63372bc8afcb6d092970b7f9fc9ee72fd3580`
- **IMPLEMENTATION_STATUS:** `NOT_STARTED`
- **SCOUT_SOURCE:** `HAU_USC_Logistics_Claude_Code_v084_Read_Only_Scout_Prompt_2026-08-21.md` / owner-supplied equivalent.

### GPT Context Vault bootstrap for this branch

Before project work on this branch, use the account-wide routing chain first and then return to repository authority:

```text
connected Context Vault AGENTS.md
-> START_HERE.md
-> CONTEXT_INDEX.md
-> projects/PROJECT_REGISTRY.md
-> projects/HAU_USC_LOGISTICS.md when needed
-> this repository AGENTS.md
-> .codex/CURRENT.md
-> .codex/CURRENT_TASK.md
-> .codex/CURRENT_HANDOFF.md
-> .codex/PHASE_AND_CONTEXT_POLICY.md
-> accepted specification named by the pointer
```

Use the minimum sufficient context. The Context Vault is the account-wide routing and governance layer; this repository remains authoritative for code, migrations, tests, release state, provider state, implementation status, and the exact v0.8.4 baseline. Stop on a material contradiction instead of blending incompatible instructions.

Authority order for this branch is:

```text
Earl current explicit instruction
> accepted v0.8.4 specification/amendments once adopted
> authoritative repository + current pointer + verified state
> active Context Vault governance
> relevant memory/recent context
> historical material only when required
```

### v0.8.4 branch reservation and v0.8.3 closure exclusion

This branch is explicitly owner-reserved before v0.8.3 S17 so v0.8.4 can begin in a fresh session without reconstructing its Git home.

- v0.8.3 release hygiene **MUST NOT delete, prune, retarget, repurpose, or clean this branch**. The accepted v0.8.3 closure cleanup is limited to temporary **v0.8.3** branches/worktrees after unique-work proof.
- This branch may be deleted only after the accepted v0.8.4 release closes, or after Earl explicitly closes it and unique-work preservation is proven.
- Do not force-push, reset, or rebase away unknown/unique work on this branch.
- Do not start v0.8.4 product implementation while v0.8.3 still owns the canonical writer lock. The first implementation session must rehydrate after v0.8.3 S17 with `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`, and `HANDOFF_STATUS: READY_FOR_HANDOFF`.
- `STALE_IF`: the final accepted v0.8.3 closing SHA/tree differs from `PREPARATION_BASE_SHA`. Before v0.8.4 implementation, reconcile this branch to the final v0.8.3 closing lineage through a non-destructive, reviewed Git path and record the new baseline.
- The v0.8.4 scout/readiness material is **candidate planning only** until refreshed against the final v0.8.3 closing SHA and adopted through the normal specification gate.
- This preparation must not mutate the active v0.8.3 worktree, v0.8.3 current chain, Production, Playground provider state, D1, R2, Google resources, secrets, migrations, or deployments.

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

## Accepted mainline governance amendment — 2026-08-10

This `AGENTS.md` section is the durable accepted governance amendment at the
first step of the canonical continuity chain, so its authority is reconstructable
before a current pointer is read.

- **STATUS:** ACCEPTED
- **OWNER:** Earl
- **DIRECTIVE:** `QUICK Mainline AGENTS Governance Sync + Fast Document-Fix Mode`
- **AUTHORIZED_SCOPE:** Root Sol/Terra/Luna sync, Quick Document Fix Mode,
  directly coupled enforcement, and branch/commit/PR/merge to `main`.
- **EXCLUDED_SCOPE:** Runtime, deploy, provider, database, migration,
  production-data, recovery, frontend, and release behavior.
- **LINEAGE:** Main-governance lineage is distinct from deployed Production
  runtime.
- **LEGACY_CURRENT_TASK_METADATA:** Legacy current/task `REQUIRED_MODEL: CODEX`
  remains superseded and non-authoritative for model routing and does not require
  a current-chain rewrite for this explicitly accepted bootstrap.

## Orchestration, writer lock, and delegation

This repository has one canonical model architecture. It applies to every active
task and cannot be changed by a nested instruction, historical specification, or
ad hoc delegation. On `main`, legacy `REQUIRED_MODEL: CODEX` metadata in the
current records is explicitly superseded and non-authoritative for model routing.
A separately accepted current-chain task is required before normalizing those
records.

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

The repository uses environment-independent Git history. Staging/playground and
production are deployment environments, never permanent Git branches.

### Permanent retained branches

The only permanent retained branch pointers are:

- `main` — current accepted production lineage.
- `backup/last-known-good` — immediately previous verified production state.
- `regression/r1` — next older retained verified production state.
- `regression/r2` — next older retained verified production state.
- `regression/r3` — oldest retained recovery pointer.

Do not create or retain permanent `staging`, `playground`, `production`, `prod`,
`develop`, `dev`, `working`, or `next` branches.

Immutable tags/releases and verified recovery artifacts preserve history beyond
these five movable pointers.

### Temporary implementation branch

At most one production-bound implementation branch may be active unless Earl
explicitly authorizes otherwise.

Use one of:

- `release/vX.Y.Z-<slug>` for planned releases/features;
- `fix/vX.Y.Z-<slug>` for bounded fixes;
- `hotfix/vX.Y.Z-<slug>` only for a true urgent production patch.

The temporary branch is the active writer branch. It is deleted after accepted
production release or explicit closure.

### Mandatory release path after v0.8.0

Every production-bound version, feature, update, fix, patch, or hotfix after
`v0.8.0` follows:

`temporary branch -> focused verification -> frozen exact candidate -> Isolated Staging Playground -> automated acceptance -> Earl manual testing -> Earl explicit production GO -> protected accepted main lineage -> production -> smoke/reconciliation -> rotate recovery pointers -> delete temporary branch`

No normal direct-to-production path exists after `v0.8.0`.

A green CI run or successful playground deployment is not production approval.

Production promotion requires Earl's explicit GO for the exact tested candidate.

If code changes after Earl tests a candidate, that approval is invalid. Freeze
and deploy a new candidate and obtain new approval.

### Candidate identity

Record the exact candidate commit/tree and deterministic application artifact
identity used in the playground.

Protected merge mechanics may create a different commit SHA on `main`; if so,
prove that the accepted `main` tree/application artifact is identical to the
exact playground-tested candidate before production.

Never silently rebuild different source for production.

### Recovery pointer rotation

Move recovery pointers only after the new production release passes required
production smoke, reconciliation, and rollback-readiness checks.

After successful production acceptance:

- previous `regression/r2` -> `regression/r3`
- previous `regression/r1` -> `regression/r2`
- previous `backup/last-known-good` -> `regression/r1`
- previous accepted `main` -> `backup/last-known-good`
- new accepted release remains `main`

Never rotate pointers merely because a PR merged.

### Environment rule

The Isolated Staging Playground and Production must use distinct provider
bindings. Never solve environment parity by pointing playground code at
production D1, R2, secrets, queues, or mutable production resources.

Production data may flow one way into an isolated playground baseline under the
accepted refresh runbook. Playground data never synchronizes back into
production.

## Quick Document Fix Mode

Quick Document Fix Mode is available only when all requested changes are a
small, clearly bounded documentation or instruction correction with no runtime,
generated-artifact, dependency, schema, data, provider, database, Google,
recovery, credential, or other external-state mutation, except the explicitly
authorized Git branch/commit/push/PR/merge path. It never waives the accepted
scope, safety, or active-writer requirements.

### Eligibility

- The owner request identifies the exact document or governance-instruction
  correction and does not require a behavior, release, deployment, migration, or
  provider change.
- This mode explicitly excludes Git-history rewrites, deletion of unknown work,
  executable security, authentication, or authorization changes, broad
  architecture decisions, and runtime, generated-artifact, dependency, schema,
  data, migration, provider, database, Google, recovery, credential, or other
  external-state effects outside the explicitly authorized Git path.
- Targeted reads can establish the authoritative wording and a focused
  documentation-governance check can verify the result.
- The Git handshake is clean and no conflicting active writer, scope conflict,
  or current-chain transfer is present.

### Fast workflow (10 steps)

1. Sol reads the exact target and direct authority for the requested correction.
2. Sol defines the minimal diff, including the owned and excluded paths.
3. Sol assigns ONE Terra MAX writer. Default staffing is one Terra Integration
   Writer, zero Luna reviewers, and zero Sol children.
4. Terra edits only the required documents and directly coupled
   documentation-governance validator or test assertions.
5. Terra runs focused documentation-governance validation for the changed paths.
6. Sol reviews the complete diff once.
7. Terra repairs only material defects found in that one review; do not start a
   repeated audit loop.
8. Terra commits exactly once when the accepted task authorizes the commit.
9. Terra pushes and merges only through the smallest permitted repository path
   when the accepted task authorizes that path.
10. When the requested document is present, focused validation passes, the
    complete diff has been reviewed, and the required push/merge is complete,
    STOP.

### Limited Luna triggers

The default is zero Luna reviewers. Sol may add a bounded Luna review only when
a material policy contradiction, security or privacy ambiguity, or focused
verification failure cannot be resolved by deterministic first-party reads; Earl
explicitly requests an independent audit; or a genuinely large diff where one
independent read materially reduces risk.

### Verification, continuity, and stop condition

Run proportional documentation-only verification: focused formatting, `git diff
--check`, and the directly coupled unit or governance check. Ordinary
Markdown/document-only work does not voluntarily run full browser/e2e suites,
application builds, database, migration, provider, or deployment tests, CodeQL,
or broad matrices. If branch protection requires checks, wait only for the
required merge checks and do not add manual CI rounds. Do not repeat audit loops
after the focused review passes; reopen only for a materially new fact, a failed
check, or an owner amendment.

Use minimal continuity updates. Add one concise factual entry only when the
document is part of the current chain, active governance or the exact next action
changes, or the repository requires a specific record. Otherwise do not rewrite
status, changelog, or current records. For this bootstrap sync, do not add
continuity files.

Stop Quick Document Fix Mode immediately if the change needs runtime behavior,
generated output, a migration, external mutation outside the explicitly
authorized Git path, a broader accepted
specification, a current-chain rewrite, an unresolved policy conflict, or any
other work outside the declared documentation-only scope. Return to the normal
governed workflow and report the exact blocker.

### Success stop condition

The requested document must be present, focused validation must pass, the
complete diff must be reviewed, and the required push/merge must be complete.
Then STOP.

## Required Git handshake

Before edits, record repository root, branch, HEAD, upstream, and git status --short. Fetch and compare an upstream only when network access is authorized. A missing upstream, divergence, wrong branch, or unexpected dirty work is a stop condition unless the current task explicitly marks a local no-push branch as sanctioned. Never reset, clean, force-push, discard, or overwrite unknown work.

## Safety and verification

- Keep credentials, private configuration, provider identifiers, recipient addresses, roster data, recovery material, and personal data out of Git, logs, and handoffs.
- Preserve migrations, immutable ledger/audit/history/evidence records, backups, rollback material, release tags, and the approved legacy visual baseline.
- Production promotion, provider writes, database mutation, migration application, access seeding, Drive/Sheet changes, and PR/branch cleanup require the exact authorization and runbook named by the accepted task.
- Run focused checks for changed code. Documentation-only work uses the relevant governance and continuity checks; do not claim runtime verification that did not run.
- Before a normal governed handoff, review the logical diff and update the required PROJECT_STATUS.md, CHANGELOG.md, docs/WORK_CONTINUATION.md, and current-chain records with verified facts; then report unrun checks and external-state uncertainty honestly. Quick Document Fix Mode instead follows its explicit minimal-continuity rule.