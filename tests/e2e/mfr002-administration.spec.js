import { expect, test } from '@playwright/test';
import { navigateAuthenticatedRoute } from './navigation.js';

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function expectStrictModeBoundedRead(count) {
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(2);
}

async function installAdministrationRuntime(page, state, { directoryUnavailable = false } = {}) {
  await page.route('**/api/auth/session', (route) =>
    fulfill(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401),
  );
  await page.route('**/api/public/advertisements', (route) => fulfill(route, { ok: true, items: [] }));
  await page.route('**/api/auth/login', (route) =>
    fulfill(route, {
      state: 'AUTHENTICATED',
      csrfToken: 'csrf-administration-u08',
      user: {
        accountId: 'ACC-ADMIN-U08',
        displayName: 'U08 Administrator',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'SYSTEM_ADMIN',
          capabilities: ['view.internal', 'access.admin'],
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
      scopeRevision: { token: 'overview-admin-u08', updatedAt: '2026-08-31T10:00:00.000Z' },
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
  await page.route('**/api/admin/access/directory', (route) => {
    state.accountCalls += 1;
    return fulfill(route, {
      ok: true,
      pagination: { page: 1, pageSize: 25, total: 2, totalPages: 1 },
      items: [
        {
          accountId: 'ACC-RAW-NOT-RENDERED',
          revision: 'REV-NOT-RENDERED',
          accessId: 'ADMIN.U08',
          displayName: 'Authorized administrator',
          roleId: 'SYSTEM_ADMIN',
          status: 'ACTIVE',
          firstLoginPending: false,
          locked: false,
        },
        {
          accountId: 'ACC-PENDING-NOT-RENDERED',
          revision: 'REV-PENDING-NOT-RENDERED',
          accessId: 'OPS.PENDING',
          displayName: 'Pending operator',
          roleId: 'DOL_STAFF',
          status: 'ACTIVE',
          firstLoginPending: true,
          locked: false,
        },
      ],
    });
  });
  await page.route('**/api/admin/staff-directory', (route) => {
    state.directoryCalls += 1;
    if (directoryUnavailable) return fulfill(route, { error: { code: 'UNAVAILABLE' } }, 503);
    return fulfill(route, {
      ok: true,
      page: 1,
      pageSize: 25,
      query: '',
      total: 1,
      items: [
        {
          personId: 'PER-U08-OPAQUE-NEVER-RENDER',
          displayName: 'Authorized staff member',
          accessId: 'OPS.RECEIVING',
          linkState: 'ACTIVE',
          emailState: 'ACTIVE_VERIFIED',
          assignmentSummary: {
            activeCount: 2,
            historicalCount: 1,
            quarantinedCount: 0,
            provenanceState: 'PRESENT',
          },
        },
      ],
    });
  });
  await page.route('**/api/admin/staff-account-activity-history', (route) => {
    state.activityCalls += 1;
    return fulfill(route, {
      ok: true,
      personId: 'PER-U08-OPAQUE-NEVER-RENDER',
      historyStartsAt: '2026-08-01T00:00:00.000Z',
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
      items: [
        {
          id: 'EVENT-RAW-NOT-RENDERED',
          occurredAt: '2026-08-31T09:30:00.000Z',
          eventType: 'ACCOUNT_STAFF_LINK',
          actionCode: 'LINK_CREATED',
          accountId: 'ACC-RAW-NOT-RENDERED',
          accountAccessIdSnapshot: 'SNAPSHOT-NOT-RENDERED',
          correlationId: 'CORRELATION-NOT-RENDERED',
          linkState: 'ACTIVE',
          previousLinkState: 'UNLINKED',
          assignmentState: null,
          previousAssignmentState: null,
          oldEffectiveFrom: null,
          oldEffectiveTo: null,
          newEffectiveFrom: '2026-08-31T00:00:00.000Z',
          newEffectiveTo: null,
        },
      ],
    });
  });
}

async function signInAndOpenAdministration(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('admin.u08');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await navigateAuthenticatedRoute(page, 'Administration');
  await expect(page.getByRole('heading', { name: 'Authorized records and system boundaries' })).toBeVisible();
}

async function selectAdministrationTab(page, label) {
  const workspace = page.locator('[data-fi10-administration="true"]');
  const button = workspace.getByRole('button', { name: label, exact: true });
  if (await button.isVisible()) {
    await button.click();
  } else {
    await workspace.getByLabel('Administration section', { exact: true }).selectOption(label);
  }
}

test('MFR-002 U08 provides one protected responsive Administration master/detail journey', async ({
  page,
}, testInfo) => {
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0 };
  await installAdministrationRuntime(page, state);
  await signInAndOpenAdministration(page);

  const workspace = page.locator('[data-fi10-administration="true"]');
  await expect(workspace.getByRole('button', { name: 'Reference administration' })).toHaveCount(0);
  await expect(workspace.getByRole('button', { name: 'System status' })).toHaveCount(0);
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(2);
  await workspace.getByLabel('Search this loaded page').fill('pending');
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(1);
  await expect(workspace).toContainText('1 of 2 loaded records shown');
  await workspace.getByLabel('Search this loaded page').fill('no-match');
  await expect(workspace.getByRole('heading', { name: 'No loaded records match this search' })).toBeVisible();
  await workspace.getByRole('button', { name: 'Clear page search' }).click();

  await workspace.locator('[data-administration-account-open]').first().click();
  const mobile = ['frontend-320', 'frontend-390', 'frontend-768'].includes(testInfo.project.name);
  if (mobile) {
    const dialog = workspace.getByRole('dialog');
    await expect(dialog).toContainText('Authorized administrator');
    await dialog.getByRole('button', { name: 'Back to records' }).click();
    await expect(workspace.getByRole('dialog')).toHaveCount(0);
  } else {
    await expect(workspace.getByRole('complementary')).toContainText('Authorized administrator');
  }

  await selectAdministrationTab(page, 'Staff directory');
  await workspace.locator('[data-administration-staff-open]').first().click();
  const inspector = mobile ? workspace.getByRole('dialog') : workspace.getByRole('complementary');
  await expect(inspector).toContainText('Authorized staff member');
  await expect(inspector).toContainText('Active Verified');
  await expect(page.locator('body')).not.toContainText('PER-U08-OPAQUE-NEVER-RENDER');
  await inspector.getByRole('button', { name: 'Review retained activity' }).click();
  await expect(workspace.locator('[data-fi10-activity="true"]')).toBeVisible();
  await expect(workspace.getByText('Link Created', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('CORRELATION-NOT-RENDERED');

  expectStrictModeBoundedRead(state.accountCalls);
  expectStrictModeBoundedRead(state.directoryCalls);
  expectStrictModeBoundedRead(state.activityCalls);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('MFR-002 U08 keeps Accounts usable when the Staff source is unavailable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'One independent-source proof is sufficient.');
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0 };
  await installAdministrationRuntime(page, state, { directoryUnavailable: true });
  await signInAndOpenAdministration(page);

  await expect(page.locator('[data-administration-account-record]')).toHaveCount(2);
  await selectAdministrationTab(page, 'Staff directory');
  await expect(
    page.getByRole('heading', { name: 'Administration records are temporarily unavailable' }),
  ).toBeVisible();
  await selectAdministrationTab(page, 'Accounts & access');
  await expect(page.locator('[data-administration-account-record]')).toHaveCount(2);
  expectStrictModeBoundedRead(state.accountCalls);
  expectStrictModeBoundedRead(state.directoryCalls);
});
