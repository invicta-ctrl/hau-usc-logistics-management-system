import { AppError } from '../app/errors.js';
import {
  nonNegativeOperationalQuantity,
  positiveOperationalQuantity,
} from './validators.js';

export function receiptTotals(receipts, relatedId) {
  return receipts
    .filter((row) => row.relatedId === relatedId)
    .reduce(
      (total, row) => ({
        received: total.received + Number(row.quantityReceived),
        damaged: total.damaged + Number(row.quantityDamaged ?? 0),
        rejected: total.rejected + Number(row.quantityRejected ?? 0),
      }),
      { received: 0, damaged: 0, rejected: 0 },
    );
}

export function validateReceipt({
  requiredTotal,
  alreadyReceived,
  quantityReceivedNow,
  quantityDamaged = 0,
  quantityRejected = 0,
  amendmentQuantity = 0,
  unit = '',
}) {
  const receivedNow = positiveOperationalQuantity(quantityReceivedNow, unit, 'quantityReceivedNow');
  const damaged = nonNegativeOperationalQuantity(quantityDamaged, unit, 'quantityDamaged');
  const rejected = nonNegativeOperationalQuantity(quantityRejected, unit, 'quantityRejected');
  const amendment = nonNegativeOperationalQuantity(amendmentQuantity, unit, 'amendmentQuantity');
  const allowed = Number(requiredTotal) + amendment;
  const receivedTotal = Number(alreadyReceived) + receivedNow;
  if (receivedTotal > allowed)
    throw new AppError(
      'OVER_RECEIPT',
      `Receipt exceeds the authorized quantity by ${receivedTotal - allowed}.`,
    );
  return { receivedNow, damaged, rejected, receivedTotal, quantityRemaining: allowed - receivedTotal };
}

export function receivingStatus({ receivedTotal, requiredTotal, finalStatus }) {
  if (receivedTotal <= 0) return null;
  return receivedTotal < requiredTotal ? 'PARTIALLY_RECEIVED' : finalStatus;
}
