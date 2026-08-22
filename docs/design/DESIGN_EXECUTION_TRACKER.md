# HAU-USC Logistics — Design Execution Tracker

**This file is the single canonical progress record for the frontend-design
stream.** No other document may state a completion percentage. `DESIGN.md`,
`docs/WORK_CONTINUATION.md` and the design audits point here.

The percentage below is **derived, never typed**. It is produced by:

```bash
node scripts/design/design-tracker.mjs
```

The script parses the gate table, sums the weight of gates whose status is
exactly `VERIFIED`, divides by the total mandatory weight, and rewrites the
derived block. It exits non-zero if the table claims 100% without satisfying
every hard condition in §"100% is a hard gate". Do not edit the derived block
by hand — the script overwrites it.

## Baselines — author-owned

The script reads these verbatim into the derived block. They live above it
because the derived block is overwritten on every run; a value that only exists
inside it cannot survive.

```text
CURRENT PHASE:          Frozen — Make v36 functional contract re-verified live; canonical theme patch generated and cascade-verified, provider write withheld behind an unowned unsaved edit
BASELINE PRODUCTION:    0.8.2 @ c316e047 · schema 30
BASELINE FIGMA DESIGN:  hXJElH4p72KfgAaoUyfNOC @ DESIGN_BASELINE_2026-08-20-D (Figma mirror: 55:3 / 568:2 / 691:2)
BASELINE FIGMA MAKE:    rP9W9MQlZkyQrUx38TVsFS @ Version 38 (canonical theme ADOPTED and verified)
BASELINE DESIGN BRANCH: frontend-design-integration @ c130ab9 (pushed)
LAST COMPUTED:          2026-08-20 (Asia/Manila)
```

## Derived progress

<!-- DERIVED:BEGIN -->
```text
OVERALL VERIFIED:       97%
GATES:                  49 VERIFIED · 1 IN_PROGRESS · 0 NOT_STARTED · 0 NEEDS_REVERIFY · 1 BLOCKED
MANDATORY WEIGHT:       100.0
VERIFIED WEIGHT:        97.0
CURRENT PHASE:          Frozen — Make v36 functional contract re-verified live; canonical theme patch generated and cascade-verified, provider write withheld behind an unowned unsaved edit
BASELINE PRODUCTION:    0.8.2 @ c316e047 · schema 30
BASELINE FIGMA DESIGN:  hXJElH4p72KfgAaoUyfNOC @ DESIGN_BASELINE_2026-08-20-D (Figma mirror: 55:3 / 568:2 / 691:2)
BASELINE FIGMA MAKE:    rP9W9MQlZkyQrUx38TVsFS @ Version 38 (canonical theme ADOPTED and verified)
BASELINE DESIGN BRANCH: frontend-design-integration @ c130ab9 (pushed)
LAST COMPUTED:          2026-08-20 (Asia/Manila)
100% ELIGIBLE:          NO — 2 mandatory gates not VERIFIED
```
<!-- DERIVED:END -->

## Status vocabulary

Only these five values are legal. Only `VERIFIED` earns weight.

| Status           | Meaning                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `NOT_STARTED`    | No work has begun on this gate                                                          |
| `IN_PROGRESS`    | Work has begun; acceptance not met                                                      |
| `NEEDS_REVERIFY` | Was verified; a recorded `STALE_IF` condition fired. **Weight is removed immediately.** |
| `BLOCKED`        | Cannot proceed without an owner decision or access                                      |
| `VERIFIED`       | Acceptance met **and** evidence recorded in the Evidence column                         |

## Gate table

Weights are subdivisions of the nine weighted areas. Area totals are fixed;
sub-gate weights inside an area may be re-proportioned, but the area total may
not change without an owner decision.

### Area 1 — Production contract reconciliation · 15.0

