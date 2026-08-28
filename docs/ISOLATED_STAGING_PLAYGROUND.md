# Isolated Staging Playground

Status: active release architecture after `v0.8.0`
Accepted authority: `.codex/specs/active/isolated-staging-playground-and-git-governance.md`

## Safety contract

The Isolated Staging Playground is the deployment mapped only from the permanent `Playground` source branch after candidate acceptance. Its mutable Worker, D1, and R2 resources are distinct from Production. The ordinary Playground Worker is bound only to its working D1 and working R2 buckets; sealed baseline R2 resources are not runtime bindings. The branch name is not trusted as a security boundary.

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
5. Schema, migration, foreign keys, reset-probe absence, R2 count/content identity, metadata, zero transient rows, and approved redacted-evidence linkage are reverified.

The browser never supplies a database ID or bucket name. The reset Worker has no production binding and is removed immediately after reconciliation.

After reset, prove the prior temporary session is rejected before entering a new demo session. Run critical route smoke, remove the temporary session, and return the working-state marker to `CLEAN` only after D1/R2 parity, generation, foreign keys, evidence linkage, and zero transient rows pass. POST-shaped read endpoints may conservatively mark a Playground session dirty; this marker reconciliation is not a second reset and must never be used to conceal changed D1/R2 data.

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

## Candidate and Production paths

Playground-bound work uses an isolated `work/playground-*`, `fix/playground-*`, or `reconcile/playground-*` branch. After exact candidate acceptance, that lineage establishes or updates permanent `Playground`. Production-bound work uses an isolated `work/main-*`, `fix/main-*`, or true urgent `hotfix/main-*` branch and still requires Earl's separate explicit Production GO.

```text
temporary branch
-> focused checks
-> exact frozen commit/tree/artifact
-> isolated Playground deployment
-> automated acceptance
-> Earl manual testing
-> accepted permanent target lineage
-> retire the temporary branch after parity and preservation proof
```

`.github/workflows/release-candidate.yml` stops after Playground acceptance. It has no Production job and no workflow-run continuation. Any code change invalidates Earl's approval.

Ordinary branch pushes are WIP and do not deploy. An operator freezes a candidate by dispatching the workflow with the exact 40-character branch-tip commit and matching Playground-targeted temporary branch name.

## Legacy branch preservation

The former rotating recovery-pointer model is superseded. Existing recovery/design/release refs remain until exact head/tree, unique history, immutable recovery evidence, and live branch-name dependencies are reconciled. `scripts/playground/branch-governance.mjs` enforces the two permanent branches, exact temporary targets, concurrency isolation, and preservation-gated legacy retirement.
