import { describe, expect, it, vi } from 'vitest';
import worker from '../../scripts/playground/r2-reset-worker.js';

function bucket(entries = []) {
  const objects = new Map(
    entries.map(([key, body, customMetadata = { classification: 'PUBLIC_BRAND' }]) => [
      key,
      { body: String(body), customMetadata },
    ]),
  );
  const metadata = (entry) => ({
    httpMetadata: { contentType: 'image/png' },
    customMetadata: entry?.customMetadata ?? {},
  });
  return {
    objects,
    list: vi.fn(async () => ({
      objects: [...objects].map(([key, entry]) => ({
        key,
        size: entry.body.length,
        etag: `etag-${entry.body}`,
        customMetadata: entry.customMetadata,
      })),
      truncated: false,
    })),
    get: vi.fn(async (key) => {
      const entry = objects.get(key);
      return entry ? { body: entry.body, ...metadata(entry) } : null;
    }),
    head: vi.fn(async (key) => {
      const entry = objects.get(key);
      return entry ? metadata(entry) : null;
    }),
    put: vi.fn(async (key, body, options = {}) =>
      objects.set(key, { body: String(body), customMetadata: options.customMetadata ?? {} }),
    ),
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
    expect([...evidence.objects].map(([key, entry]) => [key, entry.body])).toEqual([
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
    const baselineEvidence = bucket([['playground-redacted/evidence.json', 'approved-redacted-evidence']]);
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

  it('preserves unclassified working objects while resetting governed demo objects', async () => {
    const baseline = bucket([['brand/a.png', 'baseline']]);
    const working = bucket([
      ['brand/a.png', 'changed'],
      ['unknown/operator-preserved.bin', 'preserve', {}],
      ['brand/demo-extra.png', 'remove', { slot: 'LANDING_HERO', versionId: 'demo-v1' }],
    ]);
    const baselineEvidence = bucket([['playground-redacted/evidence.json', 'baseline-evidence']]);
    const evidence = bucket([
      ['playground-redacted/evidence.json', 'changed-evidence'],
      ['private/unclassified.bin', 'preserve-private', {}],
    ]);

    const response = await worker.fetch(
      new Request('https://reset.example.test/reset', {
        method: 'POST',
        headers: { authorization: 'Bearer reset-secret' },
      }),
      {
        RESET_TOKEN: 'reset-secret',
        BASELINE_BRAND: baseline,
        WORKING_BRAND: working,
        BASELINE_EVIDENCE: baselineEvidence,
        WORKING_EVIDENCE: evidence,
      },
    );
    const result = await response.json();

    expect(result.ok).toBe(true);
    expect(result.preservedUnclassified).toEqual({ brand: 1, evidence: 1 });
    expect(working.objects.has('unknown/operator-preserved.bin')).toBe(true);
    expect(working.objects.has('brand/demo-extra.png')).toBe(false);
    expect(evidence.objects.has('private/unclassified.bin')).toBe(true);
  });
});
