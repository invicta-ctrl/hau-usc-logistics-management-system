# V0.8.1 S10 Rollback and Release-Candidate Evidence Boundary

- **Status:** `V81-S10_BOUNDARY_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **State:** `ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Objective:** Rollback and release-candidate evidence complete.
- **Canonical branch:** `release/v0.8.1-final-stabilization`
- **Boundary baseline:** `d4449d60340e55ee7317a3a14eedf910f7f0516a`
- **Boundary tree:** `abb007a566f13f54cee032c19d7af5042294ea2d`
- **Package version:** `0.8.1`
- **S09 durable state:** local, upstream, and live remote are equal at the boundary baseline; divergence is `0/0`, tracked and staged counts are `0/0`, and preserved46 remains untouched.
- **Sol acceptance:** `PASS`
- **Luna S10 boundary review:** `PASS_NO_P0_P1_P2_P3`
- **Review timestamp:** `2026-08-12T06:05:49.9949725+08:00`
- **Review state:** accepted and uncommitted, ready for one final fresh packet audit; no S10 evidence execution is authorized before Sol accepts that final packet and the exact four-path governance packet is committed, normally pushed, and verified at parity.

## Accepted boundary

This packet advances only from durable S09 acceptance into the S10 evidence boundary. S10 makes no source or test edit. Its exact outcome is rollback and release-candidate evidence complete, with private operating detail retained outside Git and only sanitized control results eligible for later governance recording.

