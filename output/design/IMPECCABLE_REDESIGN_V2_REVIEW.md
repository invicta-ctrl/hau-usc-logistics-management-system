# Impeccable Redesign v2 Review

Comparison and verification record for **Kinetic Institutional Operations**, the
v2 design preview.

- **Branch:** `design/impeccable-whole-site-preview`
- **v1 preview SHA-256:** `bbefd9972a6d825db71b648e6470383514bc5fec1f2bf0a6b9299f2e8b420f5a` — byte-identical to its backup
- **Reference SHA-256:** `44d2800695d0f9546911522eba1b240ff405b4dbbfc85493ac27ea90f7e0972c` — unchanged
- **v1 modular source:** unmodified (`git status` clean for that path)
- **Date:** 2026-08-08

---

## WHAT V1 DID WELL

- Correctly diagnosed the reference's failures: twelve equal-weight boxes, a
  shadow on every panel, decorative gradients, three shimmer sweeps.
- Replaced card walls with semantic tables, focusable rows, and a queue +
  split-pane detail pattern that never loses queue position.
- Collapsed 21 canonical statuses onto five tones with labelled chips, so
  colour never travels alone.
- Established column priority where status and quantity survive every
  breakpoint.
- Built on container queries, so the width switcher reflows the genuine layout.
- Reached a clean accessibility baseline: 0 contrast failures, 0 overflow at
  320 px and 200% zoom, focus restored to trigger, no suppressed focus rings.
- Preserved the icon system's single-brand-ink rule.

**All of it is retained in v2.**

## WHY V1 FELT BLAND

v1 over-corrected. Every fix was subtractive and nothing was added back to carry
hierarchy. Concretely and measurably:

1. `--canvas` and `--paper` were **1.5% apart in relative luminance**. No
   surface had a figure/ground relationship — the literal source of "beige on
   beige".
2. Elevation was reduced to two levels and panels made flat, so **nothing on an
   overview page had depth**.
3. Oxblood appeared in **two places** on an authenticated page — the rail and
   primary buttons. The content area, where operators live, was neutral grey.
4. Section headings sat at 17 px under a 44 px title: a 27 px gap with nothing
   in it, so pages read as one title followed by undifferentiated content.
5. Composition was uniform — vertical stacks and equal-width grids. `.split` was
   the only asymmetric layout in the system.
6. **Motion was absent, not restrained.** Every transition was hover colour; the
   only keyframes were a spinner and a skeleton.
7. The theme control was two text buttons in *preview chrome*. The product shell
   had no theme control at all.
8. Dark mode was accessible but had **inverted depth**: the rail was lighter
   than the content ground, so navigation advanced and content receded.

## WHAT V2 CHANGED

- **Surface ladder** in both themes: ground → surface → raised → overlay, with a
  ~20% relative luminance gap in light.
- **Dark mode depth re-ordered**: ground `#100b0c` < rail `#2c1013 → #180a0c` <
  surface `#1f1719`.
- **Three-step elevation ladder**; queues and detail panes are working surfaces.
- **Type raised**: section heads 17 → 20 px in the display serif, attention
  values 32 → 44 px, tighter display tracking.
- **Brand colour promoted to a compositional device**: 56 px section rules, a
  wash behind the detail header, an oxblood spine on the selected row, oxblood
  active mobile tab.
- **Asymmetric composition**: overview rails 1.45 / 1 / 1.15; a full-width
  horizontal lead action on the public portal; split pane rebalanced to
  1.32 / 0.68.
- **A documented motion system** (below).
- **A real animated theme toggle** in the product shell and public bar.
- **`--muted` darkened** to `#6f5a60` for the new ground.
- Two latent v1 defects fixed: `queueTable` emitted two `class` attributes when
  a column had both `priority` and `numeric` (the browser dropped the second,
  losing numeric alignment), and date columns wrapped to `2026-08-\n19`.

## WHAT V2 PRESERVED

Queue + split-pane detail; semantic tables with focusable rows; column priority
with status and quantity always surviving; five status tones with labelled
chips; the icon system's geometry and single brand ink; truthful unknowns;
illustrative-data labelling; public surfaces simpler than internal; container-
query responsiveness; the full accessibility baseline; **32 surfaces / 53
surface-state combinations**; and no invented Reports module.

## MOTION ADDED AND PURPOSE

| Motion | Duration | Communicates |
|---|---|---|
| Theme toggle icon | 200 ms | current theme; press transforms rather than replaces |
| Theme surface change | 280 ms, colour only | deliberate change, no flash |
| Surface entry | 280 ms | navigation |
| Staged reveal | 400 ms / 40 ms steps | reading order |
| Nav indicator | 200 ms `scaleY` | active route, selection moved |
| Row selection | 200 ms | this row owns the detail beside it |
| Progress meter | 400 ms `scaleX` | progress moved between values |
| Buttons | 120 ms | pressability, acknowledgement |
| Drawer / dialog / menu | 200–320 ms | a layer arrived above context |
| Toast | 320 ms | completion |
| Live status dot | 2.6 s loop | a live connection |

Budget honoured: **one continuous animation in the entire system** (the live
dot), removed under reduced motion. No bounce. No layout is animated — the two
detector findings that animated `height` and `width` were converted to
transforms.

## LIGHT MODE CHANGES

