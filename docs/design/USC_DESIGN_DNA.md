<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# USC Design DNA — Institutional Logistics Ledger

## Design Gate status

**HISTORICAL PROPOSAL — NOT IMPLEMENTATION AUTHORITY.** This research predates the accepted Figma-native cutover. Current authority is [`DESIGN.md`](../../DESIGN.md).

## One coherent idea

HAU-USC Logistics should feel like an **Institutional Logistics Ledger**: a calm, dimensional operational environment where every request, item, release, loan, and administrative change has a visible place, state, owner, and trail.

The visual metaphor is not a warehouse, command HUD, or futuristic dashboard. It is a modern institutional worktable layered over an accountable ledger:

- **Oxblood** is institutional authority and orientation.
- **Gold** is focus, decisive action, and a scarce highlight.
- **Warm paper** is the active working plane.
- **Graphite/charcoal** is the quiet technical foundation in dark mode.
- **Rules, alignment, and provenance** make the system trustworthy.
- **Depth** shows relationship and current context, never prestige for its own sake.

This direction preserves the incumbent USC identity and backend-integrated V5 architecture while making hierarchy, density, and interaction more deliberate.

## Product character

| Attribute     | Expression                                                                | Why it belongs                                             |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Sophisticated | Precise composition, mature typography, sparse accents                    | USC is an institutional authority, not a consumer campaign |
| Calm          | Stable shell, few simultaneous animations, generous orientation zones     | Staff repeatedly operate the product under time pressure   |
| Operational   | Actions live beside the state/evidence they change                        | The system is judged by correct work, not visual novelty   |
| Dimensional   | Ground, work surface, raised inspector, and overlay have clear roles      | Depth can preserve context without creating card clutter   |
| Technical     | Exact quantities, revisions, timestamps, identities, and lifecycle tracks | Logistics truth must remain inspectable                    |
| Contemporary  | Fast command access, responsive transformation, purposeful motion         | Frequent users deserve modern efficiency                   |
| Confident     | Unequal overview composition and decisive type scale                      | Important conditions should look important                 |

## Design principles

### 1. Evidence before decoration

The first visible layer answers: what needs attention, what is its state, who owns it, and what can I do? Decoration may strengthen those answers but never replace them.

### 2. Unequal importance, explicit composition

Overviews use named regions with unequal spans: operational pulse, exceptions, today's releases, stock health, and activity do not deserve identical cards. Transactional modules remain predictable and comparable.

### 3. The record is the center of gravity

Lists, charts, and alerts lead to the same governed record. Opening it preserves selection and context in a raised inspector or full detail route. Identity, revision, and audit evidence stay visible.

### 4. One action language

Gold marks the decisive primary action or current focus, not decoration. Oxblood carries institutional navigation and bounded commitment actions. Destructive actions remain quiet until deliberately invoked, then use explicit alert semantics and confirmation.

### 5. Motion preserves continuity

Motion explains where a record went, what changed, or what requires attention. It never implies backend success before confirmation and never blocks content.

### 6. 2D is authoritative; spatial is optional

Any 3D or spatial visualization summarizes relationships already present in accessible DOM. It can be omitted without loss of information or action.

### 7. Density is earned by scanability

Inventory, requests, lending, release, and audit surfaces can be dense when columns align, filters are stable, actions are contextual, and detail is progressively disclosed. Density is not a wall of cards.

### 8. Environment and permission are visible, not spoofable

Playground aids, Index, state controls, and test session conveniences remain server-authorized. Visual context never grants capability.

## Macrostructure

### Global shell

- **Institution rail:** USC/DOL identity, route families, current selection, and environment-safe operator context.
- **Command band:** page identity, global command/search, current scope, and the one primary action.
- **Work plane:** the current module, with an explicit reading order and stable content width.
- **Context inspector:** a right-side raised plane or full route for record detail, history, and actions.
- **Mobile action dock:** only the highest-frequency route/action set; it is not a miniature desktop rail.

### Information layers

1. **Orientation:** environment, module, role/scope.
2. **Operational pulse:** exceptions, required actions, and current totals.
3. **Primary work:** queue, table, record, timeline, or form.
4. **Evidence:** history, ownership, revision, audit, and linked records.
5. **System detail:** diagnostics and raw identifiers only when permission and task require them.

## Spacing DNA

