import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const findings = [];
const textExtensions = new Set([
  '',
  '.css',
  '.example',
  '.gs',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.toml',
  '.txt',
  '.yaml',
  '.yml',
]);
const scannerPath = 'scripts/check-sensitive-content.mjs';

const secretPatterns = [
  ['private-key', new RegExp(['-----BEGIN ', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY-----'].join(''), 'i')],
  ['github-token', new RegExp(['(?:gh[pousr]|github', '_pat)_', '[A-Za-z0-9_]{20,}'].join(''), 'i')],
  ['google-api-key', new RegExp(['AI', 'za[0-9A-Za-z_-]{30,}'].join(''))],
  ['slack-token', new RegExp(['xo', 'x[baprs]-[0-9A-Za-z-]{20,}'].join(''), 'i')],
  ['generic-bearer-token', /authorization\s*:\s*bearer\s+[A-Za-z0-9._~-]{24,}/i],
];

const isPlaceholder = (value) =>
  /(?:MOCK|DEMO|TEST|EXAMPLE|PLACEHOLDER|REPLACE|TO_BE_ASSIGNED|staging-|production-)/i.test(value);
const report = (path, line, category) => findings.push(`${path}:${line} [${category}]`);

for (const path of tracked) {
  const normalized = path.replaceAll('\\', '/');
  const lower = normalized.toLowerCase();
  if (
    lower === '.clasp.json' ||
    lower === '.clasprc.json' ||
    (lower.startsWith('.env') && lower !== '.env.example')
  ) {
    report(normalized, 1, 'tracked-sensitive-config-file');
  }
  if (/\b(?:credentials|service-account)(?:\.[^/]*)?$/i.test(normalized)) {
    report(normalized, 1, 'tracked-credential-file');
  }
  if (!textExtensions.has(extname(lower)) || normalized === scannerPath) continue;

  const content = await readFile(resolve(root, path));
  if (content.includes(0)) continue;
  const lines = content.toString('utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    const number = index + 1;
    for (const [category, pattern] of secretPatterns) {
      if (pattern.test(line)) report(normalized, number, category);
    }

    if (
      !/\/mock\//i.test(line) &&
      /https:\/\/(?:docs\.google\.com\/spreadsheets\/d\/|drive\.google\.com\/(?:file\/d\/|drive\/folders\/)|script\.google\.com\/(?:macros\/s\/|home\/projects\/))/i.test(
        line,
      )
    ) {
      report(normalized, number, 'live-google-resource-url');
    }

    const clasp = line.match(/"scriptId"\s*:\s*"([A-Za-z0-9_-]{20,})"/i);
    if (clasp && !isPlaceholder(clasp[1])) report(normalized, number, 'deployed-script-id');

    const contextual = line.match(
      /(?:spreadsheet|drive folder|script|deployment)\s+(?:id|identifier|reference)?\s*(?:is|:|=)?\s*[`'"]([A-Za-z0-9_-]{25,})[`'"]/i,
    );
    if (contextual && !isPlaceholder(contextual[1])) report(normalized, number, 'live-resource-identifier');

    if (
      /production/i.test(line) &&
      /`(?:LND|LREQ|REQ|REL|RST|EVD|CAN|SUP)-\d{4}-\d+`/i.test(line) &&
      !/DEMO/i.test(line)
    ) {
      report(normalized, number, 'production-record-identifier');
    }
  });
}

const unique = [...new Set(findings)].sort();
if (unique.length) {
  console.error(
    `Sensitive-content check failed (${unique.length} location${unique.length === 1 ? '' : 's'}). Values are intentionally suppressed:`,
  );
  for (const finding of unique) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Sensitive-content check passed (${tracked.length} tracked paths; values never printed).`);
