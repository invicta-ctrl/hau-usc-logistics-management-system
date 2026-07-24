import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, request as apiRequest, test } from '@playwright/test';

function syntheticAccessId(suffix) {
  return `SMOKE.${Date.now().toString(36).toUpperCase()}.${randomBytes(4).toString('hex').toUpperCase()}.${suffix}`;
}

function syntheticPassword(label) {
  return `${label}!Aa9${randomBytes(18).toString('base64url')}`;
}

async function ownerCredential() {
  const credentialPath = process.env.HAU_STAGING_OWNER_CREDENTIAL_FILE;
  if (!credentialPath || !path.isAbsolute(credentialPath)) {
    throw new Error('HAU_STAGING_OWNER_CREDENTIAL_FILE must be an absolute private path.');
  }
  const parsed = JSON.parse(await readFile(credentialPath, 'utf8'));
  if (!parsed?.accessId || !parsed?.password) {
    throw new Error('The private staging owner credential file is incomplete.');
  }
  return { accessId: String(parsed.accessId), password: String(parsed.password) };
}

async function login(context, accessId, password) {
  const response = await context.post('/api/auth/login', { data: { accessId, password } });
  expect(response.status()).toBe(200);
  return response.json();
}

test('deployed staging serves the governed login background and official brand slots', async ({
  page,
  request,
}) => {
  for (const path of ['/brand/login-background', '/brand/dol-logo', '/brand/usc-logo', '/brand/favicon']) {
    const response = await request.get(path, {
      headers: { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  }

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  const visibleBrandMedia = page.locator('.brand-media:visible');
  await expect(visibleBrandMedia).toHaveCount(2);
  await expect
    .poll(() =>
      visibleBrandMedia.evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
    )
    .toBe(true);
  const backgroundImage = await page
    .locator('body')
    .evaluate((body) => getComputedStyle(body).backgroundImage);
  expect(backgroundImage).toContain('/brand/login-background');
});

test('deployed staging authentication and Access Management remain operational', async ({
  page,
  baseURL,
}) => {
  const candidateSha = process.env.HAU_STAGING_CANDIDATE_SHA;
  if (!candidateSha || !/^[0-9a-f]{40}$/u.test(candidateSha)) {
    throw new Error('HAU_STAGING_CANDIDATE_SHA must be the exact 40-character deployed commit SHA.');
  }

  const owner = await ownerCredential();
  const ownerRequest = page.context().request;
  const targetRequest = await apiRequest.newContext({ baseURL });
  const freshTargetRequest = await apiRequest.newContext({ baseURL });
  const anonymousRequest = await apiRequest.newContext({ baseURL });
  const originalTargetAccessId = syntheticAccessId('A');
  const renamedTargetAccessId = originalTargetAccessId.replace(/\.A$/u, '.B');
  const targetEmail = `${originalTargetAccessId.toLowerCase().replaceAll('.', '-')}@example.invalid`;
  const temporaryPassword = syntheticPassword('Temporary');
  const activatedPassword = syntheticPassword('Activated');
  let ownerCsrf = '';
  let cleanupAccessId = '';

  try {
    const verificationNonce = `${Date.now()}-${crypto.randomUUID()}`;
    const health = await anonymousRequest.get(`/api/health?verify=${verificationNonce}`, {
      headers: { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' },
    });
    expect(health.status()).toBe(200);
    await expect(health.json()).resolves.toMatchObject({
      environment: 'STAGING',
      candidateSha,
      database: {
        connected: true,
        schemaVersion: '14',
        latestMigration: '0014_lending_catalog_assets.sql',
      },
    });
    const readiness = await anonymousRequest.get(`/api/readiness?verify=${verificationNonce}-ready`, {
      headers: { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' },
    });
    expect(readiness.status()).toBe(200);
    await expect(readiness.json()).resolves.toMatchObject({ ok: true, ready: true, candidateSha });

    await page.goto('/app/admin');
    const accessInput = page.getByLabel('Access ID');
    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(accessInput).toBeVisible();
    await expect(accessInput).not.toBeFocused();
    await expect(accessInput).toHaveAttribute('name', 'username');
    await expect(accessInput).toHaveAttribute('type', 'text');
    await expect(accessInput).toHaveAttribute('inputmode', 'text');
    await expect(accessInput).toHaveAttribute('autocomplete', 'username');
    await expect(accessInput).toHaveAttribute('autocapitalize', 'characters');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    await expect(accessInput).not.toHaveAttribute('autofocus', /.*/u);

    const stableAccessNode = await accessInput.elementHandle();
    const invalidAccessId = syntheticAccessId('INVALID');
    await accessInput.fill(invalidAccessId);
    await passwordInput.fill(syntheticPassword('Invalid'));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toHaveText('The Access ID or password is incorrect.');
    await expect(page.getByText('The authentication service is temporarily unavailable.')).toHaveCount(0);
    await expect(accessInput).toHaveValue(invalidAccessId);
    await expect(accessInput).not.toBeFocused();
    expect(
      await stableAccessNode.evaluate(
        (node) => node.isConnected && document.querySelector('#authAccessId') === node,
      ),
    ).toBe(true);
    await accessInput.focus();
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    await accessInput.fill(owner.accessId);
    await passwordInput.fill(owner.password);
    const ownerLoginResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/auth/login',
    );
    await page.getByRole('button', { name: 'Sign in' }).click();
    const ownerLogin = await ownerLoginResponse;
    expect(ownerLogin.status()).toBe(200);
    const ownerLoginResult = await ownerLogin.json();
    expect(ownerLoginResult.state).toBe('AUTHENTICATED');
    ownerCsrf = ownerLoginResult.csrfToken;
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', 'administrator');
    expect(new URL(page.url()).pathname).toBe('/app/admin');

    await page.locator('[data-admin-view="referenceAdmin"]').click();
    await page.getByRole('button', { name: /Access Management/u }).click();
    await expect(page.locator('[data-access-management]')).toBeVisible();
    await expect(page.locator('[data-access-results] .access-account-row').first()).toBeVisible();

    const created = await ownerRequest.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        accessId: originalTargetAccessId,
        temporaryPassword,
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        reason: 'Authorized synthetic deployed authentication and Access Management smoke proof.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    cleanupAccessId = originalTargetAccessId;

    const starterLogin = await login(targetRequest, originalTargetAccessId, temporaryPassword);
    expect(starterLogin.state).toBe('ACTIVATION_REQUIRED');
    const activated = await targetRequest.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starterLogin.csrfToken },
      data: {
        profile: {
          fullName: 'Authorized Synthetic Staging Operator',
          mobileNumber: '+63 917 000 0002',
          email: targetEmail,
        },
        password: activatedPassword,
        confirmPassword: activatedPassword,
      },
    });
    expect(activated.status()).toBe(200);
    expect((await targetRequest.get('/api/requests')).status()).toBe(200);
    await expect(login(anonymousRequest, targetEmail, activatedPassword)).resolves.toMatchObject({
      state: 'AUTHENTICATED',
    });

    const search = page.locator('[name="accessSearch"]');
    await search.fill(originalTargetAccessId);
    await expect(page.locator('[data-access-results] .access-account-row')).toHaveCount(1);
    await expect(page.locator('[data-access-results]')).toContainText('DOL_STAFF');

    const targetLogin = await login(targetRequest, originalTargetAccessId, activatedPassword);
    const deniedEnumeration = await targetRequest.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': targetLogin.csrfToken },
      data: { query: '', page: 1, pageSize: 20 },
    });
    expect(deniedEnumeration.status()).toBe(403);

    const renameCommand = {
      currentAccessId: originalTargetAccessId,
      confirmCurrentAccessId: originalTargetAccessId,
      proposedAccessId: renamedTargetAccessId,
      reason: 'Authorized synthetic deployed Access ID rename and session revocation smoke proof.',
      idempotencyKey: `staging-smoke-${randomBytes(18).toString('hex')}`,
    };
    const preview = await ownerRequest.post('/api/admin/access/preview-access-id', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: renameCommand,
    });
    expect(preview.status()).toBe(200);
    await expect(preview.json()).resolves.toMatchObject({
      normalizationPreview: renamedTargetAccessId,
      immutableAccountIdPreserved: true,
      roleAndCapabilitiesUnchanged: true,
    });
    const changed = await ownerRequest.post('/api/admin/access/change-access-id', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: renameCommand,
    });
    expect(changed.status()).toBe(200);
    cleanupAccessId = renamedTargetAccessId;
    expect((await targetRequest.get('/api/requests')).status()).toBe(401);

    const oldLogin = await freshTargetRequest.post('/api/auth/login', {
      data: { accessId: originalTargetAccessId, password: activatedPassword },
    });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await login(freshTargetRequest, renamedTargetAccessId, activatedPassword);
    expect(newLogin.state).toBe('AUTHENTICATED');

    const history = await ownerRequest.post('/api/admin/access/history', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: { currentAccessId: renamedTargetAccessId, limit: 20 },
    });
    expect(history.status()).toBe(200);
    const historyResult = await history.json();
    expect(historyResult.history).toHaveLength(1);
    expect(historyResult.history[0]).toMatchObject({
      oldAccessId: originalTargetAccessId,
      newAccessId: renamedTargetAccessId,
      environment: 'STAGING',
    });
    expect(historyResult.auditHistory).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'ACCESS_ID_CHANGED' })]),
    );

    await search.fill(renamedTargetAccessId);
    await expect(page.locator('[data-access-results] .access-account-row')).toHaveCount(1);
    const historyButton = page.locator('[data-access-action="history"]');
    await expect(historyButton).toHaveAttribute('data-access-id', renamedTargetAccessId);
    await historyButton.click();
    await expect(page.getByRole('heading', { name: /Access ID history/u })).toBeVisible();
    await expect(page.locator('#modal')).toContainText('ACCESS_ID_CHANGED');
    await page.locator('[data-close-modal]').click();

    const disabled = await ownerRequest.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        currentAccessId: renamedTargetAccessId,
        confirmCurrentAccessId: renamedTargetAccessId,
        status: 'DISABLED',
        reason: 'Retain the authorized synthetic smoke account in a disabled staging-only state.',
      },
    });
    expect(disabled.status()).toBe(200);
    cleanupAccessId = '';

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByLabel('Access ID')).toBeVisible();
    await page.goto('/request');
    await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
    await expect(page.getByLabel('Access ID')).toHaveCount(0);
    await expect(page.locator('.app-shell')).toBeHidden();
    await page.goto('/lending');
    await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
    await expect(page.getByLabel('Access ID')).toHaveCount(0);
    await expect(page.locator('.app-shell')).toBeHidden();
  } finally {
    if (cleanupAccessId) {
      const cleanupRequest = await apiRequest.newContext({ baseURL });
      try {
        const cleanupLogin = await cleanupRequest.post('/api/auth/login', {
          data: { accessId: owner.accessId, password: owner.password },
        });
        expect.soft(cleanupLogin.status()).toBe(200);
        if (cleanupLogin.status() === 200) {
          const cleanupCsrf = (await cleanupLogin.json()).csrfToken;
          const cleanup = await cleanupRequest.post('/api/admin/access/status', {
            headers: { 'x-csrf-token': cleanupCsrf },
            data: {
              currentAccessId: cleanupAccessId,
              confirmCurrentAccessId: cleanupAccessId,
              status: 'DISABLED',
              reason: 'Fail-safe disable for the authorized synthetic deployed smoke account.',
            },
          });
          expect.soft([200, 404]).toContain(cleanup.status());
        }
      } finally {
        await cleanupRequest.dispose();
      }
    }
    await Promise.all([targetRequest.dispose(), freshTargetRequest.dispose(), anonymousRequest.dispose()]);
  }
});

