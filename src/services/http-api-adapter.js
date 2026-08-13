import { AppError } from '../app/errors.js';
import { getCsrfToken } from '../auth/session-state.js';
import { LAUNCH_SERVICE_METHODS } from './launch-service-contract.js';

export class HttpApiAdapter {
  constructor(baseUrl) {
    this.mode = 'http';
    this.baseUrl = String(baseUrl ?? '').replace(/\/$/, '');
  }
  async _call(method, command = {}) {
    return this._callPath(`/api/${method}`, command);
  }
  async _callPath(path, command = {}) {
    const csrfToken = getCsrfToken();
    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify(command),
      });
    } catch {
      throw new AppError('HTTP_SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.', {
        retryable: true,
      });
    }
    const result = await response.json().catch(() => null);
    const correlationId = response.headers.get('x-correlation-id') ?? result?.correlationId;
    if (!response.ok || !result?.ok)
      throw new AppError(
        result?.code ?? 'HTTP_ERROR',
        result?.message ?? `Server returned ${response.status}.`,
        { correlationId, retryable: response.status >= 500, details: result?.details },
      );
    return correlationId && !result.correlationId ? { ...result, correlationId } : result;
  }
}
for (const method of LAUNCH_SERVICE_METHODS)
  HttpApiAdapter.prototype[method] = function call(command) {
    return this._call(method, command);
  };

for (const [method, path] of Object.entries({
  listAccessAccounts: '/api/admin/access/directory',
  getAccessIdHistory: '/api/admin/access/history',
  previewAccessIdChange: '/api/admin/access/preview-access-id',
  changeAccessId: '/api/admin/access/change-access-id',
  getAccessPolicyOptions: '/api/admin/access/options',
  previewAccessPolicy: '/api/admin/access/preview-policy',
  updateAccessPolicy: '/api/admin/access/update-policy',
  createAccessAccount: '/api/admin/access/create-account',
  seedDepartmentAccessAccounts: '/api/admin/access/seed-departments',
  resetAccessPassword: '/api/admin/access/reset-password',
  setAccessAccountStatus: '/api/admin/access/status',
  revokeAccessSessions: '/api/admin/access/revoke-sessions',
  unlockAccessAccount: '/api/admin/access/unlock',
  getEvidenceSystemStatus: '/api/owner/evidence/status',
  getIdentityRosterStatus: '/api/owner/identity-roster/status',
  previewIdentityRosterSync: '/api/owner/identity-roster/preview',
  listIdentityRoster: '/api/owner/identity-roster/directory',
  applyIdentityRosterSync: '/api/owner/identity-roster/apply',
  rollbackIdentityRosterSync: '/api/owner/identity-roster/rollback',
  previewCanonicalIdentityReconciliation: '/api/owner/identity-foundation/reconciliation-preview',
  getIdentityRosterSelfProfile: '/api/identity-roster/self',
  getLendingUsage: '/api/lending/usage',
  listAdvertisements: '/api/admin/advertisements/list',
  previewAdvertisement: '/api/admin/advertisements/preview',
  saveAdvertisement: '/api/admin/advertisements/save',
  uploadAdvertisementMedia: '/api/admin/advertisements/upload',
  publishAdvertisement: '/api/admin/advertisements/publish',
  scheduleAdvertisement: '/api/admin/advertisements/schedule',
  pauseAdvertisement: '/api/admin/advertisements/pause',
  resumeAdvertisement: '/api/admin/advertisements/resume',
  archiveAdvertisement: '/api/admin/advertisements/archive',
  listReferenceLinks: '/api/admin/reference-links/list',
  getReferenceLink: '/api/admin/reference-links/get',
  getReferenceLinkHistory: '/api/admin/reference-links/history',
  createReferenceLink: '/api/admin/reference-links/create',
  updateReferenceLink: '/api/admin/reference-links/update',
  transitionReferenceLink: '/api/admin/reference-links/transition',
  listBrandAssets: '/api/owner/brand-assets/list',
  uploadBrandAsset: '/api/owner/brand-assets/upload',
  publishBrandAsset: '/api/owner/brand-assets/publish',
  rollbackBrandAsset: '/api/owner/brand-assets/rollback',
})) {
  HttpApiAdapter.prototype[method] = function call(command) {
    return this._callPath(path, command);
  };
}
