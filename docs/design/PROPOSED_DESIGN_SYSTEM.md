<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Proposed V5 design system evolution

## Status

**DESIGN GATE PROPOSAL — NOT ACCEPTED IMPLEMENTATION AUTHORITY.** This document translates the reference research into a maintainable system that fits the existing repository. It does not replace [`DESIGN.md`](../../DESIGN.md), authorize a dependency, or permit staging deployment.

## Architecture decision

Keep the current V5 architecture:

- `src/v5/src/registry.js` remains the route/surface inventory and state-variant map.
- `src/v5/src/app.js` remains the shell and surface renderer.
- `src/v5/src/surfaces/*` remain semantic surface compositions.
- `src/v5/integration/runtime.js` remains the binder between rendered surfaces and real runtime state/actions.
- Integration controllers remain responsible for bounded capability-specific actions.
- `src/v5/integration/backend.js` remains the client boundary to current service adapters.
- CSS remains layered from tokens → base → shell → components → surfaces → motion → responsive → accepted refinements.

No React migration, second router, parallel component tree, or decorative backend adapter is proposed. The redesign should improve named layers, not introduce a second application.

## Proposed component strata

### 1. Foundations

- Color, type, space, radius, border, elevation, and motion tokens.
- Focus, selection, status, disabled, loading, and reduced-motion contracts.
- Responsive container and grid primitives.

### 2. Shell

- Institution rail.
- Command band.
- Route drawer and compact tab/action dock.
- Environment/role context.
- Page/record breadcrumbs where task depth requires them.

### 3. Operational primitives

- Filter grammar and result summary.
- Queue row, table cell families, quantity truth cell.
- Status label, urgency marker, owner/provenance marker.
- Record inspector and lifecycle rail.
- Evidence block and revision footer.
- Confirm/review plane and focused action dock.

### 4. Compositions

- Operational pulse.
- Exception ledger.
- Queue workbench.
- Inventory workbench.
- Lending availability/timeline.
- Release focus mode.
- Governance editor with preview/revision comparison.

### 5. Optional expression

- Two-dimensional operational topology.
- Separately evaluated lazy spatial/3D topology.
- Public event-led photographic composition.
- Animated factual change indicator.

### 6. State and evidence

- Loading skeleton that preserves final geometry.
- Empty state with permitted next action.
- Partial/stale/unavailable state with source and retry guidance.
- Denied state that does not leak protected data.
- Error state that preserves entered data where safe.
- Success confirmation tied to a real service result and reference.

## Token policy

The current identity and 4 px spacing foundation remain. Evolution should add semantic aliases instead of proliferating raw values.

### Color roles

```text
environment ground
working plane
inset evidence
raised inspector
overlay
institution authority
decisive focus/action
neutral / information / progress / done / alert
```

Gold remains scarce: focus ring, selected locator, one primary action, or exceptional metric emphasis. Semantic progress and alert retain their own color contracts.

### Spacing roles

```text
control: 4–8
row: 8–16
group: 16–24
section: 24–40
chapter: 40–56+
```

Spacing decisions are expressed by role, not arbitrary per-page constants.

### Surface roles

```text
ground → work → inset → raised → overlay
```

Every new component declares its layer. Shadows are limited to raised/overlay roles. Borders and tone shifts do most grouping work.

### Radius roles

- 6 px: compact controls, cells, tags.
- 10 px: fields, rows, compact panels.
- 14 px: inspector and bounded composition.
- 18 px: public/overview feature only.
- Pill: status or compact toggle only; never a general container.

## Typography system

- Display/local Bricolage: overview title, exceptional metric, public statement.
- Body/local IBM Plex Sans: all work and controls.
- Wordmark/local Newsreader: USC institutional identity and rare editorial emphasis.
- Mono: immutable references, revisions, receipts, diagnostics.

Add named roles rather than new fonts: `display`, `page-title`, `section-title`, `body`, `body-compact`, `label`, `caption`, `metric`, `tabular`, `reference`. The implementation must retain text zoom, wrapping, and line-height resilience.

## Motion language

| Family    | Proposed duration | Use                                              | Never use for                |
| --------- | ----------------: | ------------------------------------------------ | ---------------------------- |
| Response  |         80–120 ms | press, focus reinforcement, toggle               | backend completion           |
| State     |        160–220 ms | selected row, validation, chip, small disclosure | route loading                |
| Surface   |        240–320 ms | inspector, drawer, command overlay               | repeated table updates       |
| Narrative |        400–520 ms | one overview/public reveal                       | queue, form, release actions |

Easing is fast-settling, non-bouncy. Exit is shorter than entry. Preferred properties are transform and opacity. The application never waits for animation to expose content or focus.

