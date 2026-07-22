import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_ACTIONS = Object.freeze([
  'productionBackup',
  'productionD1Migration',
  'productionWorkerDeploy',
  'productionSheetCutover',
  'productionSeedAccounts',
  'productionSmokeMutations',
  'productionRollback',
  'productionClosure',
]);

const DECISIONS = new Set(['APPROVED', 'DENIED', 'PENDING']);
const PLACEHOLDER = /^(?:<.*>|REPLACE(?:_|\b)|TBD\b|TODO\b|UNKNOWN\b|PENDING(?:_|\b))/iu;
const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fileSha256 = async (file) => sha256(await readFile(file));

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(resolved)));
    else if (entry.isFile() && /\.(?:js|json)$/u.test(entry.name)) files.push(resolved);
  }
  return files;
}

export async function productionCandidateEvidence({ requireRepositoryReady = true } = {}) {
  if (requireRepositoryReady) {
    if (git(['status', '--short'])) {
      throw new Error('Production authorization requires a clean working tree.');
    }
    let upstream;
    try {
      upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
    } catch {
      throw new Error('Production authorization requires a configured upstream branch.');
    }
    const [behind, ahead] = git(['rev-list', '--left-right', '--count', `HEAD...${upstream}`])
      .split(/\s+/u)
      .map(Number);
    if (behind !== 0 || ahead !== 0) {
      throw new Error('Production authorization requires local HEAD and upstream to match.');
    }
  }

  const migrationNames = (await readdir(path.join(repoRoot, 'migrations')))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const workerFiles = [
    ...(await sourceFiles(path.join(repoRoot, 'src', 'domain'))),
    ...(await sourceFiles(path.join(repoRoot, 'src', 'server'))),
    ...(await sourceFiles(path.join(repoRoot, 'src', 'worker'))),
    path.join(repoRoot, 'wrangler.jsonc'),
  ].sort();
  const workerSource = (await Promise.all(workerFiles.map((file) => readFile(file))))
    .map((value) => value.toString('utf8'))
    .join('\n--FILE--\n');
  return {
    branch: git(['branch', '--show-current']),
    releaseSha: git(['rev-parse', 'HEAD']),
    distSha256: await fileSha256(path.join(repoRoot, 'dist', 'index.html')),
    workerSourceSha256: sha256(workerSource),
    googleMappingSha256: await fileSha256(path.join(repoRoot, 'migration', 'google-sheets-to-d1.v1.json')),
    migrationHashes: Object.fromEntries(
      await Promise.all(
        migrationNames.map(async (name) => [name, await fileSha256(path.join(repoRoot, 'migrations', name))]),
      ),
    ),
  };
}

export async function createProductionAuthorizationTemplate(candidate) {
  const boundCandidate = candidate ?? (await productionCandidateEvidence());
  return {
    schemaVersion: 1,
    candidate: structuredClone(boundCandidate),
    authorization: {
      ownerLabel: '<REPLACE_PRIVATELY>',
      operatorLabel: '<REPLACE_PRIVATELY>',
      approvalReferenceLabel: '<REPLACE_PRIVATELY>',
      approvedAt: '<REPLACE_PRIVATELY>',
      actions: Object.fromEntries(PRODUCTION_ACTIONS.map((action) => [action, 'PENDING'])),
    },
    target: {
      environment: 'PRODUCTION',
      confirmsProductionResourcesDistinctFromStaging: false,
      privateWranglerConfigPath: '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>',
      privateGoogleConfigPath: '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>',
      privateBackupManifestPath: '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>',
      cloudflareAccountLabel: '<REPLACE_PRIVATELY>',
      workerLabel: '<REPLACE_PRIVATELY>',
      d1Label: '<REPLACE_PRIVATELY>',
      routeLabel: '<REPLACE_PRIVATELY>',
      workbookLabel: '<REPLACE_PRIVATELY>',
      driveMappingsLabel: '<REPLACE_PRIVATELY>',
      productionBackupLabel: '<REPLACE_PRIVATELY>',
      rollbackTargetLabel: '<REPLACE_PRIVATELY>',
    },
    acceptance: {
      finalStagingEvidenceLabel: '<REPLACE_PRIVATELY>',
      authenticationAcceptanceLabel: '<REPLACE_PRIVATELY>',
      accessManagementAcceptanceLabel: '<REPLACE_PRIVATELY>',
      rollbackRehearsalLabel: '<REPLACE_PRIVATELY>',
      migrationReconciliationLabel: '<REPLACE_PRIVATELY>',
      securityPrivacyReview: 'PENDING',
      migrationRecoveryReview: 'PENDING',
      zeroOpenP0P1: false,
      artifactHashesConfirmed: false,
    },
    launch: {
      approvedSeedAccountsLabel: '<REPLACE_PRIVATELY>',
      approvedSmokeMutationsLabel: '<REPLACE_PRIVATELY>',
      smokeDataClassification: 'SYNTHETIC',
      rollbackTriggersLabel: '<REPLACE_PRIVATELY>',
      incidentTriggersLabel: '<REPLACE_PRIVATELY>',
      evidenceRetentionLabel: '<REPLACE_PRIVATELY>',
    },
    window: {
      startsAt: '<REPLACE_PRIVATELY>',
      endsAt: '<REPLACE_PRIVATELY>',
      stopAuthorityLabel: '<REPLACE_PRIVATELY>',
      incidentContactLabel: '<REPLACE_PRIVATELY>',
    },
    privacy: {
      privateEvidenceLocationLabel: '<REPLACE_PRIVATELY>',
      redactionRuleLabel: '<REPLACE_PRIVATELY>',
      privateValuesExcludedFromRepositoryEvidence: false,
      credentialAndIdentifierHandlingConfirmed: false,
    },
  };
}

