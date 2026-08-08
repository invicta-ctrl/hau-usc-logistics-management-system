/* Accessibility / responsive verification for the redesign preview.
   Drives the generated single-file export in real Chromium viewports and
   writes screenshot evidence.

   Run from the repository root that has Playwright installed:
     node <path>/tools/verify.mjs <path-to-preview.html> <screens-out-dir>

   Read-only with respect to the product: it opens a local file and contacts
   no network service. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

/* This preview has no node_modules of its own. Point PLAYWRIGHT_PATH at an
   existing install (module resolution follows this file, not the cwd). */
const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const previewPath = resolve(process.argv[2]);
const screensDir = resolve(process.argv[3]);
mkdirSync(screensDir, { recursive: true });

const WIDTHS = [320, 375, 414, 768, 1024, 1440];

/* Surfaces captured as screenshot evidence (width -> which surfaces). */
const SHOTS = [
  ['public.landing', 'populated'],
  ['public.request-intake', 'error'],
  ['public.request-tracking', 'success'],
  ['public.signin', 'populated'],
  ['admin.overview', 'populated'],
  ['admin.overview', 'loading'],
  ['admin.overview', 'empty'],
  ['request.queue', 'populated'],
  ['request.queue', 'stale'],
  ['request.queue', 'denied'],
  ['lending.queue', 'populated'],
  ['lending.detail', 'populated'],
  ['release.desk', 'populated'],
  ['release.desk', 'unavailable'],
  ['inventory.catalog', 'populated'],
  ['inventory.item', 'populated'],
  ['owner.health', 'populated'],
  ['admin.access', 'populated'],
];

const results = { widths: {}, keyboard: null, reducedMotion: null, zoom: null };

const browser = await chromium.launch();

