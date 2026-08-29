# P33 Historical Branch Retirement

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_ONLY_MAIN_AND_PLAYGROUND_BRANCH_HEADS_REMAIN
ROUTE: SOLO

## Preservation method

Every retired lineage was identified by exact head and tree. Unique history was counted relative to both permanent branches. An annotated `archive/p33-*` tag was created at every exact retired head, pushed to `origin`, and verified by its peeled commit and tree before any branch deletion. Historical design references remain evidence; operational design, routing, continuation, policy, and tracker documentation now targets permanent `Playground` or the exact archive tag.

| Retired branch | Head | Tree | Unique commits outside `main` + `Playground` | Immutable preservation tag |
| --- | --- | --- | ---: | --- |
| `backend/r3-a1-a2-b1` | `03cd7094f7c9a60dc8858d0a3318647957c8e483` | `ca4a53cc19f44691febef0f99c3bdebf45e7fe64` | 1 | `archive/p33-backend-r3-a1-a2-b1-20260829` |
| `backup/last-known-good` | `a2d205c3dbe93e56bf448fca14304351ee54b068` | `739b74c6816279279d817a86d96f4b01fa9ad9e3` | 0 | `archive/p33-backup-last-known-good-20260829` |
| `frontend-design-integration` | `5412faebb5bab0f4e67f60ab8c613241c0c49082` | `69c0fb2ee5151821eadcde57bf350fd713112c3a` | 32 | `archive/p33-frontend-design-integration-20260829` |
| `local/post-fi17-design-pass-20260828` | `12a206d6d064d61b6d2c3552e34b58476129a313` | `cdcab1099e54514391ed8b31d80855066974d3ad` | 38 | `archive/p33-post-fi17-design-pass-20260829` |
| `regression/r1` | `f3addc1e55711641f5977a80c84e844c88f68dff` | `03679fe5b8c1e4b1d8280b4797a683f0fdff67ee` | 0 | `archive/p33-regression-r1-20260829` |
| `regression/r2` | `b08653f02a7461084a4a34dfae1de67d5cb8ca57` | `0c1b2caeba23f6f3ac873d00e243cf0d4d7987a4` | 0 | `archive/p33-regression-r2-20260829` |
| `regression/r3` | `84eacfcdb47a3985fed48e3ba14bb413946d4410` | `46ebefa4da40f29d32f69398fd80ef5703a7de0d` | 0 | `archive/p33-regression-r3-20260829` |
| `release/v0.8.3-fi12-playground` | `631724a5f32a49b9dcf45eec5a894aa7baf66266` | `9dd5ee8c6d1f92bd72f762bbb5a790616d58a3f3` | 0 | `archive/p33-fi12-playground-20260829` |
| `release/v0.8.3-frontend-design-integration` | `06836f3ec6e1ab9c6990c517fb870ef0a582b2dc` | `efef653906fe0ff0df28726eaa1b5885b9443b46` | 20 | `archive/p33-v083-frontend-design-20260829` |
| `release/v0.8.4-live-operations-performance` | `b8d1ec0f7eddb4ce927024618c607a3c07551a1a` | `a993c00456545b8c022d384e90e73c1dc2de820c` | 7 | `archive/p33-v084-live-operations-20260829` |

## Worktree preservation

Four completed, no-writer worktrees still occupied retiring branches. Each was detached at the exact archived head before branch deletion:

- backend worktree: two preexisting modified governance files preserved;
- FI12 candidate worktree: clean and preserved;
- frontend design worktree: preexisting `.ai-bridge/` and `.local/` residue preserved;
- v0.8.4 worktree: two preexisting modified governance files preserved.

No worktree was removed, cleaned, reset, or rewritten. Detachment changed only branch attachment metadata and left all tracked/untracked content intact.

## Deletion and verification

- Deleted the eight exact obsolete local branch refs.
- Deleted the ten exact obsolete remote branch refs.
- Verified each retired local/remote branch absent.
- Verified every archive tag exists locally and remotely and peels to the recorded head/tree.
- Verified the only local branch heads are `main` and `Playground`.
- Verified the only remote branch heads are `main` and `Playground`.
- Verified `main` remains `f7e5bf83205dbe58b5fb72126a4456747d92e906`.
- Verified `Playground` remote parity before this checkpoint.
- Production, provider data, Google, email, schedules, and Figma mutation: NONE.

## P34 handoff

Compact the durable operator documentation without creating a second status system. Preserve branch governance, Playground purpose/environment rules, reset runbook, baseline/version record, theme guide, UI language guide, known nonblocking residuals, and the exact final candidate receipt. Update the three current pointers and stop at `READY_FOR_EARL_MANUAL_ANNOTATION`.
