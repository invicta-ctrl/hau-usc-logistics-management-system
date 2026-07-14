import { createSeedState } from '../data/seed.js';

export const CURRENT_SCHEMA = 3;

function migrateOpeningBalances(state) {
  state.ledgerTransactions ??= [];
  state.inventoryItems ??= [];
  const existing = new Set(
    state.ledgerTransactions.filter((row) => row.type === 'OPENING_BALANCE').map((row) => row.itemId),
  );
  let counter = state.ledgerTransactions.length;
  for (const item of state.inventoryItems) {
    if (Number(item.openingOnHand) && !existing.has(item.id)) {
      counter += 1;
      state.ledgerTransactions.push({
        id: `TXN-MIG-${String(counter).padStart(5, '0')}`,
        type: 'OPENING_BALANCE',
        direction: 'IN',
        quantity: Number(item.openingOnHand),
        itemId: item.id,
        eventItemId: null,
        relatedEntityId: item.id,
        idempotencyKey: `migration-opening-${item.id}`,
        actor: 'SYSTEM',
        timestamp: new Date().toISOString(),
        note: 'Migrated legacy opening balance',
        auditCorrelationId: 'MIGRATION-V2',
      });
    }
    delete item.openingOnHand;
  }
  state.schemaVersion = 2;
  state.migrationLog ??= [];
  state.migrationLog.push({
    from: 1,
    to: 2,
    at: new Date().toISOString(),
    note: 'Converted opening quantities to ledger entries.',
  });
  return state;
}

function migrateOperationalCollections(state) {
  for (const key of [
    'deliverableReceipts',
    'restockReceipts',
    'idempotencyRecords',
    'evidenceFiles',
    'eventTasks',
    'compositeRequests',
    'compositeComponents',
  ])
    state[key] ??= [];
  state.revisions ??= { inventory: 1, requests: 1, lending: 1, receipts: 1, quotes: 1, tasks: 1 };
  state.counters ??= {};
  state.schemaVersion = 3;
  state.migrationLog ??= [];
  state.migrationLog.push({
    from: 2,
    to: 3,
    at: new Date().toISOString(),
    note: 'Added receipts, idempotency, evidence, tasks, and revisions.',
  });
  return state;
}

export function migrateState(input) {
  let state = structuredClone(input);
  if (!state.schemaVersion || state.schemaVersion < 1)
    return {
      state: createSeedState(),
      recovered: true,
      warning:
        'The stored preview state was too old and was replaced. Export the corrupt payload from Diagnostics if needed.',
    };
  if (state.schemaVersion === 1) state = migrateOpeningBalances(state);
  if (state.schemaVersion === 2) state = migrateOperationalCollections(state);
  if (state.schemaVersion !== CURRENT_SCHEMA)
    return {
      state: createSeedState(),
      recovered: true,
      warning: `Unsupported schema version ${state.schemaVersion}; safe demo data was restored.`,
    };
  return { state, recovered: false, warning: '' };
}
