# ChatGPT Web and Codex Collaboration

This repository is the durable context bridge between ChatGPT web and the Codex app. Separate chats do not automatically share their full conversation history. Both agents must reconstruct current context from GitHub and the committed files listed below.

## Shared source of truth

Read in this order:

1. The connected `gpt-context-vault` entrypoint only as needed to route the request and recover account-wide preferences.
2. `AGENTS.md` — mandatory safety, authority, and workflow rules.
3. The accepted active specification under `specs/` — bounded requirements, non-goals, permissions, acceptance criteria, and evidence.
4. `PROJECT_STATUS.md` — verified product and backend status.
5. `docs/WORK_CONTINUATION.md` — latest recoverable checkpoint, blockers, and commands.
6. `CHANGELOG.md` — completed behavior by version.
7. Relevant architecture, domain, security, testing, migration, and launch documents.
8. The active GitHub branch, draft pull request, commit history, and CI results.

The Context Vault is an account-wide routing layer. This project repository remains authoritative for project requirements, code, decisions, implementation status, and tests.

Current collaboration branch: `feat/apps-script-backend-and-launch-readiness`  
Current pull request: https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/2

The branch and pull request may change later. Always verify them instead of trusting this document alone.

## Roles

### ChatGPT web — manager and reviewer

- Inspect remote GitHub state before assigning work.
- Create or review one bounded specification from the roadmap, issue, or user instruction.
- State the accepted spec path/status, expected branch, and starting commit.
- Define scope, non-goals, requirement IDs, acceptance-criteria IDs, verification commands, external-write permissions, and stop conditions.
- Do not authorize implementation while the spec is `DRAFT` or `IN_REVIEW`.
- Do not edit the branch while Codex holds the implementation turn.
- After Codex pushes, inspect the actual diff, commit, tests, CI, and acceptance-evidence mapping before approval.

### Codex app — implementer

- Perform the `AGENTS.md` start-of-task handshake in the local Git checkout.
- Read the accepted active spec and report its path, status, requirement IDs, and acceptance-criteria IDs before editing.
- Stop if the local checkout is dirty, divergent, on the wrong branch, does not match the expected starting commit, or the spec is not accepted.
- Implement only the accepted requirements and preserve the stated non-goals.
- Stop and request an amendment when scope, permissions, or acceptance criteria must materially change.
- Run the required checks and preserve exact failure output.
- Update specification tasks and completion evidence, plus status, changelog, and continuation documents with verified facts.
- Commit and push only the intended files, then report the exact commit SHA.

### User — approval authority

Only the user may accept a specification unless they explicitly delegate that approval. Only the user may authorize production deployment, migration application, real Drive setup/uploads, access seeding, destructive cleanup, merging the pull request, or a meaningful scope expansion.

## One-writer protocol

1. Manager verifies GitHub and prepares or reviews the spec.
2. User or delegated manager accepts the spec.
3. Manager issues a spec-linked task packet.
4. User sends the task packet to Codex.
5. Codex verifies local state and announces that implementation has started.
6. ChatGPT web remains read-only while Codex works.
7. Codex runs checks, updates the spec and documentation, commits, and pushes.
8. Codex returns a spec-linked handoff packet.
9. Manager verifies GitHub, CI, and acceptance evidence, then approves, requests changes, or records a blocker.
10. Codex pulls the verified head before the next accepted milestone.

If both agents changed the same branch, stop. Preserve both states, inspect the commit graph, and reconcile explicitly; never force-push or reset automatically.

## Manager task packet

Every implementation request should contain:

```text
Milestone:
Spec path:
Spec status:
Accepted by / accepted at:
Expected branch:
Expected starting commit:
Objective:
Requirement IDs:
Acceptance-criteria IDs:
Files likely in scope:
Requirements:
Non-goals:
External writes allowed:
Tests and checks:
Acceptance evidence required:
Documentation updates:
Commit/push requirement:
Stop conditions:
Amendment rule: Stop and return the spec to review before any material scope, requirement, acceptance-criterion, security, data, deployment, or external-write change.
```

## Codex handoff packet

Every implementation handoff should contain:

```text
Spec path:
Spec status:
Requirements completed:
Acceptance-criteria evidence:
Amendments made:
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
Spec completion evidence updated: yes/no
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

The path is not authoritative. The `.git` repository, configured `origin`, branch, upstream, commit, and accepted spec determine whether the checkout is current.

Open the Git root in Codex. Use Local mode for the first handshake and use worktrees for isolated later tasks. A new Codex task must re-read `AGENTS.md` and the accepted spec; an already-running task should be restarted after instruction changes so the updated instruction chain is loaded.

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

Repository verification or spec acceptance does not by itself authorize Google Sheet writes, Drive folder creation, evidence upload, Apps Script deployment, access seeding, migration application, trigger creation, production smoke tests, merging, tagging, or release publication. Those actions require explicit permission in the accepted specification and user approval, and must be recorded in `docs/WORK_CONTINUATION.md`.
