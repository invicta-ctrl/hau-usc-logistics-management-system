---
name: HAU-USC Logistics Management System
description: Premium institutional operations with editorial command surfaces and purposeful choreography.
colors:
  oxblood-900: "oklch(22% 0.085 22)"
  oxblood-800: "oklch(30% 0.12 22)"
  oxblood-700: "oklch(37% 0.135 22)"
  oxblood-600: "oklch(44% 0.13 22)"
  oxblood-500: "oklch(52% 0.12 22)"
  gold-700: "oklch(48% 0.09 82)"
  gold-600: "oklch(58% 0.105 82)"
  gold-500: "oklch(69% 0.115 82)"
  gold-400: "oklch(77% 0.1 82)"
  gold-300: "oklch(84% 0.075 82)"
  gold-200: "oklch(91% 0.045 82)"
  gold-100: "oklch(96% 0.02 82)"
  canvas: "oklch(94% 0.012 70)"
  paper: "oklch(98.5% 0.008 70)"
  paper-2: "oklch(96.5% 0.012 70)"
  paper-3: "oklch(99% 0.006 70)"
  cream: "oklch(93% 0.027 76)"
  ink: "oklch(19% 0.018 22)"
  ink-2: "oklch(34% 0.018 22)"
  muted: "oklch(44% 0.014 22)"
  line: "oklch(85% 0.015 70)"
  line-strong: "oklch(72% 0.021 70)"
  line-hair: "oklch(91% 0.012 70)"
typography:
  display:
    fontFamily: '"Bricolage Grotesque Local", "Bahnschrift", "Aptos Display", system-ui, sans-serif'
    fontSize: "clamp(42px, 6.4vw, 88px)"
    fontWeight: 780
    lineHeight: 0.96
    letterSpacing: "-0.045em"
  headline:
    fontFamily: '"Bricolage Grotesque Local", "Bahnschrift", "Aptos Display", system-ui, sans-serif'
    fontSize: "clamp(34px, 4vw, 62px)"
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Bricolage Grotesque Local", "Bahnschrift", "Aptos Display", system-ui, sans-serif'
    fontSize: "22px"
    fontWeight: 700
  body:
    fontFamily: '"IBM Plex Sans Local", "Aptos", "Segoe UI Variable", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.012em"
  label:
    fontFamily: '"IBM Plex Sans Local", "Aptos", "Segoe UI Variable", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.115em"
  control:
    fontFamily: '"IBM Plex Sans Local", "Aptos", "Segoe UI Variable", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 700
  wordmark:
    fontFamily: '"Newsreader Local", "Palatino Linotype", Georgia, serif'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.15
  numeral:
    fontFamily: '"Bricolage Grotesque Local", "Bahnschrift", "Aptos Display", system-ui, sans-serif'
    fontSize: "clamp(30px, 3vw, 46px)"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tabular-nums"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
  route-control: "5px 16px 5px 16px"
  route-surface: "5px 18px 5px 18px"
  route-card: "5px 24px 5px 24px"
  field: "5px 14px 5px 14px"
  dialog: "6px 24px 6px 24px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "44px"
  s-12: "64px"
  s-16: "84px"
components:
  button-primary:
    backgroundColor: "{colors.oxblood-800}"
    textColor: "{colors.gold-100}"
    typography: "{typography.control}"
    rounded: "{rounded.route-control}"
    padding: "8px 16px"
    height: "48px"
  celestial-toggle:
    backgroundColor: "{colors.oxblood-900}"
    textColor: "{colors.gold-200}"
    rounded: "{rounded.pill}"
    width: "76px"
    height: "38px"
    motion: "240ms transform"
  kinetic-menu:
    backgroundColor: "{colors.oxblood-800}"
    textColor: "{colors.gold-100}"
    typography: "{typography.control}"
    rounded: "{rounded.route-control}"
    padding: "8px 16px"
    height: "48px"
  back-control:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.oxblood-900}"
    typography: "{typography.control}"
    rounded: "{rounded.route-control}"
    padding: "4px 12px 4px 4px"
    height: "48px"
  command-search:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 8px 0 16px"
    height: "48px"
  operational-brief:
    backgroundColor: "{colors.oxblood-900}"
    textColor: "{colors.gold-100}"
    typography: "{typography.headline}"
    rounded: "{rounded.route-card}"
    padding: "44px"
  status-chip:
    backgroundColor: "#ece3d3"
    textColor: "#5d4a4f"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
    height: "48px"
  public-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 12px 8px 20px"
    height: "68px"
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
