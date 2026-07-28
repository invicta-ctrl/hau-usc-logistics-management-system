import { describe, expect, it, vi } from 'vitest';
import { createGoogleDriveEvidenceStore } from '../../src/server/evidence/google-drive-store.js';

const SHA256 = '07'.repeat(32);

function cryptoFixture() {
  return {
    randomUUID: () => 'synthetic-boundary',
    subtle: {
      digest: vi.fn(async () => new Uint8Array(32).fill(7).buffer),
      importKey: vi.fn(async () => ({ type: 'private' })),
      sign: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
    },
  };
}

function pngFixture() {
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('synthetic-image'),
  ]);
}

function metadata(id = 'private-drive-file-reference') {
  return {
    id,
    name: 'REL-PHOTO_SYNTHETIC.png',
    mimeType: 'image/png',
    size: String(pngFixture().byteLength),
    md5Checksum: 'synthetic-md5',
    sha256Checksum: SHA256,
    parents: ['private-release-folder'],
    appProperties: {
      hauUscEvidenceVersion: `EVD-SYNTHETIC:${SHA256}`,
      hauUscEvidenceId: 'EVD-SYNTHETIC',
    },
    shared: false,
    trashed: false,
  };
}

function backupInput(overrides = {}) {
  return {
    evidenceId: 'EVD-SYNTHETIC',
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    normalizedFileName: 'REL-PHOTO_SYNTHETIC.png',
    mimeType: 'image/png',
    sizeBytes: pngFixture().byteLength,
    sha256: SHA256,
    bytes: pngFixture(),
    idempotencyKey: `EVD-SYNTHETIC:${SHA256}`,
    ...overrides,
  };
}

function store(fetchImpl, cryptoProvider = cryptoFixture()) {
  return createGoogleDriveEvidenceStore({
    folderIds: { RELEASE: 'private-release-folder' },
    oauthClientId: 'synthetic-client-id',
    oauthClientSecret: 'synthetic-client-secret',
    oauthRefreshToken: 'synthetic-refresh-token',
    fetchImpl,
    cryptoProvider,
    clock: { now: () => Date.parse('2026-07-26T08:15:30.000Z') },
  });
}

