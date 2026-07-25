import { AUTH_STATE } from '../auth/http-contract.js';
import { clearAuthSession, getAuthSession, setAuthSession } from '../auth/session-state.js';
import { AuthApiClient } from '../services/auth-api-client.js';
import { mountPublicLendingPortal } from './public-lending-portal.js';
import { mountRequesterPortal } from './requester-portal.js';
import { brandLockupMarkup } from './brand-assets.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function gatewayRoot() {
  let root = document.getElementById('authGateway');
  if (!root) {
    root = document.createElement('main');
    root.id = 'authGateway';
    root.className = 'auth-gateway';
    document.body.prepend(root);
  }
  return root;
}

const WORKSPACE_PATHS = Object.freeze({
  administrator: '/app/admin',
  director: '/app/director',
  food: '/app/food',
  'inventory-pantry': '/app/inventory',
  materials: '/app/materials',
});

function authorizedWorkspacePath(user) {
  return WORKSPACE_PATHS[user?.experienceId] ?? '/app/admin';
}

function routedExperience(user) {
  const administrator = ['ADMINISTRATOR', 'SYSTEM_OWNER'].includes(user?.authorization?.roleId);
  if (administrator) {
    const route = Object.entries(WORKSPACE_PATHS).find(
      ([, path]) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
    if (route) return route[0];
  }
  return user?.experienceId ?? '';
}

function routeAuthorizedWorkspace(user) {
  if (user?.authorization?.roleId === 'REQUESTER') {
    const target = user.lendingEligible && location.pathname === '/lending' ? '/lending' : '/request';
    if (
      location.pathname === '/login' ||
      location.pathname === '/' ||
      location.pathname.startsWith('/app/')
    ) {
      history.replaceState(null, '', target);
    }
    return;
  }
  const target = authorizedWorkspacePath(user);
  const administrator = ['ADMINISTRATOR', 'SYSTEM_OWNER'].includes(user?.authorization?.roleId);
  const validInternalWorkspace = Object.values(WORKSPACE_PATHS).some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  );
  if (administrator && validInternalWorkspace) return;
  const alreadyInAuthorizedWorkspace =
    location.pathname === target || location.pathname.startsWith(`${target}/`);
  if (
    location.pathname === '/login' ||
    location.pathname === '/' ||
    (location.pathname.startsWith('/app/') && !alreadyInAuthorizedWorkspace)
  ) {
    history.replaceState(null, '', target);
  }
}

function setWorkspaceVisibility(authenticated) {
  document.querySelector('.app-shell')?.toggleAttribute('hidden', !authenticated);
  const loading = document.getElementById('loading');
  loading?.toggleAttribute('hidden', !authenticated);
  loading?.classList.toggle('hidden', !authenticated);
  document.body.classList.toggle('auth-required', !authenticated);
}

function fieldError(error, field) {
  return escapeHtml(error?.details?.fieldErrors?.[field] ?? '');
}

const EYE_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;

const EYE_OFF_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.5 3.1M6.2 6.3A15.7 15.7 0 0 0 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5M9.9 9.8a3 3 0 0 0 4.3 4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

function passwordControl({ id, name, autocomplete, label = 'Password', describedBy = '', minlength = '' }) {
  return `
    <label for="${id}">${escapeHtml(label)}</label>
    <div class="auth-password-control">
      <input id="${id}" name="${name}" type="password" autocomplete="${autocomplete}" required ${minlength ? `minlength="${minlength}"` : ''} maxlength="128" ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
      <button class="auth-password-toggle" type="button" data-password-toggle="${id}" aria-label="Show password" aria-pressed="false">${EYE_ICON}<span>Show</span></button>
    </div>`;
}

function attachPasswordControls(container) {
  container.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = container.querySelector(`#${button.dataset.passwordToggle}`);
      if (!input) return;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', String(reveal));
      button.innerHTML = `${reveal ? EYE_OFF_ICON : EYE_ICON}<span>${reveal ? 'Hide' : 'Show'}</span>`;
      input.focus({ preventScroll: true });
      if (start !== null && end !== null) input.setSelectionRange(start, end);
    });
  });
}

function attachRecoveryHelp(container) {
  const button = container.querySelector('[data-auth-forgot]');
  const panel = container.querySelector('#authRecoveryHelp');
  if (!button || !panel) return;
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded;
    if (!expanded) panel.focus();
  });
}

