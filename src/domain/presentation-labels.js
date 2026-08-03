const GENERIC_LABELS = Object.freeze({
  ACCEPTED: 'Accepted',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
  CLEARED: 'Cleared',
  COMPLETED: 'Completed',
  CONSUMABLE: 'Consumable',
  DAMAGED: 'Damaged',
  DRAFT: 'Draft',
  FOR_CANVASSING: 'For Canvassing',
  FOR_REVIEW: 'For Review',
  INACTIVE: 'Inactive',
  MAINTENANCE_REQUIRED: 'Maintenance Required',
  NOT_APPLICABLE: 'Not Applicable',
  NOT_ASSESSED: 'Not Assessed',
  NOT_CHECKED: 'Not Checked',
  ON_LOAN: 'On Loan',
  OVERDUE: 'Overdue',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  PARTIALLY_RECEIVED: 'Partially Received',
  PARTIALLY_RELEASED: 'Partially Released',
  PROCURED: 'Procured',
  READY_TO_CLAIM: 'Ready to Claim',
  READY_TO_RELEASE: 'Ready to Release',
  REJECTED: 'Rejected',
  RESTOCKED: 'Restocked',
  RETURNED: 'Returned',
  TO_BE_PROCURED: 'To Be Procured',
  UNAVAILABLE: 'Unavailable',
  UNVERIFIED: 'Unverified',
  WAITING_FOR_BUDGET: 'Waiting for Budget',
});

const CONTEXT_LABELS = Object.freeze({
  category: Object.freeze({
    CLEANING_SUPPLIES: 'Cleaning Supplies',
    EQUIPMENT: 'Equipment',
    EVENT_MATERIALS: 'Event Materials',
    OFFICE_INVENTORY: 'Office Inventory',
    OFFICE_SUPPLIES: 'Office Supplies',
    OTHER_CONTROLLED: 'Other Controlled Materials',
    PANTRY_FOOD: 'Pantry Food',
    PRINTING_SIGNAGE: 'Printing and Signage',
  }),
  classificationStatus: Object.freeze({
    CLASSIFIED: 'Classification Complete',
    NEEDS_CLASSIFICATION: 'Needs Classification',
  }),
  committee: Object.freeze({
    COM_FOOD: 'Food Committee',
    COM_INVENTORY_PANTRY: 'Inventory and Pantry Committee',
    COM_MATERIALS: 'Materials Committee',
  }),
  condition: Object.freeze({
    FAIR: 'Fair',
    GOOD: 'Good',
    NEW: 'New',
    NOT_APPLICABLE: 'Not Applicable',
    NOT_ASSESSED: 'Not Assessed',
    POOR: 'Poor / Quarantine',
  }),
  fulfillment: Object.freeze({
    ISSUE_FROM_STOCK: 'Issue from Stock',
    PENDING_DECISION: 'Pending Decision',
    PROCUREMENT_REQUIRED: 'Procurement Required',
    STOCK_REVIEW: 'Review Available Stock',
  }),
  eventLink: Object.freeze({
    FOOD_REQUIREMENT: 'Food Requirement',
    INVENTORY_REQUIREMENT: 'Inventory Requirement',
    MATERIAL: 'Material',
    PROCUREMENT: 'Procurement',
    RELEASE: 'Release',
    REQUEST: 'Request',
  }),
  handling: Object.freeze({
    CONSUMABLE: 'Consumable',
    LOANABLE: 'Loanable',
    NON_CIRCULATING: 'Non-circulating',
    REUSABLE_ASSET: 'Reusable Asset',
  }),
  inventoryKind: Object.freeze({
    CONSUMABLE: 'Consumable',
    REUSABLE: 'Reusable',
    UNVERIFIED: 'Unverified',
  }),
  lendingAudience: Object.freeze({
    DOL_INTERNAL_ONLY: 'Eligible DOL users only',
    NOT_AVAILABLE_FOR_LENDING: 'Not available for lending',
    STUDENTS_AND_STAFF: 'Students and USC staff',
    USC_STAFF_ONLY: 'USC officers and staff only',
  }),
  maintenance: Object.freeze({
    CLEARED: 'Cleared',
    MAINTENANCE_REQUIRED: 'Maintenance Required',
    NOT_APPLICABLE: 'Not Applicable',
    NOT_ASSESSED: 'Not Assessed',
  }),
  role: Object.freeze({
    ADMINISTRATOR: 'Administrator',
    COMMITTEE_HEAD: 'Committee Head',
    DIRECTOR: 'Director',
    DOL_STAFF: 'DOL Staff',
    READ_ONLY_AUDITOR: 'Read-only Auditor',
    REQUESTER: 'Requester',
    SYSTEM_OWNER: 'System Owner',
  }),
  status: Object.freeze({
    ...GENERIC_LABELS,
    FOR_REVIEW: 'For Review',
  }),
  workflow: Object.freeze({
    COMPLETED: 'Completed',
    FOR_REVIEW: 'For Review',
    PENDING_DECISION: 'Pending Decision',
    REJECTED: 'Rejected',
  }),
});

const titleCase = (value) =>
  value
    .replaceAll('_', ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/(^|\s|[-/])\p{L}/gu, (character) => character.toLocaleUpperCase('en-US'));

/**
 * Convert an internal enum or token into safe user-facing copy without
 * changing the submitted value. Context mappings win over the generic map;
 * unknown non-empty tokens receive a readable title-cased fallback.
 */
export function presentationLabel(value, { context = 'generic', missing = 'Not recorded' } = {}) {
  if (value === null || value === undefined || String(value).trim() === '') return missing;
  const token = String(value).trim();
  const contextMap = CONTEXT_LABELS[context];
  return contextMap?.[token] ?? GENERIC_LABELS[token] ?? titleCase(token);
}

export const statusLabel = (value, options = {}) =>
  presentationLabel(value, { ...options, context: options.context ?? 'status' });

export const inventoryLabel = (value, context = 'generic', options = {}) =>
  presentationLabel(value, { ...options, context });

export function presentationNumber(source, key, missing = 'Not reported') {
  const value = source?.[key];
  if (value === null || value === undefined || value === '') return missing;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : missing;
}

export function sumPresentationNumbers(values, missing = 'Not reported') {
  return values.every((value) => typeof value === 'number' && Number.isFinite(value))
    ? values.reduce((sum, value) => sum + value, 0)
    : missing;
}

export const presentationLabelMaps = CONTEXT_LABELS;
