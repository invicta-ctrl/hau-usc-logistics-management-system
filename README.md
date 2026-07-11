# HAU-USC Logistics Management System

Maintainable front-end prototype for the Holy Angel University - University Student Council Department of Logistics. It preserves the maroon, oxblood, gold, cream, paper, and white institutional identity while modeling requests, reservations, inventory, lending, receiving, releases, transfers, canvass references, tasks, and reports.

> **Preview warning:** `previewMode = true` and `backendMode = 'mock'`. All records are fictional demonstration data stored locally in the browser. The application performs no Google Sheets, Google Drive, email, Chat, or production API writes.

## Start here

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Use `?mode=request` or `#request-only` for the sanitized requester portal demonstration.

## Commands

```bash
npm run dev          # local Vite development server
npm run test         # Vitest unit and integration tests
npm run test:e2e     # focused Playwright and responsive smoke tests
npm run lint         # ESLint
npm run format       # Prettier write
npm run build        # self-contained prototype build
npm run check        # lint, Vitest, and build
```

The final standalone artifact is [`dist/index.html`](dist/index.html). CSS and JavaScript are inlined by `vite-plugin-singlefile`, so it can be opened independently and later adapted for Apps Script HTML Service.

## Architecture at a glance

```text
src/
├── app/          bootstrap, router, store, migrations, selectors, errors, configuration
├── domain/       pure rules for IDs, dates, transitions, inventory, receipts, releases, lending
├── services/     mock transaction adapter plus Apps Script and REST boundaries
├── features/     active-view modules for each operational workspace
├── components/   reusable accessible navigation, modal, drawer, table, cards, filters
├── data/         fixed demonstration events, seed state, and data dictionary
├── styles/       custom HAU-USC design system
└── assets/       optional DOL/USC logos and icons
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DOMAIN_RULES.md`](docs/DOMAIN_RULES.md), and [`PROJECT_STATUS.md`](PROJECT_STATUS.md) before making changes.

## Logo and image placement

Preferred optional files:

- `src/assets/logos/dol-logo.png`
- `src/assets/logos/usc-logo.png`

The application uses labeled placeholders when logos are absent. Never place private borrower photos, student records, supplier TINs, or real evidence in source control.

## Backend boundary

Views call the service contract only. `mock-service.js` is active. `apps-script-service.js` and `rest-service.js` document callable mappings but remain inactive. The production server must own identity, authorization, locks, balances, transitions, IDs, idempotency, evidence validation, and audit rows.

## Guidance for the next agent

1. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/DOMAIN_RULES.md`, and `docs/ARCHITECTURE.md`.
2. Run `npm install && npm run check` before changing code.
3. Work one feature/domain slice at a time; do not regenerate the application for a small change.
4. Change `src/`, tests, and documentation. Never hand-edit `dist/index.html`.
5. Rebuild and update `PROJECT_STATUS.md` and `CHANGELOG.md` before handing off.
