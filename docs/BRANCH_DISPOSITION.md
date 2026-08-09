# Git Branch Disposition

Status: adopted by the Isolated Staging Playground amendment and draft PR #23.

## Target policy

Permanent pointers are `main`, `backup/last-known-good`, `regression/r1`, `regression/r2`, and `regression/r3`. Staging/playground and production are environments, not branches. One temporary production-bound `release/`, `fix/`, or true urgent `hotfix/` branch is the default maximum.

## Verified adoption inventory

| Branch                                       | Classification  | Evidence                                                                               | Disposition                                                                |
| -------------------------------------------- | --------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `main`                                       | Retain          | clean, synchronized with `origin/main`; v0.8.0 deployed commit is in its lineage       | permanent accepted lineage                                                 |
| `backup/last-known-good`                     | Retain          | created non-destructively from accepted v0.7.2                                         | immediate prior accepted production pointer                                |
| `regression/r1`                              | Retain          | created non-destructively from accepted v0.7.1                                         | first older recovery pointer                                               |
| `regression/r2`                              | Retain          | created non-destructively from accepted v0.7.0                                         | second older recovery pointer                                              |
| `regression/r3`                              | Retain          | created non-destructively from the preserved canonical pre-v0.7.0 main checkpoint      | oldest retained recovery pointer                                           |
| prior v0.8.0 release branch                  | Closed          | both PRs merged, zero unique commits, no worktree, no open PR                          | eligible for separately authorized deletion after current PR safety checks |
| frontend design branch                       | Preserve unique | dirty worktree, untracked artifacts, four unpushed commits, substantial unique history | out of scope; never delete/move/reset in this task                         |
| `release/v0.8.1-isolated-staging-playground` | Active writer   | branched from synchronized `main` for the accepted amendment                           | delete only after accepted closure under the permanent policy              |

No permanent staging, playground, production, prod, develop, dev, working, or next branch is introduced.

## Verified initial recovery pointers

The peeled immutable source and linear ancestry were verified before the non-force remote writes:

- `backup/last-known-good` <- v0.7.2 accepted production (`84eacfcdb47a3985fed48e3ba14bb413946d4410`);
- `regression/r1` <- v0.7.1 accepted production (`e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90`);
- `regression/r2` <- v0.7.0 accepted production (`dc98d670fdd63f649037616c5a2d51e5c62ca4ae`);
- `regression/r3` <- preserved canonical pre-v0.7.0 checkpoint (`91a30ee2de015bce1471a2d4fd71d9325af3e936`).

Pointer creation establishes the initial recovery ladder; it is not a release rotation. Future rotation happens only after a new production release passes smoke, reconciliation, and rollback-readiness checks.

## Deterministic rotation

A rotation plan computes all destinations from the pre-rotation snapshot before any write:

1. old `regression/r2` -> new `regression/r3`;
2. old `regression/r1` -> new `regression/r2`;
3. old `backup/last-known-good` -> new `regression/r1`;
4. previous accepted production `main` -> new `backup/last-known-good`;
5. the new accepted release remains `main`.

A PR merge alone never authorizes rotation.
