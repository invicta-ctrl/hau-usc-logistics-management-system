#!/usr/bin/env node
// MK-06 — does the Make landing actually respond to dark mode?
//
// DESIGN.md D12 makes this a correctness question rather than a taste one:
// light and dark are "equal CURRENT modes", and V-36 forbids "mixed-theme
// frames". V-41 then says how to answer it: "reproduction and token/cascade
// diagnosis for any mismatched color state; do not guess from a screenshot."
//
// So this does the cascade diagnosis. It reads the landing stylesheet, collects
// every colour-bearing rule, splits them into the two groups the design system
// actually recognises, and checks each group against what it is supposed to do:
//
//   PINNED CHROME  the .atrium* family — the photographic hero. Fixed in both
//                  modes on purpose (DESIGN.md D41, and the MK-05 repair). Every
//                  token it consumes MUST resolve to the same value in both.
//
//   READING PLANES everything else. These are content surfaces, so under D12
//                  every token they consume MUST resolve to a DIFFERENT value in
//                  dark than in light. A reading plane that does not move is the
//                  mixed-theme frame V-36 prohibits.
//
// Usage: node scripts/design/verify-make-landing-theme.mjs
// Exit 0 when both groups behave as the design system requires.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const CSS = path.join(REPO, 'output/design/make-preservation/index.css');
const THEME = path.join(REPO, 'output/design/make-adoption/theme.css');

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//gu, '');

/* Resolve a selector block's declarations, later wins — the browser's rule. */
function declarations(css, selector) {
  const out = new Map();
  const re = new RegExp(`${selector}\\s*\\{([^{}]*)\\}`, 'gu');
  let m;
  while ((m = re.exec(css))) {
    for (const line of m[1].split(';')) {
      const d = line.match(/(--[a-z0-9-]+)\s*:\s*(.+)/iu);
      if (d) out.set(d[1], d[2].trim());
    }
  }
  return out;
}

/* Follow var() aliases to a literal, so "--foo: var(--bar)" is compared by what
   it actually paints rather than by the alias text. */
function resolve(map, name, depth = 0) {
  const raw = map.get(name);
  if (raw === undefined || depth > 10) return null;
  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/iu);
  if (alias) return resolve(map, alias[1], depth + 1);
  return raw.replace(/\s+/gu, ' ').trim();
}

const themeCss = stripComments(await readFile(THEME, 'utf8'));
const base = declarations(themeCss, ':root');
const darkBlock = declarations(themeCss, '\\.dark');

/* Reading planes resolve against :root then .dark, the ordinary cascade. */
const readingLight = base;
const readingDark = new Map([...base, ...darkBlock]);

/* Pinned chrome resolves with the `.digital-atrium` block layered on top, in
   BOTH modes — that block is the scoped pin, and judging the atrium without it
   would report the section as drifting when the pin is exactly what stops it. */
const scoped = declarations(themeCss, '\\.digital-atrium');
const light = new Map([...base, ...scoped]);
const dark = new Map([...base, ...darkBlock, ...scoped]);

const landing = stripComments(await readFile(CSS, 'utf8'));

/* Every token consumed by a colour-bearing rule, grouped by what the rule is. */
const pinned = new Set();
const reading = new Set();

/* Only properties that actually paint. Collecting every var() in a rule that
   happens to set a colour sweeps in --space-*, --font-*, --dur-* and --z-*, and
   then reports the spacing scale for "not theming" — which is noise, and the
   kind of noise that gets a real failure ignored. */
const PAINTS = /^(color|background|background-color|background-image|border(?:-[a-z]+)?-color|outline-color|box-shadow|fill|stroke|text-decoration-color|caret-color)$/u;

for (const m of landing.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
  const selector = m[1].trim().split('\n').pop().trim();
  const bucket = /(?:^|[\s,>])\.(?:atrium|digital-atrium)/u.test(selector) ? pinned : reading;

  for (const decl of m[2].split(';')) {
    const d = decl.match(/^\s*([a-z-]+)\s*:\s*(.+)$/su);
    if (!d || !PAINTS.test(d[1])) continue;
    for (const t of d[2].matchAll(/var\(\s*(--[a-z0-9-]+)/gu)) bucket.add(t[1]);
  }
}

/* A token used by both groups is judged as a reading-plane token: the stricter
   of the two requirements wins, and the atrium's own tokens are exclusive to it. */
for (const t of reading) pinned.delete(t);

const rows = [];
let failures = 0;

function check(group, tokens, mustDiffer) {
  const names = [...tokens].sort();
  for (const name of names) {
    const l = resolve(mustDiffer ? readingLight : light, name);
    const d = resolve(mustDiffer ? readingDark : dark, name);
    if (l === null || d === null) {
      /* Not a theme token — declared locally by the stylesheet, or a non-colour
         var. Out of scope rather than a failure. */
      continue;
    }
    const differs = l !== d;
    const ok = mustDiffer ? differs : !differs;
    if (!ok) failures++;
    rows.push({
      group,
      name,
      light: l.slice(0, 30),
      dark: d.slice(0, 30),
      verdict: ok ? 'PASS' : 'FAIL',
      note: mustDiffer ? (differs ? 'themes' : 'DOES NOT THEME') : differs ? 'MOVES WITH MODE' : 'pinned',
    });
  }
}

check('pinned chrome', pinned, false);
check('reading plane', reading, true);

const w = {
  name: Math.max(...rows.map((r) => r.name.length), 10),
  light: Math.max(...rows.map((r) => r.light.length), 5),
  dark: Math.max(...rows.map((r) => r.dark.length), 5),
};

process.stdout.write('MK-06 — Make landing theme response, by cascade (DESIGN.md D12 / V-36 / V-41)\n\n');
for (const g of ['pinned chrome', 'reading plane']) {
  const group = rows.filter((r) => r.group === g);
  if (!group.length) continue;
  process.stdout.write(`  ${g.toUpperCase()} — must ${g === 'pinned chrome' ? 'NOT change' : 'change'} between modes\n`);
  for (const r of group) {
    process.stdout.write(
      `    ${r.verdict}  ${r.name.padEnd(w.name)}  ${r.light.padEnd(w.light)}  ${r.dark.padEnd(w.dark)}  ${r.note}\n`,
    );
  }
  process.stdout.write('\n');
}

process.stdout.write(
  failures
    ? `${failures} token(s) behave contrary to the design system\n`
    : `every landing token behaves as the design system requires · ${rows.length} checked\n`,
);
process.exit(failures ? 1 : 0);
