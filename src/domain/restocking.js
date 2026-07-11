import { deriveRequestStatus } from './requests.js';

export function recomputeRestockParent(state, requestId) {
  const lines = state.requestLines.filter((line) => line.requestId === requestId);
  const request = state.requests.find((row) => row.id === requestId);
  if (request) request.status = deriveRequestStatus(lines);
  return request?.status;
}

export function reorderSuggestion({ onHand, threshold, recentDemand, leadTimeDays }) {
  const safety = Math.ceil((Number(recentDemand) / 30) * Number(leadTimeDays));
  return Math.max(0, Number(threshold) + safety - Number(onHand));
}
