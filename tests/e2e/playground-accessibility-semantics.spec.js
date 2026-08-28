import { expect, test } from '@playwright/test';

const ROUTES = [
  ['', 'landing'],
  ['#/route/tracking', 'tracking'],
  ['#/route/borrow', 'borrow'],
  ['#/route/staff-signin', 'staff sign-in'],
  ['#/__preview/index', 'Playground Index'],
  ['#/__preview/inspect/external-request', 'external request'],
  ['#/__preview/inspect/overview', 'overview'],
  ['#/__preview/inspect/inventory', 'inventory'],
  ['#/__preview/inspect/request-center', 'request center'],
  ['#/__preview/inspect/lending', 'lending'],
  ['#/__preview/inspect/release', 'release'],
  ['#/__preview/inspect/restocking', 'restocking'],
  ['#/__preview/inspect/procurement', 'procurement'],
  ['#/__preview/inspect/events', 'events'],
  ['#/__preview/inspect/administration', 'administration'],
  ['#/__preview/inspect/profile', 'profile'],
];

function installPlaygroundCapability(page) {
  return page.route('**/api/version', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, playground: true, correlationId: 'p20-semantics' }),
    }),
  );
}

function installEmptyPublicFeed(page) {
  return page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    }),
  );
}

async function visibleSemanticAudit(page) {
  return page.getByRole('main').first().evaluate((main) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const nameFrom = (element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const referenced = labelledBy
        ? labelledBy
            .split(/\s+/u)
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .filter(Boolean)
            .join(' ')
        : '';
      return (
        element.getAttribute('aria-label')?.trim() ||
        referenced ||
        element.getAttribute('title')?.trim() ||
        element.textContent?.trim() ||
        ''
      );
    };

    const headings = [...main.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter(visible)
      .map((element) => ({ level: Number(element.tagName.slice(1)), text: element.textContent?.trim() ?? '' }));
    const headingSkips = headings
      .slice(1)
      .filter((heading, index) => heading.level > headings[index].level + 1)
      .map((heading) => heading.text);
    const unlabeledFields = [...main.querySelectorAll('input,select,textarea')]
      .filter(visible)
      .filter((element) => element.getAttribute('type') !== 'hidden')
      .filter((element) => {
        const labels = 'labels' in element ? element.labels : null;
        return !labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
      })
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || '(no-id)'}`);
    const unnamedInteractive = [...main.querySelectorAll('button,a[href]')]
      .filter(visible)
      .filter((element) => !nameFrom(element))
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || '(no-id)'}`);
    const unscopedHeaders = [...main.querySelectorAll('th')]
      .filter(visible)
      .filter((element) => !element.getAttribute('scope'))
      .map((element) => element.textContent?.trim() || '(blank header)');
    const duplicateIds = [...main.querySelectorAll('[id]')]
      .map((element) => element.id)
      .filter((id, index, ids) => id && ids.indexOf(id) !== index);

    return {
      h1Count: headings.filter((heading) => heading.level === 1).length,
      firstHeading: headings[0] ?? null,
      headingSkips,
      unlabeledFields,
      unnamedInteractive,
      unscopedHeaders,
      duplicateIds: [...new Set(duplicateIds)],
    };
  });
}

test('P20 keeps every Playground workspace natively named and structurally coherent', async ({ page }, testInfo) => {
  test.skip(!['frontend-390', 'frontend-1440'].includes(testInfo.project.name), 'P20 samples mobile and desktop.');
  test.setTimeout(120_000);
  await installPlaygroundCapability(page);
  await installEmptyPublicFeed(page);

  for (const [hash, label] of ROUTES) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole('main').first(), `${label}: main landmark`).toBeVisible();
    const audit = await visibleSemanticAudit(page);
    expect(audit.h1Count, `${label}: one visible H1`).toBe(1);
    expect(audit.firstHeading?.level, `${label}: H1 starts the content hierarchy`).toBe(1);
    expect(audit.headingSkips, `${label}: logical heading hierarchy`).toEqual([]);
    expect(audit.unlabeledFields, `${label}: associated field labels`).toEqual([]);
    expect(audit.unnamedInteractive, `${label}: named controls and links`).toEqual([]);
    expect(audit.unscopedHeaders, `${label}: scoped table headers`).toEqual([]);
    expect(audit.duplicateIds, `${label}: unique document ids`).toEqual([]);
  }
});

test('P20 keeps critical landing actions reachable at a 200 percent desktop zoom equivalent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-1440', 'Desktop zoom-equivalent check only.');
  await installPlaygroundCapability(page);
  await installEmptyPublicFeed(page);
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Logistics services and records' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start a logistics request/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Browse public lending/ }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
