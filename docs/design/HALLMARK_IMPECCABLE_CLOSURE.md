# Hallmark and Impeccable — bounded closure passes

**Date:** 2026-08-20 (Asia/Manila)
**Scope:** the final current-authority public surfaces — `prototypes/public-portals-r3/`
at 1440 and 390, light and dark, populated and empty, both routes.
**Not in scope:** any new visual direction. Neither pass was allowed to reopen
accepted functional architecture, and neither produced a V6.

Both passes were previously reported as *not run*. They have now been run, once,
against the finished design rather than against an intention. This file records
what was actually looked at, what was found, and what was deliberately left
alone. A pass that finds nothing is suspicious; a pass that rewrites everything
is a redesign in disguise.

## Method

Eight full renders captured with Playwright and inspected:
`{lending, request} × {1440, 390} × {light, dark}`, plus the populated lending
catalog and the system-preference resolution cases. Measured acceptance ran
alongside — `design:contrast`, `design:keyboard`, `design:semantics` — so
subjective judgement never had to stand in for something countable.

---

## Hallmark — anti-slop audit

| Signal | Verdict |
|---|---|
| AI-looking composition | **Clear.** The masthead is specific to this institution, not a generic app bar. Metadata sits in monospace at small size, which reads as a ledger rather than a marketing page |
| Generic SaaS card wall | **Clear, with one observation below** |
| Repetitive container patterns | **Clear.** Containers differ by role: the notice band, the catalog panel, the intake card and the right rail each have distinct treatment |
| Meaningless glass | **Clear.** Glass appears on the ground layer and on panels that earn depth. No dense table sits on a transmissive pane, and no pane sits on another |
| Excessive rounding | **Accepted.** Radius is large and uniform. It is a deliberate, documented token, applied consistently, and it does not fight the institutional tone once the oxblood masthead and monospace metadata are in place |
| Excessive pills | **Clear.** Pills are used only where they carry data — availability, item counts, borrower classification. None is decorative |
| Generic microcopy | **Clear.** "No item is reserved until authorized staff approve it", "Displayed availability is a current review signal, not a reservation or approval", "Submitting does not reserve anything and deducts no stock" — this copy is load-bearing and true to the contract, not filler |
| Weak visual hierarchy | **Clear.** One display heading, one primary action per view, a single gold accent that marks the current step |
| Fake premium effects | **Clear.** No gradient meshes, no glow for its own sake, no animation that outlives its purpose |
| Inconsistent structure | **Clear** across both routes and both themes |

### Observations recorded and deliberately not changed

**Ragged bottom edge in the two-column lending layout.** With the intake form in
its empty state, the left column ends roughly 400px above the right rail. This is
content-driven: the rail carries two independent cards while the form has not yet
been filled. Once a borrower selects items and enters details the left column
grows past the rail. Forcing the columns to match would mean padding one of them
with nothing, which is exactly the move Hallmark exists to prevent.

**Three concentric rounded containers in the catalog empty state** — page card,
catalog section, guidance panel. Each level carries different content and a
different job, so this is hierarchy rather than a card wall. Recorded because the
same shape one level deeper would become one.

**Hallmark: PASS.** One material finding, fixed — recorded under the Impeccable
pass below because it is a hardening defect rather than a composition one.

---

## Impeccable — critique and polish

| Dimension | Result |
|---|---|
| Hierarchy | One display heading per view, one primary action, step position marked by the single gold accent |
| Clarity | Every consequential statement is stated rather than implied. The no-login model, the "nothing is reserved yet" rule and the one-time tracking code are all explicit |
| Layout | Eight required widths, zero horizontal overflow |
| Typography | Display, body and monospace roles are distinct and consistently applied |
| Responsive quality | 390 is a real transformation — filter chips replace the filter row, cards replace the table, the selection bar becomes sticky |
| Edge states | Loading, empty, filtered-empty, service error and unavailable are distinguishable from one another. "Not requestable" renders as a disabled control with its reason, rather than a missing button |
| Accessibility | 66/66 contrast pairs, 32/32 real keyboard checks, 30/30 accessibility-tree checks |
| Operational scanability | Availability, restrictions, handling and eligibility are surfaced on the card itself, so a borrower does not have to open an item to learn they cannot have it |

