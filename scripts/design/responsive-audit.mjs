#!/usr/bin/env node
// Responsive matrix and paint-cost audit for the design prototypes.
//
// Two things that are usually checked separately, together here because they
// fail together: the fix for a narrow-width overflow is often another layer,
// and the fix for a slow layer is often to drop it at narrow widths. Measuring
// them in one pass makes that trade visible instead of accidental.
//
// RESPONSIVE, per width:
//   overflow        any element extending past the document width
//   clipped         a glass pane wider than its container
//   navReachable    primary navigation present and focusable
//   hiddenActions   a control that is visible but not operable, or the reverse
//   tapTargets      interactive boxes under the 44x44 practical target
//
// PAINT COST, per width:
//   blurLayers      elements carrying a backdrop-filter
//   blurArea        their combined area as a share of the viewport
//   nestedBlur      a backdrop-filter inside another — the expensive mistake
//   maxBlur         the largest blur radius in play
//   shadowLayers    elements carrying a box-shadow
//   animating       elements with a running animation or transition on a
//                   filter/blur property, which forces per-frame recomposite
//
// Usage: node scripts/design/responsive-audit.mjs
// Exit 0 when every width passes, 1 otherwise.

import { chromium } from 'playwright';

const R3 = 'http://127.0.0.1:8805/public-portals-r3/index.html';
const V5 = 'http://127.0.0.1:8805/impeccable-whole-site-redesign-v5/index.html';

/* The eight widths the acceptance matrix names. 320 is the narrowest width
   WCAG 2.2 1.4.10 reflow implies; 1920 is the widest real desk. */
const WIDTHS = [320, 375, 390, 414, 768, 1024, 1440, 1920];

const TARGETS = [
  { id: 'public-lending', url: (t) => R3 + '?route=lending&theme=' + t },
  { id: 'public-request', url: (t) => R3 + '?route=request&theme=' + t },
  { id: 'overview', url: () => V5 + '#/admin.overview', v5: true },
  { id: 'inventory', url: () => V5 + '#/inventory.catalog', v5: true },
  { id: 'release', url: () => V5 + '#/release.desk', v5: true },
];

/* Paint budget. Not a browser limit — a design decision about how much of the
   screen may be a live backdrop sample at once. Mobile is stricter because a
   full-viewport backdrop-filter is the single most expensive thing a phone GPU
   is asked to do here. */
const BUDGET = {
  narrow: { blurLayers: 6, blurArea: 130, maxBlur: 16, nestedBlur: 0, animatingFilter: 0 },
  wide: { blurLayers: 14, blurArea: 260, maxBlur: 22, nestedBlur: 0, animatingFilter: 0 },
};

const browser = await chromium.launch();
const rows = [];
let failures = 0;

