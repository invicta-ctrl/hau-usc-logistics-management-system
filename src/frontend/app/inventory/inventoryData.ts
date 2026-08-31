import type {
  FrontendInventoryAsset,
  FrontendInventoryAssetHistory,
  FrontendInventoryBootstrap,
  FrontendInventoryItem,
  FrontendInventoryLedgerTransaction,
  FrontendInventoryReservation,
} from '../../integration/backend';
import type { InvItem } from './inventoryTypes';

type InventoryItemContext = {
  ledgerTransactions?: FrontendInventoryLedgerTransaction[];
  reservations?: FrontendInventoryReservation[];
  assets?: FrontendInventoryAsset[];
  assetMaintenanceHistory?: FrontendInventoryAssetHistory[];
  assetMovementHistory?: FrontendInventoryAssetHistory[];
};

/** Maps the documented server DTO without computing balances or changing stock semantics. */
export function inventoryItemFromBootstrap(
  item: FrontendInventoryItem,
  context: InventoryItemContext = {},
): InvItem {
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
    nextAction: 'Use Restocking or another authorized workflow to update inventory.',
    dataOrigin: 'REAL_BOOTSTRAP',
    unit: item.unit,
    classificationStatus: item.classificationStatus,
    conditionReviewState: item.conditionReviewState,
    maintenanceReviewState: item.maintenanceReviewState,
    updatedAt: item.updatedAt,
    recentLedger: (context.ledgerTransactions ?? []).map((entry) => ({
      id: entry.id,
      type: entry.type,
      direction: entry.direction,
      quantity: entry.quantity,
      signedQuantity: entry.signedQuantity,
      unit: entry.unit,
      relatedEntityType: entry.relatedEntityType,
      relatedId: entry.relatedId,
      status: entry.status,
      notes: entry.notes,
      createdAt: entry.createdAt,
    })),
    reservations: (context.reservations ?? []).map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      unit: entry.unit,
      link: entry.requestLineId || entry.lendingTicketId,
      status: entry.status,
      clearedAt: entry.clearedAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })),
    assets: (context.assets ?? []).map((entry) => ({
      id: entry.id,
      assetTag: entry.assetTag,
      condition: entry.condition,
      lifecycleStatus: entry.lifecycleStatus,
    })),
    assetMaintenanceHistory: context.assetMaintenanceHistory ?? [],
    assetMovementHistory: context.assetMovementHistory ?? [],
    classificationHistory: item.classificationHistory ?? [],
  };
}

function groupBy<T>(values: T[], key: (value: T) => string) {
  const groups = new Map<string, T[]>();
  values.forEach((value) => {
    const id = key(value);
    const group = groups.get(id);
    if (group) group.push(value);
    else groups.set(id, [value]);
  });
  return groups;
}

/** Joins only the bounded, page-scoped context returned beside each canonical item. */
export function inventoryItemsFromBootstrap(bootstrap: FrontendInventoryBootstrap): InvItem[] {
  const ledgerByItem = groupBy(bootstrap.ledgerTransactions, (entry) => entry.itemId);
  const reservationsByItem = groupBy(bootstrap.reservations, (entry) => entry.itemId);
  const assetsByItem = groupBy(bootstrap.inventoryAssets, (entry) => entry.itemId);
  const maintenanceByAsset = groupBy(bootstrap.assetMaintenanceHistory, (entry) => entry.assetId);
  const movementByAsset = groupBy(bootstrap.assetMovementHistory, (entry) => entry.assetId);

  return bootstrap.inventoryItems.map((item) => {
    const assets = assetsByItem.get(item.id) ?? [];
    const assetIds = assets.map((asset) => asset.id);
    return inventoryItemFromBootstrap(item, {
      ledgerTransactions: ledgerByItem.get(item.id),
      reservations: reservationsByItem.get(item.id),
      assets,
      assetMaintenanceHistory: assetIds.flatMap((assetId) => maintenanceByAsset.get(assetId) ?? []),
      assetMovementHistory: assetIds.flatMap((assetId) => movementByAsset.get(assetId) ?? []),
    });
  });
}
