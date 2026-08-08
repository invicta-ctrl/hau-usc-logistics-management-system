# Impeccable v2 Design Handoff

Durable technical record for the v2 redesign preview. Written so a fresh Codex
session on another machine or account can continue from repository files alone.

## objective

Take the completed v1 whole-site redesign preview — structurally strong,
visually too restrained — and produce a **v2** that is bolder, more modern,
more animated, more premium, while keeping operational clarity, information
density, HAU-USC identity, and accessibility.

v1 is preserved. All v2 work happens in a duplicated source tree.

## visual thesis

**Kinetic Institutional Operations.** A premium institutional operations
product with personality: institutional credibility and editorial hierarchy,
crossed with modern operational software and premium transit/aviation control
surfaces. Stronger dimensionality, selective motion, oxblood authority, gold
highlights, warm crisp light mode, deep dramatic dark mode.

Energy target: from ~4/10 (v1) to ~7.5/10. Explicitly **not** gaming UI,
nightclub, startup landing page, neon cyberpunk, glassmorphism overload.

## owner amendments (supersede earlier preferences on conflict)

1. Increase visual energy to ~7.5/10.
2. The theme toggle is a real visual feature: a dedicated icon button showing
   **sun in light mode, moon in dark mode**, with an animated transform
   (rotate/scale/crossfade, 180–260 ms) rather than an instant swap. Theme
   persists locally; system preference is only the first-run default. Accessible
   name describes the action ("Switch to dark mode" / "Switch to light mode");
   accessible state stays truthful; animation respects `prefers-reduced-motion`.
3. Purposeful animation is required. Motion must communicate hierarchy, state
   change, navigation, context, completion, progressive disclosure, or live
   operational attention — never "it looks cool".

## files changed so far

Created:
- `output/design/backups/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v1_Baseline_Backup.html`
- `prototypes/impeccable-whole-site-redesign-v2/` (duplicate of v1)
- `output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html`
- `.codex/IMPECCABLE_V2_CURRENT.md`
- `.codex/IMPECCABLE_V2_HANDOFF.md`
- `.codex/IMPECCABLE_V2_RESUME_PROMPT.md`

Modified inside v2 only:
- `prototypes/impeccable-whole-site-redesign-v2/tools/export.mjs` — writes the
  v2 output filename and points its provenance comment at the v2 source.

Untouched and must stay untouched:
- `prototypes/impeccable-whole-site-redesign/` (v1 source)
- `output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview.html`
- `output/design/IMPECCABLE_REDESIGN_REVIEW.md`
- `output/design/impeccable-redesign-screens/` (v1 screenshots)
- `docs/design/references/…Reference.html` (SHA `44d2800…0972c`)

## components changed

- **tokens.css** — rewritten: surface ladder, dark depth re-ordering, raised
  type scale, radius variety, three-step elevation, motion tokens, anchor and
  accent tokens, `--muted` recomputed. Compatibility aliases kept for
  `--dur-state`, `--dur-move`, `--elev-raised`, `--elev-raised-strong`.
- **motion.css** — new file; the whole motion system.
- **shell.css** — rail re-toned with `--rail-*` tokens, gold edge hairline,
  elevated topbar, dark-mode plaque overrides.
- **components.css** — attention band as page anchor, editorial section rule,
  raised panels and queue surfaces, elevated detail pane with anchor-washed
  head, oxblood selected-row spine, split rebalanced, `.q__date` nowrap.
- **surfaces.css** — asymmetric `.rails--overview`, portal lead action,
  larger public headings, `.public__bar-actions`.
- **responsive.css** — rebuilt mobile tab bar, `.rails--overview` collapse.
- **components.js** — `themeToggle()`; `queueTable()` single class list plus
  `nowrap` column option; `meter()` emits `scaleX`.
- **app.js** — theme persistence, `setTheme()` with `.theme-anim`, product
  toggle in the topbar, `.stage` staged reveal.
