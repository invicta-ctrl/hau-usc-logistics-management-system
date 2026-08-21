/* Required v3 -> v4.1 visual-delta evidence.
   Captures identical viewports, sanitizes prohibited historical fixture text in
   the evidence DOM, and emits before/after plus side-by-side comparisons. */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright',
);

const [beforeArg, afterArg, outArg] = process.argv.slice(2);
if (!beforeArg || !afterArg || !outArg) {
  console.error('Usage: node visual-delta.mjs <v3.html> <v4.1.html> <output-directory>');
  process.exit(2);
}

const beforePreview = resolve(beforeArg);
const afterPreview = resolve(afterArg);
const outDir = resolve(outArg);
const beforeDir = join(outDir, 'before-v3');
const afterDir = join(outDir, 'after-v4.1');
const compareDir = join(outDir, 'comparisons');
for (const dir of [outDir, beforeDir, afterDir, compareDir]) mkdirSync(dir, { recursive: true });

const cases = [
  { id: 'overview-light-1440', label: 'Overview · light · 1440', width: 1440, height: 900, theme: 'light', surface: 'admin.overview' },
  { id: 'overview-dark-1440', label: 'Overview · dark · 1440', width: 1440, height: 900, theme: 'dark', surface: 'admin.overview' },
  { id: 'request-center-light-1440', label: 'Request Center · light · 1440', width: 1440, height: 900, theme: 'light', surface: 'public.request-intake' },
  { id: 'inventory-light-1440', label: 'Inventory · light · 1440', width: 1440, height: 900, theme: 'light', surface: 'inventory.catalog' },
  { id: 'release-lending-dark-1440', label: 'Release / Lending · dark · 1440', width: 1440, height: 900, theme: 'dark', surface: 'lending.queue' },
  { id: 'public-portal-light-1440', label: 'Public portal · light · 1440', width: 1440, height: 900, theme: 'light', surface: 'public.landing' },
  { id: 'overview-light-390', label: 'Overview · light · 390', width: 390, height: 900, theme: 'light', surface: 'admin.overview' },
  { id: 'overview-dark-390', label: 'Overview · dark · 390', width: 390, height: 900, theme: 'dark', surface: 'admin.overview' },
];

const browser = await chromium.launch();
const manifest = [];

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

async function capture(preview, destination, shot) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => {
    if (!request.url().startsWith('file:') && !request.url().startsWith('data:')) {
      externalRequests.push(request.url());
    }
  });

  await page.goto(pathToFileURL(preview).href);
  const previewViewport = shot.width <= 414 ? 'mobile' : shot.width <= 1024 ? 'tablet' : 'desktop';
  await page.click(`[data-act="viewport"][data-v="${previewViewport}"]`);
  await page.click(`[data-act="theme"][data-v="${shot.theme}"]`);
  await page.selectOption('#surface-picker', shot.surface);
  await page.waitForTimeout(560);

  // The v3 artifact is historical evidence and contained a known production
  // event hierarchy. Sanitize the rendered evidence without altering source.
  await page.evaluate(() => {
    const substitutions = [
      [/Youth Development Days(?:\s*·\s*Day\s*\d+)?/gi, 'Historical illustrative event'],
      [/USC Executive Board/gi, 'Illustrative Executive Council'],
      [/Committee on Student Welfare/gi, 'Illustrative Student Services'],
      [/REQ-\d{6}/g, 'REQ-DEMO-431'],
      [/2026-\d{2}-\d{2}/g, '2032-05-19'],
      [/19 August 2026/gi, '19 May 2032'],
      [/18 August 2026/gi, '18 May 2032'],
      [/17 August 2026/gi, '17 May 2032'],
      [/12 August 2026/gi, '12 May 2032'],
      [/7 August 2026/gi, '7 May 2032'],
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue;
      for (const [pattern, replacement] of substitutions) value = value.replace(pattern, replacement);
      node.nodeValue = value;
    }
  });

  await page.screenshot({ path: destination });
  await context.close();
  return { errors, externalRequests, sha256: sha256(destination) };
}

async function composeComparison(shot, beforePath, afterPath, destination) {
  const width = shot.width * 2;
  const height = shot.height + 54;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const before = readFileSync(beforePath).toString('base64');
  const after = readFileSync(afterPath).toString('base64');
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}html,body{margin:0;background:#1b1415;color:#fff;font:700 14px system-ui,sans-serif}
    header{height:54px;display:grid;grid-template-columns:1fr 1fr;align-items:center;border-bottom:1px solid #6b5759}
    header span{padding:0 18px;letter-spacing:.08em;text-transform:uppercase}header span:last-child{border-left:1px solid #6b5759;color:#ead092}
    main{display:grid;grid-template-columns:1fr 1fr;height:${shot.height}px;overflow:hidden}
    img{display:block;height:${shot.height}px;width:${shot.width}px;object-fit:cover}main img+img{border-left:1px solid #6b5759}
  </style></head><body><header><span>Before · v3</span><span>After · v4.1 · ${shot.label}</span></header><main>
    <img alt="Before v3" src="data:image/png;base64,${before}"><img alt="After v4.1" src="data:image/png;base64,${after}">
  </main></body></html>`);
  await page.screenshot({ path: destination });
  await context.close();
}

for (const shot of cases) {
  const beforePath = join(beforeDir, `${shot.id}.png`);
  const afterPath = join(afterDir, `${shot.id}.png`);
  const comparisonPath = join(compareDir, `${shot.id}.png`);
  const beforeEvidence = await capture(beforePreview, beforePath, shot);
  const afterEvidence = await capture(afterPreview, afterPath, shot);
  await composeComparison(shot, beforePath, afterPath, comparisonPath);
  manifest.push({
    ...shot,
    before: { file: beforePath, ...beforeEvidence },
    after: { file: afterPath, ...afterEvidence },
    comparison: { file: comparisonPath, sha256: sha256(comparisonPath) },
  });
}

await browser.close();

const failures = manifest.filter(
  (entry) =>
    entry.before.errors.length ||
    entry.before.externalRequests.length ||
    entry.after.errors.length ||
    entry.after.externalRequests.length,
);
const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  beforeArtifact: basename(beforePreview),
  afterArtifact: basename(afterPreview),
  privacySanitization: 'Rendered comparison evidence only; source artifacts were not changed.',
  requiredPairs: cases.length,
  failures: failures.length,
  cases: manifest,
};
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ requiredPairs: cases.length, failures: failures.length, outDir }, null, 2));
if (failures.length) process.exitCode = 1;
