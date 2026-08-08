import { describe, expect, it } from 'vitest';
import { isConfiguredEmailProvider } from '../../src/server/account-application/email-provider.js';
import {
  createResendEmailProvider,
  isResendProviderConfigured,
} from '../../src/server/account-application/resend-email-provider.js';

const API_KEY = 're_test_key_0123456789abcdef';
const FROM = 'HAU-USC Logistics <no-reply@auth.hausc.org>';
const MESSAGE_ID = '9f1c4d2e-7a3b-4c55-8e10-0b2d6f8a1c34';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

function provider(overrides = {}) {
  return createResendEmailProvider({ apiKey: API_KEY, from: FROM, ...overrides });
}

const delivery = { institutionalEmail: 'staff.member@auth.hausc.org' };

describe('resend account-application email provider', () => {
  it('fails closed when the key or sender is missing or malformed', () => {
    expect(isResendProviderConfigured({ apiKey: API_KEY, from: FROM })).toBe(true);
    expect(isResendProviderConfigured({ from: FROM })).toBe(false);
    expect(isResendProviderConfigured({ apiKey: 'short', from: FROM })).toBe(false);
    expect(isResendProviderConfigured({ apiKey: API_KEY })).toBe(false);
    expect(isResendProviderConfigured({ apiKey: API_KEY, from: 'not-an-address' })).toBe(false);

    // Unbalanced angle brackets must not pass readiness. They otherwise report
    // green and are then rejected by the provider on every send, so applicants
    // silently receive nothing.
    for (const from of [
      'HAU-USC Logistics <no-reply@auth.hausc.org',
      'no-reply@auth.hausc.org>',
      'HAU-USC Logistics no-reply@auth.hausc.org>',
      '<no-reply@auth.hausc.org',
    ]) {
      expect(isResendProviderConfigured({ apiKey: API_KEY, from }), from).toBe(false);
    }
    // Both accepted shapes stay accepted.
    expect(isResendProviderConfigured({ apiKey: API_KEY, from: 'no-reply@auth.hausc.org' })).toBe(true);

    expect(provider({ apiKey: '' })).toBeNull();
    expect(provider({ from: '' })).toBeNull();
    expect(provider({ fetchImpl: null })).toBeNull();
  });

  it('satisfies the existing provider boundary when configured', () => {
    const resend = provider({ fetchImpl: async () => jsonResponse(200, { id: MESSAGE_ID }) });
    expect(isConfiguredEmailProvider(resend)).toBe(true);
    expect(resend.providerId).toBe('resend');
  });

  it('sends through the approved sender and returns only a safe message reference', async () => {
    const calls = [];
    const resend = provider({
      verifyUrl: 'https://hau-usc-logistics-staging.example.workers.dev/account',
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse(200, { id: MESSAGE_ID });
      },
    });

    const result = await resend.sendVerification({
      delivery,
      verificationCode: 'CODE-123456',
      expiresAt: '2026-08-08T10:00:00.000Z',
      correlationId: 'corr-1',
    });

    expect(result).toEqual({ providerMessageRef: MESSAGE_ID });
    expect(Object.keys(result)).toEqual(['providerMessageRef']);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe(`Bearer ${API_KEY}`);
    expect(init.headers['idempotency-key']).toBe('corr-1');

    const body = JSON.parse(init.body);
    expect(body.from).toBe(FROM);
    expect(body.to).toEqual([delivery.institutionalEmail]);
    expect(body.text).toContain('CODE-123456');
    expect(body.text).toContain('https://hau-usc-logistics-staging.example.workers.dev/account');
    // The key must never travel in the message itself.
    expect(body.text).not.toContain(API_KEY);
  });

  it('drops a provider reference that does not match the safe reference shape', async () => {
    for (const id of ['', null, 'has spaces', 'x', `${API_KEY} leaked`]) {
      const resend = provider({ fetchImpl: async () => jsonResponse(200, { id }) });
      const result = await resend.sendVerification({ delivery, verificationCode: 'CODE-1' });
      expect(result.providerMessageRef).toBe('');
    }
  });

  it('still succeeds when the success body is unparseable, without inventing a reference', async () => {
    const resend = provider({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        async json() {
          throw new Error('not json');
        },
      }),
    });
    await expect(resend.sendVerification({ delivery, verificationCode: 'CODE-1' })).resolves.toEqual({
      providerMessageRef: '',
    });
  });

  it('maps each provider failure to a safe internal code with no provider detail', async () => {
    const cases = [
      [401, 'EMAIL_PROVIDER_NOT_CONFIGURED'],
      [403, 'EMAIL_PROVIDER_NOT_CONFIGURED'],
      [400, 'EMAIL_PROVIDER_REJECTED'],
      [422, 'EMAIL_PROVIDER_REJECTED'],
      [429, 'EMAIL_PROVIDER_RATE_LIMITED'],
      [500, 'EMAIL_PROVIDER_UNAVAILABLE'],
      [502, 'EMAIL_PROVIDER_UNAVAILABLE'],
      [503, 'EMAIL_PROVIDER_UNAVAILABLE'],
    ];

    for (const [status, code] of cases) {
      const resend = provider({
        fetchImpl: async () =>
          jsonResponse(status, {
            message: `raw provider prose for ${API_KEY}`,
            name: 'validation_error',
          }),
      });
      const error = await resend
        .sendVerification({ delivery, verificationCode: 'CODE-1' })
        .then(() => null)
        .catch((thrown) => thrown);

      expect(error?.code, `status ${status}`).toBe(code);
      const serialized = `${error?.message} ${JSON.stringify(error ?? {})}`;
      expect(serialized).not.toContain(API_KEY);
      expect(serialized).not.toContain('raw provider prose');
      expect(serialized).not.toContain('validation_error');
    }
  });

  it('reports a network fault as unavailable rather than a false delivery', async () => {
    const resend = provider({
      fetchImpl: async () => {
        throw new TypeError('network failure');
      },
    });
    await expect(resend.sendVerification({ delivery, verificationCode: 'CODE-1' })).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_UNAVAILABLE',
    });
  });

  it('aborts on a bounded timeout instead of hanging or reporting delivery', async () => {
    let observedSignal = null;
    const resend = provider({
      timeoutMs: 10,
      fetchImpl: (url, init) =>
        new Promise((resolve, reject) => {
          observedSignal = init.signal;
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });

    await expect(resend.sendVerification({ delivery, verificationCode: 'CODE-1' })).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_UNAVAILABLE',
    });
    expect(observedSignal?.aborted).toBe(true);
  });

  it('refuses a malformed recipient before contacting the provider', async () => {
    let contacted = false;
    const resend = provider({
      fetchImpl: async () => {
        contacted = true;
        return jsonResponse(200, { id: MESSAGE_ID });
      },
    });

    for (const bad of [undefined, {}, { institutionalEmail: 'nope' }, { institutionalEmail: '' }]) {
      await expect(
        resend.sendVerification({ delivery: bad, verificationCode: 'CODE-1' }),
      ).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_REJECTED' });
    }
    await expect(resend.sendVerification({ delivery, verificationCode: '' })).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_REJECTED',
    });
    expect(contacted).toBe(false);
  });

  it('contains staging delivery to exact normalized recipients before any provider call', async () => {
    const calls = [];
    const resend = provider({
      recipientAllowlist: ['allowed.test@example.invalid'],
      fetchImpl: async (...args) => {
        calls.push(args);
        return jsonResponse(200, { id: MESSAGE_ID });
      },
    });

    await expect(
      resend.sendVerification({
        delivery: { institutionalEmail: 'blocked.test@example.invalid' },
        verificationCode: 'CODE-1',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_REJECTED' });
    expect(calls).toHaveLength(0);

    await expect(
      resend.sendVerification({
        delivery: { institutionalEmail: ' Allowed.Test@Example.Invalid ' },
        verificationCode: 'CODE-1',
      }),
    ).resolves.toEqual({ providerMessageRef: MESSAGE_ID });
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0][1].body).to).toEqual(['allowed.test@example.invalid']);
  });
});