function loginMarkup(error, { portal = false, requestPortal = false } = {}) {
  const message = error ? escapeHtml(error.message) : '';
  return `
    <section class="auth-card" aria-labelledby="authTitle">
      <div class="auth-brand-lockup">
        ${brandLockupMarkup({ compact: true })}
        <span><strong>University Student Council</strong><small>Department of Logistics</small></span>
      </div>
      <p class="eyebrow">Holy Angel University</p>
      <h1 id="authTitle">${portal ? 'Office Lending' : requestPortal ? 'Request Center' : 'Staff sign in'}</h1>
      <p class="auth-intro">${portal ? 'Sign in with your institution-approved Access ID to submit and track your own lending requests.' : requestPortal ? 'Sign in with your requester Access ID to submit and track your own logistics requests.' : 'Sign in with the Access ID issued by the Department of Logistics.'}</p>
      <div class="auth-alert" role="alert" data-auth-login-error ${error ? '' : 'hidden'}>${message}</div>
      <form id="authLoginForm" class="auth-form" autocomplete="on">
        <label for="authAccessId">Access ID or verified HAU-USC email</label>
        <input id="authAccessId" name="username" type="text" inputmode="text" autocomplete="username" autocapitalize="characters" required maxlength="64" spellcheck="false">
        ${passwordControl({ id: 'authPassword', name: 'password', autocomplete: 'current-password' })}
        <div class="auth-form-actions">
          <button class="auth-text-button" type="button" data-auth-forgot aria-expanded="false" aria-controls="authRecoveryHelp">Forgot password?</button>
        </div>
        <button class="primary" type="submit">Sign in</button>
      </form>
      <div id="authRecoveryHelp" class="auth-recovery-help" tabindex="-1" hidden>
        <strong>Recover staff access</strong>
        <p>Contact an authorized Administrator to revoke active sessions and issue a one-time temporary password. Your role and committee scope cannot be changed from this page.</p>
      </div>
      <p class="auth-help">${portal ? 'Borrower eligibility is assigned by the server. This portal never provides internal staff access.' : requestPortal ? 'This portal shows only your own requests. Roles and committee access are assigned by the server.' : 'Roles and committee access are assigned by the server. They cannot be selected here.'}</p>
      <nav class="auth-portal-links" aria-label="Public logistics portals">${portal ? '<a href="/request">Request Center</a>' : '<a href="/request">Request Center</a> <span aria-hidden="true">·</span> <a href="/lending">Lending Center</a>'}</nav>
    </section>`;
}

function configurationMarkup() {
  return `
    <section class="auth-card" aria-labelledby="authTitle">
      <p class="eyebrow">HAU-USC Logistics</p>
      <h1 id="authTitle">Secure service unavailable</h1>
      <p class="auth-intro">This deployment has no approved server runtime configuration. No local or preview data has been loaded.</p>
    </section>`;
}

function activationMarkup(error) {
  return `
    <section class="auth-card auth-card-wide" aria-labelledby="authTitle">
      <p class="eyebrow">First login activation</p>
      <h1 id="authTitle">Secure your account</h1>
      <p class="auth-intro">Confirm your contact information and replace the temporary password. Your assigned role and committee scope will not change.</p>
      ${error ? `<div class="auth-alert" role="alert">${escapeHtml(error.message)}</div>` : ''}
      <form id="authActivationForm" class="auth-form">
        <label for="authFullName">Full name</label>
        <input id="authFullName" name="fullName" autocomplete="name" required maxlength="120" aria-describedby="authFullNameError">
        <small id="authFullNameError" class="auth-field-error">${fieldError(error, 'fullName')}</small>
        <label for="authMobile">Mobile number</label>
        <input id="authMobile" name="mobileNumber" autocomplete="tel" required maxlength="24" aria-describedby="authMobileError">
        <small id="authMobileError" class="auth-field-error">${fieldError(error, 'mobileNumber')}</small>
        <label for="authEmail">Email address</label>
        <input id="authEmail" name="email" type="email" autocomplete="email" required maxlength="254" aria-describedby="authEmailError">
        <small id="authEmailError" class="auth-field-error">${fieldError(error, 'email')}</small>
        ${passwordControl({ id: 'authNewPassword', name: 'password', autocomplete: 'new-password', label: 'New password', describedBy: 'authPasswordHelp', minlength: '12' })}
        <small id="authPasswordHelp">Use 12–128 characters and at least three character types.</small>
        ${passwordControl({ id: 'authConfirmPassword', name: 'confirmPassword', autocomplete: 'new-password', label: 'Confirm password', describedBy: 'authConfirmError', minlength: '12' })}
        <small id="authConfirmError" class="auth-field-error">${fieldError(error, 'confirmPassword')}</small>
        <button class="primary" type="submit">Activate account</button>
      </form>
    </section>`;
}

