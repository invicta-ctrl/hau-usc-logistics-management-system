export const LAUNCH_SERVICE_METHODS = Object.freeze([
  'getBootstrapData', 'getLendingBootstrap', 'getCurrentUser', 'getDataRevision', 'searchCatalog', 'getAdminDashboard', 'getPublishedContent', 'previewContentRevision', 'getBrandingState', 'submitRequest', 'reviewRequest', 'reserveStock',
  'createLendingTicket', 'approveLendingTicket', 'confirmLendingHandoff', 'confirmReturn',
  'saveCanvassReference', 'selectPreferredCanvass', 'receiveRestock', 'receiveDeliverable',
  'confirmRelease', 'transferEventItemToInventory', 'uploadEvidence', 'getAuditTimeline',
  'getInventoryItem', 'createInventoryItem', 'updateInventoryItem', 'updateInventoryStorageContext',
  'archiveInventoryItem', 'restoreInventoryItem', 'resolveInventoryVerification',
  'saveUserAccess', 'createUserAccess', 'updateUserAccess', 'deactivateUserAccess',
  'saveEvent', 'createEvent', 'createSubEvent', 'updateEvent', 'archiveEvent', 'restoreEvent',
  'saveContentRevision', 'publishContentRevision', 'revertContentRevision',
  'saveBrandingMetadata', 'activateBrandingVersion',
  'updateCanvassReference', 'archiveCanvassReference', 'restoreCanvassReference',
]);

export function assertLaunchServiceContract(service) {
  const missing = LAUNCH_SERVICE_METHODS.filter((method) => typeof service?.[method] !== 'function');
  if (missing.length) throw new Error(`Launch service adapter is missing: ${missing.join(', ')}`);
  return service;
}
