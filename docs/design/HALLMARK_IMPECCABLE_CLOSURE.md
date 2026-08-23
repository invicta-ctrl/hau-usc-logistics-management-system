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

3. **The modal scrim was one hardcoded value used in both modes** —
   `oklch(0.22 0.085 22 / 0.55)`, the darkest oxblood at 0.55 alpha, on both the
   command dialog and the drawer. One value cannot be right in both modes
   because they have opposite headroom. In light it washed the whole page deep
   maroon and pulled the content plane from L* 89 to L* 52 — the
   "oversaturated maroon surface" the brief names, and the loudest thing on
   screen when a scrim's entire job is to recede. In dark it crushed. Both now
   resolve through the canonical `--scrim`, which carries 0.16 light and 0.34
   dark. Light now measures inside the bar at all four widths.

   This was found only because the verification matrix was extended to cover the
   overlay plane, which had been missed on every previous pass — an overlay does
   not exist until something opens it, so a matrix built from routes never sees
   one.

Two smaller corrections in the same spirit: interactive targets were raised to
the WCAG 2.2 2.5.8 minimum (radios and acknowledgment checkboxes were 18×18; the
skip link and the mobile portal chips were under the practical 44), and form
controls were moved from `--ground` to `--inset`, because the ground is the
environmental canvas and a text field is reading content.

**Impeccable: PASS**, three material findings found and fixed.

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


---

# Third bounded pass — 2026-08-23, R3-A1 post-synchronization

Run after the R3-A1 Figma Design + Figma Make v40 synchronization, against the
public surfaces: landing / public gateway, Public Request Center, Staff Sign In,
public Lending, and the public shell and navigation. Both passes were
**read-only**. Nothing in `src/frontend/` was edited.

## The precondition that made this pass meaningful

The previous Impeccable findings could not be trusted, and R3 recorded why as
FE-R3-010: `.impeccable/design.json` was written 2026-08-08 by the pre-cutover
V4.1 redesign. Its fifteen-colour palette contained **none** of the current
identity anchors — no `#d4af37`, no `#40070a`, no `#7d5518` — so the
`design-system-color` rule was flagging the real institutional palette as drift.

R3-A1 rebuilt the sidecar at schemaVersion 2 from `scripts/design/theme-source.mjs`
(the canonical token source) and the shipped `theme.css`, and added a
machine-readable `colors` / `typography` / `rounded` block to `DESIGN.md`
frontmatter, which the detector actually reads.

## Impeccable — mechanical detector, measured before and after

`node .../impeccable/scripts/detect.mjs --json` over the eight public components
(`HeroSection`, `LandingPage`, `LogisticsHubSection`, `Footer`,
`PublicMobileDrawer`, `PublicNavbar`, `PublicFlows`, `AppRouteRenderer`):

| Run | Findings | Breakdown |
|---|---:|---|
| Before (stale sidecar) | 27 | `design-system-color` 27 |
| After (refreshed sidecar + DESIGN.md palette) | **7** | `design-system-radius` 7 |

**All 27 colour findings were false positives** against a superseded system, and
all 27 are gone. Every value they flagged — `#e8b93c`, `#f6e29a`, `#f2d15c`, the
gold `rgba()` hairlines, `#fff` on oxblood — is a genuine current token.

### The 7 that survive are real, and small

All advisory, all in `PublicFlows.tsx`, all `design-system-radius`:
`12px` at lines 951, 959, 975, 981, 986, 989 and `18px` at line 913, against the
real scale `sm 6 · md 8 · lg 10 · xl 14 · pill 999` computed from
`--radius: 0.625rem`.

### One finding the detector cannot raise, recorded deliberately

The shipped system declares font **families and weights** but has never defined a
**type ramp**. `theme.css` carries only `--font-size: 16px`, while the public
components use ten ad-hoc literal steps — 9, 10, 11, 12, 13, 14, 15, 16, 18 and
19px. `DESIGN.md` therefore declares no `fontSize` steps on purpose: declaring
the literals in use would have silenced the check by blessing the debt. This is
recorded as FE-R3-011 and is product-source work, not design-authority work.

## Hallmark — anti-slop audit

Read-only, `hallmark audit`. Grouped by severity.

### Critical — 0

**The structural fingerprint is not the AI template.** The landing is three
sections — hero, Current, Logistics hub — not hero → three equal feature cards →
CTA → footer. The hub is a genuine asymmetric two-column (`lg:grid-cols-2`)
pairing a 2x2 action-tile grid against an ordered `<ol>` lifecycle rail. There is
no centred-hero-plus-three-cards rhythm anywhere on the public surfaces.