| Gate                                              | Weight | Status   | Baseline                                                | STALE_IF                                              | Evidence         |
| ------------------------------------------------- | ------ | -------- | ------------------------------------------------------- | ----------------------------------------------------- | ---------------- |
| `PC-LEND` Public Lending contract                 | 3.0    | VERIFIED | `c316e047:src/visual/public-lending-portal.js`          | production lending module changes                     | Parity audit §3  |
| `PC-REQ` Public Request contract                  | 3.0    | VERIFIED | `c316e047:src/visual/public-requester-portal.js`        | production public request module changes              | Parity audit §5  |
| `PC-AUTHREQ` Authenticated requester contract     | 2.5    | VERIFIED | `c316e047:src/visual/requester-portal.js`               | `/api/portal/request*` contract changes               | Parity audit §12 |
| `PC-STAFFREQ` Staff Request contract              | 2.5    | VERIFIED | `c316e047:views/request.html` + `runtime.js` review fns | `permittedRoutes()` or review queue changes           | Parity audit §10 |
| `PC-LENDHUB` Internal Office Lending Hub contract | 2.0    | VERIFIED | `c316e047:views/lending.html` + `renderLending*`        | lending tabs, derived status or ticket actions change | Parity audit §14 |
| `PC-RELEASE` Release Desk relationship contract   | 2.0    | VERIFIED | `c316e047:views/release.html` + `bindReleaseEvents`     | release feeds or scope model change                   | Parity audit §15 |

### Area 2 — Public Lending parity · 10.0

| Gate                                                                      | Weight | Status         | Baseline                                 | STALE_IF                                 | Evidence                                                           |
| ------------------------------------------------------------------------- | ------ | -------------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `PL-ACCESS` No-login access model corrected everywhere                    | 2.5    | VERIFIED       | DESIGN.md D24.0 OWNER-LOCKED             | any frame gates borrowing behind sign-in | 4 frames superseded; `PublicFlows.tsx` replaced                    |
| `PL-FIGMA-DESKTOP` 1440 light + dark, both borrower branches              | 2.5    | VERIFIED       | Figma page 90 `581:15` `587:15` `589:15` | node edits on page 90                    | Parity audit §8                                                    |
| `PL-FIGMA-STATES` Four declared catalog states                            | 1.5    | VERIFIED       | Figma `591:15`                           | catalog state contract changes           | Parity audit §8                                                    |
| `PL-FIGMA-MOBILE-DARK` Public Lending 390 light and dark | 1.0 | VERIFIED | Figma `592:15` light, `657:350` dark | node edits on page 90 | Dark built by explicit variable modes; **0 unbound fills** in the clone |
| `PL-FIGMA-MOBILE-BRANCH` Angelite branch at 390 | 0.5 | VERIFIED | Figma `659:15` | borrower model changes | Council-only fields replaced by academic identity per the owner-locked basic-information-sheet model; student card selected; placeholders corrected; 0 overflow, 0 unbound fills |
| `PL-MAKE` Make renders the corrected lending flow | 1.0 | VERIFIED | Make `rP9W9MQlZkyQrUx38TVsFS` v35 | `PublicFlows.tsx` changes | Audit §29.1: live file byte-identical to the verified local implementation (FNV-1a `9fc9266`, 50,587 chars). No-login model and search-first catalog present |
| `PL-IMPL` Design-branch implementation                                    | 1.0    | VERIFIED       | `prototypes/public-portals-r3/`          | prototype source changes                 | Search-first catalog, basic-information-sheet borrower model       |

### Area 3 — Public Request parity · 10.0

| Gate                                                       | Weight | Status      | Baseline                                       | STALE_IF | Evidence                                            |
| ---------------------------------------------------------- | ------ | ----------- | ---------------------------------------------- | -------- | --------------------------------------------------- |
| `PR-DIFF` Field-by-field diff against contract | 3.0 | VERIFIED | Parity audit §5 | public request module changes | Audit §21; 20 contract elements diffed, PR-02 and PR-03 raised |
| `PR-FIGMA-VARIANTS` Intake at 1440 and 390, light and dark | 2.0 | VERIFIED | Figma `626:2` `639:2` `654:2` `657:2` | node edits on the intake frames | 390 is a real transformation: 16 rows stacked, step rail wrapped, 0 overflow, 0 overlap, 0 unbound fills in both dark clones |
| `PR-FIGMA-STATES` Intake loading / empty / error / unavailable | 1.0 | VERIFIED | Figma `658:2` `658:14` `658:28` `658:42` | the module changes a declared state | Four state frames built, each carrying production wording. Empty source and service error are deliberately distinguishable |
| `PR-MAKE` Make parity | 2.0 | VERIFIED | Make v35 | `PublicFlows.tsx` changes | Same source as PL-MAKE; public request flow present with no sign-in gate. Audit §29.1 |
| `PR-IMPL` Design-branch implementation | 2.0 | VERIFIED | Parity audit §5 | public request contract changes | Audit §25: private verified related-request lookup, lead-time warning, 500-char purpose, disabled sub-event. Both routes render-checked |

