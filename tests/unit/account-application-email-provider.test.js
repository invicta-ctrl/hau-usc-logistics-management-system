import { describe, expect, it } from 'vitest';
import {
  EmailProviderError,
  assertConfiguredEmailProvider,
  createFailClosedEmailProvider,
  isConfiguredEmailProvider,
} from '../../src/server/account-application/email-provider.js';

describe('account-application email provider boundary', () => {
  it('fails closed until an explicit provider adapter is configured', async () => {
    const provider = createFailClosedEmailProvider();

    expect(provider.configured).toBe(false);
    expect(isConfiguredEmailProvider(provider)).toBe(false);
    expect(() => assertConfiguredEmailProvider(provider)).toThrow(EmailProviderError);
    await expect(provider.sendVerification({})).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
    });
  });

  it('requires the narrow verification-delivery operation instead of selecting a provider or domain', () => {
    expect(isConfiguredEmailProvider({ configured: true })).toBe(false);
    expect(
      isConfiguredEmailProvider({
        configured: true,
        sendVerification: async () => undefined,
      }),
    ).toBe(true);
  });
});
