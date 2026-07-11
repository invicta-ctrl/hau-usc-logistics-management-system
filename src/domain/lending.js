import { STATUS as S } from './constants.js';

export function derivedLendingStatus(ticket, today) {
  if (ticket.status === S.ON_LOAN && ticket.dueDate && ticket.dueDate < today) return S.OVERDUE;
  return ticket.status;
}

export function restorableReturnQuantity({ handedOut, returned, lost = 0, damagedBeyondUse = 0 }) {
  return Math.max(0, Math.min(Number(handedOut), Number(returned)) - Number(lost) - Number(damagedBeyondUse));
}
