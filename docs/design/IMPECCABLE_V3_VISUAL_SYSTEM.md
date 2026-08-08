# Impeccable v3 visual system

## Identity

Oxblood remains the structural anchor. Muted gold is the only accent and stays
below a decorative footprint: focus, route progress, selected navigation,
status emphasis, and small brand details. The system never uses gold as a
large background field.

## Surface ladder

Light mode:

1. soft warm-neutral canvas;
2. near-white working paper;
3. secondary paper for inset controls and table heads;
4. white overlay/elevation surface.

Dark mode:

1. near-black warm charcoal canvas;
2. charcoal working paper;
3. raised charcoal-brown surface;
4. oxblood rail and anchors.

Dark mode is separately authored, not inverted.

## Typography

- Display: locally available Bahnschrift/Aptos Display fallback stack.
- Body: locally available Aptos/Segoe UI fallback stack.
- Wordmark outlier: Palatino/Book Antiqua fallback stack, used only for brand.
- No remote font request is permitted in the offline preview.
- Page titles use tight roman display type; no italic display emphasis.

## Geometry and density

- 4-pixel spacing rhythm with larger 44/64/84-pixel compositional intervals.
- 44-pixel minimum base control height.
- Small, deliberate radii; wide work surfaces do not become soft “card soup.”
- Rules and tone shifts separate regions; whitespace alone is not the only
  section delimiter.

## Composition

- Authenticated pages use the existing operational rail and a generous work
  canvas. The primary exception occupies the largest attention region.
- Public pages use an edge-aligned brand bar and an asymmetric portal index.
- Tables retain semantic structure, dense row scanning, and selection emphasis.
- One work surface may be elevated; nested decorative cards are avoided.

## Responsive rules

- Required widths: 320, 375, 414, 768, 1024, and 1440 CSS pixels.
- Portal cards collapse to a single column on phones.
- Attention measures collapse from asymmetric three-column to two then one.
- Menu text, account text, and nonessential wordmark detail reduce before work
  content does.
- Quantity, status, and primary actions remain visible.
