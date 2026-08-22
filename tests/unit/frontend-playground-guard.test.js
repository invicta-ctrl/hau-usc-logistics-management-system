import { describe, expect, it, vi } from 'vitest';
import {
  isIsolatedPlaygroundHealth,
  parsePlaygroundOrigin,
  verifyPlaygroundOrigin,
} from '../../scripts/playground-proxy-guard.mjs';

describe('Figma frontend isolated-playground proxy guard', () => {
  const healthy = {
    environment: 'STAGING',
    database: { connected: true },
    dependencies: { d1: true, brandAssets: true, evidenceAssets: true },
  };

  it('accepts only an HTTPS staging hostname without credentials, path, query, or fragment', () => {
    expect(parsePlaygroundOrigin('https://frontend-staging.example.test').origin).toBe(
      'https://frontend-staging.example.test',
    );
    for (const value of [
      'http://frontend-staging.example.test',
      'https://frontend-production.example.test',
      'https://prod-staging.example.test',
      'https://frontend-staging.example.test/path',
      'https://user:pass@frontend-staging.example.test',
    ]) {
      expect(() => parsePlaygroundOrigin(value)).toThrow();
    }
  });

  it('fails closed unless the Worker reports STAGING with distinct D1 and R2 dependencies', async () => {
    expect(isIsolatedPlaygroundHealth(healthy)).toBe(true);
    expect(isIsolatedPlaygroundHealth({ ...healthy, environment: 'PRODUCTION' })).toBe(false);
    expect(
      isIsolatedPlaygroundHealth({ ...healthy, dependencies: { ...healthy.dependencies, d1: false } }),
    ).toBe(false);

    await expect(
      verifyPlaygroundOrigin(
        new URL('https://frontend-staging.example.test'),
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ ...healthy, environment: 'PRODUCTION' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    ).rejects.toThrow('isolated playground');
  });
});
