import { config } from '../app/config.js';
import { AppsScriptAdapter, fileToEvidencePayload } from './apps-script-adapter.js';
import { HttpApiAdapter } from './http-api-adapter.js';

export const backendMode = config.backendMode;
export const appEnvironment = config.appEnvironment;
const clientRequestId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const stableMutationValue = (value) => {
  if (Array.isArray(value)) return value.map(stableMutationValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      if (key !== 'clientRequestId') result[key] = stableMutationValue(value[key]);
      return result;
    }, {});
  }
  return value;
};

export function createMutationRequestTracker({ createId = clientRequestId } = {}) {
  const pending = new Map();
  return {
    async run(prefix, payload, invoke) {
      const command = payload ?? {};
      const fingerprint = `${prefix}:${JSON.stringify(stableMutationValue(command))}`;
      const requestId = command.clientRequestId ?? pending.get(fingerprint) ?? createId(prefix);
      pending.set(fingerprint, requestId);
      try {
        const result = await invoke({ ...command, clientRequestId: requestId });
        pending.delete(fingerprint);
        return result;
      } catch (error) {
        if (!error?.retryable) pending.delete(fingerprint);
        throw error;
      }
    },
  };
}

export function normalizeReturnPayload(ticketOrPayload, notesOrPayload = '') {
  if (ticketOrPayload && typeof ticketOrPayload === 'object') return { ...ticketOrPayload };
  if (notesOrPayload && typeof notesOrPayload === 'object') {
    return { ticketId: ticketOrPayload, ...notesOrPayload };
  }
  return { ticketId: ticketOrPayload, notes: notesOrPayload };
}

export async function normalizeBrandingUploadCommand(
  fileOrPayload,
  metadata = {},
  convertFile = fileToEvidencePayload,
) {
  const payload = fileOrPayload?.file
    ? { ...fileOrPayload }
    : { ...metadata, file: fileOrPayload };
  const command = payload.file
    ? { ...payload, ...(await convertFile(payload.file)) }
    : { ...payload };
  delete command.file;
  return command;
}

