# Testing and Acceptance

## Automated gates

- ESLint for browser/scripts/tests.
- Vitest for inventory, routing, transitions, parent derivation, cumulative receiving, all-line release preflight/recovery, lending idempotency, transfer integrity, permissions, sanitized bootstrap/requester downgrade, administration/content/branding contracts, additive schema/formula safety, verified backup, Drive mapping/upload security, dates/IDs, migration discovery, and evidence naming/validation.
- Apps Script static check for V8 syntax, manifest, required files, and required entry points.
- Vite build and standalone verifier for inlined CSS/JS, artifact identity, and pinned main/request/lending shareable portal modes.
- Playwright at 320, 390, 768, 1024, 1366, and 1440 px for navigation, request-only isolation, request autocomplete, return evidence, administration, focus handling, responsive inventory actions, and direct `file://` opening of all three named shareable portals.
- Revision tests for exactly-once mutation increments, no increments on reads/replays, compact endpoint output, edit-trigger installation, non-overlapping polling, visibility/online/focus behavior, backoff, and dirty-state deferral.
- Lending catalog tests for predictive ranking, suggestion-backed Item IDs, keyboard behavior, unavailable/restricted explanations, borrower audiences, handling/due dates, maximum quantity, and authoritative server revalidation.
- Catalog tests for `Can_Manage_Catalog`, editable-field whitelisting, server API presence, audit/idempotency, unit-history protection, archive dependencies, additive schema preservation, and repeated setup safety.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

## V1 release-candidate repository verification

The final local `1.0.0-rc.1` run completed after a clean dependency install. GitHub then verified release-candidate code checkpoint `283002cf2784b0d3e148258278c664f8afb0d7f4` with green Apps Script validation, repository verification, and browser smoke. Live staging/production remain separate blocked gates.

| Gate | Final local result |
| --- | --- |
| `npm ci` | Passed: 139 packages added, 140 audited, 0 reported vulnerabilities; npm emitted an `esbuild` allow-scripts review warning |
| Unit, lint, governance, Apps Script, build, verify | Passed: 19 files / 147 tests; 4 governance gates; 27 Apps Script sources / 26 public/setup callables / 3 private trigger handlers; `npm run check` and `npm run verify` |
| Combined Playwright matrix | Passed: 60 passed, 60 intentional applicability skips, 0 failed across 120 cases and six viewport projects; Playwright `1.61.1` |
| Two-build deterministic artifact comparison | Passed: all 9 standalone/Apps Script artifacts retained identical byte lengths and SHA-256 values |

Toolchain: Node `v26.3.0`, npm `11.16.0`, Git `2.54.0.windows.1`. Exact artifact hashes are recorded in [V1 Readiness Audit](V1_READINESS_AUDIT.md).

## Historical Version 0.5.0 repository verification

The recorded repository results are:

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused new Chromium suite at 390 px: 4 passed.
- `npm run check`: passed, including a 22-module Vite build, Apps Script validation across 24 source files and 27 required entry points, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright/browser matrix at 320, 390, 768, 1024, 1366, and 1440 px: 38 passed, 40 intentionally scoped skips, 0 failed.
- A second build reproduced the same standalone and Apps Script shell hashes.

These results verify the repository package only. Staging migration, live two-session synchronization, operational Sheets/Drive workflows, trigger behavior, and manual accessibility acceptance remain separate gates. Generated artifacts must come only from the build/parity pipeline; manually edited output is not acceptable evidence.

## V1 staging acceptance

Exercise: full-stock request, partial split, no-stock procurement and cumulative deliverable receipts, partial/full release, loan creation/approval/handoff/overdue/return with immediate authoritative refresh, line-level multi-restock receipts, evidence upload/deduplication/failure, over-transfer rejection, duplicate-click replay, competing allocation, VERIFY blocking, unauthorized staff invocation, request-only data isolation, migration dry-run, backup, and recovery health check.

Use two internal sessions: verify that an idle second session sees a mutation within approximately 5–10 seconds; a dirty form receives Updates available without losing input; focus/reconnect/manual Refresh cause a check; hidden/offline tabs pause; and a simulated refresh failure never repeats the recorded command. Exercise predictive selection and invalid free text, out-of-stock and staff-only explanations, student/staff audience combinations, maximum quantity and due-date rules, catalog edit persistence after reload, unauthorized catalog controls/API calls, unit/archive protections, direct human edit revision, and exactly one revision increment per successful mutation.

With separate admin and non-admin identities, exercise user/event administration; last-admin and self-deactivation guards; content save/publish/revert with an intentional expected-revision conflict; branding upload/signature/dimension/private-parent checks and activation; protected-field exclusion; and request-only downgrade for missing/unregistered institutional identities. Submit a multi-line release with a deliberately invalid later line and prove there is no earlier-line mutation; then rehearse the bounded `RELEASE_RECOVERY_REQUIRED` reconciliation path. Validate all eleven Drive mappings and private sharing, formula-leading Sheet inputs/exports, quarantine recovery, and evidence responses without Drive IDs or URLs.

Capture correlation IDs and confirm `15_STATUS_HISTORY`, `16_AUDIT_LOG`, `18_ERROR_LOG`, ledger, reservations, and evidence metadata reconcile. Do not claim WCAG conformance; perform keyboard, screen-reader, 200% zoom, high-contrast, mobile, and slow-network manual checks.
