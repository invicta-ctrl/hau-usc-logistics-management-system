# Phase, Context, and Model Routing Policy

This policy is version-neutral and applies to every repository task.

## Cold start

Read only the canonical continuity chain first:

1. AGENTS.md
2. .codex/CURRENT.md
3. .codex/CURRENT_TASK.md
4. .codex/CURRENT_HANDOFF.md
5. This policy
6. The accepted specification named by the pointer

Then perform the required Git handshake. Expand the read set only through an active acceptance criterion, direct dependency, verification failure, or material safety risk.

## Bounded work and evidence

- Work one accepted milestone or vertical slice at a time.
- The current task must name its objective, scope, exclusions, authority, risk, verification, stop conditions, next exact action, and required model/role.
- Reuse prior verification only when the SHA, relevant artifacts, configuration, and external state have not changed. State the invalidator.
- Do not rerun expensive suites after a documentation-only change merely for ceremony.
- Update the pointer, task, handoff, status, continuation, and append-only changelog before transferring a completed milestone.

## Writer lock and transfer

`ACTIVE_WRITER` is a hard, singular canonical-branch lock. During a writing task
it names exactly one `TERRA_INTEGRATION_WRITER` as
`TERRA_MAX:<task-or-agent-id>`; Sol and Luna never hold it. A handoff keeps the
lock active until an approved transfer or completed task explicitly changes it to
`NONE`.

A valid transfer records branch, HEAD, upstream state, worktree state, accepted
specification, governance amendment when applicable, completed work,
verification, blocker, next exact action, resume commands, prohibited actions,
and the task-local Terra/Luna delegation ledger. Run `npm.cmd run handoff:verify`
before transfer.

## Model routing and escalation

The root `AGENTS.md` model policy is mandatory. `REQUIRED_MODEL: GPT-5.6 SOL`
identifies the sole read-only top-level orchestrator, not the writer. Sol alone
may create child tasks, with one delegation level: zero Sol children, up to 16
Terra MAX writer-class children, and up to 16 Luna MAX read-only reviewer
children. No silent substitution is allowed.

Every writing task has one canonical Terra Integration Writer. Additional Terra
work requires isolated non-overlapping scopes. Luna reports independent findings
to Sol without editing the repository or provider state. Route decisions by risk,
not by historical model language in preserved specifications:

- Escalate before changing authentication/session architecture, authorization/capability semantics, ledger or immutable-record invariants, migration/database architecture, recovery guarantees, secrets/privacy posture, or a production boundary.
- Stop on a material unresolved escalation; record the affected scope and exact decision required.
- Completing a phase or batch never authorizes a new phase. Update the current chain, record the next required role, and stop when the accepted task requires a handoff.

## Stop conditions

Stop the affected batch for a wrong or unverified environment; production crossover; unknown dirty target; missing preservation/rollback proof; required migration outside scope; unclassified or non-synthetic staging state; privacy/recipient uncertainty; failed integrity/recovery proof; exact-SHA/artifact failure; or unresolved P0/P1.
