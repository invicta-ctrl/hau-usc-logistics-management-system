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

async function mutate(context, csrfToken, method, data) {
  return context.post(`/api/${method}`, {
    headers: { 'x-csrf-token': csrfToken },
    data,
  });
}

function releaseFixtureId(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value || !/SYNTHETIC|STAGING/iu.test(value)) {
    throw new Error(`${name} must identify an explicitly synthetic staging fixture.`);
  }
  return value;
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

test('deployed staging Materials workspace projects its canonical queue and shared destinations', async ({
  page,
}) => {
  const owner = await ownerCredential();
  const ownerRequest = page.context().request;
  const ownerLogin = await login(ownerRequest, owner.accessId, owner.password);
  expect(ownerLogin.state).toBe('AUTHENTICATED');
  expect(ownerLogin.user.authorization.roleId).toBe('SYSTEM_OWNER');

  const sessionResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
  );
  await page.goto('/app/materials');
  const browserSession = await (await sessionResponse).json();
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await expect(shell.getByLabel('Workspace')).toHaveValue('materials');
  await shell.getByLabel('Operational scope').selectOption('COMMITTEE:COM_MATERIALS');
  await expect(page).toHaveURL(/\/app\/materials\?scope=COMMITTEE%3ACOM_MATERIALS$/u);

  const queueResponse = await ownerRequest.post('/api/getMaterialsWorkQueue', {
    headers: { 'x-csrf-token': browserSession.csrfToken },
    data: {},
  });
  expect(queueResponse.status()).toBe(200);
  const queue = await queueResponse.json();
  expect(queue).toMatchObject({
    ok: true,
    committeeId: 'COM_MATERIALS',
    items: expect.any(Array),
  });

  const panel = page.locator('#roleExperiencePanel[data-role-experience="materials"]');
  await expect(panel.getByRole('heading', { name: 'Materials Overview' })).toBeVisible();
  for (const [destination, name] of [
    ['materials-queue', 'Materials Queue'],
    ['materials-canvassing', 'Canvassing'],
    ['materials-procurement', 'Procurement'],
    ['materials-suppliers', 'Suppliers'],
    ['materials-price-history', 'Price History'],
    ['materials-receiving', 'Receiving'],
    ['materials-deliverables', 'Deliverables'],
    ['materials-release', 'Release Desk'],
  ]) {
    await expect(
      panel.locator(`.role-experience-actions [data-materials-destination="${destination}"]`),
    ).toContainText(name);
  }

  await expect(panel.getByRole('heading', { name: 'Traceable materials pipeline' })).toBeVisible();
  await expect(panel).toContainText(
    `${queue.items.length} scoped deliverable${queue.items.length === 1 ? '' : 's'}`,
  );
  if (queue.items.length === 0) {
    await expect(panel).toContainText('No Materials work is in the current authorized scope.');
  } else {
    const firstItem = queue.items[0];
    await expect(panel).toContainText(firstItem.deliverableId);
    await expect(panel).toContainText(firstItem.requestId);
    await expect(panel).toContainText(firstItem.materials.specification);
    await expect(panel).toContainText(
      `Requested ${firstItem.quantityRequested} ${firstItem.unit} Â· Received ${firstItem.quantityReceived} Â· Released ${firstItem.quantityReleased}`,
    );
  }

  await panel.locator('[data-materials-destination="materials-canvassing"]').last().click();
  await expect(page.locator('[data-proc-tab="canvass"]')).toHaveClass(/active/u);
  await page.goto('/app/materials?scope=COMMITTEE%3ACOM_MATERIALS');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page
    .locator('#roleExperiencePanel [data-materials-destination="materials-deliverables"]')
    .last()
    .click();
  await expect(page.locator('[data-proc-tab="deliverables"]')).toHaveClass(/active/u);
  await page.goto('/app/materials?scope=COMMITTEE%3ACOM_MATERIALS');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page
    .locator('#roleExperiencePanel [data-materials-destination="materials-receiving"]')
    .last()
    .click();
  await expect(page.locator('[data-proc-tab="receiving"]')).toHaveClass(/active/u);
  await page.goto('/app/materials?scope=COMMITTEE%3ACOM_MATERIALS');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel [data-materials-destination="materials-release"]').last().click();
  await expect(page.locator('#release')).toHaveClass(/active/u);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
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
        schemaVersion: '23',
        latestMigration: '0023_hybrid_evidence_storage.sql',
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
    expect(ownerLoginResult.user.authorization.roleId).toBe('SYSTEM_OWNER');
    ownerCsrf = ownerLoginResult.csrfToken;
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', 'administrator');
    expect(new URL(page.url()).pathname).toBe('/app/admin');

    const shell = page.locator('[data-internal-shell-context]');
    await expect(shell).toBeVisible();
    await expect(shell.getByLabel('Workspace')).toHaveValue('administrator');
    await expect(shell.getByLabel('Workspace').locator('option:disabled')).toHaveCount(0);
    await expect(shell.getByLabel('Operational scope')).toHaveValue('ALL:AUTHORIZED');
    await expect(shell.locator('[data-shell-release]')).toHaveText(/STAGING.*v0\.7\.0/u);
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    await shell.getByLabel('Operational scope').selectOption('COMMITTEE:COM_FOOD');
    await expect(page).toHaveURL(/scope=COMMITTEE%3ACOM_FOOD/u);
    await shell.getByLabel('Workspace').selectOption('food');
    await expect(page).toHaveURL(/\/app\/food\?scope=COMMITTEE%3ACOM_FOOD$/u);
    await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
    await expect(page.locator('#roleExperiencePanel')).toHaveAttribute('data-role-experience', 'food');
    const refreshedSessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.reload();
    ownerCsrf = (await (await refreshedSessionResponse).json()).csrfToken;
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    await expect(shell.getByLabel('Operational scope')).toHaveValue('COMMITTEE:COM_FOOD');
    await shell.getByLabel('Workspace').selectOption('administrator');
    await expect(page).toHaveURL(/\/app\/admin\?scope=COMMITTEE%3ACOM_FOOD$/u);

    const adminControlCenter = page.locator('#roleExperiencePanel[data-role-experience="administrator"]');
    await expect(adminControlCenter).toBeVisible();
    await expect(
      adminControlCenter.getByRole('heading', { name: 'Administrator Control Center' }),
    ).toBeVisible();
    for (const name of [
      'All Request Queues',
      'Internal Lending Hub',
      'Release Desk',
      'Restocking',
      'Procurement & Deliverables',
      'Inventory Management',
      'Receiving',
      'Evidence status',
    ]) {
      await expect(adminControlCenter.getByRole('button', { name: new RegExp(name, 'u') })).toBeVisible();
    }
    await adminControlCenter.getByRole('button', { name: /Environment health/u }).click();
    await expect(page.locator('[data-admin-operational-health]')).toBeVisible();
    await page.getByRole('button', { name: /Brand Assets/u }).click();
    await expect(page.locator('[data-admin-brand-assets] [data-brand-slot]')).toHaveCount(4);

    await shell.getByLabel('Workspace').selectOption('director');
    await expect(page).toHaveURL(/\/app\/director\?scope=COMMITTEE%3ACOM_FOOD$/u);
    const directorSessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.reload();
    ownerCsrf = (await (await directorSessionResponse).json()).csrfToken;
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    const directorWorkspace = page.locator('#roleExperiencePanel[data-role-experience="director"]');
    await expect(directorWorkspace.getByRole('heading', { name: 'Executive Overview' })).toBeVisible();
    for (const name of [
      'Decision Queue',
      'Event Planning',
      'Event Series & Sub-events',
      'Committee Readiness',
      'Request Progress',
      'Procurement Progress',
      'Release Readiness',
      'Lending Status',
      'Inventory Alerts',
      'Management & Access',
    ]) {
      await expect(directorWorkspace.getByRole('button', { name: new RegExp(name, 'u') })).toBeVisible();
    }
    await directorWorkspace.getByRole('button', { name: /^Management & Access/u }).click();
    const directorManagement = directorWorkspace.locator('[data-director-management-access]');
    await expect(directorManagement).toContainText('System Owner');
    await expect(directorManagement).toContainText('Administration stays in its own workspace');

    await shell.getByLabel('Workspace').selectOption('food');
    await expect(page).toHaveURL(/\/app\/food\?scope=COMMITTEE%3ACOM_FOOD$/u);
    const foodSessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.reload();
    ownerCsrf = (await (await foodSessionResponse).json()).csrfToken;
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    const foodWorkspace = page.locator('#roleExperiencePanel[data-role-experience="food"]');
    await expect(foodWorkspace.getByRole('heading', { name: 'Food Overview' })).toBeVisible();
    for (const [destination, name] of [
      ['food-work-queue', 'Food Work Queue'],
      ['food-suppliers-quotes', 'Suppliers & Quotes'],
      ['food-procurement', 'Procurement'],
      ['food-receiving', 'Receiving'],
      ['food-release', 'Release Desk'],
      ['food-workflow-reference', 'Workflow Reference'],
    ]) {
      await expect(
        foodWorkspace.locator(`.role-experience-actions [data-food-destination="${destination}"]`),
      ).toContainText(name);
    }
    await foodWorkspace.locator('[data-food-destination="food-workflow-reference"]').last().click();
    const foodReference = foodWorkspace.locator('[data-food-workflow-reference]');
    await expect(foodReference).toContainText('10 business days');
    await expect(foodReference).toContainText('5 business days');
    await expect(foodReference).toContainText('Historical prices are reference only');
    await expect(foodReference).toContainText('Aggregate dietary and allergen counts only');
    await foodWorkspace.locator('[data-food-destination="food-suppliers-quotes"]').last().click();
    await expect(page.locator('[data-proc-tab="canvass"]')).toHaveClass(/active/u);
    await expect(page.getByRole('heading', { name: 'Canvass Library' })).toBeVisible();
    await page.goto('/app/food?scope=COMMITTEE%3ACOM_FOOD');
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    await foodWorkspace.locator('[data-food-destination="food-receiving"]').last().click();
    await expect(page.locator('[data-proc-tab="receiving"]')).toHaveClass(/active/u);
    const foodReleaseSessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.goto('/app/food?scope=COMMITTEE%3ACOM_FOOD');
    ownerCsrf = (await (await foodReleaseSessionResponse).json()).csrfToken;
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    await foodWorkspace.locator('[data-food-destination="food-release"]').last().click();
    await expect(page.locator('#release')).toHaveClass(/active/u);

    await shell.getByLabel('Operational scope').selectOption('COMMITTEE:COM_INVENTORY_PANTRY');
    await expect(page).toHaveURL(/scope=COMMITTEE%3ACOM_INVENTORY_PANTRY/u);
    await shell.getByLabel('Workspace').selectOption('inventory-pantry');
    await expect(page).toHaveURL(/\/app\/inventory\/release\?scope=COMMITTEE%3ACOM_INVENTORY_PANTRY$/u);
    const inventorySessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.reload();
    ownerCsrf = (await (await inventorySessionResponse).json()).csrfToken;
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    await expect(page.locator('body')).toHaveAttribute('data-experience', 'inventory-pantry');
    await expect(page.locator('#release')).toHaveClass(/active/u);
    await page.goto('/app/inventory?scope=COMMITTEE%3ACOM_INVENTORY_PANTRY');
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    const inventoryWorkspace = page.locator('#roleExperiencePanel[data-role-experience="inventory-pantry"]');
    await expect(inventoryWorkspace.getByRole('heading', { name: 'Inventory Overview' })).toBeVisible();
    for (const [destination, name] of [
      ['inventory-management', 'Inventory Management'],
      ['inventory-pantry-stock', 'Pantry'],
      ['inventory-restocking', 'Restocking'],
      ['inventory-lending', 'Lending Operations'],
      ['inventory-receiving', 'Receiving'],
      ['inventory-release', 'Release Desk'],
      ['inventory-movement-history', 'Movement History'],
      ['inventory-alerts', 'Condition & Stock Alerts'],
    ]) {
      await expect(
        inventoryWorkspace.locator(`.role-experience-actions [data-inventory-destination="${destination}"]`),
      ).toContainText(name);
    }
    const inventoryModuleResponse = await ownerRequest.post('/api/getBootstrapModule', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        module: 'inventory',
        operationalScope: 'COMMITTEE:COM_INVENTORY_PANTRY',
        page: 1,
        pageSize: 10,
      },
    });
    expect(inventoryModuleResponse.status()).toBe(200);
    const inventoryModule = await inventoryModuleResponse.json();
    expect(inventoryModule.data).toMatchObject({
      inventoryItems: expect.any(Array),
      ledgerTransactions: expect.any(Array),
      inventoryAssets: expect.any(Array),
      assetMaintenanceHistory: expect.any(Array),
      assetMovementHistory: expect.any(Array),
    });
    expect(inventoryModule.data.ledgerTransactions.length).toBeLessThanOrEqual(100);
    expect(inventoryModule.data.inventoryAssets.length).toBeLessThanOrEqual(100);
    const inventoryItem = inventoryModule.data.inventoryItems[0];
    expect(inventoryItem).toEqual(
      expect.objectContaining({
        onHand: expect.any(Number),
        reserved: expect.any(Number),
        availableToPromise: expect.any(Number),
      }),
    );
    await inventoryWorkspace.locator('[data-inventory-destination="inventory-management"]').last().click();
    await expect(page.locator('#inventory')).toHaveClass(/active/u);
    await expect(page.locator('#inventoryTable')).toContainText(inventoryItem.id);
    await expect(page.locator('#inventoryTable')).toContainText(
      `On hand ${inventoryItem.onHand} · Reserved ${inventoryItem.reserved} · ATP ${inventoryItem.availableToPromise} ${inventoryItem.unit}`,
    );
    await page.goto('/app/inventory?scope=COMMITTEE%3ACOM_INVENTORY_PANTRY');
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    await inventoryWorkspace
      .locator('[data-inventory-destination="inventory-movement-history"]')
      .last()
      .click();
    await expect(page.getByRole('heading', { name: 'Movement History' })).toBeVisible();
    await page.goto('/app/inventory?scope=COMMITTEE%3ACOM_INVENTORY_PANTRY');
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    await inventoryWorkspace.locator('[data-inventory-destination="inventory-alerts"]').last().click();
    await expect(page.getByRole('heading', { name: 'Condition & Stock Alerts' })).toBeVisible();

    await shell.getByLabel('Operational scope').selectOption('COMMITTEE:COM_FOOD');
    await shell.getByLabel('Workspace').selectOption('administrator');
    await expect(page).toHaveURL(/\/app\/admin\?scope=COMMITTEE%3ACOM_FOOD$/u);
    const adminSessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/auth/session',
    );
    await page.reload();
    ownerCsrf = (await (await adminSessionResponse).json()).csrfToken;
    await page.locator('[data-admin-view="referenceAdmin"]').click();
    await page.getByRole('button', { name: /Access Management/u }).click();
    const accessManagement = page.locator('[data-access-management]');
    await expect(accessManagement).toBeVisible();
    const departmentSearch = accessManagement.getByLabel('Search');
    const expectedDepartmentAccounts = [
      ['DOL_2026', 'Department of Logistics'],
      ['DOF_2026', 'Department of Finance'],
      ['DPC_2026', 'Department of Public Communications'],
      ['DEM_2026', 'Department of Events Management'],
      ['DBR_2026', 'Department of Business Relations'],
      ['OP_2026', 'Office of the President'],
      ['OVP_2026', 'Office of the Vice President'],
      ['OSG_2026', 'Office of the Secretary General'],
      ['DHR_2026', 'Department of Human Resources'],
      ['DCES_2026', 'Department of Community Extensions Services'],
    ];
    for (const [accessId, department] of expectedDepartmentAccounts) {
      await departmentSearch.fill(accessId);
      const departmentRow = page.locator('[data-access-results] .access-account-row');
      await expect(departmentRow).toHaveCount(1);
      await expect(departmentRow).toContainText(accessId);
      await expect(departmentRow).toContainText(department);
      await expect(departmentRow).toContainText('ACTIVE');
      await expect(departmentRow.getByRole('button', { name: 'Reset password' })).toBeVisible();
    }
    await departmentSearch.fill('');
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
    const createdResult = await created.json();
    expect(created.status(), JSON.stringify(createdResult)).toBe(200);
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

    await shell.locator('.shell-account > summary').click();
    await shell.getByRole('button', { name: 'Sign out' }).click();
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

