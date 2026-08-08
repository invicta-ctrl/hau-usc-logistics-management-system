# Impeccable v4 decisions

V4 is a documentation and preview checkpoint, not an application-runtime
change. Each decision below is bounded by the accepted v3 and product
constraints.

## D1 - Preserve the v3 registry and behavior vocabulary

**Decision:** keep the v3 route/state/navigation shape and verify it with
`registry-parity.mjs`; v4 reports 33 routes and 53 state variants.

**Reason:** every representative workflow, public/internal boundary, status,
queue, lending, release, inventory, event, account, audit, and owner-health
concept remains reviewable while the visual direction changes.

**Cost:** the v4 source carries the inherited layers and must keep export order
stable. A visual redesign cannot silently delete or rename a route.

## D2 - Use an additive Route Console layer

**Decision:** keep `styles/v3.css` as the accepted baseline and load
`styles/v4.css` last.

**Reason:** the visual delta is auditable and reversible; semantic render
primitives, vocabulary, focus management, and sanitized data stay intact.

**Cost:** selectors from inherited layers can still participate in the final
cascade, so the generated export and screenshots must be regenerated after
source changes.

## D3 - Pin Map / Diagram, N13, N5, and Ft5

**Decision:** adopt Hallmark's modern-minimal genre with Map / Diagram
macrostructure, reproducible `surface / operate / 00000004` candidate seed 5,
N13 authenticated command pill, N5 public floating bar, and Ft5 statement
close. The seed replay was degraded and supplied no catalog challenger or
QUALITY BAR board.

**Reason:** 33 role-scoped routes need visible route identity and compact search;
public intake needs calmer orientation; the custody statement closes the public
journey without marketing language.

**Cost:** route lines and nodes become a strong visual signature and must never
compete with the queue's operational facts.

## D4 - Keep the institutional identity and local typography

**Decision:** retain oxblood/gold and authored light/dark surface ladders;
bundle Bricolage Grotesque, IBM Plex Sans, and Newsreader and make no remote
font or image request.

**Reason:** product identity and the offline preview boundary are binding; local
fonts make the export deterministic.

**Cost:** the preview owns a small font payload and cannot rely on a provider's
latest type rendering.

## D5 - Make motion finite and state-bound

**Decision:** use route arrival, staged boot, loading assembly, selection,
overlay, theme, and completion choreography with bounded durations; remove
perpetual shimmer/decorative loops.

**Reason:** motion should clarify handoff order and state, not distract from
custody work. This follows the v3 motion contract and the authoritative
motion/a11y references recorded in the v4 motion document.

**Cost:** a loading state may feel less animated, so visible copy and `aria-live`
  meaning must carry the state when motion is disabled.

## D6 - Treat View Transition API as enhancement only

**Decision:** use `document.startViewTransition` when present; use a finite CSS
route/state arrival when it is absent; keep synchronous render, focus, and
state update as the reduced-motion path.

**Reason:** the offline file must work in browsers without the API and reduced
  motion must not wait for animation.

**Cost:** browsers differ in transition polish; acceptance is based on final
state, semantics, and finite behavior rather than API presence.

## D7 - Preserve public privacy and operational truth

**Decision:** keep public routes narrower, label illustrative values, avoid raw
  enums, expose no protected stock/evidence/roster/supplier/audit internals, and
  retain “submission does not reserve stock” wording.

**Reason:** visual simplification cannot weaken accountable custody, privacy,
  authorization, or truthful unknowns.

**Cost:** the preview cannot demonstrate live data or a production workflow;
  those remain outside this artifact.

## D8 - Keep verification and review claims honest

**Decision:** record automated local evidence (verify, contrast, theme, motion,
registry, and 12-capture review set) plus the fresh finish-review verdict. The
Impeccable detector ran once, emitted three warnings, all were repaired, and
was not rerun. The reviewer initially returned `fix`; after one repair and
recapture batch it scored all five findings resolved and returned `ship`.

**Reason:** evidence must distinguish completed checks, independent judgment,
and Git closure.

**Closure:** implementation commit
`20af331b0a749fa5a88f897f084fa8d29f645bdd` is pushed to the design branch.
The Impeccable documenter completed `DESIGN.md` and the schema 2 sidecar. The
missing QUALITY BAR card limits card-relative ceiling scoring but is not an
open material finding. PR, merge, deployment, release, and production remain
outside this checkpoint.
