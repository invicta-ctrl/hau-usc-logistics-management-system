import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASE3_ACTION_GATES = Object.freeze({
  B: ['cloudflareRead', 'googleRead'],
  C: ['d1Backup', 'd1Migration', 'sheetExport', 'd1Import', 'stagingSecretSetup'],
  D: ['workerDeploy'],
  E: ['syntheticWorkflowWrites', 'evidenceUploads', 'rollbackRehearsal'],
  F: ['cleanupOrRetention'],
});

const DECISIONS = new Set(['APPROVED', 'DENIED', 'PENDING']);
const PLACEHOLDER = /^(?:<.*>|REPLACE(?:_|\b)|TBD\b|TODO\b|UNKNOWN\b|PENDING(?:_|\b))/i;
const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fileSha256 = async (file) => sha256(await readFile(file));

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function candidateEvidence() {
  const migrationNames = (await readdir(path.join(repoRoot, 'migrations')))
    .filter((name) => name.endsWith('.sql'))
    .sort();
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
  const workerFiles = [
    ...(await sourceFiles(path.join(repoRoot, 'src', 'domain'))),
    ...(await sourceFiles(path.join(repoRoot, 'src', 'server'))),
    ...(await sourceFiles(path.join(repoRoot, 'src', 'worker'))),
    path.join(repoRoot, 'wrangler.jsonc'),
    path.join(repoRoot, 'migration', 'google-sheets-to-d1.v1.json'),
    ...migrationNames.map((name) => path.join(repoRoot, 'migrations', name)),
  ];
  const workerSource = (await Promise.all(workerFiles.sort().map((file) => readFile(file))))
    .map((value) => value.toString('utf8'))
    .join('\n--FILE--\n');
  return {
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
    sha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
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

export async function createPhase3AuthorizationTemplate() {
  const actions = Object.fromEntries(
    Object.values(PHASE3_ACTION_GATES).flat().map((action) => [action, 'PENDING']),
  );
  return {
    schemaVersion: 1,
    candidate: await candidateEvidence(),
    authorization: {
      ownerLabel: '<REPLACE_PRIVATELY>',
      operatorLabel: '<REPLACE_PRIVATELY>',
      approvalReferenceLabel: '<REPLACE_PRIVATELY>',
      approvedAt: '<REPLACE_PRIVATELY>',
      actions,
    },
    target: {
      environment: 'STAGING',
      confirmsNoProductionBindings: false,
      privateWranglerConfigPath: '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>',
      privateGoogleConfigPath: '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>',
      cloudflareAccountLabel: '<REPLACE_PRIVATELY>',
      workerLabel: '<REPLACE_PRIVATELY>',
      d1Label: '<REPLACE_PRIVATELY>',
      routeLabel: '<REPLACE_PRIVATELY>',
      rollbackVersionLabel: '<REPLACE_PRIVATELY>',
      googleOperatorLabel: '<REPLACE_PRIVATELY>',
      workbookLabel: '<REPLACE_PRIVATELY>',
      snapshotLabel: '<REPLACE_PRIVATELY>',
      driveMappingsLabel: '<REPLACE_PRIVATELY>',
    },
    fixture: {
      namespaceLabel: '<REPLACE_PRIVATELY>',
      dataClassification: 'SYNTHETIC',
      containsNoPersonalOrSupplierData: false,
      allowedMutationsLabel: '<REPLACE_PRIVATELY>',
    },
    window: {
      startsAt: '<REPLACE_PRIVATELY>',
      endsAt: '<REPLACE_PRIVATELY>',
      stopAuthorityLabel: '<REPLACE_PRIVATELY>',
      incidentContactLabel: '<REPLACE_PRIVATELY>',
    },
    evidence: {
      privateLocationLabel: '<REPLACE_PRIVATELY>',
      redactionRuleLabel: '<REPLACE_PRIVATELY>',
      privateValuesExcludedFromRepositoryEvidence: false,
    },
  };
}

const completedText = (value) =>
  typeof value === 'string' && Boolean(value.trim()) && !PLACEHOLDER.test(value.trim());

const valueAt = (source, dottedPath) =>
  dottedPath.split('.').reduce((value, key) => value?.[key], source);

export async function validatePhase3AuthorizationPackage(
  source,
  { packagePath, currentCandidate } = {},
) {
  currentCandidate ??= await candidateEvidence();
  const issues = [];
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { valid: false, issues: ['package must be a JSON object'], authorizedThroughGate: 'NONE' };
  }
  if (source.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (JSON.stringify(source.candidate) !== JSON.stringify(currentCandidate)) {
    issues.push('candidate must match the current branch, SHA, artifact, Worker source, and migrations');
  }
  for (const field of [
    'authorization.ownerLabel',
    'authorization.operatorLabel',
    'authorization.approvalReferenceLabel',
    'target.cloudflareAccountLabel',
    'target.workerLabel',
    'target.d1Label',
    'target.routeLabel',
    'target.rollbackVersionLabel',
    'target.googleOperatorLabel',
    'target.workbookLabel',
    'target.snapshotLabel',
    'target.driveMappingsLabel',
    'fixture.namespaceLabel',
    'fixture.allowedMutationsLabel',
    'window.stopAuthorityLabel',
    'window.incidentContactLabel',
    'evidence.privateLocationLabel',
    'evidence.redactionRuleLabel',
  ]) {
    if (!completedText(valueAt(source, field))) issues.push(`${field} must contain a completed private value or safe label`);
  }
  for (const field of ['authorization.approvedAt', 'window.startsAt', 'window.endsAt']) {
    if (Number.isNaN(Date.parse(valueAt(source, field)))) issues.push(`${field} must be an ISO date-time`);
  }
  if (source.target?.environment !== 'STAGING') issues.push('target.environment must be STAGING');
  if (source.target?.confirmsNoProductionBindings !== true) issues.push('target.confirmsNoProductionBindings must be true');
  if (!['SYNTHETIC', 'APPROVED_REDACTED'].includes(source.fixture?.dataClassification)) {
    issues.push('fixture.dataClassification must be SYNTHETIC or APPROVED_REDACTED');
  }
  if (source.fixture?.containsNoPersonalOrSupplierData !== true) {
    issues.push('fixture.containsNoPersonalOrSupplierData must be true');
  }
  if (source.evidence?.privateValuesExcludedFromRepositoryEvidence !== true) {
    issues.push('evidence.privateValuesExcludedFromRepositoryEvidence must be true');
  }
  const start = Date.parse(source.window?.startsAt);
  const end = Date.parse(source.window?.endsAt);
  if (!Number.isNaN(start) && !Number.isNaN(end) && start >= end) {
    issues.push('window.endsAt must be after window.startsAt');
  }
  for (const field of ['target.privateWranglerConfigPath', 'target.privateGoogleConfigPath']) {
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
    else if (isInside(repoRoot, packagePath)) issues.push('authorization package must remain outside the repository');
  }
  const decisions = source.authorization?.actions ?? {};
  for (const action of Object.values(PHASE3_ACTION_GATES).flat()) {
    if (!DECISIONS.has(decisions[action])) {
      issues.push(`authorization.actions.${action} must be APPROVED, DENIED, or PENDING`);
    }
  }
  let authorizedThroughGate = issues.length ? 'NONE' : 'A';
  if (!issues.length) {
    for (const [gate, actions] of Object.entries(PHASE3_ACTION_GATES)) {
      if (!actions.every((action) => decisions[action] === 'APPROVED')) break;
      authorizedThroughGate = gate;
    }
  }
  const pendingActions = Object.values(PHASE3_ACTION_GATES).flat().filter((action) => decisions[action] !== 'APPROVED');
  return {
    valid: issues.length === 0,
    issues,
    authorizedThroughGate,
    warnings: issues.length || !pendingActions.length ? [] : [`external actions not approved: ${pendingActions.join(', ')}`],
  };
}

async function run() {
  const [command, rawPath] = process.argv.slice(2);
  if (!['init', 'check'].includes(command) || !rawPath) {
    throw new Error('Usage: node scripts/phase3-staging-authorization.mjs <init|check> <absolute-private-json-path>');
  }
  const packagePath = path.resolve(rawPath);
  if (isInside(repoRoot, packagePath)) throw new Error('The private authorization package must remain outside the repository.');
  if (command === 'init') {
    const destination = path.join(await realpath(path.dirname(packagePath)), path.basename(packagePath));
    await writeFile(destination, `${JSON.stringify(await createPhase3AuthorizationTemplate(), null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    console.log('Phase 3 private authorization template created outside the repository.');
    return;
  }
  const resolved = await realpath(packagePath);
  const source = JSON.parse(await readFile(resolved, 'utf8'));
  const result = await validatePhase3AuthorizationPackage(source, { packagePath: resolved });
  if (!result.valid) {
    console.error('Phase 3 authorization package: INVALID');
    result.issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }
  console.log('Phase 3 authorization package: VALID');
  console.log(`Authorized external sequence: through Gate ${result.authorizedThroughGate}`);
  result.warnings.forEach((warning) => console.log(`- ${warning}`));
  console.log('No private target values were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(
      error instanceof SyntaxError ? 'Phase 3 authorization package is not valid JSON.' : error.message,
    );
    process.exitCode = 1;
  });
}
