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
  it('restores working brand and evidence to their sealed baselines', async () => {
    const baseline = bucket([
      ['brand/a.png', 'a'],
      ['brand/b.png', 'b'],
    ]);
    const working = bucket([
      ['brand/b.png', 'changed'],
      ['brand/extra.png', 'extra'],
    ]);
    const baselineEvidence = bucket([
      ['control/d1-clean-baseline.sql', 'sealed-control-artifact'],
      ['playground-redacted/evidence.json', 'approved-redacted-evidence'],
    ]);
    const evidence = bucket([
      ['playground-redacted/evidence.json', 'changed'],
      ['playground-redacted/test-only.json', 'test-only'],
    ]);
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
        BASELINE_EVIDENCE: baselineEvidence,
        WORKING_EVIDENCE: evidence,
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect([...working.objects.keys()].sort()).toEqual(['brand/a.png', 'brand/b.png']);
    expect([...evidence.objects]).toEqual([
      ['playground-redacted/evidence.json', 'approved-redacted-evidence'],
    ]);
    expect(evidence.objects.has('control/d1-clean-baseline.sql')).toBe(false);
    expect(baseline.put).not.toHaveBeenCalled();
    expect(baselineEvidence.put).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated reset without listing or deleting objects', async () => {
    const baseline = bucket([['brand/a.png', 'a']]);
    const working = bucket([['brand/a.png', 'dirty']]);
    const evidence = bucket([['playground-redacted/test-only.json', 'test-only']]);
    const baselineEvidence = bucket([
      ['playground-redacted/evidence.json', 'approved-redacted-evidence'],
    ]);
    const response = await worker.fetch(new Request('https://reset.example.test/reset', { method: 'POST' }), {
      RESET_TOKEN: 'reset-secret',
      BASELINE_BRAND: baseline,
      WORKING_BRAND: working,
      BASELINE_EVIDENCE: baselineEvidence,
      WORKING_EVIDENCE: evidence,
    });

    expect(response.status).toBe(403);
    expect(working.list).not.toHaveBeenCalled();
    expect(working.delete).not.toHaveBeenCalled();
    expect(evidence.delete).not.toHaveBeenCalled();
  });
});
