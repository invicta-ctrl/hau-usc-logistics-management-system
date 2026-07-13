export const LAUNCH_SERVICE_METHODS = Object.freeze([
  'getBootstrapData', 'getCurrentUser', 'getDataRevision', 'searchCatalog', 'submitRequest', 'reviewRequest', 'reserveStock',
  'createLendingTicket', 'approveLendingTicket', 'confirmLendingHandoff', 'confirmReturn',
  'saveCanvassReference', 'selectPreferredCanvass', 'receiveRestock', 'receiveDeliverable',
  'confirmRelease', 'transferEventItemToInventory', 'uploadEvidence', 'getAuditTimeline',
  'getInventoryItem', 'createInventoryItem', 'updateInventoryItem', 'updateInventoryStorageContext',
  'archiveInventoryItem', 'restoreInventoryItem',
]);

export function assertLaunchServiceContract(service) {
  const missing = LAUNCH_SERVICE_METHODS.filter((method) => typeof service?.[method] !== 'function');
  if (missing.length) throw new Error(`Launch service adapter is missing: ${missing.join(', ')}`);
  return service;
}

