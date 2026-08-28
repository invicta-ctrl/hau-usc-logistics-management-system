import type { ExceptionItem } from "./overviewTypes";

/* Columns, record subtitles and next-action verbs are read from the CURRENT
 * Figma frame 434:61 ("CURRENT · R2 Glass Operations Command Table"), not
 * invented. The long `nextAction` sentence is kept for the inspector, because
 * Figma's lede says selecting a record is how you see "evidence and the
 * permitted next action". */
export const EXCEPTIONS_FIXTURE: ExceptionItem[] = [
  {
    id: "ex-1",
    ref: "ITM-0051",
    title: "Wireless microphone",
    lane: "Inventory · stock risk",
    currentState: "3 available · 9 reserved",
    evidence: "Below threshold",
    nextActionLabel: "Review stock",
    tone: "alert",
    age: "1 day",
    owner: "DOL Staff queue",
    consequence: "Insufficient stock for the next scheduled event.",
    nextAction: "Initiate restocking procurement or reallocate from reserve.",
  },
  {
    id: "ex-2",
    ref: "LN-2026-0085",
    title: "Loan overdue",
    lane: "Lending · borrower custody",
    currentState: "Overdue 1 day",
    evidence: "Custody active",
    nextActionLabel: "Record return",
    tone: "alert",
    age: "1 day",
    owner: "DOL Staff queue",
    consequence: "Item remains unaccounted. Ledger balance is open.",
    nextAction: "Follow up with requester. If no response, escalate to record.",
  },
  {
    id: "ex-3",
    ref: "PO-2026-0031",
    title: "Partially received",
    lane: "Receiving · PO revision 3",
    currentState: "2 of 5 received",
    evidence: "3 outstanding",
    nextActionLabel: "Receive balance",
    tone: "progress",
    age: "2 days",
    owner: "DOL Staff queue",
    consequence: "Remaining items unconfirmed. Procurement record is incomplete.",
    nextAction: "Confirm outstanding lines with the supplier or mark lines void.",
  },
  {
    id: "ex-4",
    ref: "REQ-2026-0139",
    title: "Returned for correction",
    lane: "Request Center · waiting",
    currentState: "Correction requested",
    evidence: "Requester pending",
    nextActionLabel: "Open request",
    tone: "neutral",
    age: "40 min",
    owner: "DOL Staff queue",
    consequence: "Request cannot advance to reserve without requester confirmation.",
    nextAction: "Send a follow-up prompt to the requester to unblock review.",
  },
];

export const OPERATIONAL_PATH = [
  { label: "Review 3 flagged requests", detail: "Request Center · 2 escalated" },
  { label: "Confirm release for REQ-2026-0136", detail: "Release Desk · 3 lines verified" },
  { label: "Record balance for PO-2026-0031", detail: "Restocking · 3 lines outstanding" },
  { label: "Follow up LN-2026-0085", detail: "Lending · overdue 1 day" },
];

/* Figma's "Evidence and provenance" panel. */
export const PROVENANCE = {
  ledgerRevision: "rev 30",
  projectionSnapshot: "f5fcfafc",
  lastConfirmedEvent: "09:42",
  fixtureNote: "Fixture data · not production",
  gap: "Reminder unavailable · no scheduler contract",
};

/* Recent confirmed events. Figma's panel carries a single "last confirmed
 * event" line; the owner's own Overview brief requires this surface to answer
 * "what changed?", and owner instruction outranks Figma in DESIGN.md's
 * authority hierarchy. Held to three entries so it stays a provenance detail
 * rather than growing back into the activity feed the previous pass built. */
export const RECENT_EVENTS = [
  { time: "09:42", action: "Release confirmed against REQ-2026-0136" },
  { time: "09:18", action: "Receiving recorded for PO-2026-0031" },
  { time: "08:55", action: "Loan LN-2026-0085 flagged overdue" },
];

/* Figma reconciliation table: MEASURE · LEDGER · PROJECTION · STATE. */
export const RECON_ROWS = [
  { label: "Reserved units", ledger: 89, projection: 89 },
  { label: "Released lines", ledger: 312, projection: 312 },
  { label: "Open loans", ledger: 9, projection: 9 },
];

export const RECON_SOURCE =
  "Source: governed ledger · reconciled 09:42 · schema 30 · snapshot f5fcfafc · DESIGN FIXTURE";

/* The quiet standing band. Figma keeps these four as one flat run under a
 * NOW · N EXCEPTIONS label; the previous pass turned them into three weighted
 * cards, which is the deviation correction R4 reverses. */
export const STANDING = [
  { value: 14, label: "open requests" },
  { value: 9, label: "loans out" },
  { value: 6, label: "awaiting release" },
  { value: 2, label: "below threshold" },
];
