# Project Status

## Active maintenance state

- **Milestone:** V0.7.2.1 Repository Normalization and Permanent Staging Sandbox.
- **Branch/HEAD:** maintenance/v0.7.2.1-repository-normalization at `GIT_HEAD`; resolve the exact commit during the Git handshake.
- **Writer:** CODEX holds the one-writer lock while the accepted milestone is blocked on an owner staging-data decision.
- **Authority:** .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md.
- **State:** Repository normalization and local safeguards are implemented and verified; live staging reset/deploy is stopped before mutation because operational rows are non-synthetic or unclassified.
- **Next exact action:** Obtain owner-approved disposition for the current staging rows or authorize a new isolated staging D1, then complete backup/restore, lifecycle reseed, staging acceptance, and protected PR integration.

## Verified release baseline

The canonical release remains v0.7.2 at 84eacfcdb47a3985fed48e3ba14bb413946d4410. Gate 0 recorded staging and production application version 0.7.2, schema 30 / migration 0030, readiness, protected configuration, and the canonical release SHA. This maintenance batch does not authorize production or provider mutation.

## Boundaries and evidence

- Production resources, bindings, data, runtime, recovery state, and the v0.7.2 tag are immutable for V0.7.2.1.
- Staging work must stay synthetic, isolated, fail-closed, and separately verified under the accepted specification.
- Seed/reset commands remain non-mutating until an owner-reviewed lifecycle manifest, fresh backup, and isolated restore proof exist.
- Runtime release evidence may be reused only while source, generated artifacts, configuration, and external state remain unchanged.
- Detailed historical release records remain in Git history, release tags, the append-only CHANGELOG.md, and preserved documentation; they do not override the current continuity chain.

## Resume

Start with AGENTS.md -> .codex/CURRENT.md -> .codex/CURRENT_TASK.md -> .codex/CURRENT_HANDOFF.md, then read the named policy and accepted specification. Run npm run handoff:verify before accepting or transferring a worktree state.
