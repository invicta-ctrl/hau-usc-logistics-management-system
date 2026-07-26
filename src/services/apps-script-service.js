import { AppError } from '../app/errors.js';

export class AppsScriptService {
  constructor() {
    this.mode = 'apps-script';
  }
  _call(method, command) {
    if (!globalThis.google?.script?.run)
      throw new AppError('BACKEND_UNAVAILABLE', 'Google Apps Script is not active in this preview.');
    return new Promise((resolve, reject) =>
      globalThis.google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](command),
    );
  }
}

for (const [client, server] of Object.entries({
  submitRequest: 'api_submitRequest',
  submitCompositeRequest: 'api_submitCompositeRequest',
  getCompositeRequest: 'api_getCompositeRequest',
  getFoodWorkQueue: 'api_getFoodWorkQueue',
  updateFoodComponent: 'api_updateFoodComponent',
  getMaterialsWorkQueue: 'api_getMaterialsWorkQueue',
  updateMaterialsComponent: 'api_updateMaterialsComponent',
  getReferenceAdminWorkspace: 'api_getReferenceAdminWorkspace',
  previewReferenceAdminChange: 'api_previewReferenceAdminChange',
  submitReferenceAdminChange: 'api_submitReferenceAdminChange',
  reviewReferenceAdminChange: 'api_reviewReferenceAdminChange',
  transitionCompositeComponent: 'api_transitionCompositeComponent',
  cancelCompositeRequest: 'api_cancelCompositeRequest',
  reopenCompositeRequest: 'api_reopenCompositeRequest',
  amendCompositeRequest: 'api_amendCompositeRequest',
  addCompositeSection: 'api_addCompositeSection',
  assignCompositeComponent: 'api_assignCompositeComponent',
  escalateCompositeComponent: 'api_escalateCompositeComponent',
  acceptRequest: 'api_acceptRequest',
  createLendingTicket: 'api_createLendingTicket',
  approveLendingTicket: 'api_approveLendingTicket',
  confirmLendingHandoff: 'api_confirmLendingHandoff',
  confirmLendingReturn: 'api_confirmLendingReturn',
  receiveDeliverable: 'api_receiveDeliverable',
  transitionDeliverable: 'api_transitionDeliverable',
  getRestockDetail: 'api_getRestockDetail',
  transitionRestock: 'api_transitionRestock',
  receiveRestock: 'api_receiveRestock',
  confirmRelease: 'api_confirmRelease',
  correctRelease: 'api_correctRelease',
  transferEventItem: 'api_transferEventItem',
  finalizeEvidence: 'api_finalizeEvidence',
  postEmergencyIssue: 'api_postEmergencyIssue',
  postCycleCountAdjustment: 'api_postCycleCountAdjustment',
}))
  AppsScriptService.prototype[client] = function call(command) {
    return this._call(server, command);
  };
