const encoder = new TextEncoder();
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
});
const EVIDENCE_TYPES = Object.freeze({
  RESTOCK_RECEIPT: Object.freeze({ code: 'RST-RCPT', folderKey: 'RESTOCK_RECEIPT' }),
  RESTOCK_INVOICE: Object.freeze({ code: 'RST-INV', folderKey: 'RESTOCK_RECEIPT' }),
  CANVASS_QUOTE: Object.freeze({ code: 'CAN-QUOTE', folderKey: 'CANVASS' }),
  CANVASS_PHOTO: Object.freeze({ code: 'CAN-PHOTO', folderKey: 'CANVASS' }),
  DELIVERABLE_RECEIPT: Object.freeze({ code: 'DEL-RCPT', folderKey: 'DELIVERABLE' }),
  DELIVERABLE_DELIVERY_PROOF: Object.freeze({ code: 'DEL-PROOF', folderKey: 'DELIVERABLE' }),
  RELEASE_CONFIRMATION_PHOTO: Object.freeze({ code: 'REL-PHOTO', folderKey: 'RELEASE' }),
  LENDING_HANDOFF_PHOTO: Object.freeze({ code: 'LND-OUT', folderKey: 'LENDING' }),
  LENDING_RETURN_PHOTO: Object.freeze({ code: 'LND-RETURN', folderKey: 'LENDING' }),
  OTHER_SUPPORTING_DOCUMENT: Object.freeze({ code: 'OTHER', folderKey: 'ROOT' }),
});

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function pemBytes(value) {
  const body = String(value ?? '')
    .replaceAll('\\n', '\n')
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/gu, '');
  if (!body) throw Object.assign(new Error('Google evidence private key is not configured.'), {
    code: 'EVIDENCE_STORE_NOT_CONFIGURED',
  });
  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

async function serviceAccountToken({ email, privateKey, fetchImpl, cryptoProvider, now }) {
  const issuedAt = Math.floor(now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        iss: email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        iat: issuedAt,
        exp: issuedAt + 3600,
      }),
    ),
  );
  const key = await cryptoProvider.subtle.importKey(
    'pkcs8',
    pemBytes(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await cryptoProvider.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(`${header}.${claim}`),
  );
  const assertion = `${header}.${claim}.${bytesToBase64Url(new Uint8Array(signature))}`;
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') {
    throw Object.assign(new Error('The approved private evidence store could not be authorized.'), {
      code: 'EVIDENCE_STORE_AUTHORIZATION_FAILED',
    });
  }
  return payload.access_token;
}

function decodeBase64(value) {
  const base64 = String(value ?? '').replace(/^data:[^;]+;base64,/u, '');
  if (!base64) throw Object.assign(new Error('The uploaded file is empty.'), {
    code: 'EMPTY_FILE',
  });
  try {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  } catch {
    throw Object.assign(new Error('The uploaded file data is invalid.'), {
      code: 'INVALID_FILE_DATA',
    });
  }
}

function matchesMimeSignature(bytes, mimeType) {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
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

function safeToken(value, fallback = 'NA') {
  const result = String(value ?? '')
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 60);
  return result || fallback;
}

function concatenate(...chunks) {
  const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return result;
}

