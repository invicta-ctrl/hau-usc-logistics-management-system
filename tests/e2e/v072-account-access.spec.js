import { expect, test } from '@playwright/test';

const releaseIdentity = {
  ok: true,
  environment: 'STAGING',
  appVersion: '0.7.2',
  releaseVersion: '0.7.2',
  candidateSha: 'a'.repeat(40),
  database: { schemaVersion: '30', latestMigration: '0030_production_access_and_operations.sql' },
};

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One mobile browser covers this focused access slice.');
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = {
      backendMode: 'rest',
      httpApiBaseUrl: '',
      appEnvironment: 'staging',
    };
  });
  await page.route('**/api/version', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(releaseIdentity) }),
  );
});

test('staff registration verifies email and returns a one-time private status receipt', async ({ page }) => {
  const submitted = [];
  await page.route('**/api/account-applications/email/start', async (route) => {
    submitted.push({ path: 'start', body: await route.request().postDataJSON() });
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, state: 'PENDING' }),
    });
  });
  await page.route('**/api/account-applications/email/confirm', async (route) => {
    submitted.push({ path: 'confirm', body: await route.request().postDataJSON() });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, verificationReceipt: 'verification-receipt-synthetic-001' }),
    });
  });
  await page.route('**/api/account-applications', async (route) => {
    submitted.push({ path: 'submit', body: await route.request().postDataJSON() });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        applicationCode: 'AAP-SYNTHETIC-001',
        state: 'PENDING_ADMIN_REVIEW',
        revision: 2,
        statusToken: 'private-status-token-synthetic-001',
        nextStep: 'WAIT_FOR_ADMINISTRATOR_REVIEW',
      }),
    });
  });

  await page.goto('/');
  await page.evaluate(async () => {
    const { mountPublicAccountApplication } = await import('/visual/public-account-application.js');
    const root = document.createElement('main');
    root.id = 'legacy-account-application-root';
    document.body.replaceChildren(root);
    const post = async (path, body) => {
      const response = await fetch(path, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Synthetic account-application request failed.');
      return response.json();
    };
    mountPublicAccountApplication({
      root,
      client: {
        startAccountApplicationEmail: (email) => post('/api/account-applications/email/start', { email }),
        confirmAccountApplicationEmail: (email, code) =>
          post('/api/account-applications/email/confirm', { email, code }),
        submitAccountApplication: (command) => post('/api/account-applications', command),
      },
    });
  });
  await expect(page.getByRole('heading', { name: 'Create staff account' })).toBeVisible();
  await page.getByLabel('Approved email address').fill('eligible@example.test');
  await page.getByRole('button', { name: 'Send verification code' }).click();
  const code = page.locator('#applicationCode');
  await expect(code).toHaveAttribute('inputmode', 'numeric');
  await expect(code).toHaveAttribute('pattern', '\\d{8}');
  await expect(code).toHaveAttribute('minlength', '8');
  await expect(code).toHaveAttribute('maxlength', '8');
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  await code.fill('01234567');
  await page.getByRole('button', { name: 'Confirm email' }).click();

  const form = page.locator('[data-account-application-form]');
  await form.getByLabel('Full legal name').fill('Synthetic Applicant Name');
  await form.getByLabel('Contact number').fill('+63 917 000 0000');
  await form.getByLabel('USC department ID').fill('USC-DEPT-DOL');
  await form.getByLabel('Course ID').fill('COURSE-SYNTHETIC');
  await form.getByLabel('Year level').selectOption('2');
  await form.getByLabel('Requested username').fill('synthetic.applicant');
  await form.getByLabel('Password', { exact: true }).fill('Applicant!Password9472');
  await form.getByLabel('Confirm password').fill('Applicant!Password9472');
  await form.getByLabel(/I confirm these details/u).check();
  await form.getByRole('button', { name: 'Review and submit application' }).click();

  const receipt = page.locator('.account-application-receipt');
  await expect(receipt).toContainText('AAP-SYNTHETIC-001');
  await expect(receipt).toContainText('secure password manager');
  await expect(receipt.locator('[data-private-status-link]')).toHaveValue(
    /\/application-status#token=private-status-token-synthetic-001$/u,
  );
  expect(submitted[0]).toEqual({ path: 'start', body: { email: 'eligible@example.test' } });
  expect(submitted[1]).toEqual({
    path: 'confirm',
    body: { email: 'eligible@example.test', code: '01234567' },
  });
  expect(submitted[2].body).toMatchObject({
    verificationReceipt: 'verification-receipt-synthetic-001',
    requestedUsername: 'synthetic.applicant',
    departmentId: 'USC-DEPT-DOL',
    requestedRoleId: 'REQUESTER',
  });
  expect(submitted[2].body).not.toHaveProperty('statusToken');
});

