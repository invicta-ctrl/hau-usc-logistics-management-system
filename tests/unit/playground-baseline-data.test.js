import { describe, expect, it } from 'vitest';
import {
  derivedCatalogAlias,
  isSyntheticStagingAccount,
  PARITY_EXCEPTIONS,
  sanitizeProductionRow,
  shouldOmitProductionRowForSyntheticOverlay,
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

  it('fails closed for schema-31/32 provenance, fingerprint, and staff activity records', () => {
    for (const table of [
      'canonical_people',
      'canonical_person_emails',
      'account_staff_links',
      'staff_assignments',
      'staff_account_activity_history',
      'staff_account_activity_audit_context',
    ]) {
      expect(
        sanitizeProductionRow(table, {
          id: 'INTERNAL-1',
          normalized_email_fingerprint: 'internal-email-fingerprint',
          source_provenance_envelope: '{"provider":"private"}',
          assignment_fingerprint: 'internal-assignment-fingerprint',
          account_access_id_snapshot: 'INTERNAL.ACCESS.ID',
        }),
      ).toBeNull();
    }
    expect(PARITY_EXCEPTIONS).toContain('CANONICAL_IDENTITY_PROVENANCE_AND_FINGERPRINTS_EXCLUDED');
    expect(PARITY_EXCEPTIONS).toContain('STAFF_ACCOUNT_ACTIVITY_HISTORY_AND_AUDIT_CONTEXT_EXCLUDED');
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

  it('retains sanitized replay proof needed for returned-lending reconciliation', () => {
    const result = sanitizeProductionRow('idempotency_keys', {
      scope: 'confirmReturn',
      idempotency_key: 'RETURN-1',
      actor_account_id: 'ACCOUNT-1',
      request_fingerprint: 'private-request-body',
      result_json: JSON.stringify({
        returnedQuantity: 1,
        lostQuantity: 0,
        damagedBeyondUseQuantity: 0,
        borrowerEmail: 'private@institution.edu',
      }),
      created_at: '2026-08-01T00:00:00.000Z',
    });

    expect(result.scope).toBe('confirmReturn');
    expect(result.idempotency_key).toBe('RETURN-1');
    expect(result.request_fingerprint).not.toBe('private-request-body');
    expect(JSON.parse(result.result_json)).toMatchObject({
      returnedQuantity: 1,
      lostQuantity: 0,
      damagedBeyondUseQuantity: 0,
      borrowerEmail: '[redacted]',
    });
    expect(JSON.stringify(result)).not.toContain('private@institution.edu');
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

  it('replaces matching production account rows with the synthetic staging overlay', () => {
    const syntheticAccountIds = new Set(['ACCOUNT-1']);

    expect(
      shouldOmitProductionRowForSyntheticOverlay(
        'accounts',
        { id: 'ACCOUNT-1' },
        syntheticAccountIds,
      ),
    ).toBe(true);
    expect(
      shouldOmitProductionRowForSyntheticOverlay(
        'account_committees',
        { account_id: 'ACCOUNT-1' },
        syntheticAccountIds,
      ),
    ).toBe(true);
    expect(
      shouldOmitProductionRowForSyntheticOverlay(
        'account_access_profiles',
        { account_id: 'ACCOUNT-1' },
        syntheticAccountIds,
      ),
    ).toBe(true);
    expect(
      shouldOmitProductionRowForSyntheticOverlay(
        'requests',
        { account_id: 'ACCOUNT-1' },
        syntheticAccountIds,
      ),
    ).toBe(false);
  });

  it('derives a normalized safe alias from each inventory item name', () => {
    expect(derivedCatalogAlias('  HDMI   Cable  ')).toEqual({
      normalizedAlias: 'hdmi cable',
      displayAlias: 'HDMI Cable',
    });
  });
});
