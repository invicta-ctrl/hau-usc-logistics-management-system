import { describe, expect, it, vi } from 'vitest';
import worker from '../../src/worker/index.js';

function environment(asset) {
  return {
    BRAND_ASSETS: {
      get: vi.fn().mockResolvedValue(asset),
    },
  };
}

describe('governed brand asset delivery', () => {
  it.each([
    ['/brand/login-background', 'brand/login-background'],
    ['/brand/usc-logo', 'brand/usc-logo'],
    ['/brand/dol-logo', 'brand/dol-logo'],
    ['/brand/combined-lockup', 'brand/combined-lockup'],
    ['/brand/favicon', 'brand/favicon'],
    ['/brand/default-item-image', 'brand/default-item-image'],
  ])('serves the approved %s R2 slot with safe response headers', async (path, key) => {
    const env = environment({
      body: 'synthetic-image-body',
      httpEtag: '"synthetic-etag"',
      httpMetadata: { contentType: 'image/webp' },
    });

    const response = await worker.fetch(new Request(`https://example.test${path}`), env);

    expect(env.BRAND_ASSETS.get).toHaveBeenCalledWith(key);
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

  it('resolves a published governed version while retaining legacy-key fallback', async () => {
    const asset = {
      body: 'published-version',
      httpMetadata: { contentType: 'image/png' },
    };
    const first = vi.fn().mockResolvedValue({ object_key: 'brand/versions/usc-logo/BRAND-1.png' });
    const bind = vi.fn(() => ({ first }));
    const prepare = vi.fn(() => ({ bind }));
    const env = { ...environment(asset), DB: { prepare } };

    const response = await worker.fetch(new Request('https://example.test/brand/usc-logo'), env);

    expect(bind).toHaveBeenCalledWith('usc-logo');
    expect(env.BRAND_ASSETS.get).toHaveBeenCalledWith('brand/versions/usc-logo/BRAND-1.png');
    expect(await response.text()).toBe('published-version');
  });

  it('serves only bounded governed catalog image keys', async () => {
    const env = environment({
      body: 'synthetic-catalog-image',
      httpMetadata: { contentType: 'image/png' },
    });
    const served = await worker.fetch(
      new Request('https://example.test/brand/catalog/item-photo-01.png'),
      env,
    );
    const rejected = await worker.fetch(
      new Request('https://example.test/brand/catalog/%2e%2e%2fprivate'),
      env,
    );

    expect(env.BRAND_ASSETS.get).toHaveBeenCalledWith('catalog/item-photo-01.png');
    expect(served.status).toBe(200);
    expect(rejected.status).toBe(404);
  });
});
