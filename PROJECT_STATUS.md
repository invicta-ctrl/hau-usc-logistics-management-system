# Project Status

## Current release candidate

- Version: `1.0.0-rc.1`
- Date: `2026-07-13` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Worktree: `D:\Documents\DOL Website GitHub - V1 Deployment`
- Branch: `feat/v1-one-shot-demo-and-deployment`
- Verified base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`
- Integrated QA checkpoint: `4e871506f0bc2394f25beeab73187847289f7b10`
- Upstream/PR: pending first verified push; protected draft PR #2 remains untouched
- Live Apps Script version/deployment: **not verified or changed in this task**
- Production: **not deployed or modified**

## Readiness by layer

| Layer | State | Evidence / gate |
| --- | --- | --- |
| Repository implementation | Release candidate | Frontend, Apps Script, Sheets, Drive, QA, governance, and future-platform slices integrated |
| Local standalone demo | Ready | Main, Request, and Lending shareables build and open directly with fictional data |
| Apps Script package | Locally verified | Parser-safe generated package, static callable validation, and assembled-browser tests |
| Staging environment | Blocked | Available authenticated clasp target conflicts with the documented staging Version 9 record |
| Live Sheets/Drive acceptance | Not run | Correct target, fresh backup, mappings, owners, and rollback version must be confirmed first |
| Production promotion | Not authorized by evidence | Requires accepted staging workflow, governance decisions, owner sign-off, and rollback drill |
| GitHub release | Pending | New branch/draft PR and CI are completed only after final local verification; no merge/tag/release yet |

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
- Integrated QA: 19 files / 144 unit tests passed; ESLint passed; governance passed; `npm run check` and `npm run verify` passed; 27 Apps Script source files and 27 required functions validated.
- Final combined browser matrix: 60 passed / 60 intentional applicability skips / 0 failed across 120 configured cases at all six viewports. This includes 18/18 direct `file://` portal checks for pinned mode, active view, navigation isolation, and no page-level overflow.
- Two consecutive builds reproduced all nine generated artifacts byte-for-byte. Canonical `dist/index.html` is 288,464 bytes at SHA-256 `25db9bfa66bae8661eff204f8428ec28d7d389757af30b5fbe4dd926ef1d8f13`; exact portal and Apps Script hashes are in `docs/V1_READINESS_AUDIT.md`.
- Final local verification used Node `v26.3.0`, npm `11.16.0`, Playwright `1.61.1`, and Git `2.54.0.windows.1`. GitHub CI remains pending the first branch push/draft PR.

## External-action record

No `clasp push`, remote Apps Script source change, immutable Apps Script version, deployment creation/update, Script Property read/write, trigger change, Google Sheet mutation, Google Drive mutation, production action, PR #2 change, merge, tag, or GitHub release occurred during implementation and QA.

The only live-target inspection was bounded and read-only. It proved that the available ignored authenticated clasp configuration does not match the committed staging Version 9 record, so it was not copied or used.

## Hard blocker and smallest owner action

The deployment owner must privately supply or confirm the ignored `.clasp.json` for the documented staging project/account/environment and confirm the current immutable deployment plus rollback version without exposing identifiers in git or chat. Then the operator can verify Script Properties, operational/backup distinction, Drive mappings, fresh backup, schema, triggers, and bounded staging acceptance before any deployment pointer moves.

The repository history also contains a spreadsheet identifier removed from the current tree. The resource owner must verify restriction/rotation/replacement according to institutional policy. This task did not rewrite shared history.

## Rollback point

- Repository pre-V1 base: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`.
- Local V1 commits are additive and preserve the legacy visual baseline.
- A live Apps Script rollback version cannot be truthfully named until the correct staging target is confirmed. Do not assume the historical Version 9 record matches the authenticated target currently available.
- Schema rollback is forward-only: retain appended columns/config/history/ledger/audit/evidence; repoint application code and reconcile. Never delete posted records to imitate rollback.

See [V1 Readiness Audit](docs/V1_READINESS_AUDIT.md), [Known Limitations](docs/KNOWN_LIMITATIONS.md), and [Work Continuation](docs/WORK_CONTINUATION.md).
