import { expect, test } from '@playwright/test';

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function installAuthenticatedRelease(page, state, { shrinkOnRecheck = false } = {}) {
  await page.route('**/api/auth/session', (route) =>
    fulfill(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401),
  );
  await page.route('**/api/public/advertisements', (route) => fulfill(route, { ok: true, items: [] }));
  await page.route('**/api/auth/login', (route) =>
    fulfill(route, {
      state: 'AUTHENTICATED',
      csrfToken: 'csrf-u07',
      user: {
        accountId: 'ACC-U07',
        displayName: 'U07 Custody Operator',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'DOL_STAFF',
          capabilities: ['view.internal', 'view.inventory', 'fulfillment.release', 'evidence.upload'],
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
      scopeRevision: { token: 'overview-u07', updatedAt: '2026-08-31T10:00:00.000Z' },
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
  await page.route('**/api/bootstrap/release?**', (route) => {
    state.bootstrapCalls += 1;
    const recheckRemaining = shrinkOnRecheck && state.bootstrapCalls >= 3 ? 1 : 3;
    const ready = !state.recorded;
    return fulfill(route, {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'release',
      scopeRevision: {
        token: `release-u07-${state.bootstrapCalls}`,
        updatedAt: '2026-08-31T10:00:00.000Z',
      },
      pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
      data: {
        eventSeries: [],
        events: [],
        inventoryItems: [{ id: 'ITM-U07', name: 'Folding chair', unit: 'piece' }],
        requests: [{ id: 'REQ-U07', purpose: 'Assembly seating', department: 'Operations' }],
        requestLines: ready
          ? [
              {
                id: 'LINE-U07',
                requestId: 'REQ-U07',
                itemId: 'ITM-U07',
                description: 'Folding chair',
                quantity: 5,
                releasedQuantity: 5 - recheckRemaining,
                unit: 'piece',
                status: recheckRemaining < 3 ? 'PARTIALLY_RELEASED' : 'READY_TO_RELEASE',
              },
            ]
          : [],
        lendingTickets: [],
        releaseConfirmations: state.recorded
          ? [
              {
                id: 'REL-U07',
                requestId: 'REQ-U07',
                recipientName: 'Maria Santos',
                recipientRole: 'Assembly custodian',
                department: 'Operations',
                status: 'PARTIAL',
                releasedAt: '2026-08-31T10:05:00.000Z',
                lineReleases: [{ requestLineId: 'LINE-U07', itemId: 'ITM-U07', quantity: 2, unit: 'piece' }],
              },
            ]
          : [],
        releaseCorrections: [],
      },
    });
  });
  await page.route('**/api/uploadEvidence', (route) => {
    state.uploads.push(JSON.parse(route.request().postData() || '{}'));
    return fulfill(route, {
      evidenceId: 'EVD-U07',
      uploadStatus: 'STORED',
      duplicate: false,
      correlationId: 'COR-U07-EVIDENCE',
    });
  });
  await page.route('**/api/confirmRelease', (route) => {
    state.releases.push(JSON.parse(route.request().postData() || '{}'));
    state.recorded = true;
    return fulfill(route, {
      releaseId: 'REL-U07',
      status: 'PARTIAL',
      recipientConfirmed: true,
      replayed: false,
      correlationId: 'COR-U07-RELEASE',
    });
  });
}

async function signInAndOpenRelease(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('u07.operator');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const releaseLink = page.locator('a[aria-label="Release"]:visible').first();
  const launcher = page.locator('[data-preview-index-launcher]');
  if ((page.viewportSize()?.width ?? 1024) < 1024 && (await launcher.isVisible())) {
    const [launcherBox, releaseBox] = await Promise.all([launcher.boundingBox(), releaseLink.boundingBox()]);
    expect(launcherBox).not.toBeNull();
    expect(releaseBox).not.toBeNull();
    expect(launcherBox.y + launcherBox.height).toBeLessThanOrEqual(releaseBox.y);
  }
  await releaseLink.click();
  await expect(page.getByRole('heading', { name: 'Release Desk', exact: true })).toBeVisible();
}

async function completeReleaseDraft(page, quantity = '2') {
  await page.getByLabel('Recipient name').fill('Maria Santos');
  await page.getByLabel('Recipient role').fill('Assembly custodian');
  await page.getByLabel('Department').fill('Operations');
  await page.getByLabel('Quantity to release').fill(quantity);
  await page.getByLabel('Governed release evidence').setInputFiles({
    name: 'release-proof.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  });
  await page.getByRole('button', { name: 'Review release consequence' }).click();
}

test('MFR-002 U07 records a release only after exact review and an authoritative recheck', async ({
  page,
}) => {
  const state = { bootstrapCalls: 0, uploads: [], releases: [], recorded: false };
  await installAuthenticatedRelease(page, state);
  await signInAndOpenRelease(page);

  await expect(page.getByRole('heading', { name: 'Ready records' })).toBeVisible();
  await expect(page.getByText('Folding chair').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Requests', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Lending records', exact: true })).toHaveCount(0);

  await completeReleaseDraft(page);
  const confirmation = page.getByRole('dialog', { name: 'Recheck and record release' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByText('REQ-U07 · line LINE-U07')).toBeVisible();
  await expect(confirmation.getByText('Maria Santos · Assembly custodian · Operations')).toBeVisible();
  await expect(confirmation.getByText('Folding chair', { exact: true })).toBeVisible();
  await expect(confirmation.getByText('2 piece of 3 remaining')).toBeVisible();
  await expect(confirmation.getByText(/partial physical release/u)).toBeVisible();
  const acknowledgment = confirmation.getByRole('checkbox', {
    name: /I verified the record, recipient, item, and quantity/u,
  });
  await expect(acknowledgment).toBeFocused();
  await expect(page.locator('.auth-shell__sidebar')).toHaveAttribute('aria-hidden', 'true');
  expect(state.uploads).toHaveLength(0);
  expect(state.releases).toHaveLength(0);

  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  const reviewButton = page.getByRole('button', { name: 'Review release consequence' });
  await expect(reviewButton).toBeFocused();
  await expect(page.locator('.auth-shell__sidebar')).not.toHaveAttribute('aria-hidden', 'true');
  await reviewButton.click();
  await acknowledgment.check();
  await confirmation.getByRole('button', { name: 'Recheck and record release' }).click();

  await expect(page.getByText(/Partial release REL-U07 recorded/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Release receipts' })).toBeVisible();
  await expect(page.getByText('Maria Santos', { exact: true })).toBeVisible();
  await expect(page.locator('.auth-shell__sidebar')).not.toHaveAttribute('aria-hidden', 'true');
  expect(state.bootstrapCalls).toBeGreaterThanOrEqual(3);
  expect(state.uploads).toHaveLength(1);
  expect(state.releases).toHaveLength(1);
  expect(state.uploads[0]).toMatchObject({
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: 'REQ-U07',
    requestId: 'REQ-U07',
    originalFileName: 'release-proof.jpg',
    mimeType: 'image/jpeg',
    clientRequestId: expect.stringMatching(/^p08-release-evidence-/u),
  });
  expect(state.uploads[0].base64).toMatch(/^data:image\/jpeg;base64,/u);
  expect(state.releases[0]).toMatchObject({
    requestId: 'REQ-U07',
    recipientConfirmed: true,
    recipientName: 'Maria Santos',
    recipientRole: 'Assembly custodian',
    department: 'Operations',
    evidenceId: 'EVD-U07',
    lines: [{ requestLineId: 'LINE-U07', quantity: 2 }],
    clientRequestId: expect.stringMatching(/^p08-release-/u),
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('MFR-002 U07 stops a stale release before evidence upload when the ready quantity changes', async ({
  page,
}, testInfo) => {
  test.skip(
    !['frontend-390', 'frontend-1440'].includes(testInfo.project.name),
    'One mobile and one desktop authoritative-change proof are sufficient.',
  );
  const state = { bootstrapCalls: 0, uploads: [], releases: [], recorded: false };
  await installAuthenticatedRelease(page, state, { shrinkOnRecheck: true });
  await signInAndOpenRelease(page);
  await completeReleaseDraft(page);

  const confirmation = page.getByRole('dialog', { name: 'Recheck and record release' });
  await confirmation
    .getByRole('checkbox', { name: /I verified the record, recipient, item, and quantity/u })
    .check();
  await confirmation.getByRole('button', { name: 'Recheck and record release' }).click();

  await expect(page.getByText(/Authoritative recheck stopped this release/u)).toBeVisible();
  await expect(page.getByText(/Only 1 piece remains releasable/u)).toBeVisible();
  expect(state.uploads).toHaveLength(0);
  expect(state.releases).toHaveLength(0);
});
