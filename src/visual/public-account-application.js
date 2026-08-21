import { AppError } from '../app/errors.js';
import { brandLockupMarkup } from './brand-assets.js';
import { attachPasswordVisibilityControls, passwordFieldMarkup } from './password-visibility.js';
import { releaseIdentityMarkup } from './portal-navigation.js';

const APPLICATION_STATES_WITHDRAWABLE = new Set([
  'EMAIL_UNVERIFIED',
  'DRAFT',
  'PENDING_ADMIN_REVIEW',
  'CHANGES_REQUESTED',
  'PENDING_DIRECTOR_APPROVAL',
  'APPROVED_ACTIVATION_REQUIRED',
]);

const ACCESS_PRESETS = Object.freeze([
  Object.freeze({
    id: 'REQUESTER_ONLY',
    label: 'Requester only',
    roleId: 'REQUESTER',
    committeeIds: [],
    workspaceIds: [],
    internalLendingOperations: false,
  }),
  Object.freeze({
    id: 'FOOD_OPERATOR',
    label: 'Food Committee staff',
    roleId: 'DOL_STAFF',
    committeeIds: ['COM_FOOD'],
    workspaceIds: ['food'],
    internalLendingOperations: false,
  }),
  Object.freeze({
    id: 'INVENTORY_OPERATOR',
    label: 'Inventory and Pantry staff',
    roleId: 'DOL_STAFF',
    committeeIds: ['COM_INVENTORY_PANTRY'],
    workspaceIds: ['inventory-pantry'],
    internalLendingOperations: false,
  }),
  Object.freeze({
    id: 'MATERIALS_OPERATOR',
    label: 'Materials Committee staff',
    roleId: 'DOL_STAFF',
    committeeIds: ['COM_MATERIALS'],
    workspaceIds: ['materials'],
    internalLendingOperations: false,
  }),
  Object.freeze({
    id: 'LENDING_STAFF',
    label: 'Internal Lending staff',
    roleId: 'DOL_STAFF',
    committeeIds: ['COM_INVENTORY_PANTRY'],
    workspaceIds: ['inventory-pantry'],
    internalLendingOperations: true,
  }),
]);

