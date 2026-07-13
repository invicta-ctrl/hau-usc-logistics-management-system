# V1 Readiness Audit

## Audit identity

- Candidate: `1.0.0-rc.1`
- Date: `2026-07-13` (`Asia/Manila`)
- Branch: `feat/v1-one-shot-demo-and-deployment`
- Draft PR: [#3 — feat: complete V1 demo and deployment readiness](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/3), stacked on `feat/live-sync-lending-search-catalog-controls`
- Verified base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`
- Integrated QA checkpoint: `4e871506f0bc2394f25beeab73187847289f7b10`
- Release-candidate code checkpoint: `283002cf2784b0d3e148258278c664f8afb0d7f4`
- Deployment hardening: bounded setup ranges and fail-closed handling for legacy values outside the approved circulation enum
- Final handoff SHA: the branch HEAD after this remote-evidence record; report it from Git after the evidence commit is pushed because a commit cannot contain its own SHA
- Audit scope: repository implementation, local production build, standalone demos, Google Workspace deployment readiness, GitHub readiness, and future-platform preparation

This is an evidence ledger, not a declaration that source code is live. Repository readiness, local demo readiness, staging readiness, and production readiness are separate states.

## Executive decision

| Decision area | Result | Reason |
| --- | --- | --- |
| Mergeable repository candidate | Ready for draft review | Draft PR #3 is clean/mergeable and all three required checks passed at code checkpoint `283002cf2784b0d3e148258278c664f8afb0d7f4` |
| Standalone fictional demo | Ready | Three pinned self-contained portal files build and pass direct-file browser checks |
| Apps Script source package | Locally ready | Static, parser-safe assembly, callable, and browser package checks pass |
| Staging deployment | Deployed; bounded acceptance passed | Version 13 serves the corrected package; setup, schema, Drive, trigger, parity, internal/request-only/lending smoke, and staging diagnostic evidence passed; workflow mutations remain unrun |
| Live Sheets/Drive migration | Partially accepted | Fresh private backups, schema setup, Drive validation, migration dry run, reconciliation, launch backup, and health checks passed; approved migration application and full workflow/evidence tests remain unrun |
| Production release | Package promoted; release gate open | Version 3 serves the corrected package and read-only smoke passed; full D4 acceptance, owner/privacy/security approval, and rollback drill remain outstanding |
| Tag/GitHub release | Not appropriate yet | Candidate remains a release candidate with live security/data-integrity gates unresolved |

## Six-specialist orchestration evidence

| Specialist | Accepted output | Target integration | Principal evidence |
| --- | --- | --- | --- |
| 1 — Frontend, UX, accessibility | `971417e` | `6cec509` | Portals, workflows, admin UI, responsive/accessibility browser coverage |
| 2 — Apps Script, APIs, authentication | `eba02bb` | `95423cd` | Server routing, permissioned APIs, command journal, lending/canvass/admin contracts |
| 3 — Sheets schema, ledger, migration | `6848518` | `29a4b34` plus `d416faa` | Additive repair, formula safety, protections, backup and command validation tests |
| 4 — Drive, evidence, branding | `07c0aaf` | `b767aab` | Eleven folders, permission/magic/dimension/dedupe/quarantine/branding tests |
| 5 — Security, privacy, QA | `eb3edf4` | `4e87150` | Release preflight/recovery, admin/revision, privacy, requester downgrade, return adapter repairs |
| 6 — CI, documentation, future platform | `561b53d` | `cf06070` | Governance checks, operating docs, provider matrix, proposed ADR and migration plan |

The orchestrator separately integrated shared-contract corrections (`57876f1`), checkpoint documentation (`c9e2441`), command-journal alignment (`d416faa`), release versioning, portal artifact generation, and final handoff evidence. No specialist pushed or mutated Google Workspace.

## Product acceptance

| Capability | Repository evidence | Live evidence | Result |
| --- | --- | --- | --- |
| Dynamic Overview and event readiness | Implemented and browser-tested | Not deployed | Repository pass |
| Event logistics and office restock requests | Selector/search/duplicate/validation flows implemented | No live write | Repository pass |
| Inventory, registration, archive/restore | Permissioned metadata APIs; ledger-only quantity rules | No live write | Repository pass |
| Requester-safe Lending Hub | Dedicated sanitized bootstrap, eligibility, receipt, no insecure history | No two-account live test | Repository pass; live pending |
| Release Desk and returns | Aggregate preflight, recovery code, partial/full, damage/loss evidence | No live ledger/evidence smoke | Repository pass; live pending |
| Canvass/supplier reference library | Staff-only lifecycle/search/pagination hooks | No live record | Repository pass; live pending |
| Admin Dashboard | Access/events/content/branding controls aligned with server contracts | No live admin mutation | Repository pass; live pending |
| Roadmap and What Changed | Structured published-content source and safe renderer | No live publish | Repository pass; live pending |
| Branding | Protected upload/version/activation/fallback | No official asset uploaded or activated | Repository pass; live pending |

### Live portal smoke

| Environment | Route | Result |
| --- | --- | --- |
| Staging | Main Hub/internal | Passed: Apps Script staging mode, internal navigation, live sync indicator |
| Staging | Request Center/request-only | Passed after bootstrap wait; sanitized response and no tested private fields |
| Staging | Lending Hub/requester-safe | Passed; legacy TO_CLASSIFY item displayed as blocked VERIFY/non-circulating |
| Staging | Diagnostic | Passed; staging-only diagnostic rendered without operational data or Sheet/Drive writes |
| Production | Main Hub/internal | Passed: Apps Script production mode, internal navigation, live sync indicator |
| Production | Request Center/request-only | Passed after bootstrap wait; sanitized response and no tested private fields |
| Production | Lending Hub/requester-safe | Passed after bootstrap wait; no tested private fields; no workflow mutation |

These are read-only/browser-bound smoke results. They do not replace the two-account authorization test, full mutation matrix, evidence upload, content/branding, or ledger reconciliation acceptance.

## Security and privacy acceptance

- Public/request/lending bootstraps use explicit DTO allowlists and server-owned portal routing.
- An unregistered institutional identity is downgraded to sanitized request state rather than loading internal collections.
- Request-only bootstrap does not build ledger/reservation indexes and never returns users, permissions, audit, suppliers, private contacts/tax fields, evidence/Drive internals, notes, provenance, or exact protected balances.
- Student ID is a workflow field, never access authority. Public ticket history remains disabled instead of using an insecure identifier lookup.
- Staff/admin mutations re-authorize on the server; UI hiding is not relied upon.
- Formula-leading strings are neutralized in all Sheet repository append/batch/update paths.
- Evidence authorization precedes decode/Drive access. MIME, extension, magic bytes, encoded/decoded size, image dimensions/pixels, safe parent, and private sharing are verified.
- Demo seed identities and contact/student/tax fields use explicit fictional/reserved tokens.
- Only `src/services/apps-script-adapter.js` contains the browser `google.script.run` gateway.
- The tracked current tree passes the sensitive-content scanner. A previously committed spreadsheet identifier remains in shared history and requires owner resource review; history was not rewritten.

Residual production security gates: institutional access/MFA/offboarding evidence, approved data/backup/evidence retention, incident contacts, production audience, supplier/evidence sharing policy, malware/PDF active-content scanning policy, manual accessibility review, and verified live Drive inheritance.

## Sheets and ledger acceptance

- Schema `1.2.0` covers `01_ITEM_MASTER` through `22_COMMAND_JOURNAL` while preserving four legacy tabs.
- Setup is additive: missing sheets/headers/config rows are added; compatible existing order/data stays; incompatible, duplicate, or blank headers stop setup.
- Repeated and partial setup tests prove no duplicate headers, rows, validations, or warning protections.
- Conservative catalog/access defaults fill only blank new fields. `VERIFY`, inactive, archived, and non-circulating records remain fail-closed.
- Central writes neutralize formula-leading text without coercing numbers, booleans, or dates.
- Ledger, audit, history, and command-journal integrity are append-only/forward-correction based.
- Backup creation requires distinct configured operational/backup resources and verifies the copied file before success.

Fresh private predeployment spreadsheet backups were created and verified for staging and production. Schema 1.2.0 setup, validation, Drive validation, trigger setup, migration dry run, reconciliation, launch backup, health check, and adapter read smoke completed. No approved migration application, demo seed, user seeding, operational mutation, or ledger write test occurred. Legacy handling values outside the approved enum remain source-preserved and fail-closed as VERIFY/non-circulating.

## Drive, evidence, and branding acceptance

Canonical exact direct children under one configured private root:

1. Requests
2. Lending
3. Releases and Returns
4. Procurement
5. Canvassing
6. Receipts and Invoices
7. Inventory Evidence
8. Branding
9. Exports
10. Backups
11. Quarantine

Configuration validation rejects missing/placeholder/inaccessible IDs, wrong parent/name, duplicate exact children, canonical/legacy conflicts, cross-key reuse, unsafe sharing, and My Drive fallback. Setup resolves an existing exact child before creating a missing one and records canonical/legacy aliases consistently.

Evidence uses deterministic privacy-safe filenames, protected original-name metadata, checksum deduplication, verified private parent/sharing, and explicit quarantine/recovery metadata. Branding uses server-owned version IDs, verified byte metadata/dimensions/checksum, activation history, supersession, and built-in text fallback. Client/public DTOs never return private Drive URLs or IDs.

The configured private Drive roots and eleven canonical direct children were validated in both environments, and the fresh backup destinations were verified private. No new root/folder creation, sharing change, evidence upload, quarantine move, branding upload, or activation occurred.

## Automated verification evidence

### Baseline

- `npm ci`: 139 packages, 0 reported vulnerabilities.
- Unit: 12 files / 93 tests passed.
- `npm run check` and `npm run verify`: passed.
- Browser: 38 passed / 40 intentional skips across six viewports.

### Integrated QA checkpoint

- Focused new security/integrity tests: 15/15 passed.
- Full unit after deployment hardening: 19 files / 148 tests passed.
- ESLint and all four governance checks: passed.
- `npm run check` and `npm run verify`: passed.
- Apps Script: 27 source files, 26 public/setup callables, and 3 private trigger handlers validated.
- Browser: 60 passed / 60 intentional applicability skips across 320, 390, 768, 1024, 1366, and 1440 px.
- Portal shareables: 18/18 direct `file://` tests passed across the same widths.

### Final release build

| Evidence | Final value |
| --- | --- |
| Toolchain | Node `v26.3.0`; npm `11.16.0`; Playwright `1.61.1`; Git `2.54.0.windows.1` |
| Clean install | Passed: 139 packages added, 140 audited, 0 reported vulnerabilities; `esbuild@0.28.1` emitted an allow-scripts review warning |
| Unit | 19 files / 147 passed / 0 failed |
| Check/package | ESLint, all 4 governance gates, `npm run check`, `npm run verify`, 27 Apps Script sources / 26 public/setup callables / 3 private trigger handlers passed |
| Combined Playwright | 60 passed / 60 intentional applicability skips / 0 failed across 120 configured cases and six viewports |
| `dist/index.html` | 288,464 bytes / `25db9bfa66bae8661eff204f8428ec28d7d389757af30b5fbe4dd926ef1d8f13` |
| Legacy shareable alias | 288,464 bytes / `25db9bfa66bae8661eff204f8428ec28d7d389757af30b5fbe4dd926ef1d8f13` |
| Main Hub shareable | 288,492 bytes / `0ef3641f25fb1d2f18570570da91e0e38b1000b8f4d639848d844c7e93b7830b` |
| Request Center shareable | 288,491 bytes / `516c0ef394b78c096622796a6699e0e921d67c41f883b3761f4f8d0d919db57b` |
| Lending Hub shareable | 288,491 bytes / `299c0f9df2bc6409d95f7d75e85d5b379a90b4841de1f773f6fce84024263417` |
| Apps Script `Index.html` | 652 bytes / `15f484d98c97b28e93adab9d6aa659752013ed5e6db28c87410e0d29a809a063` |
| Apps Script `AppBody.html` | 28,967 bytes / `b90a90470fec14fb5fc3936f068733d28d91d102c24fbc9da53ec044efc0ace2` |
| Apps Script `AppStyles.html` | 31,609 bytes / `4c17efda740f334aa90d9bcd4eb13ce6f4eb0da8152ce213788e4732f45d28b9` |
| Apps Script `AppScript.html` | 226,964 bytes / `5e00715fb3260b3669a80c06275a1f046f91712f2d2ec1ef664f913b03e631c3` |
| Determinism | Two consecutive builds reproduced all nine byte lengths and SHA-256 values exactly |
| Sensitive/docs/governance | Passed after staging: 239 tracked paths sensitive-clean; 45 tracked Markdown files/link-clean; continuation and AGENTS guardrails passed |
| GitHub CI | Passed for trigger-security checkpoint `5a72340988eedef8c17a7e0b752ba68a02714bfd`: Apps Script [run 29235731774](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29235731774); repository/browser [run 29235731769](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29235731769) |

Local evidence and trigger-security-checkpoint GitHub CI are complete. The final evidence commit must also be pushed and checked through PR #3 before handoff. Staging and production remain independent gates; their read-only smoke does not imply full workflow acceptance.

## Standalone portal deliverables

- `HAU-USC_Logistics-Main-Hub-Shareable.html` — `data-portal-mode="internal"`
- `HAU-USC_Logistics-Request-Center-Shareable.html` — `data-portal-mode="request"`
- `HAU-USC_Logistics-Lending-Hub-Shareable.html` — `data-portal-mode="lending"`
- `HAU-USC_Logistics-Prototype-Shareable.html` — byte-identical compatibility alias of `dist/index.html`

They contain inline classic JavaScript/CSS and fictional local state. They are safe review/demo artifacts, not substitutes for server authorization or durable shared records.

## Deployment and rollback gate

The ignored production clasp configuration and separate private staging configuration resolve to the exact title-labeled projects. The corrected package was pushed and pulled in both environments with exact 33-file source/manifest parity. Staging serves Version 13 and production serves Version 3 through existing deployment pointers. Clasp 3.3 does not support push --dry-run; parity was established with pre/post pull snapshots instead.

The release gate remains open because no approved non-personal acceptance fixture exists for the full mutation matrix, the authoritative item master contains legacy TO_CLASSIFY handling values awaiting owner reconciliation, and manual accessibility/two-account/privacy/evidence-upload approval is outstanding. The Google account also showed an Almost out of storage warning at approximately 14.03 GB of 15 GB; no files were deleted.

Repository rollback point is `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`. Private live rollback inventory is staging Version 9 before current Version 13 and production Version 1 before Version 2 and current Version 3. Additive schema and posted records are retained during application rollback; corrections are forward and audited. Trigger-handler failure also requires restoring the captured predeployment source.

## Future platform readiness

The proposed preference is Cloudflare Pages/Workers/Queues plus Supabase Singapore PostgreSQL/Auth/private Storage. The close runner-up is Firebase Hosting + Cloud Run + Cloud SQL PostgreSQL + Firebase Auth + Cloud Storage plus a Google-managed queue. The decision is proposed, not procured or deployed, and must reverse if institutional Google ownership, cross-vendor policy, RPO/RTO, identity, privacy, measured Philippine latency, or governed cost favors the runner-up.

Both paths retain PostgreSQL as the only command authority, a transactional outbox, durable asynchronous Sheets reporting projection, idempotent retry/dead letter, reconciliation, private object storage, and one explicit cutover/rollback boundary.

## Actions that did not occur

- No approved staging/production workflow transaction, ledger movement, evidence upload, content/branding mutation, or user-access mutation.
- No applyApprovedMigration, seedStagingDemoData, or fictional production transaction.
- No production operational promotion or release sign-off beyond the existing deployment-pointer update.
- No protected PR #2 modification.
- No branch merge, tag, or GitHub release before live gates.
- No official logo fabrication or upload.
- No secret/live identifier intentionally printed or committed in the current tree.
- No git history rewrite.
