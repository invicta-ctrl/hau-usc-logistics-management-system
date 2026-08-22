# v0.4.2 Front-End Handoff — Glossy Command Center

Durable technical record. Written so Codex can resume from repository files
alone, without chat history.

## objective

Evolve Codex's v0.4.1 preview into a glossy, cinematic logistics command center:
dark command-center ground, controlled glassmorphism, luminous telemetry, a real
WebGL routing globe, corrected celestial toggle, redesigned menu/back controls,
and substantially more purposeful motion — front-end only, with all existing
workflow coverage preserved.

## front-end only — confirmed

Nothing outside the isolated preview was touched. No Worker logic, service, API
contract, migration, D1, R2, Google, provider, auth backend, deployment config,
binding, secret, staging, production, or release-branch change. The design
branch is the only branch written.

## what changed in this session

New file:
- `prototypes/impeccable-whole-site-redesign-v5/styles/v5.css`

Modified inside v5 only:
- `src/components.js` — `celestialToggle()` with dedicated filled celestial art;
  `themeToggle()` now delegates to it.
- `tools/export.mjs` — includes `styles/v5.css`; writes the v0.4.2 filename.
- `index.html` — registers `styles/v5.css` after `v4.css`.
- `tools/theme-test.mjs` — retargeted to `.celestial*` selectors.
- New `tools/control-shots.mjs` (control close-up evidence) and
  `tools/aria-probe.mjs` (accessible-state probe).

Preserved and untouched: the entire v1/v2/v3/v4 source trees and their exports,
`output/design/impeccable-redesign-v4*` evidence directories, and the v0.7.2
reference HTML (`44d2800…0972c`).

## the moon fix — root cause

v4.1 rendered the moon through the shared monoline sprite. That sprite is
defined as `fill="none" stroke="currentColor" stroke-width="1.8"`, so **every**
glyph routed through it is an outline. The moon was therefore a stroked crescent
ring — precisely the "outline-only crescent / thin line icon" the owner
rejected.

Fix: the celestial glyphs are no longer sprite icons. They are dedicated inline
SVG in `components.js`:

```
moon: M12 2.6a9.4 9.4 0 1 0 9.4 9.4A7.35 7.35 0 0 1 12 2.6Z   (fill=currentColor)
sun:  filled r=4.15 core + 8 separated round-capped rays
```

The moon is a single filled path — a disc with a second arc carved out of its
upper right — so it is a solid silhouette at any size and can never render as a
ring. Verified visually against
`docs/design/references/v0.4.1-control-references/daynight-toggle-TARGET.png`.

## celestial toggle contract

Geometry: 78×38 capsule, 30px plate, 4px padding, travel = 40px.

```
LIGHT  plate left,  sun on plate (dark ink),  moon muted on capsule
DARK   plate right, moon on plate (dark ink), sun muted + rays contracted
```

Timings (from the brief): press 120ms, travel 260ms, choreography 300ms,
crossfade 360ms. Transform and opacity only. No bounce. No layout animation.

**Accessible state uses `aria-pressed`, not `role="switch"`/`aria-checked`.**
This is deliberate: `setTheme()` in `app.js` updates
`[data-act="toggle-theme"]` imperatively rather than re-rendering, so the plate
can animate on the same DOM node. It maintains `aria-pressed`. Adding a second
state attribute left a stale, untruthful `aria-checked` behind — that was caught
by `tools/theme-test.mjs` and fixed. **Do not reintroduce `aria-checked` unless
you also update `setTheme()`.**

## menu control

Targets the existing `.menu-control__glyph > i × 3` markup — no structural
change. The close morph is keyed to `data-drawer-open="true"`, **not**
`aria-expanded`. On desktop `aria-expanded` reports whether the rail is
expanded, so keying the X off it showed a false "close" affordance whenever the
rail was simply open. Collapsed desktop rail instead shortens the middle rule
via `scaleX` (never a width animation).

## back control

Compact glossy pill (102×44 including label) with a circular specular glyph
plate; the arrow travels −3px on hover. Replaces the rejected large thin
outlined circle.

## glass system

