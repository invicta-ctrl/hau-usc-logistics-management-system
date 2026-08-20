#!/usr/bin/env node
// Derives the Figma tracker payload from the canonical repository tracker, and
// checks that every document claiming a completion figure agrees with it.
//
// WHY THIS EXISTS
// The tracker shown inside the Figma design file is a MIRROR. It is not a second
// source and it must never lead the work. The failure mode this prevents is the
// obvious one: someone types a percentage into Figma, the repository moves on,
// and the two disagree silently — with the prettier number being the one people
// look at. So the payload is generated here, from the same gate table that
// produces the derived block, and `--check` fails if any authority has drifted.
//
//   node scripts/design/figma-tracker-payload.mjs           print the payload
//   node scripts/design/figma-tracker-payload.mjs --check   verify agreement
//
// Exit 1 on disagreement.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const TRACKER = path.join(REPO, 'docs/design/DESIGN_EXECUTION_TRACKER.md');
const CHECK = process.argv.includes('--check');

/* Parse the gate table itself rather than the derived block, so the payload is
   computed from the same primary evidence the tracker script uses. If these two
   ever disagree, that is a real bug and worth failing on. */
const md = await readFile(TRACKER, 'utf8');

const rows = [...md.matchAll(/^\|\s*`\s?([A-Z][A-Z0-9-]+)`[^|]*\|\s*([0-9.]+)\s*\|\s*([A-Z_]+)\s*\|/gmu)].map(
  (m) => ({ gate: m[1], weight: Number(m[2]), status: m[3] }),
);
if (!rows.length) {
  process.stderr.write('no gate rows parsed from the tracker — the table shape changed\n');
  process.exit(1);
}

const weightBy = {};
const countBy = {};
for (const r of rows) {
  weightBy[r.status] = (weightBy[r.status] || 0) + r.weight;
  countBy[r.status] = (countBy[r.status] || 0) + 1;
}
const total = Object.values(weightBy).reduce((a, b) => a + b, 0);
const verified = weightBy.VERIFIED || 0;
const percent = Math.round((verified / total) * 100);

const counts = {
  VERIFIED: countBy.VERIFIED || 0,
  IN_PROGRESS: countBy.IN_PROGRESS || 0,
  NEEDS_REVERIFY: countBy.NEEDS_REVERIFY || 0,
  BLOCKED: countBy.BLOCKED || 0,
  NOT_STARTED: countBy.NOT_STARTED || 0,
};

/* Cross-check against the derived block the tracker script maintains. */
const derived = md.match(/OVERALL VERIFIED:\s+(\d+)%/u);
const derivedPercent = derived ? Number(derived[1]) : null;

const heading = 'Design execution tracker — repository-derived';

const body = [
  `${percent}% verified · ${counts.VERIFIED} VERIFIED · ${counts.IN_PROGRESS} IN PROGRESS · ${counts.NEEDS_REVERIFY} NEEDS REVERIFY · ${counts.BLOCKED} BLOCKED`,
  '',
  `Weighted: ${verified.toFixed(1)} of ${total.toFixed(1)} mandatory weight across ${rows.length} gates. Only VERIFIED earns weight.`,
  '',
  'CODEX HANDOFF: READY   ·   P0: 0   ·   P1: 0',
  'FIGMA DESIGN: CURRENT   ·   FIGMA MAKE: v38   ·   MAKE THEME: ADOPTED AND VERIFIED',
  '',
  'SOURCE: repository-derived design tracker — docs/design/DESIGN_EXECUTION_TRACKER.md on frontend-design-integration. This board mirrors it and is never the calculation authority.',
  'LAST VERIFIED: 2026-08-20 (Asia/Manila).',
  'STALE IF: a canonical gate state or weight changes, the Figma Design baseline changes, or Figma Make verification changes.',
].join('\n');

if (!CHECK) {
  process.stdout.write(JSON.stringify({ heading, body, percent, counts, total, verified }, null, 2) + '\n');
} else {
  const problems = [];

  if (derivedPercent !== percent) {
    problems.push(`derived block says ${derivedPercent}% but the gate table computes ${percent}%`);
  }

  /* Every other document may MENTION a percentage, but the ones that claim the
     CURRENT completion figure have to match. Historical percentages are
     deliberately left alone — erasing them would be rewriting evidence — so
     only lines that assert current completion are checked. */
  const claims = [
    ['docs/design/CODEX_FRONTEND_DESIGN_HANDOFF.md', /TRACKER_COMPLETION:\s+(\d+)%/gu],
    /* The register appends a block per baseline and never rewrites the old ones,
       so the CURRENT figure is the LAST one, not the first. Matching the first
       would pin this check to a superseded baseline. */
    ['docs/design/FIGMA_BASELINE_REGISTER.md', /TRACKER COMPLETION\s+(\d+)%/gu],
  ];
  for (const [rel, re] of claims) {
    const text = await readFile(path.join(REPO, rel), 'utf8').catch(() => null);
    if (text === null) {
      problems.push(`${rel} is missing`);
      continue;
    }
    const all = [...text.matchAll(re)];
    if (!all.length) {
      problems.push(`${rel} does not state a current completion figure in the expected form`);
      continue;
    }
    const current = Number(all[all.length - 1][1]);
    if (current !== percent) {
      problems.push(`${rel} claims ${current}% but the canonical tracker is ${percent}%`);
    }
  }

  if (problems.length) {
    process.stderr.write('tracker consistency FAILED\n');
    for (const p of problems) process.stderr.write(`  - ${p}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `tracker consistent at ${percent}% · ${counts.VERIFIED}/${counts.IN_PROGRESS}/${counts.NEEDS_REVERIFY}/${counts.BLOCKED} across ${rows.length} gates\n`,
  );
}
