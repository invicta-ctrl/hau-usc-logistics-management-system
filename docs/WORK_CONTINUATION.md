# Work Continuation

The current block is the operator resume record. Historical release evidence remains reachable through Git history, release tags, CHANGELOG.md, and the accepted specifications; it does not override the canonical current-task chain.

## Current resume block

- **Repository/worktree:** D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system; preserve ignored local evidence and unknown work.
- **Branch/HEAD/upstream:** Resolve with `git branch --show-current`, `git rev-parse HEAD`, and `git rev-parse --abbrev-ref --symbolic-full-name @{upstream}`; the current expected source branch is maintenance/v0.7.2.1-repository-normalization, initially without an upstream.
- **Current phase/stage:** V0.7.2.1 repository work is locally verified; private staging acceptance and PR integration are blocked on an owner staging-data decision. The one-writer lock remains CODEX.
- **Accepted scope:** .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md; production mutation and v0.7.3 product work remain excluded.
- **Completed work:** Accepted governance, documentation/archive cleanup, dead-code consolidation, isolated artifacts, CI simplification, CodeQL/Renovate, staging guards, exact mail containment, and the staging identity banner are committed locally.
- **Files changed by purpose:** Canonical continuity/governance; archived historical records; source hygiene; build/deploy safeguards; staging/mail/banner implementation; focused tests; generated preview/shareable outputs regenerated from source.
- **Tests verified at current SHA:** `npm run check` passed 119 files/825 tests; browser Playwright passed 138 with 360 intentional project skips; local Worker/D1 Playwright passed 58/58; handoff/governance, link/reference, deleted-symbol, artifact-isolation, and staging/production banner checks passed.
- **Generated artifacts:** Tracked preview/shareable/Apps Script artifacts are source-generated and parity-verified; staging, production, dry-run, and local Worker artifacts use isolated output directories.
- **External actions:** Read-only GitHub/Cloudflare health and sanitized staging aggregate queries only; no provider send, staging mutation/deploy, production mutation/deploy, release, PR, push, or branch/worktree cleanup.
- **Rollback:** Preserve the maintenance commits and all recovery evidence; use a focused reviewed revert if needed, never reset or discard unknown work.
- **Blocker:** Live staging contains non-synthetic/unclassified operational rows and has no owner-approved lifecycle manifest, so backup/reset/reseed/deploy/acceptance cannot proceed.
- **Next three actions:** Obtain the owner disposition or new isolated D1 authority; complete fresh backup and isolated restore/lifecycle reseed proof; run staging acceptance and protected PR integration.
- **Resume commands:** git status --short --branch; git rev-parse HEAD; npm run handoff:verify; npm run check:governance.
- **Prohibited actions:** Do not mutate production; do not reset/seed/deploy current staging; do not expose private paths/IDs/addresses; do not alter migrations, ledgers, history, evidence, protected identities, remote Git, or protected worktrees before the documented gates pass.
