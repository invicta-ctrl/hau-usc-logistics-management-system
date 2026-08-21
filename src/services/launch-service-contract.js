export const LAUNCH_SERVICE_METHODS = Object.freeze([
  'getBootstrapData',
  'getEssentialBootstrapData',
  'getBootstrapModule',
  'getCurrentUser',
  'getDataRevision',
  'getScopedRevision',
  'searchCatalog',
  'submitRequest',
  'reviewRequest',
  'reserveStock',
  'submitCompositeRequest',
  'getCompositeRequest',
  'getFoodWorkQueue',
  'updateFoodComponent',
  'getMaterialsWorkQueue',
  'updateMaterialsComponent',
  'searchVenueEquipmentReferences',
  'getVenueEquipmentWorkQueue',
  'updateVenueEquipmentComponent',
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
  'createLendingTicket',
  'approveLendingTicket',
  'confirmLendingHandoff',
  'confirmReturn',
  'saveCanvassReference',
  'updateCanvassReference',
  'archiveCanvassReference',
  'selectPreferredCanvass',
  'getRestockDetail',
  'transitionRestock',
  'receiveRestock',
  'receiveDeliverable',
  'confirmRelease',
  'correctRelease',
  'transferEventItemToInventory',
  'uploadEvidence',
  'getAuditTimeline',
  'getInventoryItem',
  'listInventoryClassifications',
  'classifyInventoryItem',
  'bulkClassifyInventoryItems',
  'getEventManagement',
  'saveEventSeries',
  'saveEventDay',
  'saveEventActivity',
  'linkEventOperationalRecord',
  'createInventoryItem',
  'updateInventoryItem',
  'updateInventoryStorageContext',
  'archiveInventoryItem',
  'restoreInventoryItem',
]);

export const PROTECTED_RUNTIME_SERVICE_METHODS = Object.freeze([
  'getAccessPolicyOptions',
  'previewAccessPolicy',
  'updateAccessPolicy',
  'getIdentityRosterStatus',
  'listIdentityRoster',
  'previewIdentityRosterSync',
  'applyIdentityRosterSync',
  'rollbackIdentityRosterSync',
  'previewCanonicalIdentityReconciliation',
  'getIdentityRosterSelfProfile',
]);

export function assertLaunchServiceContract(service) {
  const missing = LAUNCH_SERVICE_METHODS.filter((method) => typeof service?.[method] !== 'function');
  if (missing.length) throw new Error(`Launch service adapter is missing: ${missing.join(', ')}`);
  return service;
}

export function assertProtectedRuntimeServiceContract(service) {
  const missing = PROTECTED_RUNTIME_SERVICE_METHODS.filter(
    (method) => typeof service?.[method] !== 'function',
  );
  if (missing.length) throw new Error(`Protected runtime service adapter is missing: ${missing.join(', ')}`);
  return service;
}
