# Phase 3.5 Repository and Workspace Consolidation Plan

Captured from live Git, GitHub, and filesystem metadata on
2026-07-15T10:36:41+08:00. This plan is the required preservation gate before
any Phase 3.5 cleanup. It does not authorize a product phase, deployment,
migration, history rewrite, force-push, or deletion of unknown/private work.

## Frozen authoritative state

- Repository: `invicta-ctrl/hau-usc-logistics-management-system`.
- Authoritative checkout: `D:\Documents\DOL Website GitHub`.
- Branch: `feat/live-sync-lending-search-catalog-controls`.
- Frozen HEAD/upstream/PR #6: `6abfb411c34a78aa5f98330c124c9e3a06c87762`.
- Local/upstream: `0 0`; tracked and untracked status clean.
- PR #6: open, draft, mergeable, and `validate`, `verify`, and
  `browser-smoke` green.
- Accepted baseline: Phase 3 checkpoint
  `58168edd4eec5ea0a063558dfb8071c4a7fd6c99`, lightweight tag
  `hau-usc-phase3-baseline-58168ed`; remote-verification record `6abfb411...`.
- Writer lock: the main Codex agent is the only writer. The bounded routing
  comparison agent is read-only.

The Context Vault project registry points to the same GitHub repository and
states that the project repository is authoritative. The declared Context Vault
`AGENTS.md` does not exist. Its project note still names the older automated
routing implementation and is stale relative to the accepted Phase 2 Caveman
Light repository records.

## Local project-folder inventory

The content comparison excludes Git objects and rebuildable dependency/test
caches. `Content not active` is a SHA-256 content comparison count, not a claim
that a private or historical file should be copied into the repository.

| Path                                                      |      Files / bytes | Git state                                                                                                      |                       Content not active | Classification            | Planned disposition                                                                                       |
| --------------------------------------------------------- | -----------------: | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------: | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `D:\Documents\DOL Website GitHub`                         | 2,626 / 72,241,588 | Clean registered primary worktree; upstream `0 0`                                                              |                                      n/a | `AUTHORITATIVE_CANDIDATE` | Retain as the only active authority. Do not physically move the primary worktree during an active thread. |
| `D:\Documents\DOL Website GitHub - V1 Deployment`         | 2,384 / 69,758,785 | Clean registered linked worktree at `5935771`; upstream `0 0`; one ignored private config                      | Git branch has 15 commits outside active | `REGISTERED_WORKTREE`     | Retain and move only with `git worktree move` into the consolidation root.                                |
| `D:\Documents\GitHub\hau-usc-logistics-management-system` | 2,480 / 68,671,913 | Clean standalone clone at `46a59c6`; upstream `0 0`; four patch-unique commits; four ignored runtime artifacts |                  Four superseded commits | `DUPLICATE_CLONE`         | Preserve runtime artifacts privately and current refs in a new bundle, then remove the redundant clone.   |
| `D:\Documents\DOL Deployment Configs`                     |          5 / 3,200 | No Git; configuration only                                                                                     |                                        5 | `PRIVATE_CONFIGURATION`   | Retain outside Git and shared source archives.                                                            |
| `D:\Documents\DOL Website`                                |    59 / 34,426,969 | No Git; institutional source                                                                                   |                                       59 | `UNKNOWN_PRESERVE`        | Leave untouched and restricted.                                                                           |
| `D:\Documents\DOL Website GitHub Backups`                 | 1,007 / 27,109,956 | No Git; eight private-config files; 888 contents absent from active                                            |                                      888 | `VERIFIED_BACKUP`         | Retain in place because historical handoffs reference it; treat private subsets as restricted.            |
| `D:\Documents\HAU-USC Logistics System`                   |     44 / 7,678,547 | No Git; verified bundles, archives, uncommitted snapshots, and private config                                  |                                       44 | `VERIFIED_BACKUP`         | Use as the structured consolidation root; never treat it as a competing checkout.                         |
| `D:\Documents\GitHub\gpt-context-vault`                   |      160 / 150,370 | Clean separate repository at `edaadec`; upstream `0 0`                                                         |                      Separate repository | `UNIQUE_UNMERGED_WORK`    | Retain as the account-wide context authority, not as project source.                                      |
| `D:\Documents\gpt-context-vault`                          |        41 / 35,659 | Non-Git older snapshot; all 41 paths exist in the Git clone, 33 exact and 8 older variants                     |                                       41 | `ARCHIVE_ONLY`            | Retain untouched because it contains mixed-scope account context; no HAU-only move or deletion.           |