async function sha256Hex(bytes, cryptoProvider) {
  const digest = new Uint8Array(await cryptoProvider.subtle.digest('SHA-256', bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function multipartBody({ metadata, bytes, mimeType, boundary }) {
  return concatenate(
    encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ),
    bytes,
    encoder.encode(`\r\n--${boundary}--`),
  );
}

export function createGoogleDriveEvidenceStore({
  folderIds = {},
  serviceAccountEmail,
  serviceAccountPrivateKey,
  fetchImpl = globalThis.fetch,
  cryptoProvider = globalThis.crypto,
  clock = { now: () => Date.now() },
} = {}) {
  const configuration = Object.freeze({
    folderIds: Object.freeze(
      Object.fromEntries(
        Object.entries(folderIds).map(([key, value]) => [key, String(value ?? '').trim()]),
      ),
    ),
    serviceAccountEmail: String(serviceAccountEmail ?? '').trim(),
    serviceAccountPrivateKey: String(serviceAccountPrivateKey ?? ''),
  });

  const folderFor = (evidenceType) => {
    const definition = EVIDENCE_TYPES[evidenceType];
    return definition ? configuration.folderIds[definition.folderKey] ?? '' : '';
  };

  return Object.freeze({
    status(evidenceType) {
      return {
        configured: Boolean(
          EVIDENCE_TYPES[evidenceType] &&
            folderFor(evidenceType) &&
            configuration.serviceAccountEmail &&
            configuration.serviceAccountPrivateKey,
        ),
      };
    },

    async prepare({ evidenceId, command, timestamp = new Date(clock.now()).toISOString() }) {
      const evidenceType = String(command?.evidenceType ?? '').trim();
      const definition = EVIDENCE_TYPES[evidenceType];
      if (!definition) {
        throw Object.assign(new Error('The evidence type is not supported.'), {
          code: 'UNSUPPORTED_EVIDENCE_TYPE',
        });
      }
      const mimeType = String(command?.mimeType ?? '').trim().toLowerCase();
      const extension = ALLOWED_MIME_TYPES[mimeType];
      if (!extension) {
        throw Object.assign(new Error('Allowed files are JPG, PNG, WEBP, and PDF.'), {
          code: 'UNSUPPORTED_FILE_TYPE',
        });
      }
      const originalExtension = String(command?.originalFileName ?? '')
        .split('.')
        .at(-1)
        .toLowerCase()
        .replace('jpeg', 'jpg');
      if (originalExtension !== extension) {
        throw Object.assign(new Error('File extension does not match its MIME type.'), {
          code: 'MIME_EXTENSION_MISMATCH',
        });
      }
      const bytes = decodeBase64(command?.base64 ?? command?.data);
      if (!bytes.byteLength) {
        throw Object.assign(new Error('The uploaded file is empty.'), { code: 'EMPTY_FILE' });
      }
      if (bytes.byteLength > MAX_EVIDENCE_BYTES) {
        throw Object.assign(new Error('The maximum upload size is 10 MB.'), {
          code: 'FILE_TOO_LARGE',
          details: { maxBytes: MAX_EVIDENCE_BYTES },
        });
      }
      if (!matchesMimeSignature(bytes, mimeType)) {
        throw Object.assign(new Error('The file contents do not match the declared file type.'), {
          code: 'FILE_SIGNATURE_MISMATCH',
        });
      }
      const folderId = folderFor(evidenceType);
      if (
        !folderId ||
        !configuration.serviceAccountEmail ||
        !configuration.serviceAccountPrivateKey
      ) {
        throw Object.assign(new Error('The approved private evidence store is not configured.'), {
          code: 'EVIDENCE_STORE_NOT_CONFIGURED',
        });
      }
      const relatedEntityId = safeToken(command?.relatedEntityId);
      const secondaryId = safeToken(
        command?.secondaryId ?? command?.itemId ?? command?.eventItemId ?? command?.requestLineId,
      );
      const stamp = timestamp.replace(/\D/gu, '').slice(0, 14);
      const normalizedFileName =
        `${definition.code}_${relatedEntityId}_${secondaryId}_${stamp}_${safeToken(evidenceId)}.${extension}`.slice(
          0,
          180,
        );
      return {
        evidenceId,
        evidenceType,
        evidenceLabel: `${evidenceType.replaceAll('_', ' ')} | ${relatedEntityId} | ${timestamp}`,
        normalizedFileName,
        mimeType,
        sizeBytes: bytes.byteLength,
        sha256: await sha256Hex(bytes, cryptoProvider),
        relatedEntityType: String(command?.relatedEntityType ?? '').trim() || 'SUPPORTING_RECORD',
        relatedEntityId: String(command?.relatedEntityId ?? '').trim(),
        notes: String(command?.notes ?? '').trim().slice(0, 500),
        folderId,
        bytes,
      };
    },

    async upload(prepared) {
      const accessToken = await serviceAccountToken({
        email: configuration.serviceAccountEmail,
        privateKey: configuration.serviceAccountPrivateKey,
        fetchImpl,
        cryptoProvider,
        now: () => clock.now(),
      });
      const boundary = `hau-usc-${cryptoProvider.randomUUID?.() ?? String(clock.now())}`;
      const response = await fetchImpl(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody({
            metadata: {
              name: prepared.normalizedFileName,
              parents: [prepared.folderId],
              description: prepared.evidenceLabel,
            },
            bytes: prepared.bytes,
            mimeType: prepared.mimeType,
            boundary,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.id !== 'string' || !payload.id) {
        throw Object.assign(new Error('Evidence could not be uploaded. You may retry safely.'), {
          code: 'EVIDENCE_STORE_UPLOAD_FAILED',
        });
      }
      return { privateStorageReference: payload.id };
    },

    async remove(privateStorageReference) {
      if (!privateStorageReference) return false;
      const accessToken = await serviceAccountToken({
        email: configuration.serviceAccountEmail,
        privateKey: configuration.serviceAccountPrivateKey,
        fetchImpl,
        cryptoProvider,
        now: () => clock.now(),
      });
      const response = await fetchImpl(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(privateStorageReference)}`,
        { method: 'DELETE', headers: { authorization: `Bearer ${accessToken}` } },
      );
      return response.ok || response.status === 404;
    },
  });
}
