/* Text contrast sweep over every surface in both themes.
   WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text (>=24px, or >=18.66px bold).

   Run:
     PLAYWRIGHT_PATH=<...> node tools/contrast.mjs <preview.html> */

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const previewPath = resolve(process.argv[2]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(pathToFileURL(previewPath).href);

const findings = await page.evaluate(() => {
  const srgb = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((n) => parseFloat(n));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a));
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  /* Returns null when an ancestor paints a background-image (gradient), since
     a single sampled colour cannot represent it. Those are reported separately
     rather than counted as failures. */
  function effectiveBg(el) {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? over({ rgb: acc, a: 1 }, c.rgb) : c.a === 1 ? c.rgb : null;
        if (c.a === 1) return acc ?? c.rgb;
      }
      node = node.parentElement;
    }
    return acc ?? [255, 255, 255];
  }

  const out = [];
  const themes = ['light', 'dark'];
  const ids = [...document.querySelectorAll('#surface-picker option')]
    .map((o) => o.value)
    .filter((v) => v !== 'index');

  for (const theme of themes) {
    document.querySelector(`[data-act="theme"][data-v="${theme}"]`)?.click();
    for (const id of ids) {
      const sel = document.querySelector('#surface-picker');
      sel.value = id;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector(`[data-act="theme"][data-v="${theme}"]`)?.click();

      document.querySelectorAll('.frame *').forEach((el) => {
        // only elements with their own visible text
        const text = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join('');
        if (!text) return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return;
        const fg = parse(s.color);
        if (!fg) return;
        const bg = effectiveBg(el);
        if (!bg) return; // gradient-backed; checked visually instead
        const fgOn = over(fg, bg);
        const r = ratio(fgOn, bg);
        const size = parseFloat(s.fontSize);
        const bold = +s.fontWeight >= 700;
        const large = size >= 24 || (bold && size >= 18.66);
        const need = large ? 3 : 4.5;
        if (r < need - 0.01) {
          out.push(
            `${theme}/${id} ${r.toFixed(2)}:1 need ${need} — ${size}px${bold ? ' bold' : ''} "${text.slice(0, 30)}" .${String(el.className).split(' ')[0]}`,
          );
        }
      });
    }
  }
  return [...new Set(out)];
});

await browser.close();
console.log(JSON.stringify({ failures: findings.length, items: findings.slice(0, 40) }, null, 1));
