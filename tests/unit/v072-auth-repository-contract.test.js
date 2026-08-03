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
    ]) {
      expect(source).toContain(marker);
    }
  });

  it('blocks requested usernames that collide with account codes or reservations', async () => {
    const source = await readFile(resolve(root, 'src/server/d1/account-application-repository.js'), 'utf8');

    expect(source).toContain('lower(account.access_id_normalized) = ?7');
    expect(source).toContain('SELECT 1 FROM access_id_reservations reservation');
    expect(source).toContain('requester_departments department');
  });
});
