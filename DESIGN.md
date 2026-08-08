---
name: HAU-USC Logistics Management System
description: Operational choreography for accountable logistics handoffs.
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
    fontSize: "clamp(38px, 4.3vw, 68px)"
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: "-0.035em"
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
    padding: "8px 14px"
    height: "46px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.route-control}"
    padding: "8px 14px"
    height: "46px"
  status-chip:
    backgroundColor: "#ece3d3"
    textColor: "#5d4a4f"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  input:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.field}"
    padding: "9px 11px"
    height: "46px"
  nav-active:
    backgroundColor: "{colors.gold-300}"
    textColor: "{colors.oxblood-900}"
    typography: "{typography.control}"
    rounded: "{rounded.route-surface}"
    padding: "6px 10px"
  search-pill:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 8px 0 16px"
    height: "46px"
  portal-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.route-card}"
    padding: "24px"
  route-progress:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.oxblood-800}"
    typography: "{typography.label}"
    padding: "0 14px"
    height: "18px"
  queue-table:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.route-surface}"
    padding: "10px"
  public-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 10px 8px 18px"
    height: "68px"
---

# Design System: HAU-USC Logistics Management System

## Overview

**Creative North Star: "Operational Choreography / Route Console"**

V4 is a modern-minimal route console for HAU-USC Logistics: every rail,
elbow, node, and connected rule explains where an operator is in a handoff.
Oxblood is the structural authority, gold is the active signal, and warm paper
surfaces give the work room to read. Dark mode is authored as its own charcoal
world with brighter oxblood and gold values; it is not a colour inversion.

The authenticated N13 command pill keeps route identity, search, theme,
notifications, and account context in one compact line. The public N5 floating
bar is calmer and narrower, the portal route makes the first safe path visible,
and the Ft5 statement close ends the journey with custody language rather than
marketing. Illustrative preview data is explicitly marked, and demo-only
actions never imply a live write.

**Key Characteristics:**

- Oxblood signal rails, gold active segments, route nodes, and right-angle page
  ends.
- Bundled Bricolage Grotesque display, IBM Plex Sans body, and Newsreader
  wordmark type.
- Hairline diagram rules, semantic queues, and detail relationships that stay
  legible as space narrows.
- Finite state choreography with a complete unsupported-API fallback and
  reduced-motion path.

## Colors

The palette keeps the institutional oxblood/gold identity while using OKLCH
ramps and tonal paper steps so figure and ground remain clear in both themes.

### Primary

- **Oxblood ramp:** the deep-to-mid oxblood family carries the rail, active
  route, page anchors, links, and primary actions.
- **Gold signal ramp:** gold is reserved for active route segments, nodes,
  selected states, focus, status emphasis, and small institutional marks.

### Secondary

- **Status tones:** neutral, info, progress, done, and alert reinforce the
  vocabulary label; alert also carries an icon. These tones are inherited from
  the shared token layer and are never the only signal.

### Neutral

- **Canvas / paper / inset / overlay:** light mode moves from warm canvas to
  near-white working paper, inset controls/table heads, and white overlays.
- **Ink / secondary ink / muted:** dark text, explanatory text, and quiet
  metadata remain distinct without introducing a second brand colour.
- **Hairline / strong line:** borders and diagram rules establish alignment;
  they are not decorative card stripes.

**The Route-as-Truth Rule.** A line or node must explain a route, relationship,
or state; remove it if it is only ornament.

**The Signal-Rarity Rule.** Gold earns attention through scarcity: use it for
active segments, focus, selection, status emphasis, and small marks rather than
large decorative fields.

## Typography

**Display Font:** Bricolage Grotesque Local (with Bahnschrift, Aptos Display,
system-ui)

**Body Font:** IBM Plex Sans Local (with Aptos, Segoe UI Variable, system-ui)

**Label/Route Font:** IBM Plex Sans Local with tabular numerals for route codes,
quantities, and dates

**Wordmark:** Newsreader Local (with Palatino Linotype, Georgia)

