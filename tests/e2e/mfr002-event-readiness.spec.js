import { expect, test } from '@playwright/test';

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function rawEvents({ partial = false } = {}) {
  return {
    ok: true,
    eventSeries: [{ id: 'SER-U08', name: 'Council assembly', code: 'ASSEMBLY-2026', status: 'ACTIVE' }],
    eventDays: partial
      ? []
      : [
          {
            id: 'DAY-U08',
            seriesId: 'SER-U08',
            name: 'Opening day',
            date: '2026-09-01',
            status: 'SCHEDULED',
          },
        ],
    activities: partial
      ? []
      : [
          {
            id: 'ACT-U08',
            eventDayId: 'DAY-U08',
            name: 'Opening session logistics',
            activityType: 'PLENARY',
            timeStatus: 'ON_TIME',
            status: 'SCHEDULED',
          },
        ],
  };
}

async function installEventRuntime(
  page,
  state,
  { allowed = true, partial = false, unavailable = false } = {},
) {
  await page.route('**/api/auth/session', (route) =>
    fulfill(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401),
  );
  await page.route('**/api/public/advertisements', (route) => fulfill(route, { ok: true, items: [] }));
  await page.route('**/api/auth/login', (route) =>
    fulfill(route, {
      state: 'AUTHENTICATED',
      csrfToken: 'csrf-event-u08',
      user: {
        accountId: 'ACC-EVENT-U08',
        displayName: 'U08 Event Operator',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'DOL_STAFF',
          capabilities: ['view.internal', ...(allowed ? ['event.manage'] : [])],
        },
      },
    }),
  );
  await page.route('**/api/me/appearance', (route) =>
    fulfill(route, { ok: true, appearance: { family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' } }),
  );
  await page.route('**/api/bootstrap/overview?**', (route) =>
    fulfill(route, {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'overview',
      scopeRevision: { token: 'overview-event-u08', updatedAt: '2026-08-31T10:00:00.000Z' },
      pagination: { page: 1, pageSize: 25, total: 0, hasMore: false },
      data: {
        eventSeries: [],
        eventDays: [],
        events: [],
        requests: [],
        requestLines: [],
        inventoryItems: [],
        lendingTickets: [],
        restockRequests: [],
        deliverables: [],
      },
    }),
  );
  await page.route('**/api/getEventManagement', (route) => {
    state.eventCalls += 1;
    return unavailable
      ? fulfill(route, { error: { code: 'EVENTS_UNAVAILABLE' } }, 503)
      : fulfill(route, rawEvents({ partial }));
  });
}

async function signInAndOpenEvents(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('u08.events');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.locator('a[aria-label="Events"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Event logistics readiness', exact: true })).toBeVisible();
}

test('MFR-002 U08 leads Events with one responsive activity readiness report', async ({ page }) => {
  const state = { eventCalls: 0 };
  await installEventRuntime(page, state);
  await signInAndOpenEvents(page);

  const workspace = page.locator('[data-fi11-events="true"]');
  await expect(workspace.getByRole('heading', { name: 'Activity logistics readiness' })).toBeVisible();
  await expect(workspace.getByText('Opening session logistics')).toBeVisible();
  await expect(workspace.getByText('Council assembly · 2026-09-01')).toBeVisible();
  await expect(workspace.getByText('Plenary', { exact: true })).toBeVisible();
  await expect(workspace.getByText('On Time', { exact: true })).toBeVisible();
  await expect(workspace.locator('table')).toHaveCount(0);
  await expect(workspace.locator('[role="dialog"]')).toHaveCount(0);

  const context = workspace.locator('details');
  await expect(context).not.toHaveAttribute('open', '');
  await context.locator('summary').click();
  await expect(workspace.getByRole('heading', { name: 'Series', exact: true })).toBeVisible();
  await expect(workspace.getByRole('heading', { name: 'Days', exact: true })).toBeVisible();
  await expect(workspace.getByText('Opening day', { exact: true })).toBeVisible();
  expect(state.eventCalls).toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('MFR-002 U08 keeps independently empty event collections truthful', async ({ page }, testInfo) => {
  test.skip(
    !['frontend-390', 'frontend-1440'].includes(testInfo.project.name),
    'One mobile and one desktop partial-response proof are sufficient.',
  );
  const state = { eventCalls: 0 };
  await installEventRuntime(page, state, { partial: true });
  await signInAndOpenEvents(page);

  await expect(
    page.getByText('No activity logistics reports are loaded in this bounded view.'),
  ).toBeVisible();
  const context = page.locator('[data-fi11-events="true"] details');
  await context.locator('summary').click();
  await expect(page.getByText('Council assembly', { exact: true })).toBeVisible();
  await expect(page.getByText('No event days are loaded in this bounded view.')).toBeVisible();
  await expect(page.getByText('Nothing was inferred from another event collection.')).toHaveCount(2);
});

test('MFR-002 U08 denies Events before protected traffic without event.manage', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'One denial proof is sufficient.');
  const state = { eventCalls: 0 };
  await installEventRuntime(page, state, { allowed: false });
  await signInAndOpenEvents(page);

  await expect(page.getByRole('alert')).toContainText('unavailable to this account');
  expect(state.eventCalls).toBe(0);
});

test('MFR-002 U08 exposes bounded retry when the event service is unavailable', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-1440', 'One unavailable/retry proof is sufficient.');
  const state = { eventCalls: 0 };
  await installEventRuntime(page, state, { unavailable: true });
  await signInAndOpenEvents(page);

  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.getByRole('button', { name: 'Retry read-only load' }).click();
  await expect.poll(() => state.eventCalls).toBe(2);
});
