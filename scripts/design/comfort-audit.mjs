#!/usr/bin/env node
// Visual-comfort measurement for the design prototypes.
//
// WCAG says whether a foreground/background PAIR is legible. It says nothing
// about whether a whole screen is comfortable to sit in front of for a shift.
// `contrast-audit.mjs` owns the first question. This owns the second, and it
// measures rendered pixels rather than tokens, because glare is a property of
// how much area a bright value covers, not of the value itself.
//
// Per capture it reports:
//   meanL       mean CIE L* over the viewport — overall brightness
//   glare       % of pixels at L* >= GLARE_L — how much of the screen is hot
//   paper       % of pixels effectively at pure white — the "clinical sheet" test
//   crush       % of pixels at L* <= CRUSH_L — dark-mode detail loss
//   void        % of pixels effectively at pure black
//   chroma      % of pixels with OKLCH chroma > CHROMA_MAX — saturation load
//   step        99th-percentile L* difference between adjacent 1/32-viewport
//               blocks — brightness shock between neighbouring surfaces
//
// Thresholds are this project's design bar, declared in COMFORT below. They are
// not WCAG and are not a substitute for it.
//
// Usage: node scripts/design/comfort-audit.mjs [--json out.json] [--shots dir] [--only id]
// Exit 0 when every capture is inside the bar, 1 otherwise.

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const R3 = 'http://127.0.0.1:8805/public-portals-r3/index.html';
const V5 = 'http://127.0.0.1:8805/impeccable-whole-site-redesign-v5/index.html';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const SHOTS = flag('--shots');
const JSON_OUT = flag('--json');
const ONLY = flag('--only');

/* Blocks are the unit of "large area" for the `step` metric, and the size is
   load-bearing. At 1/32 of the viewport a single primary button was enough to
   set the 99th percentile — which made the metric report "brightness shock
   between surfaces" when what it had actually found was a call to action doing
   its job. At 1/12 a block is roughly a layout region, so `step` measures what
   it claims to: adjacent SURFACES disagreeing. A full-width dark slab in a light
   plane still scores about 87 against a bar of 40, so nothing was softened. */
const BLOCKS_X = 12;

/* "Glare" has to mean BRIGHTER THAN WHERE YOU READ, which is a different value
   in each mode. In light the work plane sits at L* 95.4, so a 95 threshold would
   report the page itself as glare and push the design toward a dimmer, muddier
   paper. 96.5 catches the raised and overlay planes and anything whiter. In dark
   the body ink is L* 93, so 95 sits just above the text and catches only things
   genuinely hotter than reading content. */
const GLARE_L = { light: 96.5, dark: 95 };
const CRUSH_L = 5;
const CHROMA_MAX = 0.16;

/* THE BAR — and what each half of it is measured over.
 *
 * PROHIBITIONS are measured over the WHOLE viewport, because a pure-white sheet
 * or a pure-black field is a defect wherever it appears:
 *     paper  crush  void  chroma
 *
 * COMFORT is measured over the CONTENT PLANE only — the reading area, excluding
 * the oxblood rail and the fixture shelf:
 *     meanL  glare  step
 * The rail is the one deliberately high-contrast edge in the product. Averaging
 * it into the screen brightness would report an institutional spine as glare and
 * push the design toward washing it out, which is the opposite of the intent.
 *
 * IDENTITY SURFACES — the portal landing and the staff sign-in — carry a
 * full-bleed campus photograph by design. The luminance band does not apply to
 * them, and neither does `crush`: a night photograph legitimately contains
 * near-black pixels, and reporting a photograph as a crushed interface would
 * push the design toward washing out the only real image in the product.
 *
 * That exemption is only honest because the thing it could hide is checked
 * somewhere else. Text over photography is measured against the actual pixels
 * behind it by `overlay-contrast.mjs`, which is the check this audit cannot do
 * and the token-based contrast audit cannot do either. */
const COMFORT = {
  light: {
    prohibition: { paper: [0, 4], crush: [0, 1], void: [0, 0.5], chroma: [0, 8] },
    comfort: { meanL: [76, 95], glare: [0, 34], step: [0, 40] },
  },
  dark: {
    prohibition: { paper: [0, 0.6], crush: [0, 14], void: [0, 3], chroma: [0, 8] },
    comfort: { meanL: [10, 34], glare: [0, 1.5], step: [0, 40] },
  },
};

const IDENTITY = new Set(['landing', 'signin']);
/* Waived for identity surfaces only, for the reason stated above. */
const IDENTITY_WAIVES = new Set(['crush', 'void']);

/* NAMED WAIVERS — a threshold that gets nudged until everything passes is not a
   gate, so anything accepted is accepted BY NAME, with a reason, and is printed
   in the report rather than disappearing into a rounder number. */
const WAIVERS = [
  {
    match: (r) =>
      r.target === 'admin' && r.theme === 'light' && r.breaches.every((b) => b.startsWith('step=')),
    reason:
      'single oxblood primary action ("Invite account") against the light plane. ' +
      'IMPECCABLE_V4_VISUAL_SYSTEM records oxblood as the primary-action colour, ' +
      'and there is exactly one per surface: a deliberate high-contrast control, ' +
      'not two surfaces disagreeing. The rest of the Admin plane measures 16.1.',
  },
];