test('private application status consumes the fragment before its authorized request', async ({ page }) => {
  const token = 'private-status-token-synthetic-002';
  let observed;
  await page.route('**/api/account-applications/status', async (route) => {
    observed = {
      url: route.request().url(),
      authorization: route.request().headers().authorization,
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        applicationCode: 'AAP-SYNTHETIC-002',
        state: 'CHANGES_REQUESTED',
        revision: 3,
        submittedAt: '2026-08-03T10:00:00.000Z',
        updatedAt: '2026-08-03T11:00:00.000Z',
        nextStep: 'RESUBMIT_CORRECTED_APPLICATION',
        changeRequestSummary: 'Correct the governed affiliation selection.',
      }),
    });
  });

  await page.goto(`/application-status#token=${token}`);
  await expect(page.getByRole('heading', { name: 'Application status' })).toBeVisible();
  await expect(page.locator('.account-application-status-card')).toContainText('AAP-SYNTHETIC-002');
  await expect(page.locator('.account-application-change-summary')).toContainText(
    'Correct the governed affiliation selection.',
  );
  await expect(page.locator('[data-resubmit-form]')).toBeVisible();
  expect(page.url()).not.toContain('#token=');
  expect(observed).toEqual({
    url: 'http://127.0.0.1:4173/api/account-applications/status',
    authorization: `Bearer ${token}`,
  });
});

test('authorized staff can open My Profile and a protected review history', async ({ page }) => {
  await page.goto('/portals');
  await page.evaluate(async () => {
    document.body.innerHTML = '<div id="accountControls"></div>';
    const { createAuthenticatedAccountControlButtons } =
      await import('/visual/authenticated-account-controls.js');
    const profile = {
      accountCode: 'HAU-SYNTHETIC-001',
      username: 'synthetic.reviewer',
      displayName: 'Synthetic Reviewer',
      legalName: 'Synthetic Reviewer',
      verifiedEmail: 'reviewer@example.test',
      contactNumber: '+63 917 000 0001',
      roleId: 'ADMINISTRATOR',
      committeeIds: [],
      affiliation: {
        departmentId: 'USC-DEPT-DOL',
        departmentDisplayName: 'Department of Logistics',
        courseId: 'COURSE-SYNTHETIC',
        yearLevel: 4,
      },
      accessSummary: {
        roleLabel: 'Administrator',
        workspaceIds: ['administrator'],
      },
      avatar: { initials: 'SR' },
    };
    const application = {
      id: 'APP-SYNTHETIC-REVIEW-001',
      applicationCode: 'AAP-SYNTHETIC-REVIEW-001',
      state: 'PENDING_ADMIN_REVIEW',
      revision: 2,
      departmentId: 'USC-DEPT-DOL',
      courseId: 'COURSE-SYNTHETIC',
      yearLevel: 2,
      requestedRoleId: 'REQUESTER',
      requestedUsername: 'synthetic.applicant',
      verifiedEmail: 'applicant@example.test',
      legalName: 'Synthetic Applicant',
      contactNumber: '+63 917 000 0002',
      identityVerification: { rosterMatched: true, legalNameMatched: true },
      requestedAccess: {
        requestedAccountType: 'REQUESTER_ONLY',
        requestedRoleId: 'REQUESTER',
        requestedCommitteeIds: [],
        requestedWorkspaceIds: [],
        lendingSelfService: false,
        internalLendingOperations: false,
      },
      history: [
        {
          fromState: 'DRAFT',
          toState: 'PENDING_ADMIN_REVIEW',
          resultingRevision: 2,
          createdAt: '2026-08-03T10:00:00.000Z',
          reason: 'Submitted for governed review.',
        },
      ],
    };
    const client = {
      getProfile: async () => ({ profile }),
      listAccountApplications: async () => ({ applications: [application] }),
      getAccountApplicationForReview: async () => ({ application }),
    };
    const session = {
      csrfToken: 'synthetic-csrf',
      user: {
        authorization: { capabilities: ['account_application.admin_review'] },
      },
    };
    document
      .querySelector('#accountControls')
      .append(...createAuthenticatedAccountControlButtons({ client, session, onSessionInvalidated() {} }));
  });

  await page.getByRole('button', { name: 'My Profile' }).click();
  const profileDialog = page.getByRole('dialog', { name: 'My Profile' });
  await expect(profileDialog).toContainText('HAU-SYNTHETIC-001');
  await expect(profileDialog).toContainText('Department of Logistics');
  await expect(profileDialog.getByLabel('Initials avatar')).toHaveText('SR');
  await profileDialog.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Account Requests' }).click();
  const reviewDialog = page.getByRole('dialog', { name: 'Account Requests' });
  await expect(reviewDialog).toContainText('AAP-SYNTHETIC-REVIEW-001');
  await reviewDialog.getByRole('button', { name: 'Review application' }).click();
  await expect(reviewDialog).toContainText('applicant@example.test');
  await expect(reviewDialog).toContainText('Application history');
  await expect(reviewDialog).toContainText('Submitted for governed review.');
  await expect(reviewDialog).not.toContainText('synthetic-csrf');
});
