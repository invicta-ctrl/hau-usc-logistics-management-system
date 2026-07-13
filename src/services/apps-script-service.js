import { AppsScriptAdapter } from './apps-script-adapter.js';

export class AppsScriptService extends AppsScriptAdapter {
  acceptRequest(command) { return this.reviewRequest({ ...command, decision: 'ACCEPT' }); }
  confirmLendingReturn(command) { return this.confirmReturn(command); }
  transferEventItem(command) { return this.transferEventItemToInventory(command); }
  finalizeEvidence(command) { return this.uploadEvidence(command); }
}
