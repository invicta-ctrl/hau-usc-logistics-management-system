import { AppError } from '../app/errors.js';
import { positiveOperationalQuantity } from './validators.js';

export function requireRecipientConfirmation(value) {
  const confirmed =
    value === true ||
    String(value ?? '')
      .trim()
      .toLowerCase() === 'true';
  if (!confirmed)
    throw new AppError(
      'RECIPIENT_CONFIRMATION_REQUIRED',
      'The recipient must confirm the physical handoff before release.',
    );
  return true;
}

export function validateRelease({
  requested,
  released,
  quantity,
  reservationBalance,
  physicalBalance,
  eventItemBalance = null,
  unit = '',
}) {
  const posting = positiveOperationalQuantity(quantity, unit);
  const remaining = Number(requested) - Number(released);
  if (posting > remaining) throw new AppError('OVER_RELEASE', `Only ${remaining} remains requested.`);
  if (reservationBalance !== null && posting > Number(reservationBalance))
    throw new AppError('RESERVATION_INSUFFICIENT', 'The active reservation does not cover this release.');
  if (posting > Number(physicalBalance))
    throw new AppError('PHYSICAL_BALANCE_INSUFFICIENT', 'Physical balance is insufficient.');
  if (eventItemBalance !== null && posting > Number(eventItemBalance))
    throw new AppError('EVENT_BALANCE_INSUFFICIENT', 'Event-item balance is insufficient.');
  return { quantity: posting, remainingAfter: remaining - posting };
}
