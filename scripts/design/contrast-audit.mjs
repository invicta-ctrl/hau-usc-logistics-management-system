#!/usr/bin/env node
// Measures WCAG 2.2 contrast for the colour pairs the public portals actually
// use, in both themes, by resolving them out of tokens.css rather than from a
// hand-kept list of hex values that drifts the moment a token changes.
//
// Pairs are declared below against the rule they satisfy:
//   1.4.3 Contrast (Minimum)      body text 4.5:1, large text 3:1
//   1.4.11 Non-text Contrast      UI component boundaries and states 3:1
//
// Exit 0 when every declared pair passes, 1 otherwise.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../prototypes/public-portals-r3');

// --- colour maths -----------------------------------------------------------

function parseColour(raw) {
  const value = raw.trim();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/iu);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./gu, (c) => c + c) : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/iu);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => Number(p.trim()));
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  return null;
}

// A translucent token is only meaningful over something. Compositing here keeps
// the measurement honest for the glass layers.
function over(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1);
}

function luminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// --- token extraction -------------------------------------------------------

function block(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return {};
  const open = css.indexOf('{', start);
  let depth = 0,
    end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const out = {};
  for (const line of css.slice(open + 1, end).split(';')) {
    const m = line.match(/(--[a-z0-9-]+)\s*:\s*([^;]+)/iu);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const tokensCss = await readFile(path.join(ROOT, 'tokens.css'), 'utf8');
const glassCss = await readFile(path.join(ROOT, 'glass.css'), 'utf8');

const light = { ...block(tokensCss, ':root'), ...block(glassCss, ':root') };
const dark = {
  ...light,
  ...block(tokensCss, '[data-theme="dark"]'),
  ...block(glassCss, '[data-theme="dark"]'),
};

function resolve(theme, name, seen = 0) {
  const raw = theme[name];
  if (raw === undefined || seen > 8) return null;
  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)/iu);
  if (alias) return resolve(theme, alias[1], seen + 1);
  return parseColour(raw);
}

// --- the pairs --------------------------------------------------------------
// text: 4.5:1  ·  large: 3:1 (>=18.66px bold or >=24px)  ·  ui: 3:1

const PAIRS = [
  ['1.4.3', 'text', '--text-primary', '--ground', 'body text on the page ground'],
  ['1.4.3', 'text', '--text-primary', '--work', 'body text on the working surface'],
  ['1.4.3', 'text', '--text-primary', '--raised', 'card body text'],
  ['1.4.3', 'text', '--text-primary', '--inset', 'text on inset panels'],
  ['1.4.3', 'text', '--text-secondary', '--work', 'supporting copy'],
  ['1.4.3', 'text', '--text-secondary', '--raised', 'card supporting copy'],
  ['1.4.3', 'text', '--text-secondary', '--inset', 'acknowledgment copy'],
  ['1.4.3', 'text', '--text-muted', '--work', 'hints and placeholders'],
  ['1.4.3', 'text', '--text-muted', '--raised', 'card meta and product id'],
  ['1.4.3', 'text', '--text-muted', '--inset', 'muted text on inset'],
  ['1.4.3', 'text', '--accent-text', '--work', 'eyebrow on working surface'],
  ['1.4.3', 'text', '--accent-text', '--inset', 'eyebrow on inset'],
  ['1.4.3', 'text', '--on-accent', '--action-primary', 'primary button label'],
  ['1.4.3', 'text', '--rail-ink', '--ox-900', 'rail text on the oxblood chrome'],
  ['1.4.3', 'text', '--rail-ink-dim', '--ox-900', 'rail secondary text'],
  ['1.4.3', 'text', '--done-fg', '--done-bg', 'done status pill'],
  ['1.4.3', 'text', '--progress-fg', '--progress-bg', 'in-progress status pill'],
  ['1.4.3', 'text', '--info-fg', '--info-bg', 'info status pill'],
  ['1.4.3', 'text', '--alert-fg', '--alert-bg', 'alert status pill'],
  ['1.4.3', 'text', '--neutral-fg', '--neutral-bg', 'neutral status pill'],
  ['1.4.3', 'text', '--text-secondary', '--accent-wash', 'copy on the assurance band'],
  ['1.4.11', 'ui', '--border-control', '--work', 'input boundary on the working surface'],
  ['1.4.11', 'ui', '--border-control', '--ground', 'input boundary on the ground'],
  ['1.4.11', 'ui', '--border-control', '--inset', 'input boundary on inset panels'],
  ['1.4.11', 'ui', '--border-control', '--raised', 'suggestion list boundary'],
  ['1.4.11', 'ui', '--focus-ring-contrast', '--work', 'focus indicator on the working surface'],
  ['1.4.11', 'ui', '--focus-ring-contrast', '--ground', 'focus indicator on the ground'],
  ['1.4.11', 'ui', '--focus-ring-contrast', '--inset', 'focus indicator on inset panels'],
  ['1.4.11', 'ui', '--selected-line', '--work', 'selected state boundary'],
  ['1.4.11', 'ui', '--selected-line', '--accent-wash', 'selected card boundary against its own wash'],
];

