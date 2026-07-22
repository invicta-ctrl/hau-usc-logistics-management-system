# Phase 3 local acceptance

## Candidate scope

This record covers repository and local Cloudflare-compatible behavior only. It is not proof of a remote Cloudflare deployment, approved Google Sheet migration, real evidence bridge, rollback rehearsal, or production readiness.

## Verified locally on 2026-07-22

- Ordered D1 migrations applied under Wrangler local D1, including entity committee scope and database transaction guards.
- Workerd served the SPA and API with D1 connected; health/readiness and migration status returned successfully.
- Same-origin staging bootstrap, SPA fallback, request-only mode, first-login activation, persistent session, and logout completed in real Chromium through workerd.
- Five synthetic local accounts reached only their server-routed Administrator, Director, Food, Inventory & Pantry, and Materials experiences without a bootstrap failure.
- Request submission/replay, explicit stock/procurement split routing, review, reservation, release/replay, lending approval/handoff/return, canvass save/replay/preference, procurement transitions, restock receipt, and cumulative deliverable receiving completed through the Worker API.
- Duplicate handoff/return and over-receiving attempts were rejected; an Administrator without fulfillment capability could not reserve stock.
- Raw evidence payloads failed closed while the private evidence bridge was unconfigured; request-only API data omitted stock quantities and locations, and unauthenticated protected routes returned safe denial.
- Food-owned workflow data was stored with `COM_FOOD`; a Materials actor received `OUT_OF_SCOPE`, Materials reads excluded the Food request, and Director access to the Administrator family was denied.
- Ledger balances, reservation coverage, cumulative receiving, duplicate guards, audit/history, and idempotency reconciled with no negative balance or duplicate workflow record.
- A fictional outside-Git Sheet export validated, generated private import SQL, applied twice to local D1 without duplication, and reconciled with zero quarantined rows.

## Final local candidate evidence

- `npm run check`: passed; governance, lint, 52 Vitest files / 369 tests, deterministic source/generated builds, 34 Apps Script sources / 55 required functions, standalone verification, Cloudflare types, and Worker dry-run.
- `npm run test:e2e:cloudflare:local`: 10 passed / 0 failed against a fresh isolated workerd and D1 state.
- `npm exec -- playwright test --reporter=dot`: 90 passed / 204 intentional skips / 0 failed across 294 scheduled cases.
- Post-workflow D1 reconciliation: 26 audit rows, 13 status-history rows, 16 idempotency rows, and zero negative inventory, over-received lines, duplicate handoffs, duplicate returns, or duplicate receiving idempotency keys.
- `dist/index.html`: 455,685 bytes; SHA-256 `d78f4fc3c741e67349b60d8fe3615767767db0ef55d98acf58243d4aaa5e1782`.
- Worker source SHA-256: `6f052417ef964163507b3c86aefdc81a122119c6cfc1d8e9f2619978ca78a838`.
- Sheet-to-D1 mapping SHA-256: `e5da23e42e0f3b11037f7f784182d55d2d1cea9df2430df3e45e65ae9213f74c`.
- `git diff --check`, 65-file changed-scope sensitive filename/value scan, and `npm audit --omit=dev` passed.
- Full `npm audit` remains non-green because Wrangler 4.113.0 currently resolves a dev-only Miniflare/sharp advisory chain (three high findings). The suggested forced downgrade is not accepted; deployed application dependencies contain zero reported vulnerabilities.

## Remaining mandatory checks

- exact candidate commit/push and remote CI verification;
- valid private staging authorization package bound to that commit and artifact hashes;
- read-only Cloudflare and Google target preflight;
- remote D1 backup and restore proof;
- migration from the approved real Sheet snapshot, not the fictional local fixture;
- externally reachable staging deployment and deployed D1 connectivity;
- authorized staging workflow, privacy, performance, evidence/Drive bridge, and rollback matrix;
- durable Phase 3 completion handoff and final repository acceptance.

The smallest safe next external action is to create and approve the private package with `npm run phase3:authorization:init -- <absolute-private-json-path>` after the final candidate commit exists, then validate it. No remote command is allowed before that gate passes.
