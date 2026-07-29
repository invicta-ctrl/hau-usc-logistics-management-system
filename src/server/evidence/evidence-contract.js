const encoder = new TextEncoder();

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
});

export const EVIDENCE_TYPES = Object.freeze({
  RESTOCK_RECEIPT: Object.freeze({ code: 'RST-RCPT', folderKey: 'RESTOCK_RECEIPT' }),
  RESTOCK_INVOICE: Object.freeze({ code: 'RST-INV', folderKey: 'RESTOCK_RECEIPT' }),
  CANVASS_QUOTE: Object.freeze({ code: 'CAN-QUOTE', folderKey: 'CANVASS' }),
  CANVASS_PHOTO: Object.freeze({ code: 'CAN-PHOTO', folderKey: 'CANVASS' }),
  DELIVERABLE_RECEIPT: Object.freeze({ code: 'DEL-RCPT', folderKey: 'DELIVERABLE' }),
  DELIVERABLE_DELIVERY_PROOF: Object.freeze({
    code: 'DEL-PROOF',
    folderKey: 'DELIVERABLE',
  }),
  RELEASE_CONFIRMATION_PHOTO: Object.freeze({ code: 'REL-PHOTO', folderKey: 'RELEASE' }),
  LENDING_HANDOFF_PHOTO: Object.freeze({ code: 'LND-OUT', folderKey: 'LENDING' }),
  LENDING_RETURN_PHOTO: Object.freeze({ code: 'LND-RETURN', folderKey: 'LENDING' }),
  OTHER_SUPPORTING_DOCUMENT: Object.freeze({ code: 'OTHER', folderKey: 'ROOT' }),
});

function evidenceError(code, message, details) {
  return Object.assign(new Error(message), { code, ...(details ? { details } : {}) });
}

export function decodeEvidenceBase64(value) {
  const base64 = String(value ?? '').replace(/^data:[^;]+;base64,/u, '');
  if (!base64) throw evidenceError('EMPTY_FILE', 'The uploaded file is empty.');
  try {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  } catch {
    throw evidenceError('INVALID_FILE_DATA', 'The uploaded file data is invalid.');
  }
}

export function matchesEvidenceSignature(bytes, mimeType) {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  }
  if (mimeType === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  if (mimeType === 'application/pdf') {
    return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  }
  return false;
}

export function safeEvidenceToken(value, fallback = 'NA') {
  const result = String(value ?? '')
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60);
  return result || fallback;
}

