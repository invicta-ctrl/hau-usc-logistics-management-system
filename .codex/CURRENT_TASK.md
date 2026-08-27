# Current Task — FI-00 through FI-12 Direct Playground Migration Path

INTENT: migration
MODE: execute
LANE: FM / FRONTEND MIGRATION
ACTIVE_WRITER: TERRA_HIGH:/root/fi00_fi12_candidate_resume
WRITER_LOCK: ACQUIRED
FM_WRITER_LOCK: HELD
LOCK_DEPENDENCIES: Accepted migration-only amendment; clean exact candidate; sealed private preflight/rollback evidence; no concurrent writer.
LOCK_OUTPUTS: Lock-only deployment candidate, private manifest/config, exact hashes, dry-run evidence, and at most one deploy receipt.
OBJECTIVE: Prepare the exact post-documentation FI-00 through FI-12 candidate for one authorized direct deployment to the existing isolated Playground, then verify minimum acceptance and stop.
AUTHORITATIVE_SOURCES: Candidate AGENTS.md; project policy; this current chain; accepted FI-00 through FI-12 packet; migration-only amendment; private preflight and rollback evidence.
CURRENT_FREEZE_REFERENCE: Clean pre-lock candidate 2401ad36d848aec70eb7a5304f3578066fcf2273. The required lock-only commit supersedes it as the exact deployment candidate and requires rebuild/re-hash before deploy.
MINIMUM_GATES_COMPLETE: Live D1 schema 32/migration 0032; current isolated D1/R2/email tuple; no schedule/Production-route crossover; and sealed current-live rollback/redeploy target.
GITHUB_DISPATCH_STATUS: Blocked by one stale-signature queued different-ref run with jobs=[] and failed exact-ref guard; no provider-capable step started. No cancellation or dispatch is authorized in this lane.
IN_SCOPE NEXT: Commit/push the lock-only checkpoint; prove no product/frontend or FI-13+ delta; fresh private live-state manifest; existing `create-private-config.mjs`; dry-run preflight; exact staging/shareable build and hashes; then only the migration-only direct deploy path if every gate passes.
OUT_OF_SCOPE: New resources; baseline refresh/export/import; data/schema migration; Production; FI-13+; cleanup; product/frontend changes; workflow dispatch; and any provider action in this documentation checkpoint.
STOP_CONDITIONS: Stop on candidate, manifest, binding, rollback, privacy, authorization, dry-run, artifact, or reconciliation mismatch; stop after the migration receipt.
