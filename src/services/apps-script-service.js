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
  acceptRequest: 'api_acceptRequest',
  createLendingTicket: 'api_createLendingTicket',
  approveLendingTicket: 'api_approveLendingTicket',
  confirmLendingHandoff: 'api_confirmLendingHandoff',
  confirmLendingReturn: 'api_confirmLendingReturn',
  receiveDeliverable: 'api_receiveDeliverable',
  transitionDeliverable: 'api_transitionDeliverable',
  receiveRestock: 'api_receiveRestock',
  confirmRelease: 'api_confirmRelease',
  transferEventItem: 'api_transferEventItem',
  finalizeEvidence: 'api_finalizeEvidence',
  postEmergencyIssue: 'api_postEmergencyIssue',
  postCycleCountAdjustment: 'api_postCycleCountAdjustment',
}))
  AppsScriptService.prototype[client] = function call(command) {
    return this._call(server, command);
  };
