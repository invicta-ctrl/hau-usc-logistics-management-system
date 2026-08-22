#!/usr/bin/env node
// Derives the frontend-design stream completion percentage from the gate table
// in docs/design/DESIGN_EXECUTION_TRACKER.md and rewrites the derived block.
//
// The percentage is never typed by a human or an agent. It is computed as
//
//     sum(weight of gates whose status is exactly VERIFIED)
//     / sum(weight of all mandatory gates) * 100
//
// A gate that regresses to NEEDS_REVERIFY loses its weight immediately, which
// is the whole point: a stale "verified" must not keep earning completion.
//
// Exit codes
//   0  table parsed, derived block current
//   1  parse failure, illegal status, weight drift, or an unearned 100% claim
//   2  --check found the derived block out of date

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRACKER = path.resolve(HERE, '../../docs/design/DESIGN_EXECUTION_TRACKER.md');

const LEGAL = new Set(['NOT_STARTED', 'IN_PROGRESS', 'NEEDS_REVERIFY', 'BLOCKED', 'VERIFIED']);
const BEGIN = '<!-- DERIVED:BEGIN -->';
const END = '<!-- DERIVED:END -->';

// Area totals are fixed by owner directive. Sub-gate weights inside an area may
// be re-proportioned; the area total may not drift without an owner decision.
const AREA_TOTALS = {
  'Area 1': 15,
  'Area 2': 10,
  'Area 3': 10,
  'Area 4': 10,
  'Area 5': 15,
  'Area 6': 10,
  'Area 7': 10,
  'Area 8': 10,
  'Area 9': 10,
};

function fail(message) {
  process.stderr.write(`design-tracker: ${message}\n`);
  process.exit(1);
}

function parseGates(markdown) {
  const gates = [];
  let area = null;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^###\s+(Area \d+)\s+—\s+(.+?)\s+·\s+([\d.]+)\s*$/u);
    if (heading) {
      area = { key: heading[1], name: heading[2], declared: Number(heading[3]) };
      continue;
    }
    if (!area || !line.startsWith('|')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 6) continue;
    // Skip the header and separator rows.
    if (/^-+$/u.test(cells[0].replace(/[\s:]/gu, '')) || cells[0] === 'Gate') continue;

    const id = (cells[0].match(/`([A-Z0-9-]+)`/u) || [])[1];
    if (!id) continue;

    const weight = Number(cells[1]);
    if (!Number.isFinite(weight) || weight <= 0) fail(`gate ${id} has a non-numeric weight "${cells[1]}"`);

    const status = cells[2];
    if (!LEGAL.has(status)) fail(`gate ${id} has illegal status "${status}"`);

    // A VERIFIED gate with no evidence is not verified, it is a claim.
    const evidence = cells[5];
    if (status === 'VERIFIED' && (!evidence || evidence === '—')) {
      fail(`gate ${id} is VERIFIED with no evidence recorded`);
    }
    gates.push({ id, area: area.key, weight, status });
  }
  if (!gates.length) fail('no gates parsed — the table shape changed');
  return gates;
}

function checkAreaTotals(gates) {
  const sums = {};
  for (const g of gates) sums[g.area] = (sums[g.area] ?? 0) + g.weight;
  for (const [area, expected] of Object.entries(AREA_TOTALS)) {
    const actual = Number((sums[area] ?? 0).toFixed(3));
    if (Math.abs(actual - expected) > 0.001) {
      fail(`${area} weights sum to ${actual}, owner directive fixes it at ${expected}`);
    }
  }
}

function derive(gates, markdown) {
  const total = gates.reduce((n, g) => n + g.weight, 0);
  const verified = gates.filter((g) => g.status === 'VERIFIED').reduce((n, g) => n + g.weight, 0);
  const pct = Number(((verified / total) * 100).toFixed(1));

  const count = (s) => gates.filter((g) => g.status === s).length;
  const unverified = gates.length - count('VERIFIED');

  if (pct >= 100 && unverified > 0) fail('100% claimed while gates remain unverified');

  const openHigh = (markdown.match(/^\|\s*\S+\s*\|\s*HIGH\s*\|/gmu) || []).length;
  if (pct >= 100 && openHigh > 0) fail(`100% claimed with ${openHigh} open HIGH item(s)`);

  const line = (label, value) => `${label.padEnd(24)}${value}`;
  return [
    '```text',
    line('OVERALL VERIFIED:', `${pct}%`),
    line(
      'GATES:',
      `${count('VERIFIED')} VERIFIED · ${count('IN_PROGRESS')} IN_PROGRESS · ` +
        `${count('NOT_STARTED')} NOT_STARTED · ${count('NEEDS_REVERIFY')} NEEDS_REVERIFY · ` +
        `${count('BLOCKED')} BLOCKED`,
    ),
    line('MANDATORY WEIGHT:', total.toFixed(1)),
    line('VERIFIED WEIGHT:', verified.toFixed(1)),
    line('CURRENT PHASE:', readField(markdown, 'CURRENT PHASE')),
    line('BASELINE PRODUCTION:', readField(markdown, 'BASELINE PRODUCTION')),
    line('BASELINE FIGMA DESIGN:', readField(markdown, 'BASELINE FIGMA DESIGN')),
    line('BASELINE FIGMA MAKE:', readField(markdown, 'BASELINE FIGMA MAKE')),
    line('BASELINE DESIGN BRANCH:', readField(markdown, 'BASELINE DESIGN BRANCH')),
    line('LAST COMPUTED:', readField(markdown, 'LAST COMPUTED')),
    line(
      '100% ELIGIBLE:',
      unverified === 0 && openHigh === 0
        ? 'YES'
        : `NO — ${unverified} mandatory gate${unverified === 1 ? '' : 's'} not VERIFIED`,
    ),
    '```',
  ].join('\n');
}

// Narrative fields are author-owned; the script preserves them verbatim rather
// than inventing values it cannot verify.
function readField(markdown, label) {
  const m = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, 'mu'));
  return m ? m[1].trim() : 'not recorded';
}

const markdown = await readFile(TRACKER, 'utf8');
const gates = parseGates(markdown);
checkAreaTotals(gates);
const block = derive(gates, markdown);

const start = markdown.indexOf(BEGIN);
const end = markdown.indexOf(END);
if (start === -1 || end === -1) fail('derived block markers are missing');

const next = `${markdown.slice(0, start + BEGIN.length)}\n${block}\n${markdown.slice(end)}`;

if (process.argv.includes('--check')) {
  if (next !== markdown) {
    process.stderr.write(
      'design-tracker: derived block is out of date — run node scripts/design/design-tracker.mjs\n',
    );
    process.exit(2);
  }
  process.stdout.write('design-tracker: derived block is current\n');
  process.exit(0);
}

if (next !== markdown) await writeFile(TRACKER, next, 'utf8');
process.stdout.write(`${block.split('\n')[1]}\n`);
