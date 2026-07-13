import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'AGENTS.md');
const text = await readFile(file, 'utf8');
const lines = text.split(/\r?\n/);
const errors = [];

const required = [
  ['repository source of truth', /GitHub repository is the shared source of truth/i],
  ['required handshake', /^## Required start-of-task handshake$/m],
  ['fetch step', /git fetch origin --prune/],
  ['ahead-behind comparison', /git rev-list --left-right --count HEAD\.\.\.@\{upstream\}/],
  ['fast-forward-only pull', /git pull --ff-only/],
  ['fresh branch exception', /fresh task branch may lack an upstream/i],
  ['exact fresh-branch base', /exact branch and starting commit/i],
  ['read-only boundary', /read-only review or planning tasks/i],
  ['one-writer rule', /Only one agent may write at a time/i],
  ['generated-file ownership', /Do not hand-edit `dist\/index\.html`/],
  ['adapter boundary', /Only `src\/services\/apps-script-adapter\.js` may use `google\.script\.run`/],
  ['append-only ledger rule', /Never edit or delete posted ledger entries/i],
  ['VERIFY fail-closed rule', /Never transact `VERIFY` items/i],
  ['Drive fail-closed rule', /Never fall back to the script owner/i],
  ['secret exclusion rule', /Do not commit `\.clasp\.json`, secrets/i],
  [
    'clasp remote snapshot safeguard',
    /remote-snapshot, status, manifest-preservation, and post-push parity safeguard/i,
  ],
  [
    'truthful verification rule',
    /Never claim a push, test, deployment, or external write without verification/i,
  ],
];

for (const [label, pattern] of required) {
  if (!pattern.test(text)) errors.push(`AGENTS.md [missing-${label.replaceAll(' ', '-')}]`);
}

if (/clasp\s+push\s+--dry-run/i.test(text)) {
  errors.push('AGENTS.md [unsupported-clasp-dry-run]');
}

const headings = [...text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
const duplicateHeadings = headings.filter((heading, index) => headings.indexOf(heading) !== index);
for (const heading of new Set(duplicateHeadings)) {
  errors.push(`AGENTS.md [duplicate-heading:${heading}]`);
}

if (lines.length > 100) errors.push('AGENTS.md [line-ceiling-exceeded]');
if (Buffer.byteLength(text, 'utf8') > 10_000) errors.push('AGENTS.md [byte-ceiling-exceeded]');

if (errors.length) {
  console.error(
    `AGENTS.md guardrail check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`AGENTS.md guardrail check passed (${lines.length} lines).`);
