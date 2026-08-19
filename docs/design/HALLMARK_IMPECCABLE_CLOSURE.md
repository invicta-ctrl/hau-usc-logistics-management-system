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
