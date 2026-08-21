# V0.8.1 S10 Rollback and Release-Candidate Evidence Boundary

- **Status:** `V81-S10_EVIDENCE_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **State:** `ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Objective:** Rollback and release-candidate evidence complete.
- **Canonical branch:** `release/v0.8.1-final-stabilization`
- **Pushed boundary commit:** `bb65250699c35546b476b41365dc0370224f349d`
- **Pushed boundary tree:** `f73224c8d2ebe38174d2c7f119ec243ef0aaef98`
- **Pushed boundary parent:** `d4449d60340e55ee7317a3a14eedf910f7f0516a`
- **Pushed tooling-amendment commit:** `d94b25e485ea4bd317b82ff9cef0d846369a078c`
- **Pushed tooling-amendment tree:** `b1a51666625b6881db15e00a1e6020c4d162ddf4`
- **Pushed tooling-amendment parent:** `bb65250699c35546b476b41365dc0370224f349d`
- **Package version:** `0.8.1`
- **Operational-candidate durable state:** canonical, upstream, live remote, and the clean branch-tracking evidence clone are equal at the pushed tooling-amendment commit; divergence is `0/0`, canonical tracked and staged counts are `0/0`, clone status is `0`, and preserved46 remains untouched.
- **Sol acceptance:** `PASS`
- **Luna S10 boundary review:** `PASS_NO_P0_P1_P2_P3`
- **Review timestamp:** `2026-08-12T06:05:49.9949725+08:00`
- **Amendment recorded at:** `2026-08-12T06:36:12.6279493+08:00`
- **Sol tooling-amendment acceptance:** `PASS`
- **Fresh Luna tooling-amendment review:** `PASS_NO_P0_P1_P2_P3`
- **Amendment review timestamp:** `2026-08-12T06:50:40.4383281+08:00`
- **Amendment durable state:** governance committed, normally pushed, and verified at local/upstream/live-remote parity.
- **Sol S10 evidence acceptance:** `PASS`
- **Fresh Luna S10 evidence audit:** `PASS_NO_P0_P1_P2_P3`
- **Evidence review timestamp:** `2026-08-12T07:48:26.0402494+08:00`
- **Evidence acceptance state:** accepted and uncommitted, ready for the exact governance commit after one final fresh Luna packet audit.

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

If an existing private configuration does not already match the exact candidate, stop rather than overwrite it or improvise configuration changes. The bounded amendment below is the only accepted path to a candidate-scoped private replacement. Every generated input, configuration, authorization package, and evidence artifact remains outside Git, uses a never-before-existing path, is never overwritten after validation, and must pass the exact predicates below before provider access.

## Tooling and configuration-regeneration amendment

The historical v0.7.1 staging and Production pair is genuinely stale, not a presentation-only failure: its actual `APP_VERSION` is `0.7.1`, its candidate SHA is not the pushed S10 boundary, and `CANDIDATE_BRANCH` is absent. The exact safe failures are `APP_VERSION_PACKAGE_MISMATCH`, `CANDIDATE_SHA_HEAD_MISMATCH`, `CANDIDATE_BRANCH_RELEASE_VERSION_MISMATCH`, and `CANDIDATE_BRANCH_HEAD_MISMATCH`. No historical package may be relabeled or overwritten.

Only after this amendment passes fresh Luna review, receives Sol acceptance, is committed and normally pushed in the exact four governance paths, and reaches local/upstream/live-remote parity may Integration Terra:

