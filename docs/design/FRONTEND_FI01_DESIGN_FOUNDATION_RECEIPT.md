# FI-01 Shared Design Foundation Receipt

```text
FI01_STATUS: PASS
PRE_FI01_ROLLBACK_SHA: eacdfcc951c687cfca5731ede245130266b1c3da
PRE_FI01_ROLLBACK_TREE: 30b2ae1d15731d42fa668f48fe6a0064869ff655
STARTING_SHA: eacdfcc951c687cfca5731ede245130266b1c3da
STARTING_TREE: 30b2ae1d15731d42fa668f48fe6a0064869ff655
IMPLEMENTATION_SHA: 6c013c643b81ed57f5d6a1ec7557a51212ca1eee
CLOSEOUT_SHA: 0e0dcc6f536f39955556d921e0a47e9d8f53e578
PUSH_EVIDENCE_SHA: 47868e3821c70bcd75f159a083247b849c66ea6e
ENDING_IDENTITY: recorded by the subsequent closeout commit and remote readback; this receipt does not make a self-referential final-SHA claim
FUNCTIONAL_BASELINE: FI00_RECONCILED_FROZEN_V083;origin/main@86553349f5c2ebefaa637c30828c560a301f99ba
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F + FIGMA_MAKE_V39
RUNTIME_TOKEN_AUTHORITY: src/v5/styles/tokens.css
COLOR_AUTHORITY: DESIGN_AUTHORITY D08/D41 semantic light/dark roles
TYPOGRAPHY_AUTHORITY: D04 PASS; local Bricolage display, IBM Plex Sans body/control/data, Newsreader wordmark, system monospace data fallback
GLASS_BLUR_AUTHORITY: D02 PASS; D41 G1/G2/G3/G4 = 10/14/18/22px with paired fill, saturation, border, shadow, and solid fallback
D04_STATUS: PASS
D02_STATUS: PASS
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
FILES_CHANGED: .codex current-chain records; docs/design FI-01 packet and receipt; src/v5/styles/tokens.css; src/v5/styles/v4.css; canonically regenerated dist/index.html and HAU-USC_Logistics-Prototype-Shareable.html
FILES_REMOVED: NONE
BUILD: PASS; npm run build regenerated tracked outputs through the canonical pipeline
LINT: PASS_SCOPED; npx eslint src/v5 passes. Full npm run lint retains only the pre-existing unrelated prototypes/public-portals-r3 browser-global configuration failure.
TOKEN_THEME: PASS; build-make-theme --check, verify-make-theme, verify-make-landing-theme, and theme-source --check pass
CONTRAST: PASS; D41 light/dark text, control, and focus audit passes
MOTION: PASS; current-app reduced-motion coverage passes in the retained visual harness
BROWSER_VISUAL: PASS; current-app smoke at 390/768/1440 CSS px (retained full matrix: 320/390/768/1024/1440)
GOVERNANCE: PASS; check:agents, handoff:verify, check:continuation, Prettier, diff-check, complete logical diff, and secret/private-data scan pass
ROLLBACK: normal Git revert to the exact pre-FI-01 baseline above
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

`DESIGN.md`, `DESIGN_AUTHORITY.md`, `FRONTEND_SOURCE_DISPOSITION.md`, and the
Figma Make source register require no FI-01 edit: their accepted roles, D41
source authority, disposition, and preserved source identity are unchanged.
This receipt and the current packet record the new runtime consumption instead
of implying those authorities were modified.

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
