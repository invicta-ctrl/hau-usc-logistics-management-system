import { AppError } from '../app/errors.js';
import { AUTH_API_ROUTES } from '../auth/http-contract.js';

export class AuthApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = String(baseUrl).replace(/\/$/u, '');
  }

  async request(path, { method = 'POST', body, csrfToken = '', bearerToken = '' } = {}) {
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;
    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new AppError(
        'AUTH_SERVICE_UNAVAILABLE',
        'The authentication service is temporarily unavailable.',
        { retryable: true },
      );
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AppError(
        result?.code ?? 'AUTH_REQUEST_FAILED',
        result?.message ?? 'The authentication request failed.',
        {
          correlationId: response.headers.get('x-correlation-id') ?? result?.correlationId,
          retryable: response.status >= 500,
          details: {
            ...(result?.details ?? {}),
            fieldErrors: result?.fieldErrors ?? result?.details?.fieldErrors,
            retryAfterMs: result?.retryAfterMs ?? result?.details?.retryAfterMs,
          },
        },
      );
    }
    return result;
  }

  async getSession() {
    try {
      return await this.request(AUTH_API_ROUTES.session, { method: 'GET' });
    } catch (error) {
      if (error.code === 'SESSION_REQUIRED') return null;
      throw error;
    }
  }

  getReleaseIdentity() {
    return this.request('/api/version', { method: 'GET' });
  }

  login(accessId, password) {
    return this.request(AUTH_API_ROUTES.login, { body: { accessId, password } });
  }

  activate({ profile, password, confirmPassword, csrfToken }) {
    return this.request(AUTH_API_ROUTES.activate, {
      body: { profile, password, confirmPassword },
      csrfToken,
    });
  }

  logout(csrfToken) {
    return this.request(AUTH_API_ROUTES.logout, { body: {}, csrfToken });
  }

  startAccountApplicationEmail(email) {
    return this.request('/api/account-applications/email/start', { body: { email } });
  }

  confirmAccountApplicationEmail(email, code) {
    return this.request('/api/account-applications/email/confirm', { body: { email, code } });
  }

  submitAccountApplication(command, statusToken = '') {
    return this.request('/api/account-applications', { body: command, bearerToken: statusToken });
  }

  getAccountApplicationStatus(statusToken) {
    return this.request('/api/account-applications/status', {
      method: 'GET',
      bearerToken: statusToken,
    });
  }

  withdrawAccountApplication(statusToken, command) {
    return this.request('/api/account-applications/withdraw', {
      body: command,
      bearerToken: statusToken,
    });
  }

  listAccountApplications(queue, { limit = 25, offset = 0 } = {}) {
    const prefix = queue === 'director' ? '/api/director' : '/api/admin';
    return this.request(`${prefix}/account-applications?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  getAccountApplicationForReview(queue, applicationId) {
    const prefix = queue === 'director' ? '/api/director' : '/api/admin';
    return this.request(`${prefix}/account-applications/${encodeURIComponent(applicationId)}`, {
      method: 'GET',
    });
  }

  decideAccountApplication(queue, applicationId, action, command, csrfToken) {
    const prefix = queue === 'director' ? '/api/director' : '/api/admin';
    return this.request(
      `${prefix}/account-applications/${encodeURIComponent(applicationId)}/${encodeURIComponent(action)}`,
      { body: command, csrfToken },
    );
  }

  overrideAccountApplication(applicationId, command, csrfToken) {
    return this.request(`/api/owner/account-applications/${encodeURIComponent(applicationId)}/override`, {
      body: command,
      csrfToken,
    });
  }

  getProfile() {
    return this.request('/api/me/profile', { method: 'GET' });
  }

  updateProfileContact(command, csrfToken) {
    return this.request('/api/me/profile', { method: 'PATCH', body: command, csrfToken });
  }

  changeProfileUsername(command, csrfToken) {
    return this.request('/api/me/username/change', { body: command, csrfToken });
  }

  changeProfilePassword(command, csrfToken) {
    return this.request('/api/me/password/change', { body: command, csrfToken });
  }

  requestProfileIdentityCorrection(command, csrfToken) {
    return this.request('/api/me/identity-correction-request', { body: command, csrfToken });
  }
}
