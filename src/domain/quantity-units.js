const COUNTABLE_UNITS = new Set([
  'bottle',
  'box',
  'chair',
  'day',
  'each',
  'facility',
  'kit',
  'meal',
  'pack',
  'piece',
  'ream',
  'roll',
  'service',
  'set',
  'sheet',
  'table',
  'unit',
]);

export function normalizeQuantityUnit(unit) {
  return String(unit ?? '')
    .trim()
    .toLowerCase();
}

export function isCountableUnit(unit) {
  return COUNTABLE_UNITS.has(normalizeQuantityUnit(unit));
}

export function quantityStep(unit) {
  return isCountableUnit(unit) ? '1' : '0.01';
}

export function isValidOperationalQuantity(value, { unit, allowZero = false } = {}) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || (allowZero ? quantity < 0 : quantity <= 0)) return false;
  return !isCountableUnit(unit) || Number.isInteger(quantity);
}
