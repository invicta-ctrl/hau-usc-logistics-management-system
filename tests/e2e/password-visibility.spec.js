import { expect, test } from '@playwright/test';
import {
  STAGING,
  installV5ApiFixture,
  integrationStatus,
  waitForV5,
} from './v5-current-application-fixtures.js';

function oneFocusedBrowser(testInfo) {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One focused mobile browser proves password control semantics.',
  );
}

async function expectTogglePreservesValue({ form, input, toggle, value, keyboard = 'Enter' }) {
  await expect(input).toHaveAttribute('type', 'password');
  await expect(toggle).toHaveAttribute('type', 'button');
  await expect(toggle).toHaveAttribute('aria-controls', await input.getAttribute('id'));
  await form.evaluate((element) => {
    element.dataset.passwordToggleSubmitCount = '0';
    element.addEventListener('submit', (event) => {
      event.preventDefault();
      element.dataset.passwordToggleSubmitCount = String(
        Number(element.dataset.passwordToggleSubmitCount ?? '0') + 1,
      );
    });
  });
  await input.fill(value);
  await input.evaluate((element) => element.setSelectionRange(2, Math.min(8, element.value.length)));
  await toggle.press(keyboard);
  await expect(input).toHaveAttribute('type', 'text');
  await expect(input).toHaveValue(value);
  await expect(toggle).toHaveAccessibleName('Hide password');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await input.evaluate((element) => [element.selectionStart, element.selectionEnd])).toEqual([
    2,
    Math.min(8, value.length),
  ]);
  await toggle.press('Space');
  await expect(input).toHaveAttribute('type', 'password');
  await expect(input).toHaveValue(value);
  await expect(toggle).toHaveAccessibleName('Show password');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(form).toHaveAttribute('data-password-toggle-submit-count', '0');
}

test('legacy shared password controls retain form and password-manager semantics across login, application, and profile', async ({
  page,
}, testInfo) => {
  oneFocusedBrowser(testInfo);
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/');
  await page.evaluate(async () => {
    const { attachPasswordVisibilityControls, passwordFieldMarkup } =
      await import('/visual/password-visibility.js');
    const form = (attributes, fields) => {
      const node = document.createElement('form');
      Object.assign(node, attributes);
      node.innerHTML = fields.map((definition) => passwordFieldMarkup(definition)).join('');
      return node;
    };
    const login = form({ id: 'authLoginForm', autocomplete: 'on' }, [
      { id: 'legacy-login-password', name: 'password', autocomplete: 'current-password' },
    ]);
    const application = form({}, [
      { id: 'legacy-application-password', name: 'password', autocomplete: 'new-password' },
      {
        id: 'legacy-application-confirm-password',
        name: 'confirmPassword',
        label: 'Confirm password',
        autocomplete: 'new-password',
      },
    ]);
    application.dataset.accountApplicationForm = '';
    const profile = form({}, [
      {
        id: 'legacy-profile-username-password',
        name: 'currentPassword',
        label: 'Current password',
        autocomplete: 'current-password',
      },
      {
        id: 'legacy-profile-current-password',
        name: 'currentPassword',
        label: 'Current password',
        autocomplete: 'current-password',
      },
      {
        id: 'legacy-profile-new-password',
        name: 'newPassword',
        label: 'New password',
        autocomplete: 'new-password',
      },
      {
        id: 'legacy-profile-confirm-password',
        name: 'confirmPassword',
        label: 'Confirm new password',
        autocomplete: 'new-password',
      },
    ]);
    profile.dataset.profilePasswordForm = '';
    document.body.replaceChildren(login, application, profile);
    attachPasswordVisibilityControls(document);
  });
  const login = page.locator('#authLoginForm');
  const loginPassword = login.getByLabel('Password', { exact: true });
  await expect(loginPassword).toHaveAttribute('name', 'password');
  await expect(loginPassword).toHaveAttribute('autocomplete', 'current-password');
  await expectTogglePreservesValue({
    form: login,
    input: loginPassword,
    toggle: login.locator('[data-password-visibility-toggle]'),
    value: 'Login!Password9472',
  });

  const application = page.locator('[data-account-application-form]');
  const applicationPassword = application.getByLabel('Password', { exact: true });
  await expect(application.getByRole('button', { name: 'Show password' })).toHaveCount(2);
  await expect(applicationPassword).toHaveAttribute('name', 'password');
  await expect(applicationPassword).toHaveAttribute('autocomplete', 'new-password');
  await expectTogglePreservesValue({
    form: application,
    input: applicationPassword,
    toggle: application.locator('[data-password-visibility-toggle]').first(),
    value: 'Application!Password9472',
    keyboard: 'Space',
  });

  const profile = page.locator('[data-profile-password-form]');
  await expect(profile.locator('[data-password-visibility-toggle]')).toHaveCount(4);
  const profilePassword = profile.locator('input[name="currentPassword"]').first();
  await expect(profilePassword).toHaveAttribute('autocomplete', 'current-password');
  await expectTogglePreservesValue({
    form: profile,
    input: profilePassword,
    toggle: profile.locator('[data-password-visibility-toggle]').first(),
    value: 'Profile!Password9472',
  });
});

test('V5 password controls cover static and parity-rendered password surfaces', async ({
  page,
}, testInfo) => {
  oneFocusedBrowser(testInfo);
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.signin');
  await waitForV5(page);

  const signIn = page.locator('.auth-card--signin form');
  const signInPassword = signIn.locator('input[name="p"]');
  await expect(signInPassword).toHaveAttribute('name', 'p');
  await expect(signInPassword).toHaveAttribute('autocomplete', 'current-password');
  await expectTogglePreservesValue({
    form: signIn,
    input: signInPassword,
    toggle: signIn.locator('[data-password-visibility-toggle]'),
    value: 'V5!LoginPassword9472',
  });

  const reset = page.locator('details[data-v5-admin-parity="auth-reset"]');
  await reset.locator('summary').click();
  await expect(reset.locator('.field__password-control')).toHaveCount(2);
  await expect(reset.locator('input[name="password"]')).toHaveAttribute('autocomplete', 'new-password');
  await expect(reset.locator('input[name="confirmPassword"]')).toHaveAttribute(
    'autocomplete',
    'new-password',
  );

  await page.goto('/#/account.profile');
  await expect.poll(async () => (await integrationStatus(page)).currentRoute).toBe('account.profile');
  const staticProfile = page.locator('.profile-grid');
  await expect(staticProfile.locator('.field__password-control')).toHaveCount(2);
  const parityProfile = page.locator('[data-v5-admin-parity="profile"]');
  await expect(parityProfile).toBeVisible();
  await expect(parityProfile.locator('.field__password-control')).toHaveCount(3);
  const currentPassword = parityProfile.locator('input[name="currentPassword"]');
  await expect(currentPassword).toHaveAttribute('autocomplete', 'current-password');
  await expectTogglePreservesValue({
    form: parityProfile.locator('form'),
    input: currentPassword,
    toggle: parityProfile.locator('[data-password-visibility-toggle]').first(),
    value: 'V5!ProfilePassword9472',
    keyboard: 'Space',
  });
  await page.locator('[data-act="toggle-theme"]').first().click();
  await expect(currentPassword).toHaveValue('V5!ProfilePassword9472');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