### Area 4 — Authenticated / Staff Request parity · 10.0

| Gate                                                        | Weight | Status      | Baseline                           | STALE_IF             | Evidence                             |
| ----------------------------------------------------------- | ------ | ----------- | ---------------------------------- | -------------------- | ------------------------------------ |
| `SR-ROUTES` Route vocabulary matches `permittedRoutes()`    | 2.0    | VERIFIED    | `runtime.js` `REVIEW_ROUTE_LABELS` | route labels change  | Parity audit §13.2, §13.3            |
| `SR-PERLINE` Per-line decision, no pre-selected default     | 2.0    | VERIFIED    | RV-01.6                            | review modal changes | Figma `300:624` rebuilt; audit §13.2 |
| `SR-QUEUE` Queue admits only For Review / Needs Information | 1.0    | VERIFIED    | `reviewQueueRows()`                | queue filter changes | Audit §13.4                          |
| `SR-FORM` Submission form region exists in Figma | 2.0 | VERIFIED | Parity audit §10.1 | `views/request.html` field set changes | Figma `615:2`; audit §17.1 |
| `SR-COLUMNS` Queue column set + server pager | 1.0 | VERIFIED | Parity audit §10.3 | queue columns or pagination change | Requester identity restored; pager `616:2`; audit §17.2–17.3 |
| `SR-COMPOSITE` Composite request panel represented | 1.0 | VERIFIED | Parity audit §10.2 | composite feature contract changes | Figma `628:2`; audit §22 |
| `SR-CTXB` Authenticated requester portal built | 1.0 | VERIFIED | Parity audit §12 | `/api/portal/request*` contract changes | Figma `624:2`; audit §20 |

### Area 5 — Figma Design completion · 15.0

| Gate                                                      | Weight | Status      | Baseline             | STALE_IF                                                | Evidence                                                                |
| --------------------------------------------------------- | ------ | ----------- | -------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `FD-STRUCTURE` No clipped authored content, document-wide | 4.0    | VERIFIED    | full-document scan   | any frame gains a fixed height smaller than its content | 22 clipping faults repaired; re-scan returns 0                          |
| `FD-TOKENS-GOLD` Canonical gold reconciled system-wide | 2.0 | VERIFIED | `DESIGN.md` D08.0, owner decision 2026-08-19 | the canonical gold changes | Audit §28: 8 variables, 802 solid paints, 160 gradient stops and 434 one-off literals reconciled by role. Zero superseded gold values remain. 66/66 contrast |
| `FD-TOKENS-RESIDUAL` Remaining non-gold literals bound | 1.0 | IN_PROGRESS | 42,536 solid paints | new literal fills appear | Coverage re-measured 2026-08-20 at **81.8%** of 54,025 active solid paints, counting every paint in the document and testing each paint's own `boundVariables.color` — a stricter denominator than the 93.1% recorded on 2026-08-19, which measured a narrower node set. **Deliberately stopped here** on owner direction that semantic correctness outranks binding percentage — the residual 2,941 are one-off inks and hairlines each needing a role decision, not a mechanical bind |
| `FD-BLUR` Blur ladder reconciled with effect styles | 2.0 | VERIFIED | Material effect styles | any blur radius unbinds | D-02 closed at audit §19.1: variables set to 16/22/30/36 and every Material background-blur radius bound to its variable |
| `FD-TYPE` Typeface reconciliation | 2.0 | VERIFIED | census of 23,189 CURRENT-lane text nodes | a new off-system family appears | D-04 closed at audit §26: 1,380 nodes converted across 8 pages, 0 off-system remaining, baseline capture pages correctly excluded |
| `FD-COLOUR` 54 inferred colours on page 15 proven | 2.0 | BLOCKED | §3.1 incident record | — | The node ids of the 54 were never recorded, so the set cannot be identified even with history. Page 15 text fills are now **88% bound** to semantic roles by the later passes. Settling the original 54 needs the Figma REST API with an owner token, or a manual version diff |
| `FD-MODULES` Remaining module pages current | 2.0 | VERIFIED | document-wide vocabulary scan | a superseded route phrase reappears | Audit §31: 27 instances of superseded route vocabulary found across pages 12, 96 and 98 — including 20 in the component library — all corrected; re-scan returns 0 |

