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

  it('treats generated placeholder values as missing private configuration', () => {
    const source = createGoogleSheetsRosterSource({
      spreadsheetId: 'REPLACE_WITH_PRIVATE_SPREADSHEET_ID',
      range: 'TBD',
      serviceAccountEmail: '<private-reader-email>',
      serviceAccountPrivateKey: 'TODO',
    });
    expect(source.status()).toMatchObject({
      configured: false,
      missingConfiguration: [
        'GOOGLE_ROSTER_SPREADSHEET_ID',
        'GOOGLE_ROSTER_RANGE',
        'GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_ROSTER_PRIVATE_KEY',
      ],
    });
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
      fingerprintSource: {
        headers: [
          'Student_ID',
          'Institutional_Email',
          'Display_Name',
          'Verification_Result',
          'Active',
          'Review_Notes',
        ],
        rows: [['SYNTHETIC-001', 'synthetic@example.invalid', 'Synthetic', 'VERIFIED', true, '']],
      },
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

  it('maps the approved USC directory columns without importing unrelated private fields', async () => {
    const rawHeaders = [
      '# Core',
      'Position',
      'Full Name',
      'Nickname',
      'Pronouns',
      'Contact Number',
      'Student Number',
      'Working Email',
      'HAU Email',
      'Birthday',
      'Year Level',
      'Department',
      'Program',
    ];
    const rawRows = [
      [
        'Core',
        'Director',
        'Synthetic Officer',
        'Syn',
        'They/Them',
        '00000000000',
        'SYNTHETIC-001',
        'private@example.invalid',
        'synthetic.officer@example.invalid',
        '2000-01-01',
        '4',
        'Logistics',
        'Synthetic Program',
      ],
      ['', 'Staff', 'Incomplete Officer', '', '', '', '', '', '', '', '', 'Logistics', ''],
    ];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'synthetic-access-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ values: [rawHeaders, ...rawRows] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const source = createGoogleSheetsRosterSource({
      spreadsheetId: 'synthetic-private-spreadsheet-id',
      range: 'Official!A:M',
      serviceAccountEmail: 'synthetic-reader@example.invalid',
      serviceAccountPrivateKey: await privateKeyPem(),
      fetchImpl,
    });

    const result = await source.read();
    expect(result.headers).toEqual([
      'Student_ID',
      'Institutional_Email',
      'Display_Name',
      'Verification_Result',
      'Active',
      'Review_Notes',
    ]);
    expect(result.rows).toEqual([
      ['SYNTHETIC-001', 'synthetic.officer@example.invalid', 'Synthetic Officer', 'VERIFIED', true, ''],
      ['', '', 'Incomplete Officer', 'VERIFIED', true, ''],
    ]);
    expect(result.fingerprintSource).toEqual({ headers: rawHeaders, rows: rawRows });
    expect(JSON.stringify(result.rows)).not.toMatch(
      /private@example|00000000000|They\/Them|2000-01-01|Synthetic Program/u,
    );
  });
});