1. Fast-forward the existing clean branch-tracking evidence clone to the new pushed amendment SHA. Do not delete, reclone, detach, or create a linked worktree.
2. Create one never-before-existing candidate-scoped private input/configuration subdirectory outside Git. Refuse any pre-existing or partial target; never reuse or overwrite it.
3. Make exactly one read-only private `d1 list --json` inventory call and save its raw output only in that private subdirectory. It must resolve exactly one `hau-usc-logistics-staging-sandbox-v0721` database and one `hau-usc-logistics-production` database with distinct identifiers. No identifier enters Git or sanitized console evidence.
4. Run the repository configuration generator once. It must create, without overwrite, `wrangler.staging.private.jsonc` and `wrangler.production.private.jsonc` in a new private output directory.
5. Before either configuration is accepted, prove the staging HTTPS endpoint, existing compatibility/assets/recovery-host source, exact private one-recipient containment input and derived count `1`, Production recovery host, and distinct existing staging and Production Google-configuration path existence. The Google paths are existence-only S10 inputs; do not infer or invent Google roster, Drive, credential, secret, recipient, or provider-identifier values, and do not treat this evidence as Production launch preflight.
6. Generate a current-candidate Phase 3 staging authorization package from the controlling Earl V1R7-A3 directive. Only `cloudflareRead` and `d1Backup` are `APPROVED`; `googleRead`, `d1Migration`, `sheetExport`, `d1Import`, `stagingSecretSetup`, `workerDeploy`, `syntheticWorkflowWrites`, `evidenceUploads`, `rollbackRehearsal`, and `cleanupOrRetention` are `DENIED`. Its candidate hashes are generator-derived, its completed labels are safe, its paths are absolute and private, and it authorizes no deployment or mutation.
7. Run staging candidate evidence exactly once. Only after it passes may Integration Terra generate the Production backup-only authorization package. Only `productionBackup` is `APPROVED`; `productionD1Migration`, `productionWorkerDeploy`, `productionSheetCutover`, `productionSeedAccounts`, `productionSmokeMutations`, `productionRollback`, and `productionClosure` are `DENIED`.
8. The Production package records the current directive-receipt/materialization time and safe labels, validates with the reserved outside-Git backup-manifest path allowed to be missing before capture, and must remain `launchAuthorized=false`. The normal full-launch authorization CLI is not required to report green and must not be made green by approving excluded actions.

The sanctioned creation commands are:

```powershell
node .\node_modules\wrangler\bin\wrangler.js d1 list --json --config <ABS_EXISTING_PRIVATE_CLOUDFLARE_CONFIG> > <ABS_NEW_PRIVATE_D1_INVENTORY_JSON>
npm.cmd run cloudflare:private-configs:init -- <ABS_PRIVATE_STAGING_BASE> <ABS_NEW_PRIVATE_D1_INVENTORY_JSON> <ABS_NEW_PRIVATE_CONFIG_DIR>
npm.cmd run phase3:authorization:init -- <ABS_NEW_PRIVATE_STAGING_AUTHORIZATION_JSON>
npm.cmd run phase3:authorization:check -- <ABS_NEW_PRIVATE_STAGING_AUTHORIZATION_JSON>
npm.cmd run production:authorization:init -- <ABS_NEW_PRIVATE_PRODUCTION_AUTHORIZATION_JSON>
```

`package.json` version, exact Git `HEAD`, current branch, candidate hashes, repository source/artifact paths, schema/contract constants, fixed Worker/R2 names, and observability defaults are Git-derived. D1 identifiers and the staging endpoint are proved from the single authorized read-only inventory/current endpoint evidence. Compatibility, assets, both recovery hosts, the exact one-recipient containment input, and the distinct existing Google-configuration paths must come from existing private values; they are never guessed or printed. The configuration and authorization files remain candidate-scoped, private, validated, and non-overwritten.

## Clean evidence checkout

The canonical worktree retains preserved46 and must remain untouched. `scripts/staging-candidate-evidence.mjs` rejects any nonempty Git status, while the accepted identity guard also rejects a literal detached `HEAD` because the current branch must equal private `CANDIDATE_BRANCH`.

Therefore S10 evidence must run from the existing independent clean clone/evidence checkout, operationally isolated from the canonical writer and attached to its own `release/v0.8.1-final-stabilization` branch. After the amendment governance push, that clone must fast-forward normally to the exact pushed amendment SHA with its configured upstream at the same commit, tracked/staged/untracked counts `0/0/0`, and no copied preserved artifacts. It must not be deleted, recloned, detached, or converted into a linked worktree. Provider scripts must continue to leave that evidence checkout clean because every generated input, configuration, authorization, export, restore, and manifest path resolves outside Git.

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

## Accepted S10 operational evidence

The exact operational candidate was `d94b25e485ea4bd317b82ff9cef0d846369a078c` / `b1a51666625b6881db15e00a1e6020c4d162ddf4` on `release/v0.8.1-final-stabilization`. Canonical, upstream, live remote, and the independent clean branch-tracking evidence clone matched that identity; canonical tracked/staged counts and clone status were `0/0` and `0` respectively.

