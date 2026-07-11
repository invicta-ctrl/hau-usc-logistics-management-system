# Project Status

## Current version

- Version: `0.3.1`
- Date: 2026-07-12
- Mode: preview only
- Backend: mock browser adapter
- Build artifact: `dist/index.html`

## Remediation status

- Phase 0 - Preserve baseline: **implemented**. The authoritative original prototype is retained under `legacy/`; the audit is retained under `docs/reference/` in the GitHub deliverable.
- Phase 1 - P0 integrity fixes: **implemented and covered by Vitest**. Unique paired IDs, cumulative receipts, idempotent handoff/return, service-level transfer limits, awaited rollback-safe reservations, and line-level restock receiving pass the reproduced probes.
- Visual restoration: **implemented**. Active markup and CSS are mechanically extracted from the archived Final prototype. Seven view modules and eight ordered CSS modules reconstruct the original source in equivalence tests.
- Phase 2 - UX and accessibility: **partially integrated**. The restored baseline brings back the recognizable interface and working preview controls, but some newer navigation, focus-management, and application-confirmation improvements still need reconnection without altering the baseline.
- Phase 3 - Modular source: **implemented for domain/services and visual extraction; controller migration remains**. Vite modules, service adapters, tests, documentation, per-view HTML, ordered CSS, and a self-contained build are present. The restored compatibility runtime is still a large generated file.
- Phases 4-7: not started; see `docs/ROADMAP_TO_V1.md`.

## Test status

- ESLint: passes (warnings treated as cleanup items only if noted in the latest check output).
- Vitest: unit and integration suite passes.
- Visual equivalence: passes for original markup, CSS cascade, and runtime interaction hooks.
- Vite single-file build and `verify:dist`: pass; the artifact has no external asset dependency or module-script requirement.
- Playwright: 30 responsive checks are defined across 320, 390, 768, 1024, 1366, and 1440 px. They were invoked, but Chromium could not be installed in this environment because the browser download returned an empty/truncated archive. The failures are environment launch failures, not executed assertions; the suite must be rerun where Playwright browsers are available.

## Current limitations

- Browser storage is preview-only and unsuitable for shared or sensitive records.
- The active restored controller uses the archived local-only compatibility runtime. The hardened modular `MockService` remains covered by the P0 audit probes, but the restored view handlers have not yet all been migrated to it.
- The compatibility runtime still contains legacy browser confirmations and broad `renderAll()` updates. These are isolated as known migration work, not approved production patterns.
- The role switcher demonstrates visible permissions but is not security.
- No institutional identity, LockService, Sheets, Drive, email, Chat, REST, or database connection exists.
- Evidence stores safe metadata only; selected file bytes are never persisted.
- The prototype implements the critical transaction scenarios, but production pilot acceptance requires real assistive-technology, concurrency, privacy, records-retention, backup, and incident-response testing.
- Some secondary create/edit/archive workflows are represented as preview structures rather than full production forms.

## Recommended next full-stack task

Migrate the Request Center controller from `src/visual/runtime.js` to the hardened `MockService` while keeping `src/visual/views/request.html` and the ordered visual CSS unchanged. This reconnects idempotent submission/acceptance and rollback-safe reservations before beginning the Apps Script `api_acceptRequest(command)` vertical slice.
