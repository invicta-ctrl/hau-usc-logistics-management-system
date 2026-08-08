const RELEASE_SHA = /^[a-f0-9]{40}$/iu;
const RELEASE_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const SCHEMA_VERSION = /^\d+$/u;
const STAGING_BANNER_ENABLED = import.meta.env.MODE !== 'production';
const ENVIRONMENT_LABELS = Object.freeze({
  PRODUCTION: 'Production',
  STAGING: 'Staging',
  DEVELOPMENT: 'Development',
});

let current = Object.freeze({
  environment: 'UNKNOWN',
  appVersion: '',
  candidateSha: '',
  schemaVersion: '',
  verified: false,
});

export function normalizeReleaseIdentity(value) {
  const environment = String(value?.environment ?? '')
    .trim()
    .toUpperCase();
  const appVersion = String(value?.appVersion ?? value?.releaseVersion ?? '').trim();
  const candidateSha = String(value?.candidateSha ?? '')
    .trim()
    .toLowerCase();
  const schemaVersion = String(value?.database?.schemaVersion ?? value?.schemaVersion ?? '').trim();
  const recognizedEnvironment = Object.hasOwn(ENVIRONMENT_LABELS, environment);
  const candidateVerified =
    environment === 'DEVELOPMENT'
      ? candidateSha === 'local_unfrozen' || RELEASE_SHA.test(candidateSha)
      : RELEASE_SHA.test(candidateSha);
  const baseVerified = Boolean(
    recognizedEnvironment && RELEASE_VERSION.test(appVersion) && candidateVerified,
  );
  return Object.freeze({
    environment: recognizedEnvironment ? environment : 'UNKNOWN',
    appVersion: RELEASE_VERSION.test(appVersion) ? appVersion : '',
    candidateSha: candidateVerified ? candidateSha : '',
    schemaVersion: SCHEMA_VERSION.test(schemaVersion) ? schemaVersion : '',
    verified: Boolean(baseVerified && (environment !== 'STAGING' || SCHEMA_VERSION.test(schemaVersion))),
  });
}

export function setRuntimeReleaseIdentity(value) {
  current = normalizeReleaseIdentity(value);
  return current;
}

export function getRuntimeReleaseIdentity() {
  return current;
}

export function releaseIdentityLabel(identity = current) {
  const normalized = normalizeReleaseIdentity(identity);
  if (!normalized.verified) return 'Environment unavailable · release not verified';
  if (STAGING_BANNER_ENABLED && normalized.environment === 'STAGING') {
    return `STAGING TEST ENV · v${normalized.appVersion} · SHA ${normalized.candidateSha.slice(0, 12)} · schema ${normalized.schemaVersion}`;
  }
  return `${ENVIRONMENT_LABELS[normalized.environment]} · v${normalized.appVersion}`;
}
