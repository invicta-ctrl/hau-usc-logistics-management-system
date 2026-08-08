import { AppError } from '../app/errors.js';

export const REQUEST_PURPOSES = Object.freeze({
  EVENT_ACTIVITY_SUPPORT: 'EVENT_ACTIVITY_SUPPORT',
  OFFICE_INVENTORY_PANTRY: 'OFFICE_INVENTORY_PANTRY',
});

export const REQUEST_PURPOSE_VALUES = Object.freeze(Object.values(REQUEST_PURPOSES));

const EVENT_PURPOSE = REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT;
const OFFICE_PURPOSE = REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY;

// These are the branch-owned transport fields. Detailed line/catalog fields
// remain shared and are supplied by the existing request domain.
export const REQUEST_PURPOSE_BRANCH_FIELDS = Object.freeze({
  [EVENT_PURPOSE]: Object.freeze([
    'eventSeriesId',
    'eventDayId',
    'eventId',
    'eventName',
    'eventActivity',
    'activityId',
    'location',
    'venue',
    'startDate',
    'endDate',
    'originalRequestId',
    'eventPurpose',
  ]),
  [OFFICE_PURPOSE]: Object.freeze([
    'stockArea',
    'neededDate',
    'relatedRequestId',
    'catalogType',
    'catalogId',
    'catalogItemId',
    'inventoryItemId',
    'restockPurpose',
  ]),
});

export const REQUEST_PURPOSE_SHARED_FIELDS = Object.freeze([
  'requesterName',
  'requesterEmail',
  'requesterType',
  'organization',
  'department',
  'requesterGroup',
  'email',
  'contactNumber',
  'purpose',
  'requestPurpose',
  'purposeDetail',
  'justification',
  'notes',
  'lines',
  'items',
  'lineItems',
  'itemId',
  'clientRequestId',
]);
const DEFAULT_DISCRIMINATORS = Object.freeze({
  requestType: Object.freeze({
    [EVENT_PURPOSE]: Object.freeze(['EVENT_LOGISTICS']),
    [OFFICE_PURPOSE]: Object.freeze(['CATALOG_RESTOCK']),
  }),
});

function purposeError(field, message, details = {}) {
  return new AppError('VALIDATION_ERROR', message, {
    fieldErrors: { [field]: message },
    details: { field, ...details },
  });
}

function normalizePurposeField(field) {
  return typeof field === 'string' && field.trim() ? field.trim() : 'purpose';
}

function normalizeOptions(options) {
  if (options === undefined || options === null) return {};
  if (typeof options === 'string') return { field: options };
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw purposeError('purpose', 'Request purpose options are invalid.');
  }
  return options;
}