**No public/staff ambiguity.** Verified behaviourally in Make v40, not inferred:
"Start a logistics request" reaches "PUBLIC REQUEST · NO SIGN-IN — Request
Center" carrying the explicit no-account contract, and "Staff sign in" reaches a
separate staff sign-in page. The four public request CTAs no longer hold
`requireAuth`.

### Major — 1

| Tell | Where | Fix |
|---|---|---|
| Touch target below the declared floor | `src/frontend/app/public/Footer.tsx:57,64` — both footer buttons are `minHeight: 40` | `PRODUCT.md` and `DESIGN.md` both require 44px touch targets. The footer is not breakpoint-gated, so these render on mobile at 40px. Raise to 44. |

### Minor — 3

| Tell | Where | Fix |
|---|---|---|
| Radius off the documented scale | `PublicFlows.tsx` — `12px` x6, `18px` x1 | Use `xl` (14px) or `lg` (10px), or add a documented 12px step if the shape is intentional. |
| Mid-render token improvisation | All eight public components declare literal hex/`rgba()` inline rather than `var(--oxblood-deep)` etc. | Faithful to the Make source and the values are correct, so this is not drift — but it bypasses the token layer. Tracked as FE-R3-011. |
| Desktop-only control below 44px | `PublicNavbar.tsx:56` — "Staff sign in" at `minHeight: 32` | Inside the `hidden lg:flex` cluster, so it only renders at >=1024px on a fine pointer. Below the stated floor but not a touch target. Raise if the floor is meant to be absolute. |

### Checked and clean

- **Focus.** Every public control has a visible `:focus-visible` ring. The hero's
  three controls carry theirs in `index.css:162-164` rather than in the TSX,
  which is why a source-only grep reads as zero — it is not missing.
- **Horizontal overflow.** `index.css:7` sets `overflow-x: clip` on
  `html, body, #root` — `clip`, not `hidden`, which is the correct value.
- **Reduced motion.** Honoured in `atrium-motion.css` and `index.css`.
- **Section tags.** The one eyebrow on the Logistics hub is stacked vertically
  above its heading. The banned tag-left / heading-right hanging-header pattern
  does not appear.
- **Italic headers.** None. The only italic is "Laus Deo Semper" in the footer —
  the institutional motto, set as body copy in Newsreader. That is not a heading
  and is not the italic-header tell.
- **Invented metrics.** None. No fabricated counts, testimonials or percentages
  on any public surface.

**Count: 0 critical · 1 major · 3 minor.**

## Two generic heuristics deliberately not applied

R3-A1 forbids redesigning away from the synchronized Figma/Make authority merely
to satisfy a generic rule, so these were considered and rejected:

1. **"No Hallmark macrostructure stamp."** The audit verb would normally flag a
   missing stamp on a system-managed project. This project's visual authority is
   Figma Make, not Hallmark; adding a Hallmark stamp would assert an authorship
   that is not true.
2. **"Eyebrows default off."** The mono uppercase eyebrow is an established
   element of this design system — it names surface context, as in
   "PUBLIC REQUEST · NO SIGN-IN". It is product truth, not decoration.

## What this pass did not touch

No `src/frontend/` edit, no product source, no Figma write, no backend,
Playground, Production or `main` change. The two writes were
`.impeccable/design.json` and the `DESIGN.md` frontmatter token block, both of
which are design authority and both of which R3-A1 explicitly authorizes.

---

# R3-A1-A2 final quality pass — 2026-08-24

Run only after the §9 preconditions were all met: Figma Design current, Figma
Make saved at Version 44 and read back, the repository Make mirror rebuilt from
the provider export, and `DESIGN.md`, `WORKFLOW_ARCHITECTURE.md` and `ROUTING.md`
agreeing. Auditing an intermediate state would have measured something that was
about to change.

Scope: the surfaces R3-A1-A2 created or changed —
`request/ExternalRequestCenter.tsx`, `auth/AccountRecoveryPanel.tsx`,
`auth/VerificationCodeField.tsx`, `auth/StaffSignInPage.tsx`,
`landing/HeroSection.tsx`, `landing/LogisticsHubSection.tsx`,
`public/PublicNavbar.tsx`, `public/PublicMobileDrawer.tsx`, `public/Footer.tsx`,
`PublicFlows.tsx`.

## 1. Impeccable sidecar — refreshed first

`.impeccable/design.json` was stale again: `DESIGN.md` had moved under R3-A1-A2.
Refreshed at schemaVersion 2, repointed at the R3-A1-A2 amendment, the
current-authority Figma Design lane plus its page `10.1` documentation mirror,
and Figma Make **Version 44**.

`IMPECCABLE_SIDECAR_CURRENT` **PASS**.

## 2. Impeccable — detector findings, and what was done

The detector flagged literal colours and one off-scale radius across the new
files. Handled by cause rather than by suppression:

