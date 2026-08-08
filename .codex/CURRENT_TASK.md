# Current Bounded Task

INTENT: REPOSITORY_MAINTENANCE + ARCHITECTURE + TESTING + DEPLOYMENT + COMMUNICATION
OBJECTIVE: Execute the accepted V0.7.2.1 repository normalization and permanent staging sandbox program without changing production.
TARGET: `maintenance/v0.7.2.1-repository-normalization`
AUTHORITATIVE SOURCES: `AGENTS.md`; `.codex/CURRENT.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md`
SKILLS: PDF, LeanCtx, GitHub, Cloudflare Deploy; Serena and CodeGraph repository tooling

## In scope

- Commit the accepted specification and writer lock.
- Normalize governance, continuity, status, documentation, validators, and references.
- Apply only the approved dead-source/export cleanup.
- Enforce preview-only tracked artifacts and isolated non-preview builds.
- Simplify duplicated CI and integrate CodeQL/Renovate from PR #10.
- Implement staging status/seed/reset guards, deterministic synthetic data, banner, and exact-recipient email containment.
- Run focused and complete verification, one final Sol review, protected-PR integration, safe branch/worktree cleanup, and fresh-session continuity acceptance.

## Out of scope

- V0.7.3 product features, broad redesign/refactor, schema/migration changes, production deployment or data mutation, production PII cloning, and protected dirty design-worktree mutation.

## Constraints

- One writer: Codex owns the maintenance branch; delegated implementation must use non-overlapping ownership and return control before another writer begins.
- Preserve secrets, private configuration, protected identities, migrations, ledgers, audit/history/evidence, backups, rollback records, release refs, and unknown work.
- Staging writes remain fail-closed behind exact private configuration, production-binding rejection, synthetic-row proof, backup/restore proof, and accepted tests.
- Do not repeat the completed Luna audit round.

## Deliverables

- Clean canonical governance and documentation.
- Deterministic build/CI behavior and approved source cleanup.
- Repository-native permanent staging sandbox with production guard and email containment.
- Merged maintenance PR, truthful cleanup record, and V0.7.3-ready continuity packet.

## Verification

Follow the exact acceptance section of the accepted specification. Record each expensive result with SHA, artifact/config identity, result, and invalidator.

## Stop conditions

Stop on any condition listed in the accepted specification, especially environment identity mismatch, production crossover, non-synthetic staging state, missing recovery proof, privacy/auth uncertainty, unknown dirty work, migration need, immutable-record regression, or unresolved P0/P1.