The only repository paths writable while materializing and later closing this boundary are:

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`
- `.codex/releases/v0.8.1/V0_8_1_S10_ROLLBACK_RELEASE_CANDIDATE_EVIDENCE.md`

No S10 source, test, workflow, generated artifact, dependency, package-lock, schema, or configuration file in the repository is writable. Any defect requiring such a change stops for a separately accepted amendment.

## Post-persistence evidence execution

Only after fresh Luna review, Sol acceptance, exact four-path governance commit and normal push, and local/upstream/live-remote parity may the S10 evidence run begin. The owner directive supplies continuing authority for the following accepted operations without another owner phrase:

1. Run focused local unit, syntax, lint, formatting, governance, and static-contract checks against the exact pushed S10 boundary candidate.
2. Resolve and read the existing private staging and Production configurations and their authorization packages.
3. Create immutable, never-overwritten S10 evidence files outside Git. Private paths, provider identifiers, credentials, bookmarks, exports, restored databases, and raw provider output remain outside repository evidence.
4. Perform only the minimum read-only Cloudflare operations required by the accepted evidence scripts: exact D1 inventory, R2 bucket metadata, Worker deployment history, D1 Time Travel information, and remote D1 export.
5. Restore each export only into an isolated local SQLite database outside Git for integrity, schema, migration, and reconciliation proof. No restore targets a live database.

If an existing private configuration does not already match the exact candidate, stop rather than overwrite it or improvise configuration changes. Any separately accepted candidate-scoped private replacement must be immutable, outside Git, and validated before provider access.

## Clean evidence checkout

The canonical worktree retains preserved46 and must remain untouched. `scripts/staging-candidate-evidence.mjs` rejects any nonempty Git status, while the accepted identity guard also rejects a literal detached `HEAD` because the current branch must equal private `CANDIDATE_BRANCH`.

Therefore S10 evidence must run from a disposable independent clean clone/evidence checkout, operationally isolated from the canonical writer but attached to its own `release/v0.8.1-final-stabilization` branch at the exact pushed S10 boundary candidate. It must have a configured upstream at that same commit, tracked/staged/untracked counts `0/0/0` before evidence, and no copied preserved artifacts. This strategy creates no linked-worktree branch collision and no canonical ref mutation. Provider scripts must continue to leave that evidence checkout clean because every generated export, restore, and manifest path resolves outside Git.

## Release identity and backup tuple

Before any provider inventory call:

- `package.json` is the only release-version authority and must equal `0.8.1`.
- The evidence checkout branch and private `CANDIDATE_BRANCH` must be equal and match `^(release|fix|hotfix)/v0\.8\.1-[A-Za-z0-9][A-Za-z0-9._-]*$`.
- Private `APP_VERSION` must equal `0.8.1`.
- Private `CANDIDATE_SHA` must equal exact evidence-checkout `HEAD`.
- Staging and Production configuration must remain separated, and every named D1, R2, Worker, route, and environment identity must match its intended target without crossover.
- The staging authorization package must validate and explicitly approve `cloudflareRead` and `d1Backup`.
- The Production authorization package must validate and explicitly approve `productionBackup`.

Each staging and Production backup tuple must prove:

- a SHA-256 for the exported database;
- isolated-restore `integrity_check` PASS;
- foreign-key violations `0`;
- operational schema `30` and latest migration `0030_production_access_and_operations.sql`;
- inventory reconciliation disposition `RECONCILED`;
- a prior Worker deployment and deployment-history snapshot;
- exact R2 metadata and configuration fingerprints;
- a present, nonempty D1 Time Travel bookmark.

The Production tuple additionally requires active synthetic Production accounts `0`. Staging test data is never promoted to Production.

## Focused commands after persistence

The accepted local focused suite is:

```powershell
npx.cmd --no-install vitest run tests/unit/release-pipeline.test.js tests/unit/staging-sandbox.test.js tests/unit/staging-sandbox-lifecycle.test.js tests/unit/production-authorization.test.js tests/unit/production-launch-preflight.test.js
```

Run `node --check`, ESLint, and Prettier only across the exact S10 release/preflight/rollback scripts and tests inspected by this boundary. Also run `npm.cmd run handoff:verify`, `npm.cmd run check:governance`, `git diff --check`, the privacy and duplicate/common-field checks, and prove no retired executable release literal or drift in `.github/workflows/release-candidate.yml`, `scripts/playground/**`, or `package-lock.json`.

With only sanitized placeholders shown here, the two accepted live evidence commands are:

```powershell
npm.cmd run staging:candidate:evidence -- --staging-config <ABS_PRIVATE_STAGING_CONFIG> --production-config <ABS_PRIVATE_PRODUCTION_CONFIG> --authorization <ABS_PRIVATE_STAGING_AUTHORIZATION> --private-dir <ABS_PRIVATE_S10_EVIDENCE_DIR>
```

```powershell
npm.cmd run production:recovery:evidence -- --staging-config <ABS_PRIVATE_STAGING_CONFIG> --production-config <ABS_PRIVATE_PRODUCTION_CONFIG> --authorization <ABS_PRIVATE_PRODUCTION_AUTHORIZATION> --private-dir <ABS_PRIVATE_S10_EVIDENCE_DIR> --manifest <ABS_PRIVATE_PRODUCTION_BACKUP_MANIFEST>
```

Only safe booleans, counts, schema/migration labels, candidate SHA, cryptographic digests, and sanitized disposition labels may be copied into the later S10 closeout packet.

## Explicit exclusions

S10 authorizes no deployment, migration, staging seed/reset, provider mutation, live-database restore, R2 write, recovery-pointer change, source/test edit, release-manifest generation, or ref mutation. It does not run `deploy-environment.mjs`, even with `--dry-run`, because that rebuilds repository artifacts. It does not run staging candidate smoke or `tests/staging-e2e/staging-auth-access.spec.js`; those can create sessions or operational fixtures and remain required only at their later governed Playground/preflight gate. It does not perform live Production launch preflight or Production authorization for deployment.

`.github/workflows/release-candidate.yml` remains Playground-only, contains no Production job, retains `WAIT FOR EARL`, and is read-only. `scripts/playground/**` and `package-lock.json` remain unchanged.

## Stop conditions

Stop before or during S10 evidence on any of the following:

- canonical or evidence-checkout branch, HEAD, tree, upstream, remote, cleanliness, preservation, capture, lock, or writer drift;
- missing, malformed, stale, or non-private configuration, authorization, credential, or evidence destination;
- package/branch/`CANDIDATE_BRANCH`/`APP_VERSION`/`CANDIDATE_SHA` mismatch;
- unexpected environment/resource identity or staging/Production crossover;
- missing approval for the exact read/export action;
- absent or empty Time Travel bookmark or missing prior Worker deployment;
- export, hash, isolated restore, integrity, foreign-key, schema, migration, reconciliation, fingerprint, or R2 proof failure;
- any active synthetic Production account;
- private data in Git, console evidence, or sanitized governance records;
- any provider mutation, deployment, migration, seed/reset, live restore, pointer change, ref action, or unapproved path;
- any new P0/P1, more than the accepted bounded attempts, or a need to change source/test behavior.

## Current boundary and exact next action

This record is `ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`. No clone, private-file access, provider call, stage, commit, push, or S10 evidence execution has occurred during acceptance materialization.

**NEXT_EXACT_ACTION:** Run one final fresh read-only Luna audit of the exact four accepted S10 boundary-governance paths; only after Sol accepts that final packet, stage and commit exactly `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, and `.codex/releases/v0.8.1/V0_8_1_S10_ROLLBACK_RELEASE_CANDIDATE_EVIDENCE.md`, normally push, verify local/upstream/live-remote parity and preserved46, and only then execute S10 rollback/release-candidate evidence in the independent clean branch-tracking clone; no source/test edit, deployment, migration, seed/reset, live restore, R2 write, recovery-pointer change, staging smoke/auth E2E, release-manifest generation, provider mutation, or canonical ref action.
