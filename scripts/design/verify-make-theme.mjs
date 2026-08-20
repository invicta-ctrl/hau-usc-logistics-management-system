#!/usr/bin/env node
// Proves the Make override actually replaces every superseded value.
//
// Comments in the override QUOTE the old values on purpose, so that a reader can
// see what each line corrects. A naive grep therefore finds them and says the
// patch failed. This strips comments first and checks only live declarations —
// which is the only place a stale value would actually render.
//
// It also re-simulates the cascade: Make's theme.css followed by the override,
// resolved in declaration order, so the check is "what does the browser end up
// with", not "what does the patch mention".
//
// Usage: node scripts/design/verify-make-theme.mjs

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const BASE = path.join(REPO, 'output/design/make-preservation/theme.v36.css');
const PATCH = path.join(REPO, 'prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css');

/* Every value the adoption is supposed to remove, with what it was. */
const SUPERSEDED = {
  '#e8b93c': 'superseded gold (canonical is #D4AF37)',
  '#f2d15c': 'superseded gold/mid',
  '#f6e29a': 'superseded gold/pale',
  '#faeecb': 'superseded gold/cream',
  '#fffdf8': 'pure-white work plane',
  '#fcf2cf': 'pre-ladder raised',
  '#f2eae5': 'pre-ladder ground',
  '#241416': 'pre-ladder ink',
  '#6f5a60': 'pre-ladder muted ink',
  '#d1b478': 'pre-ladder control border',
  '#2a0508': 'maroon dark card/popover/sidebar',
  '#1c1917': 'hardcoded dark g0',
  '#242120': 'hardcoded dark g1',
  '#2d2927': 'hardcoded dark g2',
  '#37312e': 'hardcoded dark g3',
  '#3d3530': 'hardcoded dark g4',
  'rgba(232,185,60': 'superseded gold baked into rgba',
  'rgba(242,209,92': 'superseded gold/mid baked into rgba',
};

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//gu, '');

/* Resolve one selector block across base-then-patch, last declaration winning,
   which is what appending the override actually does. */
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

const base = stripComments(await readFile(BASE, 'utf8'));
const patch = stripComments(await readFile(PATCH, 'utf8'));
const combined = base + '\n' + patch;

let failures = 0;
const report = [];

for (const [selector, label] of [[':root', 'light'], ['\\.dark', 'dark']]) {
  const resolved = declarations(combined, selector);
  const flat = [...resolved.entries()].map(([k, v]) => `${k}:${v}`).join(';').toLowerCase();

  for (const [needle, why] of Object.entries(SUPERSEDED)) {
    const probe = needle.replace(/\s+/gu, '');
    if (flat.replace(/\s+/gu, '').includes(probe)) {
      report.push(`  FAIL  ${label.padEnd(5)} still resolves ${needle} — ${why}`);
      failures++;
    }
  }

  const gold = resolved.get('--gold-vivid');
  const expected = label === 'light' ? '#d4af37' : '#e1c671';
  const ok = (gold || '').toLowerCase() === expected;
  if (!ok) failures++;
  report.push(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(5)} --gold-vivid = ${gold} (want ${expected})`);

  for (const key of ['--g0-ground', '--background', '--card', '--popover']) {
    const v = resolved.get(key) || '(unset)';
    report.push(`  ....  ${label.padEnd(5)} ${key.padEnd(14)} ${v}`);
  }
}

process.stdout.write('Make theme adoption — resolved cascade (theme.css + theme-canonical.css)\n\n');
process.stdout.write(report.join('\n') + '\n\n');
process.stdout.write(
  failures ? `${failures} failure(s)\n` : 'no superseded value survives the cascade in either mode\n',
);
process.exit(failures ? 1 : 0);
