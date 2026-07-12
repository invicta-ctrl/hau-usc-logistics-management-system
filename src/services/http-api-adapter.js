import { AppError } from '../app/errors.js';
import { LAUNCH_SERVICE_METHODS } from './launch-service-contract.js';

export class HttpApiAdapter {
  constructor(baseUrl) { this.mode = 'http'; this.baseUrl = String(baseUrl ?? '').replace(/\/$/, ''); }
  async _call(method, command = {}) {
    if (!this.baseUrl) throw new AppError('BACKEND_UNAVAILABLE', 'HTTP API mode is not configured.');
    const response = await fetch(`${this.baseUrl}/api/${method}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(command) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw new AppError(result?.code ?? 'HTTP_ERROR', result?.message ?? `Server returned ${response.status}.`, { correlationId: result?.correlationId, retryable: response.status >= 500, details: result?.details });
    return result;
  }
}
for (const method of LAUNCH_SERVICE_METHODS) HttpApiAdapter.prototype[method] = function call(command) { return this._call(method, command); };