The incumbent 4/8/12/16/20/24/32/40/56 scale remains a strong base. The proposal changes how it is used:

- 4–8: relationship inside compact controls, status pairs, and table cells.
- 12–16: control groups, row interiors, and compact panels.
- 20–24: working sections, inspector blocks, and form groups.
- 32–40: separation between different task phases.
- 56+: overview chapters and public editorial bands only.

Alignment is more important than raw whitespace. Values, statuses, and actions align vertically across comparable rows. Intentional asymmetry is limited to overview/public compositions with named hierarchy.

## Typography DNA

The current local Bricolage Grotesque / IBM Plex Sans / Newsreader roles remain the proposal:

- **Bricolage Grotesque:** page identity, major metrics, exceptional overview statements.
- **IBM Plex Sans:** controls, body copy, tables, forms, statuses, and dense operational text.
- **Newsreader:** institutional wordmark and rare editorial/public emphasis.
- **Monospace:** receipts, revisions, immutable references, hashes, and compact diagnostic values.

Operational headings are direct nouns or verbs. Labels never rely on uppercase tracking alone at small sizes. Numeric columns use tabular figures. A large display size is reserved for arrival/overview, not repeated panels.

## Color DNA

The existing token families remain recognizable:

- Oxblood 900–500: authority, rail, selected institutional state, and bounded commitment.
- Gold 700–100: focus, primary action, current selection, and rare emphasis.
- Warm canvas/paper ladder: ground, work surface, inset evidence, raised inspector.
- Dark charcoal-oxblood ladder: designed dark hierarchy, not inversion.
- Five semantic tones: neutral, information, progress, done, alert.

Rules:

- One dominant accent target per view.
- Semantic status never uses gold merely for “premium” emphasis.
- Charts use labeled shape/line/pattern support in addition to color.
- Gradients are structural light or depth, never multi-color decoration.
- Transparency is limited to overlays and spatial context, not routine forms or tables.

## Surface DNA

| Layer            | Role                                | Treatment                                                  |
| ---------------- | ----------------------------------- | ---------------------------------------------------------- |
| Ground           | Page/environment                    | Flat warm or deep charcoal field                           |
| Work surface     | Primary task                        | High-contrast paper plane with rules and minimal elevation |
| Inset            | Filters, secondary evidence         | Slightly recessed tone, clear boundary                     |
| Raised inspector | Selected record/detail              | Stronger border/elevation and preserved underlying context |
| Overlay          | Command, confirmation, focused task | Highest elevation, modal semantics, no glass dependency    |

Radius communicates component scale rather than friendliness. Wide work panels should not all become large rounded rectangles. Tables and timeline regions can use square/rule-led internal structure within a bounded outer plane.

## Component archetypes

- Institutional rail and responsive route drawer.
- Global command palette with grouped, permission-safe results.
- Operational pulse strip for 3–5 factual metrics and exceptions.
- Exception ledger with severity, age, owner, and next action.
- Queue/table workbench with pinned identity/action columns.
- Filter grammar with URL-backed state and result count.
- Record inspector with summary, lifecycle, linked evidence, and actions.
- Lifecycle rail/timeline with current, completed, blocked, and future stages.
- Quantity cell with available/reserved/committed/physical truth.
- Action dock for a focused Release Desk workflow.
- Provenance footer for revision, source, and last reconciliation.
- State frame for loading, empty, partial, stale, denied, unavailable, and error.
- Playground-only component/state inspector after separate approval.

## Interaction DNA

- Hover confirms clickability but reveals no required information.
- Focus is always visible and never obscured by sticky elements.
- Pressed state is immediate; result state waits for backend confirmation.
- Selection persists across inspector open/close and, where privacy permits, in the URL.
- Inline edit is limited to reversible, low-risk fields with explicit save/cancel.
- High-risk or multi-record changes use a review plane that states scope and consequences.
- Command search supplements, never replaces, browse navigation.
- Filters announce their selected state, result count, and reset path.

## Motion DNA

Motion uses four families and an exit curve:

- **80–120 ms response:** press, focus reinforcement, toggle indicator.
- **160–220 ms state:** chip, row selection, validation, small expansion.
- **240–320 ms surface:** inspector, drawer, command palette, route-region replacement.
- **400–520 ms narrative:** one overview/public reveal, never a repeated task action.
- **Exit:** shorter and quieter than entry.

