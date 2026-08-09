import { describe, expect, it, vi } from 'vitest';
import worker from '../../scripts/playground/r2-copy-worker.js';

function bucket(entries = []) {
  const objects = new Map(entries.map(([key, body]) => [key, body]));
  return {
    list: vi.fn(async () => ({
      objects: [...objects].map(([key, body]) => ({
        key,
        size: String(body).length,
        etag: `etag-${key}`,
        uploaded: new Date('2026-08-09T00:00:00.000Z'),
      })),
      truncated: false,
    })),
    get: vi.fn(async (key) => {
      if (!objects.has(key)) return null;
      return {
        body: objects.get(key),
        httpMetadata: { contentType: 'image/png' },
        customMetadata: { classification: 'PUBLIC_BRAND' },
      };
    }),
    head: vi.fn(async (key) => {
      if (!objects.has(key)) return null;
      return {
        httpMetadata: { contentType: 'image/png' },
        customMetadata: { classification: 'PUBLIC_BRAND' },
      };
    }),
    put: vi.fn(async (key, body) => {
      objects.set(key, body);
    }),
  };
}

describe('one-way R2 playground baseline copy', () => {
  it('copies production brand objects into baseline then working without reverse writes', async () => {
    const source = bucket([['brand/public.png', 'public-image']]);
    const baseline = bucket();
    const working = bucket();
    const response = await worker.fetch(
      new Request('https://copy.example.test/copy', {
        method: 'POST',
        headers: { authorization: 'Bearer operator-secret' },
      }),
      {
        COPY_TOKEN: 'operator-secret',
        SOURCE_BRAND: source,
        BASELINE_BRAND: baseline,
        WORKING_BRAND: working,
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect(source.put).not.toHaveBeenCalled();
    expect(baseline.put).toHaveBeenCalledTimes(1);
    expect(working.put).toHaveBeenCalledTimes(1);
  });

  it('rejects an unauthenticated copy attempt before touching any bucket', async () => {
    const source = bucket([['brand/public.png', 'public-image']]);
    const baseline = bucket();
    const working = bucket();
    const response = await worker.fetch(new Request('https://copy.example.test/copy', { method: 'POST' }), {
      COPY_TOKEN: 'operator-secret',
      SOURCE_BRAND: source,
      BASELINE_BRAND: baseline,
      WORKING_BRAND: working,
    });

    expect(response.status).toBe(403);
    expect(source.list).not.toHaveBeenCalled();
    expect(baseline.put).not.toHaveBeenCalled();
    expect(working.put).not.toHaveBeenCalled();
  });
});