### Area 6 — Figma Make functional completion · 10.0

| Gate                                                   | Weight | Status      | Baseline          | STALE_IF       | Evidence                                        |
| ------------------------------------------------------ | ------ | ----------- | ----------------- | -------------- | ----------------------------------------------- |
| `FM-PUBLIC` Public flows current and building | 3.0 | VERIFIED | Make v36 `PublicFlows.tsx` | the live Make version leaves v36 | 790 lines. **2026-08-20 v36 RE-VERIFIED** through a signed-in browser session: v36 edited exactly two files, `LendingHubRoute.tsx` (+23/-3) and `ReleaseDeskRoute.tsx` (+2/-1), both labelled "Fix TypeScript build error". `PublicFlows.tsx` is **untouched by v36** and its lines 1-789 are byte-identical to `prototypes/public-portals-r3/figma-make/src/app/PublicFlows.tsx`: 50,587 chars, FNV-1a `d7cb6c66`, verified by per-line and per-block hash. The live file appends one trailing comment line. No-login model and search-first catalog present. Audit §29.1 |
| `FM-INTERNAL-ROUTES` Internal modules represented and reconciled | 2.0 | VERIFIED | Make v36 `appRoutes.ts` + route files | the live Make version leaves v36 | **2026-08-20 CLOSED at v36.** `appRoutes.ts` read directly from the live file and captured (1,047 chars, 43 lines): ten internal routes — overview, inventory, request-center, lending, release, restocking, procurement, events, administration, profile — with `AUTH_ROUTE_INTENT_LABELS` naming request-center "Staff Request Center". `LendingHubRoute.tsx` and `ReleaseDeskRoute.tsx` also read and hashed at v36. Route representation is established by `appRoutes.ts`, which carries no pending edit. **Caveat, deliberately not hidden:** `RequestCenterRoute.tsx` still holds an unsaved third-party edit (+28/-16), so that one file was read as its working buffer rather than as saved v36 — the buffer does carry all five production review routes with `defaultValue=""`. Adoption packet §2.1, §5 |
| `FM-INTERNAL-LIFECYCLE` Lending lifecycle and per-line review in Make | 2.0 | VERIFIED | Make v36 route files | the live Make version leaves v36 | **2026-08-20 v36 RE-VERIFIED** through a signed-in browser session: v36 edited exactly two files, `LendingHubRoute.tsx` (+23/-3) and `ReleaseDeskRoute.tsx` (+2/-1), both labelled "Fix TypeScript build error". `LendingHubRoute.tsx` read directly at v36: it declares `kind?: "reusable" | "consumable"` with the comment "Production splits the verb: a consumable is issued, a reusable is handed off", and rows carry production `state` vocabulary. The consumable/reusable verb split is present in the live file. Audit §32 |
| `FM-STATES` Loading / empty / error / denied exercised | 3.0 | VERIFIED | Make v36 route files | the live Make version leaves v36 | **2026-08-20 CLOSED at v36.** Both files read directly from the live document and captured with hashes. `LendingHubRoute.tsx` (22,816 bytes, sha256 `2132c68c…`) declares `type Preview = "Default" \| "Loading" \| "Filtered empty" \| "Page error" \| "Stale data" \| "Permission limited"` — six states including Permission limited. `ReleaseDeskRoute.tsx` (21,957 bytes, sha256 `7c92b483…`) declares `type Prev` with **eleven** states: Populated · Focused task · Required correction · Loading · Empty · Filtered empty · Stale revision · Denied · Unavailable · Validation error · Confirmed success. The previously recorded "nine" was a floor from partial v35 evidence; the live superset is now counted rather than assumed. Neither file carries a pending edit, so both readings are saved v36 |

### Area 7 — Institutional Glass + shared design system · 10.0

