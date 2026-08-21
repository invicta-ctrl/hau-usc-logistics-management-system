import { describe, expect, it } from 'vitest';
import {
  isSyntheticStagingAccount,
  PARITY_EXCEPTIONS,
  sanitizeProductionRow,
} from '../../scripts/playground/baseline-data.mjs';

describe('playground production-derived baseline privacy', () => {
  it('removes production credentials and locks pseudonymized accounts', () => {
    const result = sanitizeProductionRow('accounts', {
      id: 'ACCOUNT-1',
      access_id_normalized: 'REAL.ACCESS',
      status: 'ACTIVE',
      profile_full_name: 'Real Person',
      profile_mobile_number: '+63 999 000 0000',
      profile_email: 'person@institution.test',
      password_credential_json: '{"hash":"private"}',
      temporary_credential_json: '{"hash":"private"}',
      username_normalized: 'real.person',
      verified_email_fingerprint: 'private',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    });

    expect(result).toMatchObject({
      id: 'ACCOUNT-1',
      status: 'DISABLED',
      password_credential_json: null,
      temporary_credential_json: null,
      verified_email_fingerprint: null,
    });
    expect(result.access_id_normalized).not.toContain('REAL');
    expect(result.profile_email).toMatch(/@example\.test$/u);
    expect(JSON.stringify(result)).not.toContain('private');
    expect(JSON.stringify(result)).not.toContain('Real Person');
  });

  it('drops transient authentication, roster, and provider outbox rows', () => {
    for (const table of [
      'sessions',
      'password_reset_tokens',
      'email_verification_challenges',
      'identity_roster_entries',
      'identity_roster_sync_runs',
      'reporting_outbox',
    ]) {
      expect(sanitizeProductionRow(table, { id: 'PRIVATE' })).toBeNull();
    }
  });

  it('redacts borrower data while preserving workflow identity and state', () => {
    const result = sanitizeProductionRow('public_lending_submissions', {
      id: 'SUBMISSION-1',
      borrower_name: 'Borrower Name',
      student_id: '2026-PRIVATE',
      contact_number: '+63 999 999 9999',
      email: 'borrower@institution.test',
      purpose: 'Private purpose',
      receipt_digest: 'secret-digest',
      status: 'SUBMITTED',
    });

    expect(result.id).toBe('SUBMISSION-1');
    expect(result.status).toBe('SUBMITTED');
    expect(JSON.stringify(result)).not.toContain('Borrower Name');
    expect(JSON.stringify(result)).not.toContain('2026-PRIVATE');
    expect(JSON.stringify(result)).not.toContain('Private purpose');
    expect(result.email).toMatch(/@example\.test$/u);
  });

  it('only recognizes clearly synthetic staging accounts for credential overlay', () => {
    expect(
      isSyntheticStagingAccount({
        profile_full_name: 'Synthetic Owner',
        profile_email: 'owner@example.test',
      }),
    ).toBe(true);
    expect(
      isSyntheticStagingAccount({
        profile_full_name: 'Institution User',
        profile_email: 'user@institution.edu',
      }),
    ).toBe(false);
    expect(PARITY_EXCEPTIONS).toContain('PRODUCTION_CREDENTIALS_EXCLUDED');
  });
});
