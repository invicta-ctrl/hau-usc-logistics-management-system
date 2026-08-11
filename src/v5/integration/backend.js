import { createStateFromEssentialBootstrap, mergeBootstrapModule } from '../../app/bootstrap-contract.js';
import { clearAuthSession, getAuthSession, setAuthSession } from '../../auth/session-state.js';
import { AuthApiClient } from '../../services/auth-api-client.js';
import { HttpApiAdapter } from '../../services/http-api-adapter.js';
import { createLegacyRuntimeAdapter } from '../../services/legacy-runtime-adapter.js';

const trimBase = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\/$/u, '');

function authenticated(result) {
  return Boolean(result?.user && (result.state === 'AUTHENTICATED' || result.csrfToken));
}

export function createV5Backend({ baseUrl = '' } = {}) {
  const endpoint = trimBase(baseUrl);
  const auth = new AuthApiClient(endpoint);
  const api = new HttpApiAdapter(endpoint);
  const commands = createLegacyRuntimeAdapter(null, { mode: 'rest', remote: api });

  return Object.freeze({
    auth,
    api,
    commands,

    async session() {
      const result = await auth.getSession();
      if (!authenticated(result)) {
        clearAuthSession();
        return null;
      }
      setAuthSession({ csrfToken: result.csrfToken, user: result.user });
      return result;
    },

    async login(accessId, password) {
      const result = await auth.login(accessId, password);
      if (!authenticated(result)) return result;
      setAuthSession({ csrfToken: result.csrfToken, user: result.user });
      return result;
    },

    async activateStarter(command) {
      const result = await auth.activate(command);
      if (authenticated(result)) {
        setAuthSession({ csrfToken: result.csrfToken, user: result.user });
      }
      return result;
    },

    async logout() {
      const { csrfToken } = getAuthSession();
      try {
        if (csrfToken) await auth.logout(csrfToken);
      } finally {
        clearAuthSession();
      }
    },

    async bootstrap() {
      const essential = await api.getEssentialBootstrapData({ requestOnly: false });
      return {
        essential,
        state: createStateFromEssentialBootstrap(essential, { requestOnly: false }),
      };
    },

    async module(state, module, params = {}) {
      const response = await api.getBootstrapModule({
        module,
        requestOnly: false,
        page: 1,
        pageSize: module === 'inventory' ? 500 : 100,
        ...params,
      });
      return {
        response,
        state: mergeBootstrapModule(state, response, { backendMode: state.backendMode }),
      };
    },

    publicRequestOptions: () => auth.request('/api/public/request/options', { method: 'GET' }),
    submitPublicRequest: (command) => auth.request('/api/public/request', { body: command }),
    trackPublicRequest: (command) => auth.request('/api/public/request/track', { body: command }),
    relatedPublicRequest: (command) => auth.request('/api/public/request/related', { body: command }),
    publicLendingCatalog: () => auth.request('/api/public/lending/catalog', { method: 'GET' }),
    submitPublicLending: (command) => auth.request('/api/public/lending', { body: command }),
    trackPublicLending: (command) => auth.request('/api/public/lending/track', { body: command }),
    publicAdvertisements: () => auth.request('/api/public/advertisements', { method: 'GET' }),
    profile: () => auth.getProfile(),
    health: () => auth.request('/api/health', { method: 'GET' }),
    readiness: () => auth.request('/api/readiness', { method: 'GET' }),
    version: () => auth.getReleaseIdentity(),
    playgroundStatus: () => auth.request('/api/playground/status', { method: 'GET' }),
    async playgroundSession() {
      const result = await auth.request('/api/playground/session', { body: {} });
      if (authenticated(result)) {
        setAuthSession({ csrfToken: result.csrfToken, user: result.user });
      }
      return result;
    },
    requestPlaygroundOperation(command) {
      return auth.request('/api/playground/operation', {
        body: command,
        csrfToken: getAuthSession().csrfToken ?? '',
      });
    },
  });
}
