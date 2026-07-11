export const DATA_DICTIONARY = Object.freeze({
  inventoryItems: 'Catalog metadata; never the quantity source of truth.',
  ledgerTransactions: 'Immutable signed inventory/event-item movements.',
  reservations: 'Active or cleared allocation records.',
  requests: 'Requester-facing parent records with derived status.',
  requestLines: 'Item-level fulfillment lifecycle.',
  deliverableReceipts: 'Immutable event procurement receipts.',
  restockReceipts: 'Immutable catalog restock receipts.',
  idempotencyRecords: 'Stored command results preventing double posting.',
  auditLog: 'Append-only preview operation history.',
});
