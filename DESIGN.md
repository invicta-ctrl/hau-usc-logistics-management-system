---
name: HAU-USC Logistics Management System
description: Premium institutional operations with editorial command surfaces and purposeful choreography.
note: >-
  Reconciled to the PRODUCTION token layer (src/styles/visual/tokens-base.css)
  on 2026-08-09 under .codex/specs/active/v0.7.3-frontend-design-integration.md.
  It previously described the V4.1 PREVIEW system - Bricolage Grotesque, a 12px
  label / 16px body ramp, oklch colours - which production never shipped. The
  detector measures source against this block, so the mismatch reported real
  production values as drift. The prose below still states the V4.1 direction;
  this block states what production actually renders.
colors:
  oxblood: "#3A0608"
  burgundy: "#610B0F"
  maroon: "#911414"
  crimson: "#B32B2F"
  antique: "#AF7925"
  metallic: "#D3A73F"
  bright: "#F4CB30"
  light-gold: "#F8DC78"
  cream: "#F1E5CA"
  bg: "#ece3d2"
  paper: "#FFFDF8"
  paper-2: "#f8f1e3"
  paper-3: "#ffffff"
  white: "#FFFFFF"
  ink: "#381517"
  ink-2: "#5c4340"
  muted: "#6b5450"
  line: "#ddcdb0"
  line-strong: "#c4a469"
  line-hair: "#e8dcc4"
  green: "#276448"
  green-bg: "#E7F4EA"
  amber: "#7D520E"
  amber-bg: "#FFF4CB"
  red: "#9B2024"
  red-bg: "#FFF0ED"
  blue: "#315F7F"
  blue-bg: "#EAF3F8"
  violet: "#684780"
  violet-bg: "#F2ECF8"
  gray: "#5E6268"
  gray-bg: "#EEF0F2"
typography:
  display:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "clamp(34px, 3.6vw, 54px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  headline:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "30px"
    fontWeight: 400
    letterSpacing: "-0.022em"
  title:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "20px"
    fontWeight: 400
  numeral:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "44px"
    fontWeight: 400
    fontFeature: "tabular-nums"
  body:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", ui-sans-serif, Arial, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", ui-sans-serif, Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 700
  label:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", ui-sans-serif, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.1em"
  micro:
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", ui-sans-serif, Arial, sans-serif'
    fontSize: "10px"
    fontWeight: 600
rounded:
  xs: "6px"
  sm: "12px"
  md: "18px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
elevation:
  elev-1: "0 1px 2px rgba(58,6,8,0.05), 0 2px 8px rgba(58,6,8,0.05)"
  elev-2: "0 2px 6px rgba(58,6,8,0.07), 0 10px 26px rgba(58,6,8,0.09)"
  elev-3: "0 8px 20px rgba(58,6,8,0.13), 0 28px 60px rgba(58,6,8,0.18)"
motion:
  press: "120ms"
  micro: "190ms"
  component: "220ms"
  route: "280ms"
  overlay: "320ms"
  hero: "420ms"
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"
---

# Design System: HAU-USC Logistics Management System

## Overview

**Creative North Star: “Institutional Command / Operational Choreography.”**

V4.1 is a premium institutional operations interface, not a generic dashboard
with university colors. The public experience opens on a cinematic campus
gateway that introduces the Holy Angel University Student Council and routes
people into the governed Request Center, Office Lending, or staff sign-in. The
authenticated experience is an editorial command environment: a persistent
route rail, compact command topbar, exception-first operational brief, and
semantic work surfaces for queues, inventory, release, events, and
administration.

Oxblood anchors institutional authority. Muted gold identifies the active
route, focus, and moments that genuinely require attention. Light mode is a
bright paper workspace; dark mode is a separately authored charcoal and
oxblood world. Motion explains cause, hierarchy, continuity, navigation, or
completion and always comes to rest.

The design preserves all 33 routes and 53 state variants. Preview records are
fictional and visibly labelled; interactions never claim a backend write.

## Colors

The palette separates structure, signal, and content:

- **Oxblood** is the institutional anchor for navigation, decisive actions,
  hero atmosphere, and operational briefs.
- **Gold** is scarce. It marks active controls, focus, selected routes, and
  high-value status emphasis rather than decorating every container.
- **Warm paper** gives light mode crisp figure/ground separation without
  beige-on-beige muddiness.
- **Charcoal and near-black oxblood** form dark mode’s cinematic ground, with
  off-white type and restrained luminous edges.
- **Semantic green, amber, red, and blue-gray** reinforce status labels and
  icons. Color never carries meaning alone.

Lines are semantic. A rule may connect a route, divide data, or indicate
selection; decorative corner and heading lines are removed.

## Typography