- Focused local validation passed: Vitest `5` files / `38` tests, `node --check` across `11` files, and ESLint across `11` files. The package-lock SHA-256 remained `E9EE00E258A0FEA40717D6C30CC1D30C2CBDA1D581388E051A6D043FFC7BB07D` with drift `0`.
- The `11` Prettier warnings were independently adjudicated `TOOLING_NO_EFFECT_CONTINUE`, category `CHECKOUT_LINE_ENDING_PRESENTATION_ONLY`: all `11` HEAD/index/clean-filtered worktree blob OIDs matched, the checkout contained `2,892` CRLF line endings where HEAD contained `2,892` LF line endings, LF-normalized checkout bytes equaled HEAD for all `11`, BOM and trailing-whitespace counts were `0`, and the same-config in-memory formatter output for checkout and HEAD equaled raw HEAD with no HEAD formatting delta. Repository EOL attributes were unspecified and system `core.autocrlf` was `true`.
- Exactly one preparatory D1 inventory, one configuration-generator invocation, one staging-authorization initialization and check, one staging evidence command, one Production-authorization initialization and S10-specific validation, and one Production recovery-evidence command ran. Retries and alternate variants were `0`.
- Safe configuration and authorization hashes were: D1 inventory `E36E3413666FB5C398CBB8961E6382F58A399C44492CF158FE2C1789F02DBC37`; staging input `334322871487630348DBB6B877F1ED40A2A9BDCBE60AC22D28EA46ACE9026BDC`; staging config `4CC71B774A3E3EB2A60657731230C229D9B571FADCCA6F16A056AD42DC855E34`; Production config `5AA4F78FAD5F555E8383E97B93415B647A3AE8C839253D580B9FB51815B87F4B`; staging authorization `9D2427EB114A19FFA085CD2DF1AA31D500007EB2E872C92EDF8EBB4116BA4F7E`; Production authorization `7FC3B2EFD6A94214468510E8D26730D7F3A84342EAA2F4B66BB9CB067E6FC36E`.
- Staging authorization was valid with only `cloudflareRead` and `d1Backup` approved, the other `10` actions denied, and pending actions `0`. Staging evidence passed with export SHA-256 `49857EF655846015D7C87F3A65FCF91C92E9EE3D1FF535F9C223E45EF505AF7A`, manifest SHA-256 `A591D08E3071E544A80F687BA497D6C0E84060535D95BF867AD08AE46A067355`, and isolated-restore SHA-256 `62F1E4D48397A1432991180D39F0CC2420305188A3D3D0FDFE0DDC6C941395A4`. The tuple proved integrity PASS, foreign-key violations `0`, schema `30`, migration `0030_production_access_and_operations.sql`, reconciliation `20/20`, discrepancies `0`, disposition `RECONCILED`, prior Worker deployments `10`, R2 metadata count `2`, a nonempty bookmark, and configuration fingerprints `2`.
- Production authorization was valid with `launchAuthorized=false`, only `productionBackup` approved, the other `7` actions denied, and pending actions `0`. Production recovery evidence passed in `PRE_MERGE_READ_ONLY` with export SHA-256 `7A6E9DEBABD76D7ED39D2F7A7D9DE8AD70A23F586F3D5F3E3B7B0AAEA23A3961`, manifest SHA-256 `BC82075D5D6426C65D7C19ABA95DB7C237E2A8F0632E0F810E99B5888D258E02`, and isolated-restore SHA-256 `7EF245B9B708AD321CFE36A1ECEA7CC4164753AA1723977F6A881F80F6CE2FC8`. The tuple proved integrity PASS, foreign-key violations `0`, schema `30`, migration `0030_production_access_and_operations.sql`, reconciliation `20/20`, discrepancies `0`, disposition `RECONCILED`, prior Worker deployments `7`, Production and staging R2 metadata counts `2/2`, a nonempty bookmark, configuration fingerprints `4`, and active synthetic Production accounts `0`.
- The immutable candidate-scoped private root outside Git contains `12` files / `5,911,700` bytes: inputs `4`, configs `2`, staging `3`, and Production `3`. Its independently reproduced manifest root is `F6FD97B539ABDFC24BE4560F1D33E8A0E079DE57616237BD112BF41BDAA7666C`; candidate JSON equality and the manifest-root serialization, ordering, and hash proof passed. The predecessor root remains unchanged and empty.
- Provider operations were limited to read-only D1 inventory, deployment history, R2 metadata, Time Travel, and D1 export. Private writes were limited to the accepted input, configuration, authorization, and evidence artifacts. Raw identifiers and secrets in Git were `0`.
- Deployment, migration, seed/reset, live restore, R2 write, smoke, auth E2E, release-manifest generation, recovery-pointer change, ref action, and canonical source/test edits were all `0`.

