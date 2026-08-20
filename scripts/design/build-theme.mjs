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
import { GLASS, FIELDS, resolveMode, rgba, hexToRgb, contrast, lstarOf } from './theme-source.mjs';

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

/* The Figma Make override used to be emitted from here too. It moved to
 * scripts/design/build-make-theme.mjs, because reading the live Make file
 * showed the override has to do considerably more than restate the palette —
 * it also has to replace a hardcoded dark glass ladder, an oxblood-derived
 * dark surface set, and superseded golds baked into rgba() literals. Two
 * generators writing one file is how the smaller version silently overwrote
 * the complete one. This file owns prototypes/shared/hau-theme.css only. */

if (CHECK) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  if (current !== css) {
    process.stderr.write('hau-theme.css is stale — run: node scripts/design/build-theme.mjs\n');
    process.exit(1);
  }
  process.stdout.write('hau-theme.css is current\n');
} else {
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, css);
  process.stdout.write(`wrote ${path.relative(REPO, OUT)}\n`);
  process.stdout.write(evidence() + '\n');
}
