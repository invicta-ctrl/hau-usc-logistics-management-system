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

async function departmentTestCredential() {
  const credentialPath = process.env.HAU_DEPARTMENT_TEST_CREDENTIAL_FILE;
  if (!credentialPath || !path.isAbsolute(credentialPath)) {
    throw new Error('HAU_DEPARTMENT_TEST_CREDENTIAL_FILE must be an absolute private path.');
  }
  const parsed = JSON.parse(await readFile(credentialPath, 'utf8'));
  if (!parsed?.accessId || !parsed?.password) {
    throw new Error('The private department test credential file is incomplete.');
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
        schemaVersion: '18',
        latestMigration: '0018_authenticated_request_center.sql',
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
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        reason: 'Authorized synthetic deployed authentication and Access Management smoke proof.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    const createdResult = await created.json();
    cleanupAccessId = originalTargetAccessId;

    const starterLogin = await login(
      targetRequest,
      originalTargetAccessId,
      createdResult.credential.temporaryPassword,
    );
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
    await expect(page.getByLabel('Access ID')).toBeVisible();
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

test('deployed staging authenticated Request Center submits New and Additional requests with scoped tracking and PDF', async ({
  page,
  baseURL,
}) => {
  const credential = await departmentTestCredential();
  const requester = await apiRequest.newContext({ baseURL });
  const anonymous = await apiRequest.newContext({ baseURL });
  const activatedPassword = syntheticPassword('DepartmentActivated');
  try {
    expect((await anonymous.get('/api/public/request/options')).status()).toBe(401);
    expect((await anonymous.get('/api/portal/request')).status()).toBe(401);

    const starter = await requester.post('/api/auth/login', {
      data: { accessId: credential.accessId, password: credential.password },
    });
    expect(starter.status()).toBe(200);
    const starterResult = await starter.json();
    expect(starterResult.state).toBe('ACTIVATION_REQUIRED');
    const activation = await requester.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starterResult.csrfToken },
      data: {
        profile: {
          fullName: 'Authorized Department Logistics Staging Requester',
          mobileNumber: '+63 917 000 0020',
          email: `department-staging-${Date.now()}@example.invalid`,
        },
        password: activatedPassword,
        confirmPassword: activatedPassword,
      },
    });
    expect(activation.status()).toBe(200);
    const activationResult = await activation.json();
    expect(activationResult.user).toMatchObject({
      displayName: 'Department of Logistics',
      authorization: { roleId: 'REQUESTER', scopeMode: 'SELF' },
      requesterDepartment: {
        id: 'USC-DEPT-DOL',
        displayName: 'Department of Logistics',
      },
    });
    const csrfToken = activationResult.csrfToken;

    await page.goto('/request');
    await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
    await page.getByLabel('Access ID').fill(credential.accessId);
    await page.getByLabel('Password', { exact: true }).fill(activatedPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    const form = page.locator('#requesterRequestForm');
    await expect(form.getByLabel('Department')).toHaveValue('Department of Logistics');
    await form.locator('[name="eventSeriesId"]').selectOption('SER-STAGING-REQUEST-ACCEPTANCE');
    await form.locator('[name="eventId"]').selectOption('EVT-STAGING-REQUEST-ACCEPTANCE');
    await form
      .locator('[name="purpose"]')
      .fill('Authorized atomic authenticated Request Center staging acceptance.');
    await form.locator('[name="lineCategory"]').selectOption('Venue / Facility');
    await form.locator('[name="lineChoice"]').selectOption('University Theater');
    await form.locator('[name="lineQuantity"]').fill('1');
    await form.locator('[name="lineUnit"]').selectOption('facility');
    await form
      .locator('[name="lineSpecification"]')
      .fill('Authorized reversible acceptance fixture; no reservation or stock movement.');
    await form.getByRole('button', { name: 'Add requested item' }).click();
    await form.getByRole('button', { name: 'Submit request' }).click();
    await expect(page.getByRole('heading', { name: 'Submitted successfully' })).toBeVisible();
    const requestId = await page.locator('.request-success code').textContent();
    expect(requestId).toMatch(/^REQ-/u);
    await expect(page.locator('[name="trackingCode"]')).toHaveCount(0);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save PDF Receipt' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${requestId}-request-receipt.pdf`);
    const downloadPath = await download.path();
    expect((await readFile(downloadPath)).subarray(0, 8).toString()).toBe('%PDF-1.4');

    await page.getByRole('button', { name: 'View Request Status' }).click();
    await expect(page.getByRole('heading', { name: 'Track Existing Request' })).toBeVisible();
    await expect(page.locator('[data-tracking-results]')).toContainText('University Theater');

    const duplicate = await requester.post('/api/portal/request', {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        requestType: 'NEW',
        eventSeriesId: 'SER-STAGING-REQUEST-ACCEPTANCE',
        eventId: 'EVT-STAGING-REQUEST-ACCEPTANCE',
        purpose: 'Duplicate detection proof.',
        lines: [
          {
            category: 'Equipment',
            description: 'Projector',
            quantity: 1,
            unit: 'unit',
            specification: '',
          },
        ],
        clientRequestId: `staging-request-duplicate-${crypto.randomUUID()}`,
      },
    });
    expect(duplicate.status()).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: 'REQUEST_ALREADY_EXISTS' });

    const additionalCommand = {
      requestType: 'ADDITIONAL',
      parentRequestId: requestId,
      eventSeriesId: 'SER-STAGING-REQUEST-ACCEPTANCE',
      eventId: 'EVT-STAGING-REQUEST-ACCEPTANCE',
      purpose: 'Authorized Additional request staging acceptance.',
      lines: [
        {
          category: 'Other',
          description: 'Synthetic custom wayfinding sign',
          custom: true,
          quantity: 2,
          unit: 'piece',
          specification: 'Custom request only; never create a catalog record.',
        },
      ],
      clientRequestId: `staging-request-additional-${crypto.randomUUID()}`,
    };
    const additional = await requester.post('/api/portal/request', {
      headers: { 'x-csrf-token': csrfToken },
      data: additionalCommand,
    });
    expect(additional.status()).toBe(200);
    await expect(additional.json()).resolves.toMatchObject({
      requestType: 'ADDITIONAL',
      parentRequestId: requestId,
      department: 'Department of Logistics',
      status: 'FOR_REVIEW',
    });
    const replay = await requester.post('/api/portal/request', {
      headers: { 'x-csrf-token': csrfToken },
      data: additionalCommand,
    });
    await expect(replay.json()).resolves.toMatchObject({
      parentRequestId: requestId,
      replayed: true,
    });

    const scoped = await (await requester.get('/api/portal/request')).json();
    expect(scoped.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: requestId, department: 'Department of Logistics' }),
        expect.objectContaining({ requestType: 'ADDITIONAL', parentRequestId: requestId }),
      ]),
    );
    expect(JSON.stringify(scoped)).not.toContain('trackingCode');
    expect(JSON.stringify(scoped)).not.toContain('storageLocation');
    expect(JSON.stringify(scoped)).not.toContain('audit_log');
  } finally {
    await Promise.all([requester.dispose(), anonymous.dispose()]);
  }
});

