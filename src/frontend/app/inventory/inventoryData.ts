import type { FrontendInventoryItem } from '../../integration/backend';
import type { InvItem } from './inventoryTypes';

/** Maps the documented server DTO without computing balances or changing stock semantics. */
export function inventoryItemFromBootstrap(item: FrontendInventoryItem): InvItem {
  const belowThreshold = item.lowStockState === 'LOW';
  const outOfStock = item.availableToPromise <= 0;
  const unconfirmed = item.classificationStatus !== 'CLASSIFIED';
  const lendable = item.isLendable && item.lendingStatus === 'ACTIVE';

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    onHand: item.onHand,
    reserved: item.reserved,
    available: item.availableToPromise,
    threshold: item.reorderThreshold,
    lending: lendable ? 'lendable' : 'not-lendable',
    belowThreshold,
    outOfStock,
    unconfirmed,
    consequence: outOfStock
      ? 'No available-to-promise quantity is currently projected by the authoritative inventory bootstrap.'
      : belowThreshold
        ? 'The authoritative inventory bootstrap currently marks this item as low stock.'
        : 'The displayed quantities are the current ledger-derived server projection.',
    nextAction:
      'This FI-05 surface is read-only. Use an authorized operational workflow for any inventory action.',
    dataOrigin: 'REAL_BOOTSTRAP',
    unit: item.unit,
    classificationStatus: item.classificationStatus,
    conditionReviewState: item.conditionReviewState,
    maintenanceReviewState: item.maintenanceReviewState,
    updatedAt: item.updatedAt,
  };
}
