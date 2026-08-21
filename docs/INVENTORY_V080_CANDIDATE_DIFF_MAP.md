# Inventory v0.8.0 Candidate Diff Map

Starting canonical-main SHA: `88bfdf026e716ffdc779cb2ce7534978f36df0f3`
Slice 1 ending SHA: `77286cc65827070c7d93a07eaf4454c28d2d1147`
Slice 2 ending / Slice 3 starting SHA: `c5f53ddf44aaf28ab4a3e43b74d42f66d09e257d`
Final candidate SHA: resolved by the Slice 3 commit

Every candidate file belongs to one of the accepted three slices. No migration,
dependency upgrade, Inventory UI expansion, or future-release implementation is in the
diff.

## Slice 1 — baseline, characterization, and specification

- `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-1.md`
- `docs/ARCHITECTURE.md`
- `docs/INVENTORY_TRUTH_BASELINE.md` (initial baseline; later frozen by Slices 2/3)
- `src/domain/inventory.js`
- `src/visual/runtime.js`
- `tests/unit/inventory.test.js`
- `tests/cloudflare-e2e/local-worker.spec.js` (Slice 1 characterization; later Slice 2
  regression coverage)

## Slice 2 — evidence-proven runtime repairs and regressions

- `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-2.md`
- `docs/INVENTORY_SLICE_2_REPAIR_REGISTER.md`
- `src/server/d1/operational-service.js` (four accepted Slice 2 repairs; Slice 3 adds
  eight high-risk-review atomic concurrency/custody/ownership closures and the
  candidate-version fallback)
- `src/visual/runtime-extensions.js` (signed-quantity fallback repair; Slice 3 changes
  only candidate-version fallbacks)
- `src/visual/requester-portal.js`
- `src/visual/borrower-lending-portal.js`
- `tests/unit/inventory-slice2-d1.test.js` (Slice 2 repair coverage; Slice 3 aligns the
  custody fixture with schema-30 terminal assignment fields)
- `tests/cloudflare-e2e/local-worker.spec.js`
- `docs/INVENTORY_TRUTH_BASELINE.md` (post-repair closure)

## Slice 3 — reconciliation, contract freeze, recovery, and candidate identity

### Accepted continuity and release records

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`
- `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-3.md`
- `.codex/specs/active/v0.8.0-staging-production-master-release.md`
- `README.md`
- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `docs/WORK_CONTINUATION.md`
- `docs/D1_MIGRATION_AND_ROLLBACK.md` (bounded no-migration recovery authorization)
- `docs/BACKUP_AND_RECOVERY.md` (governed production recovery capture)
- `docs/LAUNCH_RUNBOOK.md` (exact-main merge/deploy invalidator sequence)
- `docs/STAGING_SANDBOX.md` (candidate recovery/smoke commands and safety boundary)
- `docs/INVENTORY_TRUTH_BASELINE.md` (final server/downstream freeze)
- `docs/INVENTORY_V080_FINAL_FINDING_REGISTER.md`
- `docs/INVENTORY_V080_RECONCILIATION.md`
- `docs/INVENTORY_V080_CANDIDATE_DIFF_MAP.md`
- `docs/V080_RELEASE_AUDIT_REGISTER.md`

### Read-only reconciliation and recovery/staging guards

- `scripts/d1/reconcile-inventory-truth.mjs`
- `scripts/d1/verify-d1-export.mjs`
- `scripts/d1/verify-staging-sandbox-local.mjs`
- `scripts/staging-sandbox.mjs`
- `scripts/staging-candidate-evidence.mjs`
- `scripts/staging-candidate-smoke.mjs`
- `scripts/production-recovery-evidence.mjs`
- `scripts/production-launch-preflight.mjs` (junction-safe private inputs and mandatory live-deploy gate)
- `scripts/private-path.mjs`
- `scripts/deploy-environment.mjs` (private action authorization required for live deploys)
- `scripts/production-authorization.mjs` (pre-manifest backup authorization validation)
- `scripts/phase3-staging-authorization.mjs` (junction-safe private authorization paths)
- `scripts/cloudflare-secret-package.mjs` (junction-safe secret-package paths)
- `scripts/configure-staging-identity-fixture.mjs` (junction-safe fixture paths)
- `tests/unit/inventory-reconciliation.test.js`
- `tests/unit/private-path.test.js`
- `tests/unit/d1-operational-p1-regressions.test.js` (static atomic-guard regressions)
- `tests/unit/inventory-command-cancellation-races.test.js` (real schema-30 cancellation,
  review, custody, receiving, and reservation-ownership regressions)
- `tests/unit/verify-d1-export.test.js`
- `tests/staging-e2e/staging-auth-access.spec.js` (candidate version/schema identity only)

### Candidate version and exact-head packaging

- `package.json`
- `package-lock.json`
- `wrangler.jsonc`
- `worker-configuration.d.ts`
- `scripts/create-private-cloudflare-configs.mjs`
- `.github/workflows/release-candidate.yml`
- `.github/workflows/cloudflare-preview.yml`
- `src/app/config.js`
- `src/worker/index.js`
- `src/server/d1/operational-service.js` (candidate version plus bounded high-risk-review repairs)
- `src/visual/runtime-extensions.js` (version fallbacks only in Slice 3)
- `tests/unit/observability-environment.test.js`
- `tests/unit/production-launch-preflight.test.js`
- `tests/unit/release-pipeline.test.js`

### Deterministically regenerated candidate artifacts

- `dist/index.html`
- `HAU-USC_Logistics-Prototype-Shareable.html`
- `hau-usc-logistics-guided-demo.html`
- `shareable-html-modules/hau-usc-logistics-01-overview-shareable.html`
- `shareable-html-modules/hau-usc-logistics-02-request-center-shareable.html`
- `shareable-html-modules/hau-usc-logistics-03-office-lending-hub-shareable.html`
- `shareable-html-modules/hau-usc-logistics-04-release-desk-shareable.html`
- `shareable-html-modules/hau-usc-logistics-05-restocking-shareable.html`
- `shareable-html-modules/hau-usc-logistics-06-procurement-deliverables-shareable.html`
- `shareable-html-modules/hau-usc-logistics-07-inventory-management-shareable.html`

These artifacts are generated by `npm run build`; `npm run check:apps-script` and
`npm run verify:dist` enforce deterministic parity. They are never hand-edited.
