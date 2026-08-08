# Impeccable Redesign Decisions

Decision log for the Institutional Operations Editorial direction. Each entry
records what was decided, why, and what it costs.

---

## D1 — Treat this as the proposed v0.8.0 baseline, not a v0.7.2 change

`.codex/specs/v0.7.2-production-access-operations.md` §3.3 explicitly defers
"the v0.8.0 design-system and role-workspace redesign". The preview therefore
sits on its own branch and touches no production source.

**Cost:** production integration is a separate, later, specified piece of work.

## D2 — Isolate via a git worktree rather than switching branches

The authoritative checkout sits on `release/v0.7.2-production-access-operations`
with a clean tree. Switching it would violate the standing instruction to
preserve work in place. A worktree creates the authorized
`design/impeccable-whole-site-preview` branch while the release checkout stays
exactly where it was.

**Cost:** the preview worktree has no `node_modules`; tooling takes an explicit
path to an existing Playwright install.

## D3 — Standalone modular preview, not the Vite app

Owner decision. Keeps the preview fully isolated from `vite.config.js`,
`package.json`, and the production build graph, and matches the repository's
vanilla-ES-module idiom.

**Cost:** ES modules cannot load over `file://`, so a generated single-file
export exists alongside the modular source. `tools/export.mjs` inlines the nine
modules and six stylesheets into one classic script.

## D4 — Replace the six-card metric wall with a four-item attention band

The reference gave "Active Event Series" the same visual weight as "Overdue
Loans". Only four figures in the product are genuinely actionable: overdue
loans, requests for review, ready to release, and low or out of stock. Those
become one bounded band; the inert counts drop to a single context line.

**Cost:** event-series and sub-event counts lose prominence. They remain
available, one line below.

## D5 — Semantic tables with focusable rows, replacing `div` grids

Reference rows carried a chevron affordance but were `div`s: not focusable, not
keyboard-operable, no row or column semantics. Queues are now real `<table>`
elements with `<caption>`, `<th scope>`, and a `<button>` in the row header.

**Cost:** slightly more markup per row.

## D6 — Queue + split-pane detail as the default operational shape

Replaces "panel of rows that navigates elsewhere". At ≥1181px the detail sits
beside the queue; 768–1180px it becomes a drawer; below that a full-screen push.
Queue position is never lost.

**Cost:** the detail pane needs `min-width: 0` and its own scroll region; a
naive implementation pushes past the viewport.

## D7 — Five status tones, mapped from twenty-one canonical statuses

`src/domain/constants.js` defines 21 statuses. Giving each a colour reproduces
exactly the noise the reference's icon unification removed. They collapse to
`neutral · info · progress · done · alert`, and every chip carries its label
text. `alert` additionally carries an icon, so the most consequential tone is
not colour-dependent at all.

**Cost:** two statuses in the same tone are distinguished by text alone. That is
the intended trade.

## D8 — Retire the donut, the roadmap panel, and the decorative framing

The donut baked its value into CSS `content` and admitted it was illustrative;
it becomes a labelled composition bar in real markup. "Roadmap to v1.0" is
project-delivery meta-content and leaves operational surfaces entirely. The
inset gold ring, stacked radial gradients, and three shimmer sweep animations
are removed.

**Cost:** the first viewport is quieter. That is the point.

## D9 — Preserve the icon system verbatim

Geometry (`24×24`, `stroke-width: 1.8`, round caps/joins), the token structure,
and the single-brand-ink rule carry over unchanged. This was the entire subject
of the v0.7.2 reference and it was already correct. The duplicate
`icon-box` / `icon-cube` symbol pair is collapsed to one.

**Cost:** none.

## D10 — Elevation reduced to two levels; 20px radius retired

Every reference panel carried a large ambient shadow, which is why nothing stood
out. Panels are now flat with a hairline; elevation is reserved for genuinely
floating layers. `--radius-lg: 20px` read as consumer-soft on full-width panels
and is gone.

**Cost:** a flatter surface that depends on alignment and rhythm rather than
shadow. Less immediately "designed", more legible under load.

## D11 — Weight 900 reserved for numerals

The reference applied `font-weight: 900` to 10px and 11px labels, where it
smears and removes weight as an available signal. Labels drop to 600/700.

**Cost:** slightly lower label emphasis; hierarchy now comes from size, colour,
and position.

## D12 — Narrow layouts reorder; they never delete operational data

The reference hid readiness and request counts at ≤560px — the most useful
columns. Column priority is now explicit: `col-p3` (reference ids, secondary
metadata) drops first at 767px, `col-p2` at 560px. Status and quantity always
survive.

**Cost:** two columns of metadata are unavailable on a phone without opening the
detail pane.

## D13 — Darken `--muted` from `#7c696d` to `#786369`

The reference value measures 4.47:1 on paper — marginally under the 4.5:1 AA
floor for normal text. Verified across every surface in both themes.

**Cost:** hint and metadata text is fractionally heavier.

## D14 — Re-tone plaques and links for dark mode

`background: var(--paper); color: var(--ox-800)` is correct in light and becomes
dark-on-dark once both tokens flip. Brand marks and avatars invert to a
translucent plaque with gold text; links re-tone from oxblood to gold. Measured
at 2.17:1 and 2.67:1 before the fix.

**Cost:** two extra theme-scoped rules.

## D15 — Container queries, not media queries, for the shell

Layout responds to `.frame` inline-size. The preview's width switcher therefore
reflows the genuine layout rather than faking it, and real browser resizing
behaves identically. As a bonus, `container-type: inline-size` makes `.frame`
the containing block for fixed-position descendants, so the mobile drawer, tab
bar, and sticky action bar stay inside the simulated device.

**Cost:** the shell assumes a container ancestor. In production integration the
container is the app root and `--preview-bar-h` resolves to `0px`.

---

## Deferred — not decided here

- Real data binding, pagination behaviour, and sort/filter semantics.
- Print and PDF receipt styling.
- Internationalisation and text expansion beyond long-string hardening.
- Motion for route transitions.
- Icon set expansion beyond the reference's 24 symbols (plus 9 added for
  surfaces the reference did not cover).
- Whether `reports` (a feature directory with no module or view) becomes a real
  surface.

## Production-integration prerequisites

1. An accepted v0.8.0 specification. This preview is not an amendment.
2. Token reconciliation with `src/styles/tokens.css` and
   `src/styles/visual/tokens-base.css`.
3. Mapping the preview primitives onto the existing components in
   `src/components/` rather than replacing them wholesale.
4. Confirming the five-tone status mapping against every one of the 21 statuses
   with the people who use them.
5. Re-running the repository's own accessibility acceptance at 390, 820, and
   1366 px plus 200% zoom.
6. A decision on the `reports` module.
