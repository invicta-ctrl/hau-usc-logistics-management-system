# HAU-USC Logistics — Frontend Design Baseline to Codex Handoff

```text
STATUS:                     READY_FOR_CODEX_ADOPTION_PLANNING

HANDOFF_FROM:               Claude Code / frontend-design-integration
HANDOFF_TO:                 Codex
OWNER:                      Earl
DATE:                       2026-08-20 (Asia/Manila)

DESIGN_BRANCH:              frontend-design-integration
STARTING_SHA:               908653dc956c9ccffa68ac0b350fc23b69f053ea
ENDING_SHA:                 4ed045d2a2f6c18f8818b2d16a8f3e0602c90243
                            (+ the one-line SHA backfill commit that follows it)
UPSTREAM:                   origin/frontend-design-integration
WORKTREE_STATE:             clean

FIGMA_DESIGN_FILE:          hXJElH4p72KfgAaoUyfNOC
FIGMA_DESIGN_BASELINE:      DESIGN_BASELINE_2026-08-20-F (content identity; the bridge cannot name a native version)
FIGMA_TRACKER_MIRROR:       page 55:3 · board 568:2 · block 691:2 (heading 691:3, body 691:4)
                            It MIRRORS the repository tracker and is never the calculation authority.
FIGMA_MAKE_FILE:            rP9W9MQlZkyQrUx38TVsFS
FIGMA_MAKE_VERSION:         Version 39 · pending edits NONE
                            v37 canonical theme + route adoption (5 files)
                            v38 landing atrium pinned (1 file)
                            v39 MK-06 scoped atrium palette pin (1 file)
                            theme.css sha256 249857a9…, verified from the saved
                            document after reload. Routes unchanged since v37.
FIGMA_MAKE_THEME:           ADOPTED_AND_VERIFIED
                            #D4AF37 resolves in Make light, #E1C671 in Make dark;
                            no superseded value survives the cascade in either mode
MAKE_ADOPTION_AUTHORITY:    OWNER_AUTHORIZED_DESIGN_STREAM_ADOPTION, 2026-08-20.
                            Historical authorship of the adopted RequestCenterRoute.tsx
                            edit remains UNKNOWN. Rollback baseline preserved at
                            output/design/make-preservation/RequestCenterRoute.unsaved.tsx
                            sha256 4087473ca337b510859bb841425bfd4548181b2847db62627b0ea79715d5b159

TRACKER_COMPLETION:         97% (derived — docs/design/DESIGN_EXECUTION_TRACKER.md)
GATE_COUNTS:                49 VERIFIED · 1 IN_PROGRESS · 0 NEEDS_REVERIFY · 1 BLOCKED
                            51 gates · 97.0 of 100.0 mandatory weight
CODEX_HANDOFF_READINESS:    READY

PRODUCT WORKTREE MODIFIED:  NO
EXTERNAL PRODUCT/PROVIDER MUTATIONS: NONE
```

Tracker completion and handoff readiness measure different things. The tracker
counts design gates whose evidence still stands today. Handoff readiness asks
whether you have enough authoritative information to begin the next accepted
phase. The 3% that is not VERIFIED is one unidentifiable historical colour set
and one deliberately-stopped token-binding sweep. Neither can change a single
contract below.

The four Figma Make gates that previously could not be re-confirmed have been
closed: the file was opened at Version 36 in a signed-in session and every route
file was read and hashed. What remains open in Make is the theme adoption, and
that is blocked by an ownership boundary rather than by missing information —
the exact patch, the baseline hashes and the verification steps are all in
`docs/design/FIGMA_MAKE_ADOPTION_PACKET.md`.

---

## 1. Authority model — read this before anything else

| Question | Authority |
|---|---|
| What the product actually does | Current production, its source and its tests, read at an exact commit |
| What the product should look like and how it should behave | The frozen Figma Design + Figma Make baseline named above |
| How that was implemented for design purposes | `frontend-design-integration` at the ending SHA |
| Whether any of it may enter the product | A new accepted product implementation specification. Nothing here is pre-approved |

**Do not:**

- merge `frontend-design-integration` into a product branch;
- copy prototype code into the product wholesale — it is design-stream code, written to prove a design, not to survive the product's contracts;
- overwrite or reorganise active v0.8.3–v0.8.5 work;
- infer backend behaviour, permissions or data shapes from a Figma frame. A frame is a design target, never a runtime contract.

Functional reference throughout this document is **production 0.8.2 @ `c316e047`,
schema 30**, read with `git show c316e047:<path>`. That is the exact deployed
commit, not a branch head and not documentation.

