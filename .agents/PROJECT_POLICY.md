---
schema_version: 1
status: active
scope: hau-usc-logistics-project-extension
extension_id: HAU-USC-LOGISTICS-PROJECT-POLICY-V1
target_repository: invicta-ctrl/hau-usc-logistics-management-system
universal_governance: ..\AGENTS.md
last_reviewed: 2026-08-21
---

# HAU-USC Logistics Project Policy Extension

Read the byte-identical universal root `AGENTS.md` first. This extension preserves HAU-USC Logistics-specific continuity, orchestration, release, data, privacy, and verification rules.

The Git repository is the durable shared technical source of truth. Chat history, account memory, local summaries, project attachments, and local folders are supporting context only.

## Canonical continuity chain

Every task starts from the smallest authoritative chain:

```text
Git state
-> universal AGENTS.md
-> .agents/PROJECT_POLICY.md
-> .codex/CURRENT.md
-> .codex/CURRENT_TASK.md
-> .codex/CURRENT_HANDOFF.md
-> .codex/PHASE_AND_CONTEXT_POLICY.md
-> accepted specification named by the pointer
```

1. Read the root universal policy and this extension.
2. Read the three current records in order.
3. Read the phase/context policy and only the accepted specification named by the pointer.
4. Perform the required Git handshake.
5. Expand into source, tests, status, or historical evidence only when the active task needs it.

If `.agents/WORKTREE_POLICY_APPENDIX.md` exists, read it immediately after this
extension. It may preserve narrower worktree-specific authority, is subordinate to the
universal policy and this extension, and must not redefine account-wide efficiency
defaults. Its absence is normal.

`.codex/CURRENT.md` is the active pointer. `.codex/CURRENT_TASK.md` bounds the work. `.codex/CURRENT_HANDOFF.md` records transferable execution state. `docs/WORK_CONTINUATION.md` is a compact operator resume record and never a competing pointer.

## Task routing and specification gate

- Route work with `.codex/TASK_ROUTING.md`; short owner requests also follow `.codex/CAVEMAN_WORKFLOW.md`.
- Follow `.codex/USAGE_POLICY.md`, including targeted reads, deterministic commands, bounded output, and reusable unchanged evidence.
- Record selected skills and delegated work when the current task requires a ledger.
- Non-trivial behavior, architecture, migration, deployment, destructive maintenance, provider mutation, or external action requires an accepted specification or amendment.
- Stop on a material conflict, missing acceptance criterion, privacy/security uncertainty, migration need, unknown dirty work, active writer conflict, or Production crossover.

## Accepted mainline governance amendment — 2026-08-10

This section preserves the accepted `QUICK Mainline AGENTS Governance Sync + Fast Document-Fix Mode` amendment.

```text
STATUS: ACCEPTED
OWNER: Earl
AUTHORIZED_SCOPE:
  root Sol/Terra/Luna sync;
  Quick Document Fix Mode;
  directly coupled documentation-governance enforcement;
  accepted branch/commit/PR/merge path.
EXCLUDED_SCOPE:
  runtime;
  deployment;
  provider;
  database;
  migration;
  Production data;
  recovery;
  frontend;
  release behavior.
LINEAGE:
  main-governance lineage is distinct from deployed Production runtime.
```

Legacy `REQUIRED_MODEL: CODEX` metadata in older current records remains superseded and non-authoritative for model routing where this accepted amendment applies. A separately accepted task is required before normalizing historical current-chain records.

## TOKEN-OPT precedence and HAU model roles

TOKEN-OPT-001 is the sole account-wide token/context-efficiency authority. This
extension keeps HAU's stricter role separation and safety gates without enabling routine
agent pools or review cycles. An exact accepted high-risk operation may require a more
specific route; absent that authority, these defaults apply:

