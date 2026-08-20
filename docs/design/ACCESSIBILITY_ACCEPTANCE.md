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

- **Keyboard traversal order** was not walked with real keys. It is instead
  computed from the DOM and verified geometrically — see the focus-order section
  below, which supersedes this line for 2.4.3 and 2.4.11.
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

`RA-A11Y-AT` in the tracker: a real keyboard walk and a screen-reader pass on
both portals. Focus order and focus-not-obscured are covered below.


## Responsive matrix — measured at all eight widths

`prototypes/public-portals-r3`, lending route, measured in a live browser.
**Zero horizontal document overflow at every width.**

| Width | Catalog | Filters | Two-column | Sticky bar | Portal nav |
|---|---|---|---|---|---|
| 320 | 1 col | scrollable chip row | single | shown | chip row |
| 375 | 1 col | chip row | single | shown | chip row |
| 390 | 1 col | chip row | single | shown | chip row |
| 414 | 1 col | chip row | single | shown | chip row |
| 768 | 2 col | grid | single | hidden | inline |
| 1024 | 2 col | grid | 537 + 400 | hidden | inline |
| 1440 | 3 col | grid | 768 + 400 | hidden | inline |
| 1920 | 3 col | grid | 768 + 400, shell capped at 1240 | hidden | inline |

Each regime is a transformation, not a stack: the filters change from a grid to
a horizontally scrollable chip row, the sidebar joins the main column at 1024,
and the action bar becomes sticky only where the form is one column.

### Two defects found, both fixed

**Portal navigation vanished below 768.** The rule was `display: none` with no
replacement, so a phone user was stranded inside whichever portal they landed on
— no route to Request Center, Staff sign in, or portal selection, which are
three of production's four destinations. Hiding is not a responsive strategy.
It is now a scrollable chip row using the same idiom as the filters, with 36px
targets, and all four destinations are reachable at 320.

**SC 2.4.11 Focus Not Obscured (Minimum).** The 80px sticky action bar is fixed
over the content, and `scrollIntoView` stops as soon as a target is technically
inside the viewport — so **14 focusable controls landed underneath the bar** at
390px: the search field, all four filters, five category chips, both borrower
radios, and the whole tracking form. A keyboard user would have been typing into
something they could not see.

Fixed with `scroll-margin-bottom` on every focusable descendant of `#app`,
reserving the bar's height plus a gap. Re-measured: **0 obscured**.

## Focus order — 2.4.3

Computed from the DOM in sequential focus order rather than by walking keys:

- **22 tabbable targets**, no positive `tabindex` anywhere;
- the **skip link is first**;
- **no backward jumps** — focus never moves up the page by more than a row;
- no zero-height targets in the ring.

### Why it was computed rather than walked

Synthetic key events dispatched by the browser tooling **do not drive native
sequential focus navigation** — 30 `Tab` presses produced zero `focusin` events
with a listener armed. This is the same limitation class as the synthetic
clipboard event that silently failed during the Figma Make paste: the event
reaches the page, but the browser's own behaviour behind it does not run.

So the tab ring is verified structurally and the obscuring check is verified
geometrically, by scrolling each target into view exactly as the browser would.
A real keyboard walk and a screen-reader pass remain outstanding, and
`RA-A11Y-AT` stays open for them.

## Real keyboard acceptance — Playwright

```bash
npm run design:keyboard
```

The earlier sections said keyboard traversal could not be walked because
synthetic key events do not move native focus. That was true of the
browser-extension path and remains true — 30 `Tab` presses produced zero
`focusin` events in both the in-app browser and real Chrome. It was **not** true
of the environment: Playwright is available and presses real keys.

**32/32 pass**, across lending and request, at desktop 1280 and mobile 390:

| Check | Rule | Result |
|---|---|---|
| Real keyboard moves focus | — | 24–25 stops per route |
| Skip link is the first stop | 2.4.1 | yes on every route and width |
| Every stop paints an indicator | 2.4.7 | no bare stops |
| No zero-size stop in the ring | 2.4.3 | none |
| Nothing lands under the sticky bar | **2.4.11** | none — the earlier fix holds under real traversal |
| Shift+Tab retraces the forward order | 2.4.3 | 7 reverse stops match |
| No keyboard trap | 2.1.2 | traversal always advances |
| Escape with nothing open keeps focus | 2.1.1 | focus preserved |

### A false positive the check produced, and the correction

The first run failed 2.4.11 on mobile lending, reporting the **Review** button
as obscured by the sticky bar. Review *is* the sticky bar's own button, so it
overlapped itself. The check now excludes the bar's descendants. A geometric
test that does not know what contains what will invent defects.

## Semantic acceptance — accessibility tree

```bash
npm run design:semantics
```

**30/30 pass.** Read from the **real accessibility tree** via CDP
(`Accessibility.getFullAXTree`) — the tree the browser hands to assistive
technology — not from a DOM approximation. Playwright's `page.accessibility`
was removed in this version; the CDP route is the accurate replacement.

