import {
  EVIDENCE_TYPES,
  encodeEvidenceText,
  evidenceFolderKey,
  validateEvidenceBytes,
} from './evidence-contract.js';

const encoder = new TextEncoder();
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_FIELDS =
  'id,name,mimeType,size,md5Checksum,sha1Checksum,sha256Checksum,parents,appProperties,shared,trashed';

function backupError(code, message, retryable = false) {
  return Object.assign(new Error(message), { code, retryable });
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function pemBytes(value) {
  const body = String(value ?? '')
    .replaceAll('\\n', '\n')
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/gu, '');
  if (!body) {
    throw backupError(
      'EVIDENCE_BACKUP_NOT_CONFIGURED',
      'The private Google Drive backup credential is not configured.',
      true,
    );
  }
  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

async function serviceAccountToken({ email, privateKey, fetchImpl, cryptoProvider, now }) {
  const issuedAt = Math.floor(now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        iss: email,
        scope: DRIVE_SCOPE,
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
    throw backupError(
      'EVIDENCE_BACKUP_AUTHORIZATION_FAILED',
      'The private Google Drive backup could not be authorized.',
      response.status === 408 || response.status === 429 || response.status >= 500,
    );
  }
  return payload.access_token;
}

async function oauthAccessToken({ clientId, clientSecret, refreshToken, fetchImpl }) {
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') {
    throw backupError(
      'EVIDENCE_BACKUP_AUTHORIZATION_FAILED',
      'The private Google Drive backup could not be authorized.',
      response.status === 408 || response.status === 429 || response.status >= 500,
    );
  }
  return payload.access_token;
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

function multipartBody({ metadata, bytes, mimeType, boundary }) {
  return concatenate(
    encodeEvidenceText(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ),
    bytes,
    encodeEvidenceText(`\r\n--${boundary}--`),
  );
}

function escapeDriveQuery(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function retryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function driveJson(fetchImpl, url, options, failureCode) {
  const response = await fetchImpl(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw backupError(
      failureCode,
      'The private Google Drive backup operation did not complete.',
      retryableStatus(response.status),
    );
  }
  return payload;
}

function verifyDriveFile(file, expected) {
  if (
    !file ||
    typeof file.id !== 'string' ||
    Number(file.size) !== Number(expected.sizeBytes) ||
    file.mimeType !== expected.mimeType ||
    !Array.isArray(file.parents) ||
    !file.parents.includes(expected.folderId) ||
    file.appProperties?.hauUscEvidenceVersion !== expected.idempotencyKey ||
    file.trashed === true ||
    file.shared === true
  ) {
    throw backupError(
      'EVIDENCE_BACKUP_VERIFICATION_FAILED',
      'The private Google Drive backup could not be verified.',
    );
  }
  if (
    typeof file.sha256Checksum === 'string' &&
    file.sha256Checksum &&
    file.sha256Checksum.toLowerCase() !== expected.sha256
  ) {
    throw backupError(
      'EVIDENCE_BACKUP_CHECKSUM_MISMATCH',
      'The private Google Drive backup checksum did not match the primary object.',
    );
  }
  return {
    driveFileId: file.id,
    sizeBytes: Number(file.size),
    providerChecksum: String(file.sha256Checksum ?? file.md5Checksum ?? ''),
    providerChecksumType: file.sha256Checksum ? 'SHA256' : file.md5Checksum ? 'MD5' : 'UNAVAILABLE',
  };
}

export function createGoogleDriveEvidenceStore({
  folderIds = {},
  oauthClientId,
  oauthClientSecret,
  oauthRefreshToken: refreshToken,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  fetchImpl = globalThis.fetch,
  cryptoProvider = globalThis.crypto,
  clock = { now: () => Date.now() },
} = {}) {
  const configuration = Object.freeze({
    folderIds: Object.freeze(
      Object.fromEntries(Object.entries(folderIds).map(([key, value]) => [key, String(value ?? '').trim()])),
    ),
    oauthClientId: String(oauthClientId ?? '').trim(),
    oauthClientSecret: String(oauthClientSecret ?? ''),
    oauthRefreshToken: String(refreshToken ?? ''),
    serviceAccountEmail: String(serviceAccountEmail ?? '').trim(),
    serviceAccountPrivateKey: String(serviceAccountPrivateKey ?? ''),
  });
  const hasOAuthConfiguration = Boolean(
    configuration.oauthClientId && configuration.oauthClientSecret && configuration.oauthRefreshToken,
  );
  const hasServiceAccountConfiguration = Boolean(
    configuration.serviceAccountEmail && configuration.serviceAccountPrivateKey,
  );
  const configuredCredentials = hasOAuthConfiguration || hasServiceAccountConfiguration;
  const folderFor = (evidenceType) => configuration.folderIds[evidenceFolderKey(evidenceType)] ?? '';
  const accessToken = () =>
    hasOAuthConfiguration
      ? oauthAccessToken({
          clientId: configuration.oauthClientId,
          clientSecret: configuration.oauthClientSecret,
          refreshToken: configuration.oauthRefreshToken,
          fetchImpl,
        })
      : serviceAccountToken({
          email: configuration.serviceAccountEmail,
          privateKey: configuration.serviceAccountPrivateKey,
          fetchImpl,
          cryptoProvider,
          now: () => clock.now(),
        });

  async function metadata(fileId, providerAccessToken) {
    const query = new URLSearchParams({ fields: DRIVE_FILE_FIELDS });
    return driveJson(
      fetchImpl,
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${query}`,
      { headers: { authorization: `Bearer ${providerAccessToken}` } },
      'EVIDENCE_BACKUP_VERIFICATION_FAILED',
    );
  }

  async function exactMatches(expected, providerAccessToken) {
    const q = [
      `'${escapeDriveQuery(expected.folderId)}' in parents`,
      `appProperties has { key='hauUscEvidenceVersion' and value='${escapeDriveQuery(expected.idempotencyKey)}' }`,
      'trashed = false',
      "visibility = 'limited'",
    ].join(' and ');
    const query = new URLSearchParams({
      q,
      spaces: 'drive',
      pageSize: '2',
      fields: `files(${DRIVE_FILE_FIELDS})`,
    });
    const payload = await driveJson(
      fetchImpl,
      `https://www.googleapis.com/drive/v3/files?${query}`,
      { headers: { authorization: `Bearer ${providerAccessToken}` } },
      'EVIDENCE_BACKUP_LOOKUP_FAILED',
    );
    return Array.isArray(payload.files) ? payload.files : [];
  }

  return Object.freeze({
    scope: DRIVE_SCOPE,

    status(evidenceType) {
      return {
        configured: Boolean(EVIDENCE_TYPES[evidenceType] && folderFor(evidenceType) && configuredCredentials),
      };
    },

    async backup({
      evidenceId,
      evidenceType,
      normalizedFileName,
      mimeType,
      sizeBytes,
      sha256,
      bytes,
      idempotencyKey,
      existingDriveFileId,
    }) {
      const folderId = folderFor(evidenceType);
      if (!folderId || !configuredCredentials) {
        throw backupError(
          'EVIDENCE_BACKUP_NOT_CONFIGURED',
          'The private Google Drive backup is not configured.',
          true,
        );
      }
      const validated = await validateEvidenceBytes(
        { bytes, mimeType, expectedSize: sizeBytes, expectedSha256: sha256 },
        cryptoProvider,
      );
      const expected = {
        evidenceId,
        folderId,
        idempotencyKey,
        mimeType,
        sha256: validated.sha256,
        sizeBytes: validated.bytes.byteLength,
      };
      const providerAccessToken = await accessToken();
      if (existingDriveFileId) {
        return verifyDriveFile(await metadata(existingDriveFileId, providerAccessToken), expected);
      }
      const matches = await exactMatches(expected, providerAccessToken);
      if (matches.length > 1) {
        throw backupError(
          'EVIDENCE_BACKUP_DUPLICATE_CONFLICT',
          'Multiple backup copies require owner reconciliation.',
        );
      }
      if (matches.length === 1) return verifyDriveFile(matches[0], expected);

      const boundary = `hau-usc-${cryptoProvider.randomUUID?.() ?? String(clock.now())}`;
      const query = new URLSearchParams({
        uploadType: 'multipart',
        fields: DRIVE_FILE_FIELDS,
      });
      const uploaded = await driveJson(
        fetchImpl,
        `https://www.googleapis.com/upload/drive/v3/files?${query}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${providerAccessToken}`,
            'content-type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody({
            metadata: {
              name: normalizedFileName,
              mimeType,
              parents: [folderId],
              description: `HAU-USC governed evidence backup ${evidenceId}`,
              appProperties: {
                hauUscEvidenceVersion: idempotencyKey,
                hauUscEvidenceId: evidenceId,
              },
              copyRequiresWriterPermission: true,
            },
            bytes: validated.bytes,
            mimeType,
            boundary,
          }),
        },
        'EVIDENCE_BACKUP_UPLOAD_FAILED',
      );
      const file = await metadata(uploaded.id, providerAccessToken);
      return verifyDriveFile(file, expected);
    },

    async download({ driveFileId, evidenceId, evidenceType, mimeType, sizeBytes, sha256, idempotencyKey }) {
      const folderId = folderFor(evidenceType);
      if (!folderId || !configuredCredentials || !driveFileId) {
        throw backupError(
          'EVIDENCE_BACKUP_NOT_AVAILABLE',
          'The private Google Drive recovery copy is not available.',
        );
      }
      const providerAccessToken = await accessToken();
      const expected = {
        evidenceId,
        folderId,
        idempotencyKey,
        mimeType,
        sha256,
        sizeBytes,
      };
      verifyDriveFile(await metadata(driveFileId, providerAccessToken), expected);
      const response = await fetchImpl(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`,
        { headers: { authorization: `Bearer ${providerAccessToken}` } },
      );
      if (!response.ok) {
        throw backupError(
          'EVIDENCE_BACKUP_DOWNLOAD_FAILED',
          'The private Google Drive recovery copy could not be read.',
          retryableStatus(response.status),
        );
      }
      return validateEvidenceBytes(
        {
          bytes: new Uint8Array(await response.arrayBuffer()),
          mimeType,
          expectedSize: sizeBytes,
          expectedSha256: sha256,
        },
        cryptoProvider,
      );
    },
  });
}