- **surfaces/public.js** — `setPublicTheme()` and the public-bar toggle.
- **surfaces/operations.js** — `.rails--overview`, `nowrap` date columns.
- **tools/** — `export.mjs` writes the v2 filename and includes motion.css;
  `verify.mjs` and `contrast.mjs` freeze motion before sampling; new
  `theme-test.mjs` and `shot.mjs`.

## motion tokens (target)

```text
instant feedback         100–140 ms
small component motion   160–220 ms
page/surface transition  220–320 ms
drawer/modal             240–360 ms
large staged reveal      280–480 ms
easing                   cubic-bezier(0.22, 1, 0.36, 1)
```

No bounce easing. No endless decorative loops. At most one continuous animation
per visible viewport, preferably zero; a slow pulse is allowed only on a live
status dot that genuinely reports a live/connected state.

## theme behavior (target)

- Light = sun icon visible; pressing it switches to dark.
- Dark = moon icon visible; pressing it switches to light.
- Animated transform between the two, 180–260 ms.
- Surfaces transition smoothly and must not flash.
- Preference persisted locally; system preference only as first-run default.
- `prefers-reduced-motion` removes the spatial animation but keeps the state
  change instant and legible.

## surfaces completed

All 32 surfaces / 53 surface-state combinations, across Public, the shared
authenticated shell, role workspaces, Operations, and Administration. Per-surface
v2 changes are recorded in `docs/design/IMPECCABLE_V2_SURFACE_MATRIX.md`.

## surfaces not yet completed

None. No `Reports` surface exists, deliberately: `src/features/reports/` has no
bootstrap module and no view template, so inventing one would contradict source.

## accessibility findings

v1 baseline is clean and must not regress:
- 0 findings across 53 surface/state combinations at 320/375/414/768/1024/1440.
- 0 contrast failures in both themes.
- 0 horizontal overflow at 200% zoom.
- Focus ring never suppressed on a real control; the only exception is the
  `#surface-main` programmatic route-landing target, documented in the CSS.
- Dialogs move focus in, trap it, close on Escape, and restore focus to trigger.
- Closed mobile drawer scrim uses `visibility: hidden` so it leaves the tab
  order and accessibility tree.

## responsive findings

v1 uses container queries on `.frame`, so the preview width switcher reflows the
real layout and browser resizing behaves identically. Breakpoints: 1180 / 1023 /
900 / 767 / 560 / 380. Column priority drops `col-p3` then `col-p2`; status and
quantity always survive.

## Impeccable findings

Detector clean on v1 source and v1 export. One earlier finding
(`[layout-transition] transition: max-width`) was fixed by removing the
transition, not suppressed. No ignore rules exist.

## known defects

None outstanding. Fixed during v2: a 4px side-stripe AI tell on the attention
band; two layout-thrashing transitions (`height`, `width`) now transform-driven;
`--muted` at 4.23:1 against the new ground; a latent v1 bug where `queueTable`
emitted two `class` attributes and silently lost numeric alignment; date columns
wrapping mid-value; and a split-pane ratio that pushed queue titles onto second
lines.

Open risks are listed in `output/design/IMPECCABLE_REDESIGN_V2_REVIEW.md`
under KNOWN RISKS — chiefly that `--muted` has now moved twice for contrast and
should be computed against the ground rather than chosen by eye, and that the
staged-reveal timing is tuned to preview-sized queues.

## exact tests

```bash
# regenerate v2 export
node prototypes/impeccable-whole-site-redesign-v2/tools/export.mjs

# Impeccable detector
node <impeccable-skill>/scripts/detect.mjs prototypes/impeccable-whole-site-redesign-v2/

# accessibility + responsive + screenshots (needs an existing Playwright install)
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v2/tools/verify.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html \
  output/design/impeccable-redesign-v2-screens

# contrast, both themes
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v2/tools/contrast.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html
```

The design worktree has no `node_modules`; `PLAYWRIGHT_PATH` must point at an
existing install (the authoritative checkout has one).

## exact screenshots

v1: `output/design/impeccable-redesign-screens/` — 57 PNGs, 18 surface/state
combinations at 320/768/1440 plus a dark capture per width. **Leave unchanged.**

v2: `output/design/impeccable-redesign-v2-screens/` — to be created.

## external writes

Authorized for this program: local commits on
`design/impeccable-whole-site-preview`, creating and pushing that branch to
`origin`.

Not authorized: pull request, merge, `main`, release-branch write, production,
staging deployment, Cloudflare, D1, R2, Google Sheets/Drive, migrations,
DNS/domain, secrets, destructive cleanup.

`.impeccable/hook.cache.json` is tooling cache and is deliberately **not**
committed.

## current commit

See `.codex/IMPECCABLE_V2_CURRENT.md` → CURRENT SHA, refreshed at each
checkpoint.

## next bounded slice

Slice B — v2 design system foundation:
1. Impeccable boldness critique of v1 → `docs/design/IMPECCABLE_V2_BOLDNESS_CRITIQUE.md`.
2. v2 token layer: bolder light and dark palettes, elevation ladder, type scale.
3. Motion tokens and the animated sun/moon theme toggle.
4. Checkpoint 2 commit and push.

## do not repeat

- Do not re-derive the v1 surface matrix from scratch; it is accurate as of
  `a18e8fc` and carries a drift note.
- Do not re-run v1 verification; it is recorded and the v1 source is frozen.
- Do not re-read the reference HTML in full; the analysis is in
  `docs/design/IMPECCABLE_REFERENCE_ANALYSIS.md`.
- Do not switch the authoritative checkout off its release branch.
- Do not merge release-branch work into this design branch.
