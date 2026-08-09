import { describe, expect, it } from 'vitest';
import worker from '../../scripts/playground/r2-readonly-fingerprint-worker.js';

function bucket(objects) {
  return { list: async () => ({ objects, truncated: false }) };
}

describe('production R2 read-only fingerprint Worker', () => {
  it('returns aggregate fingerprints without object keys or mutation methods', async () => {
    const source = await import('node:fs/promises').then(({ readFile }) =>
      readFile(
        new URL('../../scripts/playground/r2-readonly-fingerprint-worker.js', import.meta.url),
        'utf8',
      ),
    );
    expect(source).not.toMatch(/\.put\(|\.delete\(/u);
    const response = await worker.fetch(
      new Request('https://fingerprint.invalid/fingerprint', {
        headers: { authorization: 'Bearer test-token' },
      }),
      {
        READ_ONLY_LABEL: 'PLAYGROUND_PRODUCTION_SOURCE_READ_ONLY',
        READ_TOKEN: 'test-token',
        PRODUCTION_BRAND: bucket([{ key: 'private-brand-key', size: 10, etag: 'brand-etag' }]),
        PRODUCTION_EVIDENCE: bucket([{ key: 'private-evidence-key', size: 20, etag: 'evidence-etag' }]),
      },
    );
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      status: 'PASS',
      brand: { count: 1, bytes: 10 },
      evidence: { count: 1, bytes: 20 },
      productionMutation: 'NONE',
    });
    expect(JSON.stringify(result)).not.toContain('private-brand-key');
    expect(JSON.stringify(result)).not.toContain('private-evidence-key');
  });

  it('fails closed without the exact server-owned label and bearer token', async () => {
    const missingLabel = await worker.fetch(new Request('https://fingerprint.invalid/fingerprint'), {});
    expect(missingLabel.status).toBe(404);
    const denied = await worker.fetch(new Request('https://fingerprint.invalid/fingerprint'), {
      READ_ONLY_LABEL: 'PLAYGROUND_PRODUCTION_SOURCE_READ_ONLY',
      READ_TOKEN: 'expected',
    });
    expect(denied.status).toBe(403);
  });
});