test('deployed staging Advanced Access Management assigns and enforces effective policy', async ({
  page,
  baseURL,
}) => {
  const owner = await ownerCredential();
  const targetRequest = await apiRequest.newContext({ baseURL });
  const anonymousRequest = await apiRequest.newContext({ baseURL });
  const activatedPassword = syntheticPassword('Phase14Activated');
  let targetAccessId = '';

  try {
    const ownerLogin = await login(page.context().request, owner.accessId, owner.password);
    const ownerCsrf = ownerLogin.csrfToken;
    const options = await page.context().request.post('/api/admin/access/options', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {},
    });
    expect(options.status()).toBe(200);
    await expect(options.json()).resolves.toMatchObject({
      workspaces: expect.arrayContaining([expect.objectContaining({ id: 'food' })]),
      presets: expect.arrayContaining([
        expect.objectContaining({ id: 'FOOD_OPERATOR' }),
        expect.objectContaining({ id: 'CUSTOM' }),
      ]),
    });

    const created = await page.context().request.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        generateAccessId: true,
        presetId: 'MATERIALS_OPERATOR',
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        workspaceIds: ['materials'],
        defaultWorkspaceId: 'materials',
        status: 'STARTER',
        temporaryPasswordHours: 72,
        reason: 'Authorized live Phase 14 generated-account acceptance proof.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    const createdResult = await created.json();
    targetAccessId = createdResult.account.accessId;
    expect(targetAccessId).toMatch(/^DOL-2026-\d{4}$/u);
    expect(createdResult).toMatchObject({
      account: {
        status: 'STARTER',
        accessProfile: {
          presetId: 'MATERIALS_OPERATOR',
          workspaceIds: ['materials'],
          defaultWorkspaceId: 'materials',
        },
      },
      credential: { accessId: targetAccessId, temporaryPassword: expect.stringMatching(/^Hau!9/u) },
    });

    const starter = await login(targetRequest, targetAccessId, createdResult.credential.temporaryPassword);
    expect(starter.state).toBe('ACTIVATION_REQUIRED');
    const activated = await targetRequest.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starter.csrfToken },
      data: {
        profile: {
          fullName: 'Authorized Phase 14 Staging Operator',
          mobileNumber: '+63 917 000 0014',
          email: `${targetAccessId.toLowerCase()}@example.invalid`,
        },
        password: activatedPassword,
        confirmPassword: activatedPassword,
      },
    });
    expect(activated.status()).toBe(200);

    const policyCommand = {
      currentAccessId: targetAccessId,
      confirmCurrentAccessId: targetAccessId,
      presetId: 'FOOD_OPERATOR',
      roleId: 'DOL_STAFF',
      committeeIds: ['COM_FOOD'],
      defaultCommitteeId: 'COM_FOOD',
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      locationScopeIds: [],
      eventSeriesScopeIds: [],
      eventScopeIds: [],
      capabilityGrants: [],
      capabilityDenies: ['lending.usage.view'],
      reason: 'Move the live Phase 14 operator to bounded Food access.',
    };
    const preview = await page.context().request.post('/api/admin/access/preview-policy', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: policyCommand,
    });
    expect(preview.status()).toBe(200);
    await expect(preview.json()).resolves.toMatchObject({
      presetId: 'FOOD_OPERATOR',
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      committeeIds: ['COM_FOOD'],
      explicitDenies: ['lending.usage.view'],
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
    });
    const updated = await page.context().request.post('/api/admin/access/update-policy', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        ...policyCommand,
        idempotencyKey: `staging-phase14-${randomBytes(18).toString('hex')}`,
      },
    });
    expect(updated.status()).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      changed: true,
      replayed: false,
      sessionsRevoked: true,
    });
    expect((await targetRequest.get('/api/requests')).status()).toBe(401);

    const relogin = await login(targetRequest, targetAccessId, activatedPassword);
    expect(relogin).toMatchObject({
      state: 'AUTHENTICATED',
      user: {
        experienceId: 'food',
        authorization: {
          workspaceIds: ['food'],
          defaultWorkspaceId: 'food',
          committeeIds: ['COM_FOOD'],
          explicitDenies: ['lending.usage.view'],
        },
      },
    });

    await page.goto('/app/admin');
    await expect(page.locator('#loading')).toHaveClass(/hidden/u);
    await page.locator('[data-admin-view="referenceAdmin"]').click();
    await page.getByRole('button', { name: /Access Management/u }).click();
    const access = page.locator('[data-access-management]');
    await access.getByLabel('Search').fill(targetAccessId);
    const row = access.locator('[data-access-results] .access-account-row');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('FOOD_OPERATOR');
    await expect(row).toContainText('food; default food');
    await expect(row.getByRole('button', { name: 'Disable' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Archive' })).toBeVisible();
    await expect(row.getByRole('button', { name: /delete/i })).toHaveCount(0);

    await page.context().clearCookies();
    await page.goto('/app/materials');
    await page.getByLabel('Access ID').fill(targetAccessId);
    await page.getByLabel('Password', { exact: true }).fill(activatedPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/app\/food$/u);
    const shell = page.locator('[data-internal-shell-context]');
    await expect(shell.getByLabel('Workspace')).toHaveValue('food');
    await expect(shell.getByLabel('Workspace').locator('option:not(:disabled)')).toHaveCount(1);

    const cleanup = await apiRequest.newContext({ baseURL });
    try {
      const cleanupLogin = await login(cleanup, owner.accessId, owner.password);
      const archived = await cleanup.post('/api/admin/access/status', {
        headers: { 'x-csrf-token': cleanupLogin.csrfToken },
        data: {
          currentAccessId: targetAccessId,
          confirmCurrentAccessId: targetAccessId,
          status: 'REVOKED',
          lifecycleAction: 'ARCHIVE',
          reason: 'Archive the live Phase 14 synthetic operator without deleting history.',
        },
      });
      expect(archived.status()).toBe(200);
      await expect(archived.json()).resolves.toMatchObject({ archived: true, status: 'REVOKED' });
      const history = await cleanup.post('/api/admin/access/history', {
        headers: { 'x-csrf-token': cleanupLogin.csrfToken },
        data: { currentAccessId: targetAccessId, limit: 20 },
      });
      expect(history.status()).toBe(200);
      expect((await history.json()).auditHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'ACCESS_POLICY_CHANGED' }),
          expect.objectContaining({ action: 'ACCOUNT_ARCHIVED' }),
        ]),
      );
      targetAccessId = '';
    } finally {
      await cleanup.dispose();
    }
    const archivedLogin = await anonymousRequest.post('/api/auth/login', {
      data: { accessId: createdResult.account.accessId, password: activatedPassword },
    });
    expect(archivedLogin.status()).toBe(403);
  } finally {
    if (targetAccessId) {
      const cleanup = await apiRequest.newContext({ baseURL });
      try {
        const cleanupLogin = await cleanup.post('/api/auth/login', {
          data: { accessId: owner.accessId, password: owner.password },
        });
        if (cleanupLogin.status() === 200) {
          const cleanupCsrf = (await cleanupLogin.json()).csrfToken;
          await cleanup.post('/api/admin/access/status', {
            headers: { 'x-csrf-token': cleanupCsrf },
            data: {
              currentAccessId: targetAccessId,
              confirmCurrentAccessId: targetAccessId,
              status: 'REVOKED',
              lifecycleAction: 'ARCHIVE',
              reason: 'Fail-safe archive for the live Phase 14 synthetic operator.',
            },
          });
        }
      } finally {
        await cleanup.dispose();
      }
    }
    await Promise.all([targetRequest.dispose(), anonymousRequest.dispose()]);
  }
});

