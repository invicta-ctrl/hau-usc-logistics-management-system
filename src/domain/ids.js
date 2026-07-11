import { assertDomain } from '../app/errors.js';

export function allocateId(state, prefix, year = 2026) {
  assertDomain(state?.counters, 'STATE_COUNTERS_MISSING', 'ID counters are unavailable.');
  const key = `${prefix}-${year}`;
  state.counters[key] = (state.counters[key] ?? 0) + 1;
  return `${prefix}-${year}-${String(state.counters[key]).padStart(5, '0')}`;
}

export function allocateSimpleId(state, prefix) {
  state.counters[prefix] = (state.counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(state.counters[prefix]).padStart(5, '0')}`;
}

export function eventItemId(state, eventCode) {
  const safe =
    String(eventCode)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'EVENT';
  const key = `EIT-${safe}`;
  state.counters[key] = (state.counters[key] ?? 0) + 1;
  return `EIT-${safe}-${String(state.counters[key]).padStart(4, '0')}`;
}

export function yearFromDate(dateOnly) {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(dateOnly);
  assertDomain(match, 'INVALID_DATE_ONLY', 'A valid date-only value is required.');
  return Number(match[1]);
}
