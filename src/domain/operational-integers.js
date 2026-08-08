import { AppError } from '../app/errors.js';

const CANONICAL_INTEGER_PATTERN = /^(?:0|-?[1-9]\d*)$/;
const DEFAULT_FIELD = 'value';

function validationError(field, message, details = {}) {
  return new AppError('VALIDATION_ERROR', message, {
    fieldErrors: { [field]: message },
    details: { field, ...details },
  });
}

function validateBounds(field, min, max) {
  if (min !== undefined && (!Number.isSafeInteger(min) || Object.is(min, -0))) {
    throw validationError(field, `${field} has an invalid minimum.`, { bound: 'min' });
  }
  if (max !== undefined && (!Number.isSafeInteger(max) || Object.is(max, -0))) {
    throw validationError(field, `${field} has an invalid maximum.`, { bound: 'max' });
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw validationError(field, `${field} has an invalid range.`, { bound: 'range' });
  }
}

function normalizeOptions(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new AppError('VALIDATION_ERROR', 'Integer validation options are invalid.');
  }
  const field =
    typeof options.field === 'string' && options.field.trim() ? options.field.trim() : DEFAULT_FIELD;
  const { min, max } = options;
  validateBounds(field, min, max);
  return { field, min, max };
}

function parseCanonicalInteger(value, field) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      throw validationError(field, `${field} must be a whole number.`);
    }
    return value;
  }

  if (typeof value !== 'string' || !CANONICAL_INTEGER_PATTERN.test(value)) {
    throw validationError(field, `${field} must be a canonical base-10 whole number.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw validationError(field, `${field} must be a safe whole number.`);
  }
  return parsed === 0 ? 0 : parsed;
}

function enforceBounds(value, { field, min, max }) {
  if (min !== undefined && value < min) {
    throw validationError(field, `${field} must be at least ${min}.`, { min });
  }
  if (max !== undefined && value > max) {
    throw validationError(field, `${field} must be at most ${max}.`, { max });
  }
  return value;
}

/**
 * Validate an operational whole-number field without coercing ambiguous input.
 * Primitive numbers and canonical base-10 integer strings are accepted.
 */
export function operationalInteger(value, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  return enforceBounds(parseCanonicalInteger(value, normalizedOptions.field), normalizedOptions);
}

/**
 * Validate an optional operational whole-number field. Only null/undefined mean
 * that the field was omitted; blank strings remain invalid input.
 */
export function optionalOperationalInteger(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  return operationalInteger(value, options);
}
