# P29 Exact Playground Candidate Freeze and Deployment Receipt

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_DEPLOYED_PLAYGROUND_ONLY
ROUTE: SOLO

## Frozen candidate

| Identity | Frozen value |
| --- | --- |
| Source branch | `reconcile/playground-master` |
| Source commit | `a298ea2900b6396c83b46bd519a7c407805cd81f` |
| Source tree | `de05ca5786c7610b7de797cd85e51177834c0410` |
| Lockfile SHA-256 | `c84ee33bead67db1c3a620462191727a9040e197d9f6a9767b54f4cadcecc183` |
| Staging entry artifact SHA-256 | `6b12f2468ed72fbdb33a3a9be80ccc5fad583c40b4f91d815fe7962b85fedf95` |
| Worker identity | fixed private-manifest-bound `ISOLATED_STAGING_PLAYGROUND`; current provider version held privately |
| Schema/latest migration | `32` / `0032_staff_account_activity_history.sql` |
| D1 identity | exact fixed working D1 matched authenticated provider inventory; private identifier not recorded in Git |
| R2 identity | exact fixed working brand/evidence buckets bound by the validated private manifest; private names not recorded in Git |
| Baseline/generation | `PGBL-20260828-COVERAGE-V2` v2 / generation `6` |
| Theme version | P18 six-family semantic contract; `theme.css` SHA-256 `4f7ef716b4fc204ec0ca319e1bf15d4894929f1b8e02a566f7d687e430fcdd11` |
| UI language guide version | P19 canonical guide; SHA-256 `82fa6b3ef6de8a50ef84eff774eb918b0c9e3e46dc36d4a6db70bf82df56a8e6` |
| Rollback target | immediately prior Playground deployment from source `ca28bde`; exact provider version privately validated before upload |

The staging artifact is deployment-shaped and code-split. The preserved offline shareable remains a separate deterministic review artifact and was not uploaded as the Worker entry asset.

## Preflight

- Cloudflare authentication: PASS without printing account identity.
- Git status: clean.
- Remote parity before deploy: `0/0` against `origin/reconcile/playground-master`.
- Fixture boundary: PASS.
- Cloudflare build: PASS; `1,683` modules transformed.
- Deploy artifact verification: PASS; staging entry `1,558` bytes.
- Private config creation: PASS; scheduled jobs and provider/email delivery disabled.
- Dry-run deploy guard: PASS.
- Worker, D1, R2, branch, commit, tree, artifact, rollback, and Production-denial guards: PASS.
- Pre-deploy D1 reconciliation: schema 32, baseline v2, generation 6, `CLEAN`, zero sessions/transients/FK violations, bookmarks available.

## Deployment

The guarded deploy command uploaded only the frozen candidate to the fixed isolated Playground Worker. It did not target Production, `main`, Production D1/R2, Google, email delivery, scheduled jobs, or Figma.

Provider result: `Isolated Staging Playground Worker: DEPLOYED`.

No private provider identifier, hostname, resource name, token, secret, object key, or hash was printed by the deployment wrapper or committed to Git.

## Post-deploy verification

- Application root: HTTP 200.
- Health: HTTP 200 / `ok=true`.
- Readiness: HTTP 200 / `ready=true`.
- Runtime identity: `playground=true`.
- Fixed D1 identity: PASS.
- Schema/latest migration: `32` / `0032_staff_account_activity_history.sql`.
- Baseline/generation: `PGBL-20260828-COVERAGE-V2` v2 / `6`.
- Working state: `CLEAN`; active test session false.
- Sessions/transient total: `0` / `0`.
- Foreign-key violations: `0`.
- Reversible and sealed recovery points: available.
- Production mutation: NONE.
- Google mutation: NONE.

## P30 handoff

P30 must begin in a fresh browser with no cookie/session and traverse the complete live Playground route sequence at 390 and 1440. Shell rendering alone is insufficient: each route must record backend source, API result, visible state, authorization, fixture exclusion, console errors, and load/transition evidence.
