import { AppError } from '../app/errors.js';
import { LEAD_TIME_WEEKS, meetsLeadTime } from './dates.js';

export const FOOD_SERVICE_CLASSES = Object.freeze(['BULK_NON_PERISHABLE_OR_CATERING', 'PERISHABLE_FOOD']);
export const FOOD_DIETARY_SUMMARIES = Object.freeze([
  'NONE_REPORTED',
  'ATTENTION_REQUIRED',
  'PENDING_CONFIRMATION',
]);
export const FOOD_SOURCING_MODES = Object.freeze([
  'PANTRY_STOCK_REVIEW',
  'CANVASS_REQUIRED',
  'APPROVED_EXTERNAL_SOURCE',
]);
export const FOOD_SOURCING_STATUSES = Object.freeze(['PENDING_STOCK_REVIEW', 'PENDING_CANVASS', 'CONFIRMED']);
export const FOOD_ATTENTION_FLAGS = Object.freeze({
  LEAD_TIME_SHORT: 'FOOD_LEAD_TIME_SHORT',
  LEAD_TIME_UNKNOWN: 'FOOD_LEAD_TIME_UNKNOWN',
  DIETARY_CONFIRMATION_PENDING: 'FOOD_DIETARY_CONFIRMATION_PENDING',
  SOURCING_PENDING: 'FOOD_SOURCING_PENDING',
  COMPLETION_EVIDENCE_MISSING: 'FOOD_COMPLETION_EVIDENCE_MISSING',
});

function validation(message, field) {
  throw new AppError('VALIDATION_ERROR', message, {
    fieldErrors: field ? { [field]: message } : undefined,
  });
}

function controlled(value, allowed, field) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!allowed.includes(normalized)) validation(`${field} is not supported.`, field);
  return normalized;
}

function boundedText(value, field, { required = false, max = 120 } = {}) {
  const normalized = String(value ?? '').trim();
  if (required && !normalized) validation(`${field} is required.`, field);
  if (normalized.length > max) validation(`${field} must be ${max} characters or fewer.`, field);
  return normalized;
}

function positiveInteger(value, field, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < (allowZero ? 0 : 1))
    validation(`${field} must be ${allowZero ? 'zero or a positive integer' : 'a positive integer'}.`, field);
  return number;
}

function isoDateTime(value, field, { required = false } = {}) {
  const normalized = boundedText(value, field, { required, max: 80 });
  if (!normalized) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) || !Number.isFinite(Date.parse(normalized)))
    validation(`${field} must be a valid ISO date-time.`, field);
  return normalized;
}

export function manilaDateOnly(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) validation('A valid date-time is required.', 'dateTime');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function foodRequiredBusinessDays(serviceClass) {
  return (
    (serviceClass === 'PERISHABLE_FOOD' ? LEAD_TIME_WEEKS.PERISHABLE_FOOD : LEAD_TIME_WEEKS.BULK_FOOD) * 5
  );
}

export function deriveFoodLeadTime({ serviceClass, submittedAt, serviceStartAt, examWeeks = [] }) {
  const requiredDays = foodRequiredBusinessDays(serviceClass);
  if (!submittedAt || !serviceStartAt)
    return { status: 'UNKNOWN', requiredDays, actualDays: null, shortBy: null };
  const result = meetsLeadTime({
    submittedOn: manilaDateOnly(submittedAt),
    neededOn: manilaDateOnly(serviceStartAt),
    businessWeeks: requiredDays / 5,
    examWeeks,
  });
  return { status: result.compliant ? 'MET' : 'SHORT', ...result };
}

