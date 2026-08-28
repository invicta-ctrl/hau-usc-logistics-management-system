# P15 UI/UX Research Decision Note

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_CURRENT_PRIMARY_SOURCE_RESEARCH
ROUTE: SOLO

## Patterns adopted

- Keep records, queues, tables, forms, history, warnings, and long text on solid high-legibility surfaces. Reserve restrained translucency for navigation and transient functional layers, with an opaque semantic-color fallback. This follows Apple’s separation of control/navigation materials from content and Microsoft’s performance-aware, fallback-capable material layering.
- Use tables for operational records: concise sentence-case columns, consistent row/header density, explicit sort state, keyboard-operable headers and cell controls, progressive row detail, and pagination only when the data volume or load cost warrants it.
- Use mobile-first, content-driven breakpoints rather than device labels. Preserve the same task and consequence hierarchy at every width; adapt navigation and data presentation without hiding authoritative values or requiring hover.
- Treat WCAG 2.2 AA as the floor: 4.5:1 normal-text contrast, 3:1 required control/state contrast, visible and unobscured keyboard focus, 200% text resizing without loss, and pointer targets of at least 24 by 24 CSS pixels or compliant spacing. Prefer approximately 48-pixel touch targets for primary mobile controls.
- Measure the exact deployed candidate against current Core Web Vitals at the 75th percentile: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1. Reserve media geometry, avoid late layout insertion, bound initial data, and keep interaction work small.

## Patterns rejected

- Glass/translucency across tables, forms, warnings, audit history, or nested content cards: it weakens hierarchy and contrast and adds rendering cost where users need stable dense information.
- Decorative blur, glow, gradients, motion, or oversized imagery without a functional layer or state purpose: these compete with operational content and can harm LCP, INP, legibility, and reduced-motion behavior.
- Device-name breakpoints, hover-only discovery, tiny icon-only actions, and horizontal clipping as a mobile strategy: these fail capability diversity and can hide actions or record meaning.
- Card walls as a substitute for sortable/filterable records, fake dashboard metrics, and excessive pagination: these increase scanning and interaction cost without improving task completion.
- Client-only preference or visual state that flashes after sign-in: state must be applied before the authenticated shell mounts and retain a solid fallback.

## Consequences

PERFORMANCE: The design pass must reduce initial and interaction work, reserve space for delayed content, constrain material effects, and preserve the P25 measurement gates rather than adding decorative payload. Large record sets remain bounded, searchable, and progressively disclosed.

ACCESSIBILITY: Semantic hierarchy, contrast, keyboard/focus behavior, target size, zoom/reflow, reduced motion, and non-hover operation override literal visual effects. Light, Dark, and System themes must all satisfy the same state and contrast rules.

## Primary sources consulted

- W3C, WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C, Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- W3C, Non-text Contrast: https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html
- Apple Human Interface Guidelines, Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Microsoft Learn, Mica material: https://learn.microsoft.com/en-us/windows/apps/design/style/mica
- IBM Carbon Design System, Data table usage and accessibility: https://carbondesignsystem.com/components/data-table/usage/ and https://carbondesignsystem.com/components/data-table/accessibility/
- web.dev, Responsive web design basics: https://web.dev/articles/responsive-web-design-basics
- web.dev, Web Vitals and CSS for Web Vitals: https://web.dev/articles/vitals and https://web.dev/articles/css-web-vitals

## Next exact action

Begin P16 Anti-AI-slop design rules. Audit the exact current candidate against the accepted avoid/prefer lists and record the smallest concrete design corrections needed before the broader UI refinement phases.
