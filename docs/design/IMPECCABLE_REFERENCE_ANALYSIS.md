# Impeccable Reference Analysis

**Reference:** `docs/design/references/HAU_USC_Logistics_v0.7.2_UI_Repair_Unified_Icons_Reference.html`
**SHA-256:** `44d2800695d0f9546911522eba1b240ff405b4dbbfc85493ac27ea90f7e0972c`
**Size:** 103,432 bytes · 2,898 lines
**Status:** preserved byte-for-byte; never edited by this task.
**Analysed:** 2026-08-07

Line references below point into the reference file.

---

## 1. Visual DNA inventory

### 1.1 Color

Two token families, both defined on `:root` (L11–L112) and fully re-declared for
`body[data-theme="dark"]` (L114–L174).

**Identity ramp** — oxblood `#610b0f`, burgundy `#78141a`, maroon `#8d1f28`,
crimson `#a62835`; antique `#b88632`, metallic `#d2ad62`, bright `#f2d15c`,
light gold `#efdda3`; cream `#f6ecda`, canvas `#f4efe6`, paper `#fffdf8`.

**Semantic ramp** — blue/green/amber/red/violet, each with `-bg` and most with
`-line` (L85–L99).

**Icon tokens** — `--icon-ink`, `--icon-ink-muted`, `--icon-surface`,
`--icon-surface-strong`, `--icon-border` (L103–L107), derived with `color-mix`.

The dark theme is a genuine re-tokenisation (oxblood lightens to `#8e3038`,
canvas drops to `#151012`, semantic hues invert to lighter foregrounds on
translucent tinted backgrounds), not a filter or an inversion. This is the
single most under-rated strength in the file.

### 1.2 Typography

- Body: `"Aptos", "Segoe UI Variable", "Segoe UI", "Candara", "Trebuchet MS"…`
- Display: `Georgia, "Times New Roman", serif`
- Scale: 10 / 11 / 13 / 16 / 18 / 28 / 34 px + `clamp(39px, 4vw, 58px)` display
- Body tracking `-0.01em`; label tracking `0.13em` uppercase
- `h1` uses the display serif at `line-height: 0.94`, `letter-spacing: -0.02em`,
  `text-wrap: balance`

No webfont dependency — everything falls back through system stacks. Correct
call for an institutional tool that must render offline and on managed devices.

### 1.3 Spacing, radius, motion

`--space-1…10` on a 4px base (4/8/12/16/20/24/28/32/40).
`--radius-sm 10px`, `--radius-md 14px`, `--radius-lg 20px`, `--radius-pill`.
`--dur-fast 140ms`, `--dur-normal 240ms`, `--ease-out cubic-bezier(.22,1,.36,1)`.

Motion durations and easing are already in the 140–240 ms ease-out band the
brief asks for. Keep the scale verbatim.

### 1.4 Macrostructure

`.app-shell` is `grid-template-columns: var(--sidebar-width) minmax(0,1fr)`
(L227). Sidebar is `position: sticky`, full-height, three-row grid
(brand / scroll / footer). Workspace holds a sticky `.topbar` (78px) and
`.main-content` capped at `max-width: 1600px`.

Content stack: `.title-row` → `.metric-grid` (6 columns) →
`.dashboard-grid` (1.5fr / .86fr / .72fr) → `.bottom-grid` (3 columns) →
`.footer-note`.

### 1.5 Icon language

One inline `<svg class="visually-hidden">` sprite of 24 `<symbol>` definitions
(L2469–L2494). Every glyph is `viewBox="0 0 24 24"`, `fill="none"`,
`stroke="currentColor"`, `stroke-width="1.8"` (a few at 1.4/2.0), with
`stroke-linecap`/`stroke-linejoin` set to `round` where relevant. Rendered at
18×18 via `.icon`.

L2017–L2021 is the file's thesis, and it is correct:

> all workspace SVG glyphs use the same brand ink. Status meaning remains in
> surrounding text and surfaces.

Containers are consistent: 38px `.metric-icon`, 34px round `.pulse-icon`, 30px
`.event-mark` / `.activity-icon`, 24px `.rank-number` — all sharing
`--icon-border` / `--icon-surface` / `--icon-ink`.

### 1.6 Responsive strategy

Breakpoints actually present: 1260, 1120(+981), 980, 760, 560.
- ≥981px: collapsible rail (`--sidebar-width: 88px`)
- ≤980px: fixed off-canvas drawer + scrim + fixed 4-item bottom nav
- ≤760px: single column, topbar reflow
- ≤560px: 2-col metrics, progressive column dropping

### 1.7 Component inventory

