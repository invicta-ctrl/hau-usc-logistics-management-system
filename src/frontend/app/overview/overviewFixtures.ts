import type { ExceptionItem } from "./overviewTypes";

export const EXCEPTIONS_FIXTURE: ExceptionItem[] = [
  {
    id: "ex-1",
    title: "Wireless microphone below threshold",
    ref: "ITM-0051",
    badge: "Below threshold",
    badgeStyle: { background: "rgba(212,24,61,0.1)", color: "#d4183d" },
    age: "1 day",
    state: "3 available · 9 reserved · threshold 6",
    owner: "DOL Staff queue",
    consequence: "Insufficient stock for the next scheduled event.",
    nextAction: "Initiate restocking procurement or reallocate from reserve.",
  },
  {
    id: "ex-2",
    title: "LN-2026-0085 overdue",
    ref: "LN-2026-0085",
    badge: "Overdue",
    badgeStyle: { background: "rgba(212,24,61,0.1)", color: "#d4183d" },
    age: "1 day",
    state: "Overdue 1 day · return not confirmed",
    owner: "DOL Staff queue",
    consequence: "Item remains unaccounted. Ledger balance is open.",
    nextAction: "Follow up with requester. If no response, escalate to record.",
  },
  {
    id: "ex-3",
    title: "PO-2026-0031 partially received",
    ref: "PO-2026-0031",
    badge: "Partial",
    badgeStyle: { background: "rgba(232,185,60,0.15)", color: "#7d5518" },
    age: "2 days",
    state: "Partial receipt · 2 of 5 lines recorded",
    owner: "DOL Staff queue",
    consequence: "Remaining items unconfirmed. Procurement record is incomplete.",
    nextAction: "Confirm outstanding lines with the supplier or mark lines void.",
  },
  {
    id: "ex-4",
    title: "REQ-2026-0139 returned for correction",
    ref: "REQ-2026-0139",
    badge: "Waiting",
    badgeStyle: { background: "rgba(111,90,96,0.12)", color: "#6f5a60" },
    age: "40 min",
    state: "Returned for correction · reason recorded",
    owner: "DOL Staff queue",
    consequence: "Request cannot advance to reserve without requester confirmation.",
    nextAction: "Send a follow-up prompt to the requester to unblock review.",
  },
];

export const OPERATIONAL_PATH = [
  { label: "Review 3 flagged requests", detail: "Request Center · 2 escalated", done: false },
  { label: "Confirm release for REQ-2026-0136", detail: "Release Desk · 3 lines verified", done: false },
  { label: "Record balance for PO-2026-0031", detail: "Restocking · 3 lines outstanding", done: false },
  { label: "Follow up LN-2026-0085", detail: "Lending · overdue 1 day", done: false },
];

export const PULSE_ENTRIES = [
  { time: "09:42", action: "Release confirmed against REQ-2026-0136", detail: "Authorized staff member · 3 lines · evidence attached", ref: "REQ-2026-0136" },
  { time: "09:18", action: "Receiving recorded for PO-2026-0031", detail: "Authorized staff member · partial · 2 of 5 lines", ref: "PO-2026-0031" },
  { time: "08:55", action: "Loan LN-2026-0085 flagged overdue", detail: "System · overdue state recorded", ref: "LN-2026-0085" },
  { time: "08:30", action: "REQ-2026-0139 returned for correction", detail: "Authorized staff member · reason recorded", ref: "REQ-2026-0139" },
  { time: "08:02", action: "Reference list published", detail: "Authorized staff member · departments · version 14", ref: "version 14" },
];

export const TOPOLOGY = [
  { key: "request", label: "Request", val: 14, a: { tag: "Open", val: 14 }, b: { tag: "Approved", val: 6 } },
  { key: "approved", label: "Approved", val: 6, a: { tag: "Approved", val: 6 }, b: { tag: "Reserved", val: 89 } },
  { key: "reserved", label: "Reserved", val: 89, a: { tag: "Reserved", val: 89 }, b: { tag: "Released", val: 312 } },
  { key: "released", label: "Released", val: 312, a: { tag: "Released", val: 312 }, b: { tag: "On loan", val: 9 } },
  { key: "loan", label: "On loan", val: 9, a: { tag: "On loan", val: 9 }, b: { tag: "Returned", val: 204 } },
  { key: "returned", label: "Returned", val: 204, a: { tag: "Returned", val: 204 }, b: { tag: "Ledger", val: 204 } },
];

export const RECON_ROWS = [
  { label: "Reserved units", projection: 89, measure: 89, ledger: 89 },
  { label: "Released lines", projection: 312, measure: 312, ledger: 312 },
  { label: "Open loans", projection: 9, measure: 9, ledger: 9 },
];
