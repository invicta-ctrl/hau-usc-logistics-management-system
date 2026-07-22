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
    if (!response.ok)
      throw new AppError('REST_ERROR', `Backend returned ${response.status}.`, {
        retryable: response.status >= 500,
      });
    return response.json();
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
