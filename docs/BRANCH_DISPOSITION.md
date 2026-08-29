# Git Branch Disposition

Status: permanent `Playground` established; preservation-gated historical-ref retirement active.

## Target policy

Exactly two permanent functional branches remain after preservation gates pass:

- `main` — canonical Production source lineage.
- `Playground` — canonical isolated Playground/demo/testing source lineage.

Temporary branches target exactly one permanent branch and use the owner-approved `work|fix|reconcile/playground-*` or `work|fix|hotfix/main-*` forms. Multiple temporary branches require proven isolation or explicit sequencing.

## Current reconciliation inventory

The exact evidence and disposition for every current local/remote branch and worktree is recorded in `.codex/PLAYGROUND_MASTER_RECONCILIATION_MANIFEST.md`. No historical or recovery ref is deletion-eligible at P00/P01.

Current decisions:

- `Playground` is the canonical isolated Playground/demo/testing source lineage. It was established from the accepted `reconcile/playground-master` lineage only after P31 candidate acceptance and proof that no prior local or remote `Playground` ref existed.
- Retire `reconcile/playground-master` only after `Playground` remote parity is proven; its complete history is then preserved by `Playground`.
- Preserve `main` unchanged; its two known governance-only working-tree files remain outside this worktree.
- Preserve retired frontend design history at `archive/p33-frontend-design-integration-20260829` and divergent post-FI17 design history at `archive/p33-post-fi17-design-pass-20260829`; do not broad-merge either lineage.
- Preserve the former rotating recovery pointers at `archive/p33-backup-last-known-good-20260829` and `archive/p33-regression-r1-20260829` through `archive/p33-regression-r3-20260829`.
- Preserve former backend, v0.8.3 FI12/frontend-design, and v0.8.4 histories at their exact `archive/p33-*` tags recorded in the P33 checkpoint.
- Preserve detached completed worktree contents in place, including frontend `.ai-bridge/` and `.local/` residue and governance-only dirty files. Branch retirement never authorizes cleaning or removing those worktrees.

## Retirement gate

Before any branch ref is deleted:

1. record exact head/tree and merge-base;
2. classify unique commits and task-relevant paths;
3. preserve unique history with an immutable verified artifact;
4. clear deployment, workflow, tool, and durable-document dependencies;
5. record the accepted disposition;
6. pass `validateLegacyBranchRetirement`;
7. delete only the exact authorized ref and verify it is absent.

P32 authorizes retirement only of the temporary `reconcile/playground-master` ref after permanent-branch parity. Every other ref remains subject to the P33 per-ref preservation gate.
