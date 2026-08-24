export type InvLending = 'lendable' | 'not-lendable';
export type InvQty = number | '—';

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
};
