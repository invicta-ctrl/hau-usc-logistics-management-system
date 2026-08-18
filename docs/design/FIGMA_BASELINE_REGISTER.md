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
| Reconciled `DESIGN.md` D05 (Figma registry) | — | File diff |
| Reconciled `DESIGN.md` D37 (status: Figma MUTATED; Make N/A) | — | File diff |
| Appended `DESIGN.md` D40 changelog row | — | File diff |
| Added `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md` | — | File created |

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

| ID | Gap | Severity |
|---|---|---|
| D-02 | Blur ladder defined twice, values disagree (12/18/24/28 vs 16/22/30/36) | MEDIUM |
| D-03 | Page `10 — Authority + Design Handoff` is empty | MEDIUM |
| D-04 | Figma renders Inter; authority mandates Bricolage / IBM Plex / Newsreader; production ships Georgia / Aptos | MEDIUM |
| D-05 | File-wide variable-binding coverage unmeasured | MEDIUM |
| D-06 | Redundant inspector hint inside command-table row | LOW |
| D-07 | Overview hierarchy places provenance above exceptions, inverting D20 | MEDIUM |
| P-01 | Prototype `route-map.js` points at superseded Figma sections | MEDIUM |
| P-02 | Prototype loads fonts from `fonts.googleapis.com` against D09 | MEDIUM |

### Boundary attestation

No product, release, provider, or environment state was modified. The v0.8.3
stream lives in a separate git repository
(`worktrees/v081-production-execution-eb14cd81/.git`, branch
`release/v0.8.3-identity-foundation`) and was neither read for mutation nor
written. No Cloudflare, D1, R2, or Google call was made. No deployment,
migration, or release artifact was produced.

### Next recommended action

Run the module redesign passes in the Phase 11 order — Overview composition
(D-07) first, since the Overview is the flagship and its patterns propagate —
then extend the contrast repair file-wide as each module page is opened.