Latest meaningful UTC changes are respectively 2026-07-15 02:22:41,
2026-07-13 13:59:41, 2026-07-13 05:06:00, 2026-07-12 19:16:09,
2026-07-08 00:40:34, 2026-07-14 23:37:05, 2026-07-15 02:25:55,
2026-07-13 04:41:06, and 2026-07-12 09:43:15.

## Worktree and checkout strategy

- Keep the primary checkout at `D:\Documents\DOL Website GitHub`. Moving a
  primary worktree while this thread and its linked-worktree administration are
  active is an unnecessary failure risk; the Phase 3.5 contract permits a
  documented authoritative path rather than requiring a rename.
- Move the clean deployment linked worktree with Git to
  `D:\Documents\HAU-USC Logistics System\worktrees\v1-deployment` after the
  new bundle and private-config parity are verified.
- The routing clone is semantically superseded but contains four ignored
  runtime files. Preserve those files with hashes under the external
  uncommitted backup area, verify its remote and bundle refs, then remove the
  standalone clone with an exact-path safety check.
- Keep the institutional source, deployment configuration, historical backups,
  Context Vault repository, and older Context Vault snapshot in place.

## Branch ancestry and disposition

Counts are `active-only / branch-only` from active head `6abfb411...`.

| Branch                                            | Head       |     Count | Classification                   | Disposition                                                                                                        |
| ------------------------------------------------- | ---------- | --------: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `feat/live-sync-lending-search-catalog-controls`  | `6abfb411` |   `0 / 0` | `ACTIVE_AUTHORITATIVE`           | Retain; PR #6 remains the integration PR.                                                                          |
| `main`                                            | `91a30ee2` |  `89 / 0` | `REQUIRED_DEPENDENCY`            | Retain as protected PR base; do not merge or update directly in Phase 3.5.                                         |
| `feat/v1-one-shot-demo-and-deployment`            | `59357713` | `25 / 15` | `UNIQUE_UNMERGED_WORK`           | Retain with PR #3 and the linked worktree.                                                                         |
| `docs/adopt-spec-driven-development`              | `bfafcf24` | `25 / 21` | `UNIQUE_UNMERGED_WORK`           | Retain with PR #4.                                                                                                 |
| `feat/qr-inventory-scanning`                      | `7c88eac0` | `25 / 26` | `UNIQUE_UNMERGED_WORK`           | Retain with PR #5.                                                                                                 |
| `feat/automated-codex-model-routing`              | `46a59c6d` |  `26 / 4` | `SUPERSEDED_AND_PRESERVED`       | Keep remote until a later owner cleanup; remove only the redundant local clone after private runtime preservation. |
| `feat/apps-script-backend-and-launch-readiness`   | `81efe826` |  `26 / 0` | `FULLY_CONTAINED_IN_ACTIVE_HEAD` | Close PR #2 and delete the remote branch after a new verified bundle.                                              |
| `agent/restore-authoritative-visual-layer`        | `1b3d1ab8` |  `86 / 0` | `FULLY_CONTAINED_IN_ACTIVE_HEAD` | Close PR #1 and delete the remote branch after a new verified bundle. The identical approved snapshot ref remains. |
| `automation/runtime-truthfulness-upload-20260713` | `d8b7e784` |  `31 / 0` | `FULLY_CONTAINED_IN_ACTIVE_HEAD` | Delete the remote branch after a new verified bundle; no PR depends on it.                                         |
| `snapshot/approved-prototype-v0.3.2`              | `1b3d1ab8` |  `86 / 0` | `HISTORICAL_TAG_CANDIDATE`       | Retain as the named historical visual reference.                                                                   |

