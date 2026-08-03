import { MockService } from './mock-service.js';

export class MockAdapter extends MockService {
  getBootstrapData() {
    return Promise.resolve(structuredClone(this.store.getState()));
  }
  getCurrentUser() {
    const state = this.store.getState();
    return Promise.resolve({ ok: true, user: { role: state.role, previewOnly: true } });
  }
  searchCatalog({ query = '', limit = 25 } = {}) {
    const q = query.toLowerCase();
    return Promise.resolve({
      ok: true,
      items: this.store
        .getState()
        .inventoryItems.filter((item) =>
          `${item.id} ${item.name} ${(item.aliases ?? []).join(' ')}`.toLowerCase().includes(q),
        )
        .slice(0, limit),
    });
  }
  reviewRequest(command) {
    if (String(command.decision).toUpperCase() === 'REJECT')
      return Promise.reject(new Error('Preview rejection is not implemented in the hardened mock adapter.'));
    return this.acceptRequest(command);
  }
  reserveStock() {
    return Promise.reject(
      new Error('Use request acceptance or lending approval to create preview reservations.'),
    );
  }
  confirmReturn(command) {
    return this.confirmLendingReturn(command);
  }
  transferEventItemToInventory(command) {
    return this.transferEventItem(command);
  }
  uploadEvidence(command) {
    return this.finalizeEvidence(command);
  }
  saveCanvassReference() {
    return Promise.reject(new Error('Canvass writes are available in Apps Script staging.'));
  }
  updateCanvassReference() {
    return Promise.reject(new Error('Canvass updates require a governed backend.'));
  }
  archiveCanvassReference() {
    return Promise.reject(new Error('Canvass archival requires a governed backend.'));
  }
  selectPreferredCanvass() {
    return Promise.reject(new Error('Canvass selection is available in Apps Script staging.'));
  }
  getAuditTimeline({ entityType, entityId }) {
    return Promise.resolve({
      ok: true,
      timeline: this.store
        .getState()
        .auditLog.filter((row) => row.entityType === entityType && row.entityId === entityId),
    });
  }
  listInventoryClassifications({ status = 'NEEDS_CLASSIFICATION', search = '' } = {}) {
    const q = search.toLowerCase();
    const source = this.store.getState().inventoryItems;
    const items = source.filter(
      (item) =>
        (status === 'ALL' || (item.classificationStatus ?? 'NEEDS_CLASSIFICATION') === status) &&
        (!q || `${item.id} ${item.name} ${item.category}`.toLowerCase().includes(q)),
    );
    return Promise.resolve({
      ok: true,
      progress: {
        total: source.length,
        pending: source.filter(
          (item) => (item.classificationStatus ?? 'NEEDS_CLASSIFICATION') === 'NEEDS_CLASSIFICATION',
        ).length,
        classified: source.filter((item) => item.classificationStatus === 'CLASSIFIED').length,
      },
      page: 1,
      pageSize: items.length || 10,
      total: items.length,
      items,
    });
  }
  classifyInventoryItem() {
    return Promise.reject(new Error('Use the local preview classification workflow.'));
  }
  bulkClassifyInventoryItems() {
    return Promise.reject(new Error('Use the local preview bulk classification workflow.'));
  }
}
