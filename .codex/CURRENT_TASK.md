# Current Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: FINAL_FREEZE, TESTING, SECURITY, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 26 Final Freeze
SKILLS: lean-ctx, cloudflare-deploy, browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: critical
DELIVERABLE: immutable exact-candidate final-freeze package with full repository, deployed browser, reconciliation, and exact-head CI evidence
VERIFICATION: exact staging SHA/runtime/schema/bindings; release/build/Worker/migration/mapping hashes; inventory/event snapshots; D1/R2/recovery package; accessibility/performance/capacity; full repository gate; full deployed browser gate; all CI including browser smoke; zero unresolved P0/P1 and no mandatory UNRUN
STOP CONDITIONS: candidate drift; staging mismatch; failed full gate; unresolved P0/P1; stale backup/authorization; synthetic-data residue; any production write before Phase 27 passes

## Active Phase 26 contract

- Freeze only after zero unresolved P0/P1, no mandatory `UNRUN`, inventory and
  event reconciliation, accepted workflows, verified backup/rollback, and a
  valid production authorization package.
- Record release SHA, build/Worker/migration/mapping hashes, inventory/event
  snapshots, staging Worker version, D1 schema, R2 versions, acceptance,
  accessibility, performance/capacity, rollback, and production-package
  validation.
- Deploy the exact frozen candidate to staging and run one complete repository
  gate, one complete deployed browser gate, and all exact-head CI including
  browser smoke.
- Any candidate change invalidates the freeze and requires affected gates and
  private authorization hashes to be regenerated.
- Production remains read-only throughout Phase 26.

## Current execution checkpoint

- Phase 25: accepted at `73612344a7e0b1f533ff56a3e24695176bb9a75e`.
- Private production environment, authorization, launch preflight, and exact
  Wrangler dry-run all pass for the active window.
- Dedicated production roster reader and six private production Drive roles
  are configured and live-verified without exposing protected values.
- Repository gate: 75 Vitest files / 494 tests and every required check pass.
- CI: five checks passed; exact-head browser smoke was still running at the
  Phase 25 documentation transition and must pass before freeze acceptance.
- Staging: final Phase 24 runtime `d095685` remains healthy on schema 29; deploy
  exact `7361234` before the full deployed browser gate.
- Production: untouched and prohibited.