test('deployed staging public Lending Center submits both borrower classes without tracking', async ({
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
    expect(catalog.uscDepartments).toContain('Department of Logistics');
    const item = catalog.items.find((entry) =>
      ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(entry.availability),
    );
    expect(item).toBeTruthy();
    expect(item).toEqual(
      expect.objectContaining({
        productId: item.id,
        aliases: expect.any(Array),
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
        borrowerType: 'ANGELITE',
        borrowerName: 'Authorized Synthetic Angelite Borrower',
        studentId: '12345678',
        courseYear: 'BSIT 2',
        academicDepartment: 'School of Computing',
        contactNumber: '+63 917 000 0010',
        email: `lending-${unique}@gmail.com`,
        purpose: 'Authorized synthetic no-login lending submission staging proof.',
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
    expect(receipt.submissionId).toMatch(/^LBR-/u);
    expect(receipt).not.toHaveProperty('trackingCode');

    const removedTracking = await publicRequest.post('/api/public/lending/track', {
      headers: { origin: new URL(baseURL).origin },
      data: { submissionId: receipt.submissionId, trackingCode: 'not-issued' },
    });
    expect(removedTracking.status()).toBe(404);

    const staffSubmission = await publicRequest.post('/api/public/lending', {
      headers: { origin: new URL(baseURL).origin },
      data: {
        borrowerType: 'USC_STAFF',
        borrowerName: 'Authorized Synthetic USC Staff Borrower',
        studentId: '12345678',
        uscDepartment: 'Department of Logistics',
        positionRole: 'Synthetic Acceptance Officer',
        contactNumber: '+63 917 000 0010',
        email: `staff-lending-${unique}@example.invalid`,
        purpose: 'Authorized synthetic USC staff lending submission staging proof.',
        pickupDate: pickup,
        dueDate: due,
        responsibilityAcknowledged: true,
        lines: [{ itemId: item.id, quantity: 1 }],
        clientRequestId: `staging-public-lending-staff-${unique}`,
      },
    });
    expect(staffSubmission.status()).toBe(200);
    await expect(staffSubmission.json()).resolves.toMatchObject({ status: 'FOR_REVIEW' });

    const after = await (await adminRequest.get('/api/inventory')).json();
    expect(after.data.inventoryItems.find((entry) => entry.id === item.id).onHand).toBe(balanceBefore);

    await page.goto('/lending');
    await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Browse Items Available for Lending' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'USC Announcements' })).toBeVisible();
    await expect(page.getByLabel('Access ID')).toHaveCount(0);
    await expect(page.locator('.app-shell')).toBeHidden();
  } finally {
    await Promise.all([publicRequest.dispose(), adminRequest.dispose()]);
  }
});
