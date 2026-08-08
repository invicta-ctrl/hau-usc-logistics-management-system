# Impeccable v4 reference research

Date: 2026-08-08
Scope: visual direction, motion, and accessibility principles for the isolated
v4 preview. These notes do not authorize product-runtime changes.

## Source classes

The two visual galleries below are **inspiration only and non-normative**. They
were used to look for hierarchy, pacing, and editorial confidence; no layout,
copy, image, animation, logo, or component was copied.

- [Tabnav - Best Website Design Examples](https://tabnav.com/blog/best-website-design-examples)
- [BlueZoo - Best Websites for Web Design Inspiration](https://bluezooweb.com/best-websites-for-web-design-inspiration-brilliant-examples-to-boost-your-creativity/)

The following are **authoritative motion or accessibility references**. They
are not brand references and do not replace the product's accepted constraints:

- [IBM Carbon Motion - Overview](https://carbondesignsystem.com/elements/motion/overview/)
- [IBM Carbon Motion - Choreography](https://carbondesignsystem.com/elements/motion/choreography/)
- [Fluent 2 Motion](https://fluent2.microsoft.design/motion)
- [Atlassian Design - Motion](https://atlassian.design/foundations/motion)
- [Atlassian Design - Applying motion](https://atlassian.design/foundations/motion/applying-motion)
- [Apple Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion/)
- [W3C WCAG 2.1 - Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [W3C CSS technique C39 - prefers-reduced-motion](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [MDN - View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

## Principles extracted

1. **Remove noise before adding signal.** The v4 map uses rules, route nodes,
   and one dominant work surface instead of decorative card walls.
2. **A transition should explain a relationship.** Carbon's choreography and
   Fluent's functional motion guidance support using the same motion for the
   same intent. V4 therefore connects route, selection, disclosure, and state
   changes to the route geometry already visible in the shell.
3. **Keep movement near the task.** Atlassian, Apple, and Fluent all caution
   against motion that distracts from the focused object. V4 scopes route and
   overlay transitions to the stage or overlay and keeps hover movement small.
4. **Make the final state available without animation.** W3C's Animation from
   Interactions criterion and the MDN reduced-motion guidance require a user
   path that can remove or replace non-essential movement. V4's media query
   resolves opacity, transforms, and view transitions to a near-instant final
   state while retaining labels, text, and focus semantics.
5. **Use view transitions as an enhancement, not a dependency.** MDN documents
   the same-document API and its availability limits. V4 calls it only when
   supported, uses finite CSS route/state arrival when it is unavailable, and
   keeps the synchronous final-state path for reduced motion.
6. **Design mobile as the same route, not a reduced product.** At 320, 375,
   and 414 pixels the rail becomes a drawer and the command pill becomes compact,
   but status, quantities, and the primary action remain present.

## How this became v4

The research is interpreted through the accepted repository authorities:

- `PRODUCT.md` keeps accountable custody, public/internal separation, truthful
  unknowns, labelled statuses, and no stock deduction at request submission.
- `DESIGN.md` and the v3 records keep oxblood/gold identity, local/offline
  typography, semantic tables, 44px targets, keyboard and dialog semantics,
  200% zoom, no colour-only status, and `prefers-reduced-motion` support.
- `prototypes/impeccable-whole-site-redesign-v4/src/registry.js` remains the
  route/state source of truth: 33 routes and 53 variants with v3 shape parity.
- `styles/v4.css` makes the interpretation concrete: Map / Diagram geometry,
  N13 authenticated command pill, N5 public floating bar, route lines and
  nodes, and the finite loading choreography.

## Explicit anti-copy and preview boundary

The galleries are not requirements and the design-system sources are not a
license to import their components, colours, or brand language. V4 keeps the
HAU-USC institutional world, plain operational copy, bundled fonts, and
monoline icon geometry. The preview uses fictional `*-DEMO-*` identifiers,
invented events, and a visible public no-live-record label. The independent
finish reviewer resolved the fixture-safety finding and gave disposition
**ship**. The artifact contacts no service and does not change application
source, backend, providers, migrations, deployment, release, or production
state.

## V4.1 production and institutional grounding

The v4 result above is historical. The accepted v4.1 amendment adds a fresh
baseline pass without turning production into a template:

- The current production login, portal selector, Request Center, and Lending
  Hub were inspected at `https://logistics.hausc.org` on 2026-08-08. The
  preview adapts its governed route boundaries, campus-at-dusk identity,
  translucent cream material, and Request Center information architecture.
- The campus asset is a local optimized copy of production
  `/brand/login-background`; `export.mjs` embeds it as a data URL, so the
  shareable HTML makes no external image request.
- Stable Student Council facts come from the official HAU organization page:
  `https://www.hau.edu.ph/organizations/356a192b7913b04c54574d18c28d46e6395428ab`.
  Mission language was checked against
  `https://www.hau.edu.ph/about/mission-vision`.
- The landing links to the official USC Facebook page at
  `https://www.facebook.com/holyangeluniversitysc`. It does not copy volatile
  officers, engagement counts, or logged-out feed content.
- The complete requested design-reference extraction lives in
  `IMPECCABLE_V3_EXTERNAL_DESIGN_DNA.md`. Mobbin was unavailable in this
  session and no Mobbin screen evidence is claimed.

The production frontend is a workflow and material baseline. The public
gateway, operational command brief, celestial theme control, kinetic menu,
compact back control, and responsive shell remain authored for this preview.