### Material finding — fixed

**The dark palette was unreachable from a system preference.** The entire palette
lives behind `[data-theme]`, and `data-theme` was only ever set from an explicit
URL parameter defaulting to `light`. A visitor whose operating system is set to
dark received the light theme regardless. Nothing in the stylesheet read
`prefers-color-scheme`, so the dark work was real but effectively unreachable
outside the prototype's own control.

Fixed in `prototypes/public-portals-r3/app.js` by resolving the theme from
`matchMedia('(prefers-color-scheme: dark)')` when the URL pins nothing, while an
explicit `?theme=` still wins so the fixture stays deterministic for screenshots
and tests.

Verified: system-dark with no parameter resolves to `dark`; system-dark with
`?theme=light` resolves to `light`. All three acceptance suites still pass after
the change.

**Impeccable: PASS**, one material finding found and fixed.

---

## What neither pass touched

- The accepted functional architecture of either route.
- The canonical gold decision, which is owner-locked.
- The Institutional Glass ladder and its no-glass zones.
- Any production code. This is a design stream; the boundary held.

---

# Second bounded pass — 2026-08-20, after the theme refinement

**Scope:** the refined theme, background environment and second-generation
Institutional Glass, across both prototypes.
`{r3-lending, r3-request, v5-overview, v5-inventory} × {light, dark}` at 1440,
plus the eight-width responsive matrix.
**Not in scope:** any new visual direction. Explicitly bounded — neither pass was
permitted to regenerate a design world, and neither did.

The first pass audited the public portals against an intention. This one audits
a system that had just been rebuilt from a single source, which is a different
question: *did the rebuild introduce the tells it was supposed to remove?*

## Method — and a correction worth recording

Anti-patterns were **measured on the rendered page**, not eyeballed. The first
two runs of that measurement produced findings that were artifacts of the
instrument, and both are recorded here because the same mistakes are easy to
repeat:

- **`transition-property: all` reported 221–489 elements per page.** The CSS
  *initial value* of `transition-property` is `all`, so every element with no
  transition at all reports it. Requiring a non-zero `transition-duration` drops
  the count to **0**. There is no `transition-all` in either prototype.
- **"Eyebrows" reported 24 on one page.** The test caught every uppercase,
  letter-spaced, small-size run — which is what a *form label*, a *table header*
  and a *status pill* look like. Excluding labels, headers, chips and pills drops
  it to **3**.

A gate that reports a defect the product does not have is worse than no gate,
because the fix it invites is a regression.

## Hallmark — anti-slop audit, measured