export function createLegacyRuntimeAdapter(mockServices) {
  if (backendMode === 'mock') return mockServices;
  const remote = backendMode === 'apps-script' ? new AppsScriptAdapter() : new HttpApiAdapter(config.httpApiBaseUrl);
  const mutationRequests = createMutationRequestTracker();
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
    async loadBootstrapData(options = {}) { const result = options.portalMode === 'lending' ? await remote.getLendingBootstrap(options) : await remote.getBootstrapData(options); return result.data ?? result; },
    getDataRevision() { return remote.getDataRevision({}); },
    async getInventoryItem(itemId) { const result = await remote.getInventoryItem({ itemId }); return result.item; },
    async submitRequest(payload) { const result = await mutationRequests.run('request', payload, (command) => remote.submitRequest(command)); return { id: result.requestId, displayName: payload.requestType === 'CATALOG_RESTOCK' ? 'Catalog Restock' : payload.eventName || payload.purpose, status: 'FOR_REVIEW', ...result }; },
    reviewRequest(requestId, decision, note = '') { return mutationRequests.run('review', { requestId, decision, note }, (command) => remote.reviewRequest(command)); },
    async reserveStock(itemId, quantity, links = {}) { const result = await mutationRequests.run('reserve', { itemId, quantity, ...links }, (command) => remote.reserveStock(command)); return result.reservationId; },
    async confirmRelease(payload) { const command = await evidencePayload(payload, 'RELEASE_CONFIRMATION_PHOTO'); const result = await mutationRequests.run('release', command, (tracked) => remote.confirmRelease(tracked)); return { id: result.releaseId, ...result }; },
    async receiveRestock(payload) { const command = await evidencePayload(payload, payload.invoiceStatus === 'SALES_INVOICE' ? 'RESTOCK_INVOICE' : 'RESTOCK_RECEIPT'); const result = await mutationRequests.run('restock', command, (tracked) => remote.receiveRestock(tracked)); return { id: result.restockId, ...result }; },
    async receiveDeliverable(payload) { const command = await evidencePayload(payload, 'DELIVERABLE_RECEIPT'); const result = await mutationRequests.run('deliverable', command, (tracked) => remote.receiveDeliverable(tracked)); return { id: result.deliverableId, ...result }; },
    async createLendingTicket(payload) { const result = await mutationRequests.run('lending', payload, (command) => remote.createLendingTicket(command)); return { id: result.ticketId, status: 'FOR_REVIEW', ...result }; },
    async approveLendingTicket(ticketId) { const result = await mutationRequests.run('approve-lending', { ticketId }, (command) => remote.approveLendingTicket(command)); return { id: result.ticketId, ...result }; },
    async confirmLoanHandoff(ticketId) { const result = await mutationRequests.run('lending-handoff', { ticketId }, (command) => remote.confirmLendingHandoff(command)); return { id: result.ticketId, ...result }; },
    async confirmReturn(ticketOrPayload, notes = '') { const payload = normalizeReturnPayload(ticketOrPayload, notes); const command = await evidencePayload(payload, 'LENDING_RETURN_PHOTO'); const result = await mutationRequests.run('lending-return', command, (tracked) => remote.confirmReturn(tracked)); return { id: result.ticketId, ...result }; },
    async saveCanvassReference(payload) { const command = await evidencePayload(payload, 'CANVASS_QUOTE'); const result = await mutationRequests.run('canvass', command, (tracked) => remote.saveCanvassReference(tracked)); return { id: result.canvassId, ...result }; },
    selectPreferredCanvass(payload) { return mutationRequests.run('preferred-canvass', payload, (command) => remote.selectPreferredCanvass(command)); },
    transitionDeliverable(payload) { return mutationRequests.run('deliverable-transition', payload, (command) => remote.transitionDeliverable(command)); },
    async transferEventItemToInventory(payload) { const command = { ...payload, semanticConfirmed: payload.semanticConfirmed === true || payload.semanticConfirmed === 'true', mergeReason: payload.mergeReason || payload.notes }; const result = await mutationRequests.run('transfer', command, (tracked) => remote.transferEventItemToInventory(tracked)); return { ...result, target: { id: result.destinationItemId } }; },
    async createInventoryItem(payload) { const result = await mutationRequests.run('create-item', payload, (command) => remote.createInventoryItem(command)); return { id: result.itemId, ...result }; },
    async updateInventoryItem(payload) { const result = await mutationRequests.run('update-item', payload, (command) => remote.updateInventoryItem(command)); return { id: result.itemId, ...result }; },
    async updateInventoryStorageContext(payload) { const result = await mutationRequests.run('update-storage', payload, (command) => remote.updateInventoryStorageContext(command)); return { id: result.itemId, ...result }; },
    async archiveInventoryItem(itemId, options = {}) { const result = await mutationRequests.run('archive-item', { ...options, itemId }, (command) => remote.archiveInventoryItem(command)); return { id: result.itemId, ...result }; },
    async restoreInventoryItem(itemId, options = {}) { const result = await mutationRequests.run('restore-item', { ...options, itemId }, (command) => remote.restoreInventoryItem(command)); return { id: result.itemId, ...result }; },
    async resolveInventoryVerification(payload) { const result = await mutationRequests.run('resolve-verification', payload, (command) => remote.resolveInventoryVerification(command)); return { id: result.itemId, ...result }; },
    async uploadEvidenceFile(file, metadata = {}) { const payload = { ...metadata, evidenceType: folderEvidenceType(metadata), relatedEntityType: metadata.relatedEntityType ?? 'SUPPORTING_RECORD', relatedEntityId: metadata.relatedEntityId ?? metadata.relatedId ?? metadata.requestId ?? 'UNLINKED', secondaryId: metadata.itemId ?? metadata.eventItemId ?? 'NA', ...(await fileToEvidencePayload(file)) }; const result = await mutationRequests.run('evidence', payload, (command) => remote.uploadEvidence(command)); return { id: result.evidenceId, ...result }; },
    async uploadRecipientConfirmation(file, metadata = {}) { const payload = { ...metadata, evidenceType: 'RELEASE_CONFIRMATION_PHOTO', relatedEntityType: 'RELEASE', relatedEntityId: metadata.relatedEntityId ?? metadata.requestId ?? 'PENDING_RELEASE', secondaryId: metadata.requestId ?? 'NA', ...(await fileToEvidencePayload(file)) }; const result = await mutationRequests.run('release-evidence', payload, (command) => remote.uploadEvidence(command)); return { id: result.evidenceId, ...result }; },
    getAdminDashboard() { return remote.getAdminDashboard({}); },
    getPublishedContent() { return remote.getPublishedContent({}); },
    previewContentRevision(payload) { return remote.previewContentRevision(payload); },
    getBrandingState() { return remote.getBrandingState({}); },
    saveUserAccess(payload) { return mutationRequests.run('user-access', payload, (command) => remote.saveUserAccess(command)); },
    saveEvent(payload) { return mutationRequests.run('event', payload, (command) => remote.saveEvent(command)); },
    saveContentRevision(payload) { return mutationRequests.run('content-draft', payload, (command) => remote.saveContentRevision(command)); },
    publishContentRevision(payload) { return mutationRequests.run('content-publish', payload, (command) => remote.publishContentRevision(command)); },
    revertContentRevision(payload) { return mutationRequests.run('content-revert', payload, (command) => remote.revertContentRevision(command)); },
    saveBrandingMetadata(payload) { return mutationRequests.run('branding', payload, (command) => remote.saveBrandingMetadata(command)); },
    async uploadBrandingAsset(fileOrPayload, metadata = {}) { const command = await normalizeBrandingUploadCommand(fileOrPayload, metadata); return mutationRequests.run('branding-upload', command, (tracked) => remote.uploadBrandingAsset(tracked)); },
    activateBrandingVersion(payload) { return mutationRequests.run('branding-activate', payload, (command) => remote.activateBrandingVersion(command)); },
    updateCanvassReference(payload) { return mutationRequests.run('canvass-update', payload, (command) => remote.updateCanvassReference(command)); },
    archiveCanvassReference(payload) { return mutationRequests.run('canvass-archive', payload, (command) => remote.archiveCanvassReference(command)); },
    restoreCanvassReference(payload) { return mutationRequests.run('canvass-restore', payload, (command) => remote.restoreCanvassReference(command)); },
  };
}
