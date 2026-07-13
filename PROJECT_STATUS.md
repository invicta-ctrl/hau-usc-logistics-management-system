# Project Status

## Current release candidate

- Version: `1.0.0-rc.1`
- Date: `2026-07-13` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Worktree: `D:\Documents\DOL Website GitHub - V1 Deployment`
- Branch: `feat/v1-one-shot-demo-and-deployment`
- Verified base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`
- Integrated QA checkpoint: `4e871506f0bc2394f25beeab73187847289f7b10`
- Deployment hardening: bounded setup ranges and fail-closed handling for legacy values outside the approved circulation enum
- Final handoff SHA: report the branch HEAD from Git after this evidence commit is pushed
- Upstream/PR: tracks `origin/feat/v1-one-shot-demo-and-deployment`; draft [PR #3](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/3) targets `feat/live-sync-lending-search-catalog-controls`; protected draft PR #2 remains untouched
- Live Apps Script version/deployment: staging **Version 13 / existing deployment pointer**; production **Version 3 / existing deployment pointer**; private deployment references remain outside git
- Production: **corrected package deployed and read-only smoke verified; full mutation acceptance and release approval remain incomplete**

## Readiness by layer

| Layer | State | Evidence / gate |
| --- | --- | --- |
| Repository implementation | Release candidate | Frontend, Apps Script, Sheets, Drive, QA, governance, and future-platform slices integrated |
| Local standalone demo | Ready | Main, Request, and Lending shareables build and open directly with fictional data |
| Apps Script package | Locally verified | Parser-safe generated package, static callable validation, and assembled-browser tests |
| Staging environment | Deployed; bounded acceptance passed | Version 13 is serving; schema/Drive/trigger/setup checks, source parity, internal/request-only/lending smoke, and staging diagnostic passed; workflow mutations were not run |
| Live Sheets/Drive acceptance | Partially accepted | Fresh private predeployment backups were created and verified; schema 1.2.0, Drive validation, migration dry run, reconciliation, and health checks passed; full workflow/evidence upload acceptance remains unrun |
| Production promotion | Package promoted; release gate open | Version 3 is serving and internal/request-only/lending smoke passed; full D4 mutation acceptance, owner/privacy approval, and rollback drill remain outstanding |
| GitHub review | Draft review | Draft PR #3 remains stacked on the feature branch; current source/docs commit and CI state must be verified after push; no merge/tag/release |

## Integrated V1 behavior

### Frontend and portals

- Dynamic event/sub-event readiness, progress, overdue cues, and workflow navigation.
- Event logistics and office restock requests with selector-backed context, predictive catalog search, duplicate consolidation, safe confirmation, and status tracking.
- Staff inventory/catalog create/edit/relocate/archive/restore controls without direct quantity rewriting.
- Requester-safe Lending Hub with catalog eligibility guidance, secure submission, confirmation receipt, and no insecure history fallback.
- Release Desk with aggregate preflight, partial-release reasons, recipient confirmation, return due visibility, partial returns, loss/damage accounting, and conditional photo evidence.
- Paginated/searchable canvass reference workflow, structured Roadmap/What Changed, and admin controls for access, events, content, and branding.
- Separate Main Hub, Request Center, and Lending Hub standalone shareables pinned to their own portal modes.

### Apps Script and permissions

- One browser gateway for `google.script.run`; mock, Apps Script, and future HTTP adapters preserve semantic method boundaries.
- Server-owned portal downgrade prevents public/requester sessions from loading internal bootstrap collections or ledger/reservation indexes.
- Public DTO allowlists exclude users, permissions, audit, suppliers, contacts, tax fields, private notes, Drive IDs/URLs, protected balances, ledger, and evidence internals.
- Mutations enforce permission, validation, server IDs, idempotency, locking where state may race, audit/history, and data-revision rules.
- Multi-line release validates every line, aggregate stock/event balance, reservations, recipient, and evidence before operational writes. Unexpected post-write failure returns `RELEASE_RECOVERY_REQUIRED` with bounded reconciliation context.
- Content keys and branding keys preserve stable underscore tokens; content draft/publish/revert rejects stale expected revisions and retains reasons.

### Google Sheets source

- Schema version `1.2.0` defines 22 backend tabs plus four preserved legacy tabs.
- `setupDatabase()` creates only missing tabs/headers/config rows, fills only blank conservative defaults, applies validations/warnings, and stops on duplicate/blank/incompatible known headers.
- All repository writes use formula-leading text neutralization; typed values remain typed.
- System-managed columns receive warning protections; server authorization remains the real control.
- Posted ledger, audit, history, release, evidence, and command-journal records are never silently rewritten or deleted.
- Backup routing requires a distinct configured destination and verifies the copied spreadsheet before reporting success.

### Google Drive source

- Eleven exact canonical direct children: Requests; Lending; Releases and Returns; Procurement; Canvassing; Receipts and Invoices; Inventory Evidence; Branding; Exports; Backups; Quarantine.
- Root/folder IDs, exact names, direct parents, duplicate children, legacy aliases, cross-key reuse, and private sharing are validated fail-closed.
- Upload authorization happens before decode/Drive work. Encoded and decoded limits, MIME/extension/magic signatures, image dimensions/pixels, deterministic privacy-safe names, checksums, duplicate verification, private parent/sharing, and quarantine recovery are implemented.
- Branding upload uses a protected byte endpoint, server IDs, verified dimensions/checksum/storage, version history, activation history, and a text fallback; client DTOs omit private Drive URLs/IDs.

## Verification snapshot

- Baseline before V1: `npm ci` passed with 139 packages and 0 reported vulnerabilities; 12 files / 93 unit tests; 38 browser passes / 40 intentional skips.
- Integrated QA plus deployment hardening: 19 files / 148 unit tests passed; ESLint and governance passed; `npm run check` passed; 27 Apps Script source files, 26 public/setup callables, and 3 private trigger handlers validated.
- Final combined browser matrix: 60 passed / 60 intentional applicability skips / 0 failed across 120 configured cases at all six viewports. This includes 18/18 direct `file://` portal checks for pinned mode, active view, navigation isolation, and no page-level overflow.
- Two consecutive builds reproduced all nine generated artifacts byte-for-byte. Canonical `dist/index.html` is 288,464 bytes at SHA-256 `25db9bfa66bae8661eff204f8428ec28d7d389757af30b5fbe4dd926ef1d8f13`; exact portal and Apps Script hashes are in `docs/V1_READINESS_AUDIT.md`.
- Final local verification used Node `v26.3.0`, npm `11.16.0`, Playwright `1.61.1`, and Git `2.54.0.windows.1`.
- GitHub passed `validate` in [Apps Script static check run 29235731774](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29235731774), plus `verify` and `browser-smoke` in [CI run 29235731769](https://github.com/invicta-ctrl/hau-usc-logistics-management-system/actions/runs/29235731769), for trigger-security checkpoint `5a72340988eedef8c17a7e0b752ba68a02714bfd`.
- Live browser smoke: staging and production internal, request-only, and requester-safe lending routes loaded in Apps Script mode with no tested private-data leakage; staging diagnostic route passed. Invalid legacy handling rendered as VERIFY/non-circulating and was not transactable.

## External-action record

The corrected 33-file Apps Script package was pushed to staging and production, pulled back, and matched local source/manifest parity with 0 mismatches. Staging now serves immutable Version 13 and production serves immutable Version 3 through their existing deployment pointers; prior staging Version 9 and production Version 1 remain private rollback points, with production Version 2 also retained as the preceding accepted package.

Owner-authorized browser work created and verified fresh private predeployment spreadsheet backups, updated private backup properties, completed setup/schema/Drive/trigger/migration/reconciliation/health checks, and verified live portal smoke. No operational request, restock, lending, release, return, evidence upload, content/branding, user-access, or ledger transaction was executed. No PR #2 change, merge, tag, or GitHub release occurred.

## Hard blocker and smallest owner action

The active clasp identity can manage Apps Script and limited Drive metadata, but it cannot read Sheets or export the workbook. Before any source push, the owner must authorize a signed-in browser fallback or provide OAuth with Sheets and reviewed Drive access so the operator can verify Script Properties, operational/backup distinction, authoritative Drive mappings, the web-app audience, and a fresh restorable backup. Staging acceptance must still precede production.

The active branch cannot be marked release-ready until an approved non-personal acceptance fixture or owner-approved test records are available for the full D4 mutation matrix. The authoritative item master also contains legacy `TO_CLASSIFY` handling values; the source now maps them to VERIFY/non-circulating and refuses circulation rather than guessing a classification. The owner must approve reconciliation decisions before any item can transact.

The Google Workspace account displayed an “Almost out of storage” warning at approximately 14.03 GB of 15 GB. No files were deleted. The resource owner must review storage capacity and retention before broader evidence uploads. The repository history also contains a spreadsheet identifier removed from the current tree; the resource owner must verify restriction/rotation/replacement according to institutional policy. This task did not rewrite shared history.

## Rollback point

- Repository pre-V1 base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`.
- Local V1 commits are additive and preserve the legacy visual baseline.
- Private rollback inventory: staging immutable Version 9 precedes current Version 13; production immutable Version 1 is the original baseline, Version 2 is the preceding accepted package, and Version 3 is current. Deployment identifiers stay outside git and public output.
- Trigger-handler rollback also requires restoring the captured predeployment Apps Script source if the private handler migration fails; changing only a versioned web-app pointer does not restore project-HEAD trigger functions.
- Schema rollback is forward-only: retain appended columns/config/history/ledger/audit/evidence; repoint application code and reconcile. Never delete posted records to imitate rollback.

See [V1 Readiness Audit](docs/V1_READINESS_AUDIT.md), [Known Limitations](docs/KNOWN_LIMITATIONS.md), and [Work Continuation](docs/WORK_CONTINUATION.md).
