# v0.7.0 Phase 27 Branch Consolidation Handoff

Decision: **ACCEPTED**

## Canonical baseline

- The accepted consolidation was merged normally into `main` at
  `dc98d670fdd63f649037616c5a2d51e5c62ca4ae` without force-push or history
  replacement.
- The merge tree is identical to the accepted Phase 27 candidate tree.
- The old `main` commit `91a30ee2de015bce1471a2d4fd71d9325af3e936`
  is preserved by annotated tag `archive/pre-v0.7.0-main-91a30ee`.
- A private all-ref bundle preserves 28 refs and detached accepted work; it is
  16,488,539 bytes with SHA-256
  `d902494d9f8050334523288b6534f7d4d1b137bc9b6d2d0d7bed7b55a18bd956`.

## Pull-request disposition

- PR #9 was verified at its expected head, made ready, and normally merged.
- PR #8's unique compatibility policy is contained verbatim in the release.
- PRs #1, #2, #6, and #7 are contained; PRs #3–#5 are superseded or retained
  historical work.
- PR #10 remains `UNKNOWN_REQUIRES_REVIEW`, open, separate, and unmodified. It
  is not part of v0.7.0.
- No unknown branch, worktree, `.codegraph/`, or untracked work was deleted.

## Verification

- Post-merge `main` CI passed the required verification and browser-smoke jobs.
- Staging was redeployed from exact merge `dc98d67` and returned five
  consecutive exact identity/readiness probes on schema 29 / migration 0029.
- The private production package was rebound to the exact merge and passed
  resource-separation, authorization, secret, Google, backup, and dry-run
  preflights before production launch.

Future branches start from `main` and merge only through a current, green pull
request. Force-push and branch deletion remain prohibited.