```text
ORCHESTRATOR_MODEL: GPT-5.6 Sol
ORCHESTRATOR_WRITES: FORBIDDEN
SOL_SUBAGENTS: FORBIDDEN
MAX_SOL_SUBAGENTS: 0

DEFAULT_CHILDREN: 0
MAX_ACTIVE_CHILDREN: 1
DELEGATION_DEPTH: 1
SUBAGENT_SPAWNER: Sol only

WRITER_MODEL_CLASS: gpt-5.6-terra
CANONICAL_BRANCH_WRITER_COUNT: 1
CANONICAL_ACTIVE_WRITER: one Terra Integration Writer when a child writer is required

READER_MODEL_CLASS: gpt-5.6-luna
LUNA_WRITES: FORBIDDEN

ORDINARY_REASONING: high or lower
ROUTINE_INDEPENDENT_REVIEW: false
ROUTINE_FULL_SUITE_AFTER_SMALL_MODULE: false
MODEL_SUBSTITUTION: forbidden unless Earl explicitly amends the task
STOP_WHEN_GREEN: true
```

### Sol

- Sol is the sole top-level read-only planner, router, reviewer, and acceptance authority.
- Sol may read evidence, normalize scope, maintain the delegation ledger, spawn at
  most one bounded Terra or Luna child when TOKEN-OPT-001's delegation gate passes,
  and produce the owner-facing handoff.
- Sol never edits repository files, creates patches, stages, commits, pushes, merges, rebases, resets, cleans, deploys, migrates, mutates providers, or rotates recovery pointers.
- No agent may create a Sol child. Child creation remains with the top-level Sol at depth one.

### Terra writer

- The Terra model class is the only child role permitted to mutate repository or
  provider state when accepted scope authorizes the mutation. Ordinary reasoning is
  High or lower; MAX is reserved for an exact risk-gated exception.
- Each write task has exactly one `TERRA_INTEGRATION_WRITER`.
- The integration writer is the only writer on the canonical task branch/worktree and is recorded as `ACTIVE_WRITER: TERRA_MAX:<task-or-agent-id>`.
- Additional Terra writers are not a routine option. A specifically accepted high-risk
  operation may authorize a sequential or otherwise explicitly bounded exception with
  isolated paths, but the account-wide one-active-child default remains controlling
  unless that exact accepted authority says otherwise.
- Writers never share a current pointer, canonical registry, migration, release file,
  generated manifest, lockfile, or external resource.
- The integration writer owns canonical integration and conflict resolution after Sol review.
- Terra does not spawn agents, broaden scope, invoke Sol as a child, or claim acceptance without evidence.

### Luna reviewer

- Luna is read-only and may map, audit, review, perform security/privacy analysis,
  inspect test gaps, or run final contradiction review only when the conditional review
  gate is met. Routine work uses zero Luna children. Ordinary reasoning is High or
  lower; MAX requires an exact risk-gated exception.
- Luna never edits tracked state, writes a patch, takes the writer lock, stages, commits, pushes, merges, deploys, migrates, mutates providers, or spawns agents.
- Luna reports findings to Sol; an authorized Terra performs any repair.

## Canonical writer lock and delegation ledger

- `ACTIVE_WRITER` is a hard lock. A conflicting active writer is a stop condition.
- Read-only work must not race mutable state owned by the writer.
- The current task/handoff records each delegated Terra or Luna with agent ID, model,
  reasoning, role, scope, mode, worktree or patch, owned paths, excluded paths,
  dependencies, status, and output evidence.
- No row may name Sol as a child.
- No silent model substitution is permitted.
- Before a normal handoff, update the three current records together.
- Release the lock only when the pointer records `ACTIVE_WRITER: NONE` and `HANDOFF_STATUS: READY_FOR_HANDOFF`.

## Permanent Git and recovery policy

Staging/Playground and Production are environments, not permanent Git branches.

The permanent retained recovery pointers are:

```text
main
backup/last-known-good
regression/r1
regression/r2
regression/r3
```

Do not create or retain permanent `staging`, `playground`, `production`, `prod`, `develop`, `dev`, `working`, or `next` branches.

