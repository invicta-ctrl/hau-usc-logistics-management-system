import { MockService } from './mock-service.js';

export class MockAdapter extends MockService {
  getBootstrapData() { return Promise.resolve(structuredClone(this.store.getState())); }
  getLendingBootstrap() { const state=this.store.getState();return Promise.resolve({ok:true,portalMode:'lending',inventoryItems:structuredClone(state.inventoryItems),catalogAvailabilityProtected:true,historyAvailable:false}); }
  getCurrentUser() { const state = this.store.getState(); return Promise.resolve({ ok: true, user: { role: state.role, previewOnly: true } }); }
  searchCatalog({ query = '', limit = 25 } = {}) { const q = query.toLowerCase(); return Promise.resolve({ ok: true, items: this.store.getState().inventoryItems.filter((item) => `${item.id} ${item.name} ${(item.aliases ?? []).join(' ')}`.toLowerCase().includes(q)).slice(0, limit) }); }
  reviewRequest(command) { if (String(command.decision).toUpperCase() === 'REJECT') return Promise.reject(new Error('Preview rejection is not implemented in the hardened mock adapter.')); return this.acceptRequest(command); }
  reserveStock() { return Promise.reject(new Error('Use request acceptance or lending approval to create preview reservations.')); }
  confirmReturn(command) { return this.confirmLendingReturn(command); }
  transferEventItemToInventory(command) { return this.transferEventItem(command); }
  uploadEvidence(command) { return this.finalizeEvidence(command); }
  saveCanvassReference() { return Promise.reject(new Error('Canvass writes are available in Apps Script staging.')); }
  selectPreferredCanvass() { return Promise.reject(new Error('Canvass selection is available in Apps Script staging.')); }
  getAuditTimeline({ entityType, entityId }) { return Promise.resolve({ ok: true, timeline: this.store.getState().auditLog.filter((row) => row.entityType === entityType && row.entityId === entityId) }); }
  getAdminDashboard() { return Promise.reject(new Error('Administrator APIs require Apps Script staging.')); }
  getPublishedContent() { return Promise.resolve({ ok:true, content:[] }); }
  previewContentRevision() { return Promise.reject(new Error('Content preview requires Apps Script staging.')); }
  getBrandingState() { return Promise.resolve({ ok:true, branding:[{ assetKey:'BRAND_WORDMARK', useFallback:true, fallbackKey:'BUILT_IN_WORDMARK' }], fallbackRequired:true }); }
  resolveInventoryVerification() { return Promise.reject(new Error('Verification resolution requires Apps Script staging.')); }
  saveUserAccess() { return Promise.reject(new Error('User administration requires Apps Script staging.')); }
  createUserAccess(command) { return this.saveUserAccess(command); }
  updateUserAccess(command) { return this.saveUserAccess(command); }
  deactivateUserAccess(command) { return this.saveUserAccess(command); }
  saveEvent() { return Promise.reject(new Error('Event administration requires Apps Script staging.')); }
  createEvent(command) { return this.saveEvent(command); }
  createSubEvent(command) { return this.saveEvent(command); }
  updateEvent(command) { return this.saveEvent(command); }
  archiveEvent(command) { return this.saveEvent(command); }
  restoreEvent(command) { return this.saveEvent(command); }
  saveContentRevision() { return Promise.reject(new Error('Content administration requires Apps Script staging.')); }
  publishContentRevision() { return Promise.reject(new Error('Content administration requires Apps Script staging.')); }
  revertContentRevision() { return Promise.reject(new Error('Content administration requires Apps Script staging.')); }
  saveBrandingMetadata() { return Promise.reject(new Error('Branding administration requires Apps Script staging.')); }
  uploadBrandingAsset() { return Promise.reject(new Error('Branding upload requires Apps Script staging.')); }
  activateBrandingVersion() { return Promise.reject(new Error('Branding administration requires Apps Script staging.')); }
  updateCanvassReference() { return Promise.reject(new Error('Canvass administration requires Apps Script staging.')); }
  archiveCanvassReference() { return Promise.reject(new Error('Canvass administration requires Apps Script staging.')); }
  restoreCanvassReference() { return Promise.reject(new Error('Canvass administration requires Apps Script staging.')); }
}
