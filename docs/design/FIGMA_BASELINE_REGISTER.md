# Figma baseline register — HAU-USC Logistics frontend design

Append-only. One row per verified baseline. A baseline records what the Figma
file and its interactive counterpart actually contained at a point in time, so a
later session can tell drift from change.

## DESIGN_BASELINE_2026-08-19-A

```text
DESIGN_BASELINE_ID:      DESIGN_BASELINE_2026-08-19-A
STATUS:                  PARTIAL — audit and foundations repair complete;
                         module redesign passes not started
DESIGN BRANCH:           frontend-design-integration
STARTING SHA:            908653dc956c9ccffa68ac0b350fc23b69f053ea
FIGMA FILE:              hXJElH4p72KfgAaoUyfNOC
FIGMA PAGES:             28
FIGMA VARIABLES:         120 across 8 collections (Light/Dark on 3)
FIGMA COMPONENTS:        102
FIGMA TEXT STYLES:       11
FIGMA EFFECT STYLES:     9 (Material G0–G4 ladder)
FIGMA MAKE:              NOT APPLICABLE — see audit section 4
INTERACTIVE COUNTERPART: design-vault/figma/exports/
                         institutional-ledger-prototype-2026-08-13/
DESIGN DIRECTION:        Institutional Logistics Ledger (retained, not replaced)
IMPLEMENTATION READY:    NO — design gate only
```

### What changed in this baseline

| Change | Node / ID | Verified |
|---|---|---|
| Created semantic variable `color/accent/text`, scoped `TEXT_FILL`, aliased to `gold/700` | `VariableID:563:2` | Render + variable read-back |
| Rebound 46 gold text nodes on current R2 Overview light frames | `434:61`, `434:594`, `434:2193`, `434:2726`, `434:2760` | Render of `434:529` |
| **D-07** Moved "Reconciliation and provenance" below the exception command table in 5 desktop Overview frames, so exceptions lead per D20 | parents `434:234`, `434:767`, `434:1300`, `434:1833`, `434:2366` | Render of `434:61` |
| **D-06** Hid the below-table hint duplicating the inspector empty state (6 nodes) | `434:560`, `434:1093`, `434:1626`, `434:2159`, `434:2692`, `434:2916` | Render |
| **D-03** Built the Authority + Design Handoff board on the previously empty page 10 | `568:2` and 6 child blocks | Render |
| File-wide gold-on-light contrast sweep across pages 15, 30, 40, 50, 60, 70, 80, 90 | — | 2,496 gold nodes measured, 0 further failures |
| Reconciled `DESIGN.md` D05, D37; appended D40 | — | File diff |
| Added the audit and this register | — | Files created |

### Incident recorded in this baseline

A contrast sweep that ignored `GRADIENT` and `IMAGE` fills wrongly recoloured
294 nodes on pages 15, 80 and 90. Pages 80 and 90 (11 nodes) were restored
exactly. Page 15: 206 restored by exact twin match, 23 by empirical role
mapping, **54 by inference** and therefore not proven identical to the original.
Full account, including the corrected method and the four standing rules it
produced, is in section 3.1 of the audit. Figma version history holds the
pre-session state if exactness on those 54 matters.

## DESIGN_BASELINE_2026-08-19-B

```text
DESIGN_BASELINE_ID:      DESIGN_BASELINE_2026-08-19-B
STATUS:                  Public Lending reconciled to production and built out
DESIGN BRANCH:           frontend-design-integration
PRODUCTION REFERENCE:    0.8.2 @ c316e047 · schema 30
FIGMA VARIABLES:         122 (added color/accent/text, color/text/on-accent)
NEW FRAMES:              581:15 · 587:15 · 588:15 · 589:15 · 591:15 · 592:15
SUPERSEDED:              424:264 · 424:620 · 426:93 · 426:218 (sign-in-gated lending)
IMPLEMENTATION READY:    NO — design gate only
```

| Frame | Node | Covers |
|---|---|---|
| Lending Center · NO LOGIN · 1440 light | `581:15` | Full portal, USC Staff branch |
| … ANGELITE branch · 1440 light | `587:15` | Angelite conditional branch |
| … submitted receipt | `588:15` | One-time code, For Review, degraded variant |
| … 1440 dark | `589:15` | Dark via explicit variable modes |
| … declared catalog states | `591:15` | Loading, service error, empty, filtered empty |
| … 390 mobile light | `592:15` | Filter chips, horizontal cards, sticky selection bar |

Two semantic tokens were added to close real gaps, both of the same class —
"which ink goes on this branded surface":

| Token | Light | Dark | Why |
|---|---|---|---|
| `color/accent/text` | `#7d5518` | `#c9a45f` | Accent text on working surfaces. `gold/400` measured 1.52:1 and failed AA |
| `color/text/on-accent` | `#40070a` | `#40070a` | Text on the gold action surface, which stays light in both modes |

Binding audit of the dark clone found only **2 unbound fills** across the whole
portal, both since cleared — the portal is genuinely token-driven.

