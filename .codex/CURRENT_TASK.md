# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: SECURITY_REVIEW, OBSERVABILITY, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 22 Full Staging and Operations Acceptance
SKILLS: lean-ctx, cloudflare-deploy, browser:control-in-app-browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: complete synthetic/redacted staging acceptance for observability, authentication, public request/lending, inventory, release, and events without production bindings or fallback data
VERIFICATION: live logs/traces and binding audit; health/readiness/version and correlation IDs; complete role/public/workflow matrix; reconciliation; exact-head CI
STOP CONDITIONS: secret or personal-data exposure; production binding or mutation; synthetic-data escape; fallback/demo data; invariant or authorization failure; unresolved P0/P1

## Active Phase 22 contract

- Confirm redacted Workers Logs, sampled Traces, staging D1/R2/static bindings,
  absence of production bindings, exact endpoints, and correlation IDs.
- Use synthetic/redacted data only and prove no secrets or personal data appear
  in logs or ordinary UI/API output.
- Execute authentication, public Request Center, public Lending Center,
  inventory, Release Desk, and event workflow acceptance, including denial,
  idempotency, concurrency, ledger, evidence, status, and privacy boundaries.
- Reconcile all synthetic effects and preserve required immutable audit/history.
- Production remains out of scope during the Phase 22 staging gate.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 21: accepted on staging at exact runtime
  `3c5b7aa1b1166775fffce9ef8e5275e0eef65021`; exact-product-head CI is 6 / 6.
- Staging: schema 28, ready true, owner operational health accepted on mobile
  and desktop; Administrator denial and protected-value omission passed.
- Reconciliation: two synthetic actors disabled, zero sessions, two create and
  two disable audits retained; no workflow records created.
- Phase 22: active. Begin with live logs/traces, bindings, endpoints, and
  correlation IDs before the synthetic operations matrix.
- Production: untouched and prohibited.
