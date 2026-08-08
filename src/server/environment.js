import { accountApplicationEmailProviderIssues } from './account-application/email-provider-registry.js';
import { parseAccountApplicationStagingIdentityFixture } from './account-application/adapters.js';

const SHA = /^[0-9a-f]{40}$/iu;
const VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const ENVIRONMENTS = new Set(['DEVELOPMENT', 'STAGING', 'PRODUCTION']);
const WORKERS_DEV_HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+workers\.dev$/u;

export const REQUIRED_PROTECTED_ENV = Object.freeze([
  'PASSWORD_PEPPER',
  'TRACKING_LINK_SECRET',
  'PROTECTED_PROFILE_ENCRYPTION_KEY',
  'ROSTER_DATA_ENCRYPTION_KEY',
]);

export function normalizeEnvironment(environment) {
  const value = String(environment ?? '')
    .trim()
    .toUpperCase();
  return ENVIRONMENTS.has(value) ? value : 'UNKNOWN';
}

export function isValidRecoveryHostname(value) {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    value === value.toLowerCase() &&
    WORKERS_DEV_HOSTNAME.test(value)
  );
}

function hasAccountApplicationIdentityClasses(value) {
  try {
    const parsed = JSON.parse(String(value ?? ''));
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (entry) =>
          typeof entry?.id === 'string' &&
          entry.id.trim() &&
          Array.isArray(entry.domains) &&
          entry.domains.length > 0,
      )
    );
  } catch {
    return false;
  }
}

export function safeReleaseIdentity(env) {
  const releaseVersion = String(env?.APP_VERSION ?? '0.0.0');
  return {
    service: 'hau-usc-logistics-worker',
    environment: normalizeEnvironment(env?.ENVIRONMENT),
    appVersion: releaseVersion,
    releaseVersion,
    candidateSha: String(env?.CANDIDATE_SHA ?? 'UNKNOWN'),
  };
}

export function environmentReadinessIssues(env) {
  const identity = safeReleaseIdentity(env);
  const issues = [];
  if (!['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(identity.environment))
    issues.push('ENVIRONMENT_INVALID');
  if (identity.environment !== 'DEVELOPMENT') {
    if (!SHA.test(identity.candidateSha)) issues.push('CANDIDATE_SHA_INVALID');
    if (!VERSION.test(identity.releaseVersion)) issues.push('RELEASE_VERSION_INVALID');
    if (!isValidRecoveryHostname(env?.RECOVERY_HOSTNAME)) issues.push('RECOVERY_HOSTNAME_INVALID');
    if (!env?.DB || typeof env.DB.prepare !== 'function') issues.push('D1_BINDING_MISSING');
    if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') issues.push('ASSETS_BINDING_MISSING');
    if (!env?.BRAND_ASSETS || typeof env.BRAND_ASSETS.get !== 'function')
      issues.push('R2_BRAND_ASSETS_BINDING_MISSING');
    if (!env?.EVIDENCE_ASSETS || typeof env.EVIDENCE_ASSETS.put !== 'function') {
      issues.push('R2_EVIDENCE_ASSETS_BINDING_MISSING');
    }
    for (const key of REQUIRED_PROTECTED_ENV) {
      if (typeof env?.[key] !== 'string' || env[key].length < 32) issues.push(`${key}_MISSING`);
    }
    if (!hasAccountApplicationIdentityClasses(env?.ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON)) {
      issues.push('ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING');
    }
    if (
      identity.environment === 'STAGING' &&
      !parseAccountApplicationStagingIdentityFixture(
        env?.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON,
      ).length
    ) {
      issues.push('ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_MISSING');
    }
    // A provider is now owner-approved and implemented, so readiness asks the
    // registry instead of refusing unconditionally. It still fails closed: a
    // missing provider selection, an unsupported provider, an absent secret, or
    // a malformed sender each keep deployed readiness shut. Only presence is
    // reported; no configured value reaches health output.
    issues.push(...accountApplicationEmailProviderIssues(env));
  }
  return issues;
}
