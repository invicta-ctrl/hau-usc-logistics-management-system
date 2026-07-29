import {
  EVIDENCE_TYPES,
  governedEvidenceObjectKey,
  prepareEvidenceUpload,
  validateEvidenceBytes,
} from './evidence-contract.js';

function storeError(code, message, retryable = false) {
  return Object.assign(new Error(message), { code, retryable });
}

function configuredBucket(bucket) {
  return Boolean(
    bucket &&
    typeof bucket.put === 'function' &&
    typeof bucket.head === 'function' &&
    typeof bucket.get === 'function' &&
    typeof bucket.delete === 'function',
  );
}

function verifiedHead(head, prepared) {
  return Boolean(
    head &&
    Number(head.size) === Number(prepared.sizeBytes) &&
    String(head.httpMetadata?.contentType ?? '') === prepared.mimeType &&
    String(head.customMetadata?.evidenceId ?? '') === prepared.evidenceId &&
    String(head.customMetadata?.sha256 ?? '') === prepared.sha256,
  );
}

export function createR2EvidenceStore({
  bucket,
  cryptoProvider = globalThis.crypto,
  clock = { now: () => Date.now() },
} = {}) {
  const configured = configuredBucket(bucket);

  async function verify(objectKey, prepared) {
    const head = await bucket.head(objectKey);
    if (!verifiedHead(head, prepared)) {
      throw storeError(
        'EVIDENCE_PRIMARY_VERIFICATION_FAILED',
        'The primary evidence write could not be verified.',
        true,
      );
    }
    return head;
  }

  async function write(objectKey, prepared) {
    const result = await bucket.put(objectKey, prepared.bytes, {
      onlyIf: { etagDoesNotMatch: '*' },
      httpMetadata: {
        contentType: prepared.mimeType,
        cacheControl: 'private, no-store',
        contentDisposition: `attachment; filename="${prepared.normalizedFileName.replaceAll('"', '')}"`,
      },
      customMetadata: {
        evidenceId: prepared.evidenceId,
        evidenceType: prepared.evidenceType,
        sha256: prepared.sha256,
        sizeBytes: String(prepared.sizeBytes),
        retentionClass: 'HAU_USC_OPERATIONAL_EVIDENCE',
      },
      sha256: prepared.sha256,
    });
    if (!result) {
      const existing = await bucket.head(objectKey);
      if (!verifiedHead(existing, prepared)) {
        throw storeError(
          'EVIDENCE_PRIMARY_OBJECT_CONFLICT',
          'The governed primary evidence key is already occupied by a different object.',
        );
      }
    }
    const head = await verify(objectKey, prepared);
    return {
      privateStorageReference: objectKey,
      primaryEtag: String(head.etag ?? ''),
      primaryVersion: String(head.version ?? ''),
    };
  }

  return Object.freeze({
    status(evidenceType) {
      return { configured: Boolean(configured && EVIDENCE_TYPES[evidenceType]) };
    },

    async prepare({ evidenceId, command, timestamp = new Date(clock.now()).toISOString() }) {
      if (!configured) {
        throw storeError(
          'EVIDENCE_STORE_NOT_CONFIGURED',
          'The approved private primary evidence store is not configured.',
        );
      }
      return prepareEvidenceUpload({ evidenceId, command, timestamp }, cryptoProvider);
    },

    async upload(prepared) {
      if (!configured) {
        throw storeError(
          'EVIDENCE_STORE_NOT_CONFIGURED',
          'The approved private primary evidence store is not configured.',
        );
      }
      return write(governedEvidenceObjectKey(prepared), prepared);
    },

    async read(privateStorageReference, expected) {
      if (!configured) {
        throw storeError(
          'EVIDENCE_STORE_NOT_CONFIGURED',
          'The approved private primary evidence store is not configured.',
        );
      }
      const object = await bucket.get(privateStorageReference);
      if (!object || !('body' in object)) {
        throw storeError(
          'EVIDENCE_PRIMARY_NOT_FOUND',
          'The primary evidence object is missing and requires owner review.',
        );
      }
      const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
      const validated = await validateEvidenceBytes(
        {
          bytes,
          mimeType: expected.mimeType,
          expectedSize: expected.sizeBytes,
          expectedSha256: expected.sha256,
        },
        cryptoProvider,
      );
      if (
        String(object.customMetadata?.evidenceId ?? '') !== expected.evidenceId ||
        String(object.customMetadata?.sha256 ?? '') !== validated.sha256
      ) {
        throw storeError(
          'EVIDENCE_PRIMARY_METADATA_MISMATCH',
          'The primary evidence object metadata could not be verified.',
        );
      }
      return { ...validated, objectKey: privateStorageReference };
    },

    async inspect(privateStorageReference, expected) {
      if (!configured) return { configured: false, valid: false, missing: true };
      const head = await bucket.head(privateStorageReference);
      if (!head) return { configured: true, valid: false, missing: true };
      return {
        configured: true,
        valid: verifiedHead(head, expected),
        missing: false,
        primaryEtag: String(head.etag ?? ''),
        primaryVersion: String(head.version ?? ''),
      };
    },

    async restore({ privateStorageReference, prepared, restoredAt }) {
      if (!configured) {
        throw storeError(
          'EVIDENCE_STORE_NOT_CONFIGURED',
          'The approved private primary evidence store is not configured.',
        );
      }
      const current = await bucket.head(privateStorageReference);
      const targetKey = current
        ? `${privateStorageReference}.restored-${String(restoredAt).replace(/\D/gu, '').slice(0, 14)}`
        : privateStorageReference;
      const stored = await write(targetKey, prepared);
      return {
        ...stored,
        restoredObjectKey: targetKey,
        priorObjectPreserved: Boolean(current),
      };
    },

    async remove(privateStorageReference, evidenceId) {
      if (!configured || !privateStorageReference) return false;
      const existing = await bucket.head(privateStorageReference);
      if (!existing) return true;
      if (evidenceId && String(existing.customMetadata?.evidenceId ?? '') !== String(evidenceId)) {
        return false;
      }
      await bucket.delete(privateStorageReference);
      return !(await bucket.head(privateStorageReference));
    },
  });
}
