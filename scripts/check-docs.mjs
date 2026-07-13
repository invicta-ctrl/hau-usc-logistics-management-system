import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tracked = execFileSync('git', ['ls-files', '-z', '*.md'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const errors = [];
const linkChecks = [];
const requiredDocs = [
  'docs/DOCUMENTATION_INDEX.md',
  'docs/ARCHITECTURE.md',
  'docs/API_AND_SERVICE_CONTRACTS.md',
  'docs/DATA_DICTIONARY.md',
  'docs/GOOGLE_SHEETS_SCHEMA.md',
  'docs/GOOGLE_DRIVE_EVIDENCE.md',
  'docs/SECURITY_AND_ACCESS.md',
  'docs/MOBILE_AND_PWA_STRATEGY.md',
  'docs/DEVELOPER_ONBOARDING.md',
  'docs/ADMIN_GUIDE.md',
  'docs/REQUESTER_GUIDE.md',
  'docs/OPERATOR_CHECKLIST.md',
  'docs/OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md',
  'docs/HOSTING_AND_DATABASE_CANDIDATES.md',
  'docs/FUTURE_HOSTING_AND_DATABASE.md',
  'docs/adr/0001-future-hosted-platform.md',
];

for (const path of requiredDocs) {
  try {
    await access(resolve(root, path));
  } catch {
    errors.push(`${path}:1 [missing-required-document]`);
  }
}

const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
for (const path of tracked) {
  const text = await readFile(resolve(root, path), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(linkPattern)) {
      let target = match[1].trim().replace(/^<|>$/g, '');
      if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
      target = target.split('#')[0].split(/\s+['"]/)[0];
      try {
        target = decodeURIComponent(target);
      } catch {
        errors.push(`${path}:${index + 1} [invalid-link-encoding]`);
        continue;
      }
      const absolute = resolve(root, dirname(path), target);
      linkChecks.push(
        access(absolute).catch(() => errors.push(`${path}:${index + 1} [broken-internal-link]`)),
      );
    }
  });
}

await Promise.all(linkChecks);

const activeClaspDocs = [
  'AGENTS.md',
  'docs/APPS_SCRIPT_SETUP.md',
  'docs/CLASP_DEPLOYMENT.md',
  'docs/LAUNCH_RUNBOOK.md',
  'docs/OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md',
  'docs/DEVELOPER_ONBOARDING.md',
];
for (const path of activeClaspDocs) {
  try {
    const text = await readFile(resolve(root, path), 'utf8');
    if (/clasp\s+push\s+--dry-run/i.test(text)) errors.push(`${path}:1 [unsupported-clasp-dry-run]`);
  } catch {
    // Missing required docs are reported above.
  }
}

try {
  const index = await readFile(resolve(root, 'docs', 'DOCUMENTATION_INDEX.md'), 'utf8');
  for (const path of requiredDocs.filter((item) => item !== 'docs/DOCUMENTATION_INDEX.md')) {
    const relative = path.replace(/^docs\//, '');
    if (!index.includes(`](${relative})`))
      errors.push(`docs/DOCUMENTATION_INDEX.md:1 [missing-index-link:${relative}]`);
  }
} catch {
  // Missing index is reported above.
}

const unique = [...new Set(errors)].sort();
if (unique.length) {
  console.error(`Documentation check failed (${unique.length} issue${unique.length === 1 ? '' : 's'}):`);
  for (const error of unique) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Documentation check passed (${tracked.length} tracked Markdown files; canonical map and internal links verified).`,
);
