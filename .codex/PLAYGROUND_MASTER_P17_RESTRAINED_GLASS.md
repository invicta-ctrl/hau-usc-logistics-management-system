# P17 Restrained Glass Architecture

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_IMPLEMENTATION; LIVE_UI_ACCEPTANCE_PENDING_P29_P31
ROUTE: SOLO

## Material classification applied

| Surface class | P17 treatment | Reason |
| --- | --- | --- |
| Public navigation, compact atrium actions, mobile drawers, modal overlays, and transient QA controls | Retained as functional glass where already present | These are navigation or transient layers allowed by the accepted P17 contract. |
| Command ledgers, workflow paths, activity pulses, topology, reconciliation, selected record rows, and desktop detail inspection | Converted to solid semantic content planes | These surfaces carry dense records, history, evidence, and selected detail. |
| Staff sign-in and account-access form | Converted from raised glass to a solid content surface | Forms require stable contrast and must not depend on backdrop composition. |
| Command-page background | Decorative radial/grid wash removed | It did not encode hierarchy or operational state. |

## Implementation

- Added light/dark `--content-surface`, `--content-surface-muted`, and `--content-surface-raised` tokens plus a reusable `content-surface` class.
- Removed blur, translucent fills, and glass shadows from dense Preview command records and desktop selected detail while retaining ordinary borders and restrained selected-state emphasis.
- Preserved the mobile inspector as a modal/drawer layer; desktop inspection is explicitly solid and blur-free.
- Added opaque fallbacks for retained public/navigation glass under both unsupported `backdrop-filter` and `prefers-reduced-transparency` conditions.
- Added a focused static contract test covering solid record/form/detail surfaces and the opaque fallback set.

## Regression found and repaired

The first browser pass exposed a pre-existing hash-coherence defect made visible by authenticated Profile preference retrieval: generic staff sign-in selected the correct authorized home, but the hash-sync effect replayed the stale `#/route/staff-signin` URL after the session update. The controller now replaces the gateway hash with the authorized destination before moving routes. The authoritative five-width browser matrix confirms the identity gateway leaves the DOM and the capability-projected shell remains stable.

## Verification

- Focused contract suite: 4 files, 22 tests passed.
- Full Vitest suite: 167 files, 1232 tests passed.
- Targeted frontend Playwright matrix: 15 tests passed across 320, 390, 768, 1024, and 1440 widths, covering generic staff routing, P14 Profile, and Home return behavior.
- Frontend build: passed; 1679 modules transformed; `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html` rebuilt from source.
- Release-candidate lint: 0 errors and the same 2 pre-existing warnings in `src/server/public-request-service.js` and `tests/unit/fi07-lending-hub.test.js`.
- Exact verification server: port 4175 closed after the browser run.

## External state

No deployment, D1, R2, Production, main, Google, Figma, or other provider mutation was performed. Live Playground acceptance remains assigned to P29–P31.

## Next exact action

Begin P18 Six-theme system. Define six named semantic token families with independently designed Light and Dark palettes, keep Light/Dark/System as a separate mode preference, expose the selector in Profile, persist it in reset-restored account metadata, and verify every operational state and surface class.
