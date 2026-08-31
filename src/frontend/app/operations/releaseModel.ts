import type { FrontendOperationalModuleBootstrap } from '../../integration/backend';
import { numberValue, textValue } from './operationUtils';

export type ReleaseCandidate = {
  id: string;
  requestId: string;
  itemId: string;
  itemName: string;
  description: string;
  department: string;
  unit: string;
  requested: number;
  released: number;
  remaining: number;
  status: string;
  revision: string;
};

export function releaseCandidatesFromBootstrap(
  bootstrap: FrontendOperationalModuleBootstrap,
): ReleaseCandidate[] {
  const requests = new Map((bootstrap.data.requests ?? []).map((row) => [textValue(row, ['id']), row]));
  const items = new Map((bootstrap.data.inventoryItems ?? []).map((row) => [textValue(row, ['id']), row]));
  return (bootstrap.data.requestLines ?? [])
    .filter((row) => ['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(textValue(row, ['status'])))
    .map((row) => {
      const requestId = textValue(row, ['requestId', 'request_id']);
      const itemId = textValue(row, ['itemId', 'item_id']);
      const request = requests.get(requestId) ?? {};
      const item = items.get(itemId) ?? {};
      const requested = numberValue(row, ['quantity', 'requestedQuantity', 'requested_quantity']);
      const released = numberValue(row, ['releasedQuantity', 'released_quantity']);
      const description = textValue(row, ['description']) || textValue(request, ['purpose']) || requestId;
      return {
        id: textValue(row, ['id']),
        requestId,
        itemId,
        itemName: textValue(item, ['name']) || description || 'Item details unavailable',
        description,
        department: textValue(request, ['department']),
        unit: textValue(row, ['unit']) || textValue(item, ['unit']) || 'unit',
        requested,
        released,
        remaining: Math.max(0, requested - released),
        status: textValue(row, ['status']),
        revision:
          textValue(row, ['updatedAt', 'updated_at']) ||
          String(numberValue(row, ['workflowRevision', 'workflow_revision']) || ''),
      };
    })
    .filter((row) => row.id && row.requestId && row.remaining > 0);
}

export function releaseRecheckIssue({
  before,
  after,
  quantity,
}: {
  before: ReleaseCandidate;
  after: ReleaseCandidate | null;
  quantity: number;
}) {
  if (!after) return 'This line is no longer ready for release.';
  if (before.requestId !== after.requestId || before.itemId !== after.itemId || before.unit !== after.unit) {
    return 'The authoritative request or item identity changed.';
  }
  if (before.revision !== after.revision) return 'The authoritative line revision changed.';
  if (
    before.requested !== after.requested ||
    before.released !== after.released ||
    before.remaining !== after.remaining ||
    before.status !== after.status
  ) {
    return `The authoritative line state changed. Only ${after.remaining} ${after.unit} ${
      after.remaining === 1 ? 'remains' : 'remain'
    } releasable after the recheck.`;
  }
  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > after.remaining
  ) {
    return `Only ${after.remaining} ${after.unit} ${after.remaining === 1 ? 'remains' : 'remain'} releasable after the authoritative recheck.`;
  }
  return '';
}

export function releaseConsequence(candidate: ReleaseCandidate, quantity: number) {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    return 'Enter a positive whole-number quantity before recording this release.';
  }
  if (quantity > candidate.remaining) {
    return `This quantity cannot be recorded. Only ${candidate.remaining} ${candidate.unit} ${candidate.remaining === 1 ? 'remains' : 'remain'} on this ready line.`;
  }
  const remainingAfter = Math.max(0, candidate.remaining - quantity);
  return remainingAfter > 0
    ? `Records a partial physical release. ${remainingAfter} ${candidate.unit} remain on this line for a later governed release.`
    : 'Records the full remaining physical release and completes this ready line if the server accepts every inventory, reservation, scope, and audit check.';
}

export function releaseHistoryFromBootstrap(bootstrap: FrontendOperationalModuleBootstrap) {
  const confirmations = (bootstrap.data.releaseConfirmations ?? []).map((row) => {
    const rawLines = (row as Record<string, unknown>).lineReleases;
    const lines = Array.isArray(rawLines)
      ? rawLines.filter((line): line is Record<string, unknown> => Boolean(line) && typeof line === 'object')
      : [];
    const totalQuantity = lines.reduce((sum, line) => sum + numberValue(line, ['quantity']), 0);
    const units = [...new Set(lines.map((line) => textValue(line, ['unit'])).filter(Boolean))];
    return {
      id: textValue(row, ['id']),
      requestId: textValue(row, ['requestId', 'request_id']),
      recipientName: textValue(row, ['recipientName', 'recipient_name']) || 'Recipient not reported',
      recipientRole: textValue(row, ['recipientRole', 'recipient_role']),
      department: textValue(row, ['department']),
      status: textValue(row, ['status']),
      releasedAt: textValue(row, ['releasedAt', 'released_at', 'createdAt', 'created_at']),
      quantity: !lines.length
        ? 'Quantity not reported'
        : units.length === 1
          ? `${totalQuantity} ${units[0] || 'unit'}${lines.length > 1 ? ` across ${lines.length} lines` : ''}`
          : `${lines.length} released lines`,
    };
  });
  const corrections = (bootstrap.data.releaseCorrections ?? []).map((row) => ({
    id: textValue(row, ['id']),
    releaseGroupId: textValue(row, ['releaseGroupId', 'release_group_id']),
    quantity: numberValue(row, ['quantity']),
    reason: textValue(row, ['reason']),
    status: textValue(row, ['status']),
    correctedAt: textValue(row, ['correctedAt', 'corrected_at', 'createdAt', 'created_at']),
  }));
  return { confirmations, corrections };
}
