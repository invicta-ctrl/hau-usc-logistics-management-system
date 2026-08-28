# P26 Hallmark Audit

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: AUDIT_COMPLETE; REPAIR_REQUIRED_IN_P27
ROUTE: SOLO
SCOPE: Exact P25 local candidate at desktop 1440×1000 and mobile 390×844, plus bounded runtime-source inspection

## Direction retained

The candidate has a specific institutional-operational identity rather than a stock SaaS template. The landing page uses one direct service-and-records hero, real request and lending paths, a live council-current state, and an explicit six-step logistics ledger. The oxblood/gold palette, Bricolage display face, IBM Plex body/record typography, restrained glass hierarchy, dense tables, and selected-detail pattern are coherent with the accepted design direction. No fake metrics, rainbow icon wall, gradient headline, decorative floating orbs, generic three-feature grid, or marketing-slogan filler remains.

## Critical

None.

## Major

### 1. Broken USC identity mark in the isolated Playground

- Tell: The USC image renders as a broken-image glyph in the public navbar, footer, and lending identity band; the Department of Logistics mark remains visible, making the institutional lockup look unfinished.
- Where: `src/frontend/assets/production/uscLogo.ts:2`, `src/frontend/app/brand/BrandMarks.tsx:4-11`, and `src/frontend/app/PublicFlows.tsx:239`.
- Severity: major.
- Fix: Preserve the governed `/brand/usc-logo` production route, but add an explicit Playground-safe visual fallback that never exposes a broken image and retains an accessible USC identity label.

### 2. Duplicate navigation on the public-lending route

- Tell: The page-level public navbar already provides Home and Staff sign-in, then the lending surface repeats a Home return in its identity header and another Home/Staff sign-in row immediately below it. The repetition competes with the primary Lending Center tab.
- Where: `src/frontend/app/PublicFlows.tsx` public-lending header and local navigation block; rendered evidence `P26_HALLMARK_BORROW_1440.png`.
- Severity: major.
- Fix: Keep one page-level public navigation authority and one local task switcher. Remove the redundant second Home affordance while preserving Lending Center, Track lending, Lending policy, and Staff sign-in access.

### 3. One service failure is presented twice

- Tell: When announcements are unavailable, the same error sentence appears once inside the media plane and again inside the adjacent detail card. On mobile the duplicate becomes two consecutive error panels.
- Where: `src/frontend/app/landing/CurrentSection.tsx:38-66`; rendered evidence `P26_HALLMARK_LANDING_1440.png` and `P26_HALLMARK_LANDING_390.png`.
- Severity: major.
- Fix: Render one coherent full-width operational error state. Reserve the two-column media/detail composition for a populated announcement.

### 4. Runtime visual values bypass the semantic theme contract

- Tell: Public landing, footer, inventory, request, and several operational routes retain large inline or route-local color/font maps even though P18 established semantic family/mode tokens. This creates parallel design authorities and makes theme quality dependent on per-route exceptions.
- Where: `src/frontend/app/landing/CurrentSection.tsx:16-17,47-64`, `src/frontend/app/landing/LogisticsHubSection.tsx:35-108`, `src/frontend/app/public/Footer.tsx`, `src/frontend/app/inventory/InventoryRoute.tsx`, and embedded route CSS in `AdministrationRoute.tsx`, `LendingHubRoute.tsx`, `ReleaseDeskRoute.tsx`, and `SupplyRoutes.tsx`.
- Severity: major.
- Fix: In the bounded repair pass, replace repeated literal roles with existing semantic tokens/classes. Do not flatten the accepted institutional oxblood surfaces or alter operational behavior.

## Minor

### 1. Uppercase micro-labels are repeated more often than their information value warrants

- Tell: Labels such as Current, Open now, Public lending · no sign-in, and Step 2 precede headings that already communicate the section purpose.
- Where: Landing and public-lending section headers.
- Severity: minor.
- Fix: Retain micro-labels only where they convey environment, access, sequence, or record status; remove purely decorative duplicates.

### 2. Numeric tables do not consistently opt into tabular figures

- Tell: Command surfaces use `font-variant-numeric: tabular-nums`, but several route-local operational tables omit it even though quantities, identifiers, and dates are compared by column.
- Where: Table styles embedded in `AdministrationRoute.tsx`, `LendingHubRoute.tsx`, `ReleaseDeskRoute.tsx`, and `SupplyRoutes.tsx`, plus table implementations in request, inventory, and internal lending routes.
- Severity: minor.
- Fix: Apply the existing record/numeric typography contract to operational table cells without changing density or data presentation.

## Counter-evidence and retained choices

- The hero is left-aligned, content-specific, and grounded by an actual institutional logistics scene; it is not a centered full-viewport slogan template.
- Glass is concentrated in navigation/transient hierarchy and has opaque fallbacks; dense operational records use solid surfaces.
- Status pills and mobile record cards encode real workflow state or preserve table equivalence and are not decorative card-wall substitutions.
- The queue-plus-inspector layout is retained because it supports scanning and consequence review; it collapses to a mobile detail surface rather than forcing horizontal tables.
- Motion is optional, pausable, reduced-motion aware, and does not animate every element on scroll.

## Evidence

- `.codex/evidence/P26_HALLMARK_LANDING_1440.png`
- `.codex/evidence/P26_HALLMARK_LANDING_390.png`
- `.codex/evidence/P26_HALLMARK_BORROW_1440.png`
- Source searches found no runtime text-gradient headline, `100vw` layout shell, decorative hover scaling, or `transition: all` in imported product components. Dormant generated UI primitives were excluded from the shipped-surface finding count.
- Visual capture used an isolated supervised Vite process on port 4188 and stopped it immediately after capture. No provider, Production, D1, R2, Google, Figma, or deployment mutation occurred.

## Hallmark handoff

Direction: Preserve the institutional-atmospheric Digital Atrium, oxblood/gold identity, direct product language, real workflow tables, and queue-plus-inspector operational hierarchy.

Locked: Functional contracts, access semantics, workflow consequences, six theme families and Light/Dark/System mode, performance boundaries, reduced-motion behavior, and Production/provider state.

May refine: Playground-safe brand fallback, duplicated public navigation, duplicate announcement error composition, semantic-token adoption, micro-label frequency, and numeric typography.

Targets: Public navbar/footer/lending identity, landing Current state, public route navigation, repeated runtime visual literals, and operational numeric tables.

Remaining risks: A broad visual rewrite would damage accepted density and operational clarity; repairs must stay evidence-backed and preserve all P20-P25 behavior.

Recommended Impeccable command: `/harden` — repair the visible failure, duplicate states/navigation, token drift, and numeric typography while preserving the accepted design direction and function.

0 critical · 4 major · 2 minor
