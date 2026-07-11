import { AppError } from '../app/errors.js';
import { positiveNumber, controlledCategory } from './validators.js';

export function validateTransfer({
  quantity,
  eventBalance,
  source,
  destination,
  role,
  mergeReason,
  semanticConfirmed,
}) {
  const amount = positiveNumber(quantity);
  if (amount > Number(eventBalance))
    throw new AppError('INSUFFICIENT_EVENT_BALANCE', `Only ${eventBalance} remains in the event item.`);
  if (source.unit !== destination.unit)
    throw new AppError('INCOMPATIBLE_UNIT', 'Source and destination units must match.');
  if (source.handling !== destination.handling)
    throw new AppError('INCOMPATIBLE_HANDLING', 'Handling classifications must match.');
  if (destination.isNew) controlledCategory(destination.category);
  if (!destination.isNew && (!semanticConfirmed || !mergeReason))
    throw new AppError(
      'MERGE_CONFIRMATION_REQUIRED',
      'Confirm the semantic match and provide a merge reason.',
    );
  if (!destination.isNew && !['COMMITTEE_HEAD', 'DIRECTOR', 'ADMINISTRATOR'].includes(role))
    throw new AppError(
      'FORBIDDEN',
      'A supervisor role is required to merge event stock into a catalog item.',
    );
  return amount;
}
