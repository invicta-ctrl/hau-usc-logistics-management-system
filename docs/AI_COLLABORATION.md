# ChatGPT Web and Codex Collaboration

This repository is the durable context bridge between ChatGPT web and the Codex app. Separate chats do not automatically share their full conversation history. Both agents must reconstruct current context from GitHub and the committed files listed below.

## Routing gate

Before a Codex worker starts, use `scripts/codex-route.ps1`. It preserves the
original instruction locally, refines rough or partial input with a read-only
structured output, and writes an inspectable brief and route under the ignored
`.codex/runtime/` directory. Complete prompts and precise commands are kept
proportional. Inspect the brief and route before passing `-Execute`.

The route must use a verified model/reasoning alias and an allowlisted
verification profile. Subagents are disabled by default and parallel writes
require isolated ownership or worktrees. The router never authorizes live
Apps Script, Google Sheets, Google Drive, deployment, migration, publication,
merge, or production actions.

## Shared source of truth

Read in this order:

1. `AGENTS.md` — mandatory safety and workflow rules.
2. `PROJECT_STATUS.md` — verified product and backend status.
3. `docs/WORK_CONTINUATION.md` — latest recoverable checkpoint, blockers, and commands.
4. `CHANGELOG.md` — completed behavior by version.
5. Relevant architecture, domain, security, testing, migration, and launch documents.
6. The active GitHub branch, draft pull request, commit history, and CI results.

Current collaboration branch: `feat/apps-script-backend-and-launch-readiness`  
Current pull request: https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/2

The branch and pull request may change later. Always verify them instead of trusting this document alone.

## Roles

### ChatGPT web — manager and reviewer

- Inspect remote GitHub state before assigning work.
- Convert the roadmap into one bounded milestone.
- State the expected branch and starting commit.
- Define scope, non-goals, acceptance criteria, verification commands, external-write permissions, and stop conditions.
- Do not edit the branch while Codex holds the implementation turn.
- After Codex pushes, inspect the actual diff, commit, tests, and CI before approval.

### Codex app — implementer

- Perform the `AGENTS.md` start-of-task handshake in the local Git checkout.
- Stop if the local checkout is dirty, divergent, on the wrong branch, or does not match the expected starting commit.
- Implement only the accepted milestone.
- Run the required checks and preserve exact failure output.
- Update status, changelog, and continuation documents with verified facts.
- Commit and push only the intended files, then report the exact commit SHA.

### User — approval authority

Only the user may authorize production deployment, migration application, real Drive setup/uploads, access seeding, destructive cleanup, merging the pull request, or a meaningful scope expansion.

## One-writer protocol

1. Manager verifies GitHub and issues a task packet.
2. User sends the task packet to Codex.
3. Codex verifies local state and announces that implementation has started.
4. ChatGPT web remains read-only while Codex works.
5. Codex runs checks, updates documentation, commits, and pushes.
6. Codex returns a handoff packet.
7. Manager verifies GitHub and CI, then approves, requests changes, or records a blocker.
8. Codex pulls the verified head before the next milestone.

If both agents changed the same branch, stop. Preserve both states, inspect the commit graph, and reconcile explicitly; never force-push or reset automatically.

## Manager task packet

Every implementation request should contain:

```text
Milestone:
Expected branch:
Expected starting commit:
Objective:
Files likely in scope:
Requirements:
Non-goals:
External writes allowed:
Tests and checks:
Acceptance criteria:
Documentation updates:
Commit/push requirement:
Stop conditions:
```

## Codex handoff packet

Every implementation handoff should contain:

```text
Branch:
Starting commit:
Ending commit:
Files changed:
Behavior completed:
Tests run and exact results:
Build result:
External actions performed:
External actions not performed:
Known defects/blockers:
WORK_CONTINUATION.md updated: yes/no
Push verified: yes/no
PR URL:
Recommended next action:
```

## Local Codex checkout

Recommended Windows project path:

```text
D:\Documents\DOL Website GitHub
```

The path is not authoritative. The `.git` repository, configured `origin`, branch, upstream, and commit determine whether the checkout is current.

Open the Git root in Codex. Use Local mode for the first handshake and use worktrees for isolated later tasks. A new Codex task must re-read `AGENTS.md`; an already-running task should be restarted after instruction changes so the updated instruction chain is loaded.

## Safe synchronization commands

Run from the Git root:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git remote -v
git fetch origin --prune
git rev-list --left-right --count HEAD...@{upstream}
```

Only when the tree is clean and the branch is solely behind:

```powershell
git pull --ff-only
```

Then verify the project:

```powershell
npm install
npm run check
```

Install Chromium separately if local Playwright is required:

```powershell
npx playwright install chromium
npm run test:e2e
```

## External-system boundary

Repository verification does not authorize Google Sheet writes, Drive folder creation, evidence upload, Apps Script deployment, access seeding, migration application, trigger creation, or production smoke tests. Those actions require an explicit manager task and user approval, and must be recorded in `docs/WORK_CONTINUATION.md`.
