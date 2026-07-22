# Current Task

INTENT: LIVE STAGING ACCEPTANCE AND REPAIR
MODE: execute Task 2 only
TARGET: HAU-USC Logistics v0.6 Phase 3 Cloudflare Worker, D1, and Google migration staging candidate on `chore/v0.6-codex-continuity-bootstrap`
AUTHORITY: Earl's 2026-07-22 Task 1 execution instruction; `.codex/PHASE_3_TASK_1_STAGING_HANDOFF.md`; `.codex/specs/v0.6-phase-3-sol-high.md`; `AGENTS.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/PHASE_2_TERRA_HANDOFF.md`
RISK: critical
DELIVERABLE: complete the live staging acceptance matrix and authorized repair/rollback evidence without production promotion or PR merge
VERIFICATION: exact deployed candidate/URL, private-gate validation, full workflow/privacy/data/idempotency/evidence/sync/performance/load/browser/accessibility/recovery/training matrix, rollback rehearsal, and durable evidence
STOP CONDITION: no valid outside-Git authorization package approves the next Task 2 write gate; stop immediately before that write

## Active bounded unit

Phase 2 is complete at handoff `38a86069039ef18081aaa0e1c1fe2c25acde6613`.

Task 1 deployed exact candidate `af0e82b0cf33862a1b4274bd6e8a20bcd75f7df1` to `https://hau-usc-logistics-staging.earllawrence-adriano-ce.workers.dev`. The staging-only Worker serves the SPA and API, connects to D1 through migration `0007`, contains one approved redacted Sheet import row with zero rejections, authenticates five synthetic role identities, routes all five experiences, and passes basic request-only privacy smoke. PR #9 matched the deployed candidate and all six checks passed.

The active evidence index and exact Task 2 boundary are in `.codex/PHASE_3_TASK_1_STAGING_HANDOFF.md`. Full workflow acceptance, evidence uploads, rollback rehearsal, performance/load/accessibility evidence, cleanup/retention, production promotion, and PR merge are not complete. The smallest safe next action is to start Task 2 with Terra High and revalidate the exact remote state before any new write.