### Accessibility position at this baseline

`color/accent/text` resolves `#7d5518` in Light (**5.46:1** on the composited G2
pane) and `#c9a45f` in Dark (**7.49:1** on dark paper). Both clear WCAG 2.2 AA
1.4.3 for normal text. The prior value `gold/400 #e8b93c` measured **1.52:1** in
Light and is now reserved for fills, edges, focus rings and oxblood-backed text,
where it is correct.

This is a **point fix on one module**, not a file-wide accessibility pass. Pages
15, 30, 40, 50, 60, 70, 80 and 90 have not been contrast-audited. Do not read
this baseline as an AA claim for the file.

### Research decisions adopted as defaults

The 2026-08-10 research handoff left five open owner questions. Per the owner's
standing instruction to use recommended defaults rather than escalate
micro-decisions, these were adopted as-is and are recorded here so a later
session does not re-litigate them:

1. Institutional Logistics Ledger retained as the design direction — evolved,
   not replaced.
2. `admin.overview` / Command Center remains the first bounded slice.
3. Slice 1 stays 2D-only; no 3D dependency introduced.
4. Incumbent oxblood / gold / warm-paper identity retained; composition and
   component roles evolve.
5. Overview exceptions use a ranked mix (request age, release due, lending
   overdue, stock health) as already built into the R2 command table.

### Known gaps carried forward

| ID | Gap | Severity | State |
|---|---|---|---|
| D-08 | Landing hero: 17 of 59 texts failed AA, worst 1.01:1 — oxblood ink on dark glass cards | HIGH | FIXED — owner confirmed the cards read as ACTIVE; 137 nodes rebound to inverse/rail inks. 13 gold-gradient button labels reverted to dark ink |
| D-02 | Blur ladder defined twice, values disagree (12/18/24/28 vs 16/22/30/36) | MEDIUM | OPEN |
| D-04 | Figma renders Inter; authority mandates Bricolage / IBM Plex / Newsreader; production ships Georgia / Aptos | MEDIUM | OPEN |
| D-05 | Variable-binding coverage measured only on page 30 (97.7%) | MEDIUM | OPEN |
| — | 54 inferred colours on page 15 from the section 3.1 incident | MEDIUM | OPEN |
| P-01 | Prototype `route-map.js` points at superseded Figma sections | MEDIUM | OPEN |
| P-02 | Prototype loads fonts from `fonts.googleapis.com` against D09 | MEDIUM | OPEN |
| D-01 | Gold text failing AA on light panes | HIGH | FIXED — Overview; rest of file measured clean |
| D-03 | Page `10 — Authority + Design Handoff` empty | MEDIUM | FIXED |
| D-06 | Redundant inspector hint inside command-table row | LOW | FIXED |
| D-07 | Overview hierarchy placed provenance above exceptions, inverting D20 | MEDIUM | FIXED |

### Boundary attestation

No product, release, provider, or environment state was modified. The v0.8.3
stream lives in a separate git repository
(`worktrees/v081-production-execution-eb14cd81/.git`, branch
`release/v0.8.3-identity-foundation`) and was neither read for mutation nor
written. No Cloudflare, D1, R2, or Google call was made. No deployment,
migration, or release artifact was produced.

### Next recommended action

Superseded by baseline 2026-08-19-C below. Both items named here are done: the
Public Request diff is at parity audit §21 and the authenticated requester
portal is built at `624:2`.

## Baseline 2026-08-19-C — production reconciliation

Recorded by **content identity**, not by a version name. `saveVersionHistoryAsync`
is not exposed through the MCP bridge, so a named Figma version is the one step
in this baseline that still needs the Figma UI. Everything below is verifiable
from the file itself, which is the stronger record anyway: a version label can be
right while the contents are not.

```text
FIGMA DESIGN     hXJElH4p72KfgAaoUyfNOC
FIGMA MAKE       rP9W9MQlZkyQrUx38TVsFS   (PublicFlows.tsx save staged, sync blocked upstream)
DESIGN BRANCH    frontend-design-integration
DESIGN COMMIT    fd423fd6231a9dc309307a0d308deb46af770646
PRODUCTION REF   0.8.2 @ c316e047 · schema 30
```

### File identity

| Measure | Value |
|---|---|
| Pages | 28 |
| Variables | **131** (was 122 — 10 Glass Material tokens added, 1 earlier) |
| Collections | Semantic Color [Light/Dark] · Primitives [Light/Dark] · Glass Material [Light/Dark] · Spacing · Radius · Size · Motion · Layout |
| Components | 102 |
| Effect styles | 9 — the four Material blur radii now **bound** to variables |
| Text styles | 11 |

### Built in this pass