function setBusy(form, busy) {
  form.querySelectorAll('input,button').forEach((control) => {
    control.disabled = busy;
  });
  form.setAttribute('aria-busy', String(busy));
}

function attachSessionControls(client) {
  const install = () => {
    const tools = document.querySelector('.app-header .header-tools');
    if (!tools || tools.querySelector('[data-auth-logout]')) return false;
    const user = getAuthSession().user;
    const identity = document.createElement('span');
    identity.className = 'auth-session-label';
    identity.textContent = `${user?.displayName || 'Authenticated user'} · ${user?.authorization?.roleLabel || 'Authorized'}`;
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'secondary';
    logout.dataset.authLogout = '';
    logout.textContent = 'Sign out';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        await client.logout(getAuthSession().csrfToken);
      } finally {
        clearAuthSession();
        location.reload();
      }
    });
    tools.prepend(identity, logout);
    return true;
  };
  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export async function startAuthenticatedRuntime({ backendMode, baseUrl, requestOnly, start }) {
  document.body.dataset.runtimeMode = backendMode;
  if (backendMode === 'unconfigured') {
    const root = gatewayRoot();
    setWorkspaceVisibility(false);
    root.innerHTML = configurationMarkup();
    return;
  }
  const lendingPortal = location.pathname === '/lending';
  const requesterPortal = location.pathname === '/request';
  if (backendMode !== 'rest' || requestOnly) {
    start();
    return;
  }
  const client = new AuthApiClient(baseUrl);
  const root = gatewayRoot();
  setWorkspaceVisibility(false);
  if (lendingPortal) {
    await mountPublicLendingPortal({ root, client });
    return;
  }

  const authenticated = (result) => {
    setAuthSession({ csrfToken: result.csrfToken, user: result.user });
    routeAuthorizedWorkspace(result.user);
    document.body.dataset.experience = routedExperience(result.user);
    if (requesterPortal) {
      void mountRequesterPortal({
        root,
        client,
        session: getAuthSession(),
        onLogout: async () => {
          try {
            await client.logout(getAuthSession().csrfToken);
          } finally {
            clearAuthSession();
            location.reload();
          }
        },
      });
      return;
    }
    root.remove();
    setWorkspaceVisibility(true);
    start();
    attachSessionControls(client);
  };

  const renderLogin = (error) => {
    let form = root.querySelector('#authLoginForm');
    if (!form) {
      root.innerHTML = loginMarkup(error, { portal: false, requestPortal: requesterPortal });
      form = root.querySelector('#authLoginForm');
      attachPasswordControls(root);
      attachRecoveryHelp(root);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = new FormData(form);
        setBusy(form, true);
        try {
          const result = await client.login(values.get('username'), values.get('password'));
          if (result.state === AUTH_STATE.ACTIVATION_REQUIRED) {
            setAuthSession({ csrfToken: result.csrfToken, user: null });
            renderActivation();
          } else {
            authenticated(result);
          }
        } catch (nextError) {
          renderLogin(nextError);
        }
      });
    }
    const alert = root.querySelector('[data-auth-login-error]');
    alert.textContent = error?.message ?? '';
    alert.hidden = !error;
    setBusy(form, false);
  };

  const renderActivation = (error) => {
    root.innerHTML = activationMarkup(error);
    attachPasswordControls(root);
    const form = root.querySelector('#authActivationForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      setBusy(form, true);
      try {
        authenticated(
          await client.activate({
            profile: {
              fullName: values.get('fullName'),
              mobileNumber: values.get('mobileNumber'),
              email: values.get('email'),
            },
            password: values.get('password'),
            confirmPassword: values.get('confirmPassword'),
            csrfToken: getAuthSession().csrfToken,
          }),
        );
      } catch (nextError) {
        renderActivation(nextError);
      }
    });
    root.querySelector('#authFullName')?.focus();
  };

  try {
    const session = await client.getSession();
    if (session?.state === AUTH_STATE.AUTHENTICATED) authenticated(session);
    else renderLogin();
  } catch (error) {
    renderLogin(error);
  }
}
