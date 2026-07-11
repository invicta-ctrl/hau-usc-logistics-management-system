# Project Status

## Current version

- Version: `0.3.0`
- Date: 2026-07-11
- Mode: preview only
- Backend: mock browser adapter
- Build artifact: `dist/index.html`

## Remediation status

- Phase 0 - Preserve baseline: **implemented**. The authoritative original prototype is retained under `legacy/`; the audit is retained under `docs/reference/` in the GitHub deliverable.
- Phase 1 - P0 integrity fixes: **implemented and covered by Vitest**. Unique paired IDs, cumulative receipts, idempotent handoff/return, service-level transfer limits, awaited rollback-safe reservations, and line-level restock receiving pass the reproduced probes.
- Phase 2 - UX and accessibility: **implemented for preview; manual assistive-technology review remains**. Mobile bottom navigation, More drawer, larger targets, focus traps, inert background, restoration, skip link, field errors, live announcements, and transaction confirmations are present. No formal WCAG claim is made.
- Phase 3 - Modular source: **implemented**. Vite modules, service adapters, tests, documentation, and a self-contained build are present.
- Phases 4-7: not started; see `docs/ROADMAP_TO_V1.md`.

## Test status

- ESLint: passes (warnings treated as cleanup items only if noted in the latest check output).
- Vitest: unit and integration suite passes.
- Vite single-file build: passes.
- Playwright: 30 responsive checks are defined across 320, 390, 768, 1024, 1366, and 1440 px. They were invoked, but Chromium could not be installed in this environment because the browser download returned an empty/truncated archive. The failures are environment launch failures, not executed assertions; the suite must be rerun where Playwright browsers are available.

## Current limitations

- Browser storage is preview-only and unsuitable for shared or sensitive records.
- The role switcher demonstrates visible permissions but is not security.
- No institutional identity, LockService, Sheets, Drive, email, Chat, REST, or database connection exists.
- Evidence stores safe metadata only; selected file bytes are never persisted.
- The prototype implements the critical transaction scenarios, but production pilot acceptance requires real assistive-technology, concurrency, privacy, records-retention, backup, and incident-response testing.
- Some secondary create/edit/archive workflows are represented as preview structures rather than full production forms.

## Recommended next full-stack task

Implement an Apps Script `api_acceptRequest(command)` vertical slice using verified institutional identity, centralized role resolution, `LockService`, idempotency records, server-allocated IDs, batched Reservation/Request Line/Request/Audit writes, and normalized DTO responses. Use the existing mock integration tests as contract tests.
