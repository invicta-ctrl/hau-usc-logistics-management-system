#!/usr/bin/env node
// Emits the canonical palette override for the Figma Make file.
//
//   source  scripts/design/theme-source.mjs           (the one colour authority)
//   target  Make rP9W9MQlZkyQrUx38TVsFS  src/styles/theme.css
//   output  prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css
//
// WHY THIS IS NOT JUST A PALETTE BLOCK
// The first version of this override redefined only the sixteen brand-palette
// variables, on the assumption that everything else in Make's theme.css derives
// from them. That assumption holds in LIGHT mode and fails in DARK, which was
// only visible after reading the live v36 file. Three separate things bypass the
// palette and would have survived a palette-only override:
//
//   1. `.dark` hardcodes the whole glass ladder as literal hexes
//      (--g0-ground: #1c1917 … --g4-focus: #3d3530). They derive from nothing.
//   2. `.dark` builds its surfaces from oxblood rather than from a neutral
//      ladder: --background is var(--oxblood-deep) and --card/--popover/
//      --sidebar are the literal #2a0508. That is a maroon dark mode, not the
//      authored charcoal-oxblood ladder.
//   3. The superseded gold is baked into rgba() literals in BOTH blocks —
//      rgba(232,185,60,…) is #E8B93C and rgba(242,209,92,…) is #F2D15C. A
//      find-and-replace on `--gold-vivid` would have left every one of them.
//
// So MK-02 is wider than "--gold-vivid is the wrong gold". This file closes all
// of it, and every value below is derived from theme-source.mjs rather than
// transcribed.
//
// Usage: node scripts/design/build-make-theme.mjs [--check]

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLASS, resolveMode, rgba, composite } from './theme-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(REPO, 'prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css');
const CHECK = process.argv.includes('--check');

/* Make's local names, and the canonical role each one plays. Declared once so
   the mapping is reviewable rather than scattered through a template. */
const PALETTE = (t, mode) => [
  ['oxblood-deep', t['ox-900'], 'oxblood/900'],
  ['oxblood-mid', t['ox-700'], 'oxblood/700'],
  ['oxblood-light', t['ox-600'], 'oxblood/600'],
  ['gold-vivid', t['gold-primary'], 'gold/400 — the owner-locked canonical gold'],
  ['gold-mid', t['gold-light'], 'gold/200'],
  ['gold-pale', t['gold-tint'], 'gold/100'],
  [
    'gold-cream',
    mode === 'light' ? composite([t['gold-tint'], 0.55], t.work) : t['rail-ink'],
    mode === 'light'
      ? 'gold/100 carried 55% onto the work plane — a fourth, palest step'
      : 'rail ink: in dark the palest step has to move toward the light, not toward the surface',
  ],
  ['paper-warm', t.work, 'work — primary reading and operational plane'],
  ['paper-mid', t.raised, 'raised — temporary elevation'],
  ['paper-light', t.inset, 'inset — recess inside the work plane'],
  ['paper-bg', t.ground, 'ground — environmental canvas'],
  ['ink-deep', t['text-primary'], 'text/primary'],
  ['ink-mid', t['text-secondary'], 'text/secondary'],
  ['ink-light', t['accent-text'], 'accent/text — gold that passes as ink'],
  ['border-warm', t['border-control'], 'border/control — carries WCAG 1.4.11'],
  ['border-paper', t['border-subtle'], 'border/subtle'],
  ['green-open', t['done-fg'], 'status/done/fg'],
];

function glassBlock(mode) {
  const g = GLASS[mode];
  const t = resolveMode(mode);
  return [
    ['g0-ground', t.ground],
    ['g1-soft', rgba(g.g1.fill)],
    ['g2-operational', rgba(g.g2.fill)],
    ['g3-raised', rgba(g.g3.fill)],
    ['g4-focus', rgba(g.g4.fill)],
    ['glass-border-soft', rgba(g.edgeQuiet)],
    ['glass-border-strong', rgba(g.edgeStrong)],
    ['glass-highlight', rgba(g.highlight)],
    ['glass-shadow-soft', `0 6px 20px ${rgba(g.shadow.g1)}`],
    ['glass-shadow-raised', `0 14px 36px ${rgba(g.shadow.g3)}`],
    ['glass-blur-soft', `blur(${g.g1.blur}px) saturate(${g.g1.sat}%)`],
    ['glass-blur-raised', `blur(${g.g3.blur}px) saturate(${g.g3.sat}%)`],
  ];
}

/* The values that bypass the palette. In light these are already derived and
   only two need correcting; in dark almost the whole semantic layer does. */
