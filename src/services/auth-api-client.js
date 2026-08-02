import { AppError } from '../app/errors.js';
import { AUTH_API_ROUTES } from '../auth/http-contract.js';

export class AuthApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = String(baseUrl).replace(/\/$/u, '');
  }

  async request(path, { method = 'POST', body, csrfToken = '' } = {}) {
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
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
          details: { fieldErrors: result?.fieldErrors, retryAfterMs: result?.retryAfterMs },
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
}
