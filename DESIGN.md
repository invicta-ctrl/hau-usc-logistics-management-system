---
schema_version: 1
status: active
scope: hau-usc-logistics-frontend
authority: canonical
branch: Playground
visual_authority: owner-amendment-HAU-USC-MFR002-U11-VISUAL-RECOVERY-A1
visual_reference_sources: figma-make-figma-design-current-playground-before-baseline
design_documentation_authority: repository-DESIGN-md-plus-u11-visual-recovery-evidence
functional_authority: repository-server-worker-auth-contracts
accepted_amendment: .codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md
last_reviewed: 2026-09-01
# Machine-readable palette. Generated from scripts/design/theme-source.mjs, the
# canonical token source, and emitted into src/frontend/styles/theme.css. This
# block exists so tooling can tell a real design-system addition from drift; it
# does not replace the variables, which remain the implementation contract.
colors:
  oxblood-deep: '#40070a'
  oxblood-mid: '#78141a'
  oxblood-light: '#8d1f28'
  oxblood-dark-ground: '#4a1015'
  gold-canonical: '#d4af37'
  gold-vivid: '#e8b93c'
  gold-mid: '#f2d15c'
  gold-pale: '#f6e29a'
  gold-cream: '#faeecb'
  gold-dark-mode: '#e1c671'
  accent-text: '#7d5518'
  accent-text-dark: '#c9a45f'
  paper-warm: '#fffdf8'
  paper-mid: '#fcf2cf'
  paper-light: '#f7f0e2'
  paper-bg: '#f2eae5'
  ink-deep: '#241416'
  ink-mid: '#6f5a60'
  border-warm: '#d1b478'
  border-paper: '#e6dcc9'
  on-oxblood: '#ffffff'
  scrim: 'rgba(0,0,0,0.5)'
  hairline-gold: 'rgba(242,209,92,0.16)'
  hairline-gold-strong: 'rgba(242,209,92,0.28)'
  # Semantic status roles. These ship in theme.css and are used across the
  # frontend, but were previously undeclared here, so the detector read genuine
  # system tokens as drift (FE-R3-013). Declaring them is the fix; suppressing
  # the finding would not have been.
  destructive: '#d4183d'
  destructive-foreground: '#ffffff'
  destructive-dark: '#f6acb2'
  green-open: '#1f6b41'
  green-open-dark: '#9ad9b2'
  # Historical fallback for the account-panel input role. Both account panels
  # now consume generated theme roles in every Light/Dark appearance.
  panel-input: '#fff7e6'
typography:
  display:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 700
    fontSize: 'clamp(2.5rem, 8vw, 4.75rem)'
  civic-display:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 700
    fontSize: 'clamp(2rem, 6vw, 4.75rem)'
  page-title:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 700
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)'
  section-title:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 700
    fontSize: 'clamp(1.25rem, 2.4vw, 1.625rem)'
  record-title:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 650
    fontSize: '1rem'
  body:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 400
    fontSize: '1rem'
  compact-body:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 400
    fontSize: '0.875rem'
  label:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 650
    fontSize: '0.8125rem'
  caption:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 500
    fontSize: '0.75rem'
  numeric:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 600
    fontSize: '0.875rem'
    fontVariantNumeric: 'tabular-nums lining-nums'
  mono-reference:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontWeight: 500
    fontSize: '0.75rem'
    letterSpacing: '0.025em'
# scripts/design/foundation-source.mjs is the non-color token authority and
# deterministically emits src/frontend/styles/foundation.css. Existing routes
# migrate to these semantic roles only in their bounded redesign slices.
# Radius scale is real, emitted by the shared foundation:
#   compact 6px, control 8px, surface 10px, overlay 14px.
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  pill: '999px'
---

# HAU-USC Logistics frontend design authority

## Authority hierarchy

1. Earl's current explicit instruction, then the accepted specification and its
   approved amendments. The current amendment is **R3-A1-A2**.
2. **Repository backend, API, auth, data, security and provider contracts** are
   the sole _functional_ authority: authorization, capabilities, request
   semantics, state transitions, inventory truth, privacy, and data ownership.