**The active product has moved on.** At the time of writing, the product worktree
is on `release/v0.8.3-identity-foundation`, which carries both the `src/visual/*`
layer these contracts were read from *and* a newer `src/features/*` layer.
Reconcile against the product's current HEAD before planning any slice; do not
assume the `c316e047` paths are still where the behaviour lives.

---

## 2. Product contract summary

Each of these was read from source, field by field. Where the design deviates,
the deviation is named — silence means parity.

### 2.1 Public Lending — `src/visual/public-lending-portal.js`

**No login.** There is no session check, no sign-in gate and no authorization
branch anywhere in the module. Design material that gated borrowing behind staff
sign-in was superseded; the rule is owner-locked as `DESIGN.md` **D24.0**.

Audience is USC Staff / Officer and the Angelite / HAU student body.

```text
borrower-safe catalog
  -> borrower-specific intake (basic information sheet; council role is the only branch)
  -> dates and purpose
  -> governed acknowledgements
  -> Submit for Review
  -> private tracking by one-time code
```

Two owner-directed design changes carry **contract deltas that are not yet
accepted** and must not be implemented without an amendment:

| Design decision | Production today |
|---|---|
| Requested pickup date removed; only "Borrowing until" remains, pickup recorded by staff at handoff | `pickupDate` is declared **required** |
| Catalog is search-first — no grid until 2+ characters or a category choice | The full catalog renders on mount |

### 2.2 Public Request — `src/visual/public-requester-portal.js`

No staff account, where current production confirms it.

```text
Event / Activity  or  Office Inventory / Pantry
  -> requester context
  -> conditional operational context
  -> request lines
  -> review
  -> For Review
  -> private tracking
```

The tracking reference is **shown once and never emailed** (PR-02). There is no
draft persistence, so there is no "save and review later" (PR-03). Both were
corrected in the design.

### 2.3 Authenticated requester — `src/visual/requester-portal.js`

A separate context, not a skin on the public form. Its real differences:
authenticated identity, private authorized tracking and history, cancel where
allowed, receipt behaviour, and **no duplicate collection of identity the session
already derives**.

### 2.4 Staff Request Center — `views/request.html` + `runtime.js`

Production's Request Center is a **submission form with a review queue appended
below it**. The queue exists only for a session holding `request.review`. Design
material that showed only the queue was incomplete; both halves now exist
(`615:2` submission, `300:624` per-line decision).

Authoritative review vocabulary — `REVIEW_ROUTE_LABELS`:

```text
ISSUE_FROM_STOCK      Issue from stock
PROCUREMENT           Procurement / canvass
RESTOCK               Catalog restock
REJECT                Reject
MISSING_INFORMATION   Missing information
```

`permittedRoutes(request, line)` filters presentationally only; the server
revalidates every decision:

- `ISSUE_FROM_STOCK` only when the line has an `itemId`;
- `PROCUREMENT` unless the request type is `CATALOG_RESTOCK`;
- `RESTOCK` only when the line has an `itemId` **and** the request is `CATALOG_RESTOCK` or its catalog type is `OFFICE_INVENTORY` / `PANTRY`;
- `REJECT` and `MISSING_INFORMATION` always.

**No pre-selected route.** RV-01.6 removed the implicit default deliberately: a
pre-selected first option lets one click route every line without a real
decision. An unset line blocks submission client-side and server-side.

The queue admits exactly `FOR_REVIEW` and `NEEDS_INFORMATION`
(`REVIEWABLE_LINE_STATUSES`). Its columns are Request · Requester · Lines ·
Status · Actions, and the count and pager must come from the **server's**
pagination, not from the rows on screen, or review work past the first page is
silently unreachable.

"Send to Release Desk" is **not a review route**. A request *arrives* at the
Release Desk when its lines reach a ready state.

### 2.5 Internal Office Lending — `views/lending.html` + `renderLending*`

Actions derive from status. `derivedLendingStatus()` promotes `ON_LOAN` to
`OVERDUE` when `dueAt` has passed.

```text
FOR_REVIEW              Review · Reject
READY_TO_CLAIM          Confirm Issue    (ticketType === 'CONSUMABLE')
                        Confirm Handoff  (reusable)
ON_LOAN | OVERDUE       Inspect Return
always                  Details
```

Tabs and metrics: For Review · Ready to Claim · On Loan · Overdue. Borrower types
are `USC_STAFF` ("USC Officer/Staff") and `ANGELITE` ("Angelite/Student").