Fresh independent evidence audit and Sol acceptance are both PASS. S10 closes with P0 `0` and P1 `0`; the broader release P2/P3 mapping remains `23/5/4/1/9`, with no program-wide none claim.

## Explicit exclusions

S10 authorizes no deployment, migration, staging seed/reset, provider mutation, live-database restore, R2 write, recovery-pointer change, source/test edit, release-manifest generation, or ref mutation. It does not run `deploy-environment.mjs`, even with `--dry-run`, because that rebuilds repository artifacts. It does not run staging candidate smoke or `tests/staging-e2e/staging-auth-access.spec.js`; those can create sessions or operational fixtures and remain required only at their later governed Playground/preflight gate. It does not perform live Production launch preflight or Production authorization for deployment.

`.github/workflows/release-candidate.yml` remains Playground-only, contains no Production job, retains `WAIT FOR EARL`, and is read-only. `scripts/playground/**` and `package-lock.json` remain unchanged.

## Stop conditions

Stop before or during S10 evidence on any of the following:

- canonical or evidence-checkout branch, HEAD, tree, upstream, remote, cleanliness, preservation, capture, lock, or writer drift;
- missing, malformed, stale, or non-private configuration, authorization, credential, or evidence destination;
- any pre-existing/partial candidate input or configuration destination, overwrite attempt, or more than one preparatory D1 inventory read;
- package/branch/`CANDIDATE_BRANCH`/`APP_VERSION`/`CANDIDATE_SHA` mismatch;
- unresolved compatibility/assets/recovery-host input, staging HTTPS endpoint, exact one-recipient input/count, distinct Google-config path, expected D1 name, or required placeholder;
- unexpected environment/resource identity or staging/Production crossover;
- missing approval for the exact read/export action;
- any staging authorization action other than `cloudflareRead` or `d1Backup` approved, any Production authorization action other than `productionBackup` approved, or any Production package that becomes launch-authorized;
- absent or empty Time Travel bookmark or missing prior Worker deployment;
- export, hash, isolated restore, integrity, foreign-key, schema, migration, reconciliation, fingerprint, or R2 proof failure;
- any active synthetic Production account;
- private data in Git, console evidence, or sanitized governance records;
- any provider mutation, deployment, migration, seed/reset, live restore, pointer change, ref action, or unapproved path;
- any new P0/P1, more than the accepted bounded attempts, or a need to change source/test behavior.

## Current boundary and exact next action

This record is `ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`. The original S10 boundary remains durable at `bb65250699c35546b476b41365dc0370224f349d` / `f73224c8d2ebe38174d2c7f119ec243ef0aaef98`, parent `d4449d60340e55ee7317a3a14eedf910f7f0516a`; the pushed tooling amendment and accepted operational candidate are `d94b25e485ea4bd317b82ff9cef0d846369a078c` / `b1a51666625b6881db15e00a1e6020c4d162ddf4`, parent `bb65250699c35546b476b41365dc0370224f349d`. This acceptance materialization changes only the exact four governance paths and performs no provider/private/clone/source/test/deployment/migration/seed/reset/live restore/R2 write/smoke/auth E2E/release-manifest/recovery-pointer/ref action.

**NEXT_EXACT_ACTION:** Run one final fresh read-only Luna audit of the exact four accepted S10 evidence governance paths; only after that audit remains `PASS`, stage and commit exactly `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, and `.codex/releases/v0.8.1/V0_8_1_S10_ROLLBACK_RELEASE_CANDIDATE_EVIDENCE.md`, normally push, verify local/upstream/live-remote parity and preserved46, then enter V81-S11 candidate integrity and generated-artifact parity; no provider/private/clone/source/test/deployment/migration/seed/reset/live restore/R2 write/smoke/auth E2E/release-manifest/recovery-pointer/ref action before S10 governance push parity.
