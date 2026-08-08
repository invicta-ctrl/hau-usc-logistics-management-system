/* Close-up evidence for the signature controls.
   Usage: PLAYWRIGHT_PATH=... node tools/control-shots.mjs <preview.html> <outDir> */

import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const preview = resolve(process.argv[2]);
const outDir = resolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(pathToFileURL(preview).href);

await page.evaluate(() => {
  const s = document.querySelector('#surface-picker');
  s.value = 'admin.overview';
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(400);

const report = {};

async function shot(sel, name, pad = 10) {
  const el = await page.$(sel);
  if (!el) {
    report[name] = 'MISSING';
    return;
  }
  const b = await el.boundingBox();
  if (!b) {
    report[name] = 'NO BOX';
    return;
  }
  await page.screenshot({
    path: join(outDir, `${name}.png`),
    clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 },
  });
  report[name] = `${Math.round(b.width)}x${Math.round(b.height)}`;
}

/* light state */
await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="light"]')?.click());
await page.waitForTimeout(500);
await shot('.celestial', 'celestial-light');
await shot('.menu-control', 'menu-closed');

/* dark state */
await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="dark"]')?.click());
await page.waitForTimeout(600);
await shot('.celestial', 'celestial-dark');

/* menu open state */
await page.evaluate(() => document.querySelector('.menu-control')?.click());
await page.waitForTimeout(400);
await shot('.menu-control', 'menu-open');

/* back control on a public surface */
await page.evaluate(() => {
  const s = document.querySelector('#surface-picker');
  s.value = 'public.signin';
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(400);
await shot('.back-control', 'back-control-dark');
await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="light"]')?.click());
await page.waitForTimeout(500);
await shot('.back-control', 'back-control-light');

report.consoleErrors = errors;
await browser.close();
console.log(JSON.stringify(report, null, 1));