The reusable / consumable split is the point: a consumable is issued and never
comes back; a reusable is handed off and must be returned. Never show an action
the current status cannot perform.

### 2.6 Release Desk — `views/release.html` + `bindReleaseEvents`

A separate module with its own feeds. Review cannot push anything into it.

### 2.7 Status vocabulary — `STATUS_LABELS`

This map is the vocabulary authority for every surface. Design frames render it
in sentence case as a typographic convention; the **words** must match.

```text
DRAFT Draft · FOR_REVIEW For Review · ACCEPTED Accepted
PARTIALLY_FULFILLED Partially Fulfilled · COMPLETED Completed
REJECTED Rejected · CANCELLED Cancelled
FOR_CANVASSING For Canvassing · WAITING_FOR_BUDGET Waiting for Budget
TO_BE_PROCURED To Be Procured · PROCURED Procured
READY_TO_RELEASE Items Available / Ready to Release
PARTIALLY_RELEASED Partially Released · RESTOCKED Restocked
READY_TO_CLAIM Ready to Claim · ON_LOAN On Loan · OVERDUE Overdue
RETURNED Returned · IN_STOCK In Stock · LOW_STOCK Low Stock
OUT_OF_STOCK Out of Stock · VERIFY Verify · ARCHIVED Archived
NEEDS_INFORMATION -> humanised to "Needs Information" (no explicit entry)
```

`NEEDS_INFORMATION` has no entry in the map and falls through to the humaniser.
If you add an entry, the rendered string must stay "Needs Information" or the
queue's chip changes without a decision.

### 2.8 Public portal navigation — `src/visual/portal-navigation.js`

Exactly four destinations: **Request Center**, **Lending Center**, **Staff sign
in**, and *Back to portal selection*. The account application
(`public-account-application.js`) is reached from the staff sign-in side, **not**
from the public portal tabs. That was an explicit owner correction and the design
follows it.

---

## 3. Design system summary

| Concern | Value |
|---|---|
| Design direction | Institutional Logistics Ledger — actions have owners, states, timestamps and consequences |
| Visual expression | Institutional Glass |
| Canonical primary gold | **#D4AF37** — owner decision, `DESIGN.md` **D08.0**, BINDING, do not reopen |
| Institutional anchor | Oxblood `#40070a` |
| Working surface | Warm paper / cream |
| Themes | Light and dark, driven by explicit variable modes |

**Gold roles.** `color/gold/primary` `#D4AF37` is the only value permitted in the
primary role. `color/gold/light` and `color/gold/tint` carry lighter surfaces;
`color/gold/border` and `color/gold/glow` carry translucent edges and halos, each
derived by mixing toward paper rather than reusing the primary. This is a role
map, not a find-and-replace.

**Gold carries no accessibility duty.** Text that must be read on a working
surface uses `color/accent/text` (`#7d5518` light, `#c9a45f` dark). Text on the
gold action surface uses `color/text/on-accent`. `gold/400` measured 1.52:1 on
cream and is reserved for fills, edges, focus rings and oxblood-backed text.

**Institutional Glass.** Semantic layers `glass/ground`, `glass/surface`,
`glass/inset`, `glass/raised`, `glass/overlay`, `glass/border`,
`glass/highlight`, `glass/shadow`, and the blur ladder `blur/subtle`,
`blur/standard`, `blur/strong` — single-sourced at **10 / 14 / 18 / 22** since the
second-generation glass pass; the variables drive the four Material effect
styles, so there is one number per step. See section 3A.5. The Figma
Glass Material collection maps one-to-one with
`prototypes/public-portals-r3/glass.css`; the correspondence table for all 21
properties is written into the head of that file.

Standing glass rules: no dense operational table on strong glass · no glass
behind glass · no blur required to comprehend anything · solid working planes for
high-density and high-risk surfaces · light/dark parity · responsive and
`prefers-reduced-transparency` fallbacks · accessibility before effect.

**Focus system.** Two-tone: a 3px solid `--focus-ring-contrast` outline at 2px
offset, plus a 6px `--focus-ring` halo. On mobile, every focusable control in
`#app` carries `scroll-margin-bottom` clearing the sticky bar, so 2.4.11 holds
when focus scrolls.

**Motion.** `--m-response` / `--m-state` / `--m-surface` / `--m-overlay`, with a
`prefers-reduced-motion` override. Durations 120 / 200 / 280 / 320 / 400 ms.

**Responsive.** Eight required widths: 320 · 375 · 390 · 414 · 768 · 1024 · 1440
· 1920, with zero horizontal overflow at each. A narrow layout is a
transformation, not a squeeze. All six of production's `desktop-table` tables
declare a comparison key, an identity column, what stays in the card and what
moves to the detail view — `DESIGN.md` **D29.1**.

