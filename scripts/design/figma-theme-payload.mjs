#!/usr/bin/env node
// Emits the Figma variable payload for the canonical theme.
//
// The Figma collections and prototypes/shared/hau-theme.css are two renderings
// of scripts/design/theme-source.mjs. This produces the first one, so a token
// change is applied to the design file from the same source that produced the
// CSS instead of being re-typed into the variable editor — which is how the
// blur ladder ended up holding 12/18/24/28 while the effect styles rendered
// 16/22/30/36 (defect D-02).
//
// Output shape, per collection:
//   { "variable/name": { Light: "#rrggbb" | number | {alias}, Dark: ... } }
//
// Usage: node scripts/design/figma-theme-payload.mjs [> payload.json]

import {
  SURFACES,
  TEXT,
  BORDERS,
  FOCUS,
  STATUS,
  RAIL,
  GLASS,
  FIELDS,
  OXBLOOD,
  GOLD,
  resolveMode,
  solve,
  composite,
} from './theme-source.mjs';

const alias = (name) => ({ alias: name });
const rgba = ([hex, a]) => ({ hex, alpha: a });

const pair = (fn) => ({ Light: fn('light'), Dark: fn('dark') });

const primitives = {};
for (const step of [900, 800, 700, 600, 500]) primitives[`oxblood/${step}`] = pair((m) => OXBLOOD[m][step]);
for (const step of [700, 500, 400, 200, 100]) primitives[`gold/${step}`] = pair((m) => GOLD[m][step]);
primitives['canvas'] = pair((m) => solve(SURFACES[m].ground));
primitives['paper'] = pair((m) => solve(SURFACES[m].work));
primitives['paper/inset'] = pair((m) => solve(SURFACES[m].inset));
primitives['paper/raised'] = pair((m) => solve(SURFACES[m].raised));
/* New. The ladder had four primitives and a fifth step written as a literal on
   the semantic variable, which meant `overlay` was the one surface with no
   primitive behind it and no way to retune it with the others. */
primitives['paper/overlay'] = pair((m) => solve(SURFACES[m].overlay));
primitives['ink'] = pair((m) => solve(TEXT[m]['text-primary']));
primitives['ink/dim'] = pair((m) => solve(TEXT[m]['text-muted']));

const semantic = {
  'color/ground': pair(() => alias('canvas')),
  'color/work': pair(() => alias('paper')),
  'color/inset': pair(() => alias('paper/inset')),
  'color/raised': pair(() => alias('paper/raised')),
  'color/overlay': pair(() => alias('paper/overlay')),
  'color/text/primary': pair(() => alias('ink')),
  'color/text/secondary': pair((m) => solve(TEXT[m]['text-secondary'])),
  'color/text/muted': pair(() => alias('ink/dim')),
  'color/text/inverse': pair((m) => resolveMode(m)['text-inverse']),
  'color/border/subtle': pair((m) => solve(BORDERS[m]['border-subtle'])),
  'color/border/default': pair((m) => solve(BORDERS[m]['border-default'])),
  'color/border/strong': pair((m) => solve(BORDERS[m]['border-strong'])),
  /* New in Figma. These three carry WCAG 1.4.11 in the code and had no
     variable, so the one part of the palette with a hard legal floor was the
     part the design file could not see. */
  'color/border/control': pair((m) => solve(BORDERS[m]['border-control'])),
  'color/selected-line': pair((m) => solve(BORDERS[m]['selected-line'])),
  'color/focus/ring-contrast': pair((m) => FOCUS[m]['focus-ring-contrast']),
  'color/focus/ring': pair(() => alias('gold/400')),
  'color/selection': pair((m) => (m === 'light' ? '#f3ebdf' : '#42292c')),
  'color/institution/authority': pair(() => alias('oxblood/800')),
  'color/action/primary': pair(() => alias('gold/400')),
  'color/action/quiet': pair((m) => solve(SURFACES[m].work)),
  'color/accent/wash': pair((m) => (m === 'light' ? '#f8f1de' : rgba([GOLD[m][400], 0.1]))),
  'color/accent/line': pair((m) => (m === 'light' ? GOLD[m][200] : rgba([GOLD[m][400], 0.3]))),
  'color/accent/text': pair(() => alias('gold/700')),
  'color/text/on-accent': pair(() => '#40070a'),
  'color/gold/primary': pair(() => alias('gold/400')),
  'color/gold/light': pair(() => alias('gold/200')),
  'color/gold/tint': pair(() => alias('gold/100')),
  'color/gold/border': pair((m) => rgba([GOLD[m][400], 0.45])),
  'color/gold/glow': pair((m) => rgba([GOLD[m][400], 0.14])),
};

for (const tone of ['neutral', 'info', 'progress', 'done', 'alert']) {
  semantic[`color/status/${tone}/fg`] = pair((m) => STATUS[m][tone].fg);
  semantic[`color/status/${tone}/bg`] = pair(
    (m) => STATUS[m][tone].bg ?? composite(STATUS[m][tone].bgOver, solve(SURFACES[m].work)),
  );
  semantic[`color/status/${tone}/line`] = pair((m) => STATUS[m][tone].line);
}
for (const part of ['from', 'to', 'ink', 'ink-dim']) {
  semantic[`color/rail/${part}`] = pair((m) => RAIL[m][part]);
}
for (const [step, key] of [
  [900, 900],
  [800, 800],
  [700, 700],
  [600, 600],
  [500, 500],
]) {
  semantic[`color/ramp/oxblood/${step}`] = pair(() => alias(`oxblood/${key}`));
}
for (const step of [700, 500, 400, 200, 100]) {
  semantic[`color/ramp/gold/${step}`] = pair(() => alias(`gold/${step}`));
}

const glass = {
  'material/g0/ground': pair((m) => solve(SURFACES[m].ground)),
  'material/edge/quiet': pair((m) => rgba(GLASS[m].edgeQuiet)),
  'material/edge/strong': pair((m) => rgba(GLASS[m].edgeStrong)),
  'material/scrim': pair((m) => rgba(GLASS[m].scrim)),
  'material/highlight/inner': pair((m) => rgba(GLASS[m].highlight)),
  'material/field/anchor': pair((m) => rgba(FIELDS[m].anchor)),
  'material/field/decision': pair((m) => rgba(FIELDS[m].decision)),
  'material/field/halo': pair((m) => rgba(FIELDS[m].halo)),
  'material/rule/ink': pair((m) => rgba(FIELDS[m].rule)),
  'material/shadow/drop': pair((m) => rgba(GLASS[m].shadow.drop)),
};
for (const step of ['g1', 'g2', 'g3', 'g4']) {
  const name = { g1: 'g1/soft', g2: 'g2/operational', g3: 'g3/raised', g4: 'g4/crystal-focus' }[step];
  glass[`material/${name}`] = pair((m) => rgba(GLASS[m][step].fill));
  glass[`material/blur/${step}`] = pair((m) => GLASS[m][step].blur);
  /* New. Saturation was a literal in CSS and absent from Figma, so a pane could
     match on fill and blur and still render differently in the two places. */
  glass[`material/saturate/${step}`] = pair((m) => GLASS[m][step].sat);
  glass[`material/shadow/${step}`] = pair((m) => rgba(GLASS[m].shadow[step]));
}

const payload = {
  'HAU-USC / Primitives': primitives,
  'HAU-USC / Semantic Color': semantic,
  'HAU-USC / Glass Material': glass,
};

process.stdout.write(JSON.stringify(payload, null, 1) + '\n');
