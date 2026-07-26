# Current Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: SOFTWARE_FEATURE, SECURITY, MIGRATION, TESTING, REPOSITORY_MAINTENANCE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 staging acceptance, branch consolidation, and production launch
SKILLS: github, cloudflare-deploy, google-drive, google-sheets, control-chrome
AUTHORITY: `.codex/specs/v0.7.0-follow-up-amendment.md`; `.codex/specs/v0.7.0-production-master.md`; `.codex/SHARED_TOKEN_EFFICIENCY_CONTRACT.md`; owner authorization in the active task
RISK: critical
DELIVERABLE: verified v0.7.0 production baseline on `main`, tagged/released and operationally accepted in production
VERIFICATION: every master-prompt completion condition, one full repository gate, one full deployed browser gate, green final CI, backup/reconciliation/rollback evidence, production smoke, and exact remote SHA verification
STOP CONDITIONS: unidentified or unowned production target; invalid fail-closed authorization; unreconciled material discrepancy; privacy exposure; irreversible data-loss risk; unresolved P0/P1; unavoidable owner-only MFA/CAPTCHA/security-key action

## Active slice

Phase 15 — implement the Owner-Protected Identity Roster as the next bounded
master-prompt vertical slice.

Phase 14 is accepted on staging at exact candidate `eca00e6`, Worker version
`c6a222c8-d2ff-400c-9c69-369b7286ed91`, schema 20 / migration 0020.
Repository acceptance passed 426 unit tests, 126 browser tests, and 28 local
Worker/D1 tests; the complete deployed suite passed 6 / 6, including generated
accounts, effective policy preview/apply, route and scope enforcement, session
revocation, audited archive, privacy boundaries, and cleanup. PR #9 exact
product-head checks passed 6 / 6.

Durable evidence:
`.codex/V0_7_PHASE_14_ADVANCED_ACCESS_MANAGEMENT_HANDOFF.md`.

The primary agent is the only writer, browser operator, credential handler, provider mutator, migration executor, deployer, merger, tagger, release manager, and rollback operator.