---

## 3A. FINAL THEME AND VISUAL ENVIRONMENT

This is the section to implement from. `DESIGN.md` **D41** is the same system
stated as durable authority; this is the working version with the warnings.

### 3A.1 There is exactly one source, and it is not a stylesheet

```text
scripts/design/theme-source.mjs        <- edit here, and only here
  |
  +-- npm run design:theme
        |
        +-- prototypes/shared/hau-theme.css                    both prototypes
        +-- prototypes/public-portals-r3/figma-make/src/
              styles/theme-canonical.css                       Figma Make override
  |
  +-- node scripts/design/figma-theme-payload.mjs
        |
        +-- Figma variable collections in hXJElH4p72KfgAaoUyfNOC
```

`npm run design:theme:check` fails if either generated file is stale. Wire that
into whatever check runs before a design change lands.

**Why this exists.** Before this pass, three surfaces each held their own
palette: the public-portal prototype, the whole-site prototype, and Figma Make.
Two of the three did not contain the owner-locked gold at all — the whole-site
prototype rendered `oklch(69% 0.115 82)` and Make rendered `#E8B93C`. Nobody had
done anything wrong; there was simply no single place to change a colour.

### 3A.2 Surface ladder — memorise the purposes, not the hexes

| Step | What it is for |
|---|---|
| `--ground` | Environmental canvas. **Never** put reading content on it. |
| `--inset` | A recess *inside* the work plane — filter bars, table headers, disabled regions. |
| `--work` | The primary reading and operational plane. Tables, forms, records. |
| `--raised` | Temporary elevation — floating cards, popovers, suggestion lists. |
| `--overlay` | Dialogs, command palette, context panels. |

| | ground | inset | work | raised | overlay |
|---|---|---|---|---|---|
| Light | `#E5DAC7` | `#EFE5D7` | `#F7F1E8` | `#FBF6F0` | `#FDFAF6` |
| CIE L\* | 87.4 | 91.4 | 95.4 | 97.1 | 98.4 |
| Dark | `#211615` | `#291C1C` | `#312222` | `#3B2A2A` | `#433231` |
| CIE L\* | 8.6 | 11.9 | 15.0 | 19.0 | 22.6 |

The ladder runs the same direction in both modes. If you find yourself wanting a
sixth surface, you almost certainly want `--raised` plus a border.

### 3A.3 Text, borders, focus

```text
--text-primary     titles, table values, primary copy      13.1:1 / 12.7:1 on work
--text-secondary   supporting copy                          7.4:1 /  9.5:1 on work
--text-muted       hints, meta, placeholders                5.1:1 /  6.0:1 on work
--accent-text      eyebrows and emphasis — the ONLY gold that works as ink
--border-control   control boundary, solved for 3:1 on ground AND work AND inset
--selected-line    selected-state boundary, 3:1
--focus-ring       gold ring, identity
--focus-ring-contrast  the companion that actually carries the 3:1
```

Focus is deliberately two-part. Do not simplify it to one gold ring — gold alone
measured 1.40:1 on the ground, which is a focus indicator that does not exist.

### 3A.4 Background environment

Three broad radial fields plus a ledger rule, on a fixed, `aria-hidden`,
non-interactive layer. Alphas: anchor 0.10/0.16, decision 0.10/0.055, halo
0.40/0.26 (light/dark). Below 768, two fields and no noise.

The acceptance test is subjective and worth stating plainly: **depth and warmth
should register before the gradient does.** If you can see where a blob starts,
the alpha is too high.

### 3A.5 Institutional Glass

| Step | Fill alpha (L/D) | Blur | Saturate |
|---|---|---|---|
| G1 | 0.34 / 0.34 | 10px | 108% |
| G2 | 0.52 / 0.50 | 14px | 112% |
| G3 | 0.66 / 0.64 | 18px | 116% |
| G4 | 0.34 / 0.24 | 22px | 120% |

Fill, blur, edge and shadow are one recipe per step. Changing blur without
changing fill is how a pane stops being legible.

Allowed: command palette and overlay, contextual inspector, limited navigation,
Overview signature regions, public landing hero, temporary elevated actions.
Not allowed: inventory tables, request queue, release workbench, dense forms,
record histories, high-risk confirmations, Access/Admin controls.

G4 alone takes the gold edge.

