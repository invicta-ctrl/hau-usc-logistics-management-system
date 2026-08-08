# Design

<!-- impeccable:design-schema 1 -->

Design system for the **Institutional Operations Editorial** direction — the
proposed v0.8.0 baseline for the HAU-USC Logistics Management System.

Implemented by `prototypes/impeccable-whole-site-redesign/`. Derived from
`docs/design/references/HAU_USC_Logistics_v0.7.2_UI_Repair_Unified_Icons_Reference.html`
(preserved unchanged) per `docs/design/IMPECCABLE_REFERENCE_ANALYSIS.md`.

## Visual world

A university office of record. Warm paper ground, oxblood authority, gold used
only for selection and focus. Editorial serif for page titles; everything else
in a humanist system stack. Containers are earned, not default — most structure
is carried by hairline rules and alignment.

The product is a custody ledger with manners. Nothing decorative may compete
with an operational fact.

> **v2 supersedes parts of this record.** The current direction is *Kinetic
> Institutional Operations*, implemented by
> `prototypes/impeccable-whole-site-redesign-v2/` and documented in
> `docs/design/IMPECCABLE_V2_DESIGN_DIRECTION.md`,
> `docs/design/IMPECCABLE_V2_MOTION_SYSTEM.md`, and
> `docs/design/IMPECCABLE_V2_DECISIONS.md`.
>
> Superseded v1 rules, explicitly:
> - "Two elevation levels only; panels flat" → **three-step elevation ladder**;
>   panels, queues, and detail panes are raised working surfaces.
> - "`--radius-lg: 20px` retired; 8/12px only" → **radius variety restored**
>   (6 / 10 / 14 / 18 px). 20px stays retired on full-width panels.
> - "Section headings 17px" → **20px in the display serif**, with a 56px oxblood
>   rule.
> - "Attention values 32px" → **44px in the display serif**.
> - "`--muted: #786369`" → **`#6f5a60`**, recomputed against v2's darker ground.
> - "One acknowledgement animation total" → **a documented motion system**; the
>   continuous-animation budget (at most one per viewport) still holds.
> - Theme switching moved from preview chrome into the product shell as an
>   animated sun/moon control.
>
> Everything below that is not listed above remains in force in v2.

## Colors

Identity ramp preserved verbatim from the reference.

```css
--ox-900:#4b080b; --ox-800:#610b0f; --ox-700:#78141a;
--ox-600:#8d1f28; --ox-500:#a62835;
--gold-700:#8a5f1d; --gold-600:#b88632; --gold-500:#d2ad62;
--gold-400:#f2d15c; --gold-300:#efdda3;
--cream:#f6ecda; --canvas:#f4efe6; --paper:#fffdf8;
--ink:#291b1d; --ink-2:#59464a; --muted:#7c696d;
--line:#ddd2c1; --line-strong:#c6b7a0;
```

Dark theme re-tokenises rather than inverts: `--canvas:#151012`,
`--paper:#21181a`, `--ox-800:#8e3038`, `--ink:#f5eee7`, `--line:#49393d`.

**Status tones — exactly five.** The 21 canonical statuses in
`src/domain/constants.js` map onto these; a chip always carries its label text.

| Tone | Meaning | Statuses |
|---|---|---|
| `neutral` | recorded, no action | `ARCHIVED` `CLEARED` `RETURNED` `RESTOCKED` |
| `info` | awaiting a person | `FOR_REVIEW` `FOR_CANVASSING` `WAITING_FOR_BUDGET` `TO_BE_PROCURED` |
| `progress` | in motion, incomplete | `ACCEPTED` `PROCURED` `PARTIALLY_RECEIVED` `PARTIALLY_RELEASED` `PARTIALLY_FULFILLED` `READY_TO_RELEASE` `READY_TO_CLAIM` `ON_LOAN` `ACTIVE` |
| `done` | terminal success | `COMPLETED` |
| `alert` | terminal negative or breach | `OVERDUE` `REJECTED` `CANCELLED` |

Color is never the only signal: tone sets border and text; the label carries
meaning; `alert` additionally carries an icon.

## Typography

- Display: `Georgia, "Times New Roman", serif` — page titles only.
- Body: `"Aptos","Segoe UI Variable","Segoe UI","Candara","Trebuchet MS",ui-sans-serif,system-ui,sans-serif`
- Scale: `10 · 11 · 13 · 15 · 17 · 26 · 32 px`, display `clamp(30px,3.2vw,44px)`
- Weights: 400 body · 600 label · 700 emphasis · **900 numerals only**
- Body tracking `-0.01em`; uppercase labels `0.1em`
- Numerals always `font-variant-numeric: tabular-nums`

No webfont. Legible at 200% zoom and 320px.

## Space, radius, elevation

- Space: 4px base — `4 8 12 16 20 24 32 40`
- Radius: `8px` controls, `12px` containers, `999px` chips. **No 20px.**
- Elevation: two levels only.
  - `flat` — 1px `--line` hairline, no shadow. Default for all panels.
  - `raised` — `0 16px 40px rgba(45,24,27,.18)`. Drawer, dialog, menu, toast
    only.

