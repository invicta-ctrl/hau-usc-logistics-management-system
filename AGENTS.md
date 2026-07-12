# Coding Agent Instructions

Read `README.md`, `PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md` before editing.

- Work one issue or vertical slice at a time after this launch-readiness refactor.
- Preserve `legacy/HAU-USC_Logistics-Prototype.original.html` as the approved visual baseline. Regenerate visual modules with `npm run extract:visual`; do not casually redesign them.
- Do not hand-edit `dist/index.html`, `HAU-USC_Logistics-Prototype-Shareable.html`, or `apps-script/Index.html`.
- Browser code calls a service adapter. Only `src/services/apps-script-adapter.js` may use `google.script.run`.
- Apps Script writes require authorization, an idempotency key, a lock where state may race, server-side IDs, status history, and audit logging.
- Never edit or delete posted ledger entries. Use a documented reversal or adjustment.
- Never transact `VERIFY` items. Preserve legacy source sheet, row, block, exact name, quantity, and unit.
- Never write to the pre-rework backup spreadsheet.
- Drive folder configuration must fail closed. Never fall back to the script owner’s My Drive root.
- UI hiding is not authorization. Keep request-only bootstrap sanitized.
- Do not commit `.clasp.json`, secrets, institutional credentials, personal student records, private contacts, supplier TINs, or evidence files.
- Run `npm run check`; run Playwright where Chromium is installed. Run `clasp status` and `clasp push --dry-run` only after configuring a staging script.
- Update `PROJECT_STATUS.md` and `CHANGELOG.md` before handoff. State unrun checks and unresolved values honestly.