const valueAt = (source, dottedPath) => dottedPath.split('.').reduce((value, key) => value?.[key], source);

function completedText(value) {
  return typeof value === 'string' && Boolean(value.trim()) && !PLACEHOLDER.test(value.trim());
}

export async function validateProductionAuthorizationPackage(
  source,
  { packagePath, currentCandidate, now = Date.now() } = {},
) {
  currentCandidate ??= await productionCandidateEvidence();
  const issues = [];
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {
      valid: false,
      launchAuthorized: false,
      windowActive: false,
      issues: ['package must be a JSON object'],
      warnings: [],
    };
  }
  if (source.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (JSON.stringify(source.candidate) !== JSON.stringify(currentCandidate)) {
    issues.push('candidate must match the current release SHA and all bound hashes');
  }
  for (const field of [
    'authorization.ownerLabel',
    'authorization.operatorLabel',
    'authorization.approvalReferenceLabel',
    'target.cloudflareAccountLabel',
    'target.workerLabel',
    'target.d1Label',
    'target.routeLabel',
    'target.workbookLabel',
    'target.driveMappingsLabel',
    'target.productionBackupLabel',
    'target.rollbackTargetLabel',
    'acceptance.finalStagingEvidenceLabel',
    'acceptance.authenticationAcceptanceLabel',
    'acceptance.accessManagementAcceptanceLabel',
    'acceptance.rollbackRehearsalLabel',
    'acceptance.migrationReconciliationLabel',
    'launch.approvedSeedAccountsLabel',
    'launch.approvedSmokeMutationsLabel',
    'launch.rollbackTriggersLabel',
    'launch.incidentTriggersLabel',
    'launch.evidenceRetentionLabel',
    'window.stopAuthorityLabel',
    'window.incidentContactLabel',
    'privacy.privateEvidenceLocationLabel',
    'privacy.redactionRuleLabel',
  ]) {
    if (!completedText(valueAt(source, field))) {
      issues.push(`${field} must contain a completed private value or safe label`);
    }
  }
  for (const field of ['authorization.approvedAt', 'window.startsAt', 'window.endsAt']) {
    if (Number.isNaN(Date.parse(valueAt(source, field)))) issues.push(`${field} must be an ISO date-time`);
  }
  if (source.target?.environment !== 'PRODUCTION') issues.push('target.environment must be PRODUCTION');
  if (source.target?.confirmsProductionResourcesDistinctFromStaging !== true) {
    issues.push('target.confirmsProductionResourcesDistinctFromStaging must be true');
  }
  if (source.acceptance?.securityPrivacyReview !== 'PASS') {
    issues.push('acceptance.securityPrivacyReview must be PASS');
  }
  if (source.acceptance?.migrationRecoveryReview !== 'PASS') {
    issues.push('acceptance.migrationRecoveryReview must be PASS');
  }
  for (const field of [
    'acceptance.zeroOpenP0P1',
    'acceptance.artifactHashesConfirmed',
    'privacy.privateValuesExcludedFromRepositoryEvidence',
    'privacy.credentialAndIdentifierHandlingConfirmed',
  ]) {
    if (valueAt(source, field) !== true) issues.push(`${field} must be explicitly true`);
  }
  if (!['SYNTHETIC', 'APPROVED_REDACTED'].includes(source.launch?.smokeDataClassification)) {
    issues.push('launch.smokeDataClassification must be SYNTHETIC or APPROVED_REDACTED');
  }
  for (const field of [
    'target.privateWranglerConfigPath',
    'target.privateGoogleConfigPath',
    'target.privateBackupManifestPath',
  ]) {
    const file = valueAt(source, field);
    if (!path.isAbsolute(String(file ?? '')) || PLACEHOLDER.test(String(file ?? ''))) {
      issues.push(`${field} must be a completed absolute path`);
      continue;
    }
    try {
      const resolved = await realpath(file);
      if (isInside(repoRoot, resolved)) issues.push(`${field} must resolve outside the repository`);
      if (!(await stat(resolved)).isFile()) issues.push(`${field} must identify a file`);
    } catch {
      issues.push(`${field} does not exist`);
    }
  }
  if (packagePath) {
    if (!path.isAbsolute(packagePath)) issues.push('authorization package path must be absolute');
    else if (isInside(repoRoot, packagePath)) {
      issues.push('authorization package must remain outside the repository');
    }
  }

  const decisions = source.authorization?.actions ?? {};
  for (const action of PRODUCTION_ACTIONS) {
    if (!DECISIONS.has(decisions[action])) {
      issues.push(`authorization.actions.${action} must be APPROVED, DENIED, or PENDING`);
    }
  }
  const start = Date.parse(source.window?.startsAt);
  const end = Date.parse(source.window?.endsAt);
  if (!Number.isNaN(start) && !Number.isNaN(end) && start >= end) {
    issues.push('window.endsAt must be after window.startsAt');
  }
  const valid = issues.length === 0;
  const pendingActions = PRODUCTION_ACTIONS.filter((action) => decisions[action] !== 'APPROVED');
  const windowActive = valid && now >= start && now <= end;
  const launchAuthorized = valid && pendingActions.length === 0 && windowActive;
  const warnings = [];
  if (valid && pendingActions.length)
    warnings.push(`production actions not approved: ${pendingActions.join(', ')}`);
  if (valid && !windowActive) warnings.push('the approved production launch window is not active');
  return { valid, launchAuthorized, windowActive, issues, warnings };
}