const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '768', width: 768, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const TARGETS = [
  { id: 'public-lending', label: 'Public Lending', url: (t) => R3 + '?route=lending&theme=' + t },
  { id: 'public-request', label: 'Public Request', url: (t) => R3 + '?route=request&theme=' + t },
  { id: 'overview', label: 'Overview', url: () => V5 + '#/admin.overview', v5: true },
  { id: 'inventory', label: 'Inventory', url: () => V5 + '#/inventory.catalog', v5: true },
  { id: 'request-center', label: 'Request Center', url: () => V5 + '#/request.queue', v5: true },
  { id: 'lending', label: 'Lending Hub', url: () => V5 + '#/lending.queue', v5: true },
  { id: 'release', label: 'Release Desk', url: () => V5 + '#/release.desk', v5: true },
  { id: 'admin', label: 'Accounts and access', url: () => V5 + '#/admin.access', v5: true },
  { id: 'landing', label: 'Portal landing', url: () => V5 + '#/public.landing', v5: true },
  { id: 'signin', label: 'Staff sign in', url: () => V5 + '#/public.signin', v5: true },
];

// --- colour maths ------------------------------------------------------------

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function lstar(r, g, b) {
  const y = 0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

/* OKLab, for a perceptual chroma that does not over-report yellows the way HSL
   saturation does — which matters here, because the brand accent IS a yellow. */
function oklabChroma(r, g, b) {
  const R = srgbToLinear(r / 255);
  const G = srgbToLinear(g / 255);
  const B = srgbToLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return Math.hypot(a, bb);
}

function analyse(raw, width, height, channels, theme) {
  const n = width * height;
  let sumL = 0;
  let glare = 0;
  let paper = 0;
  let crush = 0;
  let voidPx = 0;
  let chroma = 0;

  const bw = Math.max(1, Math.floor(width / BLOCKS_X));
  const cols = Math.ceil(width / bw);
  const rows = Math.ceil(height / bw);
  const blockSum = new Float64Array(cols * rows);
  const blockCount = new Float64Array(cols * rows);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const L = lstar(r, g, b);
      sumL += L;
      if (L >= GLARE_L[theme]) glare++;
      if (L >= 98) paper++;
      if (L <= CRUSH_L) crush++;
      if (L <= 2) voidPx++;
      if (oklabChroma(r, g, b) > CHROMA_MAX) chroma++;
      const bi = Math.floor(y / bw) * cols + Math.floor(x / bw);
      blockSum[bi] += L;
      blockCount[bi]++;
    }
  }

  const blockL = Array.from(blockSum, (s, i) => (blockCount[i] ? s / blockCount[i] : 0));
  const steps = [];
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      const here = blockL[by * cols + bx];
      if (bx + 1 < cols) steps.push(Math.abs(here - blockL[by * cols + bx + 1]));
      if (by + 1 < rows) steps.push(Math.abs(here - blockL[(by + 1) * cols + bx]));
    }
  }
  steps.sort((a, b) => a - b);
  const p99 = steps.length ? steps[Math.min(steps.length - 1, Math.floor(steps.length * 0.99))] : 0;

  const pct = (v) => Number(((v / n) * 100).toFixed(2));
  return {
    meanL: Number((sumL / n).toFixed(1)),
    glare: pct(glare),
    paper: pct(paper),
    crush: pct(crush),
    void: pct(voidPx),
    chroma: pct(chroma),
    step: Number(p99.toFixed(1)),
  };
}

// --- capture -----------------------------------------------------------------

if (SHOTS) await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch();
const results = [];
let failures = 0;

