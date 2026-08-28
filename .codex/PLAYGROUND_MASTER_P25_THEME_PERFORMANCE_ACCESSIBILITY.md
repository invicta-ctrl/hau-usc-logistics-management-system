# P25 — Theme Performance and Accessibility

STATUS: PASS_LOCAL_IMPLEMENTATION; LIVE_PLAYGROUND_ACCEPTANCE_PENDING_P29_P31

## Outcome

The six-family theme system remains instant, document-preserving, responsive, and bounded. A new deterministic audit checks every explicit Light and Dark palette, while browser coverage verifies System resolution, actual runtime token application, focus, navigation, forms, tables, status roles, dialogs, responsive overflow, and expensive visual-effect placement.

The audit found one narrow defect: dark-mode input boundaries were 2.678–2.987:1 against their input fills. The six dark `--theme-border` values were minimally lifted within their existing family hues. Every audited form boundary now reaches WCAG 2.2 non-text contrast of at least 3:1; all other pairs remain green.

## Measured coverage

- Receipt: `.codex/evidence/P25_THEME_ACCESSIBILITY_AUDIT.json`.
- 12 explicit palettes × 18 pairs = 216 checks for page/surface/table/input text, muted text, navigation, actions, six status roles, focus, and form boundaries.
- System mode resolves through the same audited Light or Dark palette according to `prefers-color-scheme` and is browser-checked for all six families.
- Static contracts prove unsupported-backdrop and reduced-transparency opaque fallbacks, reduced-motion suppression, and no table-row backdrop-filter rule.
- Runtime checks found no visible table-row blur/animation and no more than twelve active blurred layers in sampled surfaces.

## Browser evidence

- Dedicated P25 five-width matrix on an isolated current-worktree server at port 4187: 9 passed, 6 intentional viewport-specific skips.
- Default HAU Light/Dark and representative Angelite Light/Midnight Dark passed at 320, 390, 768, 1024, and 1440.
- Every family in Light, Dark, and System passed at 390 and 1440 with sign-in form controls and responsive overflow checks.
- Mobile navigation dialog focus entry, Escape, and restoration passed at 390; desktop focus passed at 1440.
- Actual Profile family/mode changes: 5 passed across all widths with a persistent in-document sentinel and unchanged Navigation Timing entry count, proving no full-page reload.
- Responsive Request queue/table/detail dialog/dark presentation: 5 passed across all widths with focus containment, Escape, and opener restoration.

## Harness isolation correction

`playwright.frontend.config.js` accepted a configurable base port but hard-coded its spawned Vite process and readiness URL to 4174. It now uses the requested port consistently and passes `--strictPort`, preventing accidental reuse of another worktree's frontend.

Port 4173 was occupied without an authenticated supervisor record. The repository returned `STOP_PORT_4173_OWNERSHIP_UNKNOWN`; the process was not killed, reused, or normalized. P25 used isolated port 4187. Exact protected-inspection acceptance remains assigned to later deployment/live phases.

## Verification

- Theme audit: PASS; 12 palettes, 216 pair checks, zero failures.
- Release-candidate ESLint: PASS; zero errors and the same two pre-existing warnings.
- Preview build and fixture boundary: PASS; 1683 modules transformed; generated `dist/index.html` and root shareable rebuilt.
- Full Vitest: PASS; 169 files, 1243 tests.
- P25 Playwright matrix: 9 passed, 6 intentional skips.
- Profile no-reload matrix: 5 passed.
- Request table/dialog matrix: 5 passed.
- `git diff --check`: PASS.

## External state

No deployment, D1, R2, Production, `main`, Google, Figma, or other provider mutation occurred. The unknown port-4173 owner was preserved.

## Decision

P25 is complete locally. P26 may begin the Hallmark audit; later deployment and live-Playground phases retain exact protected-route and deployed-theme acceptance.

NEXT_EXACT_ACTION: Begin P26 Hallmark audit on the current consolidated frontend, preserve accepted hierarchy and semantics, repair only evidence-backed anti-slop findings, rebuild generated artifacts, and keep Production/Figma unchanged.
