import { config } from '../app/config.js';
import { AppsScriptAdapter, fileToEvidencePayload } from './apps-script-adapter.js';
import { HttpApiAdapter } from './http-api-adapter.js';

export const backendMode = config.backendMode;
export const appEnvironment = config.appEnvironment;
export const bootstrapContractVersion = config.bootstrapContractVersion;
export const compositeRequestsEnabled = config.compositeRequestsEnabled;
export const foodRequestsEnabled = config.foodRequestsEnabled;
const clientRequestId = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const stableMutationValue = (value) => {
  if (Array.isArray(value)) return value.map(stableMutationValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
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

export function createLegacyRuntimeAdapter(mockServices) {
  if (backendMode === 'mock') return mockServices;
  const remote =
    backendMode === 'apps-script' ? new AppsScriptAdapter() : new HttpApiAdapter(config.httpApiBaseUrl);
  const mutationRequests = createMutationRequestTracker();
  const evidencePayload = async (payload, evidenceType) => {
    if (!payload.file) return payload;
    const evidence = { ...(await fileToEvidencePayload(payload.file)), evidenceType };
    const sanitized = { ...payload, evidence };
    delete sanitized.file;
    return sanitized;
  };
  const folderEvidenceType = (metadata) =>
    ({
      RESTOCK_RECEIPTS: 'RESTOCK_RECEIPT',
      CANVASS_EVIDENCE: 'CANVASS_QUOTE',
      EVENT_DELIVERABLE_EVIDENCE: 'DELIVERABLE_RECEIPT',
      RELEASE_CONFIRMATIONS: 'RELEASE_CONFIRMATION_PHOTO',
    })[metadata.folderType] ??
    metadata.evidenceType ??
    'OTHER_SUPPORTING_DOCUMENT';
  return {
    async loadBootstrapData(options = {}) {
      const result = await remote.getBootstrapData(options);
      return result.data ?? result;
    },
    async loadEssentialBootstrap(options = {}) {
      const result = await remote.getEssentialBootstrapData(options);
      return result.data ?? result;
    },
    async loadBootstrapModule(module, options = {}) {
      return remote.getBootstrapModule({ ...options, module });
    },
    getDataRevision() {
      return remote.getDataRevision({});
    },
    async getInventoryItem(itemId) {
      const result = await remote.getInventoryItem({ itemId });
      return result.item;
    },
    async submitRequest(payload) {
      const result = await mutationRequests.run('request', payload, (command) =>
        remote.submitRequest(command),
      );
      return {
        id: result.requestId,
        displayName:
          payload.requestType === 'CATALOG_RESTOCK'
            ? 'Catalog Restock'
            : payload.eventName || payload.purpose,
        status: 'FOR_REVIEW',
        ...result,
      };
    },
    async submitCompositeRequest(payload) {
      return mutationRequests.run('composite-request', payload, (command) =>
        remote.submitCompositeRequest(command),
      );
    },
    async getCompositeRequest(requestId) {
      return remote.getCompositeRequest({ requestId });
    },
    async getFoodWorkQueue() {
      return remote.getFoodWorkQueue({});
    },
    updateFoodComponent(payload) {
      return mutationRequests.run('food-update', payload, (command) => remote.updateFoodComponent(command));
    },
    transitionCompositeComponent(payload) {
      return mutationRequests.run('composite-transition', payload, (command) =>
        remote.transitionCompositeComponent(command),
      );
    },
    cancelCompositeRequest(payload) {
      return mutationRequests.run('composite-cancel', payload, (command) =>
        remote.cancelCompositeRequest(command),
      );
    },
    reopenCompositeRequest(payload) {
      return mutationRequests.run('composite-reopen', payload, (command) =>
        remote.reopenCompositeRequest(command),
      );
    },
    amendCompositeRequest(payload) {
      return mutationRequests.run('composite-amend', payload, (command) =>
        remote.amendCompositeRequest(command),
      );
    },
    addCompositeSection(payload) {
      return mutationRequests.run('composite-add-section', payload, (command) =>
        remote.addCompositeSection(command),
      );
    },
    assignCompositeComponent(payload) {
      return mutationRequests.run('composite-assign', payload, (command) =>
        remote.assignCompositeComponent(command),
      );
    },
    escalateCompositeComponent(payload) {
      return mutationRequests.run('composite-escalate', payload, (command) =>
        remote.escalateCompositeComponent(command),
      );
    },
    reviewRequest(requestId, decision, note = '') {
      return mutationRequests.run('review', { requestId, decision, note }, (command) =>
        remote.reviewRequest(command),
      );
    },
    async reserveStock(itemId, quantity, links = {}) {
      const result = await mutationRequests.run('reserve', { itemId, quantity, ...links }, (command) =>
        remote.reserveStock(command),
      );
      return result.reservationId;
    },
    async confirmRelease(payload) {
      const command = await evidencePayload(payload, 'RELEASE_CONFIRMATION_PHOTO');
      const result = await mutationRequests.run('release', command, (tracked) =>
        remote.confirmRelease(tracked),
      );
      return { id: result.releaseId, ...result };
    },
    async receiveRestock(payload) {
      const command = await evidencePayload(
        payload,
        payload.invoiceStatus === 'SALES_INVOICE' ? 'RESTOCK_INVOICE' : 'RESTOCK_RECEIPT',
      );
      const result = await mutationRequests.run('restock', command, (tracked) =>
        remote.receiveRestock(tracked),
      );
      return { id: result.restockId, ...result };
    },
    async receiveDeliverable(payload) {
      const command = await evidencePayload(payload, 'DELIVERABLE_RECEIPT');
      const result = await mutationRequests.run('deliverable', command, (tracked) =>
        remote.receiveDeliverable(tracked),
      );
      return { id: result.deliverableId, ...result };
    },
    async createLendingTicket(payload) {
      const result = await mutationRequests.run('lending', payload, (command) =>
        remote.createLendingTicket(command),
      );
      return { id: result.ticketId, status: 'FOR_REVIEW', ...result };
    },
    async approveLendingTicket(ticketId) {
      const result = await mutationRequests.run('approve-lending', { ticketId }, (command) =>
        remote.approveLendingTicket(command),
      );
      return { id: result.ticketId, ...result };
    },
    async confirmLoanHandoff(ticketId) {
      const result = await mutationRequests.run('lending-handoff', { ticketId }, (command) =>
        remote.confirmLendingHandoff(command),
      );
      return { id: result.ticketId, ...result };
    },
    async confirmReturn(ticketId, notes = '') {
      const result = await mutationRequests.run('lending-return', { ticketId, notes }, (command) =>
        remote.confirmReturn(command),
      );
      return { id: result.ticketId, ...result };
    },
    async saveCanvassReference(payload) {
      const command = await evidencePayload(payload, 'CANVASS_QUOTE');
      const result = await mutationRequests.run('canvass', command, (tracked) =>
        remote.saveCanvassReference(tracked),
      );
      return { id: result.canvassId, ...result };
    },
    selectPreferredCanvass(payload) {
      return mutationRequests.run('preferred-canvass', payload, (command) =>
        remote.selectPreferredCanvass(command),
      );
    },
    transitionDeliverable(payload) {
      return mutationRequests.run('deliverable-transition', payload, (command) =>
        remote.transitionDeliverable(command),
      );
    },
    async transferEventItemToInventory(payload) {
      const command = {
        ...payload,
        semanticConfirmed: payload.semanticConfirmed === true || payload.semanticConfirmed === 'true',
        mergeReason: payload.mergeReason || payload.notes,
      };
      const result = await mutationRequests.run('transfer', command, (tracked) =>
        remote.transferEventItemToInventory(tracked),
      );
      return { ...result, target: { id: result.destinationItemId } };
    },
    async createInventoryItem(payload) {
      const result = await mutationRequests.run('create-item', payload, (command) =>
        remote.createInventoryItem(command),
      );
      return { id: result.itemId, ...result };
    },
    async updateInventoryItem(payload) {
      const result = await mutationRequests.run('update-item', payload, (command) =>
        remote.updateInventoryItem(command),
      );
      return { id: result.itemId, ...result };
    },
    async updateInventoryStorageContext(payload) {
      const result = await mutationRequests.run('update-storage', payload, (command) =>
        remote.updateInventoryStorageContext(command),
      );
      return { id: result.itemId, ...result };
    },
    async archiveInventoryItem(itemId, options = {}) {
      const result = await mutationRequests.run('archive-item', { ...options, itemId }, (command) =>
        remote.archiveInventoryItem(command),
      );
      return { id: result.itemId, ...result };
    },
    async restoreInventoryItem(itemId, options = {}) {
      const result = await mutationRequests.run('restore-item', { ...options, itemId }, (command) =>
        remote.restoreInventoryItem(command),
      );
      return { id: result.itemId, ...result };
    },
    async uploadEvidenceFile(file, metadata = {}) {
      const payload = {
        ...metadata,
        evidenceType: folderEvidenceType(metadata),
        relatedEntityType: metadata.relatedEntityType ?? 'SUPPORTING_RECORD',
        relatedEntityId: metadata.relatedEntityId ?? metadata.relatedId ?? metadata.requestId ?? 'UNLINKED',
        secondaryId: metadata.itemId ?? metadata.eventItemId ?? 'NA',
        ...(await fileToEvidencePayload(file)),
      };
      const result = await mutationRequests.run('evidence', payload, (command) =>
        remote.uploadEvidence(command),
      );
      return { id: result.evidenceId, url: result.driveUrl, ...result };
    },
    async uploadRecipientConfirmation(file, metadata = {}) {
      const payload = {
        ...metadata,
        evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        relatedEntityType: 'RELEASE',
        relatedEntityId: metadata.relatedEntityId ?? metadata.requestId ?? 'PENDING_RELEASE',
        secondaryId: metadata.requestId ?? 'NA',
        ...(await fileToEvidencePayload(file)),
      };
      const result = await mutationRequests.run('release-evidence', payload, (command) =>
        remote.uploadEvidence(command),
      );
      return { id: result.evidenceId, url: result.driveUrl, ...result };
    },
  };
}