test('deployed staging authenticated Request Center enforces approved events and scoped requester privacy', async ({
  page,
  baseURL,
}) => {
  const credential = await departmentTestCredential();
  const requester = await apiRequest.newContext({ baseURL });
  const anonymous = await apiRequest.newContext({ baseURL });
  try {
    expect((await anonymous.get('/api/public/request/options')).status()).toBe(401);
    expect((await anonymous.get('/api/portal/request')).status()).toBe(401);

    const starter = await requester.post('/api/auth/login', {
      data: { accessId: credential.accessId, password: credential.password },
    });
    expect(starter.status()).toBe(200);
    const starterResult = await starter.json();
    expect(starterResult.state).toBe('AUTHENTICATED');
    expect(starterResult.user).toMatchObject({
      displayName: 'Department of Logistics',
      authorization: { roleId: 'REQUESTER', scopeMode: 'SELF' },
      requesterDepartment: {
        id: 'USC-DEPT-DOL',
        displayName: 'Department of Logistics',
      },
    });
    const csrfToken = starterResult.csrfToken;

    await page.goto('/request');
    await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
    await page.getByLabel('Access ID').fill(credential.accessId);
    await page.getByLabel('Password', { exact: true }).fill(credential.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    const form = page.locator('#requesterRequestForm');
    await expect(form.getByLabel('Department')).toHaveValue('Department of Logistics');
    if ((await form.locator('[name="eventSeriesId"] option').count()) === 1) {
      test.info().annotations.push({
        type: 'blocked-branch',
        description:
          'New/Additional submission and PDF branches not run: governed staging source has no approved event series.',
      });
      await expect(form.locator('[name="eventSeriesId"]')).toHaveValue('');
      await expect(form.locator('[name="eventId"]')).toBeDisabled();
      await expect(form.getByRole('button', { name: 'Submit request' })).toBeDisabled();
      const scoped = await (await requester.get('/api/portal/request')).json();
      expect(scoped.requests).toEqual(expect.any(Array));
      expect(JSON.stringify(scoped)).not.toContain('trackingCode');
      expect(JSON.stringify(scoped)).not.toContain('storageLocation');
      expect(JSON.stringify(scoped)).not.toContain('audit_log');
      return;
    }
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

test('deployed staging public Lending Center enforces governed availability and borrower privacy', async ({
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
    if (!item) {
      expect(catalog.items).toEqual([]);
      test.info().annotations.push({
        type: 'blocked-branch',
        description:
          'Borrower submission branch not run: governed staging catalog has no approved lendable item.',
      });
      await page.goto('/lending');
      await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Browse Items Available for Lending' })).toBeVisible();
      await expect(page.getByText('No approved lending items are published.')).toBeVisible();
      await expect(page.getByLabel('Access ID')).toHaveCount(0);
      await expect(page.locator('.app-shell')).toBeHidden();
      return;
    }
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

test('deployed staging stores evidence in R2, verifies one private Drive backup, and archives safely', async ({
  page,
  baseURL,
}) => {
  const owner = await ownerCredential();
  const ownerRequest = page.context().request;
  const ownerLogin = await login(ownerRequest, owner.accessId, owner.password);
  expect(ownerLogin.state).toBe('AUTHENTICATED');
  expect(ownerLogin.user.authorization.roleId).toBe('SYSTEM_OWNER');

  const nonce = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const relatedEntityId = `SYNTHETIC-EVIDENCE-${nonce}`.toUpperCase();
  const evidenceBytes = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...Buffer.from(`staging-hybrid-evidence-${nonce}`),
  ]);
  const uploadCommand = {
    evidenceType: 'OTHER_SUPPORTING_DOCUMENT',
    originalFileName: `synthetic-hybrid-${nonce}.png`,
    mimeType: 'image/png',
    base64: evidenceBytes.toString('base64'),
    relatedEntityType: 'STAGING_ACCEPTANCE',
    relatedEntityId,
    clientRequestId: `staging-hybrid-upload-${nonce}`,
  };
  const upload = await ownerRequest.post('/api/uploadEvidence', {
    headers: { 'x-csrf-token': ownerLogin.csrfToken },
    data: uploadCommand,
  });
  expect(upload.status()).toBe(200);
  const accepted = await upload.json();
  expect(accepted).toMatchObject({
    uploadStatus: 'VERIFIED',
    backupStatus: 'PENDING',
    duplicate: false,
    message: '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
  });

  const duplicate = await ownerRequest.post('/api/uploadEvidence', {
    headers: { 'x-csrf-token': ownerLogin.csrfToken },
    data: {
      ...uploadCommand,
      clientRequestId: `staging-hybrid-duplicate-${nonce}`,
    },
  });
  expect(duplicate.status()).toBe(200);
  await expect(duplicate.json()).resolves.toMatchObject({
    evidenceId: accepted.evidenceId,
    duplicate: true,
  });

  await expect
    .poll(
      async () => {
        await ownerRequest.post('/api/owner/evidence/process', {
          headers: { 'x-csrf-token': ownerLogin.csrfToken },
          data: { evidenceId: accepted.evidenceId, limit: 1 },
        });
        const statusResponse = await ownerRequest.post('/api/owner/evidence/status', {
          data: { evidenceId: accepted.evidenceId },
        });
        expect(statusResponse.status()).toBe(200);
        return (await statusResponse.json()).selectedEvidence;
      },
      { timeout: 30_000 },
    )
    .toMatchObject({
      evidenceId: accepted.evidenceId,
      status: 'SYNCED',
      hasVerifiedDriveCopy: true,
    });

  const unauthorized = await apiRequest.newContext({ baseURL });
  const deniedStatus = await unauthorized.post('/api/owner/evidence/status', {
    data: { evidenceId: accepted.evidenceId },
  });
  expect(deniedStatus.status()).toBe(401);
  const deniedRestore = await unauthorized.post('/api/owner/evidence/restore', {
    data: {
      evidenceId: accepted.evidenceId,
      reason: 'Synthetic unauthorized restore denial',
    },
  });
  expect(deniedRestore.status()).toBe(401);
  await unauthorized.dispose();

  const archived = await ownerRequest.post('/api/owner/evidence/archive', {
    headers: { 'x-csrf-token': ownerLogin.csrfToken },
    data: {
      evidenceId: accepted.evidenceId,
      reason: 'Synthetic Phase 16 staging acceptance cleanup',
    },
  });
  expect(archived.status()).toBe(200);
  await expect(archived.json()).resolves.toMatchObject({
    evidenceId: accepted.evidenceId,
    status: 'ARCHIVED',
    primaryCopyRetained: true,
    driveCopyRetained: true,
  });
});

test('deployed staging proves the shared Release Desk path, projections, and protected System Status', async ({
  page,
}) => {
  const eventId = releaseFixtureId('HAU_STAGING_RELEASE_EVENT_ID');
  const itemId = releaseFixtureId('HAU_STAGING_RELEASE_ITEM_ID');
  const owner = await ownerCredential();
  const ownerRequest = page.context().request;
  const ownerLogin = await login(ownerRequest, owner.accessId, owner.password);
  expect(ownerLogin.state).toBe('AUTHENTICATED');
  expect(ownerLogin.user.authorization.roleId).toBe('SYSTEM_OWNER');

  const scope = `EVENT:${eventId}`;
  const encodedScope = encodeURIComponent(scope);
  const requestProjectionResponse = await ownerRequest.get(
    `/api/request?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(requestProjectionResponse.status()).toBe(200);
  const requestProjection = (await requestProjectionResponse.json()).data;
  const event = requestProjection.events.find((entry) => entry.id === eventId);
  expect(event).toMatchObject({ id: eventId, status: 'ACTIVE' });

  const inventoryBeforeResponse = await ownerRequest.get(
    `/api/inventory?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(inventoryBeforeResponse.status()).toBe(200);
  const inventoryBefore = (await inventoryBeforeResponse.json()).data.inventoryItems.find(
    (entry) => entry.id === itemId,
  );
  expect(inventoryBefore).toBeTruthy();
  expect(inventoryBefore.status).toBe('ACTIVE');
  expect(inventoryBefore.availableToPromise).toBeGreaterThanOrEqual(2);

  const nonce = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const submitted = await mutate(ownerRequest, ownerLogin.csrfToken, 'submitRequest', {
    clientRequestId: `staging-release-submit-${nonce}`,
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: event.seriesId,
    eventId,
    purpose: `Synthetic shared Release Desk acceptance ${nonce}`,
    department: 'Department of Logistics',
    lines: [
      {
        clientLineId: `staging-release-line-${nonce}`,
        itemId,
        description: 'Synthetic staging Release Desk fixture',
        quantity: 2,
        unit: inventoryBefore.unit,
        fulfillmentSource: 'ISSUE_FROM_STOCK',
      },
    ],
  });
  expect(submitted.status()).toBe(200);
  const requestId = (await submitted.json()).requestId;

  const reviewed = await mutate(ownerRequest, ownerLogin.csrfToken, 'reviewRequest', {
    requestId,
    decision: 'ACCEPT',
    note: 'Authorized synthetic Phase 16 staging acceptance.',
    clientRequestId: `staging-release-review-${nonce}`,
  });
  expect(reviewed.status()).toBe(200);

  const readyProjectionResponse = await ownerRequest.get(
    `/api/releases?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(readyProjectionResponse.status()).toBe(200);
  const readyProjection = (await readyProjectionResponse.json()).data;
  const requestLine = readyProjection.requestLines.find((entry) => entry.requestId === requestId);
  expect(requestLine).toMatchObject({
    requestId,
    eventId,
    itemId,
    quantity: 2,
    status: 'READY_TO_RESERVE',
  });

  const reservationCommand = {
    itemId,
    requestLineId: requestLine.id,
    quantity: 2,
    clientRequestId: `staging-release-reserve-${nonce}`,
  };
  const reserved = await mutate(ownerRequest, ownerLogin.csrfToken, 'reserveStock', reservationCommand);
  expect(reserved.status()).toBe(200);
  const reservationId = (await reserved.json()).reservationId;
  const reservationReplay = await mutate(
    ownerRequest,
    ownerLogin.csrfToken,
    'reserveStock',
    reservationCommand,
  );
  expect(reservationReplay.status()).toBe(200);
  await expect(reservationReplay.json()).resolves.toMatchObject({ reservationId });

  const evidenceBytes = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...Buffer.from(`staging-release-evidence-${nonce}`),
  ]);
  const uploaded = await mutate(ownerRequest, ownerLogin.csrfToken, 'uploadEvidence', {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    originalFileName: `synthetic-release-${nonce}.png`,
    mimeType: 'image/png',
    base64: evidenceBytes.toString('base64'),
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: requestId,
    requestId,
    clientRequestId: `staging-release-evidence-${nonce}`,
  });
  expect(uploaded.status()).toBe(200);
  const evidence = await uploaded.json();
  expect(evidence).toMatchObject({
    uploadStatus: 'VERIFIED',
    backupStatus: 'PENDING',
    message: '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
  });

  const recipient = {
    recipientConfirmed: true,
    recipientName: 'Synthetic Phase 16 Recipient',
    recipientRole: 'Authorized staging acceptance',
    department: 'Department of Logistics',
    evidenceId: evidence.evidenceId,
  };
  const partialCommand = {
    requestId,
    ...recipient,
    lines: [{ requestLineId: requestLine.id, quantity: 1 }],
    clientRequestId: `staging-release-partial-${nonce}`,
  };
  const partial = await mutate(ownerRequest, ownerLogin.csrfToken, 'confirmRelease', partialCommand);
  expect(partial.status()).toBe(200);
  const partialResult = await partial.json();
  expect(partialResult).toMatchObject({ status: 'PARTIAL', recipientConfirmed: true });
  const partialReplay = await mutate(ownerRequest, ownerLogin.csrfToken, 'confirmRelease', partialCommand);
  expect(partialReplay.status()).toBe(200);
  await expect(partialReplay.json()).resolves.toMatchObject({ releaseId: partialResult.releaseId });

  const afterPartialResponse = await ownerRequest.get(
    `/api/releases?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(afterPartialResponse.status()).toBe(200);
  const afterPartial = (await afterPartialResponse.json()).data;
  expect(afterPartial.releaseConfirmations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: partialResult.releaseId,
        requestId,
        eventId,
        recipientName: recipient.recipientName,
        recipientRole: recipient.recipientRole,
        department: recipient.department,
        evidenceId: evidence.evidenceId,
        status: 'PARTIAL',
        lineReleases: [
          expect.objectContaining({
            requestLineId: requestLine.id,
            itemId,
            quantity: 1,
            status: 'PARTIAL',
          }),
        ],
      }),
    ]),
  );

  const completeCommand = {
    ...partialCommand,
    clientRequestId: `staging-release-complete-${nonce}`,
  };
  const completed = await mutate(ownerRequest, ownerLogin.csrfToken, 'confirmRelease', completeCommand);
  expect(completed.status()).toBe(200);
  const completedResult = await completed.json();
  expect(completedResult).toMatchObject({ status: 'COMPLETED', recipientConfirmed: true });
  const completedReplay = await mutate(ownerRequest, ownerLogin.csrfToken, 'confirmRelease', completeCommand);
  expect(completedReplay.status()).toBe(200);
  await expect(completedReplay.json()).resolves.toMatchObject({
    releaseId: completedResult.releaseId,
  });

  const correctionCommand = {
    releaseConfirmationId: completedResult.releaseId,
    quantity: 1,
    reason: 'Synthetic Phase 16 correction and compensating-ledger proof.',
    evidenceId: evidence.evidenceId,
    correctionConfirmed: true,
    operationalScope: scope,
    activeWorkspace: 'inventory',
    clientRequestId: `staging-release-correction-${nonce}`,
  };
  const corrected = await mutate(ownerRequest, ownerLogin.csrfToken, 'correctRelease', correctionCommand);
  expect(corrected.status()).toBe(200);
  const correction = await corrected.json();
  expect(correction).toMatchObject({
    releaseId: completedResult.releaseId,
    releaseConfirmationId: completedResult.releaseId,
    quantity: 1,
    status: 'POSTED',
    lineStatus: 'PARTIALLY_RELEASED',
  });
  const correctionReplay = await mutate(
    ownerRequest,
    ownerLogin.csrfToken,
    'correctRelease',
    correctionCommand,
  );
  expect(correctionReplay.status()).toBe(200);
  await expect(correctionReplay.json()).resolves.toMatchObject({
    correctionId: correction.correctionId,
  });

  const finalReleaseCommand = {
    ...partialCommand,
    clientRequestId: `staging-release-final-${nonce}`,
  };
  const finalRelease = await mutate(
    ownerRequest,
    ownerLogin.csrfToken,
    'confirmRelease',
    finalReleaseCommand,
  );
  expect(finalRelease.status()).toBe(200);
  const finalReleaseResult = await finalRelease.json();
  expect(finalReleaseResult).toMatchObject({ status: 'COMPLETED', recipientConfirmed: true });

  const finalProjectionResponse = await ownerRequest.get(
    `/api/releases?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(finalProjectionResponse.status()).toBe(200);
  const finalProjection = (await finalProjectionResponse.json()).data;
  expect(finalProjection.requests.find((entry) => entry.id === requestId)).toMatchObject({
    id: requestId,
    eventId,
    status: 'COMPLETED',
  });
  expect(finalProjection.requestLines.find((entry) => entry.id === requestLine.id)).toMatchObject({
    id: requestLine.id,
    releasedQuantity: 2,
    status: 'COMPLETED',
  });
  expect(finalProjection.releaseConfirmations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: partialResult.releaseId,
        status: 'PARTIAL',
        recipientName: recipient.recipientName,
        evidenceId: evidence.evidenceId,
      }),
      expect.objectContaining({
        id: completedResult.releaseId,
        status: 'COMPLETED',
        correctedQuantity: 1,
        correctableQuantity: 0,
        corrections: [
          expect.objectContaining({
            id: correction.correctionId,
            evidenceId: evidence.evidenceId,
            transactionId: correction.transactionId,
            status: 'POSTED',
          }),
        ],
      }),
      expect.objectContaining({
        id: finalReleaseResult.releaseId,
        status: 'COMPLETED',
        recipientName: recipient.recipientName,
        evidenceId: evidence.evidenceId,
      }),
    ]),
  );

  const inventoryAfterResponse = await ownerRequest.get(
    `/api/inventory?operationalScope=${encodedScope}&pageSize=50`,
  );
  expect(inventoryAfterResponse.status()).toBe(200);
  const inventoryAfter = (await inventoryAfterResponse.json()).data;
  const itemAfter = inventoryAfter.inventoryItems.find((entry) => entry.id === itemId);
  expect(itemAfter.onHand).toBe(inventoryBefore.onHand - 2);
  expect(itemAfter.reserved).toBe(inventoryBefore.reserved);
  const ledger = inventoryAfter.ledgerTransactions;
  const relevantIssues = ledger.filter((entry) =>
    [partialResult.releaseId, completedResult.releaseId, finalReleaseResult.releaseId].includes(
      entry.relatedId,
    ),
  );
  expect(relevantIssues).toHaveLength(3);
  const correctedIssue = relevantIssues.find((entry) => entry.relatedId === completedResult.releaseId);
  expect(correctedIssue).toBeTruthy();
  expect(ledger).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'RELEASE_CORRECTION',
        direction: 'REVERSAL',
        relatedId: correction.correctionId,
        reversalOf: correctedIssue.id,
        quantity: 1,
      }),
    ]),
  );

  const backupInitially = await ownerRequest.post('/api/owner/evidence/status', {
    data: { evidenceId: evidence.evidenceId },
  });
  expect(backupInitially.status()).toBe(200);
  await expect(backupInitially.json()).resolves.toMatchObject({
    selectedEvidence: {
      evidenceId: evidence.evidenceId,
      status: expect.stringMatching(/^(PENDING|IN_PROGRESS|RETRYING|SYNCED)$/u),
    },
  });

  await expect
    .poll(
      async () => {
        await ownerRequest.post('/api/owner/evidence/process', {
          headers: { 'x-csrf-token': ownerLogin.csrfToken },
          data: { evidenceId: evidence.evidenceId, limit: 1 },
        });
        const statusResponse = await ownerRequest.post('/api/owner/evidence/status', {
          data: { evidenceId: evidence.evidenceId },
        });
        expect(statusResponse.status()).toBe(200);
        return (await statusResponse.json()).selectedEvidence;
      },
      { timeout: 30_000 },
    )
    .toMatchObject({
      evidenceId: evidence.evidenceId,
      status: 'SYNCED',
      hasVerifiedDriveCopy: true,
    });

  await page.goto('/app/admin');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('[data-admin-view="referenceAdmin"]').click();
  const systemStatusControl = page.locator('[data-admin-control-surface="system-status"]');
  await expect(systemStatusControl).toBeVisible();
  await systemStatusControl.click();
  const systemStatus = page.locator('[data-system-status]');
  await expect(systemStatus).toBeVisible();
  await expect(systemStatus.locator('[data-system-status-metrics] .metric')).toHaveCount(7);
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Primary R2 status');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Pending Drive backups');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Failed backups');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Oldest pending backup');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Last successful backup');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText('Last reconciliation');
  await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText(
    'Files requiring restoration',
  );
  await expect(systemStatus.locator('[data-system-status-technical-details]')).toContainText(
    'Identifier protection',
  );
  await expect(systemStatus).not.toContainText(eventId);
  await expect(systemStatus).not.toContainText(itemId);
  await expect(systemStatus).not.toContainText(evidence.evidenceId);

  const archived = await ownerRequest.post('/api/owner/evidence/archive', {
    headers: { 'x-csrf-token': ownerLogin.csrfToken },
    data: {
      evidenceId: evidence.evidenceId,
      reason: 'Synthetic Phase 16 shared Release Desk acceptance archive',
    },
  });
  expect(archived.status()).toBe(200);
  await expect(archived.json()).resolves.toMatchObject({
    evidenceId: evidence.evidenceId,
    status: 'ARCHIVED',
    primaryCopyRetained: true,
    driveCopyRetained: true,
  });
});
