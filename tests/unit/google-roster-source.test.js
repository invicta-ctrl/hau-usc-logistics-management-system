import { describe, expect, it, vi } from 'vitest';
import { createGoogleSheetsRosterSource } from '../../src/server/identity-roster/google-source.js';

function base64(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function privateKeyPem() {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const bytes = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  return `-----BEGIN PRIVATE KEY-----\n${base64(bytes)}\n-----END PRIVATE KEY-----`;
}

describe('Google Sheets identity roster source', () => {
  it('reports only safe missing-key names when private configuration is absent', () => {
    const source = createGoogleSheetsRosterSource();
    expect(source.status()).toEqual({
      configured: false,
      missingConfiguration: [
        'GOOGLE_ROSTER_SPREADSHEET_ID',
        'GOOGLE_ROSTER_RANGE',
        'GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_ROSTER_PRIVATE_KEY',
      ],
    });
    expect(JSON.stringify(source.status())).not.toMatch(/spreadsheetId|privateKey|serviceAccountEmail/u);
  });

  it('uses a read-only service-account token and returns only the requested range values', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'synthetic-access-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            values: [
              [
                'Student_ID',
                'Institutional_Email',
                'Display_Name',
                'Verification_Result',
                'Active',
                'Review_Notes',
              ],
              ['SYNTHETIC-001', 'synthetic@example.invalid', 'Synthetic', 'VERIFIED', true, ''],
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    const source = createGoogleSheetsRosterSource({
      spreadsheetId: 'synthetic-private-spreadsheet-id',
      range: 'Approved Identity Roster!A:F',
      serviceAccountEmail: 'synthetic-reader@example.invalid',
      serviceAccountPrivateKey: await privateKeyPem(),
      fetchImpl,
      clock: { now: () => Date.parse('2026-07-26T10:00:00.000Z') },
    });

    await expect(source.read()).resolves.toMatchObject({
      headers: [
        'Student_ID',
        'Institutional_Email',
        'Display_Name',
        'Verification_Result',
        'Active',
        'Review_Notes',
      ],
      rows: [['SYNTHETIC-001', 'synthetic@example.invalid', 'Synthetic', 'VERIFIED', true, '']],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
    expect(String(fetchImpl.mock.calls[0][1].body)).toContain(
      'urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer',
    );
    expect(fetchImpl.mock.calls[1][0]).toContain('valueRenderOption=UNFORMATTED_VALUE');
    expect(fetchImpl.mock.calls[1][1].headers).toEqual({
      authorization: 'Bearer synthetic-access-token',
    });
  });
});
