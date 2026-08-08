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

## D9 - Reopen the preview under the owner amendment

**Decision:** treat the prior v4 closure as history and accept
`IMPECCABLE_V4_1_FEEDBACK_AMENDMENT.md` as the current front-end authority.

**Reason:** the owner rejected incremental reskinning and required an obvious
two-second structural delta while preserving routes, content model, and
workflow coverage.

## D10 - Make the public landing an institutional gateway

**Decision:** use the locally embedded production campus background, stable
official USC description, official Facebook link, and direct governed portal
actions; remove the tutorial.

**Cost:** volatile officers, announcements, counts, and events cannot be
hardcoded. Production identity is adapted, not cloned.

## D11 - Follow production Request Center boundaries

**Decision:** represent authenticated department identity, Create/Track,
New/Additional, event/sub-event dependency, item composition, and For Review
language. Preview state remains illustrative and non-persistent.

## D12 - Keep the celestial toggle in one live DOM tree

**Decision:** mutate theme state in place instead of wrapping it in a document
View Transition. This preserves actual thumb travel, form values, file input
safety, focus, and the surrounding scoped color crossfade.

## D13 - Replace generic controls with authored kinetic controls

**Decision:** retain immediately recognizable menu, theme, and back semantics
while giving each one a single purposeful motion signal, truthful ARIA state,
and reduced-motion substitute.

## D14 - Recompose overview and loading together

**Decision:** replace the equal metric wall with an editorial decision brief
and workbench. During loading, suppress every operational count and context
value until the atomic reveal.

## D15 - Keep profile and role changes preview-safe

**Decision:** profile images are local JPEG/PNG/WebP previews limited to 2MB;
role selection is a labelled preview dialog; the redundant committee scope
control is removed. None of these controls writes or claims authority.

## D16 - Record each Impeccable pass

| COMMAND | TARGET | FINDING | IMPLEMENTED CHANGE |
| --- | --- | --- | --- |
| critique | v4 shell and representative surfaces | Tutorial landing, conventional panel wall, decorative elbows, and generic controls preserved too much prior fingerprint. | Removed non-semantic geometry and pinned three macro recompositions plus distinctive controls. |
| bolder | Landing and overview | No decisive institutional focal point or dominant operational decision line. | Added the campus-backed USC hero and asymmetric decision brief/workbench. |
| animate | Theme, menu, back, route, and loading | State feedback was generic and did not express the visual world. | Added finite celestial, kinetic-menu, back-travel, campus-arrival, route, progress, and row choreography with reduced-motion paths. |
| layout | Landing, Request Center, overview, and shell | Repeated equal containers and linear stacking flattened priority. | Rebuilt the hero/action hierarchy, tabbed request flow, decision brief, route rail, command topbar, and mobile navigation. |
| typeset | Institutional and operational hierarchy | Existing scale did not separate public institution, task heading, and dense operations strongly enough. | Strengthened bounded Bricolage display scales while retaining Plex operations text and Newsreader wordmark roles. |
| colorize | Light/dark materials and controls | Oxblood/gold often read as decoration; floating/state chrome lacked material hierarchy. | Reserved gold for active signal, authored warm-paper and charcoal ladders, and localized glass to floating controls. |
| delight | Theme, menu, back, portal, and profile | Functional controls lacked branded tactile feedback. | Added the moving celestial plate, line geometry, arrow nudge, campus settle, action-arrow response, and local image preview. |
| adapt | 320–1440 layouts | Desktop compositions and dense forms risked cramped mobile behavior. | Reflowed hero, Request composer, profile, overview/support rail, drawer, compact harness, and safe-area bottom navigation. |
| harden | Local state, privacy, and export | Theme rerender could lose state; role/profile/request actions could imply persistence; the image could create a network dependency. | Mutated theme in place, validated local images, excluded file restoration, stated preview boundaries, removed scope cycling, secured external links, and embedded the campus image. |
| audit | Registry, export, accessibility, and evidence | Complete shape, containment, motion, and a genuine visual delta needed proof. | Verified 33/53 parity, six widths, contrast, theme, 13 motion scenarios, 21 curated captures, 8 comparison pairs, source/export parity, and Git containment. |
| polish | Hover signals and narrow preview chrome | Parent/child hover feedback could stack and the harness consumed too much mobile viewport. | Reduced hover to one visible signal, neutralized generic lifts, compacted the narrow harness, and captured bottom-nav clearance. |
