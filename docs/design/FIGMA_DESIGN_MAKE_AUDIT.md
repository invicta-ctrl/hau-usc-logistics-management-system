# Figma Design + Figma Make audit — Claude isolated design stream

```text
STREAM:            Claude isolated frontend-design stream (parallel)
BRANCH:            frontend-design-integration
STARTING SHA:      908653dc956c9ccffa68ac0b350fc23b69f053ea
AUDIT DATE:        2026-08-19 (Asia/Manila)
FIGMA FILE KEY:    hXJElH4p72KfgAaoUyfNOC
PRODUCT STREAM:    v0.8.3 — NOT TOUCHED (separate git repository, see section 6)
```

This audit is evidence-backed. Every claim below was produced by a read-only
Figma Plugin API query, a rendered screenshot, or a computed contrast value —
not by inference from prior documentation. Where it contradicts `DESIGN.md`,
the contradiction is stated explicitly and `DESIGN.md` has been reconciled.

## 1. Headline findings

1. **`DESIGN.md` D05 and D37 were materially out of date.** They described the
   Figma file as a three-page, Starter-plan, capture-index-only workbench with
   "no Figma mutation". The file actually contains **28 pages, 8 variable
   collections (119 variables), 11 text styles, 9 effect styles, and 102
   components**. Substantial design work landed after the 2026-08-13
   consolidation and was never reconciled back into the authority. Fixed.
2. **A systemic WCAG 2.2 AA failure was found, measured, and repaired.** Gold
   `gold/400 #e8b93c` was used as a *text* fill on light glass panes. Measured
   against the composited G2 pane it is **1.52:1** where AA 1.4.3 requires
   4.5:1 for text under 18.66px. 46 text nodes across the current R2 Overview
   frames were affected.
3. **The design system has a token-coverage hole.** There was no semantic
   "accent text" token at all — only `color/accent/wash` and
   `color/accent/line`. The failing fills were raw hex, bypassing the token
   layer entirely.
4. **Figma Make does not exist and cannot be created by this toolchain.**
   Owner authorized substituting the local Institutional Ledger prototype.
5. **The blur ladder is defined twice and the two definitions disagree.**
6. **The Figma file renders in Inter**, not the Bricolage Grotesque / IBM Plex
   Sans / Newsreader stack that `DESIGN.md` D09 declares as CURRENT.

## 2. Figma Design — verified inventory

File name is literally `Document` — the file has never been named. `DESIGN.md`
D05 claimed the name "HAU-USC Logistics — Frontend Design Lab". Recorded as a
discrepancy; not renamed, since that is an owner-facing identity change.

| Page | Node | Children | Classification |
|---|---|---|---|
| 00 — Capture Index | 0:1 | 3 | HISTORICAL — capture registry + issue log |
| 01 — Production Baseline | 9:2 | 5 | REFERENCE captures |
| 02 — Playground Baseline | 9:3 | 4 | REFERENCE captures |
| 03 — Production vs Playground Comparisons | 55:2 | 1 | REFERENCE |
| 04 — USC Brand + Official Media Direction | 274:2 | 1 | CURRENT |
| 10 — Authority + Design Handoff | 55:3 | **0** | **MISSING — empty page** |
| 11 — Foundations | 55:4 | 5 | CURRENT (+1 SUPERSEDED frame, correctly labelled) |
| 12 — Components | 55:5 | 5 | CURRENT — 102 components |
| 13 — Shell + Navigation | 55:6 | 2 | CURRENT |
| 15 — HAU USC Landing | 274:3 | 49 | CURRENT R2 + HISTORICAL, mixed |
| 20 — Overview / Command Center | 55:7 | 14 | CURRENT R2 (+SUPERSEDED/HISTORICAL, labelled) |
| 21 — Profile / Account Identity | 274:4 | 4 | CURRENT |
| 30 — Inventory | 55:8 | 5 | CURRENT |
| 40 — Request Center | 55:9 | 7 | CURRENT |
| 50 — Lending Hub | 55:10 | 6 | CURRENT |
| 60 — Release Desk | 55:11 | 7 | CURRENT |
| 70 — Restocking + Procurement + Events | 55:12 | 6 | CURRENT |
| 80 — Administration + Governance | 55:13 | 10 | CURRENT |
| 90 — Public + Authentication | 55:14 | 10 | CURRENT |
| 91–99 State / Responsive / Motion / A11y / Spatial / Content / Loading / Traceability / Research Delta | 55:15–55:20, 78:2–78:4 | 1–2 each | CURRENT annotation pages |

### Variable collections

| Collection | Vars | Modes |
|---|---:|---|
| HAU-USC / Semantic Color | 49 → **50** | Light, Dark |
| HAU-USC / Spacing | 14 | Default |
| HAU-USC / Radius | 5 | Default |
| HAU-USC / Size | 8 | Default |
| HAU-USC / Motion | 6 | Default |
| HAU-USC / Primitives | 16 | Light, Dark |
| HAU-USC / Layout | 9 | Default |
| HAU-USC / Glass Material | 12 | Light, Dark |

