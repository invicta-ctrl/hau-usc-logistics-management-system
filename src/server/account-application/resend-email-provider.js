// Resend delivery adapter for staff account ownership verification.
//
// This is the only place that talks to an email provider. It implements the
// narrow `sendVerification` operation the account-application service already
// depends on, so no parallel email system is introduced.
//
// Two rules govern everything here:
//   1. Nothing derived from the API key or the raw provider response may escape.
//      Errors carry a fixed code and a fixed message; the provider body is read
//      only to salvage a message id that matches a strict safe pattern.
//   2. A send is "accepted" only on an explicit provider success. Timeouts,
//      network faults, and 5xx must throw, because the caller marks the
//      challenge sent on return and a false success would strand an applicant
//      waiting for an email that was never delivered.

import { EmailProviderError } from './email-provider.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TIMEOUT_MS = 20000;

// "Display Name <local@domain>" or a bare address. The angle brackets must be
// balanced: making each one independently optional accepted `Name <a@b.co` and
// `a@b.co>`, which pass readiness and are then rejected by the provider on every
// send, so applicants silently receive nothing.
const SENDER_PATTERN =
  /^(?:[^<>\r\n]{1,64}\s<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/u;
const RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
// Resend returns a UUID. Keep the accepted shape narrow so no provider prose,
// key fragment, or error text can be persisted as a "reference".
const MESSAGE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;

export const RESEND_PROVIDER_ID = 'resend';

function providerError(code) {
  return new EmailProviderError(code);
}

// Provider outcome -> stable internal code. The provider's own wording never
// reaches the caller, so a misconfigured key cannot be distinguished from a
// revoked one by anything downstream, and neither leaks upstream.
function errorForStatus(status) {
  if (status === 401 || status === 403) return providerError('EMAIL_PROVIDER_NOT_CONFIGURED');
  if (status === 422 || status === 400) return providerError('EMAIL_PROVIDER_REJECTED');
  if (status === 429) return providerError('EMAIL_PROVIDER_RATE_LIMITED');
  return providerError('EMAIL_PROVIDER_UNAVAILABLE');
}

function safeMessageReference(payload) {
  const id = String(payload?.id ?? '').trim();
  return MESSAGE_REF_PATTERN.test(id) ? id : '';
}

function boundedTimeout(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(parsed, MAX_TIMEOUT_MS);
}

export function isResendProviderConfigured({ apiKey, from } = {}) {
  return (
    typeof apiKey === 'string' &&
    apiKey.trim().length >= 16 &&
    typeof from === 'string' &&
    SENDER_PATTERN.test(from.trim())
  );
}

function verificationBody({ verificationCode, expiresAt, verifyUrl }) {
  const lines = [
    'You are receiving this message because someone asked to create an',
    'HAU-USC Logistics staff account for this address.',
    '',
    `Verification code: ${verificationCode}`,
    '',
  ];
  if (verifyUrl) lines.push(`Enter the code at: ${verifyUrl}`, '');
  if (expiresAt) lines.push(`The code expires at ${expiresAt}.`, '');
  lines.push(
    'If you did not request a staff account, ignore this message. No account',
    'is created until the code is used.',
  );
  return lines.join('\n');
}

export function createResendEmailProvider({
  apiKey,
  from,
  verifyUrl = '',
  timeoutMs,
  recipientAllowlist = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!isResendProviderConfigured({ apiKey, from }) || typeof fetchImpl !== 'function') return null;

  const authorization = `Bearer ${String(apiKey).trim()}`;
  const sender = String(from).trim();
  const link = String(verifyUrl ?? '').trim();
  const budgetMs = boundedTimeout(timeoutMs);
  const allowedRecipients = Array.isArray(recipientAllowlist)
    ? new Set(recipientAllowlist.map((value) => String(value).trim().toLowerCase()))
    : null;

  return Object.freeze({
    configured: true,
    providerId: RESEND_PROVIDER_ID,

    async sendVerification({ delivery, verificationCode, expiresAt, correlationId } = {}) {
      const recipient = String(delivery?.institutionalEmail ?? '')
        .trim()
        .toLowerCase();
      const code = String(verificationCode ?? '').trim();
      if (
        !RECIPIENT_PATTERN.test(recipient) ||
        recipient.length > 254 ||
        !/^\d{8}$/u.test(code) ||
        (allowedRecipients && !allowedRecipients.has(recipient))
      ) {
        throw providerError('EMAIL_PROVIDER_REJECTED');
      }

      const controller = new AbortController();
      const expiry = setTimeout(() => controller.abort(), budgetMs);
      let response;
      try {
        response = await fetchImpl(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            authorization,
            'content-type': 'application/json',
            // Resend treats this as an idempotency key, so an internal retry of
            // the same challenge cannot fan out into duplicate emails.
            ...(correlationId ? { 'idempotency-key': String(correlationId).slice(0, 256) } : {}),
          },
          body: JSON.stringify({
            from: sender,
            to: [recipient],
            subject: 'Verify your HAU-USC Logistics staff account',
            text: verificationBody({ verificationCode: code, expiresAt, verifyUrl: link }),
          }),
          signal: controller.signal,
        });
      } catch {
        // Abort, DNS failure, TLS failure, socket reset. Never a delivery.
        clearTimeout(expiry);
        throw providerError('EMAIL_PROVIDER_UNAVAILABLE');
      }

      try {
        if (!response?.ok) throw errorForStatus(Number(response?.status ?? 0));

        // The body is advisory. A success with an unparseable body is still a
        // success, but it yields no reference rather than a fabricated one. The
        // timeout is cleared only after the body is read, so a provider that
        // returns headers and then stalls the stream still aborts instead of
        // hanging until the runtime kills the request.
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        return Object.freeze({ providerMessageRef: safeMessageReference(payload) });
      } finally {
        clearTimeout(expiry);
      }
    },
  });
}
