import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import worker from '../../src/worker/index.js';

const root = resolve(import.meta.dirname, '../..');

describe('MFR-002 U10 cache and response security contracts', () => {
  it('makes only fingerprinted Vite assets immutable and keeps HTML revalidated', async () => {
    const headers = await readFile(resolve(root, 'src/public/_headers'), 'utf8');

    expect(headers).toMatch(/\/assets\/\*\r?\n\s+Cache-Control: public, max-age=31556952, immutable/u);
    expect(headers).toMatch(/\/index\.html\r?\n\s+Cache-Control: no-cache(?:\r?\n|$)/u);
    expect(headers).not.toMatch(/\/index\.html[\s\S]*?Cache-Control:[^\r\n]*no-store/u);
  });

  it('keeps the static document policy self-only without script unsafe-inline', async () => {
    const headers = await readFile(resolve(root, 'src/public/_headers'), 'utf8');

    expect(headers).toContain('X-Frame-Options: DENY');
    expect(headers).toMatch(/Content-Security-Policy:[^\r\n]*script-src 'self';/u);
    expect(headers).not.toMatch(/script-src[^;\r\n]*'unsafe-inline'/u);
    expect(headers).toMatch(/frame-ancestors 'none'/u);
  });

  it('denies document capabilities and shared caching on dynamic API JSON', async () => {
    const response = await worker.fetch(
      new Request('https://logistics.hausc.org/api/playground/status'),
      { ENVIRONMENT: 'PRODUCTION' },
      {},
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
  });
});