Preferred properties are opacity and transform. Height/width animation is rare and bounded. No bounce in institutional workflows. No continuous ambient loop outside an optional overview visualization. Reduced motion makes transitions effectively immediate while preserving focus and state.

## Spatial / 3D DNA

The only recommended 3D research target is an **Operational Topology** inside the Overview:

- Nodes represent real categories, events, inventory zones, or workflow clusters.
- State changes use restrained scale, material, or position shifts backed by a visible legend.
- Selecting a node updates an adjacent semantic 2D summary; the DOM remains authoritative.
- Camera reframing is automatic and bounded; orbit is optional and never required.
- The scene loads after critical overview content and disappears entirely under fallback conditions.

No other module requires 3D. A two-dimensional layered topology may prove equally distinctive at lower cost and should be evaluated first.

## Responsive DNA

The redesign must be composed at 1920, 1440, 1024, 768, 414, 390, 375, and 320 CSS pixels during implementation.

- ≥1440: full rail, asymmetric overview regions, optional adjacent inspector.
- 1024–1439: compact rail, reduced spans, inspector may overlay.
- 768–1023: route drawer, two-column overview maximum, simplified charts/spatial view.
- ≤767: single reading column, bottom action dock where justified, record-first tables, no 3D runtime, reduced motion.
- ≤414: labels wrap, no clipped command/preview chrome, touch targets remain at least the accepted minimum.

Tables do not simply become cards. Each module defines a mobile record summary, the fields required to compare, and the action that opens full detail.

## Accessibility DNA

- Target WCAG 2.2 AA for the approved implementation.
- Preserve landmarks, heading order, labels, descriptions, and error association.
- Do not hide focus behind sticky headers, rails, drawers, or action docks.
- Provide non-drag and keyboard alternatives for every spatial interaction.
- Status uses text plus icon/shape, not color alone.
- Announce asynchronous result state without moving focus unexpectedly.
- Authentication remains compatible with accessible-authentication requirements.
- Reduce or remove non-essential animation under user preference.

## Performance DNA

- Critical route HTML/CSS/data renders without animation or 3D dependencies.
- Optional visual systems are lazy, code-split, cancellable, and measurable.
- Avoid persistent blur, huge shadows, layout-thrashing measurement loops, and always-running observers.
- Reserve media dimensions and use governed optimized assets.
- At the time of this study, establish measured deltas from the then-current artifact rather than inventing absolute performance claims.
- A spatial proof must record transferred bytes, startup time, polygon/material/texture counts, frame stability, memory behavior, and fallback behavior.

## Expression by module

| Surface                   | Intensity | Design expression                                                                         |
| ------------------------- | --------: | ----------------------------------------------------------------------------------------- |
| Overview / Command Center |       5/5 | Unequal composition, one signature topology, animated factual change, exception-led pulse |
| Public landing            |       4/5 | Governed event-led editorial imagery, institutional masthead, one controlled reveal       |
| Inventory                 |       3/5 | Dense workbench, quantity truth, filter grammar, item inspector, subtle change emphasis   |
| Request Center            |       3/5 | Lifecycle clarity, owner/age/category, actionable queue, state rail                       |
| Lending Hub               |       3/5 | Availability and due-state timeline, borrower/asset clarity, reservation context          |
| Release Desk              |       2/5 | Focus mode, fast confirmation, outstanding items, audit evidence, minimal distraction     |
| Staff/Admin               |       1/5 | Calm forms, previews, revisions, explicit scope, deliberate destructive actions           |

## Anti-patterns

- Generic equal-card dashboard.
- Gaming/crypto HUD language.
- Neon or multi-color glow as identity.
- Glass containers over ordinary work.
- Hover-scale cards and animated borders.
- Everything rounded and floating.
- Scroll hijacking or route loaders.
- Masonry for transactional records.
- 3D tables, forms, required camera controls, or canvas-only information.
- Fake “success” before service confirmation.
- Browser-supplied environment, role, or capability.
- Framework migration or parallel design system solely for appearance.

## Why this is not an inspiration collage

The synthesis has one product metaphor, one color/typography identity, one surface ladder, one motion grammar, and one authority model. References contributed bounded principles to specific axes, while HAU-USC's real records, USC identity, and repository architecture determine the final language.
