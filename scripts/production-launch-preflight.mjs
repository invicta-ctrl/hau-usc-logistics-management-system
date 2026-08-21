import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnvironmentSeparation } from './cloudflare-environment-preflight.mjs';
import {
  productionCandidateEvidence,
  validateProductionAuthorizationPackage,
} from './production-authorization.mjs';
import { resolvePrivatePath } from './private-path.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const SHA256 = /^[0-9a-f]{64}$/iu;
const PLACEHOLDER = /^(?:<.*>|REPLACE(?:_|\b)|TBD\b|TODO\b|UNKNOWN\b|PENDING(?:_|\b))/iu;
export const REQUIRED_PROTECTED_PRODUCTION_SECRET_NAMES = Object.freeze([
  'PASSWORD_PEPPER',
  'TRACKING_LINK_SECRET',
  'PROTECTED_PROFILE_ENCRYPTION_KEY',
  'ROSTER_DATA_ENCRYPTION_KEY',
  'GOOGLE_ROSTER_PRIVATE_KEY',
  'GOOGLE_EVIDENCE_OAUTH_CLIENT_SECRET',
  'GOOGLE_EVIDENCE_OAUTH_REFRESH_TOKEN',
]);
export const REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES = Object.freeze([
  ...REQUIRED_PROTECTED_PRODUCTION_SECRET_NAMES,
  'GOOGLE_EVIDENCE_OAUTH_CLIENT_ID',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  'GOOGLE_DRIVE_RECEIPTS_FOLDER_ID',
  'GOOGLE_DRIVE_CANVASS_FOLDER_ID',
  'GOOGLE_DRIVE_DELIVERABLE_FOLDER_ID',
  'GOOGLE_EVIDENCE_RELEASE_FOLDER_ID',
  'GOOGLE_DRIVE_LENDING_FOLDER_ID',
]);
export const PRODUCTION_WORKER_NAME = 'hau-usc-logistics-production';

const completedPrivateValue = (value, minimumLength = 1) =>
  typeof value === 'string' && value.trim().length >= minimumLength && !PLACEHOLDER.test(value.trim());
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const exactNames = (values, expected) =>
  Array.isArray(values) &&
  values.length === expected.length &&
  new Set(values).size === expected.length &&
  expected.every((name) => values.includes(name));

function deploymentVersionEntries(deployment) {
  const versions = Array.isArray(deployment?.versions) ? deployment.versions : [];
  return versions
    .map((version) => ({
      versionId: String(version?.version_id ?? version?.versionId ?? '').trim(),
      percentage: Number(version?.percentage),
      current: version?.current === true || version?.is_current === true || version?.active === true,
    }))
    .filter((version) => version.versionId);
}

export function selectCurrentProductionDeploymentVersion(deployments) {
  const deploymentRows = Array.isArray(deployments)
    ? deployments
    : Array.isArray(deployments?.result)
      ? deployments.result
      : Array.isArray(deployments?.deployments)
        ? deployments.deployments
        : [];
  const ordered = deploymentRows
    .map((deployment) => ({
      deployment,
      createdAt: Date.parse(deployment?.created_on ?? deployment?.createdOn ?? ''),
    }))
    .filter(({ createdAt }) => Number.isFinite(createdAt))
    .sort((left, right) => right.createdAt - left.createdAt);
  if (ordered.length !== deploymentRows.length || !ordered.length) {
    throw new Error('Current Production deployment timestamp is missing or malformed.');
  }
  if (ordered.length > 1 && ordered[0].createdAt === ordered[1].createdAt) {
    throw new Error('Current Production deployment timestamp is conflicting.');
  }
  const activeVersions = deploymentVersionEntries(ordered[0].deployment).filter(
    (version) => version.current || version.percentage === 100,
  );
  if (activeVersions.length !== 1) {
    throw new Error('Current Production deployment active version identity is missing or conflicting.');
  }
  return activeVersions[0].versionId;
}

