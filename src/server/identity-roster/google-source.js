const encoder = new TextEncoder();
const NORMALIZED_ROSTER_HEADERS = Object.freeze([
  'Student_ID',
  'Institutional_Email',
  'Display_Name',
  'Verification_Result',
  'Active',
  'Review_Notes',
]);
const USC_DIRECTORY_FIELDS = Object.freeze({
  displayName: 'Full Name',
  studentId: 'Student Number',
  institutionalEmail: 'Working Email',
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
  if (!body) throw new Error('Google roster private key is not configured.');
  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

async function serviceAccountToken({ email, privateKey, fetchImpl, cryptoProvider, now }) {
  const issuedAt = Math.floor(now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        iss: email,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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
    throw Object.assign(new Error('The approved private roster source could not be authorized.'), {
      code: 'ROSTER_SOURCE_AUTHORIZATION_FAILED',
    });
  }
  return payload.access_token;
}

function normalizeRosterValues(headers, rows) {
  const normalizedHeaders = headers.map((value) => String(value ?? '').trim());
  if (
    normalizedHeaders.length === NORMALIZED_ROSTER_HEADERS.length &&
    normalizedHeaders.every((header, index) => header === NORMALIZED_ROSTER_HEADERS[index])
  ) {
    return { headers, rows, fingerprintSource: { headers, rows } };
  }

  const indexes = Object.fromEntries(
    Object.entries(USC_DIRECTORY_FIELDS).map(([field, header]) => [field, normalizedHeaders.indexOf(header)]),
  );
  if (Object.values(indexes).some((index) => index < 0)) {
    return { headers, rows, fingerprintSource: { headers, rows } };
  }

  return {
    headers: [...NORMALIZED_ROSTER_HEADERS],
    rows: rows.map((row) => [
      row?.[indexes.studentId] ?? '',
      row?.[indexes.institutionalEmail] ?? '',
      row?.[indexes.displayName] ?? '',
      'VERIFIED',
      true,
      '',
    ]),
    fingerprintSource: { headers, rows },
  };
}

export function createGoogleSheetsRosterSource({
  spreadsheetId,
  range,
  serviceAccountEmail,
  serviceAccountPrivateKey,
  fetchImpl = globalThis.fetch,
  cryptoProvider = globalThis.crypto,
  clock = { now: () => Date.now() },
} = {}) {
  const configuration = Object.freeze({
    spreadsheetId: String(spreadsheetId ?? '').trim(),
    range: String(range ?? '').trim(),
    serviceAccountEmail: String(serviceAccountEmail ?? '').trim(),
    serviceAccountPrivateKey: String(serviceAccountPrivateKey ?? ''),
  });
  const placeholder = /^(?:REPLACE(?:[_\s-].*)?|TBD|TODO|UNKNOWN|<[^>]+>)$/iu;
  const missing = () =>
    Object.entries(configuration)
      .filter(([, value]) => !value || placeholder.test(value))
      .map(([key]) => key);

  return Object.freeze({
    status() {
      const missingValues = missing();
      return {
        configured: missingValues.length === 0,
        missingConfiguration: missingValues.map(
          (key) =>
            ({
              spreadsheetId: 'GOOGLE_ROSTER_SPREADSHEET_ID',
              range: 'GOOGLE_ROSTER_RANGE',
              serviceAccountEmail: 'GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL',
              serviceAccountPrivateKey: 'GOOGLE_ROSTER_PRIVATE_KEY',
            })[key],
        ),
      };
    },

    async read() {
      if (missing().length) {
        throw Object.assign(new Error('The approved private roster source is not configured.'), {
          code: 'ROSTER_SOURCE_NOT_CONFIGURED',
        });
      }
      const token = await serviceAccountToken({
        email: configuration.serviceAccountEmail,
        privateKey: configuration.serviceAccountPrivateKey,
        fetchImpl,
        cryptoProvider,
        now: () => clock.now(),
      });
      const endpoint =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(configuration.spreadsheetId)}` +
        `/values/${encodeURIComponent(configuration.range)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;
      const response = await fetchImpl(endpoint, {
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.values)) {
        throw Object.assign(new Error('The approved private roster source could not be read.'), {
          code: 'ROSTER_SOURCE_UNAVAILABLE',
        });
      }
      const [headers = [], ...rows] = payload.values;
      return normalizeRosterValues(headers, rows);
    },
  });
}