3. **U11 Visual Recovery Amendment A1** is the current visual authority. It
   requires a material multi-route transformation and rendered browser proof.
4. Live Figma Make, the current Figma Design lane, and the pre-recovery
   Playground candidate are reference inputs and historical evidence. They are
   not a pixel target, a visual ceiling, or authority to preserve weak patterns.
5. Repository design mirrors, registers and audits under `docs/design/` are
   derived evidence.
6. Historical lanes are provenance only and never authority.

R3-A1 changes item 4. Before R3-A1 this file said flatly that "the Figma Design
file is documentation and historical reference". That is now too blunt: the
file's **historical pages remain historical**, but its **current-authority lane
is synchronized by R3-A1 and is a current visual and documentation reference**.
Pages 00–03 are capture baselines and HISTORICAL. Pages 11–13 are the design
system. Pages 15–90 are modules. Pages 91–99 are annotation matrices. Frame and
page names carry the binding status vocabulary — CURRENT, HISTORICAL,
SUPERSEDED, PROTOTYPE, CONTRACT-GATED — and those words are authoritative.

Neither visual references nor functional contracts may be inferred from one
another. The visual recovery may change hierarchy, composition, density,
responsive behavior, and motion, but it may not change business behavior,
authorization, data ownership, workflow state, or provider boundaries.

## U11 visual transformation recovery

`HAU-USC-MFR002-U11-VISUAL-RECOVERY-A1` pauses the prior U11 visual freeze and
opens the visual and interaction layer for one bounded recovery. The coherent
system is **Civic Ledger Workbench**: a HAU-USC record room translated into a
modern, task-first interface.

### System grammar

- **Public gateway — split studio.** Compact institutional masthead, an
  asymmetric service brief, one dominant request action, and ruled task lanes.
  Media is contextual evidence rather than a full-viewport visual dependency.
- **Authenticated operations — workbench.** The first useful viewport answers
  what needs attention, what the current record means, and what action is next.
  Queue/table and inspector use a solid 12-column frame at desktop and a single
  working column with modal/sheet detail on mobile.
- **Playground Index — index first.** Search and grouped compact route rows are
  primary. Runtime/technical detail stays available without becoming a repeated
  wall of identical cards.
- **Material.** Oxblood is the structural spine, warm paper is the working plane,
  and canonical gold is a sparse attention/focus signal. Operational surfaces
  are solid and ruled. Glass is restricted to genuine overlays or media context.
- **Type.** Bricolage Grotesque carries display and civic titles, IBM Plex Sans
  carries body/UI, and IBM Plex Mono is the single outlier for identifiers,
  timestamps, and tabular metadata. Newsreader remains a historical reference,
  not a fourth runtime family.
- **Geometry.** Data is expressed as ledgers, rows, dividers, and one signature
  frame per route. Pills are reserved for real state. Card-in-card and equal
  feature-card walls are prohibited.
- **Motion.** Finite 120–280 ms transform/opacity transitions clarify route,
  drawer, selection, and inspector state. No ambient loops, bounce, parallax,
  layout-property animation, or delayed focus indicators. Reduced motion keeps
  state feedback and removes spatial travel.

### Route recovery classification