Text styles (11): Wordmark, Display / Overview, Page Title, Section Title,
Body, Body Compact, Label, Caption, Metric, Tabular, Reference / Mono.

Effect styles (9): Ground / none, Raised Inspector, Overlay, Focused Action,
and the Material G0–G4 ladder.

Paint styles: **0**. Acceptable — colour is carried by variables — but it means
there is no published paint-style surface for library consumers.

## 3. Confirmed defects

### D-01 — Gold text fails WCAG 2.2 AA on light surfaces · HIGH · FIXED

`gold/400 #e8b93c` used as a text fill on the G1/G2/G3 light glass panes.

| Foreground | Background (composited) | Ratio | AA 4.5:1 |
|---|---|---:|---|
| `#e8b93c` gold/400 | `#f0e9dc` G2 pane over canvas | **1.52:1** | FAIL |
| `#7d5518` gold/700 | `#f0e9dc` | **5.46:1** | PASS |
| `#c9a45f` gold/700 (Dark) | `#1f1719` paper (Dark) | **7.49:1** | PASS |
| `#40070a` ink | `#f0e9dc` | 13.9:1 | PASS (reference) |
| `#5e383d` secondary | `#f0e9dc` | 8.25:1 | PASS (reference) |

Affected nodes were the exception command table column headers, the operational
pulse title, the selected-row next action, and the contextual inspector labels —
precisely the wayfinding text of the flagship surface.

