# ChatGPT Web and Codex Collaboration

This repository is the durable context bridge between ChatGPT web, Codex tasks, worktrees, and human maintainers. Separate sessions do not automatically share complete history, so current project state must be reconstructed from GitHub and committed files.

## Shared source of truth

Read in this order:

1. `AGENTS.md` — mandatory safety, authority, and workflow rules.
2. `.codex/CURRENT.md` — active operational pointer when present.
3. The active accepted specification referenced by `.codex/CURRENT.md`.
4. `PROJECT_STATUS.md` — verified current project/transition state.
5. `docs/WORK_CONTINUATION.md` — recoverable checkpoints, blockers, and execution evidence.
6. `CHANGELOG.md` — completed behavior/checkpoints.
7. Relevant architecture, domain, security, testing, migration, visual, and launch documents.
8. Current GitHub branch, commit graph, pull-request state, and CI results.

Never use an old chat as the authority for the current branch, next milestone, accepted scope, or latest verification result.

When current GitHub state conflicts with stale documentation for branch/PR/CI facts, preserve the historical evidence but use freshly verified Git state as the operational truth and correct stale records in the next documentation checkpoint.

## Current continuity state

Active continuity branch:

`chore/v0.6-codex-continuity-bootstrap`

Preserved launch-readiness predecessor:

`81efe82618048b79a821f93bd95a0be00eaeff43`

At continuity setup that predecessor was 63 commits ahead and 0 behind `main`. Historical PR #2 was closed without merge, and the former feature-branch ref was no longer present. The preserved predecessor was used as the non-destructive base of the continuity branch.

Always fetch and verify these facts instead of assuming they remain unchanged.

## v0.6 control files

- `.codex/CURRENT.md` — one short current-work pointer
- `.codex/BOOTSTRAP.md` — fresh-session recovery procedure
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`
- `.codex/specs/README.md` — phase/model routing index

## Roles

### ChatGPT web — manager/reviewer

- Inspect remote GitHub state before assigning implementation work.
- Read `AGENTS.md` and `.codex/CURRENT.md` first.
- Convert the accepted phase into one bounded milestone.
- State the expected branch and starting checkpoint.
- Define scope, non-goals, verification, external-write permissions, acceptance criteria, and stop conditions.
- Remain read-only on the implementation branch while Codex holds the writer turn.
- After Codex pushes, inspect the actual diff, commit, tests, and CI/evidence before approving the next milestone.

### Codex — implementer

- Perform the `AGENTS.md` start-of-task handshake in the local checkout.
- Read `.codex/CURRENT.md` and the referenced active specification.
- Stop if the checkout is dirty, divergent, on the wrong branch, lacks the expected upstream, or does not preserve the expected checkpoint.
- Implement only the accepted bounded milestone.
- Run required checks and preserve exact failure output.
- Update `PROJECT_STATUS.md`, `CHANGELOG.md`, `docs/WORK_CONTINUATION.md`, and `.codex/CURRENT.md` with verified facts before handoff.
- Commit and push only intended files when authorized, then report the exact ending SHA.

### Earl — approval authority

Earl explicitly controls consequential external actions such as production promotion, institutional-data migration application, real Drive/Sheet operational writes, final access seeding, destructive cleanup, and meaningful scope expansion beyond the accepted specification.

Repository-only milestones already authorized by the active accepted specification do not require repetitive pauses unless a hard stop applies.

## One-writer protocol

1. Manager verifies GitHub and `.codex/CURRENT.md` and issues one bounded task packet.
2. Codex performs the local Git handshake and confirms the starting state.
3. Manager remains read-only on that implementation branch while Codex works.
4. Codex implements, verifies, updates continuation records, commits, and pushes.
5. Codex returns a handoff packet.
6. Manager verifies the actual remote diff/commit/CI and either approves, requests repair, or records a blocker.
7. Codex fetches/pulls the verified head before the next milestone.

If two writers changed the same branch, stop. Preserve both states, inspect the commit graph, and reconcile explicitly; never force-push, reset, or discard either side automatically.

## Manager task packet

```text
Milestone:
Active phase/specification:
Expected branch:
Expected starting checkpoint:
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

```text
Phase/specification:
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
CURRENT.md updated: yes/no
WORK_CONTINUATION.md updated: yes/no
Push verified: yes/no
PR/CI state:
Rollback point:
Recommended next action:
```

## Local checkout and safe synchronization

Recommended historical Windows path when that checkout still exists:

```text
D:\Documents\DOL Website GitHub
```

The path is not authoritative. The `.git` repository, `origin`, branch, upstream, HEAD, and working tree are authoritative.

Run from the Git root:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git remote -v
git fetch origin --prune
git rev-list --left-right --count HEAD...@{upstream}
```

Only when the tree is clean and solely behind:

```powershell
git pull --ff-only
```

For code milestones, use the verification required by `AGENTS.md` and the active specification. Do not rerun expensive unchanged-code checks only because a session changed; clearly identify reused evidence instead of claiming a new run.

## External-system boundary

Repository continuity/verification does not itself authorize:

- operational Google Sheet writes;
- Drive folder creation or evidence uploads;
- Apps Script push/deployment/version changes;
- access seeding;
- migration application;
- trigger creation/change;
- production smoke tests or promotion.

Those actions require the applicable explicit authorization and safety gates and must be recorded in `docs/WORK_CONTINUATION.md`.

## Continuity acceptance test

A fresh task with no prior conversation context should be able to:

1. fetch the repository;
2. read `AGENTS.md`;
3. read `.codex/CURRENT.md`;
4. read the referenced active specification;
5. perform the Git handshake;
6. identify the current bounded milestone and hard stops;
7. continue without undocumented history.

If it cannot, add the missing durable context to the repository before substantial implementation proceeds.
