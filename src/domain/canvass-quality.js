export const DEFAULT_CANVASS_STALE_AFTER_DAYS = 30;

const normalizedUnit = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

export function canvassQualityIndicators(
  quote,
  { expectedUnits = [], now = new Date(), staleAfterDays = DEFAULT_CANVASS_STALE_AFTER_DAYS } = {},
) {
  const indicators = [];
  const checkedAt = new Date(quote?.checkedAt ?? '');
  const nowDate = now instanceof Date ? now : new Date(now);
  const ageDays =
    Number.isNaN(checkedAt.getTime()) || Number.isNaN(nowDate.getTime())
      ? Number.POSITIVE_INFINITY
      : Math.floor((nowDate.getTime() - checkedAt.getTime()) / 86_400_000);
  if (ageDays > staleAfterDays)
    indicators.push({ code: 'STALE_QUOTE', label: 'Stale quote', tone: 'warning' });

  const unit = normalizedUnit(quote?.unit);
  if (!unit) indicators.push({ code: 'MISSING_UNIT', label: 'Missing unit', tone: 'danger' });
  else {
    const linkedUnits = [...new Set(expectedUnits.map(normalizedUnit).filter(Boolean))];
    if (linkedUnits.length && !linkedUnits.includes(unit))
      indicators.push({ code: 'UNIT_MISMATCH', label: 'Unit mismatch', tone: 'danger' });
  }
  return indicators;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function canvassEvidenceLinks(quote, evidence) {
  const candidates = [
    { kind: 'evidence', label: 'Open evidence', url: safeHttpUrl(evidence?.url) },
    { kind: 'source', label: 'Open source', url: safeHttpUrl(quote?.sourceUrl) },
  ];
  const seen = new Set();
  return candidates.filter((entry) => {
    if (!entry.url || seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