function collectNamedEntries(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    value.forEach((item) => collectNamedEntries(item, result));
    return result;
  }
  if (typeof value.name === 'string') result.push(value);
  Object.values(value).forEach((item) => collectNamedEntries(item, result));
  return result;
}

function collectBindings(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    value.forEach((item) => collectBindings(item, result));
    return result;
  }
  if (Array.isArray(value.bindings)) {
    value.bindings.forEach((binding) => {
      if (binding && typeof binding === 'object') result.push(binding);
    });
  }
  Object.values(value).forEach((item) => collectBindings(item, result));
  return result;
}

function readWranglerOutput(wranglerExecutable, args) {
  try {
    return execFileSync(process.execPath, [wranglerExecutable, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  } catch {
    throw new Error('Authenticated Production provider binding inventory could not be read.');
  }
}

function readWranglerJson(wranglerExecutable, args) {
  try {
    return JSON.parse(readWranglerOutput(wranglerExecutable, args));
  } catch {
    throw new Error('Authenticated Production provider binding inventory was malformed.');
  }
}

export function validateProductionProviderBindingInventory({
  productionConfig,
  providerBindingInventory,
} = {}) {
  const issues = [];
  const required = productionConfig?.secrets?.required;
  if (productionConfig?.name !== PRODUCTION_WORKER_NAME) {
    issues.push(`private production config Worker must be ${PRODUCTION_WORKER_NAME}`);
  }
  if (productionConfig?.keep_vars !== true) {
    issues.push('private production config keep_vars must be true to preserve provider-held secret bindings');
  }
  if (!exactNames(required, REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES)) {
    issues.push(
      'private production config secrets.required must contain exactly the required provider binding names',
    );
  }
  if (productionConfig?.vars?.ENVIRONMENT !== 'PRODUCTION') {
    issues.push('private production config environment must be PRODUCTION');
  }
  if (providerBindingInventory?.schemaVersion !== 1) {
    issues.push('provider binding inventory schemaVersion must be 1');
  }
  if (providerBindingInventory?.workerName !== productionConfig?.name) {
    issues.push('provider binding inventory worker does not match the private production config');
  }
  if (providerBindingInventory?.environment !== 'PRODUCTION') {
    issues.push('provider binding inventory environment must be PRODUCTION');
  }
  for (const field of ['accountFingerprint', 'deploymentVersionFingerprint']) {
    if (!SHA256.test(String(providerBindingInventory?.[field] ?? ''))) {
      issues.push(`provider binding inventory ${field} must be a SHA-256 fingerprint`);
    }
  }

  const bindings = providerBindingInventory?.bindings;
  if (!Array.isArray(bindings)) {
    issues.push('provider binding inventory bindings must be an array');
  } else {
    const byName = new Map();
    for (const binding of bindings) {
      if (
        !binding ||
        typeof binding !== 'object' ||
        Object.keys(binding).sort().join(',') !== 'name,type' ||
        typeof binding.name !== 'string' ||
        typeof binding.type !== 'string'
      ) {
        issues.push('provider binding inventory must contain redacted name/type pairs only');
        continue;
      }
      const entries = byName.get(binding.name) ?? [];
      entries.push(binding);
      byName.set(binding.name, entries);
    }
    for (const name of REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES) {
      const entries = byName.get(name) ?? [];
      if (entries.length !== 1 || entries[0]?.type !== 'secret_text') {
        issues.push(`provider binding ${name} must be exactly one secret_text binding`);
      }
    }
  }

  const secretNames = providerBindingInventory?.secretNames;
  if (!Array.isArray(secretNames)) {
    issues.push('provider secret inventory names must be an array');
  } else {
    for (const name of REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES) {
      if (!secretNames.includes(name)) {
        issues.push(`provider secret inventory is missing ${name}`);
      }
    }
  }
  return { valid: issues.length === 0, issues };
}

export function readProductionProviderBindingInventory({ configPath, productionConfig } = {}) {
  if (
    productionConfig?.name !== PRODUCTION_WORKER_NAME ||
    productionConfig?.vars?.ENVIRONMENT !== 'PRODUCTION' ||
    !completedPrivateValue(productionConfig?.account_id)
  ) {
    throw new Error('Private Production Worker identity is incomplete or mismatched.');
  }
  const wranglerExecutable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const whoami = readWranglerOutput(wranglerExecutable, ['whoami']);
  if (!whoami.includes(productionConfig.account_id)) {
    throw new Error('Authenticated account does not attest the private Production Worker account.');
  }
  const deployments = readWranglerJson(wranglerExecutable, [
    'deployments',
    'list',
    '--config',
    configPath,
    '--json',
  ]);
  const versionId = selectCurrentProductionDeploymentVersion(deployments);
  const secretInventory = readWranglerJson(wranglerExecutable, ['secret', 'list', '--config', configPath]);
  const secretNames = new Set(collectNamedEntries(secretInventory).map((entry) => entry.name));
  const versionView = readWranglerJson(wranglerExecutable, [
    'versions',
    'view',
    versionId,
    '--config',
    configPath,
    '--json',
  ]);
  const bindings = collectBindings(versionView)
    .filter((binding) => ['secret_text', 'secret_key'].includes(binding?.type))
    .map((binding) => ({ name: binding.name, type: binding.type }));
  return {
    schemaVersion: 1,
    workerName: productionConfig.name,
    environment: productionConfig.vars.ENVIRONMENT,
    accountFingerprint: sha256(productionConfig.account_id),
    deploymentVersionFingerprint: sha256(versionId),
    secretNames: REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES.filter((name) => secretNames.has(name)),
    bindings,
  };
}

export async function validateProductionLaunchPreflight({
  authorization,
  authorizationPath,
  currentCandidate,
  stagingConfig,
  stagingConfigRaw,
  productionConfig,
  productionConfigRaw,
  providerBindingInventory,
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

  const providerBindings = validateProductionProviderBindingInventory({
    productionConfig,
    providerBindingInventory,
  });
  issues.push(...providerBindings.issues.map((issue) => `provider bindings: ${issue}`));

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
  const rosterBindings = {
    spreadsheetId: productionConfig?.vars?.GOOGLE_ROSTER_SPREADSHEET_ID,
    range: productionConfig?.vars?.GOOGLE_ROSTER_RANGE,
    serviceAccountEmail: productionConfig?.vars?.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL,
  };
  for (const [name, value] of Object.entries(rosterBindings)) {
    if (!completedPrivateValue(value)) {
      issues.push(`google: production roster ${name} must be configured without a placeholder`);
    }
    if (!completedPrivateValue(googleConfig?.roster?.[name])) {
      issues.push(`google: private roster ${name} must be configured without a placeholder`);
    } else if (googleConfig.roster[name] !== value) {
      issues.push(`google: private roster ${name} must match the production Worker binding`);
    }
  }
  if (
    completedPrivateValue(stagingConfig?.vars?.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL) &&
    stagingConfig.vars.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL === rosterBindings.serviceAccountEmail
  ) {
    issues.push('google: production roster reader identity must be distinct from staging');
  }
  if (
    googleConfig?.evidenceDrive?.status !== 'PREPARED' &&
    googleConfig?.evidenceDrive?.status !== 'CONFIGURED'
  ) {
    issues.push('google: production evidence Drive status must be PREPARED or CONFIGURED');
  }
  if (googleConfig?.evidenceDrive?.credentialMode !== 'OAUTH_REFRESH_TOKEN') {
    issues.push('google: production evidence Drive must use the approved OAuth refresh-token mode');
  }
  if (!completedPrivateValue(googleConfig?.evidenceDrive?.folderMapLabel)) {
    issues.push('google: production evidence Drive folder mapping label is required');
  }
  if (
    googleConfig?.evidenceDrive?.status === 'PREPARED' &&
    googleConfig?.evidenceDrive?.operational !== false
  ) {
    issues.push('google: prepared evidence Drive must not be marked operational before deployment');
  }
  if (
    googleConfig?.evidenceDrive?.status === 'CONFIGURED' &&
    googleConfig?.evidenceDrive?.operational !== true
  ) {
    issues.push('google: configured evidence Drive must be marked operational');
  }
  if (
    googleConfig?.emailVerification?.status === 'NOT_CONFIGURED' &&
    googleConfig?.emailVerification?.operational !== false
  ) {
    issues.push('google: unconfigured email verification must not be marked operational');
  }

  if (backupManifest?.environment !== 'PRODUCTION') issues.push('backup: environment must be PRODUCTION');
  if (backupManifest?.candidateSha !== currentCandidate?.releaseSha) {
    issues.push('backup: candidate SHA must match the exact accepted release SHA');
  }
  if (backupManifest?.candidateBranch !== currentCandidate?.branch) {
    issues.push('backup: candidate branch must match the exact accepted release branch');
  }
  if (
    typeof stagingConfigRaw !== 'string' ||
    backupManifest?.fingerprints?.stagingConfigSha256 !== sha256(stagingConfigRaw)
  ) {
    issues.push('backup: staging config fingerprint must match the exact preflight input');
  }
  if (
    typeof productionConfigRaw !== 'string' ||
    backupManifest?.fingerprints?.productionConfigSha256 !== sha256(productionConfigRaw)
  ) {
    issues.push('backup: production config fingerprint must match the exact preflight input');
  }
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
  const [authorizationPath, stagingPath] = process.argv.slice(2);
  if (![authorizationPath, stagingPath].every((file) => path.isAbsolute(String(file ?? '')))) {
    throw new Error(
      'Usage: node scripts/production-launch-preflight.mjs <absolute-authorization> <absolute-staging-config>',
    );
  }
  const [resolvedAuthorizationPath, resolvedStagingPath] = await Promise.all([
    resolvePrivatePath(authorizationPath, {
      repoRoot,
      label: 'Production authorization package',
      kind: 'file',
    }),
    resolvePrivatePath(stagingPath, {
      repoRoot,
      label: 'Private staging config',
      kind: 'file',
    }),
  ]);
  const authorization = await readJson(resolvedAuthorizationPath);
  const [productionConfigPath, googleConfigPath, backupManifestPath] = await Promise.all([
    resolvePrivatePath(authorization.target?.privateWranglerConfigPath, {
      repoRoot,
      label: 'Private production config',
      kind: 'file',
    }),
    resolvePrivatePath(authorization.target?.privateGoogleConfigPath, {
      repoRoot,
      label: 'Private production Google config',
      kind: 'file',
    }),
    resolvePrivatePath(authorization.target?.privateBackupManifestPath, {
      repoRoot,
      label: 'Private production backup manifest',
      kind: 'file',
    }),
  ]);
  const [currentCandidate, stagingConfigRaw, productionConfigRaw, googleConfig, backupManifest] =
    await Promise.all([
      productionCandidateEvidence(),
      readFile(resolvedStagingPath, 'utf8'),
      readFile(productionConfigPath, 'utf8'),
      readJson(googleConfigPath),
      readJson(backupManifestPath),
    ]);
  const stagingConfig = JSON.parse(stagingConfigRaw);
  const productionConfig = JSON.parse(productionConfigRaw);
  const providerBindingInventory = readProductionProviderBindingInventory({
    configPath: productionConfigPath,
    productionConfig,
  });
  const result = await validateProductionLaunchPreflight({
    authorization,
    authorizationPath: resolvedAuthorizationPath,
    currentCandidate,
    stagingConfig,
    stagingConfigRaw,
    productionConfig,
    productionConfigRaw,
    providerBindingInventory,
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
    'Resource separation, provider-held secret bindings, Google truth, backup freshness, and negative boundaries passed.',
  );
  console.log('No private target values or secret values were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    void error;
    console.error('Production launch preflight failed: PRIVATE_INPUT_OR_AUTHORIZATION_ERROR');
    process.exitCode = 1;
  });
}
