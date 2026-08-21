import { AppError } from '../app/errors.js';
import { attachPasswordVisibilityControls, passwordFieldMarkup } from './password-visibility.js';

const CAPABILITIES = Object.freeze({
  ADMIN_REVIEW: 'account_application.admin_review',
  DIRECTOR_DECIDE: 'account_application.director_decide',
  OWNER_OVERRIDE: 'account_application.owner_override',
});

const REVIEW_ACTIONS = Object.freeze({
  admin: Object.freeze([
    Object.freeze({ id: 'request-changes', label: 'Request changes' }),
    Object.freeze({ id: 'reject', label: 'Reject' }),
    Object.freeze({ id: 'forward', label: 'Forward to Director' }),
  ]),
  director: Object.freeze([
    Object.freeze({ id: 'request-changes', label: 'Request changes' }),
    Object.freeze({ id: 'reject', label: 'Reject' }),
    Object.freeze({ id: 'approve', label: 'Approve and create starter account' }),
  ]),
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const requestId = (prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`;

function safeError(error) {
  return error instanceof AppError ? error.message : 'The secure account service is temporarily unavailable.';
}

function setBusy(form, busy) {
  form.querySelectorAll('input, select, textarea, button').forEach((control) => {
    control.disabled = busy;
  });
  form.setAttribute('aria-busy', String(busy));
}

function openAccountDialog({ title, eyebrow = 'Secure account controls' }) {
  const dialog = document.createElement('dialog');
  const titleId = `accountControlDialogTitle-${globalThis.crypto.randomUUID()}`;
  dialog.className = 'account-control-dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.innerHTML = `<div class="account-control-dialog-head">
      <div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 id="${titleId}">${escapeHtml(title)}</h2></div>
      <button type="button" class="icon-button" data-account-dialog-close aria-label="Close dialog">×</button>
    </div><div class="account-control-dialog-body" data-account-dialog-body><p role="status">Loading secure data…</p></div>`;
  document.body.append(dialog);
  const close = () => {
    dialog.close?.();
    dialog.remove();
  };
  dialog.querySelector('[data-account-dialog-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  return { dialog, body: dialog.querySelector('[data-account-dialog-body]'), close };
}

function profileOverview(profile) {
  const committees = profile.committeeIds?.length ? profile.committeeIds.join(', ') : 'None assigned';
  const workspaces = profile.accessSummary?.workspaceIds?.length
    ? profile.accessSummary.workspaceIds.join(', ')
    : 'No internal workspace';
  return `<section class="account-profile-overview">
    <div class="account-profile-avatar" aria-label="Initials avatar">${escapeHtml(profile.avatar?.initials || 'HA')}</div>
    <div><h3>${escapeHtml(profile.displayName || 'Staff account')}</h3><p>${escapeHtml(profile.verifiedEmail)}</p></div>
    <dl>
      <div><dt>Account code</dt><dd>${escapeHtml(profile.accountCode)}</dd></div>
      <div><dt>Username</dt><dd>${escapeHtml(profile.username || 'Not set')}</dd></div>
      <div><dt>Role</dt><dd>${escapeHtml(profile.accessSummary?.roleLabel || profile.roleId)}</dd></div>
      <div><dt>Committees</dt><dd>${escapeHtml(committees)}</dd></div>
      <div><dt>Workspaces</dt><dd>${escapeHtml(workspaces)}</dd></div>
      <div><dt>Department</dt><dd>${escapeHtml(profile.affiliation?.departmentDisplayName || profile.affiliation?.departmentId)}</dd></div>
      <div><dt>Course / year</dt><dd>${escapeHtml(`${profile.affiliation?.courseId || 'Not recorded'}${profile.affiliation?.yearLevel ? ` · ${profile.affiliation.yearLevel}` : ''}`)}</dd></div>
    </dl>
    <p class="auth-help">Legal identity, verified email, role, committee, and account code are governed values. Submit a correction request instead of editing them directly. Avatar upload is unavailable; initials are the truthful fallback.</p>
  </section>`;
}

function profileForms(profile) {
  return `<div class="account-profile-actions">
    <details open><summary>Update contact number</summary>
      <form class="auth-form" data-profile-contact>
        <label>Contact number<input name="contactNumber" autocomplete="tel" value="${escapeHtml(profile.contactNumber)}" maxlength="24" required></label>
        <button class="primary" type="submit">Save contact number</button>
      </form>
    </details>
    <details><summary>Change username</summary>
      <form class="auth-form" data-profile-username>
        <label>New username<input name="username" autocomplete="username" minlength="4" maxlength="32" pattern="[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){2,30}[a-z0-9]" required spellcheck="false"></label>
        ${passwordFieldMarkup({ id: 'profileUsernameCurrentPassword', name: 'currentPassword', label: 'Current password', autocomplete: 'current-password' })}
        <label>Reason<textarea name="reason" maxlength="500" required>Self-service username change</textarea></label>
        <p class="auth-help">Changing the username revokes all active sessions.</p>
        <button class="primary" type="submit">Change username and sign out</button>
      </form>
    </details>
    <details><summary>Change password</summary>
      <form class="auth-form" data-profile-password>
        ${passwordFieldMarkup({ id: 'profilePasswordCurrent', name: 'currentPassword', label: 'Current password', autocomplete: 'current-password' })}
        ${passwordFieldMarkup({ id: 'profilePasswordNew', name: 'newPassword', label: 'New password', autocomplete: 'new-password', minlength: '12' })}
        ${passwordFieldMarkup({ id: 'profilePasswordConfirm', name: 'confirmPassword', label: 'Confirm new password', autocomplete: 'new-password', minlength: '12' })}
        <p class="auth-help">Changing the password revokes all active sessions.</p>
        <button class="primary" type="submit">Change password and sign out</button>
      </form>
    </details>
    <details><summary>Request legal identity or email correction</summary>
      <form class="auth-form" data-profile-identity>
        <label>Proposed legal name<input name="legalName" value="${escapeHtml(profile.legalName)}" autocomplete="name" maxlength="120" required></label>
        <label>Proposed contact number<input name="contactNumber" value="${escapeHtml(profile.contactNumber)}" autocomplete="tel" maxlength="24" required></label>
        <label>Proposed email<input name="email" value="${escapeHtml(profile.verifiedEmail)}" type="email" autocomplete="email" maxlength="254" required></label>
        <label>Reason<textarea name="reason" maxlength="500" required></textarea></label>
        <button class="primary" type="submit">Submit protected correction request</button>
      </form>
    </details>
  </div>`;
}

function mountProfileDialog({ client, session, onSessionInvalidated }) {
  const layer = openAccountDialog({ title: 'My Profile' });
  let profile;
  const status = (message, error = false) => {
    const region = layer.body.querySelector('[data-profile-status]');
    if (!region) return;
    region.textContent = message;
    region.classList.toggle('error', error);
  };

  const renderSignedOut = (message) => {
    onSessionInvalidated?.();
    layer.body.innerHTML = `<div class="account-control-result" role="status"><h3>Security change complete</h3><p>${escapeHtml(message)}</p><a class="primary button-link" href="/login">Return to staff sign in</a></div>`;
  };

  const render = () => {
    layer.body.innerHTML = `${profileOverview(profile)}<div class="account-control-status" data-profile-status aria-live="polite"></div>${profileForms(profile)}`;
    attachPasswordVisibilityControls(layer.body);
    const contact = layer.body.querySelector('[data-profile-contact]');
    contact.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(contact);
      setBusy(contact, true);
      try {
        const result = await client.updateProfileContact(
          {
            contactNumber: values.get('contactNumber'),
            expectedRevision: profile.revision,
            clientRequestId: requestId('profile-contact'),
          },
          session.csrfToken,
        );
        profile = result.profile;
        render();
        status('Contact number updated. Active sessions were preserved.');
      } catch (error) {
        setBusy(contact, false);
        status(safeError(error), true);
      }
    });

    const username = layer.body.querySelector('[data-profile-username]');
    username.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(username);
      setBusy(username, true);
      try {
        await client.changeProfileUsername(
          {
            username: values.get('username'),
            currentPassword: values.get('currentPassword'),
            reason: values.get('reason'),
            expectedRevision: profile.revision,
            clientRequestId: requestId('profile-username'),
          },
          session.csrfToken,
        );
        renderSignedOut(
          'Your username changed and all sessions were revoked. Sign in again with the new username.',
        );
      } catch (error) {
        setBusy(username, false);
        status(safeError(error), true);
      }
    });

    const password = layer.body.querySelector('[data-profile-password]');
    password.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(password);
      setBusy(password, true);
      try {
        await client.changeProfilePassword(
          {
            currentPassword: values.get('currentPassword'),
            newPassword: values.get('newPassword'),
            confirmPassword: values.get('confirmPassword'),
            reason: 'Self-service password change',
            expectedRevision: profile.revision,
            clientRequestId: requestId('profile-password'),
          },
          session.csrfToken,
        );
        renderSignedOut(
          'Your password changed and all sessions were revoked. Sign in again with the new password.',
        );
      } catch (error) {
        setBusy(password, false);
        status(safeError(error), true);
      }
    });

    const identity = layer.body.querySelector('[data-profile-identity]');
    identity.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(identity);
      setBusy(identity, true);
      try {
        await client.requestProfileIdentityCorrection(
          {
            legalName: values.get('legalName'),
            contactNumber: values.get('contactNumber'),
            email: values.get('email'),
            reason: values.get('reason'),
            clientRequestId: requestId('profile-identity'),
          },
          session.csrfToken,
        );
        setBusy(identity, false);
        status('Protected identity correction request submitted for governed review.');
      } catch (error) {
        setBusy(identity, false);
        status(safeError(error), true);
      }
    });
  };

  client
    .getProfile()
    .then((result) => {
      profile = result.profile;
      render();
    })
    .catch((error) => {
      layer.body.innerHTML = `<div class="auth-alert" role="alert">${escapeHtml(safeError(error))}</div>`;
    });
}

function reviewSummary(application) {
  return `<article class="account-review-card">
    <div><strong>${escapeHtml(application.applicationCode)}</strong><span>${escapeHtml(application.state)}</span></div>
    <dl>
      <div><dt>Department</dt><dd>${escapeHtml(application.departmentId)}</dd></div>
      <div><dt>Course / year</dt><dd>${escapeHtml(`${application.courseId || '—'}${application.yearLevel ? ` · ${application.yearLevel}` : ''}`)}</dd></div>
      <div><dt>Requested role</dt><dd>${escapeHtml(application.requestedRoleId)}</dd></div>
    </dl>
    <button class="secondary" type="button" data-review-application="${escapeHtml(application.id)}">Review application</button>
  </article>`;
}

function reviewDetail(application, queue, ownerOverrideAvailable) {
  const requested = application.requestedAccess ?? {};
  const history = Array.isArray(application.history) ? application.history : [];
  const actionOptions = REVIEW_ACTIONS[queue]
    .map((action) => `<option value="${action.id}">${escapeHtml(action.label)}</option>`)
    .join('');
  return `<button class="auth-text-button" type="button" data-review-back>← Back to queue</button>
    <section class="account-review-detail">
      <div class="account-review-detail-head"><div><p class="eyebrow">${escapeHtml(application.state)}</p><h3>${escapeHtml(application.applicationCode)}</h3></div><strong>Revision ${application.revision}</strong></div>
      <dl>
        <div><dt>Verified email</dt><dd>${escapeHtml(application.verifiedEmail)}</dd></div>
        <div><dt>Legal name</dt><dd>${escapeHtml(application.legalName)}</dd></div>
        <div><dt>Contact</dt><dd>${escapeHtml(application.contactNumber)}</dd></div>
        <div><dt>Roster match</dt><dd>${application.identityVerification?.rosterMatched ? 'Verified' : 'Needs manual review'}</dd></div>
        <div><dt>Legal-name match</dt><dd>${application.identityVerification?.legalNameMatched ? 'Matched' : 'Manual verification required'}</dd></div>
        <div><dt>Department</dt><dd>${escapeHtml(application.departmentId)}</dd></div>
        <div><dt>Course / year</dt><dd>${escapeHtml(`${application.courseId || '—'}${application.yearLevel ? ` · ${application.yearLevel}` : ''}`)}</dd></div>
        <div><dt>Requested username</dt><dd>${escapeHtml(application.requestedUsername)}</dd></div>
        <div><dt>Account preset / role</dt><dd>${escapeHtml(`${requested.requestedAccountType || '—'} · ${requested.requestedRoleId || '—'}`)}</dd></div>
        <div><dt>Committees</dt><dd>${escapeHtml(requested.requestedCommitteeIds?.join(', ') || 'None')}</dd></div>
        <div><dt>Internal workspaces</dt><dd>${escapeHtml(requested.requestedWorkspaceIds?.join(', ') || 'None')}</dd></div>
        <div><dt>Lending</dt><dd>${requested.lendingSelfService ? 'Self-service requested' : 'No self-service'} · ${requested.internalLendingOperations ? 'Internal operations requested' : 'No internal operations'}</dd></div>
      </dl>
      <div class="account-review-history"><h4>Application history</h4><ol>${
        history.length
          ? history
              .map(
                (entry) =>
                  `<li><strong>${escapeHtml(entry.toState)}</strong><span>Revision ${escapeHtml(entry.resultingRevision ?? '—')} · ${escapeHtml(entry.createdAt)}</span>${entry.reason ? `<p>${escapeHtml(entry.reason)}</p>` : ''}</li>`,
              )
              .join('')
          : '<li>No recorded transitions.</li>'
      }</ol></div>
    </section>
    <form class="auth-form account-review-decision" data-review-decision>
      <h3>${queue === 'director' ? 'Director decision' : 'Administrator review'}</h3>
      <label>Action<select name="action" required>${actionOptions}</select></label>
      <label>Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label>
      <label class="account-application-check"><input name="evidenceConfirmed" type="checkbox" required> I verified the identity, duplicate, affiliation, username, requested role, scope, and access-surface evidence shown above.</label>
      <button class="primary" type="submit">Record governed decision</button>
    </form>
    ${
      ownerOverrideAvailable
        ? `<details class="account-owner-override"><summary>System Owner break-glass override</summary>
      <p>This bypass is separate from the normal two-reviewer path and creates explicit follow-up evidence.</p>
      <form class="auth-form" data-owner-override>
        <label>Override action<select name="action"><option value="REQUEST_CHANGES">Request changes</option><option value="REJECT">Reject</option><option value="APPROVE">Approve</option></select></label>
        <label>Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label>
        <label>Follow-up review reference<input name="followUpReviewReference" minlength="8" maxlength="128" required></label>
        <label class="account-application-check"><input name="confirmed" type="checkbox" required> I confirm the current state, effective access, session impact, and follow-up review requirement.</label>
        <button class="danger" type="submit">Execute audited owner override</button>
      </form>
    </details>`
        : ''
    }
    <div class="account-control-status" data-review-status aria-live="polite"></div>`;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return `SHA256-${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')}`;
}

function activationHandoffMarkup(result) {
  const handoff = result.activationHandoff;
  if (!handoff) return '';
  const temporaryPassword = handoff.temporaryPassword ?? handoff.temporaryCredential ?? '';
  return `<div class="account-control-result account-activation-handoff" role="status">
    <h3>One-time activation handoff</h3>
    <p>Deliver this through the approved private channel. It will not be shown again.</p>
    <p><span>Account code</span><strong>${escapeHtml(handoff.accountCode ?? result.accountCode)}</strong></p>
    <label>Temporary password<textarea readonly data-activation-secret>${escapeHtml(temporaryPassword)}</textarea></label>
    <button class="secondary" type="button" data-copy-activation>Copy temporary password</button>
    <p data-activation-copy-status aria-live="polite"></p>
  </div>`;
}

function mountReviewDialog({ client, session, capabilities }) {
  const layer = openAccountDialog({ title: 'Account Requests', eyebrow: 'Governed access review' });
  const queues = [
    ...(capabilities.has(CAPABILITIES.ADMIN_REVIEW) ? ['admin'] : []),
    ...(capabilities.has(CAPABILITIES.DIRECTOR_DECIDE) ? ['director'] : []),
  ];
  let queue = queues[0];
  let selected = null;

  const renderError = (message) => {
    layer.body.innerHTML = `<div class="auth-alert" role="alert">${escapeHtml(message)}</div><button class="secondary" type="button" data-review-retry>Retry</button>`;
    layer.body.querySelector('[data-review-retry]')?.addEventListener('click', () => void loadList());
  };

  const loadList = async () => {
    selected = null;
    layer.body.innerHTML = '<p role="status">Loading authorized review queue…</p>';
    try {
      const result = await client.listAccountApplications(queue);
      layer.body.innerHTML = `<div class="account-review-queue-tabs" role="tablist">
        ${queues.map((entry) => `<button type="button" class="secondary" data-review-queue="${entry}" aria-pressed="${entry === queue}">${entry === 'admin' ? 'Awaiting Administrator' : 'Awaiting Director'}</button>`).join('')}
      </div><div class="account-review-list">${result.applications.length ? result.applications.map(reviewSummary).join('') : '<p class="account-control-empty">No applications are waiting in this queue.</p>'}</div>`;
      layer.body.querySelectorAll('[data-review-queue]').forEach((button) =>
        button.addEventListener('click', () => {
          queue = button.dataset.reviewQueue;
          void loadList();
        }),
      );
      layer.body
        .querySelectorAll('[data-review-application]')
        .forEach((button) =>
          button.addEventListener('click', () => void loadDetail(button.dataset.reviewApplication)),
        );
    } catch (error) {
      renderError(safeError(error));
    }
  };

  const showHandoff = (result) => {
    layer.body.innerHTML = activationHandoffMarkup(result);
    const button = layer.body.querySelector('[data-copy-activation]');
    const secret = layer.body.querySelector('[data-activation-secret]')?.value ?? '';
    button?.addEventListener('click', async () => {
      const status = layer.body.querySelector('[data-activation-copy-status]');
      try {
        await navigator.clipboard.writeText(secret);
        status.textContent =
          'Temporary password copied. Deliver it only through the approved private channel.';
      } catch {
        status.textContent = 'Copy was unavailable. Select and copy the password manually.';
      }
    });
  };

  const loadDetail = async (applicationId) => {
    layer.body.innerHTML = '<p role="status">Loading protected application detail…</p>';
    try {
      selected = (await client.getAccountApplicationForReview(queue, applicationId)).application;
      layer.body.innerHTML = reviewDetail(selected, queue, capabilities.has(CAPABILITIES.OWNER_OVERRIDE));
      layer.body.querySelector('[data-review-back]').addEventListener('click', () => void loadList());
      const form = layer.body.querySelector('[data-review-decision]');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = new FormData(form);
        setBusy(form, true);
        try {
          const result = await client.decideAccountApplication(
            queue,
            selected.id,
            values.get('action'),
            {
              expectedRevision: selected.revision,
              reason: values.get('reason'),
              clientRequestId: requestId(`${queue}-review`),
              reviewEvidence: {
                queue,
                verifiedFields: [
                  'identity',
                  'duplicate-scan',
                  'affiliation',
                  'username',
                  'role-scope',
                  'access-surface',
                ],
                reviewerAcknowledged: values.get('evidenceConfirmed') === 'on',
              },
            },
            session.csrfToken,
          );
          if (result.activationHandoff) showHandoff(result);
          else void loadList();
        } catch (error) {
          setBusy(form, false);
          const region = layer.body.querySelector('[data-review-status]');
          region.textContent = safeError(error);
          region.classList.add('error');
        }
      });

      const owner = layer.body.querySelector('[data-owner-override]');
      owner?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = new FormData(owner);
        setBusy(owner, true);
        try {
          const action = values.get('action');
          const result = await client.overrideAccountApplication(
            selected.id,
            {
              expectedRevision: selected.revision,
              reason: values.get('reason'),
              clientRequestId: requestId('owner-override'),
              reviewEvidence: {
                breakGlass: true,
                reviewerAcknowledged: values.get('confirmed') === 'on',
              },
              override: {
                currentState: selected.state,
                action,
                effectiveAccessFingerprint: await sha256(selected.requestedAccess),
                sessionImpactFingerprint: await sha256({ sessionsRevoked: true, action }),
                followUpReviewReference: values.get('followUpReviewReference'),
              },
            },
            session.csrfToken,
          );
          if (result.activationHandoff) showHandoff(result);
          else void loadList();
        } catch (error) {
          setBusy(owner, false);
          const region = layer.body.querySelector('[data-review-status]');
          region.textContent = safeError(error);
          region.classList.add('error');
        }
      });
    } catch (error) {
      renderError(safeError(error));
    }
  };

  void loadList();
}

export function createAuthenticatedAccountControlButtons({ client, session, onSessionInvalidated }) {
  const capabilities = new Set(session.user?.authorization?.capabilities ?? []);
  const profile = document.createElement('button');
  profile.type = 'button';
  profile.className = 'secondary';
  profile.dataset.authProfile = '';
  profile.textContent = 'My Profile';
  profile.addEventListener('click', () => mountProfileDialog({ client, session, onSessionInvalidated }));
  const buttons = [profile];
  if (capabilities.has(CAPABILITIES.ADMIN_REVIEW) || capabilities.has(CAPABILITIES.DIRECTOR_DECIDE)) {
    const applications = document.createElement('button');
    applications.type = 'button';
    applications.className = 'secondary';
    applications.dataset.authApplications = '';
    applications.textContent = 'Account Requests';
    applications.addEventListener('click', () => mountReviewDialog({ client, session, capabilities }));
    buttons.push(applications);
  }
  return buttons;
}
