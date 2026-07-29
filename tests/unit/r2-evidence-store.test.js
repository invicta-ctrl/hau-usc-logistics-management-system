import { describe, expect, it, vi } from 'vitest';
import { createR2EvidenceStore } from '../../src/server/evidence/r2-evidence-store.js';

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
    ...new TextEncoder().encode('r2-primary'),
  ]);
}

function base64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function bucketFixture() {
  const objects = new Map();
  return {
    objects,
    put: vi.fn(async (key, bytes, options) => {
      if (options.onlyIf?.etagDoesNotMatch === '*' && objects.has(key)) return null;
      const value = {
        key,
        bytes: new Uint8Array(bytes),
        size: bytes.byteLength,
        etag: `etag-${objects.size + 1}`,
        version: `version-${objects.size + 1}`,
        httpMetadata: options.httpMetadata,
        customMetadata: options.customMetadata,
      };
      objects.set(key, value);
      return value;
    }),
    head: vi.fn(async (key) => objects.get(key) ?? null),
    get: vi.fn(async (key) => {
      const value = objects.get(key);
      return value ? { ...value, body: value.bytes } : null;
    }),
    delete: vi.fn(async (key) => {
      objects.delete(key);
    }),
  };
}

async function prepared(store) {
  return store.prepare({
    evidenceId: 'EVD-R2-SYNTHETIC',
    timestamp: '2026-07-26T09:10:11.000Z',
    command: {
      evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
      originalFileName: 'confirmation.png',
      mimeType: 'image/png',
      base64: base64(pngFixture()),
      relatedEntityType: 'RELEASE',
      relatedEntityId: 'REL-SYNTHETIC',
    },
  });
}

describe('R2 primary evidence store', () => {
  it('validates, writes, verifies, and reads a private governed object', async () => {
    const bucket = bucketFixture();
    const store = createR2EvidenceStore({
      bucket,
      clock: { now: () => Date.parse('2026-07-26T09:10:11.000Z') },
    });
    const upload = await prepared(store);

    await expect(store.upload(upload)).resolves.toMatchObject({
      privateStorageReference: expect.stringMatching(
        /^evidence\/v1\/release_confirmation_photo\/2026\/07\/EVD-R2-SYNTHETIC\//u,
      ),
      primaryEtag: 'etag-1',
      primaryVersion: 'version-1',
    });
    const objectKey = [...bucket.objects.keys()][0];
    expect(objectKey).not.toContain('REL-SYNTHETIC');
    expect(bucket.put).toHaveBeenCalledWith(
      objectKey,
      upload.bytes,
      expect.objectContaining({
        onlyIf: { etagDoesNotMatch: '*' },
        httpMetadata: expect.objectContaining({
          contentType: 'image/png',
          cacheControl: 'private, no-store',
        }),
        customMetadata: expect.objectContaining({
          evidenceId: 'EVD-R2-SYNTHETIC',
          sha256: upload.sha256,
        }),
      }),
    );
    await expect(
      store.read(objectKey, {
        ...upload,
        privateStorageReference: objectKey,
      }),
    ).resolves.toMatchObject({
      mimeType: 'image/png',
      sha256: upload.sha256,
      objectKey,
    });
  });

  it('restores to a versioned key when an object already exists and never removes another record', async () => {
    const bucket = bucketFixture();
    const store = createR2EvidenceStore({ bucket });
    const upload = await prepared(store);
    const stored = await store.upload(upload);

    await expect(
      store.restore({
        privateStorageReference: stored.privateStorageReference,
        prepared: upload,
        restoredAt: '2026-07-26T10:11:12.000Z',
      }),
    ).resolves.toMatchObject({
      priorObjectPreserved: true,
      restoredObjectKey: `${stored.privateStorageReference}.restored-20260726101112`,
    });
    expect(bucket.objects.size).toBe(2);
    await expect(store.remove(stored.privateStorageReference, 'EVD-OTHER')).resolves.toBe(false);
    expect(bucket.objects.has(stored.privateStorageReference)).toBe(true);
  });

  it('fails before R2 for an invalid signature or absent binding', async () => {
    const store = createR2EvidenceStore({ bucket: bucketFixture() });
    await expect(
      store.prepare({
        evidenceId: 'EVD-BAD',
        command: {
          evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
          originalFileName: 'bad.png',
          mimeType: 'image/png',
          base64: btoa('not-a-png'),
        },
      }),
    ).rejects.toMatchObject({ code: 'FILE_SIGNATURE_MISMATCH' });
    await expect(
      createR2EvidenceStore().prepare({
        evidenceId: 'EVD-MISSING',
        command: {
          evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        },
      }),
    ).rejects.toMatchObject({ code: 'EVIDENCE_STORE_NOT_CONFIGURED' });
  });
});