The **modal scrim** is per-mode: `0.16` oxblood light, `0.34` near-black dark.
Do not collapse it to one value. The two modes have opposite headroom, and the
single hardcoded 0.55 this replaced washed the light page maroon and crushed the
dark one. In dark mode focus comes from the overlay pane being brighter than the
ground, not from burying the page.

### 3A.6 Theme selection

Precedence is **explicit user choice, then system preference**, and the system
preference is followed live rather than only at boot. A theme change that came
from the *system* must not be persisted — persisting it pins the theme and the
preference is never followed again.

Resolve the theme in a pre-paint inline script. Without one, a dark-preference
visitor gets a full-viewport white flash on every load.

Transition: colour only, one budget (240ms), scoped to elements that paint a
surface, armed by a class that is then removed. Never animate layout. Under
`prefers-reduced-motion: reduce` everything collapses to 1ms.

### 3A.7 Contrast and comfort expectations

WCAG 2.2 AA is the floor. Four gates, all runnable:

```bash
npm run design:serve      # then, in another shell:
npm run design:contrast   # 66/66  token pairs, both themes
npm run design:overlay    # 134/134 text runs over photography, gradients, glass
npm run design:comfort    # 88/88  glare, crush, chroma, brightness shock
npm run design:responsive # 80/80  8 widths, overflow and paint cost
```

The comfort bar is this project's own, not WCAG, and it exists because an
interface can pass every contrast pair and still be unpleasant to sit in front
of for a shift. It caps the share of a viewport that may be effectively pure
white or pure black, the mean luminance of the reading plane, and the brightness
step between adjacent surfaces.

### 3A.8 Performance

Measured budget, per viewport: blur area under 130% narrow / 260% wide, no
nested `backdrop-filter`, no animated filter, blur radius clamped to G1 below
768. Current worst case is 33%. If a change pushes blur area past the budget,
the fix is fewer panes, not a smaller radius.

---

## 3B. WARNINGS FOR IMPLEMENTATION — read before writing CSS

**Do not approximate the theme by sampling screenshot colours.** The screenshots
in `output/design/` are evidence, not a palette. Every value they contain is
composited — a pane over a field over the ground — and sampling one gives you a
number that is correct in exactly one place. Use the semantic variables.

**Do not replace Institutional Glass with generic backdrop-blur cards.** The
ladder is four calibrated recipes with declared zones. `backdrop-filter: blur(12px)`
on a white card at 0.6 alpha is the thing this system was built to stop being.

**Do not apply glass globally.** The no-glass zones in 3A.5 are not a style
preference; they are where an operator reads numbers that have consequences.

**Do not use pure white or pure black for convenience.** `#FFF` and `#000` do
not appear in the ladder on purpose. Both ends were measured as defects before
this pass: 54% of a light viewport effectively white, 95% of a dark one
effectively black.

**Do not change Production behaviour to fit the redesign.** Production and the
current source remain functional authority. If the design implies a different
route vocabulary, status set, or permission model, the design is wrong.

**Do not hand-edit the generated files.** `prototypes/shared/hau-theme.css` and
`theme-canonical.css` both say so at the top. Editing them is how the code and
the design file drift apart again, which is the defect this pass closed.

---

## 4. Figma navigation map

Open these, not the polished neighbours. Several pages hold current and
superseded material side by side, and the frame **names** carry the lane word.

| Page | Current-authority frame | Module | Coverage |
|---|---|---|---|
| 10 — Authority + Design Handoff | `568:2` AUTHORITY + DESIGN HANDOFF · CURRENT | — | Start here. States what governs the file |
| 11 — Foundations | Foundations + Tokens — CURRENT | tokens | G0–G4 optical calibration board |
| 12 — Components | Native component library | components | 86 components + 16 sets |
| 13 — Shell + Navigation | CURRENT · V3 USC-wide follow-up | shell | rail Expanded / Compact / Drawer |
| 15 — HAU USC Landing | CURRENT · R2 Landing Digital Atrium | public gateway | desktop/tablet + mobile |
| 20 — Overview | CURRENT · R2 Glass Operations Command Table | overview | queue + inspector, 1440 and 390, light and dark |
| 21 — Profile | CURRENT · Profile | account | 1440 light/dark, loading, 390 |
| 30 — Inventory | CURRENT · V3 USC-wide follow-up | inventory | dense ledger + raised inspector |
| 40 — Request Center | CURRENT · V3 Request Center; `615:2`, `300:624`, `628:2`, `616:2` | staff request | queue, record, per-line decision, composite, pager |
| 40 — Request Center | CURRENT · public.request — five-step intake | public request | 1440 and 390, light and dark, + loading / empty / error / unavailable |
| 40 — Request Center | CURRENT · portal.request | authenticated requester | 1440 light |
| 50 — Lending Hub | CURRENT · V3 Lending Hub | internal lending | custody timeline on the loan record |
| 60 — Release Desk | CURRENT · V3 Release Desk | release | one focused task plane |
| 70 — Restocking + Procurement + Events | CURRENT · V3 Supply and Events | supply | explicit lifecycle rails |
| 80 — Administration | CURRENT · V3 Administration | admin | access, directory, health, reference, links, brand, activity, denied |
| 90 — Public + Authentication | CURRENT R3 · public.lending (6 frames) | public lending | 1440 light/dark, 390 light/dark, Angelite branch, catalog states |
| 91 / 92 / 93 / 94 | State, Responsive, Motion and Accessibility matrices — CURRENT | annotations | requirements, not proposals |
| 97 | Loading + semantic state patterns — CURRENT | states | six route-shaped skeletons |