| Gate                                                 | Weight | Status      | Baseline                                 | STALE_IF                   | Evidence                                                                         |
| ---------------------------------------------------- | ------ | ----------- | ---------------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `IG-LADDER` G0–G4 optical ladder defined | 2.0 | VERIFIED | `prototypes/shared/hau-theme.css` | ladder values change | Second generation: fill up and blur down at every step (G2 0.34/22px -> 0.52/14px). Values generated from `scripts/design/theme-source.mjs`; G4 alone carries the gold edge |
| `IG-TOKENS` Glass tokens reconciled Figma ↔ code | 2.0 | VERIFIED | Glass Material collection ↔ `glass.css` | either side changes a value | Audit §23: 7 existing tokens verified zero-drift, 10 created, correspondence table written into `glass.css` |
| `IG-ZONES` No-glass zones honoured on dense surfaces | 1.5 | VERIFIED | live DOM audit both themes | new glass surface appears | 0 dense elements on transmissive panes across 4 panes in both themes; no nested panes; max blur 22px; ground fixed, inert and aria-hidden |
| `IG-PERF` Performance fallbacks                      | 1.5    | VERIFIED    | `glass.css` media queries                | new nested backdrop-filter | `prefers-reduced-transparency`, mobile two-field fallback, no glass-behind-glass |
| `IG-A11Y` Glass contrast in both modes | 1.5 | VERIFIED | `scripts/design/contrast-audit.mjs` | glass or palette change | Text on G2 and G4 glass composited over the brightest field measures 8.05–13.84:1 across both themes; all pass |
| `IG-COMFORT` THEME_COMFORT_AND_ENVIRONMENT | 1.5 | VERIFIED | `scripts/design/comfort-audit.mjs` + `overlay-contrast.mjs` | any surface, field or glass value changes | Light checked, dark checked, background checked, glass checked, contrast rerun, responsive checked. **88/88** captures inside the comfort bar across 11 surfaces x 2 themes x 4 widths — including the command overlay, the one surface the matrix kept missing because it does not exist until something opens it. 5 captures pass by two waivers, each named in the script with a reason and printed in the report. Text over photography, gradients and glass measured against actual backdrop pixels: 134/134, worst 4.87:1. Before this pass 0/80 were inside the bar |

### Area 8 — Responsive + accessibility · 10.0

| Gate                                                            | Weight | Status      | Baseline      | STALE_IF            | Evidence                                                      |
| --------------------------------------------------------------- | ------ | ----------- | ------------- | ------------------- | ------------------------------------------------------------- |
| `RA-WIDTHS` 320/375/390/414/768/1024/1440/1920 matrix | 3.0 | VERIFIED | `npm run design:responsive` | any layout or breakpoint change | Re-measured 2026-08-20 after the theme pass: **80/80** width x theme x surface combinations, zero horizontal overflow at all eight widths in both themes across 5 surfaces, zero clipped glass panes, navigation reachable everywhere. Overflow is measured as `scrollWidth` exceeding `clientWidth`, not as element geometry — an off-canvas drawer is a technique, not a defect |
| `RA-TABLES` Per-table narrow-width strategy | 2.0 | VERIFIED | six `desktop-table` tables in `runtime.js` | a table gains or loses a column | `DESIGN.md` D29.1: comparison key, identity, kept-in-card and moved-to-detail declared for all six |
| `RA-A11Y-STATIC` Contrast, structure, reflow, target size | 2.0 | VERIFIED | `scripts/design/contrast-audit.mjs` + DOM checks | any token or markup change | `ACCESSIBILITY_ACCEPTANCE.md`: 66/66 contrast pairs pass both themes; 10 initial 1.4.11 failures fixed; skip link, main landmark, describedby wiring, aria-invalid added |
| `RA-A11Y-AT` Keyboard traversal and semantic acceptance | 1.0 | VERIFIED | `npm run design:keyboard` + `design:semantics` | markup, focus or ARIA changes | Real Playwright keys: 32/32 across 2 routes × 2 widths. Accessibility tree via CDP: 30/30. Found and fixed 11 hidden-but-enabled controls. Screen-reader runtime still not run and not claimed |
| `RA-MOTION` Motion families applied and reduced-motion honoured | 2.0    | VERIFIED    | DESIGN.md D13 | motion token change | `--m-response/state/surface/overlay`, reduced-motion override |

### Area 9 — Documentation + final handoff · 10.0