Sidebar brand block · nav item (icon + title + subtitle) · quick action ·
context console (collapsible, with workspace + operational-scope selects,
production badge, attention badge, owner row) · topbar icon button · search box
with `kbd` · notification button with count · account button + menu ·
title row + scope badge + control button (with `loading`/`success`/`error`
data-states) · context panel with breadcrumbs and select-likes · metric card ·
panel · event table · progress bar · pulse item · roadmap · activity list ·
inventory donut + legend · rank list · tiny tag · toast · mobile nav ·
`.status-dot` · `.visually-hidden`.

---

## 2. What is genuinely good — preserve

1. **The identity ramp.** Oxblood-on-cream with gold selection is specific,
   institutional and unmistakably HAU-USC. Nothing generic about it.
2. **The unified icon decision.** One brand ink for every glyph, with meaning
   carried by labels and surfaces, is exactly right for a system with 21
   statuses. Preserve the token structure verbatim.
3. **Real dark theme.** Full re-tokenisation including semantic hues.
4. **System-stack typography with a serif display accent.** Georgia against a
   humanist sans is warm and institutional; it reads as a university office, not
   a startup dashboard.
5. **`prefers-reduced-motion` block** (L2186–L2195) already blanket-disables
   animation and transition.
6. **Focus ring** — `3px solid var(--color-bright)`, `outline-offset: 3px`
   (L213). Visible, on-brand, high contrast.
7. **Sidebar collapse + mobile drawer + scrim + Escape-to-close** (L2740–L2782)
   and ⌘K search focus (L2889–L2894).
8. **`overflow-wrap: anywhere` and `min-width: 0`** applied consistently to grid
   children — the file has clearly already been hardened against long strings.
9. **`font-variant-numeric: tabular-nums`** on metric numbers and event cells.
10. **Motion scale** — 140/240 ms ease-out is already correct.

---

## 3. What is weak

### 3.1 Twelve equal-weight boxes (highest impact)

Six `.metric-card` + three `.dashboard-grid .panel` + three `.bottom-grid .panel`
all carry a border, a 14–20px radius and a large soft shadow
(`0 14px 40px` / `0 10px 28px`). Nothing dominates, so the eye has no entry
point. "Active Event Series 8" — not actionable — has identical weight to
"Overdue Loans 6", which is.

`--panel-accent` is assigned per-panel at L1103–L1108 and **never consumed by
any rule**. The hierarchy mechanism was started and abandoned.

### 3.2 Decorative framing competing with content

- `.workspace::after` (L880–L888): an inset 1px gold ring at `inset:14px 16px`,
  `opacity:.32`, framing nothing structural.
- `.workspace` background stacks two radial gradients over canvas (L870–L873).
- `.sidebar` stacks a radial over a 3-stop linear (L254–L256).
- `.sidebar::after` gradient hairline; `.brand::after` gradient hairline.

### 3.3 Semantic colour noise — and it contradicts the icon thesis

`.pulse-item.red / .amber / .blue / .violet` (L1691–L1709) renders four
differently-tinted surfaces stacked adjacently (L2639–L2642). The file
deliberately unified icon colour, then re-introduced the same rainbow one layer
out as tinted panel backgrounds.

`.tiny-tag` / `.tiny-tag.blue` / `.tiny-tag.red` in activity rows label
*Request / Loan / Receiving / Transfer* — these are **categories, not statuses**,
so colour here encodes nothing consistent.

### 3.4 Decorative chart with no operational purpose

`.donut` (L1924–L1947) is a CSS `conic-gradient` with the value string baked
into `::after { content: "1,248\A Total Items" }`. It cannot reflect data, it is
untranslatable, and CSS-generated text is inconsistently exposed to assistive
technology. Its own `aria-label` says "Illustrative".

### 3.5 Wrong altitude: the roadmap panel

"Roadmap to v1.0" (L2646–L2658) is project-delivery meta-content about building
the system, inside a workspace for running logistics. It consumes a full column
of the primary dashboard grid.

### 3.6 Mobile drops the wrong columns

At ≤560px `.event-row` hides children 2 and 3 (L2431–L2434) — **sub-events and
readiness**. Readiness is the most operationally important column in that table.
Likewise `.rank-row > strong` (L2452) hides the actual request count, leaving
rank + name only. Desktop is dense; mobile is decorative.

### 3.7 Non-semantic tables and unreachable rows

`.event-row`, `.activity-row`, `.rank-row` are `div` grids. `.event-row.header`
is a visual header with no `role`. Rows carry a `chevron-right` affordance
(L2629, L2631, L2632) but are **`div`s — not focusable and not keyboard
operable**. Only `.pulse-item` is a real `<button>`.

### 3.8 Collapsed rail destroys accessible names

