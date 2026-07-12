import { AppError } from '../app/errors.js';

const METHODS = Object.freeze({
  getBootstrapData: 'api_getBootstrapData', getCurrentUser: 'api_getCurrentUser', searchCatalog: 'api_searchCatalog',
  submitRequest: 'api_submitRequest', reviewRequest: 'api_reviewRequest', reserveStock: 'api_reserveStock',
  createLendingTicket: 'api_createLendingTicket', approveLendingTicket: 'api_approveLendingTicket',
  confirmLendingHandoff: 'api_confirmLendingHandoff', confirmReturn: 'api_confirmReturn',
  saveCanvassReference: 'api_saveCanvassReference', selectPreferredCanvass: 'api_selectPreferredCanvass',
  receiveRestock: 'api_receiveRestock', receiveDeliverable: 'api_receiveDeliverable', confirmRelease: 'api_confirmRelease',
  transferEventItemToInventory: 'api_transferEventItemToInventory', uploadEvidence: 'api_uploadEvidence',
  getAuditTimeline: 'api_getAuditTimeline', transitionDeliverable: 'api_transitionDeliverable',
  postEmergencyIssue: 'api_postEmergencyIssue', postCycleCountAdjustment: 'api_postCycleCountAdjustment',
});

export class AppsScriptAdapter {
  constructor({ timeoutMs = 30_000 } = {}) { this.mode = 'apps-script'; this.timeoutMs = timeoutMs; }
  _call(method, command = {}) {
    const runner = globalThis.google?.script?.run;
    if (!runner) return Promise.reject(new AppError('BACKEND_UNAVAILABLE', 'Google Apps Script is unavailable.', { retryable: true }));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new AppError('BACKEND_TIMEOUT', 'The server took too long to respond. Retrying is safe.', { retryable: true })), this.timeoutMs);
      runner.withSuccessHandler((result) => { clearTimeout(timeout); if (!result?.ok) reject(new AppError(result?.code ?? 'SERVER_ERROR', result?.message ?? 'The operation failed.', { correlationId: result?.correlationId, retryable: Boolean(result?.retryable), details: result?.details })); else resolve(result); }).withFailureHandler((error) => { clearTimeout(timeout); reject(new AppError('APPS_SCRIPT_FAILURE', error?.message ?? 'Apps Script failed.', { retryable: true })); })[method](command);
    });
  }
}

for (const [client, server] of Object.entries(METHODS)) AppsScriptAdapter.prototype[client] = function call(command) { return this._call(server, command); };

export async function fileToEvidencePayload(file) {
  if (!file) throw new AppError('FILE_REQUIRED', 'Choose a file.');
  const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new AppError('FILE_READ_FAILED', 'The selected file could not be read.')); reader.onload = () => resolve(String(reader.result).split(',').pop()); reader.readAsDataURL(file); });
  return { originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, base64 };
}
