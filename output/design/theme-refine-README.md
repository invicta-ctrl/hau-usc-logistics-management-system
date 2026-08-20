# Theme refinement evidence — 2026-08-20

Before-and-after for the pass recorded in `DESIGN.md` **D41** and
`docs/design/HALLMARK_IMPECCABLE_CLOSURE.md` (second bounded pass).

| Path | What it is |
|---|---|
| `theme-refine-before/` | 80 captures of the design surfaces **before** the pass: 10 surfaces x 2 themes x 4 widths |
| `theme-refine-before.json` | The measured comfort metrics for those captures, with the bar they were judged against |
| `theme-refine-after/` | The same captures after, plus the command overlay — 11 surfaces, 88 captures. The overlay plane was missing from every previous matrix because an overlay does not exist until something opens it |
| `theme-refine-after.json` · `.txt` | Measured metrics and the printed report |
| `theme-refine-contrast.txt` | `design:contrast` — 66/66 token pairs, both themes |
| `theme-refine-overlay.txt` | `design:overlay` — text over photography, gradients and glass, measured against the actual backdrop pixels |
| `theme-refine-responsive.txt` | `design:responsive` — 8 widths x 2 themes x 5 surfaces, overflow and paint cost |
| `figma-after/` | Two Figma frames rendered after the variable sync, measured on the same L\* scale as the code |

## The headline numbers

|  | Before | After |
|---|---|---|
| Captures inside the comfort bar | **0 / 80** | **88 / 88** (5 by two named waivers) |
| Worst dark-mode crush (share of viewport at CIE L\* <= 5) | **94.8%** | **0–18%**, and only on the campus photograph |
| Worst light-mode pure white (share at L\* >= 98) | **53.9%** | **0.63%** |
| Dark ground | L\* **1.8** — effectively `#000` | L\* **8.6** |
| Light work plane | L\* **99.2** — effectively `#FFF` | L\* **95.4** |

The "before" set is worth keeping precisely because 0/80 is an uncomfortable
number to have recorded. It is also the reason the comfort gate exists: every
one of those 80 captures passed WCAG contrast at the time.

## Reproducing

```bash
npm run design:serve          # in one shell
npm run design:comfort -- --shots output/design/theme-refine-after
```

The intermediate capture set taken mid-pass was deleted rather than committed —
it showed a half-applied state that is not useful to anyone.
