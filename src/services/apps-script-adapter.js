import { AppError } from '../app/errors.js';

const METHODS = Object.freeze({
  getBootstrapData: 'api_getBootstrapData',
  getEssentialBootstrapData: 'api_getEssentialBootstrapData',
  getBootstrapModule: 'api_getBootstrapModule',
  getCurrentUser: 'api_getCurrentUser',
  getDataRevision: 'api_getDataRevision',
  getScopedRevision: 'api_getScopedRevision',
  searchCatalog: 'api_searchCatalog',
  submitRequest: 'api_submitRequest',
  reviewRequest: 'api_reviewRequest',
  reserveStock: 'api_reserveStock',
  submitCompositeRequest: 'api_submitCompositeRequest',
  getCompositeRequest: 'api_getCompositeRequest',
  getFoodWorkQueue: 'api_getFoodWorkQueue',
  updateFoodComponent: 'api_updateFoodComponent',
  getMaterialsWorkQueue: 'api_getMaterialsWorkQueue',
  updateMaterialsComponent: 'api_updateMaterialsComponent',
  searchVenueEquipmentReferences: 'api_searchVenueEquipmentReferences',
  getVenueEquipmentWorkQueue: 'api_getVenueEquipmentWorkQueue',
  updateVenueEquipmentComponent: 'api_updateVenueEquipmentComponent',
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
  createLendingTicket: 'api_createLendingTicket',
  approveLendingTicket: 'api_approveLendingTicket',
  confirmLendingHandoff: 'api_confirmLendingHandoff',
  confirmReturn: 'api_confirmReturn',
  saveCanvassReference: 'api_saveCanvassReference',
  selectPreferredCanvass: 'api_selectPreferredCanvass',
  getRestockDetail: 'api_getRestockDetail',
  transitionRestock: 'api_transitionRestock',
  receiveRestock: 'api_receiveRestock',
  receiveDeliverable: 'api_receiveDeliverable',
  confirmRelease: 'api_confirmRelease',
  correctRelease: 'api_correctRelease',
  transferEventItemToInventory: 'api_transferEventItemToInventory',
  uploadEvidence: 'api_uploadEvidence',
  getAuditTimeline: 'api_getAuditTimeline',
  transitionDeliverable: 'api_transitionDeliverable',
  postEmergencyIssue: 'api_postEmergencyIssue',
  postCycleCountAdjustment: 'api_postCycleCountAdjustment',
  getInventoryItem: 'api_getInventoryItem',
  listInventoryClassifications: 'api_listInventoryClassifications',
  classifyInventoryItem: 'api_classifyInventoryItem',
  createInventoryItem: 'api_createInventoryItem',
  updateInventoryItem: 'api_updateInventoryItem',
  updateInventoryStorageContext: 'api_updateInventoryStorageContext',
  archiveInventoryItem: 'api_archiveInventoryItem',
  restoreInventoryItem: 'api_restoreInventoryItem',
});

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_BOOTSTRAP_MODULE_TIMEOUT_MS = 60_000;

export class AppsScriptAdapter {
  constructor({
    timeoutMs = DEFAULT_TIMEOUT_MS,
    bootstrapModuleTimeoutMs = DEFAULT_BOOTSTRAP_MODULE_TIMEOUT_MS,
  } = {}) {
    this.mode = 'apps-script';
    this.timeoutMs = timeoutMs;
    this.bootstrapModuleTimeoutMs = bootstrapModuleTimeoutMs;
  }
  _call(method, command = {}) {
    const runner = globalThis.google?.script?.run;
    if (!runner)
      return Promise.reject(
        new AppError('BACKEND_UNAVAILABLE', 'Google Apps Script is unavailable.', { retryable: true }),
      );
    return new Promise((resolve, reject) => {
      const timeoutMs =
        method === METHODS.getBootstrapModule ? this.bootstrapModuleTimeoutMs : this.timeoutMs;
      const timeout = setTimeout(
        () =>
          reject(
            new AppError('BACKEND_TIMEOUT', 'The server took too long to respond. Retrying is safe.', {
              retryable: true,
            }),
          ),
        timeoutMs,
      );
      const guardedRunner = runner
        .withSuccessHandler((result) => {
          clearTimeout(timeout);
          let normalized;
          try {
            normalized = result && typeof result === 'object' ? JSON.parse(JSON.stringify(result)) : result;
          } catch {
            reject(
              new AppError('APPS_SCRIPT_FAILURE', 'Apps Script returned an unsupported response.', {
                retryable: true,
              }),
            );
            return;
          }
          if (!normalized?.ok)
            reject(
              new AppError(
                normalized?.code ?? 'SERVER_ERROR',
                normalized?.message ?? 'The operation failed.',
                {
                  correlationId: normalized?.correlationId,
                  retryable: Boolean(normalized?.retryable),
                  details: normalized?.details,
                },
              ),
            );
          else resolve(normalized);
        })
        .withFailureHandler((error) => {
          clearTimeout(timeout);
          reject(
            new AppError('APPS_SCRIPT_FAILURE', error?.message ?? 'Apps Script failed.', { retryable: true }),
          );
        });
      guardedRunner[method](command);
    });
  }
}

for (const [client, server] of Object.entries(METHODS))
  AppsScriptAdapter.prototype[client] = function call(command) {
    return this._call(server, command);
  };

export async function fileToEvidencePayload(file) {
  if (!file) throw new AppError('FILE_REQUIRED', 'Choose a file.');
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AppError('FILE_READ_FAILED', 'The selected file could not be read.'));
    reader.onload = () => resolve(String(reader.result).split(',').pop());
    reader.readAsDataURL(file);
  });
  return { originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, base64 };
}
