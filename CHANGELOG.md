# Changelog

## 0.5.0 - Unreleased

### Controlled staging acceptance checkpoint (Phase E blocked)

- Phase D compatibility acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent.
- Phase E v2 direct read-only endpoint checks passed, but the live v2 workspace remained in slow startup and reached the retryable read-only-service timeout instead of ready.
- Applied the authorized rollback by restoring the existing staging deployment pointer to immutable Version 13; the staging owner reports the bootstrap property is restored to `1`, and authorization contract v1/absent remains in force.
- A local synthetic end-to-end diagnosis covering the checked-in Apps Script DTO, JSON-safe callback normalization, and browser v2 validator passed; no local contract-shape defect or reproducible timeout was found.
- The staging acceptance marker remains intentionally absent. No production deployment, push, Slice 4 work, or private operational-data change was performed.

### Slice 3 - Canonical roles, committee scopes, and authorization contract

- Added a server-owned canonical authorization registry with six roles, immutable role IDs, exactly three committee IDs, separate capability and scope decisions, safe denial reasons, and fail-closed inactive, unknown, ambiguous, and unreconciled mappings.
- Added sanitized authorization metadata to the essential bootstrap/current-user contract and a client projection that consumes server capabilities instead of granting access from visible UI roles.
- Added additive authorization fields to `14_USERS_ACCESS`, the `20_USER_COMMITTEE_SCOPE` membership schema, the `HAU_AUTHORIZATION_CONTRACT_VERSION` rollout property, and an approval-gated mapping dry run/apply path that preserves legacy labels and immutable history.
- Recorded the owner-auto-accepted role/committee defaults and migration controls in `docs/AUTHORIZATION_CONTRACT.md`.
- Regenerated visual and standalone artifacts through `npm run extract:visual` and `npm run build`; no generated file was hand-edited.
- Final local verification passes: `npm run check` with ESLint, 20 Vitest files / 161 tests, production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify`; full Chromium 49 passed / 95 intentionally skipped / 0 failed across 144 cases; and `git diff --check`.
- Sensitive-value scan passes over the changed scope with no `.clasp` files, credentials, private identifiers, contacts, roster rows, private supplier-TIN values, evidence links, or operational records; only schema references and synthetic/mock placeholders are present. Regenerated standalone files retain only the pre-existing fictional preview baseline. Initial review findings were repaired; the implementation-validator found no blocking issue; no re-review PASS is claimed because the second reviewer did not return before handoff.
- Implementation commit `5107afc57904dccc5214fcafc20aba65c0622632` is pushed to the feature branch; PR #6 `validate`, `verify`, and `browser-smoke` are green. Manager review is required before Slice 4.
- No roster import, external authorization activation, migration, deployment, staging/production write, or private operational-data change was performed.

### Slice 2 - Essential bootstrap and lazy module contracts

- Added versioned allowlisted essential/module read contracts with request-only privacy enforcement, bounded pagination/filtering, fail-closed entity scope checks, JSON-safety validation, and compatibility-preserving runtime selection.
- Added Apps Script module APIs beside the existing bootstrap endpoint, request-scoped repository read deduplication, exact UTF-8 payload metrics with a 100 KiB response bound, bounded public-reference caching, in-flight deduplication, stale-response cancellation, and active-module rendering.
- Made the rollout flag server-controlled through `HAU_BOOTSTRAP_CONTRACT_VERSION`; the safe default is v1 and explicit v2 enables the new path.
- Added synthetic contract/controller/Apps Script VM/adapter/packaging coverage and regenerated visual/standalone/Apps Script artifacts through the repository build path.
- Verification passes: 18 Vitest files / 143 tests, focused packaged Chromium 15/15, and full Playwright 49 passed / 95 intentionally skipped / 0 failed across 144 cases. Initial independent-review FAIL findings were repaired; current-snapshot re-review returned WARN/incomplete, so no re-review PASS is claimed.
- No deployment, external-system write, private operational-data change, or Slice 3+ feature work was performed.

- Working branch: `feat/live-sync-lending-search-catalog-controls`
- Starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Ending commit: `576393f1be28687d984ea7632a2501aa8d3fc30d`; pushed to the feature branch with local/upstream parity `0 0`
- Draft PR #6 is open and its `validate`, `verify`, and `browser-smoke` checks pass; manager review remains pending.

### P0 Production Bootstrap Diagnosis and Recovery

- Diagnosed the unhandled post-response startup failure boundary and added named bootstrap stages from request through first render and ready.
- Added contract validation before normalization, JSON-safety checks, one-active-attempt recovery, obsolete-callback protection, eight-second slow-state messaging, safe stage diagnostics, and an accessible Retry surface with an idempotent terminal finalizer.
- Added synthetic empty/realistic-volume fixtures and failure seams for transport, malformed responses, every post-response startup stage, timeout/late success, Retry, focus/live-region behavior, and packaged Apps Script execution.
- Preserved the existing Apps Script adapter timeout/callback behavior and made no endpoint, payload, schema, deployment, or external-system change.
- Verification: `npm ci`, `npm run check`, full Vitest (15 files / 118 tests), focused packaged Chromium (14 tests), and the six-project Playwright run (48 passed, 90 scoped skips, 0 failed across 138 cases). A synthetic 390x844 shell measurement rendered in 81 ms; staging p95 remains unrun.
- No staging/production deployment, Apps Script push, Google Sheets/Drive write, or other external action was performed.

### Added

- A compact `api_getDataRevision` read endpoint backed by `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` rows in `17_CONFIG`.
- Five-second internal polling while the document is visible and online, with focus, visibility, reconnect, and manual-refresh checks, non-overlapping requests, and bounded error backoff. This is polling, not WebSockets.
- An idempotent `setupOperationalEditTrigger()` installer and `handleOperationalSheetEdit(e)` handler so direct human edits to the configured operational spreadsheet advance the shared revision.
- Dirty-form and active-modal protection. Background changes show a non-blocking update banner with Refresh now and Continue editing choices instead of silently discarding input.
- Accessible predictive Lending Hub search with exact/prefix/token/substring ranking, keyboard navigation, an authoritative hidden Item ID, selected-item summary, and distinct out-of-stock, verification, audience, circulation, quantity, and no-match explanations.
- Website catalog APIs and controls for item lookup, creation, metadata editing, storage-context changes, archive, and restore.
- Dedicated `Can_Manage_Catalog` authorization with ADMIN and DOL_DIRECTOR fallback when the new cell is blank; no general grant to other existing users.
- Handling values `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, and `NON_CIRCULATING`, plus lending audiences `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, and the future-ready `DOL_INTERNAL_ONLY` value.

### Changed

- Apps Script mutations reload and normalize authoritative bootstrap state before rendering success. If the write succeeds and reload fails, the UI reports that the action was recorded, exposes a safe Refresh action, and never automatically resubmits the mutation.
- Retryable transport failures retain the same client request ID for an identical mutation attempt, so a response lost after a server commit replays idempotently instead of creating a duplicate. Mutation forms and release controls disable while in flight.
- Lending creation, approval, handoff, and return now revalidate item status, verification state, handling, borrower audience, available-to-promise quantity, maximum per-ticket quantity, and due-date rules on the server.
- Inventory creation, editing, storage updates, archive, and restore now use locked, idempotent, permission-checked Apps Script services with server IDs, before/after audit data, status history where applicable, and exactly one data-revision advance.
- Item creation records initial quantity through an append-only ledger movement only when the catalog manager also has receive or admin permission; catalog-only users must create at zero and use an approved receiving workflow. VERIFY and inactive items can never receive opening stock. Metadata edits cannot overwrite current stock, reservations, opening quantity, provenance, or posted history.
- Request-only bootstrap sanitization is determined server-side from the resolved identity as well as the trusted page mode; a public or REQUESTER caller cannot obtain internal bootstrap fields by sending `requestOnly: false`.
- Unit changes are blocked when ledger, reservation, lending, request-line, restock, or release history depends on the item. Archive is blocked unless quantity and active dependencies are clear; restore preserves historical records and returns verification-marked items to `VERIFY`.

### Schema

- Appended `Catalog_Type`, `Storage_Location`, `Reorder_Threshold`, `Lending_Audience`, `Default_Loan_Days`, `Maximum_Loan_Qty`, `Approval_Required`, `Updated_At`, `Updated_By`, and `Notes` to `01_ITEM_MASTER` without reordering existing columns.
- Appended `Can_Manage_Catalog` to `14_USERS_ACCESS`.
- Added `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` configuration rows to `17_CONFIG`.
- `setupDatabase()` remains additive and repeatable. Blank legacy metadata defaults fail closed: active circulating items default to `USC_STAFF_ONLY`; VERIFY, inactive, archived, and non-circulating items default to `NOT_AVAILABLE_FOR_LENDING`; returnable items default to three loan days; maximum quantity defaults conservatively to one; approval defaults to true.

### Verification to date

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused Chromium 390 px 0.5.0 suite: 4 passed.
- `npm run check`: passed, including a 22-module Vite build, Apps Script validation across 24 source files and 27 required entry points, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright matrix at 320, 390, 768, 1024, 1366, and 1440 px: 38 passed, 40 intentionally scoped skips, 0 failed.
- Deterministic rebuild: passed; the 238,891-byte `dist/index.html` and shareable copy remained byte-identical with SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f`, and the 615-byte `apps-script/Index.html` remained `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External actions

- No `clasp push`, Apps Script version creation, deployment update, Sheet/Drive write, trigger modification, production action, or PR #2 merge was performed.
- Immutable staging Version 9 and production remain untouched.

## 0.4.0 - 2026-07-12

### Added

- Production-oriented Google Apps Script backend with Sheet repositories, authorization, locking, idempotency, structured errors, append-only inventory, workflow services, evidence uploads, migration, reconciliation, setup, backup, and triggers.
- Strict Apps Script and future HTTP browser adapters while preserving mock development.
- Privacy-safe evidence labels/filenames, digest duplicate detection, configured Drive routing, and quarantine recovery.
- Apps Script staging bundle, manifest, clasp example, CI workflows, schema validation record, deployment/security/backup/migration/launch runbooks, and PostgreSQL/Supabase mapping.
- Repository-level ChatGPT web/Codex collaboration protocol, start-of-task Git handshake, one-writer rule, manager task packet, and Codex handoff packet.
- Regression coverage for missing runtime properties, explicit staging and production selection, and no hardcoded spreadsheet fallback.
- Parser-safe Apps Script packaging library, deterministic assembled-document validation, generated-file diagnostics/parity checks, and a staging-only diagnostic shell.
- Unit and Chromium regressions for literal `</script>` sequences, multiple script/style outputs, minified bootstrap identifiers, visible-source leakage, and mocked `api_getBootstrapData` execution.
- Failure-only CI diagnostic artifacts for concise verification and browser logs.

### Changed

- Wired approved visual actions to server adapters for request review, quote selection, receiving, release, lending, and event-item transfer.
- Request acceptance now preflights all stock decisions before applying reservations and line transitions.
- Restock and deliverable receipts accumulate by line and reject over-receipt before operational writes.
- Lending partial returns account for lost/damaged quantities without falsely restoring stock.
- Requester catalog/bootstrap payloads no longer expose exact stock balances, reservations, verification notes, or legacy trace fields; the UI defers authoritative stock routing to DOL review.
- Evidence uploads now require a server-side receive, release, or admin permission before file processing.
- Apps Script now resolves environment, operational spreadsheet ID, and backup spreadsheet ID only from required Script Properties.
- Setup, Drive configuration rows, migration/reconciliation access, launch backups, schema reports, and health checks now use the explicitly resolved environment target.
- Admin health checks report the active environment and target spreadsheet IDs for operator verification.
- Apps Script body, CSS, and JavaScript are now generated from separate Vite outputs instead of being extracted from the minified standalone HTML.
- Apps Script generated style/script partials now contain their complete executable elements, avoiding contextual force-printing inside outer container tags.

### Fixed

- Visual-baseline generated-notice removal now supports LF, CRLF, and no trailing newline while retaining strict comparison of all visual markup and unrelated comments.
- Removed hardcoded operational and backup spreadsheet IDs from runtime code, preventing staging from silently falling back to production.
- Initial setup can bootstrap the administrator when `14_USERS_ACCESS` has not yet been created or seeded.
- Health-check configuration details are now restricted to administrators.
- Raw-text closing sequences are escaped before JavaScript or CSS is embedded in Apps Script HTML.
- Visible-JavaScript detection no longer misclassifies ordinary UI text such as `Lead-time class`.
- Apps Script browser packaging verification is network-independent and executes from an assembled in-memory document.
- Corrected the controlled staging deployment after clasp 3.3.0 skipped a manifest-confirmation push, leaving Version 7 on stale raw script/style partials and causing `Exception: Malformed HTML content`.
- Preserved the existing staging `webapp` manifest settings while force-pushing the reviewed 29-file package, then updated the existing deployment ID to immutable Version 8.
- Propagated the server-trusted Apps Script request-only flag through `body[data-request-only]` so the sandboxed browser does not depend on the outer `/exec` query string.
- Added internal/request-only package assembly tests that assert one bootstrap call with the correct `requestOnly` payload and verify the request-only shell hides internal navigation.
- Apps Script runtime controls now use the trusted server-rendered environment instead of assuming staging.
- Generated body markup now carries both `data-request-only` and `data-app-environment`.
- Apps Script pages display `Apps Script · staging` or `Apps Script · production` according to the resolved Script Property environment.
- `Reset Demo Data` remains available in local mock mode but is hidden, disabled, removed from keyboard focus, and left without a click handler in Apps Script mode.
- The visual extractor now normalizes CRLF input before applying compatibility-runtime bridges, preventing Windows extraction from silently dropping the request-only privacy and accessibility repairs.

### Verified

- Live production/backup comparison was read-only and found the four legacy tabs unchanged.
- On Windows with `core.autocrlf=true`, the focused visual-baseline suite passed 4 tests and the full Vitest suite passed 55 tests across 9 files before staging isolation.
- GitHub `npm run check` passed after staging-isolation implementation, including lint, Vitest, build, Apps Script static validation, and artifact verification.
- GitHub Apps Script static validation passed after staging-isolation implementation.
- GitHub CI completed the earlier Playwright matrix at six viewport widths before the packaging incident.
- Packaging-repair code checkpoint `74f2f0f...` passed GitHub CI and Apps Script static validation.
- The repaired checkpoint passed 10 Vitest files / 67 tests, 23 Apps Script source files / 18 required functions, deterministic package parity, standalone artifact verification, and the six-viewport browser-smoke matrix.
- Generated Apps Script package sizes were 512 bytes (`Index.html`), 28,967 bytes (`AppBody.html`), 26,850 bytes (`AppStyles.html`), and 153,161 bytes (`AppScript.html`).
- A post-push remote pull matched all 29 reviewed staging files and confirmed one application script and one application style element.
- Version 8 `?diagnostic=1` passed body, style, inline-script, and harmless server-call checks.
- Version 8 internal `/exec` rendered the Apps Script staging workspace, cleared the loading overlay, and exposed no raw JavaScript.
- No operational Sheet/Drive workflow, migration application, trigger change, production action, or PR merge was performed during staging recovery.
- `npm run check` passed: ESLint, 10 Vitest files / 69 tests, Vite build, Apps Script static validation, deterministic package checks, and standalone artifact verification.
- `npm run test:e2e` passed with 29 tests and 25 intentional viewport-specific skips.
- Both standalone HTML artifacts verified at 210,112 bytes each.

### Known issues

- The internal Apps Script staging UI still displays the legacy `Preview mode · local data` badge and `Reset Demo Data` control. The adapter is live and the reset handler is blocked outside mock mode, but the visible wording must be corrected before workflow acceptance.
- Live Version 8 `?request=1` currently renders the internal workspace because the deployed runtime loses the outer query string inside the Apps Script iframe. The repository repair is verified locally but not yet deployed.
- Repository verification for the request-only repair passed `npm run check` (68 unit tests) and the full Playwright matrix (27 passed, 15 intentionally skipped across 42 cases).
- A bounded end-to-end staging workflow remains pending.

## 0.3.2 - 2026-07-12

### Prepared

- Locked the shareable Final prototype as the approved visual direction for the upcoming demo.
- Added `docs/FINAL_DEMO_BASELINE.md` with launch instructions, guided demo order, safety boundary, and presentation acceptance checklist.
- Documented the earlier Revision 02 file as historical reference rather than the active visual baseline.

## 0.3.1 - 2026-07-12

### Restored

- Reinstated the exact archived Final prototype markup, palette, typography, spacing, navigation, panels, forms, tables, and responsive rules as the active visual layer.
- Restored the original preview interaction runtime so navigation and operational controls execute when the artifact is opened in a real browser.

### Added

- Reproducible extraction into shell fragments, seven view HTML modules, and eight ordered CSS modules.
- Visual-equivalence tests for markup, CSS cascade, and interaction hooks.
- Standalone artifact verification and classic inline-script output for direct `dist/index.html` use.
- Root-level `HAU-USC_Logistics-Prototype-Shareable.html`, regenerated from and hash-verified against the deployment bundle.

### Documented

- The compatibility-runtime boundary and the recommended view-by-view migration into the hardened modular service contract.

## 0.3.0 - 2026-07-11

### Added

- Vite + vanilla JavaScript ES-module repository with single-file output.
- Vitest domain/integration coverage and Playwright responsive smoke suite.
- Ledger-only quantity truth, revision-based indexes, state migrations, structured errors, correlation IDs, and idempotency records.
- Sanitized request-only bootstrap, centralized preview permissions, mobile bottom navigation, accessible modal/drawer infrastructure, reports, diagnostics, cycle-count and emergency-issue previews.
- Architecture, domain, data-model, Apps Script, accessibility, test-plan, roadmap, and limitation documentation.

### Fixed

- Duplicate transfer transaction IDs.
- Non-cumulative deliverable/restock receiving.
- Duplicate lending handoff and return postings.
- Service-level over-transfer acceptance.
- Unawaited reservation failure and partial mutation during acceptance.
- Restock receipt sibling auto-completion.
- Release validation against request remainder, reservation, and physical/event balance.
- Parent request statuses now derive from child lines.

### Preserved

- HAU-USC visual identity, request/stock routing, Release Desk, lending, restocking, procurement, canvass, inventory, request-only mode, status chips, cards, tables, mobile cards, and preview safeguards.
