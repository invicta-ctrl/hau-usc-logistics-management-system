export type OperationalRecord = Record<string, unknown>;

const EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function value(row: OperationalRecord, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

export function textValue(row: OperationalRecord, keys: string[]) {
  const candidate = value(row, keys);
  return typeof candidate === 'string' ? candidate.trim() : '';
}

export function numberValue(row: OperationalRecord, keys: string[]) {
  const candidate = Number(value(row, keys));
  return Number.isFinite(candidate) ? candidate : 0;
}

export function operationalClientRequestId(kind: string, values: Array<string | number | boolean>) {
  let hash = 2166136261;
  for (const character of [kind, ...values.map(String)].join('|')) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return `p08-${kind}-${(hash >>> 0).toString(36)}`;
}

export function evidenceError(file: File | null) {
  if (!file) return 'Select a governed photo or PDF before recording this operation.';
  if (!EVIDENCE_TYPES.has(file.type)) return 'Use a JPG, PNG, WEBP, or PDF evidence file.';
  if (file.size <= 0) return 'The selected evidence file is empty.';
  if (file.size > 10 * 1024 * 1024) return 'The selected evidence file exceeds the 10 MB limit.';
  return '';
}

export function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The evidence file could not be read.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

/** Content identity prevents idempotent evidence retries from conflating different files with matching metadata. */
export async function evidenceByteDigest(file: Pick<File, 'arrayBuffer'>) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure evidence identity is unavailable in this browser.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function readable(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : 'Not reported';
}
