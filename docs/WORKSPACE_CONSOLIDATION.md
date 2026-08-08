# Phase 3 Workspace Consolidation

> Phase 3.5 final reconciliation, including the live folder/branch/PR inventory,
> new bundle, linked-worktree relocation, redundant-clone removal, contained PR
> and ref cleanup, final structure, and rollback, is recorded in
> `docs/archive/releases/v0.6-v0.7.0/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md`.

## Outcome

`D:\Documents\DOL Website GitHub` is the single authoritative active checkout.
The Git worktree registry was reduced from eight entries to two: the
authoritative checkout and the retained V1 Deployment dependency. A separate
clean planning clone remains because its remote-backed branch contains four
unique, unmerged architecture/routing commits.

No unknown or unique work was deleted. No remote branch, pull request, or tag
was deleted, closed, merged, rewritten, or force-pushed.

## Classification summary

| Item                                                           | Classification                            | Disposition                                                        |
| -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Current checkout / PR #6                                       | `AUTHORITATIVE_ACTIVE`                    | Retained as the only implementation authority.                     |
| V1 Deployment worktree / PR #3                                 | `ACTIVE_DEPENDENCY`                       | Retained; branch diverges with release/deployment work.            |
| Planning clone / routing branch                                | `UNIQUE_UNMERGED_WORK`                    | Retained; four unique commits and matching upstream.               |
| Six `codex/v1-*` specialist worktrees                          | `SUPERSEDED`                              | Patch-equivalent tips preserved in bundle, then normally removed.  |
| Drive/QA dirty generated HTML                                  | `UNKNOWN_REQUIRES_PRESERVATION`           | Exact files and binary patches archived before cleanup.            |
| Main/deployment `.clasp.json`                                  | `PRIVATE_CONFIGURATION`                   | Hash-verified restricted copies outside Git; values never exposed. |
| Historical prototype and analysis folders                      | `ARCHIVE_ONLY` / preserved unique history | Moved intact into a dated archive with count/size/hash evidence.   |
| `06. LOGISTICS` institutional source                           | `UNKNOWN_REQUIRES_PRESERVATION`           | Left unchanged and restricted.                                     |
| Existing release/deployment backups                            | `ARCHIVE_ONLY` with private subsets       | Retained in place.                                                 |
| Dependencies, build outputs, test reports in retired worktrees | `GENERATED_REBUILDABLE`                   | Removed only with their retired worktrees.                         |

## Preservation evidence

- External consolidation root:
  `D:\Documents\HAU-USC Logistics System`.
- Verified all-refs bundle:
  `backups/git-bundles/hau-usc-all-refs-phase3-20260715-095903.bundle`.
- Bundle: 1,518,711 bytes, 47 refs, complete history, `git bundle verify`
  passed, SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`.
- Dirty generated archive:
  `backups/uncommitted/phase3-20260715-095903`; 8 files, 2,999,052
  bytes, aggregate manifest SHA-256
  `3813EEB0A7A5AC05C788FC272CD6D22643F79C6BA0763AA8C7740BDEABB7FCF5`.
- The two private config copies have distinct SHA-256 values recorded in the
  restricted external inventory; no configuration values are stored here.

The former 2026-07-13 consolidation inventory/plan/manifest was preserved under
`archives/consolidation-attempt-20260713/` because it named a stale candidate
authority.

## Git dispositions

- Retained local branches: authoritative feature, V1 Deployment dependency, and
  `main`.
- Removed local branches: six bundle-preserved `codex/v1-*` refs and the fully
  contained local Apps Script launch-readiness ref.
- Retained remote-only dependencies: SDD, QR, routing, visual snapshot, and
  historical branches.
- PR #1 and PR #2 appear superseded by reachability, but manager closure remains
  a separate decision. PR #3-#5 contain distinct active work. PR #6 remains the
  authoritative integration PR.
- Slice 2-6 rollback/checkpoint tags remain intact.

## Deliberate non-actions

No application/generated repository source was changed. No Slice 7 work, PR
merge/close, remote cleanup, deployment, migration, Apps Script, Sheets, Drive,
Cloudflare, database, or production action occurred. Downloads exports and
potentially private institutional assets were inventoried but left untouched.

## Recovery

1. Verify the external bundle with `git bundle verify`.
2. Restore a removed branch from its recorded bundle ref and recreate a
   worktree with `git worktree add` at an approved empty path.
3. Apply the preserved binary patch only if an exact Drive/QA generated snapshot
   is required.
4. Restore moved historical directories from their dated archives after
   validating the absolute source and destination paths.
5. Keep private configuration outside Git and restore it only through the
   restricted configuration workflow.
