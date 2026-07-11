# HAU-USC Logistics Management System

Maintainable front-end prototype for the Holy Angel University - University Student Council Department of Logistics. It preserves the maroon, oxblood, gold, cream, paper, and white institutional identity while modeling requests, reservations, inventory, lending, receiving, releases, transfers, canvass references, tasks, and reports.

> **Preview warning:** `previewMode = true` and `backendMode = 'mock'`. All records are fictional demonstration data stored locally in the browser. The application performs no Google Sheets, Google Drive, email, Chat, or production API writes.

## Start here

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Use `?request=1` for the request-only presentation from the restored prototype.

## Commands

```bash
npm run dev          # local Vite development server
npm run extract:visual # regenerate visual modules from the archived baseline
npm run test         # Vitest unit and integration tests
npm run test:e2e     # focused Playwright and responsive smoke tests
npm run lint         # ESLint
npm run format       # Prettier write
npm run build        # self-contained prototype build
npm run verify:dist  # verify standalone controls and asset inlining
npm run check        # lint, Vitest, build, and standalone verification
```

The final standalone artifact is [`dist/index.html`](dist/index.html). CSS and JavaScript are inlined by `vite-plugin-singlefile`; the final script is emitted as a classic inline script so the downloaded file runs from `file://` as well as a web server. GitHub's source-file preview does not execute the application—download the file or serve the repository.

## Authoritative visual baseline

`legacy/HAU-USC_Logistics-Prototype.original.html` is the visual source of truth. `npm run extract:visual` reproducibly separates it into the shell fragments, one HTML module per operational view under `src/visual/views/`, ordered CSS modules under `src/styles/visual/`, and the original working preview interactions in `src/visual/runtime.js`.

Do not restyle generated modules by hand. Change the archived baseline only for an intentional, reviewed visual-baseline revision, then rerun the extractor and equivalence tests.

## Architecture at a glance

```text
src/
├── app/          bootstrap, router, store, migrations, selectors, errors, configuration
├── domain/       pure rules for IDs, dates, transitions, inventory, receipts, releases, lending
├── services/     mock transaction adapter plus Apps Script and REST boundaries
├── features/     active-view modules for each operational workspace
├── components/   reusable accessible navigation, modal, drawer, table, cards, filters
├── data/         fixed demonstration events, seed state, and data dictionary
├── visual/       extracted shell, operational view templates, and compatibility runtime
├── styles/visual ordered CSS modules from the authoritative prototype
├── styles/       modular design-system work retained for controller migration
└── assets/       optional DOL/USC logos and icons
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DOMAIN_RULES.md`](docs/DOMAIN_RULES.md), and [`PROJECT_STATUS.md`](PROJECT_STATUS.md) before making changes.

## Logo and image placement

Preferred optional files:

- `src/assets/logos/dol-logo.png`
- `src/assets/logos/usc-logo.png`

The application uses labeled placeholders when logos are absent. Never place private borrower photos, student records, supplier TINs, or real evidence in source control.

## Backend boundary

The restored visual preview currently runs its extracted local-only compatibility service. The hardened modular contract in `src/services/mock-service.js`, along with the Apps Script and REST boundaries, remains the target service layer and is covered by the integrity suite. The next controller-migration slice must connect the restored templates to that contract without changing the visual baseline. The production server must own identity, authorization, locks, balances, transitions, IDs, idempotency, evidence validation, and audit rows.

## Guidance for the next agent

1. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/DOMAIN_RULES.md`, and `docs/ARCHITECTURE.md`.
2. Run `npm install && npm run check` before changing code.
3. Work one feature/domain slice at a time; do not regenerate the application for a small change.
4. Preserve the extracted visual baseline; change controllers/services independently. Never hand-edit generated visual fragments or `dist/index.html`.
5. Rebuild and update `PROJECT_STATUS.md` and `CHANGELOG.md` before handing off.