for (const target of TARGETS) {
  for (const theme of ['light', 'dark']) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(target.url(theme), { waitUntil: 'load', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      if (target.v5) {
        await page.click(`[data-act="theme"][data-v="${theme}"]`, { timeout: 5000 }).catch(() => {});
        /* v5 lays out from its own viewport control and a container query, not
           from the browser width — `.frame[data-viewport]` sets the container.
           Resizing the browser alone leaves it composing at desktop widths, so
           every narrow run reported a hundred overflowing elements that a
           reviewer would never see. Drive the control to match the width. */
        const mode = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
        await page.click(`[data-act="viewport"][data-v="${mode}"]`, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(150);

      const m = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const all = [...document.querySelectorAll('body *')];

        /* THE OVERFLOW TEST IS scrollWidth, NOT ELEMENT GEOMETRY.
           An earlier version flagged any element whose box fell outside the
           viewport, and reported 104 failures per narrow width on surfaces that
           do not scroll horizontally at all. Every one of them was the closed
           mobile navigation drawer, parked off-canvas at left:-326 waiting to
           slide in. Off-canvas is a technique, not a defect. What a user
           actually experiences as overflow is a horizontal scrollbar, and that
           is exactly what scrollWidth exceeding clientWidth means. */
        const scrollOverflow = Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        /* Kept as a secondary signal: content pushing past the RIGHT edge that
           no ancestor clips. This is what produces the scrollbar, so it names
           the culprit when scrollOverflow is non-zero. */
        const clipsOverflow = (n) => {
          for (let a = n; a; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (
              cs.overflowX === 'hidden' ||
              cs.overflowX === 'clip' ||
              cs.overflow === 'hidden' ||
              cs.overflow === 'clip'
            )
              return true;
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
          }
          return false;
        };
        const pastRight = all.filter((n) => {
          const r = n.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          if (getComputedStyle(n).position === 'fixed') return false;
          if (r.right <= docWidth + 1) return false;
          return !clipsOverflow(n);
        }).length;
        const overflow = scrollOverflow ? pastRight || 1 : 0;

        const glass = all.filter((n) => {
          const cs = getComputedStyle(n);
          return (
            (cs.backdropFilter && cs.backdropFilter !== 'none') ||
            (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')
          );
        });

        const clipped = glass.filter((n) => {
          const r = n.getBoundingClientRect();
          const p = n.parentElement;
          if (!p) return false;
          const pr = p.getBoundingClientRect();
          return r.width > pr.width + 2;
        }).length;

        let nestedBlur = 0;
        for (const n of glass) {
          for (let a = n.parentElement; a; a = a.parentElement) {
            if (glass.includes(a)) {
              nestedBlur++;
              break;
            }
          }
        }

        const radius = (n) => {
          const cs = getComputedStyle(n);
          const f = cs.backdropFilter || cs.webkitBackdropFilter || '';
          const m = f.match(/blur\(([\d.]+)px\)/u);
          return m ? parseFloat(m[1]) : 0;
        };
        const viewportArea = innerWidth * innerHeight;
        /* Intersection with the viewport, not the clamped dimensions. Clamping
           width and height independently counted a tall pane scrolled off
           screen as a full viewport of paint cost, which made a two-pane page
           look like a four-pane one. Only what is on screen is being composited. */
        const blurArea = glass.reduce((sum, n) => {
          const r = n.getBoundingClientRect();
          const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
          const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
          return sum + w * h;
        }, 0);

        const shadowLayers = all.filter((n) => {
          const s = getComputedStyle(n).boxShadow;
          return s && s !== 'none';
        }).length;

        const animatingFilter = all.filter((n) => {
          const cs = getComputedStyle(n);
          const props = (cs.transitionProperty || '') + ' ' + (cs.willChange || '');
          const named = /filter|backdrop/i.test(props);
          const running = cs.animationName && cs.animationName !== 'none';
          return named || (running && /filter|backdrop/i.test(cs.animationName));
        }).length;

        const nav = document.querySelector('nav, [role="navigation"], .rail, .portal-nav');
        let navReachable = false;
        if (nav) {
          const cs = getComputedStyle(nav);
          const r = nav.getBoundingClientRect();
          navReachable =
            cs.display !== 'none' &&
            cs.visibility !== 'hidden' &&
            r.width > 0 &&
            nav.querySelectorAll('a, button, [tabindex]').length > 0;
        }

        /* A control the keyboard can reach but the eye cannot see.
           The test has to be REAL focusability. Checking `tabIndex >= 0` and the
           element's own computed style is not that: a button inside a
           `display:none` container reports `display:inline-block` on itself and
           `tabIndex 0`, while the browser has already removed it from the tab
           order. That mistake reported the sticky-bar Review button and the
           closed drawer scrim as defects on every width, neither of which a
           keyboard ever reaches — which is why the real-keypress keyboard audit
           disagreed. `checkVisibility` asks the engine the same question the
           engine asks when building the tab ring. */
        const reachable = (n) =>
          !n.disabled &&
          n.tabIndex >= 0 &&
          !n.closest('[inert], [hidden], [aria-hidden="true"]') &&
          (n.checkVisibility ? n.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) : true);

        const hiddenActions = [...document.querySelectorAll('a, button, input, select, textarea')].filter(
          (n) => {
            if (n.closest('.sr-only')) return false;
            if (!reachable(n)) return false;
            const r = n.getBoundingClientRect();
            return r.width === 0 || r.height === 0;
          },
        ).length;

        const tapTargets = [
          ...document.querySelectorAll('a, button, input, select, textarea, [role="button"]'),
        ].filter((n) => {
          if (!reachable(n)) return false;
          const r = n.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          /* Inline links inside a paragraph are exempt under 2.5.8; the
               target-size rule is about standalone controls. */
          if (n.tagName === 'A' && n.closest('p, li, small')) return false;
          return r.width < 44 || r.height < 44;
        }).length;

        return {
          overflow,
          scrollOverflow,
          clipped,
          nestedBlur,
          navReachable,
          hiddenActions,
          tapTargets,
          blurLayers: glass.length,
          blurArea: Number(((blurArea / viewportArea) * 100).toFixed(0)),
          maxBlur: glass.reduce((mx, n) => Math.max(mx, radius(n)), 0),
          shadowLayers,
          animatingFilter,
        };
      });

      const budget = width < 768 ? BUDGET.narrow : BUDGET.wide;
      const breaches = [];
      if (m.overflow) breaches.push('overflow=' + m.overflow);
      if (m.clipped) breaches.push('clippedGlass=' + m.clipped);
      if (!m.navReachable) breaches.push('nav unreachable');
      if (m.hiddenActions) breaches.push('hiddenActions=' + m.hiddenActions);
      for (const [k, max] of Object.entries(budget)) {
        if (m[k] > max) breaches.push(k + '=' + m[k] + ' (max ' + max + ')');
      }
      if (breaches.length) failures++;
      rows.push({ target: target.id, theme, width, ...m, breaches });
      await page.close();
    }
  }
}
await browser.close();

const cols = [
  'target',
  'theme',
  'width',
  'scrollOverflow',
  'clipped',
  'blurLayers',
  'blurArea',
  'maxBlur',
  'nestedBlur',
  'shadowLayers',
  'tapTargets',
];
const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
process.stdout.write(cols.map((c, i) => c.padEnd(w[i])).join('  ') + '  breaches\n');
for (const r of rows) {
  process.stdout.write(
    cols.map((c, i) => String(r[c]).padEnd(w[i])).join('  ') +
      '  ' +
      (r.breaches.length ? r.breaches.join('; ') : '.') +
      '\n',
  );
}

const under = rows.filter((r) => r.tapTargets > 0);
process.stdout.write(
  '\n' + (rows.length - failures) + '/' + rows.length + ' width/theme/surface combinations pass\n',
);
process.stdout.write(
  'tapTargets is REPORTED, not gated: it counts standalone controls under 44x44, which the\n' +
    'project treats as a practical goal rather than an acceptance floor. ' +
    under.length +
    ' combinations carry at least one.\n',
);
process.exit(failures ? 1 : 0);