| Gate                                                           | Weight | Status      | Baseline                     | STALE_IF                  | Evidence                                                   |
| -------------------------------------------------------------- | ------ | ----------- | ---------------------------- | ------------------------- | ---------------------------------------------------------- |
| `DOC-CONTRACT` Contract docs describe current truth | 3.0 | VERIFIED | Parity audit §1–§25 | any production module changes | All six surfaces recorded from the deployed commit: Public Lending §3, Public Request §5, Staff Request §10, Authenticated Requester §12, Lending Hub §14, Release Desk §15 |
| `DOC-CONSOLIDATE` Obsolete Impeccable generations consolidated | 2.0 | VERIFIED | `docs/design/README.md` | a new generation appears | Index declares the current owner per question and marks v1–v4.1 superseded; files deliberately not moved because an accepted spec references the paths |
| `DOC-TRACKER` One canonical derived tracker                    | 2.0    | VERIFIED    | this file                    | competing tracker appears | Created; `DESIGN.md` and `WORK_CONTINUATION.md` point here |
| `DOC-BASELINE` Final Figma + branch baseline recorded | 3.0 | VERIFIED | `FIGMA_BASELINE_REGISTER.md` | any Figma or branch change | Baseline 2026-08-20-C recorded by content identity: 28 pages, 136 variables, 102 components (86 + 16 sets), 11 text styles, 9 effect styles, 0 superseded gold in any live lane, 81.8% of 54,025 active solid paints bound |

## 100% is a hard gate

The script refuses to emit `100%` unless **all** of these hold:

```text
every mandatory gate = VERIFIED
P0 = 0
P1 = 0
unresolved HIGH production/Figma drift = 0
production functional baseline recorded
final Figma Design version recorded
final Figma Make checkpoint recorded
design branch implementation verified
Institutional Glass complete
Hallmark complete
Impeccable complete
responsive matrix complete
accessibility acceptance complete
documentation reconciled
final global audit passed
```

## Open severity register

| ID    | Severity | Item                                            | Status |
| ----- | -------- | ----------------------------------------------- | ------ |
| PR-02 | HIGH | Intake claimed the tracking reference is emailed; production shows it once and never emails it | CLOSED — audit §21.2, corrected in `626:2` |
| PR-03 | MEDIUM | Intake offered "Save and review later"; no draft persistence exists | CLOSED — frame superseded |
| SR-05 | MEDIUM | Queue column set differs from production | CLOSED — requester identity restored; row-selection interaction accepted |
| SR-07 | MEDIUM | Composite requests represented nowhere | CLOSED — audit §22 |
| SR-08 | MEDIUM | No pager on a server-clamped queue | CLOSED |
| D-02  | MEDIUM   | Blur variables do not bind to effect styles     | CLOSED — audit §19.1; ladder single-sourced at 16/22/30/36 |
| D-04  | MEDIUM   | Figma renders Inter against mandated typefaces  | CLOSED — audit §26; 1,380 nodes converted, 0 off-system remain |
| D-05  | MEDIUM   | File-wide variable-binding coverage unproven    | CLOSED — measured 81.8% of 54,025 active solid paints; the residual is characterised, not unknown |
| §3.1  | MEDIUM   | 54 inferred colours on page 15 unproven         | OPEN — `FD-COLOUR`, unidentifiable; see §30 |
| SV-01 | MEDIUM   | Invented request/lending status vocabulary in live lanes | CLOSED — audit §33; 148 nodes reconciled to production's `STATUS_LABELS` |
| MK-01 | MEDIUM | Live Figma Make is at Version 36; v35 evidence not re-confirmable | CLOSED — 2026-08-20. Opened v36 in a signed-in session. `PublicFlows.tsx` byte-identical to the committed source (50,587 chars, FNV-1a `d7cb6c66`); v36 touched only two internal route files under a TypeScript-fix label |
| MK-02 | MEDIUM | Figma Make carried a third palette whose gold was `#E8B93C` | **CLOSED 2026-08-20 — adopted under OWNER_AUTHORIZED_DESIGN_STREAM_ADOPTION.** The generated override was appended to Make's `src/styles/theme.css` and saved as **Version 37**. `verify-make-theme.mjs` replays the cascade against the saved artifact: `--gold-vivid` resolves to `#D4AF37` in light and `#E1C671` in dark, and no superseded value survives in either mode. The saved file hashes to the locally built artifact |
| MK-03 | MEDIUM | Make route files painted with literal hexes instead of reading the theme tokens | **CLOSED 2026-08-20 at Version 37.** All **44** superseded occurrences replaced by semantic role — not 33 as first recorded. The extra 11 were in `rgba()` form (`rgba(232,185,60,…)` = `#E8B93C`, `rgba(111,90,96,…)` = `#6F5A60`), the same way the value hid inside `theme.css`; a hex-only sweep would have left a quarter of the work. `RequestCenterRoute.tsx` now reads tokens through its `ap()` helper instead of returning literals. Built by `build-make-routes.mjs`, which asserts a match count per named substitution and refuses to emit if any superseded value survives |

