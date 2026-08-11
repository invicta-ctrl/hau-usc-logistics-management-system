---
name: HAU-USC Logistics Management System V5
description: Editorial institutional operations with a governed, event-led public gateway.
colors:
  oxblood-900: '#40070a'
  oxblood-800: '#610b0f'
  oxblood-600: '#8d1f28'
  gold-400: '#e8b93c'
  gold-200: '#f6e29a'
  gold-100: '#faeecb'
  canvas-light: '#e9e0d0'
  paper-light: '#fffdf8'
  ink-light: '#241416'
  canvas-dark: '#100b0c'
  paper-dark: '#1f1719'
  ink-dark: '#f7efe6'
typography:
  display: '"Bricolage Grotesque Local", "Bahnschrift", system-ui, sans-serif'
  body: '"IBM Plex Sans Local", "Aptos", "Segoe UI Variable", system-ui, sans-serif'
  wordmark: '"Newsreader Local", "Palatino Linotype", Georgia, serif'
rounded:
  xs: '6px'
  sm: '10px'
  md: '14px'
  lg: '18px'
  pill: '999px'
spacing:
  s-1: '4px'
  s-2: '8px'
  s-3: '12px'
  s-4: '16px'
  s-5: '20px'
  s-6: '24px'
  s-8: '32px'
  s-10: '40px'
  s-12: '56px'
motion:
  press: '120ms'
  minor: '200ms'
  surface: '280ms'
  overlay: '320ms'
  reveal: '400ms'
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)'
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)'
---

# HAU-USC Logistics V5 design system

## North star

V5 is the current application, not a preview skin: an editorial institutional gateway joined to a disciplined operational workbench. Oxblood establishes authority, gold identifies focus and decisive action, warm paper carries light mode, and charcoal-oxblood carries dark mode. The interface must preserve every governed backend, privacy, inventory, lending, release, and authorization boundary.

The supplied `impeccable-whole-site-redesign-v5` prototype is the visual and interaction authority. Integration may bind real data and add safety controls, but it must not introduce a competing theme or generic dashboard language.

## Public gateway

The public landing follows a Marquee Hero / Photographic Fold composition. Its cover is full-bleed across the page canvas, uses the active governed landing-media asset, and keeps the copy legible through an oxblood wash. The masthead is large enough to read as university identity: published USC and DOL marks appear together in the header; the hero carries the USC mark only. The primary hero action is `Staff sign in`.

The accepted Impeccable bolder refinement amplifies only this arrival moment:
the masthead spans the page as an institutional banner, while the hero uses a
tighter asymmetric headline, concentrated oxblood field, decisive gold
actions, and one restrained photographic reveal. The remaining landing
sections and the application workbench keep their established rhythm.

Landing content is event-led. A published announcement may select the hero image, title, summary, call-to-action, and bounded named presentation variant. Only validated media, plain text, HTTPS/same-origin links, and allowlisted variants may render. No stored HTML, CSS, browser-supplied object key, or provider binding is accepted.

The portal rail remains typographic and asymmetric. Request Center uses a warm gold field with oxblood ink; gold is not used as decoration elsewhere. Official USC updates is a generous editorial feature rather than a compressed card. The statement footer closes with `HAU-USC · © 2026–2027` and the existing policy link.

## Authentication and playground

Staff sign-in keeps Production’s centered gateway hierarchy, field order, error language, activation path, and privacy boundary while using V5 tokens and responsive behavior.

The Isolated Staging Playground may provide a server-authorized owner test session only after the Worker proves `ENVIRONMENT=STAGING`, `PLAYGROUND_MODE=true`, and the fixed playground label. The browser cannot choose a role or capability. `Test real login flow` explicitly disables the convenience session for that browser. Production never exposes the shortcut, preview bar, or Index.

Email verification codes are exactly eight decimal digits. They retain the current non-enumerating response, expiry, resend limit, attempt limit, one-time consumption, digest-only storage, and audit behavior. Status, activation, CSRF, session, and reset tokens remain high-entropy tokens.

## Application workbench

Authenticated pages retain the frozen V5 route registry, route rail, command search, theme control, overlays, forms, tables, and state model. Workbench pages use one dominant operational surface and real service data; they do not become equal-card walls. The Index retains the prototype’s grouped navigation, route search, theme controls, and route behavior.

## Responsive and interaction rules

- Verify 320, 375, 390, 414, 768, 1024, and 1440 CSS-pixel widths with no horizontal overflow.
- Headings use `min-width: 0` and safe wrapping. Primary controls and navigation labels stay on one line.
- Images use intrinsic dimensions, stable aspect ratios, `object-fit: cover`, and high-priority loading only for the LCP cover.
- Touch targets are at least 44px. Every interactive element has visible focus, disabled, loading, and error treatment.
- Use transform/opacity motion with the named durations and easings. No bounce, parallax, endless decoration, or layout-property animation. Reduced motion collapses spatial transitions.
- Light and dark modes are authored states, not inversions. Color never carries status alone.

## Governed media slots

Existing brand slots remain authoritative for USC logo, DOL logo, combined lockup, login/landing background, favicon, and default item imagery. Existing advertisement management remains authoritative for event/announcement media and lifecycle. Administrative controls may explain these landing/theme uses, but must reuse the existing upload validation, R2 isolation, revision checks, publication, scheduling, rollback, and capability gates.

## Do

- Preserve current V5 routes, behavior, backend contracts, and exact environment guards.
- Use published USC/DOL assets and official organizational photography.
- Keep copy specific, operational, and institutionally grounded.
- Keep Production, D1, R2, Google, and provider writes outside this playground-only implementation.

## Do not

- Do not add a second theme, ungoverned upload endpoint, arbitrary CSS, or remote executable asset.
- Do not fabricate officers, announcements, metrics, inventory, or production state.
- Do not make a client-only authentication bypass or accept a browser-supplied environment flag.
- Do not alter the data schema or start M1/M2.
