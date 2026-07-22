# Phase 3 Task 1 live staging handoff

Task 1 is complete. Phase 3 is not complete, production remains gated, and draft PR #9 must not be merged by this handoff.

## Exact boundary

- Repository: `D:\Documents\Codex\HAU-USC Logistics\active\hau-usc-logistics-management-system`
- Branch: `chore/v0.6-codex-continuity-bootstrap`
- Exact deployed candidate: `af0e82b0cf33862a1b4274bd6e8a20bcd75f7df1`
- Safe staging URL: `https://hau-usc-logistics-staging.earllawrence-adriano-ce.workers.dev`
- Worker safe label: `hau-usc-logistics-staging`
- Route policy: staging-only `workers.dev`; no custom or production route
- D1 safe label: `hau-usc-logistics-staging`
- Google source: preserved read-only
- Approved staging Sheet safe label: `HAU-USC Logistics — STAGING APPROVED REDACTED 2026-07-22`

Private account, database, workbook, folder, version, bookmark, credential, and session values remain outside Git.

## Evidence index

| Milestone | Result |
| --- | --- |
| Cloudflare discovery | Authenticated account verified; no Worker or D1 existed before Task 1; account capacity was available |
| Google discovery | Canonical production, operational, and staging workbooks verified read-only; the existing staging root and all seven required folder mappings were verified |
| Privacy classification | Existing staging workbook contained unapproved identity/audit values, so it was copied and redacted without mutating the source |
| Approved Sheet snapshot | Snapshot `51b4fc91d1516fdea24a8686149a5de53b4ea884fe38b25dfa0b70e09f02941f`; one canonical inventory row; all operational, identity, supplier, evidence, history, and audit rows excluded |
| Drive mappings | 7 / 7 complete: root, receipts, canvass, release, deliverable, lending, archive |
| Import batch | `IMP-51b4fc91d1516fdea24a8686`; source 1, imported 1, rejected 0 |
| D1 migrations | `0001_operational_schema.sql` through `0007_entity_committee_scope.sql` applied in order; no pending migration |
| Idempotency | The approved import was applied twice locally and twice remotely without duplicate imported rows |
| Reconciliation | Negative balances 0; over-received lines 0; duplicate handoffs 0; duplicate returns 0; unscoped requests/lending/restock/deliverables all 0 |
| Recovery | No pre-existing D1 data required export; pre-migration, post-import, and pre-auth-rehash Time Travel recovery records are retained privately; the preceding Worker version is retained privately |
| Authentication repair | Live staging exposed Cloudflare's PBKDF2 ceiling of 100,000 iterations. Candidate `af0e82b` uses the runtime maximum, adds a regression test, and regenerates only the five approved synthetic staging hashes |
| Repository acceptance | `npm run check`: 52 Vitest files / 370 tests; lint, governance, builds, Apps Script parity, standalone verification, Cloudflare types, and dry-run passed |
| Browser acceptance | Full Playwright: 90 passed / 204 intentional skips / 0 failed |
| Local Worker/D1 | Managed Wrangler local server plus isolated D1: 10 / 10 Chromium tests passed |
| Remote CI | PR #9 at `af0e82b`: validate, verify, build, report-build-status, deploy, and browser-smoke passed |
| Live smoke | Root and five SPA routes 200; shell 455,685 bytes; health/readiness pass; D1 connected; latest migration `0007`; five role routes pass; imported inventory count 1; request-only privacy checks pass |

## External writes performed

- Created one redacted staging workbook copy under the verified staging root.
- Cleared operational/identity/supplier/evidence/history/audit data from that copy and removed noncanonical blank-ID inventory rows; the source workbooks were not mutated.
- Created one staging D1 database.
- Applied seven ordered migrations and the approved idempotent import.
- Seeded five non-personal staging role accounts under `HAU_V06_TASK1_SYNTHETIC_20260722`.
- Deployed the staging Worker and then deployed the reviewed PBKDF2 compatibility repair to the same staging-only Worker.

No production resource, custom route, PR merge, evidence upload, production promotion, destructive cleanup, or history rewrite occurred.

## Private evidence retained outside Git

- authorization packages bound to the pre-fix and final deployed candidates;
- private Wrangler and Google configurations;
- discovery records and safe target mappings;
- approved Sheet exports, prepared SQL, rejection records, and reconciliation SQL/results;
- D1 recovery bookmarks/timestamps and Worker version records;
- five-role credential manifest;
- live-smoke evidence.

## Task 2 boundary

Task 2 must perform live staging acceptance and repair against the exact URL and deployed candidate above. It owns full workflow/data/idempotency/evidence/sync/performance/load/browser/accessibility/recovery/training acceptance, evidence uploads if approved, rollback rehearsal, and cleanup or retention. It must not promote production or merge PR #9.
