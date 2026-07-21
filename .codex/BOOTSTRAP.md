# Codex Continuity Bootstrap

Use this when opening the project from a different Codex/ChatGPT account, machine, or fresh task.

## Core rule

Do not treat chat history as project truth. The repository is the continuity mechanism.

Do not waste tokens by rereading the entire project.

## Minimum required cold-start order

1. Read `AGENTS.md`.
2. Read `.codex/CURRENT.md`.
3. Read `.codex/PHASE_AND_CONTEXT_POLICY.md`.
4. Read only the active specification referenced by `.codex/CURRENT.md`.
5. Perform the Git handshake required by `AGENTS.md`.
6. Read additional files only when the active milestone requires a specific fact, conflict, source file, or test.

Do not automatically reopen `README.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, or long historical documents if the needed current state is already captured by the pointer and unchanged.

Prefer targeted line/section reads, `git diff --stat`, `git diff --name-only`, targeted diffs, commit metadata, and directly relevant source/tests.

## Historical continuity checkpoint

The v0.6 continuity branch was created from preserved commit:

`81efe82618048b79a821f93bd95a0be00eaeff43`

At continuity setup that commit was 63 commits ahead and 0 behind `main` (`91a30ee2de015bce1471a2d4fd71d9325af3e936`). Historical PR #2 was closed without merge, and the old feature branch ref was no longer present. The preserved commit was therefore used as the non-destructive base for `chore/v0.6-codex-continuity-bootstrap`.

Treat those values as historical checkpoints only. Always fetch and verify current remote state.

## Manual model-switch rule

Codex cannot automatically switch models.

At the end of Phase 1 or Phase 2, the current task must update `.codex/CURRENT.md` to `READY FOR MANUAL MODEL SWITCH`, record the next required model/specification, print the mandatory phase-completion message from `.codex/PHASE_AND_CONTEXT_POLICY.md`, and stop.

The current task must not begin the next phase.

Phase 3 must stop after repository-side completion with production still separately gated.

## First-session prompt

```text
Continue the existing HAU-USC Logistics Management System from its authoritative repository state.

Do not restart the project and do not infer project state from this account's previous chats.

Read only:
1. AGENTS.md
2. .codex/CURRENT.md
3. .codex/PHASE_AND_CONTEXT_POLICY.md
4. the active specification referenced by CURRENT.md

Then perform the required Git handshake.

Do not broad-scan or reread unchanged long files. Read additional project files only when the current milestone requires a specific fact or directly relevant source/test.

Follow the exact current bounded milestone. Respect the mandatory manual model-switch stop at phase completion.
```

## Account-portability rule

A new agent should be able to continue using only:

`Git state -> AGENTS.md -> .codex/CURRENT.md -> phase/context policy -> active spec -> targeted context`

If that chain is insufficient, stop and record the missing durable context in the repository rather than relying on undocumented chat memory or a whole-repository scan.