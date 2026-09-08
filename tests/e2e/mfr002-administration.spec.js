import { expect, test } from '@playwright/test';
import { navigateAuthenticatedRoute } from './navigation.js';

function expectStrictModeBoundedRead(count) {
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(2);
}

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
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
    const query = JSON.parse(route.request().postData() || '{}').query || '';
    state.accountQueries ??= [];
    state.accountQueries.push(query);
    if (query && state.failNextAccountSearchStatus) {
      const status = state.failNextAccountSearchStatus;
      state.failNextAccountSearchStatus = null;
      return fulfill(route, { code: 'DIRECTORY_UNAVAILABLE', message: 'Synthetic authorized directory search failure.' }, status);
    }
    if (state.failNextResetRefresh) {
      state.failNextResetRefresh = false;
      return fulfill(route, { code: 'DIRECTORY_UNAVAILABLE', message: 'Synthetic current directory failure.' }, 503);
    }
    const items = query === 'DOL_2026'
      ? [{
          accountId: 'ACC-DOL-2026-NOT-RENDERED',
          revision: 'REV-DOL-2026-NOT-RENDERED',
          accessId: 'DOL_2026',
          displayName: 'Department of Logistics',
          roleId: 'REQUESTER',
          status: 'ACTIVE',
          firstLoginPending: false,
          locked: false,
        }]
      : [
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
        ];
    return fulfill(route, {
      ok: true,
      pagination: { page: 1, pageSize: 25, total: items.length, totalPages: 1 },
      items,
    });
  });
  await page.route('**/api/admin/access/reset-password', (route) => {
    const command = JSON.parse(route.request().postData() || '{}');
    state.resetCommands ??= [];
    state.resetCommands.push(command);
    if (state.unknownFirstReset) {
      state.unknownFirstReset = false;
      return fulfill(route, { code: 'RESET_UNAVAILABLE', message: 'Synthetic unconfirmed reset.' }, 503);
    }
    state.failNextResetRefresh = true;
    return fulfill(route, {
      reset: true,
      status: 'STARTER',
      sessionsRevoked: true,
      replayed: false,
      accountId: command.accountId,
      revision: 'REV-RESET-REFRESHED',
      correlationId: 'COR-RESET-U08',
      credential: {
        accessId: command.currentAccessId,
        temporaryPassword: 'synthetic-one-time-value',
        generatedAt: '2026-09-08T00:00:00.000Z',
        status: 'STARTER',
      },
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

test('MFR-002 U08 explicitly searches the authorized directory before selecting an account outside its loaded page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'One responsive search proof is sufficient.');
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0 };
  await installAdministrationRuntime(page, state);
  await signInAndOpenAdministration(page);

  const workspace = page.locator('[data-fi10-administration="true"]');
  const search = workspace.getByRole('form', { name: 'Search authorized account directory' });
  await search.getByLabel('Search authorized account directory').fill('  DOL_2026  ');
  await search.getByRole('button', { name: 'Search authorized directory' }).click();
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(1);
  await expect(workspace).toContainText('Department of Logistics');
  expect(state.accountQueries).toContain('DOL_2026');
  await workspace.getByRole('button', { name: /DOL_2026/u }).click();
  await expect(workspace.getByRole('dialog')).toContainText('Department of Logistics');
  await expect(page.locator('body')).not.toContainText('ACC-DOL-2026-NOT-RENDERED');
  await expect(page.locator('body')).not.toContainText('REV-DOL-2026-NOT-RENDERED');
});

test('MFR-002 U08 keeps loaded account records available when an authorized directory search fails', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'One responsive search failure proof is sufficient.');
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0, failNextAccountSearchStatus: 503 };
  await installAdministrationRuntime(page, state);
  await signInAndOpenAdministration(page);

  const workspace = page.locator('[data-fi10-administration="true"]');
  const search = workspace.getByRole('form', { name: 'Search authorized account directory' });
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(2);
  await search.getByLabel('Search authorized account directory').fill('DOL_2026');
  await search.getByRole('button', { name: 'Search authorized directory' }).click();
  await expect(workspace.getByRole('alert')).toContainText('could not be completed');
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(2);
  await expect(search.getByLabel('Search authorized account directory')).toHaveValue('DOL_2026');
  await expect(search.getByRole('button', { name: 'Search authorized directory' })).toBeEnabled();

  await search.getByRole('button', { name: 'Search authorized directory' }).click();
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(1);
  await expect(workspace).toContainText('Department of Logistics');
});

