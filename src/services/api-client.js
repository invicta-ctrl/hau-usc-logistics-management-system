import { config } from '../app/config.js';
import { AppsScriptAdapter } from './apps-script-adapter.js';
import { HttpApiAdapter } from './http-api-adapter.js';
import { MockAdapter } from './mock-adapter.js';
import { assertLaunchServiceContract } from './launch-service-contract.js';

export function createApiClient({ store, mode = config.backendMode } = {}) {
  if (mode === 'apps-script') return assertLaunchServiceContract(new AppsScriptAdapter());
  if (mode === 'http' || mode === 'rest') return assertLaunchServiceContract(new HttpApiAdapter(config.httpApiBaseUrl));
  if (!store) throw new Error('Mock mode requires a store.');
  return assertLaunchServiceContract(new MockAdapter(store));
}

