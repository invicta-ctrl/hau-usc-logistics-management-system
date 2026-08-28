# P18 Six-theme System

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_IMPLEMENTATION; LIVE_UI_ACCEPTANCE_PENDING_P29_P31
ROUTE: SOLO

## Theme contract

- Added six exact theme families: HAU Institutional (default), Angelite Ivory, Midnight Ledger, Emerald Operations, Cobalt Signal, and Graphite & Copper.
- Defined explicit, independently tuned Light and Dark palettes for every family rather than applying a shared lightening or darkening transform.
- Defined every accepted semantic role in all twelve palettes: page, nav, surfaces, glass, primary, accent, text, borders, focus, selection, tables, inputs, success, warning, danger, info, unavailable, and pending.
- Routed the authenticated shell through semantic theme tokens and removed its remaining literal legacy oxblood, gold, and ivory color values.
- Retained solid content planes from P17 while allowing functional navigation and overlay surfaces to consume the selected glass tokens.

## Preference and persistence

- Added a shared typed theme contract for family and mode, with independent `Light`, `Dark`, and `System` display modes.
- Profile now presents six theme-family radios and three separate display-mode radios; changing one preserves the other.
- Browser persistence uses separate `hau-usc-theme-family` and legacy-compatible `hau-usc-theme` keys.
- Account persistence stores the mode at the existing `profile.appearance.<accountId>` metadata key and the family at `profile.appearance.family.<accountId>`.
- Both metadata writes, audit evidence, and idempotency evidence commit in one D1 batch. Existing reset metadata restoration returns both preferences to the clean baseline, so no schema migration was required.
- Server and frontend projections validate both values and fail closed for unsupported families or modes.

## Visual inspection correction

The exact Profile capture at 390 and 1440 pixels exposed a low-contrast success message in Emerald Operations Dark. Feedback surfaces now mix the selected semantic success or danger color into the selected surface and use the selected semantic text color. Temporary visual evidence files were removed after inspection.

## Verification

- Focused contract suite: 5 files, 53 tests passed.
- Full Vitest suite: 168 files, 1237 tests passed.
- Targeted frontend Playwright matrix: 20 tests passed across 320, 390, 768, 1024, and 1440 widths, covering generic staff routing, P14 Profile, P18 family/mode persistence, and Home return behavior.
- Additional visual capture run: 2 P18 cases passed at 390 and 1440 pixels; captures inspected directly.
- Deterministic contrast contract: all five critical text pairs in all twelve family/mode palettes meet or exceed WCAG AA 4.5:1.
- Frontend build: passed; 1680 modules transformed; `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html` rebuilt from source.
- Release-candidate lint: 0 errors and the same 2 pre-existing warnings in `src/server/public-request-service.js` and `tests/unit/fi07-lending-hub.test.js`.
- `git diff --check`: passed.

## External state

No deployment, D1, R2, Production, main, Google, Figma, or other provider mutation was performed. Live Playground acceptance remains assigned to P29–P31.

## Next exact action

Begin P19 full copy, semantics, and UX-writing audit. Inventory every user-visible string, remove slogan and normal-user development language, tighten action labels and recovery copy, and add the canonical UI-language guide.
