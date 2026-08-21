/* Quick visual spot-check: render given surfaces at a width/theme and write PNGs.
   Usage:
     PLAYWRIGHT_PATH=... node tools/shot.mjs <preview.html> <outDir> <width> <theme> <surface[,surface...]> */

import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const [previewArg, outArg, widthArg, themeArg, surfaceArg] = process.argv.slice(2);
const preview = resolve(previewArg);
const outDir = resolve(outArg);
const width = Number(widthArg) || 1440;
const theme = themeArg || 'light';
const surfaces = (surfaceArg || 'admin.overview').split(',');

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(pathToFileURL(preview).href);

for (const surface of surfaces) {
  await page.evaluate(
    ([sid, th]) => {
      const btn = document.querySelector(`[data-act="theme"][data-v="${th}"]`);
      if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
      const sel = document.querySelector('#surface-picker');
      sel.value = sid;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [surface, theme],
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, `${width}-${theme}-${surface}.png`) });
}

await browser.close();
console.log(JSON.stringify({ width, theme, surfaces, consoleErrors: errors }, null, 1));
