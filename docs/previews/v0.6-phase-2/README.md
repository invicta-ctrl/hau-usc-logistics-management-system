# v0.6 Phase 2 experience previews

These images are deterministic browser captures of the tracked application source at the
Phase 2 checkpoint. They use fictional local-preview data and a fixed clock of
`2026-07-22T03:00:00.000Z`. They are review artifacts, not separate applications and not
evidence of a staging or production deployment.

## Manifest

| File                                   | Experience                                  | Viewport   |
| -------------------------------------- | ------------------------------------------- | ---------- |
| `01-login-desktop-1366.png`            | Inherited Access ID login                   | 1366 x 900 |
| `02-onboarding-desktop-1366.png`       | Inherited starter-account activation        | 1366 x 900 |
| `03-administrator-desktop-1366.png`    | Administrator reference/system control      | 1366 x 900 |
| `04-director-desktop-1366.png`         | Director decision and readiness overview    | 1366 x 900 |
| `05-food-desktop-1366.png`             | Food Committee deadline-first overview      | 1366 x 900 |
| `06-inventory-pantry-desktop-1366.png` | Inventory & Pantry exception-first overview | 1366 x 900 |
| `07-materials-desktop-1366.png`        | Materials traceable fulfillment overview    | 1366 x 900 |
| `08-request-center-desktop-1366.png`   | Request Center                              | 1366 x 900 |
| `09-lending-hub-desktop-1366.png`      | Office Lending Hub                          | 1366 x 900 |
| `10-release-desk-desktop-1366.png`     | Shared Release Desk                         | 1366 x 900 |
| `11-request-center-mobile-390.png`     | Request Center mobile adaptation            | 390 x 844  |
| `12-lending-hub-mobile-390.png`        | Office Lending Hub mobile adaptation        | 390 x 844  |
| `13-release-desk-mobile-390.png`       | Release Desk mobile adaptation              | 390 x 844  |

## Regeneration

Run from the repository root after installing dependencies and Playwright Chromium:

```powershell
npx playwright test tests/e2e/phase2-previews.spec.js `
  --project=chromium-1366 --project=chromium-390
```

The test generates only the PNG files in this directory. Application HTML remains generated
through `npm run build`; do not edit generated HTML directly.

## Safety boundary

- All names, identifiers, credentials, and records used by the generator are synthetic or
  fictional preview values.
- The generator makes no Google Workspace, institutional-data, migration, deployment, or
  production write.
- Role labels and accent colors communicate context only. Server-issued capabilities remain
  authoritative.
