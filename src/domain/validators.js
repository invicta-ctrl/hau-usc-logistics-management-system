import { AppError, assertDomain } from '../app/errors.js';
import { CATEGORIES, UNITS } from './constants.js';

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