| MK-03 | MEDIUM | Make route files paint with literal hexes instead of reading the theme tokens, so `theme.css` adoption cannot fully retheme them | OPEN — measured on live v36: `PublicFlows.tsx` 6 superseded literals of 44, `LendingHubRoute.tsx` 3 of 18, `ReleaseDeskRoute.tsx` 3 of 17, and **`RequestCenterRoute.tsx` 21 of 72 while reading zero CSS variables** — its colours come from a local `ap(dark)` helper and it carries 13 occurrences of `#e8b93c`. That last file is also the one holding the unsaved third-party edit, so it was left untouched. Adoption packet §4 |
| MK-04 | LOW | Make per-line route select did not match production's derived route set | **CLOSED 2026-08-20 at Version 37.** Fixed from Product truth rather than by adding the missing option: `ReqLine` gained `itemId`, `ReqItem` gained `type` and `catalogType`, and `permittedRoutes(request, line)` now mirrors `src/visual/runtime.js`. Proven equivalent to Production across all 10 request/line combinations. The empty disabled placeholder is retained, so no route is preselected |

| MK-05 | HIGH | Canonical adoption made the Make landing hero unreadable — dark title on a dark photograph | **CLOSED 2026-08-20 at Version 38.** Caused by this work, found by looking at the rendered page rather than by any token check, because every value involved was individually correct. Make's landing atrium wrote its chrome as live references to the brand palette (`--atrium-ink: var(--paper-warm)`), which worked only because the original theme declared that palette in `:root` **only** — it was near-white everywhere, including inside a `.dark` subtree. Giving the palette a real dark mode turned `--atrium-ink` into the L\* 15 work plane. All nine `--atrium-*` tokens are now pinned to their light-palette values in both modes, which is what "permanently dark chrome" should always have meant. `verify-make-theme.mjs` now asserts `--atrium-ink` and `--atrium-muted` resolve light in both modes, so it cannot come back silently |
| MK-06 | LOW | Make landing sections below the hero may not respond to dark mode | **CLOSED 2026-08-20 — premise disproven, plus a real but minor finding.** Resolved by cascade rather than by eye, as DESIGN.md V-41 requires ("reproduction and token/cascade diagnosis for any mismatched colour state; do not guess from a screenshot"). **The lower sections do theme.** All 20 colour tokens they consume — `--foreground`, `--muted-foreground`, `--g1-soft`…`--g4-focus`, `--border`, `--input-background`, `--destructive`, the glass shadows and borders — resolve to a different value in dark than in light. The near-white section in the original observation was a mid-rebuild frame, captured while Make was showing "Live preview loading". That is exactly the failure mode V-41 exists to prevent, and it was mine. **What the diagnosis did find:** nine atrium rules painted straight from the modal brand palette (`--gold-mid`, `--gold-cream`, `--oxblood-deep`, `--oxblood-mid`) instead of through the pinned `--atrium-*` family — the hero eyebrow and plane label, the CTA labels, the path steps, and the opaque glass fallbacks under `@supports not (backdrop-filter)` and `prefers-reduced-transparency`. None fails contrast in either mode; that was measured. But they drift on a section D41 pins, so a reduced-transparency user would see a different hero in dark than in light. Repaired by scoping the pin to `.digital-atrium` in the generated override — no new literals, no edit to Make's own stylesheet, and the four stay correctly modal everywhere else. `verify-make-landing-theme.mjs` now checks both halves of the model: pinned chrome must NOT move, reading planes MUST. **31/31 conform.** The intended model is therefore **C — photographic chrome pinned, reading planes theme** — established from DESIGN.md D12 (light and dark are "equal CURRENT modes", V-36 forbids "mixed-theme frames") and D41.2 |

No P0 is open. No production defect candidate is open.
