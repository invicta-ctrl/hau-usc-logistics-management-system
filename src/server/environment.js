const SHA = /^[0-9a-f]{40}$/iu;
const VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;

export const REQUIRED_PROTECTED_ENV = Object.freeze([
  'PASSWORD_PEPPER',
  'TRACKING_LINK_SECRET',
  'PROTECTED_PROFILE_ENCRYPTION_KEY',
  'ROSTER_DATA_ENCRYPTION_KEY',
]);

export function safeReleaseIdentity(env) {
  const releaseVersion = String(env?.APP_VERSION ?? '0.0.0');
  return {
    service: 'hau-usc-logistics-worker',
    environment: String(env?.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
    appVersion: releaseVersion,
    releaseVersion,
    candidateSha: String(env?.CANDIDATE_SHA ?? 'UNKNOWN'),
  };
}

export function environmentReadinessIssues(env) {
  const identity = safeReleaseIdentity(env);
  const issues = [];
  if (!['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(identity.environment)) issues.push('ENVIRONMENT_INVALID');
  if (identity.environment !== 'DEVELOPMENT') {
    if (!SHA.test(identity.candidateSha)) issues.push('CANDIDATE_SHA_INVALID');
    if (!VERSION.test(identity.releaseVersion)) issues.push('RELEASE_VERSION_INVALID');
    if (!env?.DB || typeof env.DB.prepare !== 'function') issues.push('D1_BINDING_MISSING');
    if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') issues.push('ASSETS_BINDING_MISSING');
    if (!env?.BRAND_ASSETS || typeof env.BRAND_ASSETS.get !== 'function') issues.push('R2_BRAND_ASSETS_BINDING_MISSING');
    for (const key of REQUIRED_PROTECTED_ENV) {
      if (typeof env?.[key] !== 'string' || env[key].length < 32) issues.push(`${key}_MISSING`);
    }
  }
  return issues;
}
