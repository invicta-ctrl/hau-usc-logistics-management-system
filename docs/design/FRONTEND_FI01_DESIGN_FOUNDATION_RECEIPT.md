# FI-01 Shared Design Foundation Receipt

```text
FI01_STATUS: PASS
STARTING_SHA: eacdfcc951c687cfca5731ede245130266b1c3da
STARTING_TREE: 30b2ae1d15731d42fa668f48fe6a0064869ff655
IMPLEMENTATION_SHA: 6c013c643b81ed57f5d6a1ec7557a51212ca1eee
ENDING_SHA: GIT_HEAD; origin/frontend-design-integration readback parity 0/0
ENDING_TREE: GIT_TREE; origin/frontend-design-integration tree parity verified
FUNCTIONAL_BASELINE: FI00_RECONCILED_FROZEN_V083;origin/main@86553349f5c2ebefaa637c30828c560a301f99ba
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F + FIGMA_MAKE_V39
RUNTIME_TOKEN_AUTHORITY: src/v5/styles/tokens.css
COLOR_AUTHORITY: DESIGN_AUTHORITY D08/D41 semantic light/dark roles
TYPOGRAPHY_AUTHORITY: D04 PASS; local Bricolage display, IBM Plex Sans body/control/data, Newsreader wordmark, system monospace data fallback
GLASS_BLUR_AUTHORITY: D02 PASS; D41 G1/G2/G3/G4 = 10/14/18/22px with paired fill, saturation, border, shadow, and solid fallback
MOTION_AUTHORITY: tokens.css named 120/200/280/320/400ms durations and D09 easing roles
FOCUS_AUTHORITY: D41 two-part contrast ring plus institutional gold outer ring
D08_STATUS: OPEN_FOR_FI02; no landing-hero acceptance claimed
DEPENDENCIES_ADDED: 0
BACKEND_CHANGES: 0
API_CHANGES: 0
MIGRATIONS: 0
PROVIDER_WRITES: 0
FIGMA_WRITES: 0
PLAYGROUND_WRITES: 0
PRODUCTION_WRITES: 0
RECOVERY_POINTER_CHANGES: 0
ROLLBACK: normal Git revert to FI-00 baseline
KNOWN_RESIDUALS: repository-wide npm lint has a pre-existing browser-global configuration failure in prototypes/public-portals-r3/app.js; focused npx eslint src/v5 passes. The historical standalone v5 preview tools target a retired preview export and are not the current-app harness; current Playwright V5 visual acceptance passes.
NEXT_SLICE: FI-02 — Public Landing & Portal Shell
```

## Runtime reconciliation

`src/index.html` continues to load the existing primitive selector sheets. Their
old `:root` and `[data-theme]` declarations are explicitly inactive, while
`tokens.css` is the one active token/theme declaration source. The local font
faces also moved there, leaving every active font-family declaration classified
by the D04 role map. No remote font request or new component framework was
introduced.

## Verification before closeout

- `npm run build` — PASS; Vite production preview build and tracked shareable
  regeneration completed.
- `npx eslint src/v5` — PASS; `npm run lint` retains only the documented,
  unrelated prototype configuration failure.
- `node scripts/design/build-make-theme.mjs --check`,
  `verify-make-theme.mjs`, `verify-make-landing-theme.mjs`, and
  `theme-source.mjs --check` — PASS.
- D41 contrast audit — PASS for all documented light/dark text, control, and
  focus pairings.
- `npx playwright test --config playwright.v5.visual.config.js` — PASS: five
  current-application samples at 320, 390, 768, 1024, and 1440 CSS px, with
  light/dark captures for public, operational, dense queue, and access views.
- `check:agents`, `handoff:verify`, targeted Prettier, and `git diff --check`
  — PASS before final commit/push.
