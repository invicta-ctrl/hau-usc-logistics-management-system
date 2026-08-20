#!/usr/bin/env node
// Emits prototypes/shared/hau-theme.css from theme-source.mjs.
//
// The emitted file is GENERATED. Editing it is how the code and the Figma
// variables drift apart again — change theme-source.mjs and re-run:
//
//   node scripts/design/build-theme.mjs
//
// --check exits non-zero if the committed CSS is stale, so a token edit that
// forgets to rebuild is caught rather than shipped.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLASS, FIELDS, resolveMode, rgba, composite, hexToRgb, contrast, lstarOf } from './theme-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(REPO, 'prototypes/shared/hau-theme.css');
const CHECK = process.argv.includes('--check');

const pad = (name, value) => `  --${name}: ${value};`;

function colourBlock(mode) {
  const t = resolveMode(mode);
  const g = GLASS[mode];
  const f = FIELDS[mode];
  const lines = [];
  const say = (s) => lines.push(s);

  say(`  color-scheme: ${mode};`);
  say('');
  say('  /* Primitives — oxblood */');
  for (const step of [900, 800, 700, 600, 500]) say(pad(`ox-${step}`, t[`ox-${step}`]));
  say('');
  say('  /* Primitives — gold. gold/400 is the owner-locked canonical value. */');
  for (const step of [700, 500, 400, 200, 100]) say(pad(`gold-${step}`, t[`gold-${step}`]));
  say('');
  say('  /* Gold roles */');
  for (const n of ['gold-primary', 'gold-light', 'gold-tint']) say(pad(n, t[n]));
  say(pad('gold-border', rgba([t['gold-primary'], 0.45])));
  say(pad('gold-glow', rgba([t['gold-primary'], 0.14])));
  say('');
  say('  /* Surface ladder — ground -> inset -> work -> raised -> overlay */');
  for (const n of ['ground', 'inset', 'work', 'raised', 'overlay']) {
    const L = lstarOf(hexToRgb(t[n])).toFixed(1);
    say(`  --${(n + ':').padEnd(9)} ${t[n]};   /* L* ${L} */`);
  }
  say('');
  say('  /* Text */');
  for (const n of [
    'text-primary',
    'text-secondary',
    'text-muted',
    'text-inverse',
    'accent-text',
    'on-accent',
  ])
    say(pad(n, t[n]));
  say('');
  say('  /* Borders. control and selected-line carry 1.4.11, the others decorate. */');
  for (const n of ['border-subtle', 'border-default', 'border-strong', 'border-control', 'selected-line'])
    say(pad(n, t[n]));
  say('');
  say('  /* Institution, action, focus */');
  say(pad('authority', t.authority));
  say(pad('action-primary', t['action-primary']));
  say(pad('accent-wash', mode === 'light' ? '#f8f1de' : rgba([t['gold-primary'], 0.1])));
  say(pad('accent-line', mode === 'light' ? t['gold-200'] : rgba([t['gold-primary'], 0.3])));
  say(pad('focus-ring', t['focus-ring']));
  say(pad('focus-ring-contrast', t['focus-ring-contrast']));
  say(pad('selection', mode === 'light' ? '#f3ebdf' : '#42292c'));
  say('');
  say('  /* Rail — institutional chrome, deliberately outside the ladder */');
  for (const n of ['rail-from', 'rail-to', 'rail-ink', 'rail-ink-dim']) say(pad(n, t[n]));
  say('');
  say('  /* Status */');
  for (const tone of ['neutral', 'info', 'progress', 'done', 'alert'])
    say(
      pad(`${tone}-fg`, t[`${tone}-fg`]) +
        ` ${pad(`${tone}-bg`, t[`${tone}-bg`]).trim()} ${pad(`${tone}-line`, t[`${tone}-line`]).trim()}`,
    );
  say('');
  say('  /* Background environment — broad, low-frequency, quiet */');
  say(pad('field-anchor', rgba(f.anchor)));
  say(pad('field-decision', rgba(f.decision)));
  say(pad('field-halo', rgba(f.halo)));
  say(pad('rule-ink', rgba(f.rule)));
  say('');
  say('  /* Institutional Glass — fill, blur, edge and shadow are one recipe */');
  for (const step of ['g1', 'g2', 'g3', 'g4']) {
    say(pad(`${step}-fill`, rgba(g[step].fill)));
    say(pad(`${step}-blur`, `${g[step].blur}px`));
    say(pad(`${step}-sat`, `${g[step].sat}%`));
  }
  say(pad('edge-quiet', rgba(g.edgeQuiet)));
  say(pad('edge-strong', rgba(g.edgeStrong)));
  say(pad('scrim', rgba(g.scrim)));
  say(pad('glass-hi', rgba(g.highlight)));
  for (const step of ['g1', 'g2', 'g3', 'g4']) say(pad(`shadow-${step}`, rgba(g.shadow[step])));
  say(pad('shadow-drop', rgba(g.shadow.drop)));
  say(pad('chrome-fill', mode === 'light' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 244, 224, 0.06)'));
  say(pad('chrome-line', mode === 'light' ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 244, 224, 0.16)'));

  return lines.join('\n');
}

/* A short evidence table in the header, so a reader can see the ladder is
   actually monotonic and that the ink clears the requirement without opening
   the audit. */
function evidence() {
  const rows = [];
  for (const mode of ['light', 'dark']) {
    const t = resolveMode(mode);
    const steps = ['ground', 'inset', 'work', 'raised', 'overlay']
      .map((n) => `${n} ${lstarOf(hexToRgb(t[n])).toFixed(1)}`)
      .join('  ->  ');
    rows.push(`     ${mode.padEnd(5)} L*  ${steps}`);
    const onWork = ['text-primary', 'text-secondary', 'text-muted']
      .map((n) => `${n.replace('text-', '')} ${contrast(hexToRgb(t[n]), hexToRgb(t.work)).toFixed(1)}:1`)
      .join('  ');
    rows.push(`     ${' '.repeat(5)} on work  ${onWork}`);
  }
  return rows.join('\n');
}

const css = `/* HAU-USC Logistics — canonical theme.

   GENERATED by scripts/design/build-theme.mjs from scripts/design/theme-source.mjs.
   DO NOT EDIT. Edit the source and re-run the builder; \`--check\` in CI-style
   use will fail if this file is stale.

   This is the single colour authority for every design prototype and for the
   Figma variable collections in file hXJElH4p72KfgAaoUyfNOC. Before this file
   existed the public-portal prototype and the whole-site prototype carried two
   different palettes, and only one of them had the canonical gold in it.

   WHAT EACH SURFACE IS FOR
     ground   environmental canvas; never carries reading content
     inset    a recess inside the work plane — filter bars, table headers
     work     the primary reading and operational plane
     raised   temporary elevation — floating cards, popovers, suggestions
     overlay  dialogs, command palette, context panels

   THE LADDER, MEASURED
${evidence()}

   Light stops short of white (overlay is L* 98.5, and only dialogs use it) and
   dark stops well short of black (ground is L* 8.6). Both ends are deliberate:
   the brief this file answers rejects a pure-white canvas and a pure-black
   field as separate failures of the same kind.

   CANONICAL GOLD is #D4AF37, owner-locked. Dark mode uses a lighter derivation
   of the same hue because the canonical value has too little separation from
   the dark surfaces to act as a decisive accent there. */

:root {
${colourBlock('light')}
}

[data-theme='dark'] {
${colourBlock('dark')}
}
`;

/* ------------------------------------------------------ Figma Make override
 *
 * Make carries its own `src/styles/theme.css` — a third palette, different
 * again from either local prototype, and its `--gold-vivid` is #E8B93C rather
 * than the owner-locked #D4AF37. It cannot be edited from here: the Make file
 * is an external provider surface, it currently holds an unsaved edit that is
 * not ours, and its AI credits are exhausted. So this emits the exact override
 * block instead, mapped onto the variable names Make actually declares, ready
 * to append to that file the moment the change is authorised.
 *
 * Derived from the same source as everything else, so it cannot go stale
 * independently. */
const MAKE_OUT = path.join(REPO, 'prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css');

function makeOverride() {
  const l = resolveMode('light');
  const d = resolveMode('dark');
  return `/* HAU-USC Logistics — canonical palette override for Figma Make.

   GENERATED by scripts/design/build-theme.mjs. Do not edit.

   HOW TO APPLY
   Append the contents of this file to src/styles/theme.css in Make file
   rP9W9MQlZkyQrUx38TVsFS, AFTER the existing :root block, then save. It only
   redefines variables that file already declares, so nothing else has to change.

   WHY IT IS NEEDED
   Make's palette is a third variant, independent of both local prototypes:
     --gold-vivid   #E8B93C   superseded gold, NOT the owner-locked #D4AF37
     --paper-warm   #FFFDF8   the pure-white work plane this pass removed
     --ink-deep     #241416   the pre-ladder ink
   Everything else in the design system now resolves from one source. Make is
   the last surface that does not.

   Dark values are listed as comments beside each light value because Make
   themes through a \`.dark\` class variant (\`@custom-variant dark\`) rather than
   a data attribute; the dark block below applies them. */

:root {
  /* Oxblood — already correct in Make, restated so the block is self-contained */
  --oxblood-deep:  ${l['ox-900']};
  --oxblood-mid:   ${l['ox-700']};
  --oxblood-light: ${l['ox-600']};

  /* Gold. --gold-vivid is the owner-locked canonical value; the three steps
     above it are the canonical ramp, with --gold-cream derived by carrying the
     palest step 55% of the way to the work plane so Make's four-step ramp keeps
     four distinct values instead of collapsing to three. */
  --gold-vivid:    ${l['gold-primary']};
  --gold-mid:      ${l['gold-light']};
  --gold-pale:     ${l['gold-tint']};
  --gold-cream:    ${composite([l['gold-tint'], 0.45], l.work)};

  /* Surface ladder — ground / work / inset / raised */
  --paper-bg:      ${l.ground};
  --paper-warm:    ${l.work};
  --paper-light:   ${l.inset};
  --paper-mid:     ${l.raised};

  /* Ink */
  --ink-deep:      ${l['text-primary']};
  --ink-mid:       ${l['text-secondary']};
  --ink-light:     ${l['accent-text']};

  /* Borders */
  --border-warm:   ${l['border-control']};
  --border-paper:  ${l['border-subtle']};

  /* Status */
  --green-open:    ${l['done-fg']};
}

.dark {
  --oxblood-deep:  ${d['ox-900']};
  --oxblood-mid:   ${d['ox-700']};
  --oxblood-light: ${d['ox-600']};

  --gold-vivid:    ${d['gold-primary']};
  --gold-mid:      ${d['gold-light']};
  --gold-pale:     ${d['gold-tint']};
  /* Dark cream is the rail ink, not a tint carried toward the work plane.
     Carrying a pale gold 45% onto a CIE L* 15 surface returns grey-brown —
     the palest step has to move toward the light in dark mode, not away. */
  --gold-cream:    ${d['rail-ink']};

  --paper-bg:      ${d.ground};
  --paper-warm:    ${d.work};
  --paper-light:   ${d.inset};
  --paper-mid:     ${d.raised};

  --ink-deep:      ${d['text-primary']};
  --ink-mid:       ${d['text-secondary']};
  --ink-light:     ${d['accent-text']};

  --border-warm:   ${d['border-control']};
  --border-paper:  ${d['border-subtle']};

  --green-open:    ${d['done-fg']};
}
`;
}

if (CHECK) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  const currentMake = await readFile(MAKE_OUT, 'utf8').catch(() => '');
  if (current !== css || currentMake !== makeOverride()) {
    process.stderr.write('generated theme files are stale — run: node scripts/design/build-theme.mjs\n');
    process.exit(1);
  }
  process.stdout.write('generated theme files are current\n');
} else {
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, css);
  await mkdir(path.dirname(MAKE_OUT), { recursive: true });
  await writeFile(MAKE_OUT, makeOverride());
  process.stdout.write(`wrote ${path.relative(REPO, OUT)}\n`);
  process.stdout.write(`wrote ${path.relative(REPO, MAKE_OUT)}\n`);
  process.stdout.write(evidence() + '\n');
}
