import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'docs', 'WORK_CONTINUATION.md');
const text = await readFile(file, 'utf8');
const lines = text.split(/\r?\n/);
const errors = [];

const levelTwo = [...text.matchAll(/^##\s+(.+)$/gm)];
if (levelTwo[0]?.[1]?.trim() !== 'CURRENT TASK RESUME BLOCK') {
  errors.push('docs/WORK_CONTINUATION.md:3 [resume-block-must-be-first]');
}

const blockStart = levelTwo[0]?.index ?? 0;
const blockEnd = levelTwo[1]?.index ?? text.length;
const block = text.slice(blockStart, blockEnd);
const required = [
  ['date', /- Date:/i],
  ['objective', /- Authorized objective:/i],
  ['worktree', /- Worktree:/i],
  ['branch', /- Branch:/i],
  ['base-or-head', /- (?:Starting commit|Base|HEAD):/i],
  ['upstream-state', /- Upstream:/i],
  ['phase', /- Current phase:/i],
  ['completed-work', /### Verified baseline/i],
  ['files-or-ownership', /### (?:Six-specialist ownership map|Files changed)/i],
  ['schema-api-permission-state', /### Frozen cross-cutting contracts/i],
  ['exact-tests', /`npm (?:test|run check)`/i],
  ['deployment-state', /- Live state at task start:/i],
  ['blockers', /(?:known gaps|blocker)/i],
  ['next-actions', /next actions/i],
  ['rollback-state', /rollback version/i],
  ['identifier-redaction', /without exposing (?:their )?identifiers|intentionally absent from git/i],
];

for (const [label, pattern] of required) {
  if (!pattern.test(block)) errors.push(`docs/WORK_CONTINUATION.md:3 [missing-${label}]`);
}

if (lines.length > 450) errors.push('docs/WORK_CONTINUATION.md [line-ceiling-exceeded]');
if (Buffer.byteLength(text, 'utf8') > 45_000)
  errors.push('docs/WORK_CONTINUATION.md [byte-ceiling-exceeded]');

if (errors.length) {
  console.error(
    `Continuation guardrail check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Continuation guardrail check passed (${lines.length} lines; current resume block first).`);
