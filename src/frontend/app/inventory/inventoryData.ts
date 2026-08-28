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
      ? 'No inventory is available for new commitments.'
      : belowThreshold
        ? 'This item is below its reorder threshold.'
        : 'The displayed quantities reflect current inventory records.',
    nextAction:
      'Use Restocking or another authorized workflow to update inventory.',
    dataOrigin: 'REAL_BOOTSTRAP',
    unit: item.unit,
    classificationStatus: item.classificationStatus,
    conditionReviewState: item.conditionReviewState,
    maintenanceReviewState: item.maintenanceReviewState,
    updatedAt: item.updatedAt,
  };
}