test('deployed staging public Request Center submits and privately tracks without login', async ({
  page,
  baseURL,
}) => {
  const owner = await ownerCredential();
  const publicRequest = await apiRequest.newContext({ baseURL });
  const adminRequest = await apiRequest.newContext({ baseURL });
  try {
    await login(adminRequest, owner.accessId, owner.password);
    const optionsResponse = await publicRequest.get('/api/public/request/options');
    expect(optionsResponse.status()).toBe(200);
    const options = await optionsResponse.json();
    expect(options.items.length).toBeGreaterThan(0);
    expect(options.items[0]).not.toHaveProperty('onHand');
    expect(options.items[0]).not.toHaveProperty('storageLocation');
    expect(options).not.toHaveProperty('requestReferences');

    const item = options.items[0];
    const before = await (await adminRequest.get('/api/inventory')).json();
    const balanceBefore = before.data.inventoryItems.find((entry) => entry.id === item.id).onHand;
    const unique = `${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
    const submitted = await publicRequest.post('/api/public/request', {
      headers: { origin: new URL(baseURL).origin },
      data: {
        requestType: 'CATALOG_RESTOCK',
        requesterName: 'Authorized Synthetic Public Requester',
        requesterType: 'HAU office / department',
        organization: 'Authorized Synthetic Staging Proof',
        contactNumber: '+63 917 000 0010',
        email: `public-${unique}@example.invalid`,
        stockArea: options.stockAreas[0],
        neededDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        purpose: 'Authorized synthetic no-login request and private tracking staging proof.',
        lines: [
          {
            category: 'Inventory Item',
            itemId: item.id,
            quantity: 1,
            specification: 'Synthetic staging proof; no physical stock movement.',
          },
        ],
        clientRequestId: `staging-public-request-${unique}`,
      },
    });
    expect(submitted.status()).toBe(200);
    const receipt = await submitted.json();
    expect(receipt).toMatchObject({ status: 'FOR_REVIEW', replayed: false });
    expect(receipt.trackingCode.length).toBeGreaterThan(32);

    const tracked = await publicRequest.post('/api/public/request/track', {
      headers: { origin: new URL(baseURL).origin },
      data: { requestId: receipt.requestId, trackingCode: receipt.trackingCode },
    });
    expect(tracked.status()).toBe(200);
    const tracking = await tracked.json();
    expect(tracking.request).toMatchObject({ id: receipt.requestId, status: 'FOR_REVIEW' });
    expect(tracking.request).not.toHaveProperty('requesterEmail');
    expect(tracking.request).not.toHaveProperty('contactNumber');

    const after = await (await adminRequest.get('/api/inventory')).json();
    expect(after.data.inventoryItems.find((entry) => entry.id === item.id).onHand).toBe(balanceBefore);

    await page.goto('/request');
    await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
    await expect(page.getByLabel('Access ID')).toHaveCount(0);
    await expect(page.locator('.app-shell')).toBeHidden();
  } finally {
    await Promise.all([publicRequest.dispose(), adminRequest.dispose()]);
  }
});

test('deployed staging public Lending Center submits and privately tracks without login', async ({
  page,
  baseURL,
}) => {
  const owner = await ownerCredential();
  const publicRequest = await apiRequest.newContext({ baseURL });
  const adminRequest = await apiRequest.newContext({ baseURL });
  try {
    await login(adminRequest, owner.accessId, owner.password);
    const catalogResponse = await publicRequest.get('/api/public/lending/catalog');
    expect(catalogResponse.status()).toBe(200);
    const catalog = await catalogResponse.json();
    const item = catalog.items.find((entry) =>
      ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(entry.availability),
    );
    expect(item).toBeTruthy();
    expect(item).toEqual(
      expect.objectContaining({
        productId: item.id,
        type: expect.stringMatching(/^(REUSABLE|CONSUMABLE)$/u),
        dueDateRequired: expect.any(Boolean),
        acknowledgmentRequired: expect.any(Boolean),
        conditionTracked: expect.any(Boolean),
      }),
    );
    expect(item).not.toHaveProperty('onHand');
    expect(item).not.toHaveProperty('availableToPromise');
    expect(item).not.toHaveProperty('reserved');
    expect(item).not.toHaveProperty('onLoan');
    expect(item).not.toHaveProperty('storageLocation');

    const before = await (await adminRequest.get('/api/inventory')).json();
    const balanceBefore = before.data.inventoryItems.find((entry) => entry.id === item.id).onHand;
    const unique = `${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
    const pickup = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const due = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const submitted = await publicRequest.post('/api/public/lending', {
      headers: { origin: new URL(baseURL).origin },
      data: {
        borrowerName: 'Authorized Synthetic Angelite Borrower',
        studentId: '12345678',
        courseYear: 'BSIT 2',
        department: 'SEA',
        contactNumber: '+63 917 000 0010',
        email: `lending-${unique}@gmail.com`,
        purpose: 'Authorized synthetic no-login lending and private tracking staging proof.',
        pickupDate: pickup,
        dueDate: due,
        responsibilityAcknowledged: true,
        lines: [{ itemId: item.id, quantity: 1 }],
        clientRequestId: `staging-public-lending-${unique}`,
      },
    });
    expect(submitted.status()).toBe(200);
    const receipt = await submitted.json();
    expect(receipt).toMatchObject({ status: 'FOR_REVIEW', replayed: false });
    expect(receipt.trackingCode.length).toBeGreaterThan(32);

    const tracked = await publicRequest.post('/api/public/lending/track', {
      headers: { origin: new URL(baseURL).origin },
      data: { ticketId: receipt.ticketId, trackingCode: receipt.trackingCode },
    });
    expect(tracked.status()).toBe(200);
    const tracking = await tracked.json();
    expect(tracking.request).toMatchObject({ id: receipt.ticketId, status: 'FOR_REVIEW' });
    expect(tracking.request.tickets).toHaveLength(1);
    expect(tracking.request).not.toHaveProperty('email');
    expect(tracking.request).not.toHaveProperty('contactNumber');
    expect(tracking.request).not.toHaveProperty('studentId');

    const after = await (await adminRequest.get('/api/inventory')).json();
    expect(after.data.inventoryItems.find((entry) => entry.id === item.id).onHand).toBe(balanceBefore);

    await page.goto('/lending');
    await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Browse Items Available for Lending' })).toBeVisible();
    await expect(page.getByLabel('Access ID')).toHaveCount(0);
    await expect(page.locator('.app-shell')).toBeHidden();
  } finally {
    await Promise.all([publicRequest.dispose(), adminRequest.dispose()]);
  }
});
