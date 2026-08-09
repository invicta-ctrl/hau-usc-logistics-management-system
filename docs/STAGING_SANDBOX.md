# Permanent Staging Sandbox

Staging is a permanent isolated environment, not a permanent Git branch. It uses a dedicated staging Worker, D1, R2, secrets, provider configuration, and an exact recipient allowlist. The allowlist, sender, and private identity fixture are Worker secrets; the deployable config carries only a safe recipient count. The isolated fixture does not require a production Google roster binding, and production resources are never valid staging inputs.

## Commands

```powershell
npm run staging:sandbox:status -- --config <absolute-private-staging-config>
npm run staging:seed-sandbox -- --config <absolute-private-staging-config>
npm run staging:reset-sandbox -- --config <absolute-private-staging-config>
npm run staging:candidate:evidence -- --staging-config <absolute-private-staging-config> --production-config <absolute-private-production-config> --authorization <absolute-private-authorization-package> --private-dir <absolute-private-evidence-directory>
npm run staging:candidate:smoke -- <absolute-private-staging-config> --production-config <absolute-private-production-config> --credential <absolute-private-owner-credential>
npm run deploy:staging -- --config <absolute-private-staging-config> --authorization <absolute-private-authorization-package>
```

The private config must be outside the repository and identify the exact staging Worker, D1, and two R2 buckets. Mutation commands also require the config SHA and branch to match the checked-out candidate. Reset requires the literal boolean `SANDBOX_RESET_ALLOWED: true`. The private staging email allowlist must be a non-empty JSON array of exact addresses; values are never printed.

`status` reports only safe environment/version/SHA/branch/schema/migration labels, target-match booleans, readiness, recipient-count readiness, and aggregate synthetic classification. It does not emit binding IDs, addresses, credentials, private paths, or rows.

`staging:candidate:evidence` is the v0.8.0 no-migration pre-deploy path. It requires a
clean committed exact candidate and separately approved Cloudflare-read/D1-backup
actions, captures the private Worker/D1/R2/config rollback boundary, restores the export
in isolation, proves schema 30/migration 0030 and immutable-history availability, and
runs aggregate-only Inventory reconciliation. `staging:candidate:smoke` is
non-mutating and fails unless live staging reports exact v0.8.0/SHA/schema/readiness,
the required public routes render, an anonymous POST to a protected route is denied,
an unknown API route fails safely, and a private synthetic owner credential can read
the Main Hub and Inventory bootstrap. It verifies production isolation from the paired
private config rather than from hostname text. Live deployment additionally requires
the private package to approve `workerDeploy`. Neither command authorizes reset,
reseed, provider traffic, Google, or production access.

## Reset boundary

Reset is refused before mutation when any operational row is non-synthetic or unclassified. A mutating lifecycle manifest additionally requires a fresh private D1 export/recovery point, isolated restore proof (`integrity_check = ok`, zero foreign-key violations), archive/disable/reversal through governed lifecycle actions, session revocation, immutable-history preservation, deterministic reseed, and workflow/authorization/ledger/idempotency verification.

The current staging D1 failed the synthetic-only gate on 2026-08-08. Aggregate read-only classification found non-synthetic/unclassified accounts, Requests, inventory, events, reservations, lending, and deliverables. No reset, seed, deployment, provider send, or production write was performed. The safe next decision is either an owner-approved table-by-table disposition/projection or a newly approved isolated staging D1; never a generic delete or relabel.

## Feature-candidate flow

```text
feature branch -> exact-head CI + protected draft PR -> isolated exact-SHA staging build
-> guarded staging deploy -> sandbox status -> automated/manual staging acceptance
```

Staging candidates may differ from production during feature acceptance. Production pair/freeze checks remain unchanged. A visible `STAGING TEST ENV` banner must show version, 12-character SHA, and schema on public and authenticated staging surfaces; production must never render that warning.
