import { describe, expect, it } from 'vitest';
import { isConfiguredEmailProvider } from '../../src/server/account-application/email-provider.js';
import {
  ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING,
  accountApplicationEmailProviderIssues,
  createAccountApplicationEmailProvider,
} from '../../src/server/account-application/email-provider-registry.js';

const FROM = 'HAU-USC Logistics <no-reply@auth.hausc.org>';
const KEY = 're_test_key_0123456789abcdef';

const readyEnv = (overrides = {}) => ({
  ACCOUNT_APPLICATION_EMAIL_PROVIDER: 'resend',
  ACCOUNT_APPLICATION_EMAIL_FROM: FROM,
  [ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING]: KEY,
  ...overrides,
});

describe('account-application email provider registry', () => {
  it('reports no issues only when provider, secret, and sender are all present', () => {
    expect(accountApplicationEmailProviderIssues(readyEnv())).toEqual([]);
  });

  it('fails closed when no provider is selected', () => {
    expect(accountApplicationEmailProviderIssues({})).toEqual([
      'ACCOUNT_APPLICATION_EMAIL_PROVIDER_NOT_SELECTED',
    ]);
  });

  it('fails closed on an unsupported provider rather than guessing one', () => {
    expect(
      accountApplicationEmailProviderIssues(
        readyEnv({ ACCOUNT_APPLICATION_EMAIL_PROVIDER: 'sendgrid' }),
      ),
    ).toEqual(['ACCOUNT_APPLICATION_EMAIL_PROVIDER_UNSUPPORTED']);
  });

  it('fails closed on a missing or too-short secret', () => {
    for (const apiKey of [undefined, '', '   ', 'short']) {
      expect(
        accountApplicationEmailProviderIssues(
          readyEnv({ [ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING]: apiKey }),
        ),
      ).toContain('ACCOUNT_APPLICATION_EMAIL_PROVIDER_SECRET_MISSING');
    }
  });

  it('fails closed on a missing or malformed sender', () => {
    for (const from of [undefined, '', 'no-reply', 'no-reply@']) {
      expect(
        accountApplicationEmailProviderIssues(readyEnv({ ACCOUNT_APPLICATION_EMAIL_FROM: from })),
      ).toContain('ACCOUNT_APPLICATION_EMAIL_SENDER_INVALID');
    }
  });

  it('never places the secret or sender in readiness output', () => {
    const issues = accountApplicationEmailProviderIssues(
      readyEnv({ [ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING]: 'short' }),
    );
    const serialized = JSON.stringify(issues);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain('auth.hausc.org');
  });

  it('builds a configured provider when ready and a fail-closed one otherwise', () => {
    const configured = createAccountApplicationEmailProvider(readyEnv(), { fetchImpl: async () => ({}) });
    expect(isConfiguredEmailProvider(configured)).toBe(true);
    expect(configured.providerId).toBe('resend');

    for (const env of [{}, readyEnv({ ACCOUNT_APPLICATION_EMAIL_FROM: 'bad' })]) {
      const provider = createAccountApplicationEmailProvider(env);
      expect(isConfiguredEmailProvider(provider)).toBe(false);
    }
  });

  it('keeps a fail-closed provider throwing the configured-boundary error', async () => {
    const provider = createAccountApplicationEmailProvider({});
    await expect(provider.sendVerification({})).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
    });
  });
});
