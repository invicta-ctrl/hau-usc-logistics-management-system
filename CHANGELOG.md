# Changelog

## 0.4.0 - 2026-07-12

### Added

- Production-oriented Google Apps Script backend with Sheet repositories, authorization, locking, idempotency, structured errors, append-only inventory, workflow services, evidence uploads, migration, reconciliation, setup, backup, and triggers.
- Strict Apps Script and future HTTP browser adapters while preserving mock development.
- Privacy-safe evidence labels/filenames, digest duplicate detection, configured Drive routing, and quarantine recovery.
- Apps Script staging bundle, manifest, clasp example, CI workflows, schema validation record, deployment/security/backup/migration/launch runbooks, and PostgreSQL/Supabase mapping.
- Repository-level ChatGPT web/Codex collaboration protocol, start-of-task Git handshake, one-writer rule, manager task packet, and Codex handoff packet.
- Regression coverage for missing runtime properties, explicit staging and production selection, and no hardcoded spreadsheet fallback.

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

### Fixed

- Visual-baseline generated-notice removal now supports LF, CRLF, and no trailing newline while retaining strict comparison of all visual markup and unrelated comments.
- Removed hardcoded operational and backup spreadsheet IDs from runtime code, preventing staging from silently falling back to production.
- Initial setup can bootstrap the administrator when `14_USERS_ACCESS` has not yet been created or seeded.
- Health-check configuration details are now restricted to administrators.

### Verified

- Live production/backup comparison was read-only and found the four legacy tabs unchanged.
- On Windows with `core.autocrlf=true`, the focused visual-baseline suite passed 4 tests and the full Vitest suite passed 55 tests across 9 files before staging isolation.
- GitHub `npm run check` passed after staging-isolation implementation, including lint, Vitest, build, Apps Script static validation, and artifact verification.
- GitHub Apps Script static validation passed after staging-isolation implementation.
- GitHub CI completed the Playwright matrix at six viewport widths with 25 passes and 5 intentional skips on the prior approved head; the latest browser-smoke result is verified separately in the continuation record when complete.

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