| Node | Surface |
|---|---|
| `615:2` | `request.submit` — the Staff Request submission region, 1118×1619 |
| `300:624` | per-line route decision panel, rebuilt to the RV-01.6 contract |
| `628:2` | `request.composite` — feature-flagged event logistics sections |
| `616:2` | review queue pagination, server-clamped |
| `624:2` | `portal.request` — authenticated requester portal, 1440×2436 |
| `626:2` | `public.request` — five-step intake, 1440×3780 |
| `639:2` | the same intake in dark, by explicit variable modes, zero unbound fills |

### Structural state

| Property | Value |
|---|---|
| Frames clipping their own content | **0** across all non-superseded lanes |
| Unbound solid paints | 7,373 of 45,137 — **83.7% bound**, up from 67.7% |
| Blur ladder | single-sourced: variables 16/22/30/36, bound to the Material effect styles |
| Glass tokens | Figma ↔ `glass.css` map one-to-one, 21 properties, zero value drift |
| Superseded lanes touched | none; one accidental edit was reverted |

### Verifiable from the branch

```bash
npm run design:tracker:check   # derived progress, fails when stale
npm run design:contrast        # 66/66 WCAG pairs, both themes
```

### Known gaps at this baseline

Figma Make internal modules; the D-04 typeface conversion across seven pages
plus the Bahnschrift pocket on Inventory; 7,373 paints needing role decisions;
54 inferred colours on page 15; dark and 390 variants for the new request
frames; a real keyboard walk and screen-reader pass; and the named Figma
version above.


## Baseline 2026-08-20-A — canonical gold, Make recovery, real accessibility

```text
FIGMA DESIGN     hXJElH4p72KfgAaoUyfNOC
FIGMA MAKE       rP9W9MQlZkyQrUx38TVsFS  ·  Version 35, synced, no pending warning
DESIGN BRANCH    frontend-design-integration
PRODUCTION REF   0.8.2 @ c316e047 · schema 30
CANONICAL GOLD   #D4AF37  (DESIGN.md D08.0, owner-locked)
```

### Structural state

| Property | Value |
|---|---|
| Frames clipping their own content | **0** document-wide |
| Superseded gold values anywhere | **0** |
| Off-system typefaces in CURRENT lanes | **0** of 23,189 text nodes |
| Solid paint coverage | **93.1%** (42,536 paints) |
| Glass tokens | Figma ↔ `glass.css` one-to-one, zero drift |

### Added since 2026-08-19-C

| Node | Surface |
|---|---|
| `639:2` | public request intake, 1440 dark |
| `654:2` / `657:2` | public request intake, 390 light and dark |
| `657:350` | public lending portal, 390 dark |
| `658:2` `658:14` `658:28` `658:42` | intake loading, source-empty, validation error, service unavailable |

### Verifiable from the branch

```bash
npm run design:tracker:check   # derived progress, fails when stale
npm run design:contrast        # 66/66 WCAG pairs, both themes
npm run design:keyboard        # 32/32 real Playwright keyboard traversal
npm run design:semantics       # 30/30 accessibility tree via CDP
```


## Baseline 2026-08-20-B — programme closeout

```text
FIGMA DESIGN     hXJElH4p72KfgAaoUyfNOC  ·  28 pages · 136 variables · 102 components
FIGMA MAKE       rP9W9MQlZkyQrUx38TVsFS  ·  Version 35, synced, no pending warning
DESIGN BRANCH    frontend-design-integration @ dd22a8c
PRODUCTION REF   0.8.2 @ c316e047 · schema 30  (read-only, never modified)
CANONICAL GOLD   #D4AF37  ·  DESIGN.md D08.0, owner-locked
```

### Final confirmation sweep — one pass, whole document

| Check | Result |
|---|---|
| Frames clipping their own content | **0** |
| Superseded gold values (solid or gradient stop) | **0** |
| Off-system typefaces across 21,498 CURRENT-lane text nodes | **0** |
| Superseded route phrases anywhere | **0** |
| Solid paint coverage | 93.1% of 42,723 |

### Runnable acceptance

```bash
npm run design:tracker:check   # derived progress, fails when stale
npm run design:contrast        # 66/66 WCAG pairs, both themes
npm run design:keyboard        # 32/32 real Playwright keyboard traversal
npm run design:semantics       # 30/30 accessibility tree via CDP
```

### Boundary attestation

The v0.8.3 product worktree was read for contract truth and **never written**.
Its three dirty `.codex` files carry a 2026-08-17 timestamp, three days before
this programme began, and were preserved untouched. No Cloudflare, D1, R2,
Google, provider, migration, deployment or release action occurred.

### Accepted residuals

| Item | Status |
|---|---|
| `FD-COLOUR` — 54 historically inferred colours | **BLOCKED.** The node ids were never recorded, so the set cannot be identified even with version history. Needs the Figma REST API with an owner token, or a manual version diff |
| `FD-TOKENS-RESIDUAL` — 2,941 one-off paints | **Deliberately stopped** on owner direction that semantic correctness outranks binding percentage |
| Hallmark as its own pass | Not run, not claimed |
| Screen-reader runtime | Not run, not claimed; accessibility-tree evidence recorded instead |
