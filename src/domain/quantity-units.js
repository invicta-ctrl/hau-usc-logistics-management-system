const COUNTABLE_UNITS = new Set([
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
  'service',
  'set',
  'sheet',
  'table',
  'tray',
  'unit',
]);

const MEASURED_UNITS = new Set([
  'gram',
  'kilogram',
  'liter',
  'meter',
  'milliliter',
  'square meter',
]);

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
  if (
    !isKnownQuantityUnit(unit) ||
    !Number.isFinite(quantity) ||
    (allowZero ? quantity < 0 : quantity <= 0)
  )
    return false;
  return !isCountableUnit(unit) || Number.isInteger(quantity);
}
