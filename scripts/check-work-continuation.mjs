import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_RESUME_FIELDS = [
  'Repository/worktree',
  'Branch/HEAD/upstream',
  'Current phase/stage',
  'Accepted scope',
  'Completed work',
  'Files changed by purpose',
  'Tests verified at current SHA',
  'Generated artifacts',
  'External actions',
  'Rollback',
  'Blocker',
  'Next three actions',
  'Resume commands',
  'Prohibited actions',
];

export function validateContinuation(text) {
  const firstLines = text.split(/\r?\n/).slice(0, 100).join('\n');
  const errors = [];
  if (!/^## Current resume block\s*$/m.test(firstLines)) {
    errors.push('missing top-level Current resume block');
  }
  for (const field of REQUIRED_RESUME_FIELDS) {
    const pattern = new RegExp(`^- \\*\\*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\*\\*\\s+\\S`, 'm');
    if (!pattern.test(firstLines)) errors.push(`missing or empty ${field}`);
  }
  if (/<(?:TBD|TODO|fill|unknown)>/i.test(firstLines)) {
    errors.push('resume block contains an unresolved placeholder');
  }
  return errors;
}

function run() {
  const file = path.join(process.cwd(), 'docs/WORK_CONTINUATION.md');
  if (!fs.existsSync(file)) {
    console.error('Continuation check failed: docs/WORK_CONTINUATION.md is missing.');
    process.exitCode = 1;
    return;
  }
  const errors = validateContinuation(fs.readFileSync(file, 'utf8'));
  if (errors.length) {
    console.error(`Continuation check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Continuation check passed (${REQUIRED_RESUME_FIELDS.length} required fields).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
