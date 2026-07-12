import { config } from '../app/config.js';
import { AppsScriptAdapter, fileToEvidencePayload } from './apps-script-adapter.js';
import { HttpApiAdapter } from './http-api-adapter.js';

export const backendMode = config.backendMode;
export const appEnvironment = config.appEnvironment;
const clientRequestId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

export function createLegacyRuntimeAdapter(mockServices) {
  if (backendMode === 'mock') return mockServices;
  const remote = backendMode === 'apps-script' ? new AppsScriptAdapter() : new HttpApiAdapter(config.httpApiBaseUrl);
  const evidencePayload = async (payload, evidenceType) => {
    if (!payload.file) return payload;
    const evidence = { ...(await fileToEvidencePayload(payload.file)), evidenceType };
    const sanitized = { ...payload, evidence };
    delete sanitized.file;
    return sanitized;
  };
  const folderEvidenceType = (metadata) => ({
    RESTOCK_RECEIPTS: 'RESTOCK_RECEIPT', CANVASS_EVIDENCE: 'CANVASS_QUOTE',
    EVENT_DELIVERABLE_EVIDENCE: 'DELIVERABLE_RECEIPT', RELEASE_CONFIRMATIONS: 'RELEASE_CONFIRMATION_PHOTO',
  })[metadata.folderType] ?? metadata.evidenceType ?? 'OTHER_SUPPORTING_DOCUMENT';
  return {
    async loadBootstrapData(options = {}) { const result = await remote.getBootstrapData(options); return result.data ?? result; },
    async submitRequest(payload) { const result = await remote.submitRequest({ ...payload, clientRequestId: payload.clientRequestId ?? clientRequestId('request') }); return { id: result.requestId, displayName: payload.requestType === 'CATALOG_RESTOCK' ? 'Catalog Restock' : payload.eventName || payload.purpose, status: 'FOR_REVIEW', ...result }; },
    reviewRequest(requestId, decision, note = '') { return remote.reviewRequest({ requestId, decision, note, clientRequestId: clientRequestId('review') }); },
    async reserveStock(itemId, quantity, links = {}) { const result = await remote.reserveStock({ itemId, quantity, ...links, clientRequestId: clientRequestId('reserve') }); return result.reservationId; },
    async confirmRelease(payload) { const command = await evidencePayload(payload, 'RELEASE_CONFIRMATION_PHOTO'); const result = await remote.confirmRelease({ ...command, clientRequestId: payload.clientRequestId ?? clientRequestId('release') }); return { id: result.releaseId, ...result }; },
    async receiveRestock(payload) { const command = await evidencePayload(payload, payload.invoiceStatus === 'SALES_INVOICE' ? 'RESTOCK_INVOICE' : 'RESTOCK_RECEIPT'); const result = await remote.receiveRestock({ ...command, clientRequestId: payload.clientRequestId ?? clientRequestId('restock') }); return { id: result.restockId, ...result }; },
    async receiveDeliverable(payload) { const command = await evidencePayload(payload, 'DELIVERABLE_RECEIPT'); const result = await remote.receiveDeliverable({ ...command, clientRequestId: payload.clientRequestId ?? clientRequestId('deliverable') }); return { id: result.deliverableId, ...result }; },
    async createLendingTicket(payload) { const result = await remote.createLendingTicket({ ...payload, clientRequestId: clientRequestId('lending') }); return { id: result.ticketId, status: 'FOR_REVIEW', ...result }; },
    async approveLendingTicket(ticketId) { const result = await remote.approveLendingTicket({ ticketId, clientRequestId: clientRequestId('approve-lending') }); return { id: result.ticketId, ...result }; },
    async confirmLoanHandoff(ticketId) { const result = await remote.confirmLendingHandoff({ ticketId, clientRequestId: clientRequestId('lending-handoff') }); return { id: result.ticketId, ...result }; },
    async confirmReturn(ticketId, notes = '') { const result = await remote.confirmReturn({ ticketId, notes, clientRequestId: clientRequestId('lending-return') }); return { id: result.ticketId, ...result }; },
    async saveCanvassReference(payload) { const command = await evidencePayload(payload, 'CANVASS_QUOTE'); const result = await remote.saveCanvassReference({ ...command, clientRequestId: clientRequestId('canvass') }); return { id: result.canvassId, ...result }; },
    selectPreferredCanvass(payload) { return remote.selectPreferredCanvass({ ...payload, clientRequestId: payload.clientRequestId ?? clientRequestId('preferred-canvass') }); },
    transitionDeliverable(payload) { return remote.transitionDeliverable({ ...payload, clientRequestId: payload.clientRequestId ?? clientRequestId('deliverable-transition') }); },
    async transferEventItemToInventory(payload) { const result = await remote.transferEventItemToInventory({ ...payload, semanticConfirmed: payload.semanticConfirmed === true || payload.semanticConfirmed === 'true', mergeReason: payload.mergeReason || payload.notes, clientRequestId: clientRequestId('transfer') }); return { ...result, target: { id: result.destinationItemId } }; },
    async uploadEvidenceFile(file, metadata = {}) { const result = await remote.uploadEvidence({ ...metadata, evidenceType: folderEvidenceType(metadata), relatedEntityType: metadata.relatedEntityType ?? 'SUPPORTING_RECORD', relatedEntityId: metadata.relatedEntityId ?? metadata.relatedId ?? metadata.requestId ?? 'UNLINKED', secondaryId: metadata.itemId ?? metadata.eventItemId ?? 'NA', ...(await fileToEvidencePayload(file)), clientRequestId: clientRequestId('evidence') }); return { id: result.evidenceId, url: result.driveUrl, ...result }; },
    async uploadRecipientConfirmation(file, metadata = {}) { const result = await remote.uploadEvidence({ ...metadata, evidenceType: 'RELEASE_CONFIRMATION_PHOTO', relatedEntityType: 'RELEASE', relatedEntityId: metadata.relatedEntityId ?? metadata.requestId ?? 'PENDING_RELEASE', secondaryId: metadata.requestId ?? 'NA', ...(await fileToEvidencePayload(file)), clientRequestId: clientRequestId('release-evidence') }); return { id: result.evidenceId, url: result.driveUrl, ...result }; },
  };
}
