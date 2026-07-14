export const SERVICE_METHODS = Object.freeze([
  'submitRequest',
  'submitCompositeRequest',
  'getCompositeRequest',
  'transitionCompositeComponent',
  'cancelCompositeRequest',
  'reopenCompositeRequest',
  'amendCompositeRequest',
  'addCompositeSection',
  'assignCompositeComponent',
  'escalateCompositeComponent',
  'acceptRequest',
  'createLendingTicket',
  'approveLendingTicket',
  'confirmLendingHandoff',
  'confirmLendingReturn',
  'receiveDeliverable',
  'transitionDeliverable',
  'receiveRestock',
  'confirmRelease',
  'transferEventItem',
  'finalizeEvidence',
  'postEmergencyIssue',
  'postCycleCountAdjustment',
]);

export function assertServiceContract(service) {
  const missing = SERVICE_METHODS.filter((name) => typeof service[name] !== 'function');
  if (missing.length) throw new Error(`Service adapter is missing: ${missing.join(', ')}`);
  return service;
}
