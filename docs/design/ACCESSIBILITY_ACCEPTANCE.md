# Accessibility acceptance — public portals R3

Target: **WCAG 2.2 AA**. Subject: `prototypes/public-portals-r3`.
Date: 2026-08-19 (Asia/Manila).

Contrast is **measured, not asserted**:

```bash
node scripts/design/contrast-audit.mjs
```

The script resolves every pair out of `tokens.css` and `glass.css` rather than a
hand-kept hex list, composites translucent layers before measuring, and exits
non-zero on any failure. **66/66 pass** across both themes.

## What the first run found

The first run failed **ten** pairs, all 1.4.11 Non-text Contrast. Text was never
the problem — all 42 text pairs passed in both themes on the first run. The
failures were the parts nobody looks at:

| Failure | Measured | Needed |
|---|---|---|
| **Focus indicator on the page ground** | **1.40:1** | 3:1 |
| Focus indicator on the working surface | 1.81:1 | 3:1 |
| Input boundary (light) | 1.57:1 | 3:1 |
| Input boundary (dark) | 1.37:1 | 3:1 |
| Quiet button boundary | 2.24:1 | 3:1 |
| Selected card boundary | 1.97:1 | 3:1 |

A focus ring at 1.40:1 is not a weak focus ring; it is an invisible one. Gold on
cream cannot carry that job, and no amount of brand argument changes the
measurement.

## What was changed

Three tokens, because the honest fix was not to darken the brand palette but to
say plainly that a *control boundary* has a different job from a *decorative
rule*:

| Token | Light | Dark | Job |
|---|---|---|---|
| `--border-control` | `#8f7d64` | `#8f767b` | any boundary that identifies a control — inputs, selects, quiet buttons, the suggestion list |
| `--selected-line` | `#7d5518` | `#c9a45f` | the selected state on cards, choices and panels |
| `--focus-ring-contrast` | `#40070a` | `#faf1de` | the inner ring of a two-tone focus indicator |

`--border-subtle` and `--border-default` stay exactly as they were, for
separators and hairlines that carry no state. That distinction is the point: a
decorative rule genuinely does not need 3:1, and forcing it there would have
coarsened the whole surface for no accessibility gain.

The focus indicator is now **two-tone** — a 3px contrast ring with a 6px gold
halo outside it. Gold keeps the brand, the inner ring guarantees the ratio, and
at least one of the two clears 3:1 against every surface in either theme. It
measures 12.80:1 to 17.39:1 depending on surface, against the 1.40:1 it replaced.

## Structural findings and fixes

| Item | Rule | Before | Now |
|---|---|---|---|
| Skip link | 2.4.1 Bypass Blocks | absent — every route change re-tabbed the prototype bar and masthead | present, targets `main#app`, reveals on `:focus` **and** `:focus-visible` |
| Main landmark | 1.3.1 | `<div id="app">` | `<main id="app" tabindex="-1">` |
| Hint association | 1.3.1, 3.3.2 | `.help` text sat beside controls, referenced by nothing — sighted users got it free, screen-reader users got nothing | every `.help` in a `.field` is wired to its control via `aria-describedby`, ids generated at render |
| Validity state | 3.3.1 | none | `aria-invalid` synced on input, but **only after the field is touched** — marking an untouched required field invalid on load is noise, not help |

## Measured in the browser

At 640px, which is 200% of the 320px floor:

| Check | Rule | Result |
|---|---|---|
| Horizontal overflow | 1.4.10 Reflow | none — `scrollWidth` equals `clientWidth` |
| Text spacing tolerance | 1.4.12 | none — line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, paragraph 2em injected, no overflow |
| Controls without an accessible name | 4.1.2 | **0 of 23** |
| Dangling `aria-describedby` | 1.3.1 | 0 |
| Heading order | 1.3.1 | one `h1`, no skipped levels |
| Live regions present at mount | 4.1.3 | both — `polite` and `assertive`, empty at mount so injected text is announced |
| Reduced-motion rule present | 2.3.3 | yes |

### Target size — 2.5.8

Measured naively, six targets fall under 24×24. Both groups pass on inspection,
and the distinction matters:

- **Radio inputs are 18×18**, but each is wrapped by its `.choice` label, so the
  effective target is **541×81**. Measuring the input rather than the label was
  a flaw in the check, not a defect in the design.
- **Four portal nav links are 20px tall.** They pass under the **spacing
  exception**: the minimum centre-to-centre distance is **102px**, far beyond
  the 24px circle the exception requires.

## What was NOT verified, and why

Stated plainly rather than folded into a pass:

- **Keyboard traversal order** was not walked. The Browser pane was not
  compositing frames, so real `Tab` presses did not move focus and screenshots
  were unavailable.
- **Focus appearance was verified by rule, not by pixel** — the authored
  declarations, the resolved token values, and the computed `top`/`outline` with
  the transition disabled. Not a rendered image.
- **No screen-reader pass** was run. `aria-describedby` wiring and live regions
  are verified structurally, not by listening to them.

### One measurement artifact worth remembering

The skip link first measured as *not revealing on focus* — computed `top` stayed
at `-60px` while the element genuinely matched `:focus`. The cause was the
non-compositing pane: with no animation frames, the CSS transition never
advanced, so the computed value stayed pinned at its start. Disabling the
transition returned `12px` immediately.

This is the same class of error as verifying a 10px label on a 2× downscaled
screenshot: the tool's limitation read as a defect in the work. **Check whether
the environment can express the thing you are measuring before believing the
measurement.**

## Open

`RA-A11Y-AT` in the tracker: keyboard traversal, focus-not-obscured (2.4.11),
and a screen-reader pass on both portals, in an environment that renders.
