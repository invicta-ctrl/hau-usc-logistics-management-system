# Current Task

INTENT: DEPLOYMENT / MIGRATION / FINAL ACCEPTANCE
MODE: execute until the next authorized gate
TARGET: HAU-USC Logistics v0.6 Phase 3 Cloudflare Worker, D1, and Google migration staging candidate on `chore/v0.6-codex-continuity-bootstrap`
AUTHORITY: Earl's 2026-07-22 execution instruction; `D:\Download\HAU_USC_Logistics_v0.6_SOL_MAX_Working_Cloudflare_D1_Google_Sheets_Deployment_Prompt.md`; `.codex/specs/v0.6-phase-3-sol-high.md`; `AGENTS.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/PHASE_2_TERRA_HANDOFF.md`
RISK: critical
DELIVERABLE: an externally reachable, acceptance-tested Cloudflare staging site backed by the authorized staging D1 database and approved Google Sheet snapshot, without production promotion or PR merge
VERIFICATION: repository acceptance, workerd/local D1 proof, exact commit/push/CI, private-gate validation, remote preflight, backup/import reconciliation, deployed workflow/privacy matrix, and rollback rehearsal
STOP CONDITION: no valid outside-Git authorization package identifies and approves the Cloudflare/Google staging targets; stop immediately before the first remote access

## Active bounded unit

Phase 2 is complete at handoff `38a86069039ef18081aaa0e1c1fe2c25acde6613`.

The Phase 3 repository/local candidate implements Worker Static Assets, protected Worker APIs, D1 persistence and migrations, server-owned capability/entity scope, distributed rate limiting, deterministic read-only Sheet export and idempotent import preparation, reconciliation, private authorization validation, and staging/rollback documentation. Local workerd/D1 acceptance passes 10/10 with same-origin bootstrap, activation/logout, request-only privacy, all five role routes, split allocation/release/lending, canvass/procurement/cumulative receiving, cross-committee denial, duplicate guards, fail-closed evidence, and reconciliation. Repository acceptance passes with 52 Vitest files / 369 tests and full Playwright passes 90 / 204 intentional skips / 0 failed.

The repository/local candidate is committed and pushed at `62abc6d1e1d6b3079e8508381b7c336c636080e5`; draft PR #9 matched that head and all six checks passed on 2026-07-22. No remote Cloudflare or Google command has run. The smallest safe next action is to create and privately approve the outside-Git authorization package bound to that exact commit and its artifact/Worker/mapping/migration hashes. Gate B must validate before `wrangler whoami` or any Google read.
