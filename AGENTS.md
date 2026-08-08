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

## Writer lock, model routing, and delegation

- The active writer named in .codex/CURRENT.md owns the branch. Codex is the only writer by default; if another active writer is named, remain read-only and stop for transfer.
- One active writer may modify a branch at a time. Read-only review is allowed only when it cannot race the writer.
- Use at most two concurrent read-only subagents, with one delegation level, only for bounded independent mapping, triage, or review. They never edit shared files.
- Model routing is task-specific and version-neutral: follow REQUIRED_MODEL and escalation rules in the current task and accepted specification. Escalate auth, authorization, ledger, migration, recovery, security, or production-boundary decisions to the required authority; do not silently substitute a lower-scope role.
- Before handoff, update the three current records together. A writer lock is released only when the pointer says ACTIVE_WRITER: NONE and HANDOFF_STATUS: READY_FOR_HANDOFF.

## Required Git handshake

Before edits, record repository root, branch, HEAD, upstream, and git status --short. Fetch and compare an upstream only when network access is authorized. A missing upstream, divergence, wrong branch, or unexpected dirty work is a stop condition unless the current task explicitly marks a local no-push branch as sanctioned. Never reset, clean, force-push, discard, or overwrite unknown work.

## Safety and verification

- Keep credentials, private configuration, provider identifiers, recipient addresses, roster data, recovery material, and personal data out of Git, logs, and handoffs.
- Preserve migrations, immutable ledger/audit/history/evidence records, backups, rollback material, release tags, and the approved legacy visual baseline.
- Production promotion, provider writes, database mutation, migration application, access seeding, Drive/Sheet changes, and PR/branch cleanup require the exact authorization and runbook named by the accepted task.
- Run focused checks for changed code. Documentation-only work uses the relevant governance and continuity checks; do not claim runtime verification that did not run.
- Before a handoff, review the logical diff; update PROJECT_STATUS.md, CHANGELOG.md, docs/WORK_CONTINUATION.md, and the current chain with verified facts; then report unrun checks and external-state uncertainty honestly.
