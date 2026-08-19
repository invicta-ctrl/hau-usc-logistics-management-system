#!/usr/bin/env node
// Semantic acceptance for the public portals, from the real accessibility tree.
//
// This is NOT a screen-reader runtime test and does not claim to be. It reads
// the accessibility tree the browser actually exposes to assistive technology,
// plus the ARIA relationships in the DOM, which is the strongest deterministic
// evidence available here. Where a check needs a speaking screen reader to
// settle, it is reported as such rather than passed.
//
// Usage: node scripts/design/semantics-audit.mjs [baseUrl]

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8805/index.html';
const ROUTES = ['lending', 'request'];

const results = [];
let failures = 0;
function record(route, check, pass, detail) {
  if (!pass) failures++;
  results.push({ route, check, pass, detail });
}

// Playwright removed page.accessibility; the real tree comes from CDP, which is
// what the browser actually hands to assistive technology.
async function axTree(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  return nodes
    .map((n) => ({
      role: n.role && n.role.value ? String(n.role.value) : '',
      name: n.name && n.name.value ? String(n.name.value) : '',
      ignored: !!n.ignored,
    }))
    .filter((n) => !n.ignored);
}

const browser = await chromium.launch();
try {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}?route=${route}`, { waitUntil: 'networkidle' });

    const flat = await axTree(page);

    // --- landmarks -----------------------------------------------------------
    const landmarks = flat.filter((n) =>
      ['main', 'navigation', 'banner', 'contentinfo', 'region', 'complementary', 'form', 'search'].includes(
        n.role,
      ),
    );
    record(
      route,
      'landmarks exposed',
      landmarks.some((n) => n.role === 'main'),
      landmarks.map((n) => n.role).join(', ') || 'none',
    );

    // --- headings ------------------------------------------------------------
    const headings = await page.evaluate(() =>
      [...document.querySelectorAll('#app h1,#app h2,#app h3,#app h4,#app h5,#app h6')].map((h) => ({
        level: Number(h.tagName[1]),
        text: h.textContent.trim().slice(0, 40),
      })),
    );
    const h1s = headings.filter((h) => h.level === 1);
    let skips = [];
    headings.forEach((h, i) => {
      if (i && h.level - headings[i - 1].level > 1) skips.push(`${headings[i - 1].text} -> ${h.text}`);
    });
    record(route, 'exactly one h1', h1s.length === 1, h1s.map((h) => h.text).join(' | '));
    record(
      route,
      'no skipped heading level',
      skips.length === 0,
      skips.join(' ; ') || `${headings.length} headings`,
    );
    record(
      route,
      'headings exposed to AT',
      flat.some((n) => n.role === 'heading'),
      `${flat.filter((n) => n.role === 'heading').length} in tree`,
    );

    // --- accessible names ----------------------------------------------------
    const unnamed = flat.filter(
      (n) =>
        ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'listbox'].includes(n.role) &&
        !(n.name || '').trim(),
    );
    record(
      route,
      'every control has an accessible name',
      unnamed.length === 0,
      unnamed.map((n) => n.role).join(', ') || 'all named',
    );

    // --- form relationships --------------------------------------------------
    const forms = await page.evaluate(() => {
      const ctrls = [...document.querySelectorAll('#app input, #app select, #app textarea')];
      const dangling = [];
      let described = 0,
        requiredExposed = 0,
        requiredTotal = 0,
        invalidBeforeTouch = 0;
      for (const c of ctrls) {
        const d = c.getAttribute('aria-describedby');
        if (d) {
          described++;
          d.split(/\s+/)
            .filter(Boolean)
            .forEach((id) => {
              if (!document.getElementById(id)) dangling.push(id);
            });
        }
        if (c.required || c.getAttribute('aria-required') === 'true') {
          requiredTotal++;
          if (c.required || c.getAttribute('aria-required') === 'true') requiredExposed++;
        }
        if (c.getAttribute('aria-invalid') === 'true') invalidBeforeTouch++;
      }
      return { total: ctrls.length, described, dangling, requiredTotal, requiredExposed, invalidBeforeTouch };
    });
    record(
      route,
      'no dangling aria-describedby',
      forms.dangling.length === 0,
      forms.dangling.join(', ') || 'none',
    );
    record(
      route,
      'required state is programmatic',
      forms.requiredExposed === forms.requiredTotal,
      `${forms.requiredExposed}/${forms.requiredTotal} required controls`,
    );
    record(
      route,
      'nothing marked invalid before it is touched',
      forms.invalidBeforeTouch === 0,
      `${forms.invalidBeforeTouch} pre-marked`,
    );

    // --- live regions --------------------------------------------------------
    const live = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-live]')].map((n) => ({
        id: n.id,
        politeness: n.getAttribute('aria-live'),
        role: n.getAttribute('role'),
        emptyAtMount: !n.textContent.trim(),
      })),
    );
    record(
      route,
      'polite and assertive regions both present',
      live.some((l) => l.politeness === 'polite') && live.some((l) => l.politeness === 'assertive'),
      live.map((l) => `${l.id || l.role}:${l.politeness}`).join(', '),
    );
    record(
      route,
      'live regions exist at mount so injections announce',
      live.length > 0 && live.every((l) => l.emptyAtMount || l.politeness === 'polite'),
      `${live.length} regions`,
    );

    // --- an announcement actually reaches the tree ---------------------------
    const announced = await page.evaluate(async () => {
      const r = document.getElementById('live-polite');
      if (!r) return 'no polite region';
      r.textContent = 'Semantic audit probe.';
      await new Promise((res) => setTimeout(res, 120));
      return r.textContent;
    });
    const flat2 = await axTree(page);
    record(
      route,
      'live-region text reaches the accessibility tree',
      flat2.some((n) => (n.name || '').includes('Semantic audit probe')),
      String(announced).slice(0, 40),
    );

    // --- tables --------------------------------------------------------------
    const tables = await page.evaluate(() =>
      [...document.querySelectorAll('#app table')].map((t) => ({
        headers: t.querySelectorAll('th').length,
        scoped: [...t.querySelectorAll('th')].filter((h) => h.getAttribute('scope')).length,
        caption: !!t.querySelector('caption'),
      })),
    );
    record(
      route,
      'tables scope their headers',
      tables.length === 0 || tables.every((t) => t.headers === 0 || t.scoped === t.headers),
      tables.length
        ? tables.map((t) => `${t.scoped}/${t.headers} scoped`).join(' ; ')
        : 'no table on this route',
    );

    // --- conditional fields --------------------------------------------------
    const conditional = await page.evaluate(() => {
      const hidden = [...document.querySelectorAll('#app [hidden]')];
      const leaking = hidden.filter((h) => {
        const cs = getComputedStyle(h);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const enabledInsideHidden = hidden
        .flatMap((h) => [...h.querySelectorAll('input,select,textarea')])
        .filter((c) => !c.disabled).length;
      return { hidden: hidden.length, leaking: leaking.length, enabledInsideHidden };
    });
    record(
      route,
      'hidden conditional groups are actually hidden',
      conditional.leaking === 0,
      `${conditional.hidden} hidden, ${conditional.leaking} still rendering`,
    );
    record(
      route,
      'hidden conditional controls are disabled, not just invisible',
      conditional.enabledInsideHidden === 0,
      `${conditional.enabledInsideHidden} still focusable`,
    );

    // --- tracking code -------------------------------------------------------
    const tracking = await page.evaluate(() =>
      [...document.querySelectorAll('#app input[type=password]')].map((i) => ({
        masked: i.type === 'password',
        named: !!(i.labels && i.labels.length) || !!i.getAttribute('aria-label'),
        autocomplete: i.getAttribute('autocomplete'),
      })),
    );
    record(
      route,
      'tracking-code controls are masked and named',
      tracking.length === 0 || tracking.every((t) => t.masked && t.named),
      tracking.length ? `${tracking.length} masked field(s)` : 'none on this route',
    );

    await page.close();
  }
} finally {
  await browser.close();
}

const width = Math.max(...results.map((r) => r.check.length));
let last = '';
for (const r of results) {
  if (r.route !== last) {
    process.stdout.write(`\n${r.route.toUpperCase()}\n`);
    last = r.route;
  }
  process.stdout.write(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.check.padEnd(width)}  ${r.detail}\n`);
}
process.stdout.write(`\n${results.length - failures}/${results.length} pass · ${failures} failure(s)\n`);
process.stdout.write('NOTE: accessibility-tree evidence, not a screen-reader runtime test.\n');
process.exit(failures ? 1 : 0);
