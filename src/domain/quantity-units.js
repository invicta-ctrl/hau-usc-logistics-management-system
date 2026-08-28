export const COUNTABLE_QUANTITY_UNITS = Object.freeze([
  'bottle',
  'box',
  'can',
  'chair',
  'day',
  'each',
  'facility',
  'kit',
  'meal',
  'pack',
  'pair',
  'pallet',
  'piece',
  'ream',
  'roll',
  'sachet',
  'service',
  'set',
  'sheet',
  'table',
  'tray',
  'unit',
]);

export const MEASURED_QUANTITY_UNITS = Object.freeze([
  'gram',
  'kilogram',
  'liter',
  'meter',
  'milliliter',
  'square meter',
]);

export const KNOWN_QUANTITY_UNITS = Object.freeze([...COUNTABLE_QUANTITY_UNITS, ...MEASURED_QUANTITY_UNITS]);

const COUNTABLE_UNITS = new Set(COUNTABLE_QUANTITY_UNITS);
const MEASURED_UNITS = new Set(MEASURED_QUANTITY_UNITS);

export function normalizeQuantityUnit(unit) {
  return String(unit ?? '')
    .trim()
    .toLowerCase();
}

export function isCountableUnit(unit) {
  return COUNTABLE_UNITS.has(normalizeQuantityUnit(unit));
}

export function isMeasuredUnit(unit) {
  return MEASURED_UNITS.has(normalizeQuantityUnit(unit));
}

export function isKnownQuantityUnit(unit) {
  return isCountableUnit(unit) || isMeasuredUnit(unit);
}

export function quantityStep(unit) {
  return isCountableUnit(unit) ? '1' : isMeasuredUnit(unit) ? '0.01' : '1';
}

export function isValidOperationalQuantity(value, { unit, allowZero = false } = {}) {
  const quantity = Number(value);
  if (!isKnownQuantityUnit(unit) || !Number.isFinite(quantity) || (allowZero ? quantity < 0 : quantity <= 0))
    return false;
  return !isCountableUnit(unit) || Number.isInteger(quantity);
}
