#!/usr/bin/env node
// Contrast for text that sits over PHOTOGRAPHY, GRADIENTS or GLASS.
//
// `contrast-audit.mjs` resolves token pairs. That is the right tool for text on
// a flat surface and useless for text on a campus photograph, because there is
// no token behind the text — there is a picture, and the picture is bright in
// some places and dark in others. WCAG 2.2 1.4.3 applies to the actual
// rendered relationship, so this measures the actual rendered relationship.
//
// METHOD
//   1. Find every text node whose backdrop is an image, a gradient or a glass
//      pane, and record its box and its computed colour.
//   2. Hide the text (visibility only — layout must not move) and screenshot.
//   3. Inside each box, average the backdrop into 8x8 patches and keep the
//      WORST patch: the one that gives the lowest contrast against the ink.
//      A headline that passes over the sky and fails over a lit facade has
//      failed, and averaging the whole box would hide that.
//
// Patches rather than single pixels because a single pixel is noise, and a
// letterform only has to stay legible against the area it actually covers.
//
// Usage: node scripts/design/overlay-contrast.mjs
// Exit 0 when every sampled run passes its threshold, 1 otherwise.

import { chromium } from 'playwright';
import sharp from 'sharp';

const R3 = 'http://127.0.0.1:8805/public-portals-r3/index.html';
const V5 = 'http://127.0.0.1:8805/impeccable-whole-site-redesign-v5/index.html';

const TARGETS = [
  { id: 'landing', url: V5 + '#/public.landing', v5: true },
  { id: 'signin', url: V5 + '#/public.signin', v5: true },
  { id: 'overview', url: V5 + '#/admin.overview', v5: true },
  { id: 'public-lending', url: (t) => R3 + '?route=lending&theme=' + t },
  { id: 'public-request', url: (t) => R3 + '?route=request&theme=' + t },
];