### Reduced motion

- Response remains an immediate non-moving state change.
- State/surface motion becomes near-instant opacity or no transition.
- Narrative reveal is removed.
- Charts update without interpolation.
- Spatial scene is replaced with or frozen behind the authoritative 2D summary.

## 3D language and decision ladder

### Step 1 — prove the information model in 2D

Build an accessible operational topology from real overview data. It must explain relationships more clearly than existing metrics before any runtime is selected.

### Step 2 — measure a disposable playground proof

If Earl approves 3D research, compare a lightweight native/WebGL approach and a Spline export only under a separate dependency/license packet. Record asset/runtime size, startup, frame stability, GPU/memory behavior, interaction alternatives, narrow-viewport fallback, and reduced motion.

### Step 3 — accept only if it improves comprehension

The 3D variant must outperform the 2D version in a defined owner test such as locating low-stock clusters, understanding event-to-inventory allocation, or seeing blocked workflow relationships. “Looks more premium” is insufficient.

### Hard constraints

- Overview only in the first evaluation.
- DOM text, controls, legends, and actions remain authoritative.
- No required drag/orbit.
- No forms, tables, quantities, or audit history in canvas.
- Lazy load after critical content; no route loader.
- No production runtime until separately accepted and tested.

## Accessibility constraints

- WCAG 2.2 AA target.
- Focus not obscured by sticky shell/inspector/action dock.
- Minimum target sizing follows the accepted accessibility baseline; dense tables may use compact row height only when controls retain usable targets.
- Dialogs and command palette: name, focus trap, Escape, focus return.
- Tables retain headers and relationships; mobile representation preserves comparison and access to complete detail.
- Charts/spatial view include text summary, legend, keyboard selection, and non-color state.
- Errors are associated with fields and summarized without erasing input.
- Async changes announce useful results, not every visual animation.
- Authentication and verification preserve non-enumeration and accessible input semantics.

## Performance constraints

Before an approved implementation slice, record the current V5 artifact and route runtime as the baseline. Then enforce deltas:

- No optional visual dependency on the critical route path.
- No always-running animation outside the visible optional overview feature.
- No unbounded DOM observer or per-row layout measurement loop.
- No routine backdrop blur or large multi-layer shadow.
- Governed media uses reserved dimensions, responsive formats, and lazy loading where non-critical.
- Spatial proof records total added transferred bytes and executable JS, scene/object/polygon/material/texture counts, startup/idle cost, sustained frame behavior, and fallback.
- Test representative integrated-GPU and mobile-class conditions, not only the design workstation.

Acceptance should use Core Web Vitals targets as guardrails—LCP 2.5 seconds or better, INP 200 ms or better, and CLS 0.1 or better at the 75th percentile—while recognizing that staging laboratory results are not field data.

## Responsive system

|     Width | Shell                               | Work plane                              | Inspector           | Expression                                |
| --------: | ----------------------------------- | --------------------------------------- | ------------------- | ----------------------------------------- |
| 1440–1920 | full institution rail               | named asymmetric grid or wide workbench | adjacent            | full 2D; approved 3D may load             |
| 1024–1439 | compact rail                        | reduced grid spans                      | adjacent or overlay | simplified spatial detail                 |
|  768–1023 | drawer + compact command band       | one/two columns                         | overlay/full route  | 2D only by default                        |
|   320–767 | route drawer + optional action dock | one record-first column                 | full route/sheet    | no 3D, no decoration required for meaning |

Each module must define its own structural transformation. No global “stack all cards” rule is accepted.

## State contract

Every redesigned surface demonstrates the variants already declared in `registry.js` plus any newly accepted contract-required state. State previews belong in the isolated playground and never fabricate a successful mutation. The runtime still projects actual backend results into:

```text
loading
loaded/populated
empty
partial or stale
unavailable
denied
error
success confirmed by backend
```

## Component acceptance checklist

Before a primitive can support more than one module:

- It recurs with the same semantic role.
- Its keyboard/focus behavior is specified.
- Light/dark and reduced-motion behavior are specified.
- Loading, empty, error, denied, and long-content behavior are understood where relevant.
- It does not accept browser-provided permission/environment authority.
- It has no `noop` production action.
- It is inspected at 320, 390, 768, 1024, and 1440 at minimum.
- It passes Hallmark anti-generic review and the applicable Impeccable audit.

## Rollout rule

Do not extract the entire proposal into production tokens/components at once. The accepted first slice should introduce only the foundations and components proven by that slice. Later modules reuse or refine them through an accepted amendment, avoiding a speculative mega-library.
