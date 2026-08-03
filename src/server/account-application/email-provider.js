export class EmailProviderError extends Error {
  constructor(code = 'EMAIL_PROVIDER_NOT_CONFIGURED') {
    super('Email verification is not configured.');
    this.name = 'EmailProviderError';
    this.code = code;
  }
}

export function isConfiguredEmailProvider(provider) {
  return Boolean(provider?.configured === true && typeof provider.sendVerification === 'function');
}

export function assertConfiguredEmailProvider(provider) {
  if (!isConfiguredEmailProvider(provider)) {
    throw new EmailProviderError('EMAIL_PROVIDER_NOT_CONFIGURED');
  }
  return provider;
}

export function createFailClosedEmailProvider() {
  return Object.freeze({
    configured: false,
    async sendVerification() {
      throw new EmailProviderError('EMAIL_PROVIDER_NOT_CONFIGURED');
    },
  });
}
