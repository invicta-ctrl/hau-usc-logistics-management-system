import { STATUS as S } from './constants.js';

export function deriveRequestStatus(lines) {
  const active = lines.filter((line) => ![S.REJECTED, S.CANCELLED].includes(line.status));
  if (!active.length) return S.CANCELLED;
  if (active.every((line) => [S.COMPLETED, S.RESTOCKED].includes(line.status))) return S.COMPLETED;
  if (active.some((line) => [S.PARTIALLY_RELEASED, S.COMPLETED, S.RESTOCKED].includes(line.status)))
    return S.PARTIALLY_FULFILLED;
  if (active.some((line) => line.status !== S.FOR_REVIEW)) return S.ACCEPTED;
  return S.FOR_REVIEW;
}

export function routingDecision({ selectedItemId, requestedQuantity, availableQuantity }) {
  if (!selectedItemId) return { kind: 'NEW', stockQuantity: 0, procurementQuantity: requestedQuantity };
  if (availableQuantity <= 0)
    return { kind: 'NONE', stockQuantity: 0, procurementQuantity: requestedQuantity };
  if (availableQuantity >= requestedQuantity)
    return { kind: 'FULL', stockQuantity: requestedQuantity, procurementQuantity: 0 };
  return {
    kind: 'PARTIAL',
    stockQuantity: availableQuantity,
    procurementQuantity: requestedQuantity - availableQuantity,
  };
}

export function consolidateDraftLines(lines) {
  const byKey = new Map();
  for (const line of lines) {
    const key = `${line.itemId || line.description.toLowerCase()}|${line.unit}|${line.fulfillmentSource}`;
    if (!byKey.has(key)) byKey.set(key, { ...line });
    else byKey.get(key).quantity += Number(line.quantity);
  }
  return [...byKey.values()];
}