export function normalizeFoodDetails(raw, { submittedAt, eventStartAt = '', examWeeks = [] } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    validation('Food workflow details are required.', 'food');
  const forbidden = [
    'dietaryNarrative',
    'dietaryNames',
    'medicalDetails',
    'supplierContact',
    'supplierTin',
    'paymentDetails',
  ];
  if (forbidden.some((key) => raw[key] != null && String(raw[key]).trim()))
    throw new AppError(
      'SENSITIVE_DATA_NOT_ALLOWED',
      'Person-level dietary, medical, supplier, and payment details are not allowed.',
    );
  const serviceClass = controlled(raw.serviceClass, FOOD_SERVICE_CLASSES, 'food.serviceClass');
  const expectedHeadcount = positiveInteger(raw.expectedHeadcount, 'food.expectedHeadcount');
  const requiredServings = positiveInteger(raw.requiredServings, 'food.requiredServings');
  const serviceStartAt = isoDateTime(raw.serviceStartAt || eventStartAt, 'food.serviceStartAt', {
    required: true,
  });
  const serviceEndAt = isoDateTime(raw.serviceEndAt, 'food.serviceEndAt');
  if (serviceEndAt && Date.parse(serviceEndAt) < Date.parse(serviceStartAt))
    validation('food.serviceEndAt cannot precede the service start.', 'food.serviceEndAt');
  const dietarySummary = controlled(raw.dietarySummary, FOOD_DIETARY_SUMMARIES, 'food.dietarySummary');
  const dietaryAttentionServings = positiveInteger(
    raw.dietaryAttentionServings ?? 0,
    'food.dietaryAttentionServings',
    {
      allowZero: true,
    },
  );
  if (dietaryAttentionServings > requiredServings)
    validation(
      'food.dietaryAttentionServings cannot exceed required servings.',
      'food.dietaryAttentionServings',
    );
  if (dietarySummary === 'ATTENTION_REQUIRED' && dietaryAttentionServings === 0)
    validation('Enter the number of servings needing dietary attention.', 'food.dietaryAttentionServings');
  if (dietarySummary !== 'ATTENTION_REQUIRED' && dietaryAttentionServings !== 0)
    validation(
      'Dietary attention servings must be zero unless attention is required.',
      'food.dietaryAttentionServings',
    );
  const sourcingMode = controlled(raw.sourcingMode, FOOD_SOURCING_MODES, 'food.sourcingMode');
  const sourceReference = boundedText(raw.sourceReference, 'food.sourceReference');
  if (sourcingMode === 'APPROVED_EXTERNAL_SOURCE' && !sourceReference)
    validation('food.sourceReference is required for an approved external source.', 'food.sourceReference');
  const initialSourcingStatus = {
    PANTRY_STOCK_REVIEW: 'PENDING_STOCK_REVIEW',
    CANVASS_REQUIRED: 'PENDING_CANVASS',
    APPROVED_EXTERNAL_SOURCE: 'CONFIRMED',
  }[sourcingMode];
  return {
    version: 1,
    serviceClass,
    expectedHeadcount,
    requiredServings,
    serviceStartAt,
    serviceEndAt,
    serviceLocation: boundedText(raw.serviceLocation, 'food.serviceLocation', { required: true }),
    dietarySummary,
    dietaryAttentionServings,
    sourcingMode,
    sourcingStatus: initialSourcingStatus,
    sourceReference,
    completionEvidenceId: '',
    leadTime: deriveFoodLeadTime({ serviceClass, submittedAt, serviceStartAt, examWeeks }),
  };
}

export function foodAttentionFlags(food) {
  const flags = [];
  if (food.leadTime?.status === 'SHORT') flags.push(FOOD_ATTENTION_FLAGS.LEAD_TIME_SHORT);
  if (food.leadTime?.status === 'UNKNOWN') flags.push(FOOD_ATTENTION_FLAGS.LEAD_TIME_UNKNOWN);
  if (food.dietarySummary === 'PENDING_CONFIRMATION')
    flags.push(FOOD_ATTENTION_FLAGS.DIETARY_CONFIRMATION_PENDING);
  if (food.sourcingStatus !== 'CONFIRMED') flags.push(FOOD_ATTENTION_FLAGS.SOURCING_PENDING);
  if (!food.completionEvidenceId) flags.push(FOOD_ATTENTION_FLAGS.COMPLETION_EVIDENCE_MISSING);
  return flags;
}

