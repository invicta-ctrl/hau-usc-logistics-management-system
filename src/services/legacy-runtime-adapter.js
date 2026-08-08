import { config } from '../app/config.js';
import { AppsScriptAdapter, fileToEvidencePayload } from './apps-script-adapter.js';
import { HttpApiAdapter } from './http-api-adapter.js';
import { assertProtectedRuntimeServiceContract } from './launch-service-contract.js';

export const backendMode = config.backendMode;
export const appEnvironment = config.appEnvironment;
export const bootstrapContractVersion = config.bootstrapContractVersion;
export const compositeRequestsEnabled = config.compositeRequestsEnabled;
export const foodRequestsEnabled = config.foodRequestsEnabled;
export const materialsRequestsEnabled = config.materialsRequestsEnabled;
export const venueEquipmentRequestsEnabled = config.venueEquipmentRequestsEnabled;
const clientRequestId = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const mutationOperationalContext = () => {
  if (typeof globalThis.location === 'undefined') return {};
  const match = globalThis.location.pathname.match(
    /^\/app\/(admin|director|food|inventory|materials)(?:\/|$)/u,
  );
  return {
    activeWorkspace: match?.[1] ?? '',
    operationalScope: new URL(globalThis.location.href).searchParams.get('scope') ?? '',
  };
};

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
      const command = { ...(payload ?? {}), ...mutationOperationalContext() };
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

