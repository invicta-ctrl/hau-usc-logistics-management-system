import { AppError } from '../app/errors.js';

const METHODS = Object.freeze({
  getBootstrapData: 'api_getBootstrapData', getCurrentUser: 'api_getCurrentUser', getDataRevision: 'api_getDataRevision', searchCatalog: 'api_searchCatalog',
  getLendingBootstrap: 'api_getLendingBootstrap', getAdminDashboard: 'api_getAdminDashboard', getPublishedContent: 'api_getPublishedContent',
  previewContentRevision: 'api_previewContentRevision', getBrandingState: 'api_getBrandingState',
  submitRequest: 'api_submitRequest', reviewRequest: 'api_reviewRequest', reserveStock: 'api_reserveStock',
  createLendingTicket: 'api_createLendingTicket', approveLendingTicket: 'api_approveLendingTicket',
  confirmLendingHandoff: 'api_confirmLendingHandoff', confirmReturn: 'api_confirmReturn',
  saveCanvassReference: 'api_saveCanvassReference', selectPreferredCanvass: 'api_selectPreferredCanvass',
  receiveRestock: 'api_receiveRestock', receiveDeliverable: 'api_receiveDeliverable', confirmRelease: 'api_confirmRelease',
  transferEventItemToInventory: 'api_transferEventItemToInventory', uploadEvidence: 'api_uploadEvidence',
  getAuditTimeline: 'api_getAuditTimeline', transitionDeliverable: 'api_transitionDeliverable',
  postEmergencyIssue: 'api_postEmergencyIssue', postCycleCountAdjustment: 'api_postCycleCountAdjustment',
  getInventoryItem: 'api_getInventoryItem', createInventoryItem: 'api_createInventoryItem',
  updateInventoryItem: 'api_updateInventoryItem', updateInventoryStorageContext: 'api_updateInventoryStorageContext',
  archiveInventoryItem: 'api_archiveInventoryItem', restoreInventoryItem: 'api_restoreInventoryItem',
  resolveInventoryVerification: 'api_resolveInventoryVerification', saveUserAccess: 'api_saveUserAccess',
  createUserAccess: 'api_createUserAccess', updateUserAccess: 'api_updateUserAccess', deactivateUserAccess: 'api_deactivateUserAccess',
  saveEvent: 'api_saveEvent', createEvent: 'api_createEvent', createSubEvent: 'api_createSubEvent', updateEvent: 'api_updateEvent', archiveEvent: 'api_archiveEvent', restoreEvent: 'api_restoreEvent',
  saveContentRevision: 'api_saveContentRevision', publishContentRevision: 'api_publishContentRevision', revertContentRevision: 'api_revertContentRevision',
  saveBrandingMetadata: 'api_saveBrandingMetadata', activateBrandingVersion: 'api_activateBrandingVersion',
  updateCanvassReference: 'api_updateCanvassReference', archiveCanvassReference: 'api_archiveCanvassReference', restoreCanvassReference: 'api_restoreCanvassReference',
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