| Named tell | Measured | Verdict |
|---|---|---|
| Pure black, pure white | 0 elements with `#FFF` or `#000` background, on every surface and both themes. Rendered: 0.00–0.63% of pixels effectively white, 0–1.5% effectively black | **Clear** — this was the headline defect before the pass and it is gone |
| Aurora-blob background | One layered radial field per prototype: three fields at alpha 0.10 / 0.10 / 0.40 light, 0.16 / 0.055 / 0.26 dark, in oxblood, gold and cream | **Clear.** Not the purple-pink-cyan mesh the tell names, and at these alphas depth registers before the gradient does. The two rotated "governed rails" were removed in this pass precisely because they were the one element still reading as decoration |
| Floating-orb decoration | None | **Clear** |
| Glassmorphism without purpose | 0 `backdrop-filter` on every whole-site operational surface; 1–4 panes on the public portals; documented allowed and forbidden zones | **Clear.** The zone policy is doing real work — the dense surfaces have no glass at all |
| Card-in-card | 2–6 nested bordered boxes on the portals, 0–4 on the workspace | **Observation, not a finding.** The nesting is `.glass` → `.on-glass`, which exists to guarantee text contrast over a transmissive pane. It is a legibility mechanism with a stated reason, not decoration. `.glass .glass` is disabled in CSS |
| Shadow-glow on dark | 0 chromatic glows in dark mode on every surface measured | **Clear.** v5's four fixed-rgba glow tokens were re-expressed as a hairline plus a low-alpha bloom drawn from the status tones. The remaining light-mode hits are `--shadow-g2` at alpha 0.10 — a warm-tinted drop shadow, which is correct practice, not a glow |
| Over-rounded UI | Largest radius in play is `50%`, on the crest and the avatars — circles by intent. The rectangular scale tops out at 18px | **Clear** |
| `transition-all` | 0 | **Clear** |
| Eyebrow on every section | 3 on the busiest portal route, 5 on the workspace — of which 4 are rail *group* labels, not section kickers | **Clear.** Slightly above the 1–2 guidance on one route; the two extra label distinct process panels and removing them would cost wayfinding. Left deliberately |
| Bounce / elastic easing | Single easing token, `cubic-bezier(0.16, 1, 0.3, 1)` — no overshoot | **Clear** |

**Hallmark: PASS.** 0 critical · 0 major · 0 minor requiring change.

One judgement recorded rather than acted on: the pane noise overlay runs at 0.2
opacity where Hallmark's grain recipe suggests below 0.1. The recipe describes a
full-page grain at normal blend; this is a per-pane overlay at `soft-light`,
applied to at most four panes and disabled entirely below 768. Changing the
number to match a threshold from a different context would be cargo-culting.

## Impeccable — bounded refinement audit

The deterministic detector ran clean over every changed stylesheet
(`hau-theme.css`, `glass.css`, `portal.css`, `tokens.css`, `theme-final.css`):
**0 findings**. URL scanning was unavailable — it needs Puppeteer, and adding a
second browser dependency to a repository that already standardises on Playwright
would be a worse outcome than not running it. The live-surface checks were run
through the project's own Playwright instruments instead, which is what the
measured table above reports.

Two material findings were found and fixed during the pass:

1. **The Overview brief panel was `--ox-900` in both modes** — a near-black
   oxblood slab running the full content width. In dark mode unremarkable; in
   light mode it put a CIE L\* 8 field in the middle of an L\* 95 reading plane,
   pulling the whole Overview content area to a mean of L\* 49 and producing the
   largest brightness step in the product. The deeper problem was what the
   darkness *said*: Overview's strongest signal has to be "what needs attention",
   and instead it was the panel's own contrast. Rebuilt as a recess on the ladder
   with an oxblood rule for weight and the exception numerals carrying the
   emphasis. Overview light moved from a content-plane mean of L\* 49 to L\* 87.

2. **Marketing display type inside an operational screen** — the same panel
   carried a 44px Bricolage headline competing with the numbers it introduced.
   Reduced to a 23–31px clamp.

Two smaller corrections in the same spirit: interactive targets were raised to
the WCAG 2.2 2.5.8 minimum (radios and acknowledgment checkboxes were 18×18; the
skip link and the mobile portal chips were under the practical 44), and form
controls were moved from `--ground` to `--inset`, because the ground is the
environmental canvas and a text field is reading content.

**Impeccable: PASS**, two material findings found and fixed.

## What this pass deliberately did not touch

- The Impeccable V4 record that **oxblood is the primary-action colour**. The
  Admin surface's one oxblood CTA trips the brightness-step metric; it is waived
  by name in `comfort-audit.mjs` with that reason rather than being restyled to
  suit an instrument.
- The canonical gold. The Figma sync report confirms the gold and oxblood ramps
  were the only primitives left **unchanged**.
- The accumulated v3/v4/v5 cascade in the whole-site prototype. An accepted
  specification references those paths; the correction was applied as a final
  aliasing layer instead.
- Any production code. This is a design stream; the boundary held.