const STATE_LABELS = Object.freeze({
  PENDING_ADMIN_REVIEW: 'Awaiting Administrator review',
  CHANGES_REQUESTED: 'Changes requested',
  PENDING_DIRECTOR_APPROVAL: 'Awaiting Director approval',
  APPROVED_ACTIVATION_REQUIRED: 'Approved — activation required',
  ACTIVE: 'Account active',
  REJECTED: 'Application rejected',
  WITHDRAWN: 'Application withdrawn',
  EXPIRED: 'Application expired',
  ARCHIVED: 'Application archived',
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeError(error) {
  if (!(error instanceof AppError)) {
    return 'The account-application service is temporarily unavailable.';
  }
  const suggestions = Array.isArray(error.details?.usernameSuggestions)
    ? error.details.usernameSuggestions.filter((value) => typeof value === 'string').slice(0, 3)
    : [];
  return suggestions.length ? `${error.message} Try ${suggestions.join(', ')}.` : error.message;
}

const requestId = (prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`;

function setBusy(form, busy) {
  form.querySelectorAll('input, select, textarea, button').forEach((control) => {
    control.disabled = busy;
  });
  form.setAttribute('aria-busy', String(busy));
}

function passwordField({ id, name, label }) {
  return passwordFieldMarkup({ id, name, label, autocomplete: 'new-password', minlength: '12' });
}

function shellMarkup({ title, intro, body, wide = true }) {
  return `<section class="auth-card ${wide ? 'account-application-card' : ''}" aria-labelledby="accountApplicationTitle">
    <div class="auth-brand-lockup">
      ${brandLockupMarkup({ compact: true })}
      <span><strong>University Student Council</strong><small>Department of Logistics</small></span>
    </div>
    <p class="eyebrow">Production access</p>
    <h1 id="accountApplicationTitle">${escapeHtml(title)}</h1>
    ${releaseIdentityMarkup()}
    <p class="auth-intro">${escapeHtml(intro)}</p>
    ${body}
    <nav class="account-application-links" aria-label="Account access links">
      <a href="/login">Staff sign in</a>
      <a href="/register">Create staff account</a>
      <a href="/application-status">Check application status</a>
    </nav>
  </section>`;
}

function alertMarkup(message, kind = 'error') {
  return message
    ? `<div class="auth-alert account-application-alert-${kind}" role="${kind === 'error' ? 'alert' : 'status'}">${escapeHtml(message)}</div>`
    : '';
}

function applicationFieldsMarkup({ resubmission = false } = {}) {
  return `<div class="account-application-progress" aria-label="Application steps">
      <span class="complete">Email verified</span><span class="current">Identity and access</span><span>Review</span>
    </div>
    <div class="auth-form-grid">
      <label>Full legal name<input name="legalName" autocomplete="name" maxlength="200" required></label>
      <label>Contact number<input name="contactNumber" autocomplete="tel" maxlength="24" required></label>
      <label>USC department ID<input name="departmentId" maxlength="128" required spellcheck="false"></label>
      <label>Course ID<input name="courseId" maxlength="128" required spellcheck="false"></label>
      <label>Year level<select name="yearLevel" required>
        <option value="">Select year</option>
        ${Array.from({ length: 10 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}
      </select></label>
      <label>Requested username<input name="requestedUsername" autocomplete="username" minlength="4" maxlength="32" pattern="[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){2,30}[a-z0-9]" required spellcheck="false" aria-describedby="applicationUsernameHelp"></label>
    </div>
    <small id="applicationUsernameHelp">Use 4–32 lowercase letters or numbers, with single dots, underscores, or hyphens between them.</small>
    <fieldset class="account-application-fieldset">
      <legend>Requested access</legend>
      <label>Access preset<select name="accessPreset" required>
        ${ACCESS_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join('')}
      </select></label>
      <label class="account-application-check"><input name="lendingSelfService" type="checkbox"> Request Lending self-service</label>
      <label class="account-application-check"><input name="requestCenterAccess" type="checkbox" checked> Request Center access</label>
      <small>This form requests access only. Administrator and Director review determine the effective role and scope.</small>
    </fieldset>
    <div class="auth-form-grid account-application-password-grid">
      <div>${passwordField({ id: resubmission ? 'resubmitPassword' : 'applicationPassword', name: 'password', label: 'Password' })}</div>
      <div>${passwordField({ id: resubmission ? 'resubmitConfirmPassword' : 'applicationConfirmPassword', name: 'confirmPassword', label: 'Confirm password' })}</div>
    </div>
    <small>Use 12–128 characters and at least three character types. Reviewers never see your password.</small>
    <label class="account-application-check account-application-acknowledgment">
      <input name="acknowledged" type="checkbox" required>
      I confirm these details are accurate and accept the privacy and acceptable-use requirements.
    </label>`;
}

function commandFromForm(form, extras = {}) {
  const values = new FormData(form);
  const preset = ACCESS_PRESETS.find((entry) => entry.id === values.get('accessPreset'));
  if (!preset) throw new AppError('ACCOUNT_APPLICATION_INVALID', 'Select a valid requested access preset.');
  return {
    legalName: values.get('legalName'),
    contactNumber: values.get('contactNumber'),
    departmentId: values.get('departmentId'),
    courseId: values.get('courseId'),
    yearLevel: Number(values.get('yearLevel')),
    requestedUsername: values.get('requestedUsername'),
    requestedAccountType: preset.id,
    requestedRoleId: preset.roleId,
    requestedCommitteeIds: preset.committeeIds,
    requestedWorkspaceIds: preset.workspaceIds,
    lendingSelfService: values.get('lendingSelfService') === 'on',
    internalLendingOperations: preset.internalLendingOperations,
    requestCenterAccess: values.get('requestCenterAccess') === 'on',
    password: values.get('password'),
    confirmPassword: values.get('confirmPassword'),
    ...extras,
  };
}

export function consumeApplicationStatusToken({
  locationValue = globalThis.location,
  historyValue = globalThis.history,
} = {}) {
  const fragment = String(locationValue?.hash ?? '').replace(/^#/u, '');
  const token = new URLSearchParams(fragment).get('token') ?? '';
  if (fragment && historyValue?.replaceState) {
    historyValue.replaceState(
      historyValue.state ?? null,
      '',
      `${locationValue.pathname ?? '/application-status'}${locationValue.search ?? ''}`,
    );
  }
  return /^[A-Za-z0-9_-]{20,512}$/u.test(token) ? token : '';
}

export function privateStatusUrl(statusToken, locationValue = globalThis.location) {
  const origin = String(locationValue?.origin ?? '').replace(/\/$/u, '');
  return `${origin}/application-status#token=${encodeURIComponent(statusToken)}`;
}

function registrationReceiptMarkup(result, statusUrl) {
  return shellMarkup({
    title: 'Application submitted',
    intro:
      'Save the private status link now. The status token is shown only in this receipt and cannot be recovered.',
    body: `<div class="account-application-receipt" role="status">
      <p><span>Application reference</span><strong>${escapeHtml(result.applicationCode)}</strong></p>
      <p><span>Current status</span><strong>${escapeHtml(STATE_LABELS[result.state] ?? result.state)}</strong></p>
      <p><span>Next step</span><strong>${escapeHtml(result.nextStep)}</strong></p>
      <label for="privateStatusLink">Private status link</label>
      <textarea id="privateStatusLink" rows="3" readonly data-private-status-link>${escapeHtml(statusUrl)}</textarea>
      <button type="button" class="secondary" data-copy-private-link>Copy private status link</button>
      <details><summary>Show the one-time status token</summary><code data-private-status-token>${escapeHtml(result.statusToken)}</code></details>
      <p class="auth-help">Store this link in a secure password manager. Do not send it through public chat or place it in a shared document.</p>
      <p class="account-application-copy-status" data-copy-status aria-live="polite"></p>
    </div>`,
  });
}

function attachReceiptControls(root) {
  const button = root.querySelector('[data-copy-private-link]');
  const value = root.querySelector('[data-private-status-link]')?.value ?? '';
  const status = root.querySelector('[data-copy-status]');
  button?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = 'Private status link copied. Store it securely.';
    } catch {
      status.textContent = 'Copy was unavailable. Select the link and copy it manually.';
    }
  });
}

function mountRegistration({ root, client }) {
  let verifiedEmail = '';
  let verificationReceipt = '';

  const renderEmail = (error = '') => {
    root.innerHTML = shellMarkup({
      title: 'Create staff account',
      intro:
        'Verify an owner-approved institutional or HAU-USC address. Verification confirms email ownership; it does not grant staff access.',
      body: `${alertMarkup(error)}
        <div class="account-application-progress" aria-label="Application steps"><span class="current">Verify email</span><span>Identity and access</span><span>Review</span></div>
        <form class="auth-form" data-application-email-start>
          <label for="applicationEmail">Approved email address</label>
          <input id="applicationEmail" name="email" type="email" autocomplete="email" maxlength="254" required>
          <small>For privacy, the response is the same whether or not an address is already known.</small>
          <button class="primary" type="submit">Send verification code</button>
        </form>`,
    });
    const form = root.querySelector('[data-application-email-start]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      verifiedEmail = String(values.get('email') ?? '').trim();
      setBusy(form, true);
      try {
        await client.startAccountApplicationEmail(verifiedEmail);
        renderCode();
      } catch (nextError) {
        renderEmail(safeError(nextError));
      }
    });
  };

  const renderCode = (error = '') => {
    root.innerHTML = shellMarkup({
      title: 'Enter verification code',
      intro:
        'If the address is eligible and delivery is configured, enter the exact 8-digit code sent to that address.',
      body: `${alertMarkup(error)}
       <div class="account-application-progress" aria-label="Application steps"><span class="current">Verify email</span><span>Identity and access</span><span>Review</span></div>
       <form class="auth-form" data-application-email-confirm>
         <label for="applicationCode">Verification code</label>
          <input id="applicationCode" name="code" inputmode="numeric" pattern="\\d{8}" autocomplete="one-time-code" minlength="8" maxlength="8" required spellcheck="false" aria-describedby="applicationCodeHelp">
          <small id="applicationCodeHelp">Enter all 8 digits. A leading zero is part of the code.</small>
         <button class="primary" type="submit">Confirm email</button>
          <button class="auth-text-button" type="button" data-use-different-email>Use a different email</button>
        </form>`,
    });
    root.querySelector('[data-use-different-email]')?.addEventListener('click', () => renderEmail());
    const form = root.querySelector('[data-application-email-confirm]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      setBusy(form, true);
      try {
        const confirmed = await client.confirmAccountApplicationEmail(verifiedEmail, values.get('code'));
        verificationReceipt = confirmed.verificationReceipt;
        renderApplication();
      } catch (nextError) {
        renderCode(safeError(nextError));
      }
    });
  };

  const renderApplication = (error = '') => {
    root.innerHTML = shellMarkup({
      title: 'Staff account application',
      intro: `Email verified for this application session. Complete the identity, credential, and requested-access details.`,
      body: `${alertMarkup(error)}<form class="auth-form" data-account-application-form>
        ${applicationFieldsMarkup()}
        <button class="primary" type="submit">Review and submit application</button>
      </form>`,
    });
    attachPasswordVisibilityControls(root);
    const form = root.querySelector('[data-account-application-form]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      let command;
      try {
        command = commandFromForm(form, {
          verificationReceipt,
          clientRequestId: requestId('application-submit'),
        });
      } catch (nextError) {
        renderApplication(safeError(nextError));
        return;
      }
      setBusy(form, true);
      try {
        const result = await client.submitAccountApplication(command);
        const statusUrl = privateStatusUrl(result.statusToken);
        verificationReceipt = '';
        root.innerHTML = registrationReceiptMarkup(result, statusUrl);
        attachReceiptControls(root);
      } catch (nextError) {
        renderApplication(safeError(nextError));
      }
    });
  };

  renderEmail();
}

