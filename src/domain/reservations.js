import { AppError } from '../app/errors.js';
import { allocateId } from './ids.js';

export function reserveStock(
  state,
  { itemId, quantity, requestLineId, lendingTicketId, actor, idempotencyKey },
  indexes,
) {
  const available = (indexes.onHand.get(itemId) ?? 0) - (indexes.reserved.get(itemId) ?? 0);
  if (available < quantity)
    throw new AppError(
      'RESERVATION_CONFLICT',
      `Only ${Math.max(0, available)} is available; reservation was not created.`,
      { retryable: true },
    );
  const reservation = {
    id: allocateId(state, 'RSV'),
    itemId,
    quantity,
    requestLineId: requestLineId ?? null,
    lendingTicketId: lendingTicketId ?? null,
    status: 'ACTIVE',
    idempotencyKey,
    actor,
    createdAt: new Date().toISOString(),
  };
  state.reservations.push(reservation);
  return reservation;
}

export function consumeReservation(state, reservationId, quantity) {
  const reservation = state.reservations.find((row) => row.id === reservationId);
  if (!reservation || reservation.status !== 'ACTIVE')
    throw new AppError('RESERVATION_MISSING', 'An active reservation is required.');
  if (Number(quantity) > Number(reservation.quantity))
    throw new AppError('RESERVATION_INSUFFICIENT', 'Release exceeds the active reservation.');
  reservation.quantity -= Number(quantity);
  if (reservation.quantity === 0) reservation.status = 'CLEARED';
  return reservation;
}