The routing comparison found that the four patch-unique commits implement the
older automated router/hooks/seven-agent design and a superseded full-stack
roadmap. Accepted Phase 2 commit `8e82a86...` deliberately replaced that design
with Caveman Light, two read-only agents, deterministic validators, and bounded
context/output tools. Its tracked `[features] hooks = true` config is
incompatible with the active validator. Exact commits remain preserved by the
remote ref and bundles; no old routing file should be copied into active.

## Pull-request strategy

| PR  | Base <- head                    | Live state                       | Classification                   | Planned action                                                                                                              |
| --- | ------------------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| #6  | `main` <- active                | Open draft, mergeable, green     | `ACTIVE_AUTHORITATIVE`           | Retain; replace stale Slice 1 title/body with cumulative Phase 3.5 scope and current evidence after the documentation push. |
| #5  | SDD <- QR                       | Open draft, mergeable            | `UNIQUE_UNMERGED_WORK`           | Retain.                                                                                                                     |
| #4  | deployment <- SDD               | Open draft, mergeable            | `UNIQUE_UNMERGED_WORK`           | Retain.                                                                                                                     |
| #3  | active <- deployment            | Open draft, conflicting          | `UNIQUE_UNMERGED_WORK`           | Retain; do not resolve by unrelated merge.                                                                                  |
| #2  | `main` <- Apps Script readiness | Open draft; head fully contained | `FULLY_CONTAINED_IN_ACTIVE_HEAD` | Close without merge after bundle verification; preserve GitHub history.                                                     |
| #1  | `main` <- visual restoration    | Open draft; head fully contained | `FULLY_CONTAINED_IN_ACTIVE_HEAD` | Close without merge after bundle verification; preserve GitHub history.                                                     |

## Tags

All eight current lightweight tags resolve to commits contained in active.
Retain the seven Slice 2-6 rollback/checkpoint tags and
`hau-usc-phase3-baseline-58168ed`. Create a Phase 3.5 consolidation tag only at
the reviewed documentation checkpoint after local checks, push parity, and CI
are green.

## Preservation actions required before cleanup

1. Create a new `git bundle --all` that includes final Phase 3 commits/tag and
   every current local/remote ref; verify completeness, byte size, and SHA-256.
2. Copy the routing clone's four ignored `.codex/runtime` files to a dated
   restricted uncommitted archive, record per-file hashes and an aggregate
   manifest hash, and verify the copies.
3. Reverify both source private configurations against their restricted copies
   without printing values.
4. Record the before-state PR/ref inventory in this committed plan. Closed PRs
   remain recoverable in GitHub; deleted remote branch heads remain recoverable
   from the new bundle.

Only after all four gates pass may the safe execution actions occur.

## Local execution result

The preservation gates passed before cleanup:

- New complete-history 34-ref bundle: 1,559,241 bytes; SHA-256
  `924E52E027E40EAFB141A73C4431E0FAF0DA35432D84F36AA531E090B10BE04F`.
- Routing runtime archive: 6 source files / 6,791 bytes, zero mismatches,
  metadata aggregate SHA-256
  `548C972D309A3DFADDFB7B0A76AC6DFC53CA6102516CAA6B3174E54D0AD49535`.
- The initial wildcard copy produced zero files, correctly failed the gate with
  six mismatches, and caused no cleanup. The repaired copy was reverified before
  execution.
- Main and deployment private configuration copies match their ignored sources
  by SHA-256; values were not read or printed.

Safe execution then completed:

- `git worktree move` relocated the clean deployment dependency to
  `D:\Documents\HAU-USC Logistics System\worktrees\v1-deployment`; its HEAD,
  clean status, registration, and private-config hash remained unchanged.
- The clean redundant routing clone was removed after upstream `0 0`, exact
  remote/bundle ref, and six-file runtime archive parity were reverified.
- PR #1 and PR #2 were closed without merge after their heads were reverified as
  fully contained and bundled.
- Remote branches `agent/restore-authoritative-visual-layer`,
  `feat/apps-script-backend-and-launch-readiness`, and
  `automation/runtime-truthfulness-upload-20260713` were deleted only after the
  same containment/ref/bundle checks and are absent after fetch/prune.
