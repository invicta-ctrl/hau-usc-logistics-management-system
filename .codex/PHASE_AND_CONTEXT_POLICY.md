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

ACTIVE_WRITER is a hard lock. Only that writer edits the branch. A handoff keeps the lock active until a reviewed transfer or completion explicitly changes it to NONE.

A valid transfer records branch, HEAD, upstream state, worktree state, accepted specification, completed work, verification, blocker, next exact action, resume commands, and prohibited actions. Run npm run handoff:verify before transfer.

## Model routing and escalation

The current task's REQUIRED_MODEL is authoritative for ordinary implementation. Route decisions by risk, not by historical version labels:

- Escalate before changing authentication/session architecture, authorization/capability semantics, ledger or immutable-record invariants, migration/database architecture, recovery guarantees, secrets/privacy posture, or a production boundary.
- Stop on a material unresolved escalation; record the affected scope and exact decision required.
- Completing a phase or batch never authorizes a new phase. Update the current chain, record the next required role, and stop when the accepted task requires a handoff.

## Stop conditions

Stop the affected batch for a wrong or unverified environment; production crossover; unknown dirty target; missing preservation/rollback proof; required migration outside scope; unclassified or non-synthetic staging state; privacy/recipient uncertainty; failed integrity/recovery proof; exact-SHA/artifact failure; or unresolved P0/P1.
