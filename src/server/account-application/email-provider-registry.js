// Selects the account-application email provider from environment configuration.
//
// `email-provider.js` stays deliberately provider-agnostic: it defines only the
// narrow `sendVerification` boundary and the fail-closed default. Provider
// selection lives here so that adding or replacing a provider never widens that
// boundary, and so `environment.js` can ask a single readiness question without
// learning anything about Resend.
//
// The API key is only ever read from the Worker secret binding. It is never
// logged, never returned, and never placed in readiness output — readiness
// reports presence, not value.

import { createFailClosedEmailProvider } from './email-provider.js';
import {
  RESEND_PROVIDER_ID,
  createResendEmailProvider,
  isResendProviderConfigured,
} from './resend-email-provider.js';

export const ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING = 'ACCOUNT_APPLICATION_RESEND_API_KEY';

const SUPPORTED_PROVIDERS = Object.freeze([RESEND_PROVIDER_ID]);

function selectedProviderId(env) {
  return String(env?.ACCOUNT_APPLICATION_EMAIL_PROVIDER ?? '')
    .trim()
    .toLowerCase();
}

function resendConfiguration(env) {
  return {
    apiKey: env?.[ACCOUNT_APPLICATION_EMAIL_SECRET_BINDING],
    from: env?.ACCOUNT_APPLICATION_EMAIL_FROM,
    verifyUrl: env?.ACCOUNT_APPLICATION_EMAIL_VERIFY_URL ?? '',
    timeoutMs: env?.ACCOUNT_APPLICATION_EMAIL_TIMEOUT_MS,
  };
}

// Readiness must fail closed on a missing provider, key, or sender. Returning
// the issue list (rather than a boolean) keeps the reason available to readiness
// without disclosing any configured value; the Worker collapses it to
// CONFIGURATION_INCOMPLETE before anything reaches a response.
//
// Codes deliberately avoid the `_MISSING` suffix: `/api/health` derives its
// unauthenticated `protectedConfiguration` flag from that suffix, and that flag
// is about the protected env secrets, not about provider configuration.
export function accountApplicationEmailProviderIssues(env) {
  const providerId = selectedProviderId(env);
  if (!providerId) return ['ACCOUNT_APPLICATION_EMAIL_PROVIDER_NOT_SELECTED'];
  if (!SUPPORTED_PROVIDERS.includes(providerId))
    return ['ACCOUNT_APPLICATION_EMAIL_PROVIDER_UNSUPPORTED'];

  const configuration = resendConfiguration(env);
  const issues = [];
  if (typeof configuration.apiKey !== 'string' || configuration.apiKey.trim().length < 16)
    issues.push('ACCOUNT_APPLICATION_EMAIL_PROVIDER_SECRET_UNSET');
  if (!isResendProviderConfigured({ apiKey: 'x'.repeat(16), from: configuration.from }))
    issues.push('ACCOUNT_APPLICATION_EMAIL_SENDER_INVALID');
  return issues;
}

export function createAccountApplicationEmailProvider(env, { fetchImpl } = {}) {
  if (accountApplicationEmailProviderIssues(env).length) return createFailClosedEmailProvider();
  const provider = createResendEmailProvider({
    ...resendConfiguration(env),
    ...(fetchImpl ? { fetchImpl } : {}),
  });
  return provider ?? createFailClosedEmailProvider();
}
