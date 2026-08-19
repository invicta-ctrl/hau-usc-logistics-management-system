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
CURRENT PHASE:          Phases A, C and E closed — Phase D/F module build next
BASELINE PRODUCTION:    0.8.2 @ c316e047 · schema 30
BASELINE FIGMA DESIGN:  hXJElH4p72KfgAaoUyfNOC
BASELINE FIGMA MAKE:    rP9W9MQlZkyQrUx38TVsFS
BASELINE DESIGN BRANCH: frontend-design-integration
LAST COMPUTED:          2026-08-19 (Asia/Manila)
```

## Derived progress

<!-- DERIVED:BEGIN -->
```text
OVERALL VERIFIED:       76.5%
GATES:                  36 VERIFIED · 9 IN_PROGRESS · 1 NOT_STARTED · 1 NEEDS_REVERIFY · 0 BLOCKED
MANDATORY WEIGHT:       100.0
VERIFIED WEIGHT:        76.5
CURRENT PHASE:          Phases A, C and E closed — Phase D/F module build next
BASELINE PRODUCTION:    0.8.2 @ c316e047 · schema 30
BASELINE FIGMA DESIGN:  hXJElH4p72KfgAaoUyfNOC
BASELINE FIGMA MAKE:    rP9W9MQlZkyQrUx38TVsFS
BASELINE DESIGN BRANCH: frontend-design-integration
LAST COMPUTED:          2026-08-19 (Asia/Manila)
100% ELIGIBLE:          NO — 11 mandatory gates not VERIFIED
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
| `PL-FIGMA-MOBILE` 390 light **and dark**, Angelite at 390, states in dark | 1.5    | IN_PROGRESS    | Figma `592:15`                           | —                                        | 390 light built; dark and Angelite-at-390 absent                   |
| `PL-MAKE` Make renders the corrected lending flow                         | 1.0    | NEEDS_REVERIFY | Make `rP9W9MQlZkyQrUx38TVsFS`            | `PublicFlows.tsx` changes                | Source verified, build clean; **preview click-through unverified** |
| `PL-IMPL` Design-branch implementation                                    | 1.0    | VERIFIED       | `prototypes/public-portals-r3/`          | prototype source changes                 | Search-first catalog, basic-information-sheet borrower model       |

### Area 3 — Public Request parity · 10.0

| Gate                                                       | Weight | Status      | Baseline                                       | STALE_IF | Evidence                                            |
| ---------------------------------------------------------- | ------ | ----------- | ---------------------------------------------- | -------- | --------------------------------------------------- |
| `PR-DIFF` Field-by-field diff against contract | 3.0 | VERIFIED | Parity audit §5 | public request module changes | Audit §21; 20 contract elements diffed, PR-02 and PR-03 raised |
| `PR-FIGMA` Figma intake + tracking + error states complete | 3.0 | IN_PROGRESS | Figma `626:2` light, `639:2` dark, `300:2941` tracking | node edits on the intake frames | Five-step intake built light **and dark** (dark by explicit modes, 0 unbound fills in the clone). 390 and the four service states still open |
| `PR-MAKE` Make parity                                      | 2.0    | IN_PROGRESS | Make                                           | —        | Shares `PublicFlows.tsx`                            |
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
| `FD-TOKENS-RESIDUAL` Remaining non-gold literals bound | 1.0 | IN_PROGRESS | 41,777 solid paints | new literal fills appear | Coverage 93.0%. Residual 2,941 are one-off inks and hairlines on Landing and Overview, each needing a role decision |
| `FD-BLUR` Blur ladder reconciled with effect styles | 2.0 | VERIFIED | Material effect styles | any blur radius unbinds | D-02 closed at audit §19.1: variables set to 16/22/30/36 and every Material background-blur radius bound to its variable |
| `FD-TYPE` Typeface reconciliation | 2.0 | VERIFIED | census of 23,189 CURRENT-lane text nodes | a new off-system family appears | D-04 closed at audit §26: 1,380 nodes converted across 8 pages, 0 off-system remaining, baseline capture pages correctly excluded |
| `FD-COLOUR` 54 inferred colours on page 15 proven         | 2.0    | IN_PROGRESS | §3.1 incident record | —                                                       | 206 exact, 23 role-mapped, 54 inferred and unproven                     |
| `FD-MODULES` Remaining module pages current               | 2.0    | IN_PROGRESS | pages 20–99          | —                                                       | Overview, Inventory, Lending, Release partially reconciled              |

### Area 6 — Figma Make functional completion · 10.0

| Gate                                                   | Weight | Status      | Baseline          | STALE_IF       | Evidence                                        |
| ------------------------------------------------------ | ------ | ----------- | ----------------- | -------------- | ----------------------------------------------- |
| `FM-PUBLIC` Public flows current and building | 3.0 | IN_PROGRESS | `PublicFlows.tsx` in `rP9W9MQlZkyQrUx38TVsFS` | source changes | Access application removed and Staff sign in hand-off added, 799→790 lines, applied via CodeMirror transaction. **Save staged but blocked by a Figma connection issue** — audit §24 |
| `FM-INTERNAL` Internal modules represented             | 4.0    | NOT_STARTED | —                 | —              | —                                               |
| `FM-STATES` Loading / empty / error / denied exercised | 3.0    | IN_PROGRESS | —                 | —              | Declared in Design, not proven in Make          |