| Finding | Resolution |
|---|---|
| `#2f6b3d` in the verified-code state | **Fixed.** Invented here; `theme.css` already ships `--green-open`, which is theme-aware. Now `var(--green-open)`. |
| `12px` radius on the status card | **Fixed.** Off the documented 6/8/10/14/999 scale; now `14px`. |
| `#d4183d`, `#1f6b41`, `#fff7e6`, `#f7f0e2` | **Fixed at the root.** These genuinely ship in `theme.css` and are used across the frontend, but `DESIGN.md` frontmatter never declared them, so the detector read real system tokens as drift. Declared. |

**No finding was silenced with an ignore rule.** Where a token existed, the code
now uses it; where the token shipped but was undeclared, the declaration was the
fix. `FE-R3-013` is closed.

One item is deliberately left open and is recorded, not hidden: the
account-panel pair (`AccountAccessPanel`, `AccountRecoveryPanel`) is still
light-mode only, sharing literal surfaces. Converting them is a change to the
**pair** — tokenising one would create a visible inconsistency between two panels
that render in the same slot. Tracked as the remaining half of `FE-R3-013`.

`IMPECCABLE_FINAL` **PASS**.

## 3. Vercel Web Interface Guidelines — five real defects fixed

Reviewed against the current published rule set. Findings on R3-A1-A2 surfaces:

| Rule | Finding | Fix |
|---|---|---|
| Decorative icons need `aria-hidden` | Five lucide icons in `ExternalRequestCenter` and the `ArrowLeft` on the sign-in back control sat beside visible text and were announced twice | `aria-hidden="true"` |
| Disable spellcheck on codes and usernames | The identifier fields and the 8-digit code field were spellchecked, and the code field autocapitalised | `spellCheck={false}`, plus `autoCorrect`/`autoCapitalize` off on the code |
| `overscroll-behavior: contain` in drawers | The mobile drawer chained scroll to the page behind it | `overscrollBehavior: "contain"` |
| Placeholders show an example and end with `…` | Placeholders restated their labels | Rewritten as examples |
| `touch-action: manipulation` | Absent, so touch carried the 300 ms double-tap delay | Added to interactive elements. Pinch zoom is untouched — `user-scalable=no` remains forbidden |

Already compliant and verified, not assumed: `:focus-visible` rings throughout;
`role="alert"` / `aria-live` on async validation; the verification field focuses
itself when it becomes the thing to correct; no `transition: all`; no blocked
paste; labels bound with `htmlFor`; `tabular-nums` on the code field; submit
controls stay enabled until the request starts.

`VERCEL_FINAL` **PASS** — 5 findings, all fixed.

## 4. Hallmark and Taste — anti-slop review

- **Generic SaaS drift.** None introduced. The new surfaces reuse the shipped
  institutional language — oxblood ground, scarce gold on active controls, mono
  eyebrows naming surface context, `Bricolage Grotesque` display over
  `IBM Plex Sans` body.
- **The eyebrow convention survives, with corrected content.** The old
  `PUBLIC REQUEST · NO SIGN-IN` eyebrow was product truth when written and is now
  false, so it is gone. `REQUESTER VIEW` replaces it on the DOL cue. The
  *pattern* was kept; only the claim changed.
- **Invented metrics.** None. Counts on the requester surface are derived from
  the returned record set, never fabricated.
- **Honest empty and gap states.** The request surface distinguishes *loading*,
  *empty*, *service error* and *contract gap*, and names
  `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` rather than showing a generic failure
  for a known server limitation.
- **Access rules stated on the control.** "Start a logistics request" carries
  "USC staff sign-in required" and "Browse public lending" carries "No sign-in
  needed". Discovering a sign-in wall only after committing to a flow is the
  defect this prevents.

**Count: 0 critical · 0 major · 2 minor.**

Minor, recorded against owning slices rather than fixed here:

| ID | Minor finding | Owner |
|---|---|---|
| FE-R3-013 | The account-panel pair remains light-mode only with shared literal surfaces | FI-12 |
| FE-R3-011 | No type ramp exists; components still use ten ad-hoc literal steps | FI-12 / FI-13 |

`HALLMARK_PASS` **PASS** · `TASTE_PASS_OR_FINDINGS_RECORDED` **PASS**.

## 5. Verification re-run — only what the changes could affect

The fixes touched frontend markup, CSS and the design frontmatter. Re-ran the
frontend gates rather than every completed gate blindly:

| Gate | Result |
|---|---|
| `npm run build` | PASS |
| `npm run verify:dist` | PASS — deterministic |
| `npm test` | PASS — 1126/1126 |
| Frontend Playwright, 5 widths | PASS — 190/190 |
| `npm run check:governance` | PASS |

No Figma, Make, Playground, Production, `main`, backend or schema change was made
by this pass.
