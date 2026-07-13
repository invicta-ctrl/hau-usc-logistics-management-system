# Testing and Acceptance

## Automated gates

- ESLint for browser/scripts/tests.
- Vitest for inventory, routing, transitions, parent derivation, cumulative receiving, release, lending idempotency, transfer integrity, permissions, dates/IDs, sanitized bootstrap, migration discovery, and evidence naming/validation.
- Apps Script static check for V8 syntax, manifest, required files, and required entry points.
- Vite build and standalone verifier for inlined CSS/JS and artifact identity.
- Playwright at 320, 390, 768, 1024, 1366, and 1440 px for navigation, request-only isolation, request autocomplete, focus handling, and responsive inventory actions.
- Revision tests for exactly-once mutation increments, no increments on reads/replays, compact endpoint output, edit-trigger installation, non-overlapping polling, visibility/online/focus behavior, backoff, and dirty-state deferral.
- Lending catalog tests for predictive ranking, suggestion-backed Item IDs, keyboard behavior, unavailable/restricted explanations, borrower audiences, handling/due dates, maximum quantity, and authoritative server revalidation.
- Catalog tests for `Can_Manage_Catalog`, editable-field whitelisting, server API presence, audit/idempotency, unit-history protection, archive dependencies, additive schema preservation, and repeated setup safety.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

## Version 0.5.0 repository verification

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

## Staging acceptance

Exercise: full-stock request, partial split, no-stock procurement and cumulative deliverable receipts, partial/full release, loan creation/approval/handoff/overdue/return with immediate authoritative refresh, line-level multi-restock receipts, evidence upload/deduplication/failure, over-transfer rejection, duplicate-click replay, competing allocation, VERIFY blocking, unauthorized staff invocation, request-only data isolation, migration dry-run, backup, and recovery health check.

For 0.5.0 also use two internal sessions: verify that an idle second session sees a mutation within approximately 5–10 seconds; a dirty form receives Updates available without losing input; focus/reconnect/manual Refresh cause a check; hidden/offline tabs pause; and a simulated refresh failure never repeats the recorded command. Exercise predictive selection and invalid free text, out-of-stock and staff-only explanations, student/staff audience combinations, maximum quantity and due-date rules, catalog edit persistence after reload, unauthorized catalog controls/API calls, unit/archive protections, direct human edit revision, and exactly one revision increment per successful mutation.

Capture correlation IDs and confirm `15_STATUS_HISTORY`, `16_AUDIT_LOG`, `18_ERROR_LOG`, ledger, reservations, and evidence metadata reconcile. Do not claim WCAG conformance; perform keyboard, screen-reader, 200% zoom, high-contrast, mobile, and slow-network manual checks.
