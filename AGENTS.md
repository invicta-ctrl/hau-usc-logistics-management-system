# Coding Agent Instructions

Read `README.md`, `PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, and `docs/DOMAIN_RULES.md` before editing.

- After this initial refactor, take one issue or feature slice at a time.
- Do not regenerate the entire application for a small change.
- Preserve ledger, reservation, receipt, release, lending, transfer, idempotency, and parent-status invariants.
- Views never mutate authoritative collections directly; use the selected service adapter.
- Keep `previewMode = true` and `backendMode = 'mock'` unless an explicitly reviewed backend task changes them.
- Never expose secrets, institutional credentials, student records, supplier TINs, private contacts, or restricted evidence.
- UI visibility is not authorization. Do not weaken requester payload or server-bound permission contracts.
- Do not use browser `confirm()`. Use the accessible application confirmation modal.
- Do not edit `dist/index.html` directly. Edit `src/`, then run `npm run build`.
- Run relevant tests for every change. Before handoff, run `npm run check`; run Playwright when browsers are available.
- Update `PROJECT_STATUS.md` and `CHANGELOG.md` with verified facts only.
- Keep feature modules reasonably sized and use event delegation/targeted rendering for operational lists.