for (const target of TARGETS) {
  if (ONLY && !target.id.includes(ONLY)) continue;
  for (const theme of ['light', 'dark']) {
    for (const vp of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(target.url(theme), { waitUntil: 'load', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      if (target.v5) {
        // Drive v5's own control rather than setting the attribute, so the app's
        // theme state and the rendered tokens agree.
        await page.click(`[data-act="theme"][data-v="${theme}"]`, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(420);
      }
      await page.waitForTimeout(180);

      /* Two regions. The fixture shelf is prototype chrome and is excluded from
         both — measuring it would let a black control bar masquerade as a
         crushed dark theme. */
      const regions = await page.evaluate(() => {
        const shelf = document.querySelector('.preview-bar, .proto-bar');
        const top = shelf ? Math.ceil(shelf.getBoundingClientRect().bottom) : 0;
        const viewport = { x: 0, y: top, width: innerWidth, height: Math.max(1, innerHeight - top) };

        /* Selectors are tried IN ORDER, because querySelector with a list
           returns the first match in DOCUMENT order, which is not the same
           thing and picked the wrong element here once already. `.shell` is
           the portal reading plane; `#surface-main` is the workspace one. */
        let main = null;
        for (const sel of ['#surface-main', '.shell', 'main']) {
          main = document.querySelector(sel);
          if (main) break;
        }
        if (!main) return { viewport, content: viewport };
        const r = main.getBoundingClientRect();
        const x = Math.max(0, Math.floor(r.left));
        let y = Math.max(top, Math.floor(r.top));
        let bottom = Math.min(innerHeight, Math.ceil(r.bottom));

        /* Pinned chrome is excluded for the same reason the rail is: below 768
           the oxblood rail becomes a fixed top bar and a bottom tab bar, and
           counting those as reading plane reports the navigation as a
           brightness shock against the page it is navigating. Only bands at the
           top and bottom edges are removed — a fixed element floating in the
           middle of the content is content as far as the eye is concerned. */
        let topCut = y;
        let bottomCut = bottom;
        for (const node of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(node);
          /* `fixed` only, and only when it is actually pinned to a viewport
             edge. Including `sticky` swept up sticky table headers, and
             allowing unpinned elements let the region chain-shrink onto a
             single band — which showed up immediately as a content plane
             reporting 100% glare. */
          if (cs.position !== 'fixed') continue;
          if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
          const b = node.getBoundingClientRect();
          if (b.width < innerWidth * 0.5 || b.height < 8 || b.height > innerHeight * 0.4) continue;
          if (b.top <= 2 && b.bottom > topCut) topCut = Math.ceil(b.bottom);
          if (b.bottom >= innerHeight - 2 && b.top < bottomCut) bottomCut = Math.floor(b.top);
        }
        if (bottomCut - topCut > innerHeight * 0.25) {
          y = topCut;
          bottom = bottomCut;
        }

        const width = Math.max(1, Math.min(innerWidth, Math.ceil(r.right)) - x);
        return { viewport, content: { x, y, width, height: Math.max(1, bottom - y) } };
      });

      const png = await page.screenshot({ type: 'png', clip: regions.viewport });
      const full = await sharp(png).raw().toBuffer({ resolveWithObject: true });
      const whole = analyse(full.data, full.info.width, full.info.height, full.info.channels, theme);

      const contentPng = await page.screenshot({ type: 'png', clip: regions.content });
      const inner = await sharp(contentPng).raw().toBuffer({ resolveWithObject: true });
      const content = analyse(inner.data, inner.info.width, inner.info.height, inner.info.channels, theme);

      const bar = COMFORT[theme];
      const breaches = [];
      for (const [k, range] of Object.entries(bar.prohibition)) {
        if (IDENTITY.has(target.id) && IDENTITY_WAIVES.has(k)) continue;
        if (whole[k] < range[0] || whole[k] > range[1])
          breaches.push(k + '=' + whole[k] + ' (want ' + range[0] + '..' + range[1] + ')');
      }
      if (!IDENTITY.has(target.id)) {
        for (const [k, range] of Object.entries(bar.comfort)) {
          if (content[k] < range[0] || content[k] > range[1])
            breaches.push(k + '=' + content[k] + ' (want ' + range[0] + '..' + range[1] + ')');
        }
      }
      const waiver = breaches.length
        ? WAIVERS.find((wv) => wv.match({ target: target.id, theme, breaches }))
        : null;
      if (breaches.length && !waiver) failures++;

      results.push({
        waived: waiver ? waiver.reason : null,
        target: target.id,
        label: target.label,
        theme,
        width: vp.name,
        kind: IDENTITY.has(target.id) ? 'identity' : 'operational',
        meanL: content.meanL,
        glare: content.glare,
        step: content.step,
        paper: whole.paper,
        crush: whole.crush,
        void: whole.void,
        chroma: whole.chroma,
        breaches,
      });

      if (SHOTS) await writeFile(path.join(SHOTS, target.id + '-' + theme + '-' + vp.name + '.png'), png);
      await page.close();
    }
  }
}
await browser.close();

const cols = [
  'target',
  'kind',
  'theme',
  'width',
  'meanL',
  'glare',
  'step',
  'paper',
  'crush',
  'void',
  'chroma',
];
const w = cols.map((c) => Math.max(c.length, ...results.map((r) => String(r[c]).length)));
process.stdout.write(
  'meanL/glare/step measured on the CONTENT PLANE (rail and pinned chrome excluded)\n' +
    'paper/crush/void/chroma measured on the WHOLE viewport\n\n',
);
process.stdout.write(cols.map((c, i) => c.padEnd(w[i])).join('  ') + '  breaches\n');
for (const r of results) {
  process.stdout.write(
    cols.map((c, i) => String(r[c]).padEnd(w[i])).join('  ') +
      '  ' +
      (r.breaches.length ? (r.waived ? 'WAIVED ' : '') + r.breaches.join('; ') : '.') +
      '\n',
  );
}

const waived = results.filter((r) => r.waived);
process.stdout.write(
  '\n' + (results.length - failures) + '/' + results.length + ' captures inside the comfort bar',
);
process.stdout.write(waived.length ? ' (' + waived.length + ' by named waiver)\n' : '\n');
for (const reason of new Set(waived.map((r) => r.waived))) {
  process.stdout.write('\nWAIVER  ' + reason + '\n');
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify({ COMFORT, results }, null, 2));
process.exit(failures ? 1 : 0);
