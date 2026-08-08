import { describe, expect, it } from 'vitest';
import { normalizeReleaseIdentity, releaseIdentityLabel } from '../../src/app/release-identity.js';

describe('authoritative release identity', () => {
  it.each([['PRODUCTION', 'Production · v0.7.1']])(
    'labels a verified %s Worker without build-mode drift',
    (environment, label) => {
      const identity = normalizeReleaseIdentity({
        environment,
        appVersion: '0.7.1',
        candidateSha: 'a'.repeat(40),
      });

      expect(identity).toMatchObject({ environment, verified: true });
      expect(releaseIdentityLabel(identity)).toBe(label);
    },
  );

  it('renders an unmistakable staging warning with exact release evidence', () => {
    const identity = normalizeReleaseIdentity({
      environment: 'STAGING',
      appVersion: '0.7.2',
      candidateSha: 'a'.repeat(40),
      database: { schemaVersion: '30' },
    });
    expect(identity).toMatchObject({ environment: 'STAGING', schemaVersion: '30', verified: true });
    expect(releaseIdentityLabel(identity)).toBe('STAGING TEST ENV · v0.7.2 · SHA aaaaaaaaaaaa · schema 30');
  });

  it('fails closed for unknown, malformed, or incomplete release identity', () => {
    for (const identity of [
      null,
      { environment: 'STAGING', appVersion: '0.7.1' },
      { environment: 'STAGING', appVersion: '0.7.1', candidateSha: 'a'.repeat(40) },
      { environment: 'PRODUCTION', appVersion: 'next', candidateSha: 'a'.repeat(40) },
      { environment: 'PREVIEW', appVersion: '0.7.1', candidateSha: 'a'.repeat(40) },
    ]) {
      expect(releaseIdentityLabel(identity)).toBe('Environment unavailable · release not verified');
    }
  });
});
