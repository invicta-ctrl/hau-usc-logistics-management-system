/* Capture production front-end visual baseline BEFORE the first source edit.
   Required by .codex/specs/active/v0.7.3-frontend-design-integration.md §13.

   Opens the generated production artifact locally. It makes no authenticated
   or backend call; unauthenticated surfaces render, and anything requiring a
   session is recorded in whatever state production actually shows without one.
   That is the honest baseline — it is what a visitor sees.

   Usage:
     PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
       node tools/design/capture-production-baseline.mjs <artifact.html> <outDir>
*/

import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const artifact = resolve(process.argv[2]);
const outDir = resolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });

const WIDTHS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
const report = { artifact, captured: [], consoleErrors: [], externalRequests: [] };

for (const vp of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && report.consoleErrors.push(`${vp.name}: ${m.text()}`));
  page.on('pageerror', (e) => report.consoleErrors.push(`${vp.name}: ${String(e)}`));
  page.on('request', (r) => {
    if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) {
      report.externalRequests.push(`${vp.name}: ${r.url()}`);
    }
  });

  await page.goto(pathToFileURL(artifact).href, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);

  const shot = join(outDir, `production-${vp.name}-${vp.width}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const summary = await page.evaluate(() => ({
    title: document.title,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()).slice(0, 4),
    buttons: [...document.querySelectorAll('button, a[href]')]
      .map((b) => (b.textContent || '').trim())
      .filter(Boolean)
      .slice(0, 30),
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));

  report.captured.push({ viewport: vp, shot, summary });
  await ctx.close();
}

await browser.close();
writeFileSync(join(outDir, 'production-baseline.json'), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      shots: report.captured.length,
      consoleErrors: report.consoleErrors.length,
      externalRequests: [...new Set(report.externalRequests)].slice(0, 5),
      firstHeadings: report.captured[0]?.summary.h1,
      overflow: report.captured.map((c) => `${c.viewport.name}:${c.summary.hasHorizontalOverflow}`),
    },
    null,
    1,
  ),
);
