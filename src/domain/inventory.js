import { AppError } from '../app/errors.js';

const signedQuantity = (txn) => (txn.direction === 'IN' ? Number(txn.quantity) : -Number(txn.quantity));

export function buildInventoryIndexes(state) {
  const onHand = new Map();
  const reserved = new Map();
  const eventItemBalance = new Map();
  const requestLines = new Map();
  const deliverables = new Map();
  const searchText = new Map();
  for (const txn of state.ledgerTransactions) {
    const map = txn.eventItemId ? eventItemBalance : onHand;
    const key = txn.eventItemId || txn.itemId;
    if (key) map.set(key, (map.get(key) ?? 0) + signedQuantity(txn));
  }
  for (const reservation of state.reservations) {
    if (reservation.status === 'ACTIVE')
      reserved.set(
        reservation.itemId,
        (reserved.get(reservation.itemId) ?? 0) + Number(reservation.quantity),
      );
  }
  for (const line of state.requestLines) {
    if (!requestLines.has(line.requestId)) requestLines.set(line.requestId, []);
    requestLines.get(line.requestId).push(line);
  }
  for (const deliverable of state.deliverables) {
    if (!deliverables.has(deliverable.eventId)) deliverables.set(deliverable.eventId, []);
    deliverables.get(deliverable.eventId).push(deliverable);
  }
  for (const item of state.inventoryItems)
    searchText.set(
      item.id,
      [item.id, item.name, ...(item.aliases ?? []), item.category, item.area, item.specification]
        .join(' ')
        .toLowerCase(),
    );
  return {
    revision: state.revisions.inventory,
    onHand,
    reserved,
    eventItemBalance,
    requestLines,
    deliverables,
    searchText,
  };
}

export function availableToPromise(itemId, indexes) {
  return (indexes.onHand.get(itemId) ?? 0) - (indexes.reserved.get(itemId) ?? 0);
}
export function allocationBalance(itemId, indexes) {
  return Math.max(0, availableToPromise(itemId, indexes));
}
export function assertAllocatable(itemId, quantity, indexes) {
  const raw = availableToPromise(itemId, indexes);
  if (raw < quantity)
    throw new AppError(
      raw < 0 ? 'NEGATIVE_BALANCE_BLOCK' : 'INSUFFICIENT_AVAILABLE',
      `Only ${Math.max(0, raw)} is available to promise.`,
    );
}

export function qualityWarnings(state, indexes = buildInventoryIndexes(state)) {
  const warnings = [];
  for (const item of state.inventoryItems)
    if ((indexes.onHand.get(item.id) ?? 0) < 0)
      warnings.push({ code: 'NEGATIVE_STOCK', entityId: item.id, value: indexes.onHand.get(item.id) });
  const ids = new Set();
  for (const txn of state.ledgerTransactions) {
    if (ids.has(txn.id)) warnings.push({ code: 'DUPLICATE_LEDGER_ID', entityId: txn.id });
    ids.add(txn.id);
  }
  for (const reservation of state.reservations)
    if (!state.inventoryItems.some((item) => item.id === reservation.itemId))
      warnings.push({ code: 'ORPHAN_RESERVATION', entityId: reservation.id });
  for (const quote of state.quotes)
    if (quote.expiresOn < state.demoToday) warnings.push({ code: 'STALE_QUOTE', entityId: quote.id });
  return warnings;
}