**Character:** Bricolage gives route titles and operational numerals a compact,
decisive voice. IBM Plex Sans keeps labels, tables, forms, and explanatory copy
plain and highly scannable; Newsreader appears only in the institutional
wordmark.

### Hierarchy

- **Display** (780, `clamp(38px, 4.3vw, 68px)`, 1.02): the global display token
  for route-console page titles and major public statements.
- **Headline** (780, `clamp(34px, 4vw, 62px)`, 1.02): authenticated page heads;
  public landing headings can expand to `clamp(42px, 6.6vw, 78px)`.
- **Title** (700, `22px`, 1.1): section, detail, and portal-card titles.
- **Body** (400, `16px`, 1.5, `-0.012em`): operational copy and controls;
  keep explanatory lines near 58-68ch where the surface allows.
- **Label** (600, `12px`, `0.115em`, uppercase): route codes, section labels,
  metadata, and compact navigation descriptors.
- **Numeral** (900, `clamp(30px, 3vw, 46px)`, tabular figures): attention
  values and quantities only.

**The Explicit-Label Rule.** A status, quantity, or unknown is always named in
plain language; type hierarchy may emphasize it, but never replaces the label.

**The Wordmark-Only Serif Rule.** Newsreader is the institutional signature,
not a general-purpose body or heading face.

## Layout

The internal shell is a route map: a 292px rail collapses to 84px, then moves
off-canvas below 1024px. The N13 topbar, route-progress rule, and three nodes
locate the current route before the work canvas. A vertical and horizontal
crosshair rule, a page-head gold right-angle, and a connected attention band
make the first viewport answer where I am, what is urgent, and what is the next
safe action. Content is capped at 1520px.

Homogeneous records stay in semantic queue tables. At 1181px and above, a
queue shares the surface with a split detail pane; below that the detail becomes
a drawer, and below 768px it becomes a full-width push. At narrow widths,
reference IDs and secondary metadata yield first; status, quantity, and the
primary action remain. The mobile tabbar and sticky action bar appear below
768px.

Public surfaces use an 1120px reading column (1280px for wide flows), a sticky
N5 floating bar, a three-step portal route, and one lead portal action. The
portal grid uses a full-width lead card followed by quieter destinations, then
stacks into one column on phones. The durable spacing rhythm is 4, 8, 12, 16,
20, 24, 32, 44, 64, and 84px.

## Elevation & Depth

Depth is mostly tonal and diagrammatic. Panels, queue wraps, attention cells,
and detail surfaces are flat at rest with a one-pixel line; shadows belong to
the navigation rail, command topbar, public floating bar, mobile tabbar, and
truly floating overlays. Light mode uses warm paper steps; dark mode uses
near-black canvas, charcoal paper, raised brown-charcoal, and oxblood anchors.

### Shadow Vocabulary

- **Quiet float** (`0 2px 8px var(--shadow-color)`): public bar and low-level
  working chrome.
- **Rail command** (`0 14px 36px var(--shadow-color)`): the authenticated rail
  and active command layer.
- **Overlay depth** (`0 24px 64px var(--shadow-color-strong)`): drawers,
  dialogs, menus, and the mobile tabbar.

**The Earned Elevation Rule.** A shadow marks a layer that floats above the
  route; ordinary work surfaces rely on paper tone and hairlines.

## Shapes

The inherited radius scale is 4 / 8 / 12 / 16px with a 999px pill. V4 adds a
route-aware asymmetric silhouette: controls use `5px 16px 5px 16px`, working
surfaces use `5px 18px 5px 18px`, public portal cards use `5px 24px 5px 24px`,
fields use `5px 14px 5px 14px`, and dialogs/drawers use `6px 24px 6px 24px`.
Status chips and route-progress nodes remain circular/pill forms so they read
as signals rather than containers.