Bricolage Grotesque is the product voice for display, page, and surface
headings. Its large editorial scale establishes one clear reading order rather
than making every card, metric, and action equally loud. IBM Plex Sans handles
body copy, data, forms, navigation, and controls. Newsreader is reserved for
the HAU-USC wordmark so institutional identity stays distinctive without
turning the whole interface into a serif composition.

Labels are concise and uppercase only when they identify a route, state, or
section. Operational values use tabular numerals. Headings and display
statements must wrap safely at 320px and 200% zoom.

## Layout

The public landing is a full-bleed image-led gateway inside a floating glass
identity bar. It contains no step tutorial. The authenticated shell uses a
persistent desktop route rail, a command topbar, and wide editorial working
canvas. The Control Centre is intentionally asymmetric: a narrative brief
sets priority on the left while decision counts and context align on a shared
operational field to the right.

The Request Center follows the production frontend boundary: authenticated
department identity, Create/Track modes, New/Additional request choice,
event/sub-event dependency, item composition, review language, and a visible
For Review outcome. Queue/detail and table surfaces preserve semantic table
relationships instead of becoming card walls.

At 1023px the route rail becomes an off-canvas drawer. At 767px the command
bar compacts, content stacks in task order, and five primary destinations move
to a fixed bottom navigation with safe-area and scroll clearance. The preview
harness labels actual mobile/tablet/desktop capture state truthfully.

## Elevation & Depth

Elevation is earned by layer behavior. The floating public bar, command menu,
dialogs, drawer, and mobile tabbar may cast a restrained shadow because they
sit above the route. Ordinary work sections use paper tone, proximity,
alignment, and hairlines. Localized translucent surfaces use blur and a fine
gold/oxblood edge; the entire application is never washed in glass.

The campus hero gains depth from its real production image, oxblood overlay,
and readable foreground type—not artificial bevels, gradients-as-photography,
or stacked translucent cards.

## Shapes

Controls use asymmetric route radii that feel authored for the product. Pills
are reserved for the celestial toggle, compact status, and tightly grouped
mode controls. The menu remains recognizably three lines while its geometry
shifts into an open/close state. The back control is compact, optically aligned,
and pairs a small gold glyph plate with a glass label surface.

Icons are bundled monoline SVGs. They sit directly beside labels unless a
functional plate is needed for state, target, or focus. Repeated rounded-square
icon containers and ornamental elbows are prohibited.

## Components

### Celestial theme control

Both sun and moon remain visible at opposite ends of a 76px dark capsule. A
32px active plate compresses on press, travels 38px in 240ms, and settles
without bounce. The accessible name describes the next action, `aria-pressed`
is truthful, selection persists, and reduced motion changes state through a
fast color/opacity path without long travel or rotation.

### Kinetic menu and compact back

The menu’s three lines react as the single hover signal and transform into the
drawer state in 180–240ms. Its parent surface does not also lift. The back glyph
moves 2–4px in the travel direction on hover; press compresses subtly. Both
controls keep a 44px minimum target and visible focus.

### Command and navigation

The command search exposes keyboard shortcuts, a programmatic name even when
mobile hides visible text, and at most six initial route matches. Navigation
groups operations and administration with route codes, current-state labels,
and one active gold field.

### Operational brief and loading

The overview’s primary surface is an editorial decision line, not equal metric
cards. Loading preserves this structure, replaces counts and context with
finite skeleton fields, announces “updating,” and reveals values atomically so
stale numbers are never presented as current. No percentage is fabricated and
no spinner or shimmer runs forever.

### Request, profile, and role controls

Request sections follow production ordering and state boundaries. The profile
image chooser accepts local JPEG, PNG, or WebP files up to 2MB for an in-memory
preview only; it never uploads or persists. Role switching opens a labelled
dialog with explicit choices instead of silently cycling state.

## Do's and Don'ts

### Do

- Preserve the oxblood/gold institutional identity and the full route/state
  coverage.
- Use relative scale, asymmetry, proximity, and alignment before adding boxes.
- Keep controls keyboard-operable, visibly focused, truthfully labelled, and
  at least 44px at touch sizes.
- Keep motion finite and tie it to state, hierarchy, continuity, navigation,
  cause/effect, attention, or completion.
- Preserve Request Center authentication, For Review, reservation, release,
  inventory, privacy, and role boundaries in plain language.
- Label every preview record as illustrative and every local-only action as
  non-persistent.

### Don't

- Do not rebuild the system as a generic SaaS dashboard, equal-card wall, or
  maroon office panel.
- Do not add decorative lines, corner elbows, repeated icon tiles, or multiple
  simultaneous hover signals.
- Do not use bounce, parallax, perpetual shimmer, fake percentage progress, or
  motion as the only status cue.
- Do not hide the alternate celestial endpoint or make the theme switch snap.
- Do not fabricate officers, announcements, events, live inventory, provider
  state, or production writes.
- Do not alter backend, authentication, Worker, D1, R2, migrations, providers,
  deployment, release, or production from this preview.
