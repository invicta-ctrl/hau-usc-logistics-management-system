import { AppError } from '../app/errors.js';

export function requireIdempotencyKey(command) {
  const key = String(command?.idempotencyKey ?? '').trim();
  if (!key) throw new AppError('IDEMPOTENCY_KEY_REQUIRED', 'A retry-safe command key is required.');
  return key;
}

export function previousResult(state, key) {
  const record = state.idempotencyRecords.find((row) => row.key === key);
  return record ? structuredClone(record.result) : null;
}

export function storeResult(state, { key, action, result, correlationId }) {
  state.idempotencyRecords.push({
    key,
    action,
    result: structuredClone(result),
    correlationId,
    createdAt: new Date().toISOString(),
  });
}

export function alreadyPostedError(record) {
  return new AppError('ALREADY_POSTED', 'This command was already completed.', {
    correlationId: record.correlationId,
  });
}
