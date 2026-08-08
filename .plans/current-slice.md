# Current Slice

MILESTONE: V0.7.2.1 Repository Normalization and Permanent Staging Sandbox
STATUS: BLOCKED - owner staging data disposition required
BRANCH: maintenance/v0.7.2.1-repository-normalization
BASE_SHA: 7f4eb25eac915a3a98453b4cda8df01ca4dbaf8c
HEAD: GIT_HEAD
ACTIVE_WRITER: CODEX
ACCEPTED_SPEC: .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md

## Scope

Complete the accepted V0.7.2.1 repository normalization and fail-closed staging safeguards without changing production. Repository implementation is locally complete; private staging recovery/reset/reseed/deployment and PR integration remain stopped.

## Acceptance

- Local repository gates, browser acceptance, local Worker/D1 acceptance, generated parity, isolated artifact builds, and banner/mail safety checks pass.
- Live staging has only classified synthetic rows, a fresh backup restores in isolation, lifecycle reseed preserves immutable history, and exact-SHA staging acceptance passes.
- A fresh Sol review has no unresolved P0/P1; exact-head CI/CodeQL and the protected maintenance PR pass.
- `docs/WORK_CONTINUATION.md` and the canonical four-file chain state the exact same blocker and next action.

## Stop conditions

Stop for non-synthetic/unclassified staging rows, missing owner lifecycle authority, missing backup/restore proof, private-value exposure, production crossover, exact-resource mismatch, unexpected dirty overlap, or any unresolved P0/P1.

## Next exact action

Obtain owner-approved disposition for the current staging rows or authorize a new isolated staging D1; then complete backup/restore, lifecycle reseed, staging acceptance, and protected PR integration.