function semanticBlock(mode) {
  const t = resolveMode(mode);
  if (mode === 'light') {
    return [
      ['card', t.raised, 'was var(--paper-warm): a card sat exactly on the work plane'],
      ['popover', t.overlay, 'overlay is the dialog and command plane'],
      ['sidebar-border', rgba([t['gold-primary'], 0.22]), 'was rgba(242,209,92,.22) — superseded gold'],
      ['ring', t['focus-ring'], 'focus ring follows the canonical gold'],
    ];
  }
  return [
    ['background', t.ground, 'was var(--oxblood-deep): a maroon page, not the authored ground'],
    ['foreground', t['text-primary'], 'was var(--gold-cream): cream body copy'],
    ['card', t.raised, 'was #2a0508'],
    ['card-foreground', t['text-primary'], ''],
    ['popover', t.overlay, 'was #2a0508'],
    ['popover-foreground', t['text-primary'], ''],
    ['secondary', t.inset, 'was var(--oxblood-mid)'],
    ['secondary-foreground', t['text-primary'], ''],
    ['muted', t.inset, 'was var(--oxblood-mid)'],
    ['muted-foreground', t['text-muted'], 'was var(--gold-pale): muted copy should not be gold'],
    ['accent', rgba([t['gold-primary'], 0.15]), 'was rgba(232,185,60,.15) — superseded gold'],
    ['accent-foreground', t['text-primary'], ''],
    ['border', rgba([t['gold-primary'], 0.2]), 'was rgba(242,209,92,.2) — superseded gold'],
    ['input', rgba([t['gold-primary'], 0.1]), 'was rgba(242,209,92,.1) — superseded gold'],
    ['input-background', t.inset, ''],
    ['ring', t['focus-ring'], ''],
    ['destructive', t['alert-fg'], ''],
    ['destructive-foreground', t.ground, ''],
    ['sidebar', t.ground, 'was #2a0508'],
    ['sidebar-foreground', t['rail-ink'], ''],
    ['sidebar-primary', t['gold-primary'], ''],
    ['sidebar-primary-foreground', t['on-accent'], ''],
    ['sidebar-accent', t.inset, 'was var(--oxblood-mid)'],
    ['sidebar-accent-foreground', t['text-primary'], ''],
    ['sidebar-border', rgba([t['gold-primary'], 0.22]), 'was rgba(242,209,92,.22) — superseded gold'],
    ['sidebar-ring', t['gold-primary'], ''],
  ];
}

function emit(rows, width = 26) {
  return rows
    .map(([name, value, why]) => {
      const decl = `  --${(name + ':').padEnd(width)} ${value};`;
      return why ? `  /* ${why} */\n${decl}` : decl;
    })
    .join('\n');
}

function block(mode) {
  const t = resolveMode(mode);
  return [
    '  /* HAU-USC brand palette */',
    emit(PALETTE(t, mode).map(([n, v, why]) => [n, v, why])),
    '',
    '  /* G0-G4 material hierarchy — canonical Institutional Glass.',
    mode === 'dark'
      ? '     These were literal hexes that derived from nothing. */'
      : '     Fill went up and blur came down; see theme-source.mjs. */',
    emit(glassBlock(mode)),
    '',
    '  /* Semantic tokens that did not derive from the palette */',
    emit(semanticBlock(mode)),
  ].join('\n');
}

const css = `/* HAU-USC Logistics — canonical palette override for Figma Make.

   GENERATED by scripts/design/build-make-theme.mjs from
   scripts/design/theme-source.mjs. Do not edit by hand.

   TARGET   Make file rP9W9MQlZkyQrUx38TVsFS, src/styles/theme.css
   BASELINE Version 36, theme.css sha256
            50cb55de9d8e20ad0661cb187b295ea86621aaf2e29c7d8584dd7e159d833082
            (9,419 bytes, 265 lines, captured 2026-08-20)

   HOW TO APPLY
   Append this whole file to the END of src/styles/theme.css, after the existing
   \`.dark\` block. It only redefines variables that file already declares, so no
   selector, component or class has to change. Applying it at the end is what
   makes it an override rather than a merge.

   WHAT IT CORRECTS
   Make carries a third independent palette — neither the Figma Design variables
   nor either local prototype:

     --gold-vivid   #e8b93c   superseded gold, NOT the owner-locked #D4AF37
     --paper-warm   #fffdf8   a pure-white work plane
     --ink-deep     #241416   the pre-ladder ink

   and, less obviously, three things that bypass the palette entirely and would
   survive a palette-only override:

     .dark hardcodes the glass ladder   --g0-ground: #1c1917 … #3d3530
     .dark builds surfaces from oxblood --background: var(--oxblood-deep),
                                        --card/--popover/--sidebar: #2a0508
     both blocks bake the old gold into rgba() literals
                                        rgba(232,185,60,…) = #E8B93C
                                        rgba(242,209,92,…) = #F2D15C

   WHAT IT DOES NOT COVER — READ THIS BEFORE CLAIMING MAKE IS THEMED
   src/app/RequestCenterRoute.tsx does not consume these variables. It carries
   its own inline palette in a local \`ap(dark)\` helper with literal hexes
   (#fffdf8, #ffffff, #f7f0e2, #241416, #6f5a60, #1c1917, #242120, #2d2927).
   No change to theme.css can retheme that route. It needs a separate edit, and
   at the time this file was generated that route had unsaved third-party work
   in it, so it was deliberately left alone. See
   docs/design/FIGMA_MAKE_ADOPTION_PACKET.md.

   Make themes through a class variant — \`@custom-variant dark (&:is(.dark *))\`
   — so the dark values live under \`.dark\` rather than a data attribute. */

:root {
${block('light')}
}

.dark {
${block('dark')}
}
`;

if (CHECK) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  if (current !== css) {
    process.stderr.write('theme-canonical.css is stale — run: node scripts/design/build-make-theme.mjs\n');
    process.exit(1);
  }
  process.stdout.write('theme-canonical.css is current\n');
} else {
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, css);
  process.stdout.write(`wrote ${path.relative(REPO, OUT)} (${css.length} bytes)\n`);
}
