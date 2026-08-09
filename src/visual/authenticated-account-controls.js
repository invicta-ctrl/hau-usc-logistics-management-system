import { AppError } from '../app/errors.js';

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

function openAccountDialog({ title }) {
  const dialog = document.createElement('dialog');
  const titleId = `accountControlDialogTitle-${globalThis.crypto.randomUUID()}`;
  dialog.className = 'account-control-dialog dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.innerHTML = `<div class="account-control-dialog-head">
      <div><h2 id="${titleId}">${escapeHtml(title)}</h2></div>
      <button type="button" class="icon-button" data-account-dialog-close aria-label="Close dialog"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    </div><div class="account-control-dialog-body" data-account-dialog-body><p role="status">Loading your profile…</p></div>`;
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
  return `<header class="page-head account-profile-head"><div class="page-head__title"><h1>My profile</h1><p>Your details, access, and sign-in security.</p></div></header>
  <div class="profile-grid account-profile-overview">
    <section class="panel profile-photo-panel"><div class="panel__body"><h2 class="block-title">Profile</h2><div class="profile-photo">
      <div class="profile-photo__preview account-profile-avatar" aria-label="Initials avatar"><span aria-hidden="true">${escapeHtml(profile.avatar?.initials || 'HA')}</span></div>
      <div class="profile-photo__controls"><div><h3>${escapeHtml(profile.displayName || 'Staff account')}</h3><p>${escapeHtml(profile.verifiedEmail)}</p></div><p class="profile-photo__note">Your initials are shown when no account image is available.</p></div>
    </div></div></section>
    <section class="panel"><div class="panel__body"><h2 class="block-title">Your access</h2><dl class="facts">
      <div><dt>Account code</dt><dd>${escapeHtml(profile.accountCode)}</dd></div>
      <div><dt>Username</dt><dd>${escapeHtml(profile.username || 'Not set')}</dd></div>
      <div><dt>Role</dt><dd>${escapeHtml(profile.accessSummary?.roleLabel || profile.roleId)}</dd></div>
      <div><dt>Committees</dt><dd>${escapeHtml(committees)}</dd></div>
      <div><dt>Workspaces</dt><dd>${escapeHtml(workspaces)}</dd></div>
      <div><dt>Department</dt><dd>${escapeHtml(profile.affiliation?.departmentDisplayName || profile.affiliation?.departmentId)}</dd></div>
      <div><dt>Course / year</dt><dd>${escapeHtml(`${profile.affiliation?.courseId || 'Not recorded'}${profile.affiliation?.yearLevel ? ` · ${profile.affiliation.yearLevel}` : ''}`)}</dd></div>
      <div><dt>Account status</dt><dd>${escapeHtml(profile.status || profile.accountStatus || 'Active')}</dd></div>
    </dl><p class="notice" data-tone="info">Ask an administrator to change your role or permissions. Use the correction form for identity or email changes.</p></div></section>
  </div>`;
}

function profileForms(profile) {
  return `<div class="profile-grid account-profile-actions">
    <section class="panel"><div class="panel__body"><h2 class="block-title">Contact number</h2>
      <form class="auth-form" data-profile-contact><label>Contact number<input name="contactNumber" autocomplete="tel" value="${escapeHtml(profile.contactNumber)}" maxlength="24" required></label><button class="btn btn--primary primary" type="submit">Save contact number</button></form>
    </div></section>
    <section class="panel"><div class="panel__body"><h2 class="block-title">Username</h2>
      <form class="auth-form" data-profile-username><label>New username<input name="username" autocomplete="username" minlength="4" maxlength="32" pattern="[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){2,30}[a-z0-9]" required spellcheck="false"></label><label>Current password<input name="currentPassword" type="password" autocomplete="current-password" maxlength="128" required></label><label>Reason<textarea name="reason" maxlength="500" required>Username change</textarea></label><p class="auth-help">Changing your username signs out every active session.</p><button class="btn btn--primary primary" type="submit">Change username and sign out</button></form>
    </div></section>
    <section class="panel"><div class="panel__body"><h2 class="block-title">Password</h2>
      <form class="auth-form" data-profile-password><label>Current password<input name="currentPassword" type="password" autocomplete="current-password" maxlength="128" required></label><label>New password<input name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><label>Confirm new password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><p class="auth-help">Changing your password signs out every active session.</p><button class="btn btn--primary primary" type="submit">Change password and sign out</button></form>
    </div></section>
    <section class="panel"><div class="panel__body"><h2 class="block-title">Profile correction</h2>
      <form class="auth-form" data-profile-identity><label>Legal name<input name="legalName" value="${escapeHtml(profile.legalName)}" autocomplete="name" maxlength="120" required></label><label>Contact number<input name="contactNumber" value="${escapeHtml(profile.contactNumber)}" autocomplete="tel" maxlength="24" required></label><label>Email address<input name="email" value="${escapeHtml(profile.verifiedEmail)}" type="email" autocomplete="email" maxlength="254" required></label><label>Reason<textarea name="reason" maxlength="500" required></textarea></label><button class="btn btn--primary primary" type="submit">Request correction</button></form>
    </div></section>
  </div>`;
}

function mountProfileDialog({ client, session, onSessionInvalidated }) {
  const layer = openAccountDialog({ title: 'My profile' });
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
        status('Your correction request was submitted for review.');
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
        <label class="account-application-check"><input name="confirmed" type="checkbox" required> I confirm the current account status, permissions, session impact, and required follow-up review.</label>
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