This also violated `DESIGN.md` D08 ("Gold is scarce. It marks active controls,
focus, selected routes … rather than decorating"). Gold was carrying routine
column labels, which is neither scarce nor a control.

**Fix applied.** Created semantic variable `color/accent/text`
(`VariableID:563:2`) in *HAU-USC / Semantic Color*, scoped `TEXT_FILL`, aliased
to primitive `gold/700` so it resolves `#7d5518` in Light and `#c9a45f` in Dark.
Rebound 46 text nodes across the five current R2 Overview light frames
(`434:61`, `434:594`, `434:2193`, `434:2726`, `434:2760`). Verified by render.

Gold on oxblood was **not** changed and is correct: the rail, masthead and
caption strips use `gold/100 #faeecb` and `gold/200 #f6e29a` on oxblood, which
are high-contrast and intentional. A blanket recolour would have broken them.

### D-02 — The blur ladder is defined twice, inconsistently · MEDIUM · OPEN

| Tier | `material/blur/*` variable | Effect style `BACKGROUND_BLUR` | Drift |
|---|---:|---:|---:|
| G1 | 12 | 16 | 1.33× |
| G2 | 18 | 22 | 1.22× |
| G3 | 24 | 30 | 1.25× |
| G4 | 28 | 36 | 1.29× |

The variables are not bound to the effect styles — Figma cannot bind a FLOAT
variable to an effect blur radius — so the token layer is decorative and the
effect styles are the only thing that renders. The project's own research delta
(2026-08-14) warned about exactly this class of silent divergence in the glass
stack. Either the variables should be deleted as misleading, or renamed
`material/blur/*-spec` with the effect styles reconciled to them. Owner
decision; not resolved unilaterally.

### D-03 — Page "10 — Authority + Design Handoff" is empty · MEDIUM · OPEN

Zero children. The page that should carry the design-to-implementation contract
carries nothing, so the Figma file has no in-file statement of its own
authority, status vocabulary, or handoff rules.

### D-04 — Typeface drift · MEDIUM · OPEN

Every text node mutated in this pass reported `Inter` (Bold / Semi Bold /
Medium). `DESIGN.md` D09 declares Bricolage Grotesque (display), IBM Plex Sans
(body/data/controls) and Newsreader (wordmark) as CURRENT, and D30 registers
bundled `.woff2` assets for all three. The Figma file is therefore not
type-faithful to the authority, and any type-hierarchy judgement made from
these frames is being made in the wrong typeface.

This compounds a pre-existing, already-documented drift: the *committed*
`DESIGN.md` recorded that production ships Georgia + Aptos and that the
Bricolage Grotesque system "production never shipped". There are therefore three
different type realities — production (Georgia/Aptos), authority
(Bricolage/Plex/Newsreader), and Figma (Inter). Unresolved.

### D-05 — Hardcoded colour bypassing the token layer · MEDIUM · PARTIALLY FIXED

The failing fills carried no variable binding — raw `#e8b93c`. The 46 nodes in
D-01 are now bound. A file-wide binding-coverage sweep has **not** been run; the
true extent of unbound colour is unknown and is listed as residual work.

### D-06 — Redundant inspector hint in the command table · LOW · OPEN

"Select a record to inspect state, evidence, ownership, and the permitted next
action." renders inside the first table row, overlapping the row's own column
band, and the same sentence renders again immediately below the table. One is
redundant, and the in-row placement reads as row content rather than as an
empty-inspector affordance.

### D-07 — Information hierarchy inverts the stated authority · MEDIUM · OPEN

On `admin.overview`, "Reconciliation and provenance" is the first and most
visually prominent panel, above the operational pulse and the exception command
table. `DESIGN.md` D20 requires the Overview to "prioritize time-sensitive or
blocked work, the primary role action, recent relevant activity, then secondary
guidance". Provenance is secondary guidance and currently outranks the four open
exceptions. This is a composition change rather than a defect fix, and is
deferred to the module pass.

## 4. Figma Make — NOT APPLICABLE

No Figma Make project exists. Verified by exhaustive search of the repository,
both design worktrees, `DESIGN.md`, and the entire `design-vault`: the only
`figma.com` references anywhere are the design file key and two MCP capture
endpoints.

It also cannot be created or driven from here. `create_new_file` accepts only
`design`, `figjam`, and `slides`; `get_metadata`, `get_screenshot` and
`use_figma` each explicitly exclude `/make/` URLs. Figma Make exposes no plugin
or read surface to this toolchain.

**Owner decision (2026-08-19): use the local prototype instead.** The
interactive counterpart of the accepted design direction is:

```text
design-vault/figma/exports/institutional-ledger-prototype-2026-08-13/
```

282 KB of real HTML/CSS/JS across 13 files, driven by
`?route=&state=&theme=&w=` query parameters, covering 33 registry surfaces with
declared states and a responsive matrix. It is readable, runnable and verifiable
from here, which Figma Make is not.

**P-01 — `route-map.js` is stale.** It maps surfaces to Figma sections
`30 (45:5)` … `120 (45:14)`, but section `45:5` is now explicitly labelled
`SUPERSEDED` on page 20, and the live page numbering differs (Overview is page
20, not 30; Inventory 30, not 40). Anyone following the prototype's own route
map lands on superseded material.

**P-02 — remote font dependency.** `index.html` loads Bricolage Grotesque, IBM
Plex Sans and Newsreader from `fonts.googleapis.com`. `DESIGN.md` D09 forbids
remote font dependencies "without an accepted performance/privacy decision", and
D30 registers bundled local `.woff2` files for exactly these families.

## 5. Cross-artifact discrepancy matrix

| Concern | Production (read-only) | Figma Design | Local prototype | DESIGN.md | Verdict |
|---|---|---|---|---|---|
| Display / body type | Georgia + Aptos | **Inter** | Bricolage + Plex (remote) | Bricolage + Plex + Newsreader | 4-way divergence — D-04 |
| Accent text colour | n/a | gold/400 → **fixed** to `color/accent/text` | `--gold-*` ramp present | "gold is scarce" | Reconciled for Overview |
| Glass ladder | not shipped | effect styles 16/22/30/36 | no glass tier tokens | G0–G4 named | Divergent — D-02 |
| Figma page map | n/a | 28 pages | stale `route-map.js` | claimed 3 pages | **Reconciled in this pass** |
| Figma mutation state | n/a | heavily mutated | n/a | "no Figma mutation" | **Reconciled in this pass** |

## 6. Isolation evidence — product stream untouched

The active v0.8.3 product stream is a **separate git repository**, not a
worktree of the design repo:

```text
design stream  git dir: active/hau-usc-logistics-management-system/.git
product stream git dir: worktrees/v081-production-execution-eb14cd81/.git
                        branch release/v0.8.3-identity-foundation
                        child worktrees v083-*
```

No file under any `v08*` path was opened for write or modified. No
`.codex/CURRENT*.md` outside the design worktree was touched. No Cloudflare, D1,
R2, Google, or provider call was made. No deployment, migration, or release
artifact was produced.

## 7. Preserved pre-existing work

All uncommitted work found at intake was preserved and none was discarded.

| Path | State at intake | Classification | Action |
|---|---|---|---|
| `DESIGN.md` | modified, 303 → 1153 lines | **CURRENT authority** — the 2026-08-13 consolidation, never committed | Preserved; D05/D37/D40 reconciled |
| `src/styles/visual/v0-7-2-r2.css` | untracked | CURRENT r2 iteration | Preserved untouched |
| `output/design/HAU_USC_..._r1_Integrated.html` | untracked | REFERENCE export | Preserved untouched |
| `prototypes/.../tools/theme-test.mjs` | modified | KEEP — real fix (root vs body theme flag) | Preserved untouched |
| `src/index.html` | modified | KEEP — links `v0-7-2-r2.css` | Preserved untouched |
| `.impeccable/hook.cache.json` | untracked | tool cache | Preserved untouched |
| `tmp/` | untracked | scratch | Preserved untouched |

No `reset`, `clean`, `checkout --`, `restore`, `stash`, or branch switch was
performed at any point.

## 8. Residual work

Not completed in this pass; ordered by value.

1. Extend the D-01 contrast fix beyond Overview to pages 15, 30, 40, 50, 60, 70,
   80, 90. 256 gold text nodes were counted on page 15 alone, most on oxblood
   and therefore correct — each needs per-node backdrop resolution, not a
   blanket recolour.
2. Resolve D-02 (blur ladder), D-03 (empty authority page), D-04 (typeface).
3. File-wide variable-binding coverage sweep (D-05).
4. Module composition passes — D-07, and the Overview → Inventory → Request →
   Lending → Release order in Phase 11 of the brief.
5. Refresh `route-map.js` in the prototype; move it to bundled fonts.
6. Responsive, accessibility and motion verification at the eight declared
   widths.
