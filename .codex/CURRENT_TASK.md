# Current Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: AUTHORIZATION, PREFLIGHT, RESOURCE_SEPARATION, SECURITY, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 25 Production Authorization, Resource Separation, and Preflight
SKILLS: lean-ctx, cloudflare-deploy
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: critical
DELIVERABLE: validate a private exact-candidate production authorization package and prove production resources/configuration fail closed without performing a production write
VERIFICATION: distinct Worker/D1/R2/cookie/Google targets; production-only secrets; observability policy; truthful production health identity; approved hostname; D1 export/bookmark and exact rollback command; complete candidate/hash/snapshot/operator/window binding; negative preflight cases
STOP CONDITIONS: missing owner production authorization; staging/production resource overlap; missing or staging-valued secret/config; unverified route/domain; stale backup/rollback; preview/test data promotion; any production deployment, migration, secret mutation, or data write before Phase 26–27 gates

## Active Phase 25 contract

- Verify production Worker, D1, R2, cookies/session scope, Google configuration,
  secrets, observability, hostname, backups, bookmark, and rollback are distinct,
  complete, approved, and outside Git.
- Bind authorization to the exact frozen SHA and hashes, production resources,
  route, approved Sheet/Drive mappings, inventory/event snapshots, backups,
  rollback, launch window, operator, and smoke accounts/records.
- Prove deployment fails closed for staging-bound resources, preview mode,
  missing secrets, test-only data, false email-verification state, stale
  recovery evidence, or an unverified target.
- Do not weaken the production authorization validator.
- Production remains read-only during Phase 25.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 24: accepted; real staging rollback `d095685 → 7c47f22 → d095685`
  passed eight-surface smoke and byte-identical D1 reconciliation.
- Recovery: private schema-29 export, Time Travel bookmark, encrypted 127-row
  Google snapshot, 464 R2-metadata rows, retained version mapping, and exact
  rollback logs are present.
- Cleanup/retention: 42 labeled synthetic accounts disabled/revoked, zero
  active; 30 append-only guards; no automated evidence purge authorized.
- CI: exact Phase 23 documentation head `c61cb65` passes 6 / 6.
- Phase 25: active. Begin with read-only validation of private production
  authorization and resource separation; perform no production write.
- Production: untouched and prohibited.
