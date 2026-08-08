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

## Color

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