L845–L849: `.app-shell[data-sidebar-state="collapsed"] .quick-action { font-size: 0 }`.
The label is the button's only accessible name; at `font-size: 0` the name is
still in the DOM but the pattern is fragile and there is no `aria-label`
fallback. Nav items in collapsed mode hide `.nav-copy` outright (L825).

### 3.9 Menu semantics

`.account-menu` is a `div` of buttons. The trigger sets `aria-expanded`, but
there is no `role="menu"`, no focus move into the menu, no focus trap, no focus
restoration, and Escape closes only the mobile drawer (L2778–L2782) — not the
account menu.

### 3.10 Invented statistics presented as real

"2 vs last month", "12%", "1,248 Total Items", "48 requests" appear without any
illustrative marking in the visible UI.

### 3.11 Dead CSS

`content: none` placeholders left behind at L232 (`.app-shell::before`), L876
(`.workspace::before`), L1073 (`.main-content::before`), L1088–L1096
(`.surface-panel/.panel ::before/::after`), L1233 (`.title-row::before`), L1402
(`.metric-card::before`). `.panel-header::after` carries both `content: none`
**and** `display: none` (L1532–L1542). `.surface-panel` is defined but never
used in markup. `#icon-cube` and `#icon-box` are byte-identical (L2475–L2476).

### 3.12 Weight inflation

`font-weight: 900` is applied to 11px and 10px text throughout (labels, tags,
nav, buttons, `.event-cell`). At those sizes 900 smears rather than emphasises,
and it removes weight as an available hierarchy signal.

---

## 4. Anti-pattern tells actually present

| Tell | Evidence |
|---|---|
| Glassmorphism | `backdrop-filter: blur(12px)` topbar L902; `blur(16px)` mobile nav L2303; `blur(5px)` active nav item L403 |
| Gradient overuse | sidebar L254–256; workspace L870–873; panel L1081; active nav L401; plus 3 gradient hairlines |
| Decorative continuous/shimmer motion | `authority-sweep` L2117, `title-sync` L2150, `panel-sync` L2166 — three gradient sweep animations fired on refresh |
| Decorative chart | `.donut` L1924 |
| Card wall | 12 equal-weight containers, §3.1 |
| Oversized radii | `--radius-lg: 20px` on full-width panels |
| Pill badge spread | `.status-tag`, `.attention-tag`, `.scope-badge`, `.tiny-tag`, `.trend`, `.sidebar-production`, `.sidebar-attention` all share the pill treatment (L1182–L1219) |

Not present, to the file's credit: purple/blue SaaS palette, gradient text,
glowing borders, emoji icons, mixed icon libraries, lorem ipsum.

---

## 5. Structural verdict — highest-leverage changes, ranked

1. **Break the twelve-box tie.** One dominant attention surface; everything else
   demoted to rules, rows and quiet groupings. Kill `--panel-accent` or actually
   use it.
2. **Replace the metric wall with a prioritised attention strip.** Actionable
   counts (Overdue, For Review, Ready to Release, Low Stock) lead; inert counts
   (Event Series, Sub-Events) become secondary context, not cards.
3. **Turn `div` grids into real tables with reachable rows.** Semantic
   `<table>`/row semantics, `<button>`- or link-driven rows, keyboard operable.
4. **Introduce the queue + detail-drawer pattern** as the default operational
   shape, replacing "panel of rows that link elsewhere".
5. **Retire the roadmap panel** from operational surfaces.
6. **Replace the donut** with a labelled composition bar driven by real markup,
   or drop it.
7. **Collapse semantic tinted surfaces** into one neutral row treatment plus a
   labelled status chip; keep colour for chips only, always paired with text.
8. **Fix mobile column priority** — readiness and quantity survive; decorative
   columns drop.
9. **Strip decorative framing** — the inset ring, the stacked radials, the three
   shimmer sweeps.
10. **Rationalise weight** — reserve 900 for numerals; labels drop to 600/700.
11. **Give menus and drawers real semantics** — focus move, trap, restore,
    Escape.
12. **Delete the dead CSS** and the duplicate icon symbol.

---

## 6. Preservation contract

Carried forward unchanged into the redesign: the identity ramp, the icon token
structure and single-ink rule, the 24×24 / 1.8-stroke monoline geometry, the
dark-theme re-tokenisation approach, the spacing/radius/motion scales, the
system-stack + Georgia typography pairing, the focus-ring treatment, the
reduced-motion block, sidebar collapse + mobile drawer + Escape, and ⌘K.

Explicitly treated as evidence rather than constraint: the dashboard grid
composition, the metric-card wall, the pulse tint set, the donut, the roadmap
panel, and the decorative framing layer.