Borders are one-pixel line or hairline values. Oxblood and gold geometry is
drawn with explicit elbows, spines, and nodes; it is never a filled stripe used
to decorate a card. Icons are the inherited 24x24 monoline sprite, rendered at
18x18 with one current-colour brand ink. Controls are at least 46px in this
direction (never below the product's 44px touch-target floor).

## Components

### Buttons

Buttons are compact route controls: asymmetric corners, decisive ink, and a
small state nudge rather than a glossy lift.

- **Shape:** `5px 16px 5px 16px`; 46px minimum height and `8px 14px` padding.
- **Primary:** oxblood anchor with gold-100 text; use one primary action per
  surface.
- **Hover / Focus:** darken to the next oxblood, nudge 1px on pointer input,
  and keep a visible 3px gold focus ring at 3px offset.
- **Secondary / Quiet:** transparent or paper-backed, ink-2 text, hairline
  border; danger uses the alert tone and does not lift on hover.

### Chips

Status chips are labelled signals, not decorative badges. They use a 999px
pill, 3px 9px padding, one of five semantic tones, and an alert glyph when
needed. The label remains present in every theme and responsive state.

### Cards / Containers

Working panels and queue wraps use paper, a hairline border, and no shadow at
rest. Internal route surfaces use the `5px 18px 5px 18px` silhouette and
16-20px padding. Public portal cards are the exception that earns card form:
heterogeneous destinations use the larger route-card corners, while
homogeneous operational records remain table rows. Split detail is visually
connected to its selected queue row, not presented as an unrelated card.

### Inputs / Fields

Text, select, textarea, search, and file controls use inset paper-2, a strong
line, the field radius, and 46px minimum height. Focus returns to paper and
adds the gold outline; invalid fields use the alert tone and an explicit linked
message. Disabled controls stay legible at reduced opacity and do not imply an
available capability.

### Navigation

Authenticated navigation is N13: a 292px oxblood rail holds the brand marks,
route signal, two labelled navigation banks, workspace/scope controls, and the
current route code; the compact topbar keeps menu, route identity, command
search, theme, notifications, and account together. The current item is a
gold active segment with oxblood ink and a short route spine. At <=1023px the
rail becomes a labelled drawer; at <=767px the tabbar and sticky primary action
keep the work reachable.

Public navigation is N5: a floating pill bar with marks, theme, and a return
control. The footer is Ft5: the statement "Every item moves with a record."
followed by quiet privacy and acceptable-use links.

### Route Grammar (signature component)

The route-progress rule, three nodes, page-head right-angle, connected
attention band, queue selection spine, and public portal route form one visual
grammar. They show custody and handoff relationships without exposing protected
stock, evidence, roster, supplier, or audit internals.

### Loading and State (signature component)

Loading reads **Preparing this workspace** and resolves three bars, a
directional progress rule, and rows once. Empty, denied, unavailable, receipt,
and error states keep their semantic copy and next safe action. Unsupported
View Transition API browsers use the finite CSS fallback; reduced motion keeps
the final state and all accessible announcements while removing movement.

## Do's and Don'ts

### Do:

- **Do** retain the oxblood/gold institutional identity and use gold as a rare
  route, focus, selection, status, and mark signal.
- **Do** keep queues semantic, preserve row-to-detail relationships, and show
  status labels, quantities, units, and truthful "Not recorded" / "Not
  assessed" values.
- **Do** use the bundled Bricolage Grotesque, IBM Plex Sans, and Newsreader
  roles; the preview makes no remote font or image request.
- **Do** label every preview figure as illustrative and keep demo-only actions
  visibly non-persistent.
- **Do** preserve keyboard focus, labelled dialogs/drawers, 44px touch targets,
  200% zoom, no 320px horizontal overflow, and the reduced-motion path.

### Don't:

- **Don't** replace the route grammar with a generic dashboard card wall,
  decorative gradient text, or repeated metric tiles.
- **Don't** use color alone for status, expose raw enums, or imply that a
  hidden control is authorized.
- **Don't** fabricate live records, metrics, claims, or provider state; public
  surfaces remain narrower and calmer than internal workspaces.
- **Don't** add perpetual shimmer, bounce, or ambient loops. Motion is finite
  and state-bound; only a genuinely live status dot may pulse.
- **Don't** flatten dark mode into a light-theme inversion or revert the pinned
  N13 authenticated / N5 public navigation and Ft5 statement close.
