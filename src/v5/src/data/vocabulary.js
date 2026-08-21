/* User-facing vocabulary.
   Mirrors src/domain/presentation-labels.js and src/domain/constants.js in the
   product. No raw enum ever reaches the interface; unknown tokens fall back to
   title case exactly as the product does. */

export const STATUS_LABELS = {
  FOR_REVIEW: 'For Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  FOR_CANVASSING: 'For Canvassing',
  WAITING_FOR_BUDGET: 'Waiting for Budget',
  TO_BE_PROCURED: 'To Be Procured',
  PROCURED: 'Procured',
  PARTIALLY_RECEIVED: 'Partially Received',
  READY_TO_RELEASE: 'Ready to Release',
  PARTIALLY_RELEASED: 'Partially Released',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  COMPLETED: 'Completed',
  RESTOCKED: 'Restocked',
  READY_TO_CLAIM: 'Ready to Claim',
  ON_LOAN: 'On Loan',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue',
  ACTIVE: 'Active',
  CLEARED: 'Cleared',
  ARCHIVED: 'Archived',
};

/* Five tones only. See DESIGN.md. */
export const STATUS_TONE = {
  ARCHIVED: 'neutral',
  CLEARED: 'neutral',
  RETURNED: 'neutral',
  RESTOCKED: 'neutral',

  FOR_REVIEW: 'info',
  FOR_CANVASSING: 'info',
  WAITING_FOR_BUDGET: 'info',
  TO_BE_PROCURED: 'info',

  ACCEPTED: 'progress',
  PROCURED: 'progress',
  PARTIALLY_RECEIVED: 'progress',
  PARTIALLY_RELEASED: 'progress',
  PARTIALLY_FULFILLED: 'progress',
  READY_TO_RELEASE: 'progress',
  READY_TO_CLAIM: 'progress',
  ON_LOAN: 'progress',
  ACTIVE: 'progress',

  COMPLETED: 'done',

  OVERDUE: 'alert',
  REJECTED: 'alert',
  CANCELLED: 'alert',
};

export const ROLE_LABELS = {
  SYSTEM_OWNER: 'System Owner',
  ADMINISTRATOR: 'Administrator',
  DIRECTOR: 'Director',
  COMMITTEE_HEAD: 'Committee Head',
  DOL_STAFF: 'DOL Staff',
  REQUESTER: 'Requester',
  READ_ONLY_AUDITOR: 'Read-only Auditor',
};

export const COMMITTEE_LABELS = {
  COM_FOOD: 'Food Committee',
  COM_INVENTORY_PANTRY: 'Inventory and Pantry Committee',
  COM_MATERIALS: 'Materials Committee',
};

export const CATEGORY_LABELS = {
  OFFICE_SUPPLIES: 'Office Supplies',
  PANTRY_FOOD: 'Pantry Food',
  EQUIPMENT: 'Equipment',
  PRINTING_SIGNAGE: 'Printing and Signage',
  EVENT_MATERIALS: 'Event Materials',
  CLEANING_SUPPLIES: 'Cleaning Supplies',
  OTHER_CONTROLLED: 'Other Controlled Materials',
};

export const LEDGER_LABELS = {
  OPENING_BALANCE: 'Opening Balance',
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  LOAN_OUT: 'Loan Out',
  LOAN_RETURN: 'Loan Return',
  ADJUSTMENT_IN: 'Adjustment In',
  ADJUSTMENT_OUT: 'Adjustment Out',
  TRANSFER_OUT_EVENT: 'Transfer Out (Event)',
  TRANSFER_IN_INVENTORY: 'Transfer In (Inventory)',
  EMERGENCY_ISSUE: 'Emergency Issue',
};

const titleCase = (value) =>
  String(value)
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|\s|[-/])\p{L}/gu, (c) => c.toUpperCase());

export function label(value, map = STATUS_LABELS, missing = 'Not recorded') {
  if (value === null || value === undefined || String(value).trim() === '') return missing;
  return map[value] ?? titleCase(value);
}

export const statusLabel = (v) => label(v, STATUS_LABELS);
export const tone = (v) => STATUS_TONE[v] ?? 'neutral';