Immutable tags, releases, verified bundles, exports, checksums, and recovery artifacts preserve deeper history.

At most one Production-bound implementation branch may be active unless Earl explicitly authorizes otherwise:

```text
release/vX.Y.Z-<slug>
fix/vX.Y.Z-<slug>
hotfix/vX.Y.Z-<slug>   # true urgent Production patch only
```

The temporary branch is deleted only after accepted release or explicit closure and proof that no unique work remains.

## Mandatory release path after v0.8.0

Every Production-bound version, feature, update, fix, patch, or hotfix after `v0.8.0` follows:

```text
temporary branch
-> focused verification
-> frozen exact candidate
-> Isolated Staging Playground
-> automated acceptance
-> Earl manual testing
-> Earl explicit Production GO
-> protected accepted main lineage
-> Production
-> smoke and reconciliation
-> rollback-readiness proof
-> recovery-pointer rotation
-> temporary-branch closure
```

A green CI run or successful Playground deployment is not Production approval. Production promotion requires Earl's explicit GO for the exact tested candidate.

Any source or artifact change after Earl tests a candidate invalidates approval. Freeze and test a new candidate.

## Candidate identity

Record the exact candidate commit, tree, lockfile/toolchain where relevant, application artifact identity, Worker identity, schema/migration state, environment, and Playground baseline.

Protected merge mechanics may create a different commit SHA on `main`. When that occurs, prove tree/application-artifact identity with the exact Playground-tested candidate before Production.

Never silently rebuild different source for Production.

## Recovery-pointer rotation

Move recovery pointers only after the new Production release passes required smoke, reconciliation, and rollback-readiness checks.

After successful acceptance:

```text
previous regression/r2             -> regression/r3
previous regression/r1             -> regression/r2
previous backup/last-known-good     -> regression/r1
previous accepted main              -> backup/last-known-good
new accepted release remains        -> main
```

Never rotate merely because a pull request merged.

## Environment and data-isolation rules

The Isolated Staging Playground and Production must use distinct mutable provider resources, including D1, R2, secrets, queues, recipient controls, and environment bindings.

Never solve parity by pointing Playground code at Production D1, R2, secrets, queues, or other mutable Production resources.

Production-derived baseline data may flow one way into an isolated Playground only under the accepted refresh runbook. Data must be minimized, transformed or synthetic where required, time-bounded, and verified. Playground data never synchronizes back into Production.

## Protected domain invariants

- D1 is authoritative for structured operational data.
- R2 is authoritative for governed files, photos, receipts, evidence, exports, and backup objects.
- Google Sheets and Drive are secondary projections, mirrors, controlled imports, reports, or recovery aids where accepted.
- Inventory quantity is derived from an append-only ledger.
- Reservations affect availability, not physical on-hand quantity.
- Request submission does not deduct physical stock.
- Receiving, release, handoff, return, transfer, reversal, and adjustment create explicit authorized movements.
- Posted ledger, audit, custody, identity, approval, status, migration, and evidence history is not silently overwritten or deleted.
- Public and request-only portals receive purpose-limited data.
- UI hiding is never authorization.
- Unknown records remain unresolved or quarantined; do not fabricate balances, identities, dates, roles, provenance, or provider state.

## Quick Document Fix Mode

Quick Document Fix Mode is available only for a small, clearly bounded documentation or instruction correction with no runtime, generated-artifact, dependency, schema, data, provider, database, Google, recovery, credential, security-boundary, or other external-state mutation except an explicitly authorized Git branch/commit/push/PR/merge path.

### Eligibility

- The owner identifies the exact documentation or governance correction.
- No executable behavior, release, deployment, migration, provider, recovery, credential, or broad architecture change is required.
- No unknown dirty work, active-writer conflict, or current-chain transfer is present.
- Targeted reads can establish authoritative wording.
- Focused documentation-governance validation can prove the result.

