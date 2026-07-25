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

Phase 10 — audit and complete the real Director workspace as the next bounded
master-prompt vertical slice.

Phase 9 is accepted on staging at exact candidate `e3d3c76`, schema 19.
Repository acceptance passed 416 unit tests and 104 browser tests; the live
governed brand and complete owner-authenticated Administrator Control Center,
Health, Brand Assets, Access Management, and shell-isolation scenarios passed;
and PR #9 exact-head checks passed 6 / 6.

Durable evidence:
`.codex/V0_7_PHASE_9_ADMIN_WORKSPACE_HANDOFF.md`.

The primary agent is the only writer, browser operator, credential handler, provider mutator, migration executor, deployer, merger, tagger, release manager, and rollback operator.