function isCommand(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function supplied(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function listValues(values) {
  if (typeof values === 'string') return [values];
  if (Array.isArray(values)) return values;
  if (values instanceof Set) return [...values];
  return [];
}

function normalizedFieldSet(values) {
  return new Set(
    listValues(values)
      .filter((field) => typeof field === 'string' && field.trim())
      .map((field) => field.trim()),
  );
}

function branchFieldOptions(options = {}) {
  const configured = options.fields ?? {};
  const configuredBranches = options.branchFields ?? {};
  const eventFields =
    configured.event ??
    configured.eventFields ??
    options.eventOnlyFields ??
    configuredBranches[EVENT_PURPOSE] ??
    configuredBranches.event ??
    REQUEST_PURPOSE_BRANCH_FIELDS[EVENT_PURPOSE];
  const officeFields =
    configured.office ??
    configured.officeFields ??
    options.officeOnlyFields ??
    configuredBranches[OFFICE_PURPOSE] ??
    configuredBranches.office ??
    REQUEST_PURPOSE_BRANCH_FIELDS[OFFICE_PURPOSE];
  const sharedFields =
    configured.shared ??
    configured.sharedFields ??
    options.sharedFields ??
    options.sharedOnlyFields ??
    REQUEST_PURPOSE_SHARED_FIELDS;
  return {
    event: normalizedFieldSet(options.eventFields ?? eventFields),
    office: normalizedFieldSet(options.officeFields ?? officeFields),
    shared: normalizedFieldSet(sharedFields),
  };
}

function discriminatorOptions(options = {}) {
  const source = options.discriminators ?? DEFAULT_DISCRIMINATORS;
  return Object.entries(source).reduce((result, [field, branches]) => {
    result[field] = Object.fromEntries(
      Object.entries(branches ?? {}).map(([purpose, values]) => [purpose, new Set(listValues(values))]),
    );
    return result;
  }, {});
}

function commandPurposeField(command, options) {
  if (options.field || options.purposeField || options.purposeKey)
    return normalizePurposeField(options.field ?? options.purposeField ?? options.purposeKey);
  if (Object.prototype.hasOwnProperty.call(command, 'requestPurpose')) return 'requestPurpose';
  if (Object.prototype.hasOwnProperty.call(command, 'purpose')) return 'purpose';
  return 'purpose';
}

export function normalizeRequestPurpose(value, options = {}) {
  options = normalizeOptions(options);
  const field = normalizePurposeField(options.field ?? options.purposeField ?? options.purposeKey);
  if (typeof value !== 'string') {
    throw purposeError(field, `${field} must be one of the approved request purposes.`);
  }
  const normalized = value.trim().toUpperCase();
  if (!REQUEST_PURPOSE_VALUES.includes(normalized)) {
    throw purposeError(field, `${field} must be one of the approved request purposes.`, {
      allowed: REQUEST_PURPOSE_VALUES,
    });
  }
  return normalized;
}

function assertBranchFields(command, purpose, options = {}) {
  const fields = branchFieldOptions(options);
  const branchFields = purpose === EVENT_PURPOSE ? fields.event : fields.office;
  const hiddenFields = purpose === EVENT_PURPOSE ? fields.office : fields.event;
  const shared = fields.shared;
  const conflicts = [...hiddenFields].filter((field) => !shared.has(field) && supplied(command[field]));

  const discriminators = discriminatorOptions(options);
  for (const [field, branches] of Object.entries(discriminators)) {
    if (!supplied(command[field])) continue;
    const allowed = branches[purpose];
    if (allowed && !allowed.has(String(command[field]).trim().toUpperCase())) conflicts.push(field);
  }

  const uniqueConflicts = [...new Set(conflicts)];
  if (uniqueConflicts.length) {
    const fieldErrors = Object.fromEntries(
      uniqueConflicts.map((field) => [
        field,
        `${field} is not used with ${purpose === EVENT_PURPOSE ? 'event/activity support' : 'office inventory/pantry'} requests.`,
      ]),
    );
    throw new AppError('VALIDATION_ERROR', 'Request contains fields for another purpose branch.', {
      fieldErrors,
      details: { purpose, conflictingFields: uniqueConflicts },
    });
  }

  // Keep this reference so custom branch lists cannot accidentally become
  // unused configuration without making the branch decision explicit.
  return branchFields;
}

/**
 * Normalize one purpose value. When passed a request command, also reject
 * non-empty fields that belong exclusively to the other purpose branch.
 */
export function validateRequestPurpose(valueOrCommand, options = {}) {
  options = normalizeOptions(options);
  if (!isCommand(valueOrCommand)) return normalizeRequestPurpose(valueOrCommand, options);
  const field = commandPurposeField(valueOrCommand, options);
  const purpose = normalizeRequestPurpose(valueOrCommand[field], { field });
  assertBranchFields(valueOrCommand, purpose, options);
  return purpose;
}

export function validateRequestPurposeCommand(command, options = {}) {
  options = normalizeOptions(options);
  if (!isCommand(command)) {
    throw purposeError(
      normalizePurposeField(options.field ?? options.purposeField ?? options.purposeKey),
      'A request command is required.',
    );
  }
  const field = commandPurposeField(command, options);
  const purpose = validateRequestPurpose(command, options);
  return { ...command, [field]: purpose };
}