Lane vocabulary is binding and appears in frame names: `CURRENT`, `OFFICIAL`,
`APPROVED`, `REFERENCE`, `HISTORICAL`, `SUPERSEDED`, `CONTRACT-GATED`,
`FUTURE CONCEPT`, `PROTOTYPE`, `LEGACY`.

**Deliberately not represented** as their own module pages: the Food and
Materials committee workspaces, and the operational status and audit surfaces,
which appear only inside Administration. Absence means *not designed* — never
read it as complete.

---

## 5. Implementation map

Paths verified against the product worktree at the time of writing. Re-verify
before use; the v0.8.3 stream is actively moving this ground.

| Design concept | Product location today |
|---|---|
| Runtime shell, module renderers, review and lending logic | `src/visual/runtime.js`, `src/visual/runtime-extensions.js` |
| Module views | `src/visual/views/{overview,request,lending,release,inventory,restocking,procurement,reference-admin}.html` |
| Public portals | `src/visual/public-lending-portal.js`, `public-requester-portal.js`, `public-policy.js`, `portal-navigation.js` |
| Authenticated requester | `src/visual/requester-portal.js` |
| Borrower lending portal | `src/visual/borrower-lending-portal.js` |
| Account application | `src/visual/public-account-application.js` |
| Auth gateway | `src/visual/auth-gateway.js` |
| Tokens and styles | `src/styles/tokens.css`, `src/styles/visual/*.css` |
| Responsive layer | `src/styles/responsive.css`, `src/styles/visual/responsive.css` |
| Newer feature layer (v0.8.3) | `src/features/{requests,lending,inventory,release,restocking,procurement,overview,admin,canvass,reports,tasks}/` |

Design-stream reference implementations, for reading only:

| Artifact | Path |
|---|---|
| Implemented visual world | `prototypes/impeccable-whole-site-redesign-v5/` |
| Public portals + Institutional Glass ladder | `prototypes/public-portals-r3/` |
| Figma Make mirror (public flows only) | `prototypes/public-portals-r3/figma-make/src/app/` |

---

## 6. Verified evidence

Revalidated at closeout. Everything here is reproducible from the design branch.

| Check | Result | How |
|---|---|---|
| Contrast | **66 / 66** token pairs, both themes | `npm run design:contrast` |
| Keyboard | **32 / 32**, 2 routes × 2 viewports | `npm run design:keyboard` — real Playwright key presses |
| Accessibility tree | **30 / 30** | `npm run design:semantics` — CDP `Accessibility.getFullAXTree` |
| Responsive | 8 widths, **0** horizontal overflow | live browser measurement, `ACCESSIBILITY_ACCEPTANCE.md` |
| Off-system typefaces in live lanes | **0** | document-wide census, D-04 |
| Superseded gold in live lanes | **0** | per-paint hex scan, lane-aware, 2026-08-20 |
| Forbidden review-route phrases in live lanes | **0** | document-wide text sweep, 2026-08-20 |
| Paint binding | **81.8%** of 54,025 active solid paints | per-paint `boundVariables.color`, 2026-08-20 |
| P0 | 0 | |
| P1 | 0 | |

Two notes on how to read these.

**Keyboard.** Synthetic `dispatchEvent(new KeyboardEvent(...))` does **not** move
native focus — thirty Tab presses produced zero `focusin` events. Any earlier
claim of "tab order verified" from a synthetic path was a test that did not run.
The script presses real keys.

**Semantics.** This is accessibility-tree evidence, the strongest deterministic
evidence available here. It is **not** a screen-reader runtime test, and nothing
in this handoff claims one.

---

