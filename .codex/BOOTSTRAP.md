# Codex Continuity Bootstrap

Use this when opening the project from a different Codex/ChatGPT account, machine, or fresh task.

## Rule

Do not treat chat history as project truth. The repository is the continuity mechanism.

## Required order

1. Read repository `AGENTS.md`.
2. Read `.codex/CURRENT.md`.
3. Read the active specification referenced by `.codex/CURRENT.md`.
4. Perform the Git handshake required by `AGENTS.md`.
5. Read `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, and only the additional files required by the active task.
6. Reconcile GitHub remote truth with any stale documentation before implementation.

## Historical continuity checkpoint

The v0.6 continuity branch was created from preserved commit:

`81efe82618048b79a821f93bd95a0be00eaeff43`

At continuity setup that commit was 63 commits ahead and 0 behind `main` (`91a30ee2de015bce1471a2d4fd71d9325af3e936`). Historical PR #2 was closed without merge, and the old feature branch ref was no longer present. The preserved commit was therefore used as the non-destructive base for `chore/v0.6-codex-continuity-bootstrap`.

Treat those values as historical checkpoints only. Always fetch and verify the current remote state.

## First-session prompt

```text
Continue the existing HAU-USC Logistics Management System from its authoritative repository state.

Do not restart the project and do not infer project state from this account's previous chats.

Before editing:
1. Read AGENTS.md.
2. Read .codex/CURRENT.md.
3. Read the active spec referenced there.
4. Report repository root, branch, HEAD, upstream, git status, and ahead/behind count.
5. Fetch origin --prune when network is available.
6. Preserve unknown work; never reset/clean/discard automatically.
7. Reconcile current GitHub state with status/continuation documents.

For the first task, remain READ / VERIFY / REPORT only until the Phase 1 baseline reconciliation is complete.
```

## Account-portability rule

A new agent should be able to continue using only:

`Git state -> AGENTS.md -> .codex/CURRENT.md -> active spec -> targeted status/source/tests`

If that chain is insufficient, stop and record the missing durable context in the repository rather than relying on undocumented chat memory.
