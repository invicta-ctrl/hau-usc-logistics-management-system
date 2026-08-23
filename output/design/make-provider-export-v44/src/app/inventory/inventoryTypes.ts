export type InvLending = "lendable" | "not-lendable";
export type InvQty = number | "—";

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
};