export function createLegacyRuntimeAdapter(
  mockServices,
  { mode = backendMode, remote: providedRemote } = {},
) {
  if (mode === 'mock') return mockServices;
  const remote =
    providedRemote ??
    (mode === 'apps-script' ? new AppsScriptAdapter() : new HttpApiAdapter(config.httpApiBaseUrl));
  if (mode === 'rest' || mode === 'http') assertProtectedRuntimeServiceContract(remote);
  const mutationRequests = createMutationRequestTracker();
  const evidencePayload = async (payload, evidenceType) => {
    if (!payload.file) return payload;
    const filePayload = await fileToEvidencePayload(payload.file);
    if (mode === 'apps-script') {
      const sanitized = { ...payload, evidence: { ...filePayload, evidenceType } };
      delete sanitized.file;
      return sanitized;
    }
    const relatedEntityId =
      payload.requestId ??
      payload.restockId ??
      payload.restockRequestId ??
      payload.deliverableId ??
      payload.lendingTicketId ??
      'UNLINKED';
    const relatedEntityType =
      evidenceType === 'RELEASE_CONFIRMATION_PHOTO'
        ? 'RELEASE_REQUEST'
        : evidenceType.startsWith('RESTOCK_')
          ? 'RESTOCK'
          : evidenceType.startsWith('DELIVERABLE_')
            ? 'DELIVERABLE'
            : evidenceType.startsWith('LENDING_')
              ? 'LENDING'
              : 'SUPPORTING_RECORD';
    const evidence = await mutationRequests.run(
      'evidence',
      {
        ...filePayload,
        evidenceType,
        relatedEntityType,
        relatedEntityId,
        requestId: payload.requestId,
        requestLineId: payload.requestLineId,
        restockId: payload.restockId ?? payload.restockRequestId,
        deliverableId: payload.deliverableId,
        lendingTicketId: payload.lendingTicketId,
      },
      (command) => remote.uploadEvidence(command),
    );
    const sanitized = { ...payload, evidenceId: evidence.evidenceId };
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
  const runtimeAdapter = {
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
    getScopedRevision(scope) {
      return remote.getScopedRevision({ scope });
    },
    async getInventoryItem(itemId) {
      const result = await remote.getInventoryItem({ itemId });
      return result.item;
    },
    async listInventoryClassifications(payload = {}) {
      return remote.listInventoryClassifications(payload);
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
    async getMaterialsWorkQueue(payload = {}) {
      return remote.getMaterialsWorkQueue(payload);
    },
    updateMaterialsComponent(payload) {
      return mutationRequests.run('materials-update', payload, (command) =>
        remote.updateMaterialsComponent(command),
      );
    },
    async searchVenueEquipmentReferences(payload = {}) {
      return remote.searchVenueEquipmentReferences(payload);
    },
    async getVenueEquipmentWorkQueue(payload) {
      const committeeId = typeof payload === 'string' ? payload : payload?.committeeId;
      return remote.getVenueEquipmentWorkQueue({ committeeId });
    },
    updateVenueEquipmentComponent(payload) {
      return mutationRequests.run('venue-equipment-update', payload, (command) =>
        remote.updateVenueEquipmentComponent(command),
      );
    },
    async getReferenceAdminWorkspace(payload = {}) {
      return remote.getReferenceAdminWorkspace(payload);
    },
    async previewReferenceAdminChange(payload = {}) {
      return remote.previewReferenceAdminChange(payload);
    },
    submitReferenceAdminChange(payload) {
      return mutationRequests.run('reference-admin-submit', payload, (command) =>
        remote.submitReferenceAdminChange(command),
      );
    },
    reviewReferenceAdminChange(payload) {
      return mutationRequests.run('reference-admin-review', payload, (command) =>
        remote.reviewReferenceAdminChange(command),
      );
    },
    listAccessAccounts(payload = {}) {
      return remote.listAccessAccounts(payload);
    },
    getAccessIdHistory(payload = {}) {
      return remote.getAccessIdHistory(payload);
    },
    previewAccessIdChange(payload = {}) {
      return remote.previewAccessIdChange(payload);
    },
    getAccessPolicyOptions(payload = {}) {
      return remote.getAccessPolicyOptions(payload);
    },
    previewAccessPolicy(payload = {}) {
      return remote.previewAccessPolicy(payload);
    },
    updateAccessPolicy(payload) {
      return mutationRequests.run('access-policy-update', payload, (command) =>
        remote.updateAccessPolicy(command),
      );
    },
    changeAccessId(payload) {
      return mutationRequests.run('access-id-change', payload, (command) => remote.changeAccessId(command));
    },
    createAccessAccount(payload) {
      return mutationRequests.run('access-account-create', payload, (command) =>
        remote.createAccessAccount(command),
      );
    },
    seedDepartmentAccessAccounts(payload) {
      return mutationRequests.run('department-account-seed', payload, (command) =>
        remote.seedDepartmentAccessAccounts(command),
      );
    },
    resetAccessPassword(payload) {
      return mutationRequests.run('access-password-reset', payload, (command) =>
        remote.resetAccessPassword(command),
      );
    },
    setAccessAccountStatus(payload) {
      return mutationRequests.run('access-status', payload, (command) =>
        remote.setAccessAccountStatus(command),
      );
    },
    revokeAccessSessions(payload) {
      return mutationRequests.run('access-session-revoke', payload, (command) =>
        remote.revokeAccessSessions(command),
      );
    },
    unlockAccessAccount(payload) {
      return mutationRequests.run('access-unlock', payload, (command) => remote.unlockAccessAccount(command));
    },
    getEvidenceSystemStatus(payload = {}) {
      return remote.getEvidenceSystemStatus(payload);
    },
    getIdentityRosterStatus(payload = {}) {
      return remote.getIdentityRosterStatus(payload);
    },
    listIdentityRoster(payload = {}) {
      return remote.listIdentityRoster(payload);
    },
    previewIdentityRosterSync(payload = {}) {
      return remote.previewIdentityRosterSync(payload);
    },
    applyIdentityRosterSync(payload) {
      return mutationRequests.run('identity-roster-apply', payload, (command) =>
        remote.applyIdentityRosterSync(command),
      );
    },
    rollbackIdentityRosterSync(payload) {
      return mutationRequests.run('identity-roster-rollback', payload, (command) =>
        remote.rollbackIdentityRosterSync(command),
      );
    },
    getIdentityRosterSelfProfile(payload = {}) {
      return remote.getIdentityRosterSelfProfile(payload);
    },
    getLendingUsage(payload = {}) {
      return remote.getLendingUsage(payload);
    },
    listAdvertisements(payload = {}) {
      return remote.listAdvertisements(payload);
    },
    saveAdvertisement(payload) {
      return mutationRequests.run('advertisement-save', payload, (command) =>
        remote.saveAdvertisement(command),
      );
    },
    uploadAdvertisementMedia(payload) {
      return mutationRequests.run('advertisement-upload', payload, (command) =>
        remote.uploadAdvertisementMedia(command),
      );
    },
    archiveAdvertisement(payload) {
      return mutationRequests.run('advertisement-archive', payload, (command) =>
        remote.archiveAdvertisement(command),
      );
    },
    listBrandAssets(payload = {}) {
      return remote.listBrandAssets(payload);
    },
    uploadBrandAsset(payload) {
      return mutationRequests.run('brand-asset-upload', payload, (command) =>
        remote.uploadBrandAsset(command),
      );
    },
    publishBrandAsset(payload) {
      return mutationRequests.run('brand-asset-publish', payload, (command) =>
        remote.publishBrandAsset(command),
      );
    },
    rollbackBrandAsset(payload) {
      return mutationRequests.run('brand-asset-rollback', payload, (command) =>
        remote.rollbackBrandAsset(command),
      );
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
    // RV-01.6: an accepted review carries one explicit decision per line.
    reviewRequest(requestId, decision, note = '', lineDecisions = null) {
      return mutationRequests.run(
        'review',
        { requestId, decision, note, ...(lineDecisions ? { lineDecisions } : {}) },
        (command) => remote.reviewRequest(command),
      );
    },
    async reserveStock(itemId, quantity, links = {}) {
      const result = await mutationRequests.run('reserve', { itemId, quantity, ...links }, (command) =>
        remote.reserveStock(command),
      );
      return result.reservationId;
    },
    async confirmRelease(payload) {
      const command = {
        ...(await evidencePayload(payload, 'RELEASE_CONFIRMATION_PHOTO')),
        recipientConfirmed: true,
      };
      const result = await mutationRequests.run('release', command, (tracked) =>
        remote.confirmRelease(tracked),
      );
      return { id: result.releaseId, ...result };
    },
    async correctRelease(payload) {
      const command = {
        ...(await evidencePayload(payload, 'RELEASE_CONFIRMATION_PHOTO')),
        correctionConfirmed: true,
      };
      const result = await mutationRequests.run('release-correction', command, (tracked) =>
        remote.correctRelease(tracked),
      );
      return { id: result.correctionId, ...result };
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
    async approveLendingTicket(ticketId, identityVerification = {}) {
      const result = await mutationRequests.run(
        'approve-lending',
        { ticketId, ...identityVerification },
        (command) => remote.approveLendingTicket(command),
      );
      return { id: result.ticketId, ...result };
    },
    async confirmLoanHandoff(ticketId, details = {}) {
      const result = await mutationRequests.run('lending-handoff', { ticketId, ...details }, (command) =>
        remote.confirmLendingHandoff(command),
      );
      return { id: result.ticketId, ...result };
    },
    async confirmReturn(ticketId, details = {}) {
      const payload = typeof details === 'string' ? { notes: details } : details;
      const result = await mutationRequests.run('lending-return', { ticketId, ...payload }, (command) =>
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
    async updateCanvassReference(payload) {
      const command = await evidencePayload(payload, 'CANVASS_QUOTE');
      const result = await mutationRequests.run('canvass-update', command, (tracked) =>
        remote.updateCanvassReference(tracked),
      );
      return { id: result.canvassId, ...result };
    },
    archiveCanvassReference(payload) {
      return mutationRequests.run('canvass-archive', payload, (command) =>
        remote.archiveCanvassReference(command),
      );
    },
    selectPreferredCanvass(payload) {
      return mutationRequests.run('preferred-canvass', payload, (command) =>
        remote.selectPreferredCanvass(command),
      );
    },
    async getRestockDetail(payload) {
      const command = typeof payload === 'string' ? { requestLineId: payload } : payload;
      return remote.getRestockDetail(command);
    },
    transitionRestock(payload) {
      return mutationRequests.run('restock-transition', payload, (command) =>
        remote.transitionRestock(command),
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
    async classifyInventoryItem(payload) {
      return mutationRequests.run('classify-inventory', payload, (command) =>
        remote.classifyInventoryItem(command),
      );
    },
    async bulkClassifyInventoryItems(payload) {
      return mutationRequests.run('bulk-classify-inventory', payload, (command) =>
        remote.bulkClassifyInventoryItems(command),
      );
    },
    async getEventManagement(payload = {}) {
      return remote.getEventManagement(payload);
    },
    saveEventSeries(payload) {
      return mutationRequests.run('event-series-save', payload, (command) => remote.saveEventSeries(command));
    },
    saveEventDay(payload) {
      return mutationRequests.run('event-day-save', payload, (command) => remote.saveEventDay(command));
    },
    saveEventActivity(payload) {
      return mutationRequests.run('event-activity-save', payload, (command) =>
        remote.saveEventActivity(command),
      );
    },
    linkEventOperationalRecord(payload) {
      return mutationRequests.run('event-operational-link', payload, (command) =>
        remote.linkEventOperationalRecord(command),
      );
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
  return mode === 'rest' || mode === 'http'
    ? assertProtectedRuntimeServiceContract(runtimeAdapter)
    : runtimeAdapter;
}
