import { AppError, assertDomain } from '../app/errors.js';
import { CATEGORIES, UNITS } from './constants.js';
import { isCountableUnit } from './quantity-units.js';

export function positiveNumber(value, field = 'quantity') {
  const number = Number(value);
  assertDomain(
    Number.isFinite(number) && number > 0,
    'INVALID_QUANTITY',
    'Enter a quantity greater than zero.',
    { fieldErrors: { [field]: 'Enter a number greater than zero.' } },
  );
  return number;
}

export function positiveOperationalQuantity(value, unit, field = 'quantity') {
  const number = positiveNumber(value, field);
  assertDomain(
    !isCountableUnit(unit) || Number.isInteger(number),
    'INVALID_QUANTITY',
    `Enter a whole-number quantity for ${unit}.`,
    { fieldErrors: { [field]: `Enter a whole number for ${unit}.` } },
  );
  return number;
}

export function nonNegativeNumber(value, field = 'quantity') {
  const number = Number(value);
  assertDomain(
    Number.isFinite(number) && number >= 0,
    'INVALID_QUANTITY',
    'Enter a quantity of zero or greater.',
    { fieldErrors: { [field]: 'Enter zero or a positive number.' } },
  );
  return number;
}

export function nonNegativeOperationalQuantity(value, unit, field = 'quantity') {
  const number = nonNegativeNumber(value, field);
  assertDomain(
    !isCountableUnit(unit) || Number.isInteger(number),
    'INVALID_QUANTITY',
    `Enter a whole-number quantity for ${unit}.`,
    { fieldErrors: { [field]: `Enter a whole number for ${unit}.` } },
  );
  return number;
}

export function requiredText(value, field, label = 'This field') {
  const text = String(value ?? '').trim();
  if (!text)
    throw new AppError('VALIDATION_ERROR', `${label} is required.`, {
      fieldErrors: { [field]: `${label} is required.` },
    });
  return text;
}

export function controlledCategory(value) {
  assertDomain(CATEGORIES.includes(value), 'INVALID_CATEGORY', 'Select a controlled category.');
  return value;
}

export function controlledUnit(value) {
  assertDomain(UNITS.includes(value), 'INVALID_UNIT', 'Select a supported unit.');
  return value;
}