export async function sha256Hex(bytes, cryptoProvider = globalThis.crypto) {
  const digest = new Uint8Array(await cryptoProvider.subtle.digest('SHA-256', bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function validateEvidenceBytes(
  { bytes, mimeType, expectedSize, expectedSha256 },
  cryptoProvider = globalThis.crypto,
) {
  const normalizedBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  const normalizedMimeType = String(mimeType ?? '')
    .trim()
    .toLowerCase();
  if (!ALLOWED_MIME_TYPES[normalizedMimeType]) {
    throw evidenceError('UNSUPPORTED_FILE_TYPE', 'Allowed files are JPG, PNG, WEBP, and PDF.');
  }
  if (!normalizedBytes.byteLength) throw evidenceError('EMPTY_FILE', 'The uploaded file is empty.');
  if (normalizedBytes.byteLength > MAX_EVIDENCE_BYTES) {
    throw evidenceError('FILE_TOO_LARGE', 'The maximum upload size is 10 MB.', {
      maxBytes: MAX_EVIDENCE_BYTES,
    });
  }
  if (
    expectedSize !== undefined &&
    expectedSize !== null &&
    normalizedBytes.byteLength !== Number(expectedSize)
  ) {
    throw evidenceError(
      'EVIDENCE_SIZE_MISMATCH',
      'The stored file size does not match its protected metadata.',
    );
  }
  if (!matchesEvidenceSignature(normalizedBytes, normalizedMimeType)) {
    throw evidenceError('FILE_SIGNATURE_MISMATCH', 'The file contents do not match the declared file type.');
  }
  const checksum = await sha256Hex(normalizedBytes, cryptoProvider);
  if (expectedSha256 && checksum !== String(expectedSha256).toLowerCase()) {
    throw evidenceError(
      'EVIDENCE_CHECKSUM_MISMATCH',
      'The stored file checksum does not match its protected metadata.',
    );
  }
  return { bytes: normalizedBytes, mimeType: normalizedMimeType, sha256: checksum };
}

export async function prepareEvidenceUpload(
  { evidenceId, command, timestamp },
  cryptoProvider = globalThis.crypto,
) {
  const evidenceType = String(command?.evidenceType ?? '').trim();
  const definition = EVIDENCE_TYPES[evidenceType];
  if (!definition) {
    throw evidenceError('UNSUPPORTED_EVIDENCE_TYPE', 'The evidence type is not supported.');
  }
  const mimeType = String(command?.mimeType ?? '')
    .trim()
    .toLowerCase();
  const extension = ALLOWED_MIME_TYPES[mimeType];
  if (!extension) {
    throw evidenceError('UNSUPPORTED_FILE_TYPE', 'Allowed files are JPG, PNG, WEBP, and PDF.');
  }
  const originalExtension = String(command?.originalFileName ?? '')
    .split('.')
    .at(-1)
    .toLowerCase()
    .replace('jpeg', 'jpg');
  if (originalExtension !== extension) {
    throw evidenceError('MIME_EXTENSION_MISMATCH', 'File extension does not match its MIME type.');
  }
  const validated = await validateEvidenceBytes(
    { bytes: decodeEvidenceBase64(command?.base64 ?? command?.data), mimeType },
    cryptoProvider,
  );
  const relatedEntityId = safeEvidenceToken(command?.relatedEntityId);
  const secondaryId = safeEvidenceToken(
    command?.secondaryId ?? command?.itemId ?? command?.eventItemId ?? command?.requestLineId,
  );
  const stamp = timestamp.replace(/\D/gu, '').slice(0, 14);
  const normalizedFileName =
    `${definition.code}_${relatedEntityId}_${secondaryId}_${stamp}_${safeEvidenceToken(evidenceId)}.${extension}`.slice(
      0,
      180,
    );
  return {
    evidenceId,
    evidenceType,
    timestamp,
    evidenceLabel: `${evidenceType.replaceAll('_', ' ')} | ${relatedEntityId} | ${timestamp}`,
    normalizedFileName,
    mimeType,
    sizeBytes: validated.bytes.byteLength,
    sha256: validated.sha256,
    relatedEntityType: String(command?.relatedEntityType ?? '').trim() || 'SUPPORTING_RECORD',
    relatedEntityId: String(command?.relatedEntityId ?? '').trim(),
    notes: String(command?.notes ?? '')
      .trim()
      .slice(0, 500),
    bytes: validated.bytes,
  };
}

export function governedEvidenceObjectKey(prepared) {
  const timestamp = String(prepared.timestamp ?? new Date().toISOString());
  const [year = '0000', month = '00'] = timestamp.split('T')[0].split('-');
  const type = safeEvidenceToken(prepared.evidenceType, 'OTHER').toLowerCase();
  const extension = ALLOWED_MIME_TYPES[prepared.mimeType] ?? 'bin';
  return [
    'evidence',
    'v1',
    type,
    year,
    month,
    safeEvidenceToken(prepared.evidenceId),
    `${String(prepared.sha256).slice(0, 16)}.${extension}`,
  ].join('/');
}

export function evidenceBackupIdempotencyKey(evidenceId, sha256) {
  return `${safeEvidenceToken(evidenceId)}:${String(sha256 ?? '').toLowerCase()}`;
}

export function evidenceFolderKey(evidenceType) {
  return EVIDENCE_TYPES[evidenceType]?.folderKey ?? '';
}

export function encodeEvidenceText(value) {
  return encoder.encode(String(value));
}
