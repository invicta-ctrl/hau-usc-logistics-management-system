import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('v0.7.2 authentication persistence contract', () => {
  it('preserves new identity fields during activation and uses deterministic login precedence', async () => {
    const source = await readFile(resolve(root, 'src/server/d1/auth-repository.js'), 'utf8');

    for (const marker of [
      'username_normalized = excluded.username_normalized',
      'verified_email_fingerprint = excluded.verified_email_fingerprint',
      'profile_department_id = excluded.profile_department_id',
      'profile_course_id = excluded.profile_course_id',
      'WHEN access_id_normalized = upper(?1) THEN 1',
      'WHEN username_normalized = lower(?1) THEN 2',
      'application.approved_account_id = accounts.id',
      "application.state IN ('APPROVED_ACTIVATION_REQUIRED', 'ACTIVE')",
    ]) {
      expect(source).toContain(marker);
    }
    expect(source).not.toContain(
      'profile_email_verified_at IS NOT NULL AND lower(profile_email) = lower(?1)',
    );
  });

  it('checks pending account applications when reserving a profile username', async () => {
    const source = await readFile(resolve(root, 'src/server/d1/profile-repository.js'), 'utf8');

    expect(source).toContain('FROM account_applications');
    expect(source).toContain('requested_username_normalized = ?1');
    expect(source).toContain("'APPROVED_ACTIVATION_REQUIRED'");
  });

  it('blocks requested usernames that collide with account codes or reservations', async () => {
    const source = await readFile(resolve(root, 'src/server/d1/account-application-repository.js'), 'utf8');

    expect(source).toContain('lower(account.access_id_normalized) = ?7');
    expect(source).toContain('SELECT 1 FROM access_id_reservations reservation');
    expect(source).toContain('requester_departments department');
  });
});
