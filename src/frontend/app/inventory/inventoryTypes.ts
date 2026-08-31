export type InvLending = 'lendable' | 'not-lendable';
export type InvQty = number | '—';

export type InvLedgerEntry = {
  id: string;
  type: string;
  direction: string;
  quantity: number;
  signedQuantity: number;
  unit: string;
  relatedEntityType: string;
  relatedId: string;
  status: string;
  notes: string;
  createdAt: string;
};

export type InvReservation = {
  id: string;
  quantity: number;
  unit: string;
  link: string;
  status: string;
  clearedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InvAsset = {
  id: string;
  assetTag: string;
  condition: string;
  lifecycleStatus: string;
};

export type InvAssetHistory = {
  id: string;
  assetId: string;
  eventType: string;
  previousStatus: string;
  newStatus: string;
  condition: string;
  occurredAt: string;
  notes: string;
};

export type InvClassificationHistory = {
  id: string;
  previousStatus: string;
  newStatus: string;
  previousKind: string;
  newKind: string;
  occurredAt: string;
};

export type InvItem = {
  id: string;
  name: string;
  category: string;
  onHand: InvQty;
  reserved: InvQty;
  available: InvQty;
  threshold: InvQty;
  lending: InvLending;
  belowThreshold: boolean;
  outOfStock: boolean;
  unconfirmed: boolean;
  consequence: string;
  nextAction: string;
  /** The real route is a server bootstrap projection; fixtures exist only in A4 inspection. */
  dataOrigin?: 'REAL_BOOTSTRAP' | 'LOCAL_PREVIEW_FIXTURE';
  unit?: string;
  classificationStatus?: string;
  conditionReviewState?: string;
  maintenanceReviewState?: string;
  updatedAt?: string;
  recentLedger: InvLedgerEntry[];
  reservations: InvReservation[];
  assets: InvAsset[];
  assetMaintenanceHistory: InvAssetHistory[];
  assetMovementHistory: InvAssetHistory[];
  classificationHistory: InvClassificationHistory[];
};