### Area 7 — Institutional Glass + shared design system · 10.0

| Gate                                                 | Weight | Status      | Baseline                                 | STALE_IF                   | Evidence                                                                         |
| ---------------------------------------------------- | ------ | ----------- | ---------------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `IG-LADDER` G0–G4 optical ladder defined             | 2.5    | VERIFIED    | `prototypes/public-portals-r3/glass.css` | ladder values change       | G0 ground + G1–G4 panes, HAU institutional fields                                |
| `IG-TOKENS` Glass tokens reconciled Figma ↔ code | 2.5 | VERIFIED | Glass Material collection ↔ `glass.css` | either side changes a value | Audit §23: 7 existing tokens verified zero-drift, 10 created, correspondence table written into `glass.css` |
| `IG-ZONES` No-glass zones honoured on dense surfaces | 2.0 | VERIFIED | live DOM audit both themes | new glass surface appears | 0 dense elements on transmissive panes across 4 panes in both themes; no nested panes; max blur 22px; ground fixed, inert and aria-hidden |
| `IG-PERF` Performance fallbacks                      | 1.5    | VERIFIED    | `glass.css` media queries                | new nested backdrop-filter | `prefers-reduced-transparency`, mobile two-field fallback, no glass-behind-glass |
| `IG-A11Y` Glass contrast in both modes | 1.5 | VERIFIED | `scripts/design/contrast-audit.mjs` | glass or palette change | Text on G2 and G4 glass composited over the brightest field measures 8.05–13.84:1 across both themes; all pass |

### Area 8 — Responsive + accessibility · 10.0

| Gate                                                            | Weight | Status      | Baseline      | STALE_IF            | Evidence                                                      |
| --------------------------------------------------------------- | ------ | ----------- | ------------- | ------------------- | ------------------------------------------------------------- |
| `RA-WIDTHS` 320/375/390/414/768/1024/1440/1920 matrix | 3.0 | VERIFIED | live browser measurement | any layout or breakpoint change | `ACCESSIBILITY_ACCEPTANCE.md`: zero overflow at all eight widths; portal nav no longer hidden below 768 |
| `RA-TABLES` Per-table narrow-width strategy | 2.0 | VERIFIED | six `desktop-table` tables in `runtime.js` | a table gains or loses a column | `DESIGN.md` D29.1: comparison key, identity, kept-in-card and moved-to-detail declared for all six |
| `RA-A11Y-STATIC` Contrast, structure, reflow, target size | 2.0 | VERIFIED | `scripts/design/contrast-audit.mjs` + DOM checks | any token or markup change | `ACCESSIBILITY_ACCEPTANCE.md`: 66/66 contrast pairs pass both themes; 10 initial 1.4.11 failures fixed; skip link, main landmark, describedby wiring, aria-invalid added |
| `RA-A11Y-AT` Keyboard traversal and screen-reader pass | 1.0 | IN_PROGRESS | DOM focus order + geometric obscuring check | markup or sticky-bar change | Focus order and 2.4.11 verified structurally; 14 controls were obscured by the sticky bar and are fixed. Real key walk and screen reader still outstanding — synthetic keys do not drive focus |
| `RA-MOTION` Motion families applied and reduced-motion honoured | 2.0    | VERIFIED    | DESIGN.md D13 | motion token change | `--m-response/state/surface/overlay`, reduced-motion override |

### Area 9 — Documentation + final handoff · 10.0

| Gate                                                           | Weight | Status      | Baseline                     | STALE_IF                  | Evidence                                                   |
| -------------------------------------------------------------- | ------ | ----------- | ---------------------------- | ------------------------- | ---------------------------------------------------------- |
| `DOC-CONTRACT` Contract docs describe current truth | 3.0 | VERIFIED | Parity audit §1–§25 | any production module changes | All six surfaces recorded from the deployed commit: Public Lending §3, Public Request §5, Staff Request §10, Authenticated Requester §12, Lending Hub §14, Release Desk §15 |
| `DOC-CONSOLIDATE` Obsolete Impeccable generations consolidated | 2.0 | VERIFIED | `docs/design/README.md` | a new generation appears | Index declares the current owner per question and marks v1–v4.1 superseded; files deliberately not moved because an accepted spec references the paths |
| `DOC-TRACKER` One canonical derived tracker                    | 2.0    | VERIFIED    | this file                    | competing tracker appears | Created; `DESIGN.md` and `WORK_CONTINUATION.md` point here |
| `DOC-BASELINE` Final Figma + branch baseline recorded | 3.0 | VERIFIED | `FIGMA_BASELINE_REGISTER.md` | any Figma or branch change | Baseline 2026-08-19-C recorded by content identity: 28 pages, 131 variables, 102 components, 0 clipping faults, 83.7% paint binding, every built node listed |

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
| D-02  | MEDIUM   | Blur variables do not bind to effect styles     | OPEN   |
| D-04  | MEDIUM   | Figma renders Inter against mandated typefaces  | OPEN   |
| D-05  | MEDIUM   | File-wide variable-binding coverage unproven    | OPEN   |
| §3.1  | MEDIUM   | 54 inferred colours on page 15 unproven         | OPEN   |

No P0 is open. No production defect candidate is open.