export function updateFoodWorkflow(current, patch = {}) {
  if (!current || current.version !== 1)
    throw new AppError('FOOD_WORKFLOW_VERSION_UNSUPPORTED', 'Food workflow version is unsupported.');
  const next = { ...current };
  if (patch.dietarySummary != null)
    next.dietarySummary = controlled(patch.dietarySummary, FOOD_DIETARY_SUMMARIES, 'dietarySummary');
  if (patch.dietaryAttentionServings != null)
    next.dietaryAttentionServings = positiveInteger(
      patch.dietaryAttentionServings,
      'dietaryAttentionServings',
      { allowZero: true },
    );
  if (next.dietaryAttentionServings > next.requiredServings)
    validation('dietaryAttentionServings cannot exceed required servings.', 'dietaryAttentionServings');
  if (next.dietarySummary === 'ATTENTION_REQUIRED' && next.dietaryAttentionServings === 0)
    validation('Enter the number of servings needing dietary attention.', 'dietaryAttentionServings');
  if (next.dietarySummary !== 'ATTENTION_REQUIRED' && next.dietaryAttentionServings !== 0)
    validation(
      'Dietary attention servings must be zero unless attention is required.',
      'dietaryAttentionServings',
    );
  if (patch.sourcingStatus != null)
    next.sourcingStatus = controlled(patch.sourcingStatus, FOOD_SOURCING_STATUSES, 'sourcingStatus');
  const allowedSourcingStatuses = {
    PANTRY_STOCK_REVIEW: ['PENDING_STOCK_REVIEW', 'CONFIRMED'],
    CANVASS_REQUIRED: ['PENDING_CANVASS', 'CONFIRMED'],
    APPROVED_EXTERNAL_SOURCE: ['CONFIRMED'],
  }[next.sourcingMode];
  if (!allowedSourcingStatuses.includes(next.sourcingStatus))
    validation('sourcingStatus is incompatible with the selected sourcing mode.', 'sourcingStatus');
  if (patch.sourceReference != null)
    next.sourceReference = boundedText(patch.sourceReference, 'sourceReference');
  if (next.sourcingMode === 'APPROVED_EXTERNAL_SOURCE' && !next.sourceReference)
    validation('sourceReference is required for an approved external source.', 'sourceReference');
  if (patch.completionEvidenceId != null)
    next.completionEvidenceId = boundedText(patch.completionEvidenceId, 'completionEvidenceId');
  return next;
}

export function assertFoodTransition(food, action, { evidenceUploaded = false } = {}) {
  const normalizedAction = String(action ?? '')
    .trim()
    .toUpperCase();
  if (normalizedAction === 'READY_FOR_HANDOFF') {
    if (food.dietarySummary === 'PENDING_CONFIRMATION')
      throw new AppError(
        'FOOD_DIETARY_CONFIRMATION_REQUIRED',
        'Dietary summary must be confirmed before handoff.',
      );
    if (food.sourcingStatus !== 'CONFIRMED')
      throw new AppError('FOOD_SOURCING_REQUIRED', 'Food sourcing must be confirmed before handoff.');
  }
  if (normalizedAction === 'COMPLETE' && (!food.completionEvidenceId || !evidenceUploaded))
    throw new AppError(
      'FOOD_COMPLETION_EVIDENCE_REQUIRED',
      'Uploaded Food delivery evidence is required before completion.',
    );
  return true;
}

export function buildFoodQueueItem(parent, child) {
  if (child.componentType !== 'FOOD')
    throw new AppError('FOOD_COMPONENT_REQUIRED', 'A Food component is required.');
  return {
    requestId: parent.requestId,
    componentId: child.componentId,
    status: child.status,
    ownerCommitteeId: 'COM_FOOD',
    ownerUserId: child.ownerUserId || '',
    dueAt: child.dueAt || '',
    revision: Number(child.revision || 1),
    parent: {
      eventId: parent.eventId || '',
      eventName: parent.eventName || '',
      eventStartAt: parent.eventStartAt || '',
      priority: parent.priority || 'ROUTINE',
      purpose: parent.purpose || '',
      department: parent.department || '',
    },
    food: child.payload?.food,
    attentionFlags: child.attentionFlags || [],
  };
}
