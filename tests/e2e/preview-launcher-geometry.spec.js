import { expect, test } from '@playwright/test';

/**
 * RECOVERY-02 §8 regression guard for the viewport-edge defect.
 *
 * The reported symptom — a clipped oxblood/white sliver at the viewport edge —
 * did NOT reproduce on this branch at any width. What DID reproduce is the
 * adjacent defect §9 asks about: the launcher sat at `bottom: 1rem` with a 44px
 * box, i.e. 16–60px from the bottom edge, directly over the authenticated
 * shell's mobile dock, which occupies 0–60px at `z-index: 10`. The launcher's
 * `z-index: 100` meant it won over the navigation it was covering.
 *
 * These assertions fail on both: the geometry cases catch a re-introduced
 * clip, and the dock case catches a re-introduced overlap.
 */

const VERSION = '**/api/version';

function stubVersion(page) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, correlationId: 'geometry', playground: true }),
    }),
  );
}

function stubFeeds(page) {
  return page.route('**/api/**', (route) =>
    route.request().url().includes('/api/version')
      ? route.fallback()
      : route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: [] }),
        }),
  );
}

/* §8 names 320/375/390/414/768. 640 is added because it is the CSS-pixel
 * viewport of a 1280 screen at 200% zoom, which §15 requires to reflow. */
const WIDTHS = [320, 375, 390, 414, 640, 768];

for (const width of WIDTHS) {
  test(`preview launcher stays inside the viewport and keeps a 44px target at ${width}px`, async ({
    page,
  }) => {
    await stubVersion(page);
    await stubFeeds(page);
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');

    const launcher = page.locator('[data-preview-index-launcher]');
    await expect(launcher).toBeVisible();

    const box = await launcher.boundingBox();
    expect(box, 'launcher must have a layout box').not.toBeNull();

    // Fully inside the viewport — the edge-clipping regression.
    expect(box.x, `launcher.left must not be negative at ${width}px`).toBeGreaterThanOrEqual(0);
    expect(
      box.x + box.width,
      `launcher.right must not exceed the viewport at ${width}px`,
    ).toBeLessThanOrEqual(width + 0.5);
    expect(box.y, `launcher.top must not be negative at ${width}px`).toBeGreaterThanOrEqual(0);

    // Usable target, not a sliver.
    expect(box.width, `launcher must stay a usable width at ${width}px`).toBeGreaterThanOrEqual(44);
    expect(box.height, `launcher must meet the 44px target at ${width}px`).toBeGreaterThanOrEqual(44);

    // The label must not be clipped by its own box.
    const clipped = await launcher.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
    );
    expect(clipped, `launcher label must not be clipped at ${width}px`).toBe(false);

    // Nothing may sit on top of it — it has to be the hit target at its centre.
    const hit = await launcher.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top === el || el.contains(top);
    });
    expect(hit, `launcher must be the topmost element at its centre at ${width}px`).toBe(true);

    // Reachable and visibly focusable by keyboard.
    await launcher.focus();
    await expect(launcher).toBeFocused();
    const outline = await launcher.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.outlineStyle}|${s.outlineWidth}`;
    });
    expect(outline, `launcher must show a focus ring at ${width}px`).not.toContain('none|');
  });
}

test('preview launcher clears the authenticated mobile dock rather than covering it', async ({
  page,
}) => {
  await stubVersion(page);
  await stubFeeds(page);
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto('/');

  const launcher = page.locator('[data-preview-index-launcher]');
  await expect(launcher).toBeVisible();

  // The dock renders below `lg`; assert the launcher sits clear of that band
  // whether or not an authenticated shell happens to be mounted on this route.
  const DOCK_BAND = 60;
  const box = await launcher.boundingBox();
  const viewportHeight = page.viewportSize().height;
  expect(
    viewportHeight - (box.y + box.height),
    'launcher must sit above the 60px mobile dock band',
  ).toBeGreaterThanOrEqual(DOCK_BAND);
});