Sunken warm-sand ground (`#e9e0d0`) under white paper surfaces, so panels sit on
something. Oxblood in content as rules, washes, and spines. Gold as a real
highlight rather than only a focus artefact. Display serif carries page titles,
section headings, attention numerals, and detail titles.

## DARK MODE CHANGES

Deep warm foundation, burgundy structural surfaces, content above its ground,
warm off-white text, gold highlights. No pure black, no neon, no red-on-near-
black, no blur stacks. Depth cues now run the correct direction.

## THEME TOGGLE BEHAVIOUR

Verified by `tools/theme-test.mjs`:

| Check | Result |
|---|---|
| light → dark → light cycle | correct at every step |
| Animated, not snapped | mid-transition sample caught the moon at `scale(1.06121)` |
| Duration | `0.2s` (required band 180–260 ms) |
| `aria-pressed` | `false` light, `true` dark |
| Accessible name | "Switch to dark mode" / "Switch to light mode" |
| Persists across reload | stored `dark` → reloads `dark` |
| First run, system dark | `dark`, nothing stored |
| First run, system light | `light`, nothing stored |
| Stored beats system | system dark + stored light → `light` |
| Reduced motion | transforms `none`, transition `1e-05s`, icon still swaps, aria still updates |

No animation library. CSS and the existing sprite only.

## ACCESSIBILITY IMPACT

**No regression. Bolder did not cost accessibility.**

| Gate | v1 | v2 |
|---|---|---|
| Impeccable detector | 0 | 0 (3 findings fixed, none suppressed) |
| a11y/responsive findings, 53 combos × 6 widths | 0 | 0 |
| Contrast failures, both themes | 0 | 0 |
| Overflow at 200% zoom | 0 | 0 |
| Suppressed focus rings | 0 | 0 |
| Focus restored to trigger | yes | yes |
| Console errors | 0 | 0 |
| Non-`file:` network requests | 0 | 0 |

Contrast required two fixes to stay clean: `--muted` against the darker ground,
and re-verification of every anchor wash and alert-toned surface.

## RESPONSIVE IMPACT

Verified at 320 / 375 / 414 / 768 / 1024 / 1440 with 0 findings at every width.

- Overview rails collapse 3 → 2 (lead spanning) at 1023 px, then 1 at 767 px.
- Portal lead action reverts from horizontal to stacked at 640 px so the mark
  and title do not crush at 320 px.
- Mobile tab bar rebuilt: oxblood active fill, gold glyph, `--elev-3`, 52 px
  targets.
- Column priority unchanged; status and quantity survive every breakpoint.

## SURFACES WITH LARGEST IMPROVEMENT

1. **Administrator overview** — the attention band became a genuine page anchor
   instead of a flat strip reading at the same level as the table below it.
2. **Public portal landing** — a lead action now tells a first-time visitor
   where to start; v1 gave four identical cards.
3. **Request Center** — the selected row's oxblood spine ties visually to an
   elevated detail pane with an anchor-washed header.
4. **Dark mode, everywhere** — depth ordering corrected, drama added.
5. **Mobile shell** — the tab bar went from a plain white slab to a confident,
   branded control.

## KNOWN RISKS

- **The `--muted` token has now moved twice for contrast.** It should be treated
  as a value computed against the ground, not chosen by eye.
- **Staged reveal is tuned to preview-sized queues.** At production data volumes
  the 40 ms stagger may need shortening or removing.
- **Two theme controls exist inside the preview** (the product toggle and the
  preview bar's Light/Dark pair). Only the former is part of the product design.
- **Asymmetric layouts each need their own collapse rule**; adding a fourth
  overview rail would require revisiting `.rails--overview`.
- **The meter's inner span is scaled**, so any future border or inner content on
  it would scale too.
- Contrast over gradient backgrounds is verified visually, not automatically.
- Interaction fidelity remains illustrative: no filtering, sorting, pagination,
  or submission.

## WHAT SHOULD NOT BE PORTED TO PRODUCTION YET

1. **Nothing, without an accepted v0.8.0 specification.** The active v0.7.2 spec
   §3.3 explicitly defers this redesign.
2. The token layer must be *reconciled* with `src/styles/tokens.css` and
   `src/styles/visual/tokens-base.css`, not dropped over them.
3. The five-tone status mapping needs validation against all 21 canonical
   statuses with the people who operate them.
4. Staged-reveal motion needs re-evaluation against real data volumes.
5. `--muted` must be recomputed against production's actual ground.
6. `--preview-bar-h` is preview-only; in production the shell owns the full
   viewport and it resolves to `0px`.
7. The preview's mock data layer must not ship.

## SCREENSHOT EVIDENCE

- **v2:** `output/design/impeccable-redesign-v2-screens/` — 57 PNGs, 18 surface
  and state combinations at 320 / 768 / 1440 plus a dark capture per width.
- **v1 (unchanged):** `output/design/impeccable-redesign-screens/` — 57 PNGs.

File names are identical between the two sets, so any surface can be compared
directly by opening the same filename in both directories.

## RELEASE-BRANCH DRIFT

`release/v0.7.2-production-access-operations` moved independently during this
program: `a18e8fc` → `1f216a1` → `5ef9421`. `a18e8fc` remains an ancestor. This
design branch never wrote to it, never merged from it, and was not rebased onto
it. Treated as external drift, per the task boundary.
