# Accepted Owner Amendment — Immediate FI-13 to FI-17 Playground Migration

STATUS: ACCEPTED
ACCEPTED_BY: Earl, through the explicit instruction to execute the supplied 2026-08-28 amendment
ACCEPTED_ON: 2026-08-28 Asia/Manila
SOURCE_PROMPT: `D:/Download/HAU_USC_FM_FI13_FI17_Immediate_Migration_Owner_Amendment_2026-08-28.md`
PROGRAM: HAU-USC Logistics frontend migration
TARGET: `release/v0.8.3-fi12-playground` and the existing Isolated Staging Playground
PRODUCTION: MUTATION FORBIDDEN

## Objective

Freeze the exact completed FI source and current FM/Playground rollback state, migrate only the missing frontend delta through FI-17 plus accepted post-FI17 recovery, preserve FM's backend-backed and resettable operational implementation, deploy the exact resulting candidate to the existing isolated Playground, run targeted migration verification, and stop.

## Accepted source and destination identities

- FI continuity HEAD/tree: `5412faebb5bab0f4e67f60ab8c613241c0c49082` / `69c0fb2ee5151821eadcde57bf350fd713112c3a`.
- FI product source/tree: `3da03dcc78caafe144afbe02fc09197979bce0a3` / `4d9c6f40625fd738530e22347597ead1ce787017`.
- FM starting HEAD/tree: `9ef5ba06a2f46af6081e8e901dfa718c4ddbfbc1` / `9d8abf4df3a266dcb660a029a1e2d5c738dccc76`.
- Current deployed Playground source/tree: `afd63d36e9dee9e865a0ff1fc02e3d0d0166fc4f` / `cb168f37a98215bf26982b92efeac9b3bed90eb0`.
- Current deployed artifact SHA-256: `8b714bd08e9a93d10a29a0126edc6dc76b9ef536746d374dc4ad3dc2b0f42ae4`.

Clean continuity commits may advance these identities only when the newer exact identities are recorded. Unknown tracked product work, unexplained divergence, or a conflicting writer remains a stop condition.

## In scope

1. Freeze the current FM deployment as rollback and the current FI product source as migration source.
2. Determine the missing delta through deterministic Git/file comparison; do not replay slice commits blindly.
3. Adopt accepted FI frontend completion, including post-FI17 Overview and hero-motion recovery.
4. Preserve FM's real Playground Worker/API wiring, backend adapters, authenticated behavior, reset tooling, D1/R2 isolation, privacy-filtered baseline, CSP-compatible assets, environment markers, deployment tooling, and reconciliation tooling.
5. Resolve mixed files by preserving FM operational/data truth while adopting newer accepted FI frontend behavior.
6. Rebuild generated artifacts; run focused checks and `npm run check:release-candidate` once on final source.
7. Deploy only that exact candidate to the existing Isolated Staging Playground.
8. Run targeted landing, hero, Overview, authenticated-route, schema, migration, isolation, and non-mutation smoke.
9. Record the completed migration receipt and continuity state.

## Out of scope

- Production deployment, main promotion, Production D1/R2 writes, new schema or D1 migration, Google writes, provider sends, new provider resources, new Playground resources, Figma/Make mutation, Hallmark, Impeccable, broad visual audit, FI-00 to FI-12 re-audit, FM-R00 to FM-R11 repetition, redesign, backend redesign, baseline repopulation, unnecessary reset, and FI-18.
- Deleting, resetting, rewriting, or discarding unknown work.
- Writing the FI source worktree from the FM lane.

## Merge rule

```text
preserve FM operational/backend/data truth
+ adopt newer FI frontend/UI behavior
+ preserve authorization and privacy boundaries
```

Generated artifacts must be rebuilt from accepted source rather than adopted as hand-edited output.

## Verification and deployment

- `git diff --check` and focused tests for changed/conflicted files.
- Required staging/production-mode frontend build and deploy-artifact verification.
- `npm run check:release-candidate` once after final candidate source is frozen.
- Exact source, tree, artifact, branch, Playground binding, Production-denial, and rollback preflight before upload.
- Targeted Playground smoke for landing, hero, Overview, Inventory, Request Hub, Lending, Release, Restocking, Procurement, Events, Administration, and Profile.
- Prove environment `STAGING`, schema `32`, migration `0032_staff_account_activity_history.sql`, no new migration, existing isolated D1/R2 tuple, retained reset baseline, and zero Production/Google/provider writes.

## Stop conditions

Stop for a conflicting FM writer, unpreservable unknown tracked work, incomplete or unaccepted FI source, a required new schema migration, required Production mutation, unprovable Playground/Production isolation, missing rollback identity, an invariant-weakening conflict that cannot be resolved in scope, or an unrepaired migration P0/P1.

## Completion boundary

Completion is the current FI frontend running against the accepted FM Playground backend with post-FI17 Overview/hero recovery included, existing schema/reset baseline preserved, no Production crossover, no open migration P0/P1, and durable closeout records. Stop before Production promotion or another audit program.