const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const PATCH = 8;

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);
const ratio = (a, b) => {
  const [hi, lo] = [a, b].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch();
const rows = [];
let failures = 0;

for (const target of TARGETS) {
  for (const theme of ['light', 'dark']) {
    for (const vp of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = typeof target.url === 'function' ? target.url(theme) : target.url;
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      if (target.v5) {
        await page.click(`[data-act="theme"][data-v="${theme}"]`, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
      await page.waitForTimeout(200);

      /* Collect text whose backdrop is NOT a flat colour. Walking ancestors
         matters: the text itself is almost never the element carrying the
         photograph or the backdrop-filter. */
      const samples = await page.evaluate(() => {
        const out = [];
        const seen = new Set();

        /* Computed `color` is not always rgb(): with an oklch() or color-mix()
           token the engine hands back the authored syntax. Painting one pixel
           and reading it out normalises anything the browser can parse, which
           is the only parser guaranteed to agree with what was rendered. */
        const probe = document.createElement('canvas');
        probe.width = 1;
        probe.height = 1;
        const ctx = probe.getContext('2d', { willReadFrequently: true });
        const toRgb = (css) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#000';
          ctx.fillStyle = css;
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], d[3] / 255];
        };

        for (const node of document.querySelectorAll(
          'h1, h2, h3, p, a, span, label, strong, td, li, button',
        )) {
          if (!node.textContent.trim()) continue;
          const box = node.getBoundingClientRect();
          if (box.width < 12 || box.height < 8) continue;
          if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) continue;
          const cs = getComputedStyle(node);
          if (cs.visibility === 'hidden' || cs.opacity === '0') continue;

          let complex = false;
          for (let a = node; a && a !== document.documentElement; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (s.backgroundImage && s.backgroundImage !== 'none') complex = true;
            if (s.backdropFilter && s.backdropFilter !== 'none') complex = true;
            if (s.webkitBackdropFilter && s.webkitBackdropFilter !== 'none') complex = true;
            if (complex) break;
            /* An opaque flat background between the text and the picture means
               the picture is no longer the backdrop. Stop climbing. */
            if (toRgb(s.backgroundColor)[3] >= 0.92) break;
          }
          if (!complex) continue;

          const key = Math.round(box.x) + ':' + Math.round(box.y) + ':' + Math.round(box.width);
          if (seen.has(key)) continue;
          seen.add(key);

          const size = parseFloat(cs.fontSize);
          const weight = Number(cs.fontWeight) || 400;
          const large = size >= 24 || (size >= 18.66 && weight >= 700);
          const ink = toRgb(cs.color);
          out.push({
            label: node.textContent.trim().replace(/\s+/gu, ' ').slice(0, 34),
            x: Math.max(0, Math.floor(box.left)),
            y: Math.max(0, Math.floor(box.top)),
            w: Math.min(innerWidth, Math.ceil(box.right)) - Math.max(0, Math.floor(box.left)),
            h: Math.min(innerHeight, Math.ceil(box.bottom)) - Math.max(0, Math.floor(box.top)),
            ink,
            large,
          });
        }
        return out.filter((s) => s.w > 8 && s.h > 6).slice(0, 40);
      });

      if (samples.length) {
        /* visibility, not display — hiding by display would reflow the page and
           every box we just measured would be wrong. */
        await page.addStyleTag({
          content:
            'h1,h2,h3,p,a,span,label,strong,td,li,button{visibility:hidden !important}' +
            'svg,img{visibility:hidden !important}',
        });
        await page.waitForTimeout(120);
        const png = await page.screenshot({ type: 'png' });
        const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });

        for (const s of samples) {
          const inkLum = lum(s.ink[0], s.ink[1], s.ink[2]);
          let worst = Infinity;
          for (let py = s.y; py < s.y + s.h; py += PATCH) {
            for (let px = s.x; px < s.x + s.w; px += PATCH) {
              let sr = 0,
                sg = 0,
                sb = 0,
                n = 0;
              for (let yy = py; yy < Math.min(py + PATCH, s.y + s.h, info.height); yy++) {
                for (let xx = px; xx < Math.min(px + PATCH, s.x + s.w, info.width); xx++) {
                  const i = (yy * info.width + xx) * info.channels;
                  sr += data[i];
                  sg += data[i + 1];
                  sb += data[i + 2];
                  n++;
                }
              }
              if (!n) continue;
              const r = ratio(inkLum, lum(sr / n, sg / n, sb / n));
              if (r < worst) worst = r;
            }
          }
          if (!Number.isFinite(worst)) continue;
          const min = s.large ? 3 : 4.5;
          const pass = worst >= min;
          if (!pass) failures++;
          rows.push({
            target: target.id,
            theme,
            width: vp.name,
            label: s.label,
            worst: worst.toFixed(2),
            min,
            pass,
          });
        }
      }
      await page.close();
    }
  }
}
await browser.close();

/* Only the worst run per surface/theme/width is printed — 40 passing headlines
   is not information, the closest call is. */
const groups = new Map();
for (const r of rows) {
  const key = r.target + '|' + r.theme + '|' + r.width;
  const cur = groups.get(key);
  if (!cur || Number(r.worst) < Number(cur.worst)) groups.set(key, r);
}

const printed = [...groups.values()];
const w = (k) => Math.max(k.length, ...printed.map((r) => String(r[k]).length));
const cols = ['target', 'theme', 'width', 'worst', 'min', 'label'];
const widths = cols.map(w);
process.stdout.write('worst-case text contrast over imagery, gradients and glass\n\n');
process.stdout.write(cols.map((c, i) => c.padEnd(widths[i])).join('  ') + '\n');
for (const r of printed.sort((a, b) => Number(a.worst) - Number(b.worst))) {
  process.stdout.write(
    (r.pass ? 'PASS  ' : 'FAIL  ') + cols.map((c, i) => String(r[c]).padEnd(widths[i])).join('  ') + '\n',
  );
}
process.stdout.write(
  `\n${rows.length - failures}/${rows.length} sampled text runs pass · ${printed.length} surface/theme/width combinations\n`,
);
process.exit(failures ? 1 : 0);