// Status pills are not controls. Their meaning is carried by the label, which
// is measured above against 4.5:1, and the tone is supplementary. 1.4.11 is
// therefore not asserted on the pill hairlines, and that is a scope decision
// rather than a pass.

// Glass panes are transmissive, so text sitting on one is measured against the
// pane composited over the brightest field that can drift behind it.
const GLASS = [
  [
    '1.4.3',
    'text',
    '--text-primary',
    ['--g2-fill', '--field-decision', '--ground'],
    'body text on G2 glass over the gold field',
  ],
  [
    '1.4.3',
    'text',
    '--text-secondary',
    ['--g2-fill', '--field-decision', '--ground'],
    'supporting copy on G2 glass over the gold field',
  ],
  [
    '1.4.3',
    'text',
    '--text-primary',
    ['--g4-fill', '--field-decision', '--ground'],
    'body text on G4 glass over the gold field',
  ],
];

const MIN = { text: 4.5, large: 3, ui: 3 };
const themes = { light, dark };
const rows = [];
let failures = 0;

for (const [themeName, theme] of Object.entries(themes)) {
  for (const [rule, kind, fgName, bgName, note] of PAIRS) {
    const fg = resolve(theme, fgName);
    const bg = resolve(theme, bgName);
    if (!fg || !bg) {
      rows.push({ themeName, rule, note, value: 'UNRESOLVED', pass: false });
      failures++;
      continue;
    }
    const composited = fg[3] < 1 ? over(fg, bg) : fg;
    const r = ratio(composited, bg[3] < 1 ? over(bg, resolve(theme, '--ground')) : bg);
    const pass = r >= MIN[kind];
    if (!pass) failures++;
    rows.push({ themeName, rule, note, value: r.toFixed(2), pass, min: MIN[kind] });
  }
  for (const [rule, kind, fgName, stack, note] of GLASS) {
    const fg = resolve(theme, fgName);
    let bg = resolve(theme, stack[stack.length - 1]);
    for (let i = stack.length - 2; i >= 0; i--) {
      const layer = resolve(theme, stack[i]);
      if (!layer || !bg) {
        bg = null;
        break;
      }
      bg = over(layer, bg);
    }
    if (!fg || !bg) {
      rows.push({ themeName, rule, note, value: 'UNRESOLVED', pass: false });
      failures++;
      continue;
    }
    const r = ratio(fg[3] < 1 ? over(fg, bg) : fg, bg);
    const pass = r >= MIN[kind];
    if (!pass) failures++;
    rows.push({ themeName, rule, note, value: r.toFixed(2), pass, min: MIN[kind] });
  }
}

const width = Math.max(...rows.map((r) => r.note.length));
for (const themeName of Object.keys(themes)) {
  process.stdout.write(`\n${themeName.toUpperCase()}\n`);
  for (const r of rows.filter((x) => x.themeName === themeName)) {
    process.stdout.write(
      `  ${r.pass ? 'PASS' : 'FAIL'}  ${String(r.value).padStart(6)}  min ${String(r.min ?? '-').padStart(3)}  ${r.rule.padEnd(7)}  ${r.note.padEnd(width)}\n`,
    );
  }
}
process.stdout.write(`\n${rows.length - failures}/${rows.length} pass · ${failures} failure(s)\n`);
process.exit(failures ? 1 : 0);
