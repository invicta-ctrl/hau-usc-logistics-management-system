import { assertDomain } from '../app/errors.js';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value) {
  assertDomain(DATE_ONLY.test(String(value)), 'INVALID_DATE_ONLY', 'Use a YYYY-MM-DD date.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  assertDomain(
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day,
    'INVALID_DATE_ONLY',
    'The date does not exist.',
  );
  return { year, month, day, value };
}

export function compareDateOnly(a, b) {
  parseDateOnly(a);
  parseDateOnly(b);
  return a.localeCompare(b);
}

export function addDays(dateOnly, days) {
  const { year, month, day } = parseDateOnly(dateOnly);
  const date = new Date(Date.UTC(year, month - 1, day + Number(days), 12));
  return date.toISOString().slice(0, 10);
}

export function formatDateOnly(value, locale = 'en-PH') {
  const { year, month, day } = parseDateOnly(value);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatDateTime(value, locale = 'en-PH') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));
}

export function isExamDate(dateOnly, examWeeks = []) {
  return examWeeks.some(
    ({ start, end }) => compareDateOnly(dateOnly, start) >= 0 && compareDateOnly(dateOnly, end) <= 0,
  );
}

export function businessDaysBetween(start, end, examWeeks = []) {
  parseDateOnly(start);
  parseDateOnly(end);
  let days = 0;
  for (let cursor = start; compareDateOnly(cursor, end) < 0; cursor = addDays(cursor, 1)) {
    const weekday = new Date(`${cursor}T12:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !isExamDate(cursor, examWeeks)) days += 1;
  }
  return days;
}

export function meetsLeadTime({ submittedOn, neededOn, businessWeeks, examWeeks = [] }) {
  const requiredDays = businessWeeks * 5;
  const actualDays = businessDaysBetween(submittedOn, neededOn, examWeeks);
  return {
    compliant: actualDays >= requiredDays,
    requiredDays,
    actualDays,
    shortBy: Math.max(0, requiredDays - actualDays),
  };
}

export const LEAD_TIME_WEEKS = Object.freeze({
  MAJOR_VENUE: 4,
  OTHER_ROOM: 2,
  BULK_MATERIALS: 3,
  RETAIL_MATERIALS: 1,
  BULK_FOOD: 2,
  PERISHABLE_FOOD: 1,
});