## 7. DO NOT REPEAT

Verified, closed and expensive. Re-running any of these burns budget for no gain
unless its `STALE_IF` in the tracker has actually fired.

- Reading all six production contracts at `c316e047`, field by field.
- Canonical gold reconciliation: 8 variables via alias chains, 802 solid paints mapped **by role** with each paint's own opacity preserved, 160 gradient stops with their internal separation preserved, and 434 one-off literals classified by hue, saturation and lightness. `#bb9d8e` and `#e9a7ad` were deliberately excluded as warm greys.
- Typeface conversion — 1,380 nodes across 8 pages, D-04 closed.
- Blur-ladder single-sourcing at 16/22/30/36 and binding every Material background-blur radius, D-02 closed.
- The 22 Figma clipping faults and their root cause: a queue container sitting FILL-vertical inside a content-driven vertical parent starves to 1px the moment a sibling grows. Repaired, then rescanned to zero.
- Public Lending contract reconstruction and the removal of the false sign-in gate.
- Public Request reconstruction, including PR-02 and PR-03.
- Staff Request Center: submission region, queue columns, server pager, composite panel, and the per-line routing rebuild with no pre-selected default.
- Status-vocabulary reconciliation, 2026-08-20: 148 nodes across the Figma design file and its component library brought onto production's `STATUS_LABELS`.
- The eight-width responsive sweep and the two real defects it found — the portal nav vanishing below 768, and the sticky bar obscuring 14 controls.
- Real keyboard acceptance and accessibility-tree acceptance, including the 11 controls that were invisible but still enabled and still in the form payload.
- Institutional Glass token mapping, 21 properties, Figma to code, zero drift.

One methodological finding is worth carrying forward: **drift does not propagate,
it recurs.** The same wrong route vocabulary appeared independently in the Figma
design, the Figma component library, Figma Make and the local prototype. Each was
found only by checking against production — never by checking one layer against
another.

---

## 8. Accepted residuals

| ID | Item | Status |
|---|---|---|
| `FD-COLOUR` | 54 historically inferred colours on page 15 | **NONBLOCKING_HISTORICAL_EVIDENCE_GAP.** A 2026-08-19 contrast sweep that ignored gradient and image fills recoloured 294 nodes; 206 were restored by exact twin match, 23 by empirical role mapping, and 54 by inference. The node ids were never recorded, so the set cannot be identified even with perfect version history. A count is not a record. It does not affect any verified current-authority surface. Resolvable only with the Figma REST API and an owner-issued token, or a manual version diff |
| `MK-01` | Figma Make live version vs recorded evidence | **CLOSED 2026-08-20.** Opened at Version 36 through a signed-in browser session. v36 edited exactly two files, `LendingHubRoute.tsx` (+23/-3) and `ReleaseDeskRoute.tsx` (+2/-1), both labelled "Fix TypeScript build error". `PublicFlows.tsx` is untouched by v36 and its lines 1-789 are byte-identical to the committed source: 50,587 chars, FNV-1a `d7cb6c66`. The live file adds one trailing comment line. `LendingHubRoute.tsx` still declares the consumable/reusable verb split and the six Lending Hub states including Permission limited. The four `FM-*` gates are restored |
| `MK-02` | Figma Make carried its own palette | **CLOSED 2026-08-20, Make v37.** The canonical override was appended to Make's `theme.css` and saved. `--gold-vivid` resolves to `#D4AF37` in light and `#E1C671` in dark; no superseded value survives the cascade in either mode. It had to be much larger than a gold rename: `.dark` hardcoded the whole glass ladder (`#1c1917`…`#3d3530`), built surfaces from oxblood (`--background: var(--oxblood-deep)`, `--card`/`--popover`/`--sidebar`: `#2a0508`), and both blocks baked the old golds into `rgba(232,185,60,…)` / `rgba(242,209,92,…)` literals. Verify with `npm run design:make-verify` |
| `MK-03` | Make route files painted with literal hexes | **CLOSED 2026-08-20, Make v37.** All **44** superseded occurrences replaced by semantic role across four route files — not the 33 first counted; the extra 11 were `rgba()` forms of the same values. `RequestCenterRoute.tsx` went from reading zero CSS variables to reading them through its `ap()` helper. Built by `scripts/design/build-make-routes.mjs`, which asserts a match count per named substitution, refuses to emit if any superseded value survives, and parse-checks every output |
| `MK-04` | Make per-line route select did not match Production | **CLOSED 2026-08-20, Make v37.** Fixed from Product truth, not by adding the missing option: the fixture gained `itemId`, `type` and `catalogType`, and `permittedRoutes(request, line)` now mirrors `src/visual/runtime.js`. Proven identical to Production across all 10 request/line combinations. The empty disabled placeholder is retained, so no route is preselected |
| `MK-05` | Adoption made the Make landing hero dark-on-dark | **CLOSED 2026-08-20, Make v38.** Caused by this work and found by looking at the page, not by a token check — every value involved was individually correct. The landing atrium referenced the brand palette live (`--atrium-ink: var(--paper-warm)`), which only worked because that palette had been `:root`-only and therefore near-white everywhere. Giving it a real dark mode turned the hero title into the L\* 15 work plane. All nine `--atrium-*` tokens are pinned to their light values in both modes, and `verify-make-theme.mjs` now asserts it |
| `MK-06` | Make landing sections below the hero may not respond to dark mode | **CLOSED 2026-08-20 — premise disproven.** Resolved by cascade, as V-41 requires. The lower sections **do** theme: all 20 colour tokens they consume resolve differently in dark than in light. The near-white section that raised this was a frame captured mid-rebuild while Make showed "Live preview loading" — the exact mistake V-41 exists to prevent. The diagnosis did find something real but smaller: nine atrium rules painted from the modal brand palette instead of the pinned `--atrium-*` family. No contrast failure in either mode, but drift on a section D41 pins, so the pin is now scoped to `.digital-atrium`. Intended model is **C — photographic chrome pinned, reading planes theme**, per D12 and D41.2. Verified by `npm run design:make-landing` — 31/31 conform |
| `FD-TOKENS-RESIDUAL` | About 18% of active solid paints unbound | **Accepted.** Deliberately stopped on the owner's direction that semantic correctness outranks binding percentage. The residual is one-off ink and hairline values, each needing a role decision rather than a mechanical bind. Do not force-bind a colour to move a number |
| `SCREEN_READER_RUNTIME` | Not separately performed | **Accepted, and not claimed anywhere** |
| `HALLMARK` | Bounded closure pass, 2026-08-20 | `docs/design/HALLMARK_IMPECCABLE_CLOSURE.md` |
| `IMPECCABLE` | Bounded closure pass, 2026-08-20 | `docs/design/HALLMARK_IMPECCABLE_CLOSURE.md` |
| `PDC-01` | One production defect candidate, recorded and deliberately **not** fixed | Parity audit §16 |

