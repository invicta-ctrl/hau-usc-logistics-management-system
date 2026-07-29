import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnvironmentSeparation } from './cloudflare-environment-preflight.mjs';
import {
  productionCandidateEvidence,
  validateProductionAuthorizationPackage,
} from './production-authorization.mjs';

const SHA256 = /^[0-9a-f]{64}$/iu;
const REQUIRED_SECRETS = Object.freeze([
  'PASSWORD_PEPPER',
  'TRACKING_LINK_SECRET',
  'PROTECTED_PROFILE_ENCRYPTION_KEY',
  'ROSTER_DATA_ENCRYPTION_KEY',
]);

export async function validateProductionLaunchPreflight({
  authorization,
  authorizationPath,
  currentCandidate,
  stagingConfig,
  productionConfig,
  productionSecrets,
  googleConfig,
  backupManifest,
  now = Date.now(),
} = {}) {
  const issues = [];
  const authResult = await validateProductionAuthorizationPackage(authorization, {
    packagePath: authorizationPath,
    currentCandidate,
    now,
  });
  issues.push(...authResult.issues.map((issue) => `authorization: ${issue}`));

  const separation = validateEnvironmentSeparation(stagingConfig ?? {}, productionConfig ?? {}, {
    expectedSha: currentCandidate?.releaseSha,
  });
  issues.push(...separation.issues.map((issue) => `environment: ${issue}`));

  if (productionSecrets?.schemaVersion !== 1) issues.push('secrets: schemaVersion must be 1');
  if (productionSecrets?.environment !== 'PRODUCTION') {
    issues.push('secrets: environment must be PRODUCTION');
  }
  const secretValues = [];
  for (const name of REQUIRED_SECRETS) {
    const value = productionSecrets?.secrets?.[name];
    if (typeof value !== 'string' || value.length < 32)
      issues.push(`secrets: ${name} is missing or malformed`);
    else secretValues.push(value);
  }
  if (new Set(secretValues).size !== secretValues.length) {
    issues.push('secrets: protected production secret values must be distinct');
  }

  if (googleConfig?.schemaVersion !== 1) issues.push('google: schemaVersion must be 1');
  if (googleConfig?.environment !== 'PRODUCTION') issues.push('google: environment must be PRODUCTION');
  if (googleConfig?.confirmsDistinctFromStaging !== true) {
    issues.push('google: production configuration must be confirmed distinct from staging');
  }
  if (!['PREPARED', 'CONFIGURED'].includes(googleConfig?.roster?.status)) {
    issues.push('google: roster status must be PREPARED or CONFIGURED');
  }
  if (googleConfig?.roster?.sourceAccess !== 'READ_ONLY') {
    issues.push('google: roster source access must be READ_ONLY');
  }
  if (googleConfig?.roster?.privateKeySecretName !== 'GOOGLE_ROSTER_PRIVATE_KEY') {
    issues.push('google: roster private key must remain in the protected provider secret');
  }
  if (
    googleConfig?.emailVerification?.status === 'NOT_CONFIGURED' &&
    googleConfig?.emailVerification?.operational !== false
  ) {
    issues.push('google: unconfigured email verification must not be marked operational');
  }

  if (backupManifest?.environment !== 'PRODUCTION') issues.push('backup: environment must be PRODUCTION');
  if (!Array.isArray(backupManifest?.integrity) || backupManifest.integrity.join(',') !== 'ok') {
    issues.push('backup: integrity must be ok');
  }
  if (Number(backupManifest?.foreignKeyViolations) !== 0) {
    issues.push('backup: foreign-key violations must be zero');
  }
  if (backupManifest?.bookmarkPresent !== true) issues.push('backup: Time Travel bookmark is required');
  if (!SHA256.test(String(backupManifest?.exportSha256 ?? ''))) {
    issues.push('backup: export SHA-256 is missing or malformed');
  }
  if (backupManifest?.testDataPromotionConfirmed !== false) {
    issues.push('backup: test-only data promotion must be explicitly false');
  }
  if (Number(backupManifest?.syntheticActiveAccounts) !== 0) {
    issues.push('backup: active synthetic production accounts must be zero before launch');
  }
  const capturedAt = Date.parse(backupManifest?.capturedAt);
  if (Number.isNaN(capturedAt) || Math.abs(now - capturedAt) > 24 * 60 * 60 * 1000) {
    issues.push('backup: production export and bookmark must be less than 24 hours old');
  }

  return {
    valid: issues.length === 0,
    launchAuthorized: issues.length === 0 && authResult.launchAuthorized,
    windowActive: authResult.windowActive,
    issues,
    warnings: authResult.warnings,
  };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function run() {
  const [authorizationPath, stagingPath, secretsPath] = process.argv.slice(2);
  if (![authorizationPath, stagingPath, secretsPath].every((file) => path.isAbsolute(String(file ?? '')))) {
    throw new Error(
      'Usage: node scripts/production-launch-preflight.mjs <absolute-authorization> <absolute-staging-config> <absolute-production-secrets>',
    );
  }
  const authorization = await readJson(authorizationPath);
  const [currentCandidate, stagingConfig, productionConfig, productionSecrets, googleConfig, backupManifest] =
    await Promise.all([
      productionCandidateEvidence(),
      readJson(stagingPath),
      readJson(authorization.target.privateWranglerConfigPath),
      readJson(secretsPath),
      readJson(authorization.target.privateGoogleConfigPath),
      readJson(authorization.target.privateBackupManifestPath),
    ]);
  const result = await validateProductionLaunchPreflight({
    authorization,
    authorizationPath,
    currentCandidate,
    stagingConfig,
    productionConfig,
    productionSecrets,
    googleConfig,
    backupManifest,
  });
  if (!result.valid || !result.launchAuthorized) {
    console.error('Production launch preflight: NOT AUTHORIZED');
    result.issues.forEach((issue) => console.error(`- ${issue}`));
    result.warnings.forEach((warning) => console.error(`- ${warning}`));
    process.exitCode = 1;
    return;
  }
  console.log('Production launch preflight: AUTHORIZED FOR THE ACTIVE WINDOW');
  console.log(
    'Resource separation, private secrets, Google truth, backup freshness, and negative boundaries passed.',
  );
  console.log('No private target values or secret values were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error?.code === 'ENOENT' ? 'Production launch preflight input is missing.' : error.message);
    process.exitCode = 1;
  });
}
