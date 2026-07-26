const PRIVATE_KEY =
  /(?:authorization|cookie|password|secret|token|pepper|credential|student.?id|institution.?id|email|contact|phone|mobile|sheet|workbook|drive|oauth|database.?id|account.?id|bucket.?id|folder.?id|file.?id|object.?key|storage.?reference|provider.?error|tracking.?code)/iu;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const PHONE = /\+?\d[\d\s().-]{7,}\d/gu;

function redactString(value) {
  return String(value).replace(EMAIL, '<redacted-email>').replace(PHONE, '<redacted-contact>');
}

export function redactLogDetails(value, key = '', depth = 0) {
  if (PRIVATE_KEY.test(key)) return '<redacted>';
  if (depth > 4) return '<redacted-depth>';
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') return redactString(value).slice(0, 240);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactLogDetails(item, key, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 30)
        .map(([childKey, child]) => [childKey, redactLogDetails(child, childKey, depth + 1)]),
    );
  }
  return redactString(value);
}

export function createCorrelationId(request, cryptoProvider = globalThis.crypto) {
  const ray = String(request?.headers?.get?.('cf-ray') ?? '')
    .replace(/[^A-Za-z0-9_-]/gu, '')
    .slice(0, 32);
  return ray ? `REQ_${ray}` : `REQ_${cryptoProvider.randomUUID().replaceAll('-', '')}`;
}

export function structuredLog({ level = 'info', event, correlationId, env, details = {} }) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event: redactString(event || 'UNSPECIFIED_EVENT'),
    result: redactString(details.result || 'UNKNOWN'),
    environment: String(env?.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
    releaseVersion: String(env?.APP_VERSION ?? '0.0.0'),
    releaseSha: String(env?.CANDIDATE_SHA ?? 'UNKNOWN').slice(0, 12),
    correlationId,
    ...redactLogDetails(details),
  };
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(record));
  return record;
}
