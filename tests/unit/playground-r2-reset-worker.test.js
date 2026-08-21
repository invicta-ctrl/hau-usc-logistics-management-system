import { describe, expect, it, vi } from 'vitest';
import worker from '../../scripts/playground/r2-reset-worker.js';

function bucket(entries = []) {
  const objects = new Map(entries.map(([key, body]) => [key, String(body)]));
  const metadata = () => ({
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { classification: 'PUBLIC_BRAND' },
  });
  return {
    objects,
    list: vi.fn(async () => ({
      objects: [...objects].map(([key, body]) => ({ key, size: body.length, etag: `etag-${body}` })),
      truncated: false,
    })),
    get: vi.fn(async (key) => (objects.has(key) ? { body: objects.get(key), ...metadata() } : null)),
    head: vi.fn(async (key) => (objects.has(key) ? metadata() : null)),
    put: vi.fn(async (key, body) => objects.set(key, String(body))),
    delete: vi.fn(async (key) => objects.delete(key)),
  };
}

describe('fixed-binding playground R2 reset', () => {
  it('removes extras, restores changed brand objects, and clears working evidence', async () => {
    const baseline = bucket([
      ['brand/a.png', 'a'],
      ['brand/b.png', 'b'],
    ]);
    const working = bucket([
      ['brand/b.png', 'changed'],
      ['brand/extra.png', 'extra'],
    ]);
    const evidence = bucket([['test/private.txt', 'test-only']]);
    const response = await worker.fetch(
      new Request('https://reset.example.test/reset', {
        method: 'POST',
        headers: { authorization: 'Bearer reset-secret' },
        body: JSON.stringify({ productionBucket: 'ignored-browser-input' }),
      }),
      {
        RESET_TOKEN: 'reset-secret',
        BASELINE_BRAND: baseline,
        WORKING_BRAND: working,
        WORKING_EVIDENCE: evidence,
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect([...working.objects.keys()].sort()).toEqual(['brand/a.png', 'brand/b.png']);
    expect(evidence.objects.size).toBe(0);
    expect(baseline.put).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated reset without listing or deleting objects', async () => {
    const baseline = bucket([['brand/a.png', 'a']]);
    const working = bucket([['brand/a.png', 'dirty']]);
    const evidence = bucket([['test/private.txt', 'test-only']]);
    const response = await worker.fetch(new Request('https://reset.example.test/reset', { method: 'POST' }), {
      RESET_TOKEN: 'reset-secret',
      BASELINE_BRAND: baseline,
      WORKING_BRAND: working,
      WORKING_EVIDENCE: evidence,
    });

    expect(response.status).toBe(403);
    expect(working.list).not.toHaveBeenCalled();
    expect(working.delete).not.toHaveBeenCalled();
    expect(evidence.delete).not.toHaveBeenCalled();
  });
});