| Surface                 | Recovery class  | Required visual outcome                                           |
| ----------------------- | --------------- | ----------------------------------------------------------------- |
| Landing                 | REDESIGN        | Split civic front door with task lanes and contextual media       |
| Track Record            | REDESIGN        | Privacy-first lookup station and readable result timeline         |
| Public Lending          | REDESIGN        | Search/catalog transaction plane with progressive borrower detail |
| Staff Sign In           | REDESIGN        | Identity rail plus focused access form                            |
| External Request Center | REDESIGN        | Requester queue plus focused intake station                       |
| Operations Overview     | REDESIGN        | Exceptions-first decision brief, not a KPI/card wall              |
| Inventory               | REFINE          | Preserve stock truth; strengthen ledger density and risk lane     |
| Internal Request Hub    | REDESIGN        | Triage queue plus decision inspector                              |
| Internal Lending Hub    | REFINE          | Preserve custody truth; compact lifecycle and elevate queue       |
| Release Desk            | REDESIGN        | Ready-to-handoff queue plus custody station                       |
| Restocking              | REDESIGN        | Receiving/reconciliation queue plus evidence station              |
| Procurement             | REDESIGN        | Approved-needs pipeline plus supplier/deliverable inspector       |
| Events                  | REFINE          | Preserve report truth; elevate readiness and blockers             |
| Administration          | REDESIGN        | Grouped governance master/detail with scope and health first      |
| Account Profile         | KEEP_WITH_PROOF | Preserve identity dossier; adopt shared system and verify         |
| Playground Index        | REDESIGN        | Dense searchable route atlas with one launch action per row       |

The 16 audited primary surfaces are the 15 application routes plus the
Playground Index. This count does not invent a sixteenth application route.

## R3-A1-A2 three-context workflow architecture

This is the model every layer must agree with.

```text
A. PUBLIC                    B. AUTHENTICATED REQUESTER      C. AUTHENTICATED DOL
   Public Lending Hub           External Request Center         Main Logistics Hub
   no staff sign-in             USC staff/officer sign-in       DOL/internal capability
                                no Main Hub authority implied

   Browse / borrow              Start a logistics request       Staff Sign In (generic)
        |                              |                              |
        |                              v                              v
        |                       STAFF SIGN IN  <-------------  identity gateway
        |                       entryIntent preserved                 |
        |                              |                              |
        v                              v                              v
   CANONICAL LENDING RECORD     CANONICAL REQUEST          capability-appropriate home
        |                              |                              |
        v                              v                              |
   INTERNAL LENDING HUB  <----  INTERNAL REQUEST HUB  <----------------+
   DOL review / approval /      DOL operational processing
   custody / return
```

One canonical record per business object sits underneath both sides. There is no
second request system and no second lending system.

### Owner correction — 2026-08-23

> **SUPERSEDED BY R3-A1-A2.** Every current-authority statement in this file that
> described the logistics **Request Center** as public / no-login is no longer
> current. The owner has corrected the product policy: the External Request
> Center is for verified USC staff and officers and requires authentication.

The superseded reading was not a mistake in reasoning — it was faithful to
`D06 — Product / Route Inventory` (`/request` = _Public request intake_),
production `public-requester-portal.js` at `0.8.2 / c316e047` (no session check,
no sign-in gate, no authorization branch), and the accepted `/api/public/request`
Worker contract. Those artifacts still say what they say; they are now historical
for this question, and `docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md`
`ACCESS_MODEL_DRIFT` / `PL-01` is resolved in the opposite direction from the one
it anticipated.

**D24.0 is not superseded.** It is the OWNER-LOCKED no-login model for the
**Public Lending Center** and remains current. The R3-A1 correction of record —
that `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` mis-cited D24.0 as the _Request_
authority — stands, and is now moot for Request, which is no longer public at all.

### A. Public Lending Hub

PUBLIC, and owner-locked so (`D24.0`). No account, sign-in, activation or
approval is needed to browse, borrow, or track. Audience: Angelite students, USC
staff and officers, and DOL staff, as equal borrower classes. Items are pens,
pencils, calculators, sewing kits, cutters, brooms, small tools, reusable
supplies, and other currently published lending items.

Tab set: **Home · Lending Center · Track lending · Lending policy · Staff Sign In.**
`Request Center` is absent by design — a public tab leading to an authenticated
surface is a false access promise.

Borrower verification and staff authentication remain different concepts.
Borrower type never produces a session, role, or capability.

### B. External Request Center

AUTHENTICATED. For verified USC staff and officers with legitimate USC
operational needs: inventory and pantry restocking, office inventory, food
requirements, event materials and food, event logistics, venue requirements and
support, logistical materials, and activity support.

