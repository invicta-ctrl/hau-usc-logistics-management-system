# Isolated Staging Playground

Status: active release architecture after `v0.8.0`
Accepted authority: `.codex/specs/active/isolated-staging-playground-and-git-governance.md`

## Safety contract

The Isolated Staging Playground is a deployment environment, never a Git branch. Its mutable Worker, D1, and R2 resources are distinct from production. The ordinary playground Worker is bound only to its working D1 and working R2 buckets; sealed baseline R2 resources are not runtime bindings.

Data flow is one way:

```text
production truth -> verified privacy-filtered clean baseline -> playground working state
playground -X-> production
```

The initial baseline is `EXCEPTIONS`, not byte-identical parity. Production credentials, sessions, tokens, protected identity-roster payloads, private evidence objects, transient provider/rate-limit state, and direct personal/contact values are excluded or deterministically pseudonymized. Synthetic staging tester accounts are overlaid privately. Schema, migration, record relationships, safe row counts, inventory truth, ledger totals, and approved public brand assets remain reconcilable.

Provider/email delivery and scheduled backup jobs are disabled in playground. This prevents email sends and Google writes during testing.

## Working-state model

- `CLEAN`: working D1/R2 match the sealed clean baseline contract.
- `ACTIVE`: Earl has an active manual test session.
- `DIRTY`: a successful playground mutation occurred; this is expected working divergence.
- `RESETTING`: an owner-approved reset is queued or running.
- `REFRESHING_BASELINE`: an owner-approved production-derived refresh is queued or running.
- `ERROR`: an operation failed closed and requires operator reconciliation.

The private console shows safe short candidate, production, baseline, schema, D1/R2 parity, and working-state identities. It exposes no provider UUID, real bucket/database name, recovery bookmark, secret, PII, or private object key.

## Reset Workspace

`Reset Workspace` discards playground test mutations without changing Git, production, the clean baseline, or recovery evidence.

1. Owner enters `RESET PLAYGROUND` in the private playground console.
2. The server proves the runtime is `STAGING + PLAYGROUND_MODE + ISOLATED_STAGING_PLAYGROUND` and records a fixed-target operator request.
3. The operator runs `scripts/playground/reset-workspace.mjs` with the private resource manifest and a new private report path.
4. The tool proves the manifest D1 matches the authenticated provider inventory, captures a reversible pre-reset bookmark, restores the sealed playground bookmark, reconciles working brand R2 from sealed brand baseline, and clears playground-only working evidence.
5. Schema, migration, foreign keys, reset-probe absence, R2 count/content identity, metadata, and empty working evidence are reverified.

The browser never supplies a database ID or bucket name. The reset Worker has no production binding and is removed immediately after reconciliation.

## Refresh Baseline From Production

This action is separate from reset and requires `REFRESH BASELINE FROM PRODUCTION`. An `ACTIVE` or `DIRTY` test session is protected unless the owner explicitly selects discard.

The operator sequence is:

1. Preserve the current clean baseline, current working recovery point, deployed playground version, and private manifest.
2. Read-only export current accepted production D1 and current staging tester fixtures.
3. Run `scripts/playground/create-clean-baseline.mjs` to create a new private privacy-filtered baseline and prove local integrity/FK/schema/migration.
4. Create replacement playground-only D1/baseline/working resources with `scripts/playground/provision-resources.mjs`.
5. Copy only approved production brand objects one way; omit production private evidence.
6. Verify replacement D1/R2 and capture a new clean playground Time Travel bookmark.
7. Generate a new private candidate config, deploy the exact candidate, run acceptance, and only then retire the prior playground resource set under a separately recorded cleanup decision.

Failure leaves the prior baseline and working environment intact. No reverse synchronization exists.

## Candidate and production path

Every production-bound change after `v0.8.0` uses:

```text
one temporary release/fix/hotfix branch
-> focused checks
-> exact frozen commit/tree/artifact
-> automatic playground deployment
-> automated acceptance
-> WAIT FOR EARL
-> Earl explicit GO for that exact candidate
-> accepted main tree/artifact equivalence
-> production preflight/backup/deploy
-> smoke and reconciliation
-> rotate recovery pointers
-> refresh playground baseline
-> delete temporary branch
```

`.github/workflows/release-candidate.yml` stops after playground acceptance. It has no production job and no workflow-run continuation. Any code change invalidates Earl's approval.

Ordinary branch pushes are WIP and do not deploy. An operator freezes a candidate by dispatching the workflow with the exact 40-character branch-tip commit and the matching temporary branch name. The workflow re-verifies that identity, runs the repository gates, and then deploys automatically to the playground.

## Recovery-pointer rotation

Rotation is deterministic and is refused until production smoke and reconciliation are accepted:

```text
old regression/r2          -> regression/r3
old regression/r1          -> regression/r2
old backup/last-known-good -> regression/r1
old accepted main          -> backup/last-known-good
new accepted release       -> main
```

`scripts/playground/branch-governance.mjs` encodes and tests this mapping. Never rotate because a PR merely merged.
