# Architecture

HAU-USC Logistics v0.8.3 is a Cloudflare Worker application with cacheable external browser assets, D1 operational storage, separate R2 brand/evidence buckets, and server-owned authentication and authorization. Apps Script remains an independently generated sidecar and recovery/reference path; it is not the current production authority.

## Runtime boundaries

```text
Browser portals and authenticated workspaces
                    |
             Cloudflare Worker
       auth / capability / validation
       idempotency / workflow / audit
          |                      |
          D1                 isolated R2
   operational truth       brand + evidence
```

- `src/worker/index.js` owns HTTP routing and safe release/readiness identity.
- `src/server/` owns authorization, validation, workflow, provider, and repository boundaries.
- `src/server/d1/` is the canonical operational repository layer.
- `src/frontend/` is the canonical React application and product interface.
- `src/visual/` and `src/styles/visual/` preserve the retained Apps Script recovery interface.
- `src/apps-script.html` is the isolated Apps Script frontend entry; `npm run build:apps-script` generates the checked `apps-script/` partials, which are never hand-edited.

## Environment and artifact isolation

- `npm run build` creates the ignored, generated-only canonical application in `dist/`; its entry uses root-relative, content-hashed CSS and JavaScript so SPA deep links resolve correctly.
- Staging, production, Cloudflare dry-run, deployment, and local Worker acceptance build into isolated output directories.
- Staging and production artifacts carry an exact environment marker and must also pass the normal-asset architecture gate; an inlined historical artifact is never deployable.
- Staging and production use distinct Worker, D1, R2, secrets, provider configuration, and routes.
- Runtime identity comes from `/api/version` and `/api/readiness`, including application version, exact candidate SHA, and schema/migration.
- Staging alone displays `STAGING TEST ENV` with version, SHA, and schema.

## Data invariants

D1 migrations are additive and forward-only. Posted ledger, audit, status, access, account, release, evidence, and other history records are append-only or corrected through linked audited records. Client state never authorizes a server action. Retryable writes require server-enforced idempotency and transactional invariants.

The schema-30 Inventory truth formula, transaction map, post-Slice-2 invariant
coverage, and repair evidence are recorded in
[INVENTORY_TRUTH_BASELINE.md](INVENTORY_TRUTH_BASELINE.md) and
[INVENTORY_SLICE_2_REPAIR_REGISTER.md](INVENTORY_SLICE_2_REPAIR_REGISTER.md).

See [SECURITY_AND_ACCESS.md](SECURITY_AND_ACCESS.md), [D1_MIGRATION_AND_ROLLBACK.md](D1_MIGRATION_AND_ROLLBACK.md), [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md), and [STAGING_SANDBOX.md](STAGING_SANDBOX.md).

The superseded Apps Script-era architecture narrative is retained at `docs/archive/legacy/ARCHITECTURE-pre-v0721.md` for historical reference only.