- Unique PRs #3-#5, active PR #6, `main`, deployment, SDD, QR, routing, snapshot,
  and every tag remain.

Repository verification passes: governance 8 files / 14 continuation fields;
full `npm run check` 25 files / 216 tests, 28-module build, 29 Apps Script
sources / 47 functions, generated parity, two 293,406-byte artifacts, Git
integrity, bundle, manifest, structure, PR/ref, Codex-placement, and diff checks.
Checkpoint commit/push/CI, PR #6 metadata correction, and the Phase 3.5
consolidation tag remain after this local execution record.

## Safe execution matrix

- **Authorized after preservation:** move the clean deployment linked worktree
  with `git worktree move`; remove the preserved standalone routing clone;
  close PR #1 and PR #2 without merge; delete their fully contained remote head
  branches and the contained automation branch; update PR #6 title/body; create
  final structure markers and documentation.
- **Retain:** active/main/deployment/SDD/QR/routing/snapshot refs, PR #3-#6,
  every current tag, all verified backups, private config, institutional source,
  Downloads/unknown material, and both Context Vault folders.
- **Not authorized:** merge PR #6; resolve PR #3; delete unique branches;
  rewrite history; force-push; deploy; migrate; modify Apps Script, Sheets,
  Drive, Cloudflare, database, staging, or production.

## Proposed final local map

```text
D:\Documents\DOL Website GitHub\                 authoritative active checkout
D:\Documents\HAU-USC Logistics System\
|-- ACTIVE_REPOSITORY.md                          authoritative-path marker
|-- worktrees\v1-deployment\                       retained linked dependency
|-- archives\                                     historical material
|-- backups\git-bundles\                           verified all-ref bundles
|-- backups\uncommitted\                           exact uncertain-work snapshots
`-- private-config\                               restricted staging/production copies

D:\Documents\GitHub\gpt-context-vault\           separate account context authority
D:\Documents\gpt-context-vault\                  untouched older mixed-scope snapshot
D:\Documents\DOL Website\                        untouched institutional source
D:\Documents\DOL Website GitHub Backups\         retained historical/restricted backups
D:\Documents\DOL Deployment Configs\             retained private deployment config
```

The empty `repository` placeholder under the consolidation root will contain a
marker only; it must not become another checkout. The primary worktree remains
where Git, the Codex task, and existing handoff records already identify it.

## Project-scoped Codex configuration

The authoritative checkout already contains the requested active set:

- `.codex/config.toml`
- `.codex/agents/repo-mapper.toml`
- `.codex/agents/log-triage.toml`

`AGENTS.md` already requires skill-registry scanning, intent routing, Caveman
Light, cost-aware bounded delegation, and a sole parent writer. Do not copy the
legacy routing clone's config, hooks, scripts, or seven-agent roster. Removing
that duplicate clone after preservation leaves the requested active Codex set
only in the authoritative checkout.

## Main-branch and resume strategy

Do not merge or directly update `main` during consolidation. PR #6 remains the
draft cumulative integration vehicle until manager acceptance. Phase 3.5 ends
on the feature branch with a clean, pushed, CI-green documentation checkpoint
and a verified consolidation tag. No product phase or Slice 7 starts.

## Rollback

1. Verify the Phase 3.5 bundle before restoring any ref.
2. Recreate a deleted remote ref from its recorded SHA only after an owner
   decision; reopen a closed PR through GitHub if later needed.
3. Recreate the deployment worktree at its former path using
   `git worktree move`, after validating both paths.
4. Reclone the routing branch from origin or the bundle and restore its ignored
   runtime files from the restricted archive if exact reconstruction is needed.
5. Keep private configuration outside Git and restore it only through the
   restricted configuration workflow.

## Stop conditions and remaining decisions

Stop if the active or deployment worktree becomes dirty, remote state changes,
bundle/runtime-copy verification fails, a supposedly contained branch is no
longer contained, or an unexpected private/unknown path appears. No owner
decision is needed for the plan's preservation-first safe actions. Owner
acceptance remains required before any later product phase, PR #6 merge, or
cleanup of retained unique/unknown work.
