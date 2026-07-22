import { describe, expect, it, vi } from 'vitest';
import worker from '../../src/worker/index.js';

function environment(asset) {
  return {
    BRAND_ASSETS: {
      get: vi.fn().mockResolvedValue(asset),
    },
  };
}

describe('governed login background delivery', () => {
  it('serves only the fixed owner-governed R2 slot with safe response headers', async () => {
    const env = environment({
      body: 'synthetic-image-body',
      httpEtag: '"synthetic-etag"',
      httpMetadata: { contentType: 'image/webp' },
    });

    const response = await worker.fetch(new Request('https://example.test/brand/login-background'), env);

    expect(env.BRAND_ASSETS.get).toHaveBeenCalledWith('brand/login-background');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toBe('synthetic-image-body');
  });

  it('returns a bounded cacheable absence and rejects mutation methods', async () => {
    const env = environment(null);
    const missing = await worker.fetch(new Request('https://example.test/brand/login-background'), env);
    const mutation = await worker.fetch(
      new Request('https://example.test/brand/login-background', { method: 'POST' }),
      env,
    );

    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toContain('max-age=60');
    expect(mutation.status).toBe(405);
    expect(mutation.headers.get('allow')).toBe('GET, HEAD');
  });
});