This mode excludes history rewrites, deletion of unknown work, executable auth/security/authorization changes, broad architecture, and external state outside the exact accepted Git path.

### Fast workflow

1. Sol reads the exact target and direct authority.
2. Sol defines the minimal diff, owned paths, and exclusions.
3. Sol assigns one Terra Integration Writer. Default staffing is one Terra, zero Luna, zero Sol children.
4. Terra edits only required documents and directly coupled governance validation.
5. Terra runs focused documentation checks.
6. Sol reviews the complete diff once.
7. Terra repairs only material defects from that review; do not start a repeated audit loop.
8. Terra commits exactly once when accepted scope authorizes a commit.
9. Terra pushes and merges only through the smallest permitted repository path when authorized.
10. When the document is present, focused checks pass, the complete diff is reviewed, and the required Git action is complete, stop.

### Limited Luna trigger

Use a bounded Luna review only for a material policy contradiction, security/privacy ambiguity, unresolved focused verification failure, Earl's explicit independent-audit request, or a genuinely large diff where one independent read materially reduces risk.

### Verification

Use proportional documentation verification:

```text
format/link checks
git diff --check
directly coupled governance test
required branch-protection checks
```

Do not voluntarily run browser/E2E, application builds, database, migration, provider, deployment, CodeQL, or broad matrices for ordinary Markdown-only changes.

Do not repeat a passed audit loop unless a materially new fact, failed check, or owner amendment appears.

Use minimal continuity updates. Update current-chain files only when the exact active task, pointer, lock, or next action changes or the repository requires it.

Stop Quick Document Fix Mode if the work expands into runtime behavior, generated output, migration, external state, broader specification, current-chain rewrite, unresolved conflict, or any undeclared scope.

## HAUSC Cloudflare Access

Private `*.hausc.org` resources may be protected by Cloudflare Access.

For authorized non-interactive HAUSC HTTP access, use the local helper only after verifying it exists:

```text
D:\Documents\Codex\.codex\bin\hausc-access.ps1
```

Do not attempt an interactive Cloudflare login when the approved service-token helper is appropriate.

Never print, expose, copy, log, commit, or include HAUSC Cloudflare credentials in prompts, reports, diffs, repository files, screenshots, or command output.

For browser automation, load only the approved credential into process memory and apply required headers without logging or dumping them. Never create a helper that prints raw headers for copy/paste.

Perimeter access does not bypass application authentication, role authorization, project specifications, deployment gates, or Production-change requirements.

## HAU privacy and evidence

Keep credentials, private configuration, recipient addresses, roster data, contact details, birthdays, institutional identifiers, borrower evidence, recovery material, D1 exports, R2 manifests, and provider identifiers out of public Git, ordinary logs, and handoffs.

Preserve migrations, immutable ledger/audit/history/evidence, backups, rollback material, release tags, and approved legacy visual references.

Production promotion, provider writes, database mutation, migration application, access seeding, Google Drive/Sheet changes, staff-roster import, branch cleanup, and recovery cleanup require the exact accepted task and runbook.

## Verification and handoff

Run focused checks for changed code plus every broader check required by the accepted task. Documentation-only work uses relevant governance and continuity checks and does not claim runtime verification that did not run.

Before a normal governed handoff:

- review the logical diff;
- update required `PROJECT_STATUS.md`, `CHANGELOG.md`, `docs/WORK_CONTINUATION.md`, and current-chain records with verified facts;
- record exact tests and results;
- record unrun checks and external-state uncertainty;
- record commit, push, PR, deployment, migration, provider, and Google actions only when verified;
- release the writer lock only through the current pointer.

A synchronization must stop when the exact `AGENTS.md`, project extension, or
worktree appendix contains unpreserved dirty/unique content, or when a real concurrent
writer owns those governance paths. An open session, an in-use worktree, or unrelated
dirty work elsewhere is not by itself a blocker under an accepted governance-sync task;
preserve that state, back up the target policy bytes, synchronize only the registered
governance paths, and report the overlap honestly.
