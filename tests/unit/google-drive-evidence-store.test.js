import { describe, expect, it, vi } from 'vitest';
import { createGoogleDriveEvidenceStore } from '../../src/server/evidence/google-drive-store.js';

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

function pngFixtureBase64() {
  const bytes = new Uint8Array([
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
  return btoa(String.fromCharCode(...bytes));
}

describe('Google Drive evidence store', () => {
  it('prepares and uploads release evidence only to the configured private folder', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).includes('oauth2.googleapis.com')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ id: 'private-drive-file-reference' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const store = createGoogleDriveEvidenceStore({
      folderIds: { RELEASE: 'private-release-folder' },
      serviceAccountEmail: 'evidence-reader@example.invalid',
      serviceAccountPrivateKey: 'AQ==',
      fetchImpl,
      cryptoProvider: cryptoFixture(),
      clock: { now: () => Date.parse('2026-07-26T08:15:30.000Z') },
    });

    expect(store.status('RELEASE_CONFIRMATION_PHOTO')).toEqual({ configured: true });
    expect(store.status('RESTOCK_RECEIPT')).toEqual({ configured: false });
    const prepared = await store.prepare({
      evidenceId: 'EVD-SYNTHETIC',
      command: {
        evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        originalFileName: 'recipient-confirmation.png',
        mimeType: 'image/png',
        base64: pngFixtureBase64(),
        relatedEntityType: 'RELEASE_REQUEST',
        relatedEntityId: 'REQ-SYNTHETIC',
        secondaryId: 'LINE-SYNTHETIC',
      },
    });
    expect(prepared).toMatchObject({
      evidenceId: 'EVD-SYNTHETIC',
      evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
      mimeType: 'image/png',
      sizeBytes: 23,
      relatedEntityType: 'RELEASE_REQUEST',
      relatedEntityId: 'REQ-SYNTHETIC',
      folderId: 'private-release-folder',
    });
    expect(prepared.normalizedFileName).toMatch(
      /^REL-PHOTO_REQ-SYNTHETIC_LINE-SYNTHETIC_20260726081530_EVD-SYNTHETIC\.png$/u,
    );

    await expect(store.upload(prepared)).resolves.toEqual({
      privateStorageReference: 'private-drive-file-reference',
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('https://oauth2.googleapis.com/token');
    expect(String(calls[0].options.body)).toContain(
      'urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer',
    );
    expect(calls[1].url).toContain('upload/drive/v3/files');
    expect(calls[1].options.headers.authorization).toBe('Bearer synthetic-access-token');
    const uploadBody = new TextDecoder().decode(calls[1].options.body);
    expect(uploadBody).toContain('private-release-folder');
    expect(uploadBody).toContain('REL-PHOTO_REQ-SYNTHETIC_LINE-SYNTHETIC');
    expect(uploadBody).toContain('synthetic-image');
  });

  it('fails closed for an unsupported type, mismatched extension, signature, or absent folder', async () => {
    const store = createGoogleDriveEvidenceStore({
      folderIds: {},
      serviceAccountEmail: 'evidence-reader@example.invalid',
      serviceAccountPrivateKey: 'AQ==',
      cryptoProvider: cryptoFixture(),
    });
    await expect(
      store.prepare({
        evidenceId: 'EVD-1',
        command: {
          evidenceType: 'UNKNOWN',
          originalFileName: 'proof.png',
          mimeType: 'image/png',
          base64: btoa('proof'),
        },
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_EVIDENCE_TYPE' });
    await expect(
      store.prepare({
        evidenceId: 'EVD-2',
        command: {
          evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
          originalFileName: 'proof.pdf',
          mimeType: 'image/png',
          base64: btoa('proof'),
        },
      }),
    ).rejects.toMatchObject({ code: 'MIME_EXTENSION_MISMATCH' });
    await expect(
      store.prepare({
        evidenceId: 'EVD-3',
        command: {
          evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
          originalFileName: 'proof.png',
          mimeType: 'image/png',
          base64: btoa('proof'),
        },
      }),
    ).rejects.toMatchObject({ code: 'FILE_SIGNATURE_MISMATCH' });
    await expect(
      store.prepare({
        evidenceId: 'EVD-4',
        command: {
          evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
          originalFileName: 'proof.png',
          mimeType: 'image/png',
          base64: pngFixtureBase64(),
        },
      }),
    ).rejects.toMatchObject({ code: 'EVIDENCE_STORE_NOT_CONFIGURED' });
  });
});
