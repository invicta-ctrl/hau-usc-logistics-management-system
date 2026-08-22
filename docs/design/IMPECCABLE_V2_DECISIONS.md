# Impeccable v2 — Decisions

Each entry records what was decided, why, and what it costs. v1's decision log
(`IMPECCABLE_REDESIGN_DECISIONS.md`) remains valid except where superseded here.

---

## V1 — Duplicate rather than edit in place

v1 is frozen at `prototypes/impeccable-whole-site-redesign/` and its export is
backed up byte-identically. All v2 work happens in a duplicated tree.

**Cost:** two sources to keep in mind; the v1 tree will drift out of date. That
is acceptable — it exists as a comparison baseline, not as a maintained product.

## V2 — Open a real surface ladder

The measured cause of "bland": `--canvas` and `--paper` were 1.5% apart in
relative luminance, so nothing had a figure/ground relationship. v2 defines
ground → surface → raised → overlay with a ~20% relative gap in light.

**Cost:** every `--muted`-on-ground contrast pair had to be re-verified, and
`--muted` needed darkening (below).

## V3 — Re-order dark mode depth

In v1 the rail was **lighter** than the content ground, so navigation advanced
and content receded — backwards. v2 orders ground `#100b0c` < rail
`#2c1013 → #180a0c` < surface `#1f1719`.

**Cost:** the dark rail is less saturated than v1's. It reads as structure
rather than as a brand banner, which is the intended trade.

## V4 — Darken `--muted` to `#6f5a60`

v2's darker ground pushed the v1 value (`#786369`) to 4.23:1, under the 4.5 AA
floor. Verified at 4.82:1 on ground and ~6:1 on paper.

**Cost:** metadata is fractionally heavier. This is the second time this token
has moved for contrast; it should be treated as a computed value against the
**ground**, not chosen by eye.

## V5 — Brand colour becomes a compositional device

Oxblood in v1 appeared only on the rail and primary buttons — roughly 15% of an
authenticated page. v2 uses anchor/accent tokens in content: a 56px rule under
each section heading, a wash behind the detail header, a spine on the selected
row, the active mobile tab.

**Cost:** more places to keep consistent. Mitigated by routing all of it through
`--anchor`, `--anchor-soft`, `--anchor-line`, `--accent`, `--accent-wash`.

## V6 — No side stripe on the attention band

A 4px oxblood bar down the band's edge was implemented, then removed after the
Impeccable detector flagged `[side-tab]` — "the most recognizable tell of
AI-generated UIs." It is right. The band anchors the page through elevation,
display-serif numerals, and the alert-toned urgent cell instead.

**Cost:** none. The band still reads as the anchor.

## V7 — Animate transforms, never layout

The nav indicator animated `height` and the progress meter animated `width`.
Both now animate `transform` (`scaleY` / `scaleX`). `meter()` emits
`transform:scaleX(n)` rather than `width:n%`.

**Cost:** the meter's inner span is full-width and scaled, so any future border
or inner content on it would scale too.

## V8 — Theme toggle is a product control, not preview chrome

v1 switched theme with two text buttons in the preview bar; the product shell
had no theme control at all. v2 adds an icon button to the workspace topbar and
the public bar: sun in light, moon in dark, 200 ms rotate-and-crossfade, local
persistence, system preference only as first-run default, accessible name
describing the action, truthful `aria-pressed`, reduced-motion respected, no
animation dependency.

The preview bar keeps its explicit Light/Dark pair — it is useful for
deterministic screenshots and for reviewers who want to force a state.

**Cost:** two controls for one setting inside the preview. They share state, and
only one of them is part of the product design.

## V9 — Theme changes transition colour only

`.theme-anim` scopes the transition to `background-color`, `border-color`,
`color`, and `box-shadow` for 280 ms, then removes itself. Layout never
animates, so nothing reflows and nothing flashes.

**Cost:** a class that must be added and removed around the change. Handled in
`setTheme()`.

## V10 — Asymmetric composition

Overview rails are 1.45 / 1 / 1.15 rather than three equal columns; the portal
lead action spans the full row as a horizontal card; the split pane is 1.32 /
0.68 rather than 1 / 0.72.

**Cost:** each asymmetric layout needs its own responsive collapse. Handled with
container queries at 1023px and 767px.

## V11 — Harnesses freeze motion before sampling

`verify.mjs` and `contrast.mjs` inject `transition: none; animation: none`
before measuring. Without it, a theme transition produced 535 phantom contrast
failures reporting foreground ≈ background at 1.01:1 — interpolated colours, not
a defect. Screenshots also became deterministic.

**Cost:** the harnesses no longer observe motion, so reduced-motion and the
theme animation are asserted separately in `theme-test.mjs`, with motion live.

## V12 — Fix the two-`class`-attribute bug in `queueTable`

A column with both `priority` and `numeric` emitted two `class` attributes; the
browser dropped the second, silently losing numeric alignment. Classes are now
built as a single list, and a `nowrap` column option was added so dates stop
wrapping to `2026-08-\n19`.

**Cost:** none. This was a latent v1 defect.

---

## Deferred

- Real data binding, sort/filter/pagination semantics.
- View Transitions API for cross-surface navigation (the CSS staged reveal is
  the current, progressively-safe approach).
- Print and PDF receipt styling.
- Internationalisation and text expansion beyond long-string hardening.
- Icon set expansion beyond the current sprite.
- Whether `reports` becomes a real surface.

## What should NOT be ported to production yet

1. **Nothing, without an accepted v0.8.0 specification.** The active v0.7.2 spec
   §3.3 explicitly defers this redesign.
2. The token layer must be reconciled with `src/styles/tokens.css` and
   `src/styles/visual/tokens-base.css` rather than dropped over them.
3. The five-tone status mapping needs validation against all 21 canonical
   statuses with the people who operate them.
4. The staged-reveal motion should be re-evaluated against real data volumes —
   it is tuned to preview-sized queues.
5. `--muted` must be recomputed against whatever ground production actually
   uses, not copied.
6. The preview's `--preview-bar-h` mechanism is preview-only; in production the
   shell owns the full viewport and it resolves to `0px`.