Ordinary students must not reach it merely because they can reach Public Lending.
Eligibility is server-derived from `request.create` and served by the
authenticated `/api/portal/request` contract, which scopes every read and write
to the session account. It is **not** the public wizard behind a login screen.

### C. Internal Request Hub and Internal Lending Hub

INTERNAL. Staff session required and capability-gated. Distinct surfaces from
their external counterparts, over the same canonical records. `D23.0` records the
Request Hub as a submission form with the review queue appended, gated on
`request.review`, with a per-line route decision and no pre-selected default
(RV-01.6). `D24.1` records the internal Office Lending Hub.

**Vocabulary, fixed by R3-A1-A2.** The name _Request Center_ belongs to context B.
The internal DOL surface is the _Request Hub_.

### Generic Staff Sign In

An identity gateway belonging to no context. It authenticates a session and must
not pre-commit to one capability-gated destination — pre-committing denies
otherwise-valid staff accounts that simply lack that one capability.

Destination depends on **entry intent plus capability**: an internal operator
reaches a capability-appropriate Main Logistics Hub home; an eligible non-DOL
requester reaches the External Request Center. DOL staff who explicitly opened
the External Request Center stay there in requester mode, keeping their
operational identity and gaining an `Open Logistics Hub` shortcut.

`docs/frontend/ROUTING.md` is the control-level contract. Home is Home, not
logout, on every surface. "Public front door" is not current product copy.

### Module and action ownership

One authoritative business action has exactly one owning module. Other modules
deep-link to it or display its result; they do not re-implement it.

## Current implemented scope

The public/identity surfaces and FI-04 through FI-12 operational workspaces are
implemented in `src/frontend/`:

- institutional design foundation and public landing;
- public media, task-first gateway composition, finite motion, and reduced-motion behavior;
- public navigation, Request, Lending, receipt, and tracking presentation;
- sign-in, session/bootstrap, logout, starter activation, email verification,
  account application, private status-token lookup, and withdrawal;
- capability-gated authenticated navigation and operational route modules for
  Overview through the governed reference surfaces;
- one MFR-002 U03 shell contract for capability-filtered mobile navigation,
  compact/full desktop rails, route focus, safe-area/dynamic-viewport drawers,
  and viewport-bound inspectors with mobile sticky actions;
- responsive layouts at 320, 390, 768, 1024, and 1440 CSS pixels, plus 200%
  effective reflow;
- light/dark presentation, keyboard focus, semantic states, and no horizontal
  overflow.

R3-A1-A2 replaced the public request entry with the authenticated one. The hero,
footer, mobile drawer and Logistics-hub tile now carry
`entryIntent = EXTERNAL_REQUEST_CENTER` through the identity gateway and state
the staff requirement on the control itself; `PublicFlows` owns public lending
only; and `request/ExternalRequestCenter.tsx` binds to `/api/portal/request`.
Home preserves the session on every surface.

> **SUPERSEDED BY R3-A1-A2.** The R3 repair — "the hero, footer, mobile drawer
> and Logistics-hub tile now route to the public `request` route, and the hero
> accessible name states the public no-sign-in model", baseline `e30fbff` — was
> correct under the authority R3 held and is preserved here as history.

Authenticated operational workspaces mount only after the existing session and
capability resolution succeeds. `AuthenticatedShell` owns persistent frame and
navigation behavior; each route module still owns its content and business
actions. No design artifact may fabricate authorization, identifiers, status,
inventory, approval, or provider state.

## Visual system

- Oxblood provides institutional structure; canonical gold `#D4AF37` marks
  focus, selection, and the single primary action without carpeting a viewport.
- Warm paper carries reading and operations. Solid planes and semantic hairlines
  replace decorative glass, nested cards, and glow.
- Bricolage Grotesque is the display face; IBM Plex Sans and IBM Plex Mono carry
  operational copy, labels, identifiers, and tabular values.
- Lines are semantic. Purposeful asymmetry and operational hierarchy distinguish
  the product from a generic dashboard while preserving scan speed.
- Official USC and Department of Logistics marks remain the identity anchors;
  live Make ordering is reference, not a mandatory composition.
