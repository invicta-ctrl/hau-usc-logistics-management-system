import { describe, expect, it } from 'vitest';
import {
  authorizationParameters,
  evidenceFolderDefinitions,
  GOOGLE_EVIDENCE_SCOPE,
} from '../../scripts/google-evidence-oauth.mjs';

describe('Google evidence OAuth setup', () => {
  it('uses PKCE and the narrow app-created-file scope without requesting full Drive access', () => {
    const parameters = authorizationParameters({
      clientId: 'synthetic-client-id',
      redirectUri: 'http://127.0.0.1:9472/oauth2/callback',
      state: 'synthetic-state',
      challenge: 'synthetic-challenge',
    });

    expect(GOOGLE_EVIDENCE_SCOPE).toBe('https://www.googleapis.com/auth/drive.file');
    expect(parameters.get('scope')).toBe(GOOGLE_EVIDENCE_SCOPE);
    expect(parameters.get('scope')).not.toBe('https://www.googleapis.com/auth/drive');
    expect(parameters.get('code_challenge_method')).toBe('S256');
    expect(parameters.get('access_type')).toBe('offline');
    expect(parameters.get('prompt')).toBe('consent');
    expect(parameters.get('state')).toBe('synthetic-state');
  });
});

describe('Google evidence folder environments', () => {
  it('keeps staging and production roots distinct while preserving child roles', () => {
    const staging = evidenceFolderDefinitions('STAGING');
    const production = evidenceFolderDefinitions('production');

    expect(staging[0].name).toBe('HAU-USC Logistics Evidence Backup — STAGING');
    expect(production[0].name).toBe('HAU-USC Logistics Evidence Backup — PRODUCTION');
    expect(production.slice(1)).toEqual(staging.slice(1));
  });

  it('rejects unsupported environments', () => {
    expect(() => evidenceFolderDefinitions('preview')).toThrow(
      'Google evidence environment must be STAGING or PRODUCTION.',
    );
  });
});