describe('Google Drive evidence backup', () => {
  it('creates one private verified copy and reuses it after duplicate delivery', async () => {
    const calls = [];
    let uploaded = false;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const target = String(url);
      calls.push({ url: target, options });
      if (target === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'synthetic-oauth-access-token' });
      }
      if (target.includes('/upload/drive/v3/files')) {
        uploaded = true;
        return Response.json({ id: 'private-drive-file-reference' });
      }
      if (target.includes('/drive/v3/files/private-drive-file-reference')) {
        return Response.json(metadata());
      }
      if (target.includes('/drive/v3/files?')) {
        return Response.json({ files: uploaded ? [metadata()] : [] });
      }
      throw new Error(`Unexpected URL: ${target}`);
    });
    const evidenceBackup = store(fetchImpl);

    expect(evidenceBackup.scope).toBe('https://www.googleapis.com/auth/drive.file');
    expect(evidenceBackup.status('RELEASE_CONFIRMATION_PHOTO')).toEqual({ configured: true });
    expect(evidenceBackup.status('RESTOCK_RECEIPT')).toEqual({ configured: false });
    await expect(evidenceBackup.backup(backupInput())).resolves.toMatchObject({
      driveFileId: 'private-drive-file-reference',
      sizeBytes: pngFixture().byteLength,
      providerChecksum: SHA256,
      providerChecksumType: 'SHA256',
    });
    await expect(evidenceBackup.backup(backupInput())).resolves.toMatchObject({
      driveFileId: 'private-drive-file-reference',
    });

    const uploadCalls = calls.filter((entry) => entry.url.includes('/upload/drive/v3/files'));
    expect(uploadCalls).toHaveLength(1);
    const uploadBody = new TextDecoder().decode(uploadCalls[0].options.body);
    expect(uploadBody).toContain('private-release-folder');
    expect(uploadBody).toContain('hauUscEvidenceVersion');
    expect(uploadBody).toContain(`EVD-SYNTHETIC:${SHA256}`);
    expect(uploadBody).not.toContain('"writersCanShare"');
    expect(calls.some((entry) => entry.url.includes('/permissions'))).toBe(false);
    const lookup = calls.find((entry) => entry.url.includes('/drive/v3/files?'));
    const lookupQuery = new URL(lookup.url).searchParams.get('q');
    expect(lookupQuery).toContain("appProperties has { key='hauUscEvidenceVersion'");
    expect(lookupQuery).toContain("'private-release-folder' in parents");
    expect(lookupQuery).toContain("visibility = 'limited'");
  });

  it('downloads a verified recovery copy without accepting a caller-supplied folder or file', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      const target = String(url);
      calls.push(target);
      if (target === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'synthetic-oauth-access-token' });
      }
      if (target.includes('alt=media')) {
        return new Response(pngFixture(), { headers: { 'content-type': 'image/png' } });
      }
      if (target.includes('/drive/v3/files/private-drive-file-reference')) {
        return Response.json(metadata());
      }
      throw new Error(`Unexpected URL: ${target}`);
    });
    const evidenceBackup = store(fetchImpl);

    await expect(
      evidenceBackup.download(backupInput({ driveFileId: 'private-drive-file-reference', bytes: undefined })),
    ).resolves.toMatchObject({ sha256: SHA256, mimeType: 'image/png' });
    expect(calls.some((url) => url.includes('private-drive-file-reference?alt=media'))).toBe(true);
  });

  it('uses the narrow Drive scope through the service-account fallback when OAuth is absent', async () => {
    const cryptoProvider = cryptoFixture();
    let tokenRequest;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const target = String(url);
      if (target === 'https://oauth2.googleapis.com/token') {
        tokenRequest = options;
        return Response.json({ access_token: 'synthetic-service-account-token' });
      }
      if (target.includes('/drive/v3/files?')) {
        return Response.json({ files: [metadata()] });
      }
      throw new Error(`Unexpected URL: ${target}`);
    });
    const evidenceBackup = createGoogleDriveEvidenceStore({
      folderIds: { RELEASE: 'private-release-folder' },
      serviceAccountEmail: 'synthetic-service-account@example.invalid',
      serviceAccountPrivateKey: '-----BEGIN PRIVATE KEY-----\nAQID\n-----END PRIVATE KEY-----',
      fetchImpl,
      cryptoProvider,
      clock: { now: () => Date.parse('2026-07-26T08:15:30.000Z') },
    });

    await expect(evidenceBackup.backup(backupInput())).resolves.toMatchObject({
      driveFileId: 'private-drive-file-reference',
    });
    expect(cryptoProvider.subtle.importKey).toHaveBeenCalledWith(
      'pkcs8',
      new Uint8Array([1, 2, 3]),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    expect(cryptoProvider.subtle.sign).toHaveBeenCalled();
    expect(tokenRequest.body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const assertionParts = tokenRequest.body.get('assertion').split('.');
    const claim = JSON.parse(atob(assertionParts[1].replaceAll('-', '+').replaceAll('_', '/')));
    expect(claim.scope).toBe('https://www.googleapis.com/auth/drive.file');
    expect(tokenRequest.body.has('client_secret')).toBe(false);
  });

  it('fails closed for a shared, mismatched, duplicate, or unconfigured backup', async () => {
    const sharedStore = store(async (url) => {
      const target = String(url);
      if (target === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'synthetic-oauth-access-token' });
      }
      if (target.includes('/drive/v3/files?')) {
        return Response.json({ files: [{ ...metadata(), shared: true }] });
      }
      throw new Error(`Unexpected URL: ${target}`);
    });
    await expect(sharedStore.backup(backupInput())).rejects.toMatchObject({
      code: 'EVIDENCE_BACKUP_VERIFICATION_FAILED',
    });

    const duplicateStore = store(async (url) => {
      const target = String(url);
      if (target === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'synthetic-oauth-access-token' });
      }
      return Response.json({ files: [metadata('one'), metadata('two')] });
    });
    await expect(duplicateStore.backup(backupInput())).rejects.toMatchObject({
      code: 'EVIDENCE_BACKUP_DUPLICATE_CONFLICT',
    });

    const providerFailureStore = store(async (url) => {
      const target = String(url);
      if (target === 'https://oauth2.googleapis.com/token') {
        return Response.json({ access_token: 'synthetic-oauth-access-token' });
      }
      if (target.includes('/upload/drive/v3/files')) {
        return Response.json({}, { status: 403 });
      }
      if (target.includes('/drive/v3/files?')) {
        return Response.json({ files: [] });
      }
      throw new Error(`Unexpected URL: ${target}`);
    });
    await expect(providerFailureStore.backup(backupInput())).rejects.toMatchObject({
      code: 'EVIDENCE_BACKUP_UPLOAD_FAILED_HTTP_403',
      retryable: false,
    });

    const unconfigured = createGoogleDriveEvidenceStore({
      folderIds: {},
      fetchImpl: vi.fn(),
      cryptoProvider: cryptoFixture(),
    });
    await expect(unconfigured.backup(backupInput())).rejects.toMatchObject({
      code: 'EVIDENCE_BACKUP_NOT_CONFIGURED',
      retryable: true,
    });
  });
});
