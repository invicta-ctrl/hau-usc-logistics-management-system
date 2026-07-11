import { STATUS_LABELS } from '../domain/constants.js';

export function statusTone(status) {
  if (['COMPLETED', 'RESTOCKED', 'RETURNED', 'READY_TO_RELEASE'].includes(status)) return 'success';
  if (['REJECTED', 'CANCELLED', 'OVERDUE'].includes(status)) return 'danger';
  if (
    [
      'FOR_REVIEW',
      'FOR_CANVASSING',
      'WAITING_FOR_BUDGET',
      'PARTIALLY_RECEIVED',
      'PARTIALLY_RELEASED',
    ].includes(status)
  )
    return 'warning';
  return 'info';
}

export function statusChip(status, label = STATUS_LABELS[status] ?? String(status).replaceAll('_', ' ')) {
  return `<span class="status-chip" data-tone="${statusTone(status)}">${escapeHtml(label)}</span>`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char],
  );
}
