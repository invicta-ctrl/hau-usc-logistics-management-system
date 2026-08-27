# Accepted FI-00 through FI-12 Playground Migration-Only Amendment

STATUS: ACCEPTED
OWNER_AUTHORITY: `HAU-USC Logistics — FI-00→FI-12 Playground Migration-Only Amendment` (2026-08-27)
LANE: FM / FRONTEND MIGRATION

## Supersession and scope

This amendment supersedes every broader migration instruction that would continue frontend integration, FI-13 or later work, broad post-deployment development, a baseline refresh/export, provisioning, new resources, schema migration, or data mutation.

The sole responsibility is to deploy the already accepted FI-00 through FI-12 frontend candidate to the existing isolated Cloudflare Playground Worker/runtime and verify minimum usable operation against its existing isolated backend resources. Production remains untouched.

## Authorized sequence

1. Reconcile the exact FI-00 through FI-12 deployable candidate.
2. Verify target isolation and the known rollback/redeploy target.
3. Build/package the exact frontend and validate the deployment artifact.
4. Deploy only to the existing isolated Playground Worker.
5. Verify deployed candidate identity and the minimum Playground smoke.
6. Record the migration receipt and stop.

## Minimum predeploy gates

Before deploy, verify only: exact candidate/ref identity; accepted FI-00 through FI-12 frontend; successful build; valid artifact; existing Playground Worker target; D1, R2, secret/config, email/provider, route, and trigger isolation from Production; no required database migration or Production mutation; and a known rollback/redeploy target.

## Minimum acceptance

After deploy, verify only: candidate/version identity; readiness; public frontend; authentication surface; one accepted authenticated read; one fail-closed denial; core FI-00 through FI-12 navigation; representative desktop/mobile usability; no fatal runtime failure; no Production traffic/crossover; no destructive mutation; no schema migration; and recorded rollback target.

## Strict exclusions

No Production deployment or mutation; FI-13 or later; frontend integration, redesign, polish, global visual audit, new features, unrelated backend/auth/API work, schema change or migration, data mutation, baseline refresh/export/import, provisioned or new resources, merge to `main`, promotion, or automatic handoff to another FI writer.

## Stop conditions and completion

Stop before deploy on identity, target-isolation, rollback, migration, privacy, or authorization failure. A blocking migration defect may receive only the minimum migration-layer repair required to make the accepted frontend operate. Cosmetic and future-slice findings are non-blocking and remain out of scope.

Completion requires the owner amendment's full minimum receipt, including `FI00_FI12_PLAYGROUND_DEPLOYED = TRUE`, `PLAYGROUND_AVAILABLE_FOR_TESTING = TRUE`, `PRODUCTION_UNTOUCHED = TRUE`, `MIGRATION_PERCENTAGE = 100`, and `MIGRATION_JOB_STATUS = COMPLETE`; then release migration locks and stop.
