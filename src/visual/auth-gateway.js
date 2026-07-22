import { AUTH_STATE } from '../auth/http-contract.js';
import { clearAuthSession, getAuthSession, setAuthSession } from '../auth/session-state.js';
import { AuthApiClient } from '../services/auth-api-client.js';

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

function routeAuthorizedWorkspace(user) {
  const target = authorizedWorkspacePath(user);
  if (location.pathname === '/login' || location.pathname === '/' || location.pathname.startsWith('/app/')) {
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

function loginMarkup(error) {
  const message = error ? escapeHtml(error.message) : '';
  return `
    <section class="auth-card" aria-labelledby="authTitle">
      <p class="eyebrow">Holy Angel University · University Student Council</p>
      <h1 id="authTitle">Logistics Operations</h1>
      <p class="auth-intro">Sign in with the Access ID issued by the Department of Logistics.</p>
      <div class="auth-alert" role="alert" data-auth-login-error ${error ? '' : 'hidden'}>${message}</div>
      <form id="authLoginForm" class="auth-form" autocomplete="on">
        <label for="authAccessId">Access ID</label>
        <input id="authAccessId" name="username" type="text" inputmode="text" autocomplete="username" autocapitalize="characters" required maxlength="64" spellcheck="false">
        <label for="authPassword">Password</label>
        <input id="authPassword" name="password" type="password" autocomplete="current-password" required maxlength="128">
        <button class="primary" type="submit">Sign in</button>
      </form>
      <p class="auth-help">Roles and committee access are assigned by the server. They cannot be selected here.</p>
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
        <label for="authNewPassword">New password</label>
        <input id="authNewPassword" name="password" type="password" autocomplete="new-password" required minlength="12" maxlength="128" aria-describedby="authPasswordHelp">
        <small id="authPasswordHelp">Use 12–128 characters and at least three character types.</small>
        <label for="authConfirmPassword">Confirm password</label>
        <input id="authConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128" aria-describedby="authConfirmError">
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
  if (backendMode !== 'rest' || requestOnly) {
    start();
    return;
  }
  const client = new AuthApiClient(baseUrl);
  const root = gatewayRoot();
  setWorkspaceVisibility(false);

  const authenticated = (result) => {
    setAuthSession({ csrfToken: result.csrfToken, user: result.user });
    document.body.dataset.experience = result.user?.experienceId ?? '';
    routeAuthorizedWorkspace(result.user);
    root.remove();
    setWorkspaceVisibility(true);
    start();
    attachSessionControls(client);
  };

  const renderLogin = (error) => {
    let form = root.querySelector('#authLoginForm');
    if (!form) {
      root.innerHTML = loginMarkup(error);
      form = root.querySelector('#authLoginForm');
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