function statusDetailMarkup(result) {
  return `<div class="account-application-status-card" role="status">
    <p><span>Application reference</span><strong>${escapeHtml(result.applicationCode)}</strong></p>
    <p><span>Current status</span><strong>${escapeHtml(STATE_LABELS[result.state] ?? result.state)}</strong></p>
    <p><span>Last updated</span><strong>${escapeHtml(result.updatedAt ?? result.submittedAt ?? '')}</strong></p>
    <p><span>Next step</span><strong>${escapeHtml(result.nextStep)}</strong></p>
    ${result.changeRequestSummary ? `<div class="account-application-change-summary"><strong>Requested changes</strong><p>${escapeHtml(result.changeRequestSummary)}</p></div>` : ''}
    ${result.accountCode ? `<p><span>Account code</span><strong>${escapeHtml(result.accountCode)}</strong></p>` : ''}
  </div>`;
}

function mountStatus({ root, client, initialStatusToken = '' }) {
  let statusToken = initialStatusToken;
  let current = null;

  const renderTokenEntry = (error = '') => {
    root.innerHTML = shellMarkup({
      title: 'Check application status',
      intro:
        'Paste the private status token from your saved application receipt. It stays in this page memory and is never placed in a query string.',
      body: `${alertMarkup(error)}<form class="auth-form" data-status-token-form>
        <label for="applicationStatusToken">Private status token</label>
        <input id="applicationStatusToken" name="statusToken" type="password" autocomplete="off" minlength="20" maxlength="512" required spellcheck="false">
        <button class="primary" type="submit">Check status</button>
      </form>`,
    });
    const form = root.querySelector('[data-status-token-form]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusToken = String(new FormData(form).get('statusToken') ?? '').trim();
      await loadStatus();
    });
  };

  const renderStatus = (error = '') => {
    const changeForm =
      current?.state === 'CHANGES_REQUESTED'
        ? `<form class="auth-form account-application-resubmit" data-resubmit-form>
            <h2>Submit corrected details</h2>
            <p>Re-enter the complete application. The verified email and private status token remain bound to this application.</p>
            ${applicationFieldsMarkup({ resubmission: true })}
            <button class="primary" type="submit">Resubmit for Administrator review</button>
          </form>`
        : '';
    const withdrawForm = APPLICATION_STATES_WITHDRAWABLE.has(current?.state)
      ? `<details class="account-application-withdraw"><summary>Withdraw this application</summary>
          <form class="auth-form" data-withdraw-form>
            <label for="withdrawReason">Reason</label>
            <textarea id="withdrawReason" name="reason" minlength="8" maxlength="500" required></textarea>
            <button class="danger" type="submit">Withdraw application</button>
          </form>
        </details>`
      : '';
    root.innerHTML = shellMarkup({
      title: 'Application status',
      intro:
        'This view is private to the saved status token. Reviewer identities and internal evidence are not exposed.',
      body: `${alertMarkup(error)}${statusDetailMarkup(current)}${changeForm}${withdrawForm}`,
    });
    attachPasswordVisibilityControls(root);
    const resubmitForm = root.querySelector('[data-resubmit-form]');
    resubmitForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      let command;
      try {
        command = commandFromForm(resubmitForm, {
          expectedRevision: current.revision,
          clientRequestId: requestId('application-resubmit'),
        });
      } catch (nextError) {
        renderStatus(safeError(nextError));
        return;
      }
      setBusy(resubmitForm, true);
      try {
        current = await client.submitAccountApplication(command, statusToken);
        renderStatus();
      } catch (nextError) {
        renderStatus(safeError(nextError));
      }
    });
    const withdrawFormNode = root.querySelector('[data-withdraw-form]');
    withdrawFormNode?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const reason = new FormData(withdrawFormNode).get('reason');
      setBusy(withdrawFormNode, true);
      try {
        current = await client.withdrawAccountApplication(statusToken, {
          expectedRevision: current.revision,
          reason,
          clientRequestId: requestId('application-withdraw'),
        });
        renderStatus();
      } catch (nextError) {
        renderStatus(safeError(nextError));
      }
    });
  };

  async function loadStatus() {
    if (!statusToken) {
      renderTokenEntry();
      return;
    }
    try {
      current = await client.getAccountApplicationStatus(statusToken);
      renderStatus();
    } catch (error) {
      statusToken = '';
      renderTokenEntry(safeError(error));
    }
  }

  void loadStatus();
}

export function mountPublicAccountApplication({ root, client, mode = 'register', initialStatusToken = '' }) {
  if (mode === 'status') {
    mountStatus({ root, client, initialStatusToken });
    return;
  }
  mountRegistration({ root, client });
}
