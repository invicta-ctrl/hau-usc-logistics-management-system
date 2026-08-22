import type { InvItem } from "./inventoryTypes";

export const INV_FIXTURE: InvItem[] = [
  {
    id: "ITM-0042",
    name: "Folding chair — monobloc",
    category: "Venue",
    onHand: 240, reserved: 64, available: 176, threshold: 20,
    lending: "lendable", belowThreshold: false, outOfStock: false, unconfirmed: false,
    consequence: "176 units available; 64 reserved against approved requests. Stock is above threshold. Standard reserve permitted.",
    nextAction: "No immediate action required. Review open reservations if restocking is planned.",
  },
  {
    id: "ITM-0051",
    name: "Wireless microphone",
    category: "Equipment",
    onHand: 12, reserved: 9, available: 3, threshold: 6,
    lending: "lendable", belowThreshold: true, outOfStock: false, unconfirmed: false,
    consequence: "3 available against a threshold of 6. 9 units are reserved against approved requests. Accepting new reservations may breach threshold.",
    nextAction: "Review open reservations before accepting further requests. Coordinate with Release Desk if stock must be freed.",
  },
  {
    id: "ITM-0088",
    name: "Extension cord 10m",
    category: "Equipment",
    onHand: 30, reserved: 4, available: 26, threshold: 20,
    lending: "lendable", belowThreshold: false, outOfStock: false, unconfirmed: false,
    consequence: "26 units available; 4 reserved. Stock is above threshold. Standard reserve permitted.",
    nextAction: "No immediate action required.",
  },
  {
    id: "ITM-0104",
    name: "Disposable food pack",
    category: "Consumable",
    onHand: 0, reserved: 0, available: 0, threshold: 6,
    lending: "not-lendable", belowThreshold: true, outOfStock: true, unconfirmed: false,
    consequence: "0 units on hand. Item is not lendable. Issued against approved consumable requests only. Stock is exhausted.",
    nextAction: "Initiate restocking through Procurement. No reserve actions available until stock is replenished.",
  },
  {
    id: "ITM-0067",
    name: "Trestle table 6ft",
    category: "Venue",
    onHand: "—", reserved: "—", available: "—", threshold: "—",
    lending: "lendable", belowThreshold: false, outOfStock: false, unconfirmed: true,
    consequence: "Quantity truth for this item is not confirmed in this design fixture. Do not act on these values.",
    nextAction: "Quantities must be verified against the authoritative ledger before any reserve action.",
  },
];
