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

## Front-end design iterations

Owner instruction, 2026-08-09. This section is authoritative on the
`frontend-design-integration` branch and governs every future front-end design
iteration.

### Owner correction - v5 transfer authority

**Latest owner instruction, 2026-08-09. This subsection supersedes the older
Baseline and Consequence subsections below wherever they conflict.**

`prototypes/impeccable-whole-site-redesign-v5/` is the authoritative visual,
front-end shell, design, interaction, and UX baseline for the current bounded
integration. The exact deployed production frontend and its matching
repository source remain authoritative for functionality, routes, data,
services, permissions, validation, statuses, and user-visible workflow
semantics.

The binding integration direction is:

```text
production functionality -> v5 frontend architecture
```

The old production presentation layer is evidence of functional coverage, not
the visual baseline. Where v5 lacks a production capability, add a native v5
component; do not retain a visually isolated legacy island or remove the
capability.

Preserve the modular v5 directory as the reference implementation. Do not
create v6, a v5 copy, or another preview lineage. The integrated frontend
belongs in real application source. `v5` is an engineering reference and must
not appear in ordinary product copy.

### Baseline

**The current production front end on `main` is the baseline for all future
design iterations.**

It is not the legacy prototype, and it is not any earlier design preview. The
front end has barely changed since v0.7.0, so the shipped front end is the
truthful starting point; deriving a new iteration from an older artifact
reintroduces drift that was already resolved.

Concretely, at the start of an iteration:

- Read the current front end from `main` - `src/`, the generated
  `dist/index.html`, and `package.json` version.
- Capture its visual and functional baseline before the first edit.
- Treat `docs/design/PRODUCTION_FRONTEND_PARITY_BASELINE.md` as the
  must-not-regress contract, refreshed against the then-current `main`.

The following remain **historical reference only** and must not be used as a
starting point:

- `legacy/HAU-USC_Logistics-Prototype.original.html` - preserved artifact.
- `prototypes/impeccable-whole-site-redesign{,-v2,-v3,-v4,-v5}/` - the
  Impeccable preview programme.
- The `output/design/` preview exports, backups, and screenshot evidence.

They stay in the repository as provenance. They are not design authority.

### Naming

Future iterations are named:

```
front end design v<current front-end version from main> r<revision number>
```

- `v` is the front-end version read from `main` at the time the iteration
  starts, taken from `package.json`. It is not invented and not incremented by
  design work.
- `r` is the revision number of the design iteration, starting at `r1`.
- When `main`'s front-end version changes, the revision resets to `r1` under
  the new version.

At the time of writing, `main` is at front-end version **0.7.2**, so the next
iteration is **`front end design v0.7.2 r1`**.

Use this name consistently for the branch or worktree, the iteration's design
records under `docs/design/`, any generated preview export, and the continuity
records under `.codex/`.

This supersedes the earlier preview naming - `v1` through `v5`, `v0.4.1`,
`v0.4.2`, and `Impeccable vN`. Those names are not reused; existing artifacts
that carry them are historical and are not renamed retroactively.

### Consequence to resolve, not to assume

`tests/unit/visual-baseline.test.js` currently pins `src/styles/visual/*.css`
byte-for-byte to `legacy/HAU-USC_Logistics-Prototype.original.html`. If the
current front end is the design baseline, that guard - which anchors styling to
the superseded prototype - is the main obstacle to iterating.

Do not remove or weaken it on that reasoning alone. The sanctioned pattern is
to append after the preserved cascade, proven on `tokens-base.css` and
`overlays.css`. Re-pointing or retiring the guard is an owner decision and
needs its own accepted specification.