Tokens in `v5.css`: `--glass-base/raised/overlay/border/edge/specular/shadow/
blur/saturation`, `--glass-solid*` fallbacks, and `--glow-gold/blue/green/alert`
plus `--telemetry-cyan/emerald`. `.glass`, `.glass--raised`, `.glass--overlay`
apply `backdrop-filter` **inside an `@supports` guard**, with an opaque solid
background as the base declaration so unsupported browsers stay readable.

Currently consumed only by the signature controls. Broad application is the
next slice.

## verification commands

```bash
node prototypes/impeccable-whole-site-redesign-v5/tools/export.mjs

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v5/tools/verify.mjs \
  output/design/HAU_USC_Logistics_Glossy_Command_Center_v0.4.2_Preview.html \
  output/design/impeccable-redesign-v0-4-2-screens

PLAYWRIGHT_PATH=... node prototypes/impeccable-whole-site-redesign-v5/tools/contrast.mjs <export>
PLAYWRIGHT_PATH=... node prototypes/impeccable-whole-site-redesign-v5/tools/theme-test.mjs <export>
PLAYWRIGHT_PATH=... node prototypes/impeccable-whole-site-redesign-v5/tools/control-shots.mjs <export> <outDir>

node <impeccable-skill>/scripts/detect.mjs prototypes/impeccable-whole-site-redesign-v5/
```

The design worktree has no `node_modules`; `PLAYWRIGHT_PATH` must point at the
authoritative checkout's install.

## results at this checkpoint

| Gate | Result |
|---|---|
| Contrast, both themes | 0 failures |
| a11y/responsive, 6 widths | 0 findings |
| Console errors | 0 |
| Runtime non-`file:` requests | 0 |
| Keyboard / focus restore | pass |
| Reduced motion | pass |
| 200% zoom | 0 overflow |
| Celestial toggle acceptance | 13/13 |
| Impeccable detector | 71 (v4.1 baseline: 58) |

The 13 added detector findings are design-system documentation drift
(`design-system-radius`, `-font-size`, `-color`) from the new glass literals,
not visual anti-patterns. Clearing them means recording the glass/glow scale in
the DESIGN.md frontmatter sidecar.

## detector exceptions — why they exist

`.impeccable/config.json` ignores two globs:

```
prototypes/impeccable-whole-site-redesign/**      (v1)
prototypes/impeccable-whole-site-redesign-v2/**   (v2)
```

Reason, recorded here because `ignore-file` stores globs only and cannot carry a
`--reason`: both are **frozen comparison baselines**, and both were authored
*before* the V4.1 design system existed. v1's `shell.css` dates to `e7497f1` and
v2's `motion.css` to `05c7889`; the DESIGN.md frontmatter they are now measured
against was introduced at `a413824`, three iterations later. The detector was
therefore reporting `design-system-color` / `-font-size` / `-radius` drift
against a palette and type ramp that did not exist when those files were
written.

Fixing them would be wrong: the v0.4.1 takeover boundary forbids modifying
prior-version trees, and rewriting them to satisfy a newer system would destroy
their value as a faithful record of each iteration.

**Scope check after applying (run, not assumed):** v1 → 0, v2 → 0,
v4 → 58, v5 → 71. The live trees still report; nothing was over-suppressed.

The 13 findings v5 adds over the v4.1 baseline are **not** covered by any
exception and remain open — they are genuine design-system documentation drift
from the new glass/glow literals. Clearing them means recording the glass scale
in the DESIGN.md frontmatter sidecar, not adding another ignore.

## known risks / open items

- **The WebGL globe is not built.** It is the brief's required signature
  feature and the single largest remaining visual delta.
- Glass is defined but not broadly applied, so the overall surface still reads
  close to v4.1 away from the controls.
- Dark mode remains predominantly maroon rather than charcoal-with-oxblood-tint.
- The v0.4.2 export is ~817 KB. Vendoring Three.js will add materially; the
  brief requires bundling it (no runtime CDN), so budget for that.
- No before/after visual delta matrix was captured this session.

## do not repeat

- Do not re-extract the PDF: the pack and the three control references are
  committed under `docs/design/references/`.
- Do not re-derive the surface matrix; v4.1 preserves all routes and state
  variants and nothing was removed this session.
- Do not modify `prototypes/impeccable-whole-site-redesign-v4/` or its export —
  it is the protected v0.4.1 comparison baseline.
- Do not route celestial glyphs through the monoline sprite again.