- The public poster/video may enrich the gateway, but the task and access model
  must remain complete and legible without it.

## Responsive, motion and accessibility

- Required widths: 320, 375, 390, 414, 768, 1024, 1440, 1920.
- Motion is purposeful and honours `prefers-reduced-motion`.
- WCAG 2.2 AA is the contrast floor; 66 of 66 measured token pairs pass in both
  themes. Keyboard focus and semantic states are required, not optional.
- Annotation matrices live on pages 91–94 of the design file.

## Provider and mirror identity

| Authority              | Identity                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Design reference | `hXJElH4p72KfgAaoUyfNOC` — 28 pages. Historical/current-lane input; not the U11 visual ceiling                                                     |
| Figma Make reference   | `rP9W9MQlZkyQrUx38TVsFS` — **Version 40** (R3-A1; previous 39), preserved as reference evidence                                                    |
| Repository Make mirror | `output/design/make-adoption/`, `output/design/make-preservation/`, `output/design/figma-make-source/`, `prototypes/public-portals-r3/figma-make/` |
| Registers              | `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, `docs/design/FIGMA_BASELINE_REGISTER.md`                                                              |

**Figma Make is synchronized and verified.** R3-A1 applied the public request
reconciliation to eight Make source files and saved them: **Version 39 → Version
40**, zero pending edits after a full reload, provider version-history entry
"8 edited files — Version 40". Exercised live: "Start a logistics request"
reaches "PUBLIC REQUEST · NO SIGN-IN — Request Center", and "Staff sign in"
reaches a separate staff sign-in page. The exact changeset is tabulated in
`.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.

**The repository Make mirror is refreshed to v40.** `output/design/figma-make-source/`
now matches the live saved source, satisfying R3-A1 §12. Per-file bytes and sha256
are recorded in `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, together with an
explicit statement of how far each file is verified — one byte-verified, three
structure-verified against full provider reads, four reconstructed and
grep-verified.

## Codex adoption workflow

1. Read `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`.
2. Read this file, `docs/frontend/WORKFLOW_ARCHITECTURE.md`, and
   `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.
3. Implement only inside `src/frontend/` and frontend-owned surfaces.
4. Run the exact local 4173 inspection preview and capture every primary surface
   at 390 and 1440; structurally review 320, 768, and 1024.
5. Do not treat any FI-04 staff workspace as verified.

## Implementation boundaries

- Frontend transport is same-origin and cookie-based.
- CSRF remains in memory and is sent only where the server contract requires it.
- Private verification receipts and status tokens remain caller-scoped and are
  never placed in URLs or persistent browser storage.
- Receipts and tracking views are constructed by the frontend from
  server-confirmed values; the client never invents record identifiers, tracking
  codes, status, or lifecycle history.
- Backend, auth, schema, migration, provider-design, Main, and Production
  mutations remain out of scope.
- The isolated Playground branch may be committed, pushed, deployed, and reset
  only after final source/build/security/accessibility/performance gates pass and
  exact branch/SHA/tree/artifact identity is verified.

## Known residuals

- Four of the eight mirrored Make files are reconstructed rather than byte-re-read; see the source register if byte-level proof is wanted.
- `.impeccable/design.json` is stale from the pre-cutover v4.1 design; see
  FE-R3-010 / FE-R3-011 in `docs/frontend/WORKFLOW_ARCHITECTURE.md`.
- 54 colours on design page 15 were restored by inference in the 2026-08-19
  sweep incident and cannot be identified; a non-blocking evidence gap.
- FVR-02 remains BLOCKED_PARTIAL on its recorded media blockers.

## Stale if

This file is stale if U11 Visual Recovery A1 is superseded; if the 15-route plus
Playground-Index inventory changes; if the repository workflow model changes;
or if a later accepted visual authority replaces Civic Ledger Workbench.

Recovery and source-delivery evidence lives under `docs/frontend/`. Historical
design research under `docs/design/` is reference-only and cannot override this
file, live Make, the Figma Design current-authority lane, an accepted
specification, or repository functional contracts.
