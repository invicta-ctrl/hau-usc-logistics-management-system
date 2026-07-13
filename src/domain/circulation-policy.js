const token = (value) => String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

export function normalizeHandling(value) {
  const normalized = token(value);
  if (normalized === 'REUSABLE' || normalized === 'REUSABLEASSET') return 'REUSABLE_ASSET';
  if (normalized === 'NONCIRCULATING') return 'NON_CIRCULATING';
  return normalized;
}

export function normalizeLendingAudience(value) {
  const normalized = token(value);
  if (['STAFF_ONLY', 'USC_OFFICERS_AND_STAFF_ONLY'].includes(normalized)) {
    return 'USC_STAFF_ONLY';
  }
  if (normalized === 'STUDENTS_AND_USC_STAFF') return 'STUDENTS_AND_STAFF';
  if (normalized === 'NOT_AVAILABLE') return 'NOT_AVAILABLE_FOR_LENDING';
  return normalized || 'NOT_AVAILABLE_FOR_LENDING';
}

export function normalizeBorrowerType(value) {
  const normalized = token(value);
  if (['USC_STAFF', 'USC_OFFICER', 'STAFF'].includes(normalized)) return 'USC_STAFF';
  if (['ANGELITE', 'STUDENT', 'HAU_STUDENT'].includes(normalized)) return 'ANGELITE';
  return normalized;
}

export function isReturnableHandling(value) {
  return ['LOANABLE', 'REUSABLE_ASSET'].includes(normalizeHandling(value));
}

const searchableFields = (item) => [
  item.id,
  item.name,
  ...(item.aliases ?? []),
  item.category,
  item.stockArea,
  item.catalogType,
  item.handling,
  item.handlingCode,
  item.unit,
].map((value) => String(value ?? '').trim().toLowerCase());

export function scoreLendingItem(query, item) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) return 0;
  const fields = searchableFields(item);
  const id = String(item.id ?? '').trim().toLowerCase();
  const name = String(item.name ?? '').trim().toLowerCase();
  const aliases = (item.aliases ?? []).map((value) => String(value).trim().toLowerCase());
  if (normalizedQuery === id || normalizedQuery === name) return 600;
  if (aliases.includes(normalizedQuery)) return 500;
  if (fields.some((field) => field.startsWith(normalizedQuery))) return 400;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length && tokens.every((part) => fields.some((field) => field.includes(part)))) {
    return 300;
  }
  if (fields.some((field) => field.includes(normalizedQuery))) return 200;
  return 0;
}

export function rankLendingItems(items, query, limit = 10) {
  return (items ?? [])
    .map((item) => ({ item, score: scoreLendingItem(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name))
    .slice(0, limit)
    .map(({ item }) => item);
}

export const lendingAudienceLabel = (value) => ({
  NOT_AVAILABLE_FOR_LENDING: 'Not available in Lending Hub',
  USC_STAFF_ONLY: 'USC officers and staff only',
  STUDENTS_AND_STAFF: 'Students and USC staff',
  DOL_INTERNAL_ONLY: 'Eligible DOL users only',
})[normalizeLendingAudience(value)] ?? 'Not available in Lending Hub';

export function evaluateLendingEligibility(item, options = {}) {
  const borrowerType = normalizeBorrowerType(options.borrowerType || 'ANGELITE');
  const quantity = Number(options.quantity || 1);
  const status = token(item?.status || 'INACTIVE');
  const handling = normalizeHandling(item?.handlingCode || item?.handling);
  const audience = normalizeLendingAudience(item?.lendingAudience);
  const available = Number(item?.availableToPromise || 0);
  const maximum = item?.maximumLoanQuantity === '' || item?.maximumLoanQuantity == null
    ? null
    : Number(item.maximumLoanQuantity);
  const base = { handling, audience, available, maximum, returnable: isReturnableHandling(handling) };

  if (status === 'ARCHIVED' || status === 'INACTIVE') {
    return { ...base, selectable: false, validForSubmit: false, state: 'inactive', message: 'This item is archived or inactive.' };
  }
  if (status === 'VERIFY') {
    return { ...base, selectable: false, validForSubmit: false, state: 'verify', message: 'This legacy item must be reconciled before circulation.' };
  }
  if (handling === 'NON_CIRCULATING' || audience === 'NOT_AVAILABLE_FOR_LENDING') {
    return { ...base, selectable: false, validForSubmit: false, state: 'not-circulating', message: 'This item is tracked in inventory but is not available for lending or issuance through this hub.' };
  }
  if (audience === 'USC_STAFF_ONLY' && borrowerType !== 'USC_STAFF') {
    return { ...base, selectable: false, validForSubmit: false, state: 'staff-only', message: 'Available only to USC officers and staff.' };
  }
  if (audience === 'DOL_INTERNAL_ONLY' && borrowerType !== 'USC_STAFF') {
    return { ...base, selectable: false, validForSubmit: false, state: 'dol-only', message: 'Available only to eligible DOL users.' };
  }
  if (available <= 0) {
    return { ...base, selectable: false, validForSubmit: false, state: 'out-of-stock', message: `${item.name} is currently out of stock.` };
  }
  if (maximum != null && Number.isFinite(maximum) && quantity > maximum) {
    return { ...base, selectable: true, validForSubmit: false, state: 'quantity-restricted', message: `Maximum ${maximum} ${item.unit} per ticket.` };
  }
  if (quantity > available) {
    return { ...base, selectable: true, validForSubmit: false, state: 'insufficient-stock', message: `Only ${available} ${item.unit} are currently available to promise.` };
  }
  const restriction = maximum != null && Number.isFinite(maximum)
    ? ` Maximum ${maximum} ${item.unit} per ticket.`
    : '';
  return { ...base, selectable: true, validForSubmit: true, state: 'available', message: `${available} ${item.unit} available.${restriction}` };
}

export function validateLendingSelection(item, options = {}) {
  if (!item) return { valid: false, code: 'ITEM_NOT_SELECTED', message: 'Select an inventory item from the suggestions before submitting.' };
  const eligibility = evaluateLendingEligibility(item, options);
  if (!eligibility.selectable || !eligibility.validForSubmit) {
    return { valid: false, code: eligibility.state, message: eligibility.message, eligibility };
  }
  if (eligibility.returnable) {
    if (!options.dueAt) return { valid: false, code: 'DUE_DATE_REQUIRED', message: 'Choose a future due date for this returnable item.', eligibility };
    const dueAt = new Date(options.dueAt);
    const now = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
    if (Number.isNaN(dueAt.getTime()) || dueAt <= now) {
      return { valid: false, code: 'INVALID_DUE_DATE', message: 'The due date must be in the future.', eligibility };
    }
  }
  return { valid: true, eligibility };
}