/* ---------- audit each width ---------- */

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  const requests = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('file:')) requests.push(r.url());
  });

  await page.goto(pathToFileURL(previewPath).href);

  /* v2 has staged entrance motion. Mid-animation, transformed elements report
     offset geometry and interpolated colours, which produces phantom overflow
     and contrast readings. Freeze motion so measurements and screenshots are
     deterministic. Reduced-motion behaviour is asserted separately below. */
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition: none !important;
      animation: none !important;
    }`,
  });

  const findings = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('#surface-picker option')]
      .map((o) => o.value)
      .filter((v) => v !== 'index');
    const out = [];
    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null;
    };

    for (const id of ids) {
      set('#surface-picker', id);
      const sp = document.querySelector('#state-picker');
      const states = sp ? [...sp.options].map((o) => o.value) : ['populated'];
      for (const st of states) {
        set('#surface-picker', id);
        if (document.querySelector('#state-picker')) set('#state-picker', st);
        const tag = `${id}/${st}`;
        const de = document.documentElement;

        if (de.scrollWidth > de.clientWidth + 1)
          out.push(`OVERFLOW ${tag} ${de.scrollWidth}>${de.clientWidth}`);

        // Interactive targets that are visible must clear 24px (WCAG 2.2 AA).
        document
          .querySelectorAll('.frame button, .frame select, .frame input, .frame textarea')
          .forEach((el) => {
            if (!visible(el)) return;
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.height < 24)
              out.push(`TARGET ${tag} ${Math.round(r.height)}px ${el.className || el.type}`);
          });

        // Status must never be colour-only.
        document.querySelectorAll('.chip').forEach((c) => {
          if (!c.textContent.trim()) out.push(`COLOUR-ONLY ${tag}`);
        });

        // Headings
        const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
        let prev = 0;
        hs.forEach((l) => {
          if (prev && l > prev + 1) out.push(`HEADING ${tag} h${prev}->h${l}`);
          prev = l;
        });

        // Duplicate ids
        const cnt = {};
        document.querySelectorAll('[id]').forEach((e) => (cnt[e.id] = (cnt[e.id] || 0) + 1));
        Object.entries(cnt).forEach(([k, v]) => {
          if (v > 1) out.push(`DUPLICATE-ID ${tag} ${k}`);
        });
      }
    }
    return [...new Set(out)];
  });

  results.widths[width] = { findings, consoleErrors, externalRequests: requests };

  /* screenshots at the three evidence widths */
  if ([320, 768, 1440].includes(width)) {
    for (const [id, st] of SHOTS) {
      await page.evaluate(
        ([sid, sst]) => {
          const set = (sel, val) => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          };
          set('#surface-picker', sid);
          if (document.querySelector('#state-picker')) set('#state-picker', sst);
        },
        [id, st],
      );
      await page.waitForTimeout(80);
      await page.screenshot({
        path: join(screensDir, `${width}-${id}-${st}.png`),
        fullPage: false,
      });
    }
    // one dark-theme capture per evidence width
    await page.evaluate(() => {
      document.querySelector('[data-act="theme"][data-v="dark"]')?.click();
      const el = document.querySelector('#surface-picker');
      el.value = 'admin.overview';
      el.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[data-act="theme"][data-v="dark"]')?.click();
    });
    await page.waitForTimeout(80);
    await page.screenshot({ path: join(screensDir, `${width}-admin.overview-dark.png`) });
  }

  await ctx.close();
}

/* ---------- keyboard smoke ---------- */

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(previewPath).href);
  await page.evaluate(() => {
    const el = document.querySelector('#surface-picker');
    el.value = 'request.queue';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const trail = [];
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press('Tab');
    trail.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return 'BODY';
        const s = getComputedStyle(a);
        return `${a.tagName.toLowerCase()}:${(a.className || '').toString().split(' ')[0] || '-'}:outline=${s.outlineStyle}`;
      }),
    );
  }

  // Dialog: open, confirm focus moves in, Escape closes and restores focus.
  const dialog = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[data-act="confirm-accept"]')][0];
    if (!btn) return { error: 'no accept button' };
    btn.focus();
    const before = document.activeElement.dataset.act;
    btn.click();
    const open = !!document.querySelector('[role="dialog"][aria-modal="true"]');
    const inside = document.querySelector('[data-overlay-root]')?.contains(document.activeElement);
    return { before, open, focusMovedIn: !!inside };
  });
  await page.keyboard.press('Escape');
  const afterEscape = await page.evaluate(() => ({
    stillOpen: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
    restoredTo: document.activeElement?.dataset?.act ?? document.activeElement?.tagName,
  }));

  results.keyboard = {
    reachedBody: trail.filter((t) => t === 'BODY').length,
    noOutlineNone: trail.filter((t) => t.endsWith('outline=none')).length,
    sample: trail.slice(0, 8),
    dialog,
    afterEscape,
  };
  await ctx.close();
}

/* ---------- reduced motion + 200% zoom ---------- */

{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(previewPath).href);
  results.reducedMotion = await page.evaluate(() => {
    const el = document.querySelector('.preview-bar__tag') || document.body;
    return {
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: getComputedStyle(el).transitionDuration,
    };
  });
  await ctx.close();
}

{
  // 200% zoom ~= half the CSS viewport at the same device size.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(previewPath).href);
  await page.evaluate(() => (document.body.style.zoom = '2'));
  results.zoom = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('#surface-picker option')]
      .map((o) => o.value)
      .filter((v) => v !== 'index');
    const bad = [];
    for (const id of ids) {
      const el = document.querySelector('#surface-picker');
      el.value = id;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth + 2) bad.push(id);
    }
    return { overflowAt200: bad };
  });
  await ctx.close();
}

await browser.close();

writeFileSync(join(screensDir, '..', 'verify-results.json'), JSON.stringify(results, null, 2));

const total = Object.values(results.widths).reduce((s, w) => s + w.findings.length, 0);
const errs = Object.values(results.widths).reduce((s, w) => s + w.consoleErrors.length, 0);
const ext = Object.values(results.widths).reduce((s, w) => s + w.externalRequests.length, 0);
console.log(JSON.stringify({ totalFindings: total, consoleErrors: errs, externalRequests: ext }, null, 1));
for (const [w, r] of Object.entries(results.widths)) {
  console.log(`${w}px: ${r.findings.length} findings`);
  r.findings.slice(0, 10).forEach((f) => console.log('   ' + f));
}
console.log('keyboard:', JSON.stringify(results.keyboard));
console.log('reducedMotion:', JSON.stringify(results.reducedMotion));
console.log('zoom:', JSON.stringify(results.zoom));