Two design decisions carry unaccepted contract deltas, repeated here because they
are the likeliest things to be implemented by accident: the removal of
`pickupDate`, and the search-first catalog. Both need an accepted amendment.

---

## 9. Recommended next task for Codex

**Do not implement everything.** The next program is an intake, and it stays
read-only until a specification is accepted.

```text
FRONTEND DESIGN ADOPTION INTAKE

read-only first

  current product HEAD
    vs  the frozen Figma design baseline   DESIGN_BASELINE_2026-08-20-D
    vs  frontend-design-integration at the exact ending SHA
    vs  Figma Make rP9W9MQlZkyQrUx38TVsFS at Version 36
    vs  the current product tests

produce an adoption specification that:
  maps reusable prototype code against design-only prototype code
  identifies contract-safe slices
  names every contract delta needing an owner amendment
  states its own rollback

do not modify product code until that specification is accepted
```

Suggested implementation order once a specification exists — reconcile it against
the current release state before executing, because v0.8.3 is live work:

```text
1. foundations and tokens
2. shared shell
3. Public Lending
4. Public Request
5. Staff Request Center
6. Internal Lending
7. Overview / Inventory / Release
8. remaining operational surfaces
```

---

## 10. Where everything else lives

| Question | Owner |
|---|---|
| Progress and completion | `docs/design/DESIGN_EXECUTION_TRACKER.md` — the only file permitted to state a percentage, and it is derived |
| Production contracts and every drift entry | `docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md` |
| Figma and Make file state, defects D-01…D-08, the incident record | `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md` |
| Named baselines | `docs/design/FIGMA_BASELINE_REGISTER.md` |
| WCAG 2.2 AA acceptance | `docs/design/ACCESSIBILITY_ACCEPTANCE.md` |
| Hallmark and Impeccable closure | `docs/design/HALLMARK_IMPECCABLE_CLOSURE.md` |
| Durable design authority — tokens, components, module rules, D-sections | `DESIGN.md` |
| Index of every design document and its status | `docs/design/README.md` |

Claude chat history is **not** required to continue this project. If something in
it is needed and is not in one of the files above, that is a defect in this
handoff — record it rather than reconstructing from a conversation.
