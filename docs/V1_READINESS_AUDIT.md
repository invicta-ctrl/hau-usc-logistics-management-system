# V1 Readiness Audit

## Audit identity

- Candidate: `1.0.0-rc.1`
- Date: `2026-07-13` (`Asia/Manila`)
- Branch: `feat/v1-one-shot-demo-and-deployment`
- Draft PR: [#3 — feat: complete V1 demo and deployment readiness](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/3), stacked on `feat/live-sync-lending-search-catalog-controls`
- Verified base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`
- Integrated QA checkpoint: `4e871506f0bc2394f25beeab73187847289f7b10`
- Release-candidate code checkpoint: `283002cf2784b0d3e148258278c664f8afb0d7f4`
- Final handoff SHA: the branch HEAD after this remote-evidence record; report it from Git after the evidence commit is pushed because a commit cannot contain its own SHA
- Audit scope: repository implementation, local production build, standalone demos, Google Workspace deployment readiness, GitHub readiness, and future-platform preparation

This is an evidence ledger, not a declaration that source code is live. Repository readiness, local demo readiness, staging readiness, and production readiness are separate states.

## Executive decision

| Decision area | Result | Reason |
| --- | --- | --- |
| Mergeable repository candidate | Ready for draft review | Draft PR #3 is clean/mergeable and all three required checks passed at code checkpoint `283002cf2784b0d3e148258278c664f8afb0d7f4` |
| Standalone fictional demo | Ready | Three pinned self-contained portal files build and pass direct-file browser checks |
| Apps Script source package | Locally ready | Static, parser-safe assembly, callable, and browser package checks pass |
| Staging deployment | Blocked before mutation | Exact title-labeled project is privately reconciled at Version 10 with Version 9 retained; backup, properties, audience, and live acceptance remain outstanding |
| Live Sheets/Drive migration | Blocked | Current CLI OAuth cannot read Sheets or export the workbook; no authoritative mapping read or verified pre-push backup exists |
| Production release | Not ready | Staging workflow/privacy/reconciliation, governance approvals, and rollback drill are outstanding |
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

No live workbook backup, setup, migration, seed, protection, formula, reconciliation, or adapter write test occurred because the owner-authorized Sheets/Drive verification path is not yet available.

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

No live root/folder creation, sharing change, upload, evidence attachment, quarantine move, branding upload, or activation occurred.

## Automated verification evidence

### Baseline

- `npm ci`: 139 packages, 0 reported vulnerabilities.
- Unit: 12 files / 93 tests passed.
- `npm run check` and `npm run verify`: passed.
- Browser: 38 passed / 40 intentional skips across six viewports.

### Integrated QA checkpoint

- Focused new security/integrity tests: 15/15 passed.
- Full unit after production-trigger hardening: 19 files / 147 tests passed.
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
| GitHub CI | Passed for code checkpoint `283002cf2784b0d3e148258278c664f8afb0d7f4`: Apps Script [run 29230937478](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29230937478); repository/browser [run 29230937486](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29230937486) |

Local evidence and code-checkpoint GitHub CI are complete. The evidence-only branch HEAD must also be green before handoff; obtain that final state from PR #3 after push. Staging and production remain independent gates and are not implied by these results.

## Standalone portal deliverables

- `HAU-USC_Logistics-Main-Hub-Shareable.html` — `data-portal-mode="internal"`
- `HAU-USC_Logistics-Request-Center-Shareable.html` — `data-portal-mode="request"`
- `HAU-USC_Logistics-Lending-Hub-Shareable.html` — `data-portal-mode="lending"`
- `HAU-USC_Logistics-Prototype-Shareable.html` — byte-identical compatibility alias of `dist/index.html`

They contain inline classic JavaScript/CSS and fictional local state. They are safe review/demo artifacts, not substitutes for server authorization or durable shared records.

## Deployment and rollback gate

The ignored production clasp configuration and a separate private staging configuration now resolve to the exact title-labeled projects. Read-only `clasp` inventory and remote pulls are complete. Do not push, version, deploy, inspect/change properties or triggers, or touch Sheets/Drive until the owner-authorized Sheets/Drive path verifies properties, mappings, audience, and a restorable pre-push backup.

Smallest human action: authorize a signed-in browser fallback or provide OAuth with Sheets and reviewed Drive access. Then follow the exact staged backup, schema, Drive, access, trigger, source-parity, deployment, two-account privacy, workflow, reconciliation, and rollback sequence in the runbooks.

Repository rollback point is `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`. Private live rollback inventory is staging Version 9 before current Version 10 and production Version 1 before any V1 promotion. Additive schema and posted records are retained during application rollback; corrections are forward and audited. Trigger-handler failure also requires restoring the captured predeployment source.

## Future platform readiness

The proposed preference is Cloudflare Pages/Workers/Queues plus Supabase Singapore PostgreSQL/Auth/private Storage. The close runner-up is Firebase Hosting + Cloud Run + Cloud SQL PostgreSQL + Firebase Auth + Cloud Storage plus a Google-managed queue. The decision is proposed, not procured or deployed, and must reverse if institutional Google ownership, cross-vendor policy, RPO/RTO, identity, privacy, measured Philippine latency, or governed cost favors the runner-up.

Both paths retain PostgreSQL as the only command authority, a transactional outbox, durable asynchronous Sheets reporting projection, idempotent retry/dead letter, reconciliation, private object storage, and one explicit cutover/rollback boundary.

## Actions that did not occur

- No live Google Sheet, Drive, Apps Script, Script Property, trigger, content, branding, backup, or deployment write.
- No staging or production smoke test using a real adapter.
- No production promotion.
- No protected PR #2 modification.
- No branch merge, tag, or GitHub release before live gates.
- No official logo fabrication or upload.
- No secret/live identifier intentionally printed or committed in the current tree.
- No git history rewrite.