| Check | Result |
|---|---|
| Landmarks exposed | `main`, `navigation`, `region`, `form`, `complementary` |
| Exactly one `h1`, no skipped level | Lending Center · Request Center |
| Headings reach the tree | 8 and 3 respectively |
| Every control has an accessible name | all named |
| No dangling `aria-describedby` | none |
| Required state is programmatic | 11/11 on lending |
| Nothing marked invalid before it is touched | 0 |
| Polite **and** assertive regions present | both |
| Live-region text reaches the tree | probe text observed in the AX tree |
| Tables scope their headers | no table on these routes |
| Hidden conditional groups actually hidden | 4 hidden, 0 leaking |
| Hidden conditional controls disabled | **0 focusable** — see below |
| Tracking-code control masked and named | 1 masked field |

### The defect this pass found

Eleven controls inside the hidden borrower-details block were **invisible but
still enabled**: name, student ID, contact, email, borrowing-until, purpose and
all five acknowledgments. `syncBorrower` disabled the academic and council
sub-groups but not the block that contains them.

Production is explicit that the inactive branch is disabled *and* cleared "so
the inactive branch cannot submit stale data". The prototype now disables every
control in the block whenever no borrower type is chosen, and re-enables on
selection — verified by driving the radio and re-counting.

This is exactly the class of defect a visual review cannot find. The control was
not on screen; it was in the tab ring and in the form payload.

### What this is not

It is **accessibility-tree evidence, not a screen-reader runtime test**. No
speaking screen reader was run. Announcement *order*, verbosity, and how a real
NVDA or VoiceOver user experiences the live regions remain unverified, and the
script prints that caveat on every run rather than letting the pass rate imply
more than it earned.

---

# Re-verification after the theme refinement — 2026-08-20

The whole colour system was regenerated from a single source in this pass, which
invalidates every measured contrast number by construction. All four gates were
re-run against the rebuilt system rather than assumed to survive it.

| Gate | Command | Result |
|---|---|---|
| Token contrast, both themes | `npm run design:contrast` | **66/66** |
| Real keyboard traversal | `npm run design:keyboard` | **32/32** across 2 routes x 2 widths |
| Accessibility tree | `npm run design:semantics` | **30/30** |
| Responsive matrix, 8 widths | `npm run design:responsive` | **80/80** width x theme x surface |

One pair failed on the first rebuild and was fixed rather than waived: light
`--text-muted` measured 4.15:1 on `--inset`. Muted copy has to clear 4.5:1 on the
inset plane, not only on the work plane, and inset is the hardest of the three.
The token is now solved against inset and measures 5.1:1 on work.

## A defect the theme pass surfaced

The public-portal views injected a second `<main class="shell">` inside the
`<main id="app">` mount point, so **every route exposed two `main` landmarks**.
It was found while auditing something else entirely: a measurement clipped to
"the main region" kept selecting the outer element and returning the wrong
geometry. The inner element is now a `div`; `#app` is the only landmark and is
what the skip link targets. `design:semantics` confirms a single `main`.

## Target size — 2.5.8, re-measured

Four standalone controls sat under the WCAG 2.2 AA minimum and were corrected:

| Control | Was | Now |
|---|---|---|
| Acknowledgment checkboxes | 18x18 | 24x24 control inside a larger clickable label |
| Borrower-classification radios | 18x18 | 24x24, same treatment |
| Skip link | 166x43 | `min-height: var(--touch-min)` — 44 |
| Mobile portal-nav chips | 36 tall | `min-height: var(--touch-min)` — 44 |

24x24 is the 2.5.8 AA floor; 44x44 is this project's practical goal and is met
wherever the control is standalone. The three remaining sub-44 controls at 390
are the **prototype fixture bar's** own selects, which are not product surface.

## Two more measurement artifacts worth remembering

This file already records one. Three more were produced during this pass, and
each would have caused a regression if trusted:

1. **"104 overflowing elements" at every narrow width.** All of them were the
   closed mobile navigation drawer, parked off-canvas at `left: -326px`. The
   document's `scrollWidth` equalled its `clientWidth` — there was no horizontal
   scroll at all. Off-canvas is a technique, not a defect. Overflow is now
   measured as `scrollWidth` exceeding `clientWidth`.
2. **"Hidden but focusable" controls.** The test checked `tabIndex >= 0` plus the
   element's *own* computed style. A button inside a `display: none` container
   reports `display: inline-block` on itself and `tabIndex 0` while the browser
   has already removed it from the tab order. `checkVisibility()` asks the engine
   the same question the engine asks when building the tab ring, and the count
   goes to zero — which is what the real-keypress keyboard audit had been saying
   all along.
3. **A content region reporting 100% glare.** Excluding pinned chrome from the
   reading plane chained until the region collapsed onto a single bright band.
   Restricting the exclusion to `position: fixed` elements actually pinned to a
   viewport edge fixed it.

The pattern is the same each time: a proxy was measured instead of the thing.
When an instrument and a real-input test disagree, the real-input test is right.