class SafeCliError extends Error {}

async function run() {
  const [command, rawPath] = process.argv.slice(2);
  if (!['init', 'check'].includes(command) || !rawPath) {
    throw new SafeCliError(
      'Usage: node scripts/production-authorization.mjs <init|check> <absolute-private-json-path>',
    );
  }
  if (!path.isAbsolute(rawPath)) {
    throw new SafeCliError('The private production authorization package path must be absolute.');
  }
  const packagePath = path.resolve(rawPath);
  if (isInside(repoRoot, packagePath)) {
    throw new SafeCliError(
      'The private production authorization package must remain outside the repository.',
    );
  }
  if (command === 'init') {
    const destination = path.join(await realpath(path.dirname(packagePath)), path.basename(packagePath));
    await writeFile(
      destination,
      `${JSON.stringify(await createProductionAuthorizationTemplate(), null, 2)}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    console.log('Private production authorization template created outside the repository.');
    return;
  }
  const resolved = await realpath(packagePath);
  const source = JSON.parse(await readFile(resolved, 'utf8'));
  const result = await validateProductionAuthorizationPackage(source, { packagePath: resolved });
  if (!result.valid || !result.launchAuthorized) {
    console.error('Production authorization package: NOT AUTHORIZED');
    result.issues.forEach((issue) => console.error(`- ${issue}`));
    result.warnings.forEach((warning) => console.error(`- ${warning}`));
    process.exitCode = 1;
    return;
  }
  console.log('Production authorization package: AUTHORIZED FOR THE ACTIVE WINDOW');
  console.log('No private target values were printed.');
}

function safeCliError(error) {
  if (error instanceof SafeCliError) return error.message;
  if (error instanceof SyntaxError) return 'Production authorization package is not valid JSON.';
  if (error?.code === 'EEXIST') return 'Refusing to overwrite an existing authorization package.';
  if (error?.code === 'ENOENT') return 'Authorization package path or destination directory does not exist.';
  if (error?.code === 'EACCES' || error?.code === 'EPERM') {
    return 'Authorization package path is not accessible to the current operator.';
  }
  return error?.message?.startsWith('Production authorization requires')
    ? error.message
    : 'Production authorization workflow failed without exposing private details.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(safeCliError(error));
    process.exitCode = 1;
  });
}
