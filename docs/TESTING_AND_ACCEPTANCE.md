# Testing and Acceptance

## Automated gates

- ESLint for browser/scripts/tests.
- Vitest for inventory, routing, transitions, parent derivation, cumulative receiving, release, lending idempotency, transfer integrity, permissions, dates/IDs, sanitized bootstrap, migration discovery, and evidence naming/validation.
- Apps Script static check for V8 syntax, manifest, required files, and required entry points.
- Vite build and standalone verifier for inlined CSS/JS and artifact identity.
- Playwright at 320, 390, 768, 1024, 1366, and 1440 px for navigation, request-only isolation, request autocomplete, focus handling, and responsive inventory actions.

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

## Staging acceptance

Exercise: full-stock request, partial split, no-stock procurement and cumulative deliverable receipts, partial/full release, loan approval/handoff/overdue/return, line-level multi-restock receipts, evidence upload/deduplication/failure, over-transfer rejection, duplicate-click replay, competing allocation, VERIFY blocking, unauthorized staff invocation, request-only data isolation, migration dry-run, backup, and recovery health check.

Capture correlation IDs and confirm `15_STATUS_HISTORY`, `16_AUDIT_LOG`, `18_ERROR_LOG`, ledger, reservations, and evidence metadata reconcile. Do not claim WCAG conformance; perform keyboard, screen-reader, 200% zoom, high-contrast, mobile, and slow-network manual checks.
