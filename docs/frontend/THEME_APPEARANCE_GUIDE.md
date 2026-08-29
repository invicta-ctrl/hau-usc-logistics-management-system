# Playground theme and appearance guide

Status: accepted current authority on permanent `Playground`
Last reviewed: 2026-08-29

## Appearance contract

Playground provides six independently tuned theme families:

- HAU Institutional — default institutional oxblood, gold, and warm paper;
- Angelite Ivory — quiet warm-neutral operations;
- Midnight Ledger — dark high-focus record review;
- Emerald Operations — green operational emphasis;
- Cobalt Signal — blue information and navigation emphasis;
- Graphite & Copper — restrained neutral/copper presentation.

Each family has explicit Light and Dark palettes. Display mode is an independent `Light`, `Dark`, or `System` preference; System resolves through the same audited palettes. Changing family or mode must update the current document immediately without a page reload and must preserve the other preference.

## Semantic use

Components consume semantic tokens for page, navigation, surfaces, glass, text, borders, focus, selection, tables, inputs, actions, and success/warning/danger/info/unavailable/pending states. Do not introduce route-local literal brand colors when a semantic role exists. Solid content planes are the default; glass is limited to navigation and overlays where hierarchy benefits from it.

Status meaning never depends on color alone. Focus indicators and form boundaries must remain visible in every palette. Text pairs target WCAG AA; interactive boundaries target at least 3:1 non-text contrast. Reduced-motion and reduced-transparency preferences must produce stable, opaque, usable fallbacks.

## Persistence and reset

Authenticated Profile owns family and display-mode selection. The server validates supported values, persists both preferences with audit/idempotency evidence, and restores the demo account’s baseline appearance during Reset Workspace. Unsupported values fail closed.

## Verification authority

- Deterministic audit: 12 palettes and 216 semantic contrast pairs.
- Browser matrix: all families in Light, Dark, and System at 390 and 1440, plus representative five-width navigation/form/table/dialog checks.
- Performance: no full-page reload on theme changes, no table-row blur, bounded active blurred layers, and reduced-motion suppression.
- Detailed evidence: `.codex/PLAYGROUND_MASTER_P18_SIX_THEME_SYSTEM.md` and `.codex/PLAYGROUND_MASTER_P25_THEME_PERFORMANCE_ACCESSIBILITY.md`.
