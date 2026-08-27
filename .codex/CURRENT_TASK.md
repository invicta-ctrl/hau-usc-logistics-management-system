# Current Task — FI-00 through FI-12 Direct Playground Migration Path

INTENT: migration
MODE: execute
LANE: FM / FRONTEND MIGRATION
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
FM_WRITER_LOCK: RELEASED
OBJECTIVE: Deployment checkpoint complete; preserve the deployed FI-00 through FI-12 Playground candidate and stop before smoke.
AUTHORITATIVE_SOURCES: Candidate AGENTS.md; project policy; this current chain; accepted FI-00 through FI-12 packet; migration-only amendment; private preflight/rollback/deploy evidence.
DEPLOYED_SOURCE_SHA: 8992e670861f136ce803ef03b68aa4687dcda8fc; upload count 1; retries 0; private deployed-version receipt retained outside Git.
VERIFICATION: Build/artifact PASS; dry-run PASS; corrected read-only live verification PASS for candidate/tree/artifact/environment, D1/R2 isolation, schema 32/migration 0032, email disabled, no schedule/route crossover, rollback, and unchanged Production.
VERIFIER_DEFECT: Private-only verification extraction initially used oldest deployment-history row and misread a provenance annotation as a schedule; corrected max-created-on/exact-field read passed. No repository deploy-code change in this phase.
IN_SCOPE NEXT: Only a newly authorized, minimum read-only browser/auth/operator smoke of the deployed Playground candidate.
OUT_OF_SCOPE: New resources; baseline refresh/export/import; data/schema migration; Production; FI-13+; cleanup; product/frontend changes; workflow dispatch; browser/auth smoke in this checkpoint; and any data mutation.
STOP_CONDITIONS: Stop on candidate, manifest, binding, rollback, privacy, authorization, dry-run, artifact, or reconciliation mismatch; stop after the migration receipt.