## Motion

`--dur-state:140ms` · `--dur-move:240ms` · `--ease:cubic-bezier(.22,1,.36,1)`.
Ease-out only. One acknowledgement animation in the system. No shimmer sweeps,
no bounce, no continuous motion. `prefers-reduced-motion: reduce` disables all
animation and transition.

## Icons

The reference sprite, geometry unchanged: `viewBox="0 0 24 24"`, `fill="none"`,
`stroke="currentColor"`, `stroke-width="1.8"`, round caps and joins, rendered at
18×18.

**One brand ink.** `--icon-ink` in both themes. Status meaning lives in labels
and chips, never in glyph colour. Icon containers share
`--icon-surface` / `--icon-border`. No emoji, no second icon library.

## Components

Application shell · rail nav item · command palette · page header · scope
control · **status chip** · attention band · **queue table** (semantic
`<table>`, focusable rows) · **split-pane detail** · **drawer** · form field ·
stepper · **timeline** · quantity display · evidence attachment · empty state ·
error / unavailable state · toast · confirmation dialog · receipt panel ·
mobile sticky action bar.

Container rule: a `<table>` for homogeneous records; a card only for genuinely
heterogeneous summaries. Panels carry a hairline, never a shadow.

## Layout

- Shell: fixed rail (`264px`, collapsible to `76px`) + workspace.
- Content max width `1520px`.
- Overview: attention band → one dominant queue → quiet supporting rails.
- Operational: queue table + split-pane detail (≥1024px), drawer (768–1023px),
  full-screen push (<768px).
- Forms: single column ≤ 640px, grouped fields, review step, explicit receipt.
- One primary action per surface; secondaries stay visible but quiet.

## Accessibility contract

Semantic landmarks and headings · every control labelled · full keyboard
operation · visible `3px` gold focus ring at `3px` offset · no keyboard trap ·
drawer and dialog move focus in, trap, restore on close, close on Escape · no
color-only status · ≥44px touch targets · 200% zoom · `prefers-reduced-motion` ·
no horizontal overflow at 320px · tables adapt by column priority, not by
deletion of operational data · form errors tied to fields via
`aria-describedby` · live regions for state changes.

## Content rules

Plain institutional English. Every enum passes through the vocabulary of
`src/domain/presentation-labels.js` before display. No provider names as
user-facing concepts. Missing data reads "Not recorded" / "Not assessed".
Failure copy states what saved, what did not, and the next safe action.

All figures in the preview are illustrative and labelled as such.

## Accepted v3 system — Calm Institutional Operations

v3 is the accepted **modern-minimal Workbench** expression: a calm institutional
operations desk with decisive hierarchy, generous work surfaces, crisp rules,
and one clear next action. It preserves the product contracts above—including
semantic operational data, truthful status and control states, keyboard access,
and oxblood/gold identity—while superseding v2's visual treatment where the v3
records and implementation are explicit.

- **Surfaces:** light mode steps from warm-neutral canvas → near-white working
  paper → inset-control/table-head paper → white overlay. Dark mode is authored
  independently as warm near-black canvas → charcoal paper → raised
  charcoal-brown → oxblood anchors; it is never a simple inversion.
- **Type and color:** all typography is offline-only: Bahnschrift/Aptos Display
  for page titles, Aptos/Segoe UI for body copy, and Palatino/Book Antiqua only
  for the wordmark. Oxblood carries structure and authority; muted gold is
  reserved for focus, selection, route progress, status emphasis, and small
  brand details—not broad decorative fields.
- **Signatures:** the labelled menu collapses to an icon-only control and its
  three lines become a close mark; public flows use the gold-arrow **Return to
  Portals** treatment; the theme track translates its thumb while sun/moon
  glyphs crossfade, with truthful `aria-expanded`, `aria-controls`, and
  `aria-pressed` state.
- **Loading and controls:** loading reads **Preparing this workspace**, pairs a
  three-bar logistics mark with a directional progress rule, preserves table
  geometry, and exposes `aria-busy` plus polite live text—no generic spinner.
  Base controls are at least 44px high, keep visible focus, and retain
  default, hover, active, disabled, loading, and reduced-motion behavior.
- **Responsive and motion:** verify at 320, 375, 414, 768, 1024, and 1440 CSS
  pixels. Navigation and nonessential brand detail yield before work content;
  quantity, status, and primary actions remain visible. Motion explains state,
  uses non-bouncy 120–440ms transform/opacity transitions, and becomes static or
  effectively instantaneous under `prefers-reduced-motion` without removing
  meaning.

Authoritative v3 source: `prototypes/impeccable-whole-site-redesign-v3/`
(including `styles/v3.css`). Review artifact:
`output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v3.html`.
Supporting records: `docs/design/IMPECCABLE_V3_VISUAL_SYSTEM.md`,
`docs/design/IMPECCABLE_V3_DYNAMIC_CONTROLS.md`, and
`docs/design/IMPECCABLE_V3_MOTION_AND_LOADING.md`.