test('MFR-002 U08 fails closed when an explicit directory search is forbidden', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'One responsive authorization proof is sufficient.');
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0, failNextAccountSearchStatus: 403 };
  await installAdministrationRuntime(page, state);
  await signInAndOpenAdministration(page);

  const workspace = page.locator('[data-fi10-administration="true"]');
  const search = workspace.getByRole('form', { name: 'Search authorized account directory' });
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(2);
  await search.getByLabel('Search authorized account directory').fill('DOL_2026');
  await search.getByRole('button', { name: 'Search authorized directory' }).click();
  await expect(page.getByRole('heading', { name: 'Access administration is not available to your account' })).toBeVisible();
  await expect(workspace.locator('[data-administration-account-record]')).toHaveCount(0);
  await selectAdministrationTab(page, 'Staff directory');
  await expect(page.getByRole('heading', { name: 'Access administration is not available to your account' })).toBeVisible();
  await expect(workspace.locator('[data-administration-staff-open]')).toHaveCount(0);
});

test('MFR-002 U08 keeps a temporary-password reset immutable until its current directory refreshes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-390', 'The focused reset-state proof runs once at the mobile target.');
  const state = { accountCalls: 0, directoryCalls: 0, activityCalls: 0, unknownFirstReset: true };
  await installAdministrationRuntime(page, state);
  await signInAndOpenAdministration(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await expect.poll(() => page.evaluate(() => window.matchMedia('(max-width: 59.99rem)').matches)).toBe(true);

  const workspace = page.locator('[data-fi10-administration="true"]');
  await workspace.locator('[data-administration-account-open]').first().click();
  const inspector = workspace.getByRole('dialog');
  const resetForm = inspector.getByRole('form', { name: 'Reset selected account temporary password' });
  await expect(resetForm).toBeVisible();
  await resetForm.getByLabel('Current access ID', { exact: true }).fill('ADMIN.U08');
  await resetForm.getByLabel('Confirm current access ID', { exact: true }).fill('ADMIN.U08');
  await resetForm.getByLabel('Reset reason').fill('Recover the governed administrator test credential.');
  await resetForm.getByRole('button', { name: 'Reset selected account password' }).click();

  await expect(inspector.getByRole('status')).toContainText('did not confirm this reset');
  await expect(inspector.getByRole('button', { name: 'Back to records' })).toBeDisabled();
  await expect(workspace.locator('[data-administration-account-open]').nth(1)).toBeDisabled();
  await expect(workspace.getByLabel('Administration section', { exact: true })).toBeDisabled();
  await inspector.getByRole('button', { name: 'Retry captured reset' }).click();
  await expect(inspector.getByText(/reset was recorded, but the current account directory could not be refreshed/u)).toBeVisible();
  expect(state.resetCommands).toHaveLength(2);
  expect(state.resetCommands[1]).toEqual(state.resetCommands[0]);
  await expect(workspace.locator('[data-administration-account-open]').nth(1)).toBeDisabled();
  await inspector.getByRole('button', { name: 'Clear credential' }).click();
  await expect(inspector.getByLabel('One-time temporary credential')).toHaveCount(0);
  await expect(inspector.getByRole('button', { name: 'Reload current account directory' })).toBeVisible();
  await expect(inspector.getByRole('button', { name: 'Back to records' })).toBeDisabled();
  await inspector.getByRole('button', { name: 'Reload current account directory' }).click();
  await expect(inspector.getByText('The current account directory was refreshed after the reset.', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: 'Dismiss reset result' }).click();
  await expect(resetForm).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});
