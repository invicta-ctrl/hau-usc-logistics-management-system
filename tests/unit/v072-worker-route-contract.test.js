import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('v0.7.2 Worker route integration contract', () => {
  it('exposes the locked account-application routes and keeps applicant status tokens bearer-only', async () => {
    const source = await readFile(resolve(root, 'src/worker/index.js'), 'utf8');

    for (const marker of [
      '/api/account-applications/email/start',
      '/api/account-applications/email/confirm',
      '/api/account-applications/status',
      '/api/account-applications/withdraw',
      'admin\\/account-applications',
      'director\\/account-applications',
      'owner\\/account-applications',
      'statusToken: bearerToken(request)',
      'assertPublicMutationOrigin(request)',
      'CAPABILITIES.ACCOUNT_APPLICATION_ADMIN_REVIEW',
      'CAPABILITIES.ACCOUNT_APPLICATION_DIRECTOR_DECIDE',
      'CAPABILITIES.ACCOUNT_APPLICATION_OWNER_OVERRIDE',
    ]) {
      expect(source).toContain(marker);
    }
    expect(source).not.toContain("url.searchParams.get('statusToken')");
  });

  it('exposes the locked CSRF-protected self-profile operations', async () => {
    const source = await readFile(resolve(root, 'src/worker/index.js'), 'utf8');

    for (const marker of [
      '/api/me/profile',
      '/api/me/username/change',
      '/api/me/password/change',
      '/api/me/identity-correction-request',
      '/api/me/avatar',
      'authorizeSession(request, auth, { mutation: true })',
    ]) {
      expect(source).toContain(marker);
    }
  });
});
