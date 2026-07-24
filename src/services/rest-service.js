import { AppError } from '../app/errors.js';
import { getCsrfToken } from '../auth/session-state.js';

export class RestService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.mode = 'rest';
  }
  async _post(path, command) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(getCsrfToken() ? { 'x-csrf-token': getCsrfToken() } : {}),
      },
      body: JSON.stringify(command),
      credentials: 'include',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok)
      throw new AppError(
        result?.code ?? 'REST_ERROR',
        result?.message ?? `Backend returned ${response.status}.`,
        {
          correlationId: result?.correlationId,
          retryable: response.status >= 500,
          details: result?.details,
        },
      );
    return result;
  }
}

for (const method of [
  'submitRequest',
  'submitCompositeRequest',
  'getCompositeRequest',
  'getFoodWorkQueue',
  'updateFoodComponent',
  'getMaterialsWorkQueue',
  'updateMaterialsComponent',
  'getReferenceAdminWorkspace',
  'previewReferenceAdminChange',
  'submitReferenceAdminChange',
  'reviewReferenceAdminChange',
  'transitionCompositeComponent',
  'cancelCompositeRequest',
  'reopenCompositeRequest',
  'amendCompositeRequest',
  'addCompositeSection',
  'assignCompositeComponent',
  'escalateCompositeComponent',
  'reviewRequest',
  'reserveStock',
  'createLendingTicket',
  'approveLendingTicket',
  'confirmLendingHandoff',
  'confirmReturn',
  'saveCanvassReference',
  'selectPreferredCanvass',
  'receiveDeliverable',
  'transitionDeliverable',
  'getRestockDetail',
  'transitionRestock',
  'receiveRestock',
  'confirmRelease',
  'transferEventItem',
  'finalizeEvidence',
  'postEmergencyIssue',
  'postCycleCountAdjustment',
])
  RestService.prototype[method] = function post(command) {
    return this._post(`/api/${method}`, command);
  };

for (const [method, path] of Object.entries({
  listAccessAccounts: '/api/admin/access/directory',
  getAccessIdHistory: '/api/admin/access/history',
  previewAccessIdChange: '/api/admin/access/preview-access-id',
  changeAccessId: '/api/admin/access/change-access-id',
  createAccessAccount: '/api/admin/access/create-account',
  resetAccessPassword: '/api/admin/access/reset-password',
  setAccessAccountStatus: '/api/admin/access/status',
  revokeAccessSessions: '/api/admin/access/revoke-sessions',
  unlockAccessAccount: '/api/admin/access/unlock',
  getLendingUsage: '/api/lending/usage',
  listAdvertisements: '/api/admin/advertisements/list',
  saveAdvertisement: '/api/admin/advertisements/save',
  uploadAdvertisementMedia: '/api/admin/advertisements/upload',
  archiveAdvertisement: '/api/admin/advertisements/archive',
})) {
  RestService.prototype[method] = function post(command) {
    return this._post(path, command);
  };
}
