import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ACTION_GATES = Object.freeze({
  B: ['remoteSourceStatusReads'],
  C: ['backupCreation', 'additiveSchemaSetup', 'triggerSetup', 'migrationDryRun'],
  D: ['fixtureAccessSeeding', 'testDeployment'],
  E: ['syntheticWorkflowWrites', 'evidenceUploads', 'rollbackRehearsal'],
  F: ['cleanupOrRetention'],
});

export const DRIVE_MAPPING_KEYS = Object.freeze([
  'root',
  'receipts',
  'canvass',
  'release',
  'deliverable',
  'lending',
  'archive',
]);

export const TESTER_ROLES = Object.freeze([
  'internal',
  'committee',
  'requesterOnly',
  'unauthorized',
  'accessibility',
  'data',
  'deployment',
]);

export const SIGNATORY_ROLES = Object.freeze([
  'business',
  'dataPrivacy',
  'securityAccess',
  'accessibility',
  'deployment',
]);

const EXPECTED = Object.freeze({
  schemaVersion: 1,
  branch: 'integration/v0.5-baseline',
  implementationCommit: 'a563f2f179b710ac7c0d46a8af05a4349a5e625b',
  evidenceCommit: '569d2a787585dbdf68d68c1da1d5440a18a2540a',
  standaloneSha256: 'b65d717f22fd085acaa19d847ca827964f891374e1a03b9d0578add5ba833580',
  appsScriptIndexSha256: 'bf52d20bbbc8d2a35b39351500edf7c65db93ab2dbddb18cd77c1587389d6035',
  appsScriptBundleSha256: 'a35f25e5f3c4ca2ccd8922434ea72cfa8776d449fd9850da6129bfe77bc04645',
});

const PLACEHOLDER = /^(?:<.*>|REPLACE(?:_|\b)|TBD\b|TODO\b|UNKNOWN\b|PENDING(?:_|\b))/i;
const DECISIONS = new Set(['APPROVED', 'DENIED', 'PENDING']);

function valueAt(source, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], source);
}

function requireText(source, dottedPath, issues) {
  const value = valueAt(source, dottedPath);
  if (typeof value !== 'string' || !value.trim() || PLACEHOLDER.test(value.trim())) {
    issues.push(`${dottedPath} must contain a completed private value or safe label`);
  }
}

function isCompletedText(value) {
  return typeof value === 'string' && Boolean(value.trim()) && !PLACEHOLDER.test(value.trim());
}

function requireTrue(source, dottedPath, issues) {
  if (valueAt(source, dottedPath) !== true) issues.push(`${dottedPath} must be explicitly true`);
}

function requireIsoDate(source, dottedPath, issues) {
  const value = valueAt(source, dottedPath);
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value))) {
    issues.push(`${dottedPath} must be an ISO date or date-time`);
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function createAuthorizationTemplate(privateClaspConfigPath = '<REPLACE_WITH_ABSOLUTE_PRIVATE_PATH>') {
  const mappings = Object.fromEntries(
    DRIVE_MAPPING_KEYS.map((key) => [key, { label: '<REPLACE_PRIVATELY>', confirmedRestricted: false }]),
  );
  const testers = Object.fromEntries(TESTER_ROLES.map((role) => [role, '<REPLACE_PRIVATELY>']));
  const signatories = Object.fromEntries(SIGNATORY_ROLES.map((role) => [role, '<REPLACE_PRIVATELY>']));
  const actions = Object.fromEntries(
    Object.values(ACTION_GATES)
      .flat()
      .map((action) => [action, 'PENDING']),
  );

  return {
    schemaVersion: EXPECTED.schemaVersion,
    candidate: {
      branch: EXPECTED.branch,
      implementationCommit: EXPECTED.implementationCommit,
      evidenceCommit: EXPECTED.evidenceCommit,
      standaloneSha256: EXPECTED.standaloneSha256,
      appsScriptIndexSha256: EXPECTED.appsScriptIndexSha256,
      appsScriptBundleSha256: EXPECTED.appsScriptBundleSha256,
    },
    authorization: {
      owner: '<REPLACE_PRIVATELY>',
      operatorAccountLabel: '<REPLACE_PRIVATELY>',
      approvalReferenceLabel: '<REPLACE_PRIVATELY>',
      approvedAt: '<REPLACE_PRIVATELY>',
      actions,
    },
    target: {
      privateClaspConfigPath,
      stagingProjectLabel: '<REPLACE_PRIVATELY>',
      operationalWorkbookLabel: '<REPLACE_PRIVATELY>',
      backupWorkbookLabel: '<REPLACE_PRIVATELY>',
      currentDeploymentLabel: '<REPLACE_PRIVATELY>',
      rollbackVersionLabel: '<REPLACE_PRIVATELY>',
      driveMappings: mappings,
    },
    fixture: {
      versionLabel: '<REPLACE_PRIVATELY>',
      recordNamespace: '<REPLACE_PRIVATELY>',
      dataClassification: 'SYNTHETIC',
      allowedMutationsLabel: '<REPLACE_PRIVATELY>',
      cleanupOrRetentionLabel: '<REPLACE_PRIVATELY>',
      containsNoPersonalOrSupplierData: false,
    },
    people: { testers, signatories },
    window: {
      startsAt: '<REPLACE_PRIVATELY>',
      endsAt: '<REPLACE_PRIVATELY>',
      stopAuthority: '<REPLACE_PRIVATELY>',
      incidentContactLabel: '<REPLACE_PRIVATELY>',
    },
    evidence: {
      privateLocationLabel: '<REPLACE_PRIVATELY>',
      viewerGroupLabel: '<REPLACE_PRIVATELY>',
      redactionRuleLabel: '<REPLACE_PRIVATELY>',
      disposalDate: '<REPLACE_PRIVATELY>',
      privateValuesExcludedFromRepositoryEvidence: false,
    },
    capacity: {
      confirmedBy: '<REPLACE_PRIVATELY>',
      confirmedAt: '<REPLACE_PRIVATELY>',
      storageHeadroomSufficient: false,
    },
    secretHandling: {
      custodian: '<REPLACE_PRIVATELY>',
      localPermissionsConfirmed: false,
      operatorSessionConfirmed: false,
      privateValuesExcludedFromCapturedEvidence: false,
    },
  };
}

export function validateAuthorizationPackage(
  source,
  { repoRoot, packagePath, claspConfigExists = true, claspConfigOutsideRepository = true } = {},
) {
  const issues = [];
  const warnings = [];

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {
      valid: false,
      issues: ['package must be a JSON object'],
      warnings,
      authorizedThroughGate: 'NONE',
    };
  }

  for (const [key, expected] of Object.entries(EXPECTED)) {
    const dottedPath = key === 'schemaVersion' ? key : `candidate.${key}`;
    if (valueAt(source, dottedPath) !== expected)
      issues.push(`${dottedPath} must match the reviewed candidate`);
  }

  for (const field of [
    'authorization.owner',
    'authorization.operatorAccountLabel',
    'authorization.approvalReferenceLabel',
    'target.stagingProjectLabel',
    'target.operationalWorkbookLabel',
    'target.backupWorkbookLabel',
    'target.currentDeploymentLabel',
    'target.rollbackVersionLabel',
    'fixture.versionLabel',
    'fixture.recordNamespace',
    'fixture.allowedMutationsLabel',
    'fixture.cleanupOrRetentionLabel',
    'window.stopAuthority',
    'window.incidentContactLabel',
    'evidence.privateLocationLabel',
    'evidence.viewerGroupLabel',
    'evidence.redactionRuleLabel',
    'capacity.confirmedBy',
    'secretHandling.custodian',
  ]) {
    requireText(source, field, issues);
  }

  for (const field of [
    'authorization.approvedAt',
    'window.startsAt',
    'window.endsAt',
    'evidence.disposalDate',
    'capacity.confirmedAt',
  ]) {
    requireIsoDate(source, field, issues);
  }

  for (const field of [
    'fixture.containsNoPersonalOrSupplierData',
    'evidence.privateValuesExcludedFromRepositoryEvidence',
    'capacity.storageHeadroomSufficient',
    'secretHandling.localPermissionsConfirmed',
    'secretHandling.operatorSessionConfirmed',
    'secretHandling.privateValuesExcludedFromCapturedEvidence',
  ]) {
    requireTrue(source, field, issues);
  }

  if (!['SYNTHETIC', 'APPROVED_REDACTED'].includes(source.fixture?.dataClassification)) {
    issues.push('fixture.dataClassification must be SYNTHETIC or APPROVED_REDACTED');
  }

  for (const key of DRIVE_MAPPING_KEYS) {
    requireText(source, `target.driveMappings.${key}.label`, issues);
    requireTrue(source, `target.driveMappings.${key}.confirmedRestricted`, issues);
  }
  for (const role of TESTER_ROLES) requireText(source, `people.testers.${role}`, issues);
  for (const role of SIGNATORY_ROLES) requireText(source, `people.signatories.${role}`, issues);

  const decisions = source.authorization?.actions ?? {};
  for (const action of Object.values(ACTION_GATES).flat()) {
    if (!DECISIONS.has(decisions[action])) {
      issues.push(`authorization.actions.${action} must be APPROVED, DENIED, or PENDING`);
    }
  }

  const claspPath = source.target?.privateClaspConfigPath;
  if (typeof claspPath !== 'string' || !path.isAbsolute(claspPath) || PLACEHOLDER.test(claspPath)) {
    issues.push('target.privateClaspConfigPath must be a completed absolute path');
  } else {
    if (repoRoot && isInside(repoRoot, claspPath)) {
      issues.push('target.privateClaspConfigPath must remain outside the repository');
    }
    if (!claspConfigOutsideRepository) {
      issues.push('target.privateClaspConfigPath must resolve outside the repository');
    }
    if (!claspConfigExists) issues.push('target.privateClaspConfigPath does not exist');
  }

  if (packagePath) {
    if (!path.isAbsolute(packagePath)) issues.push('authorization package path must be absolute');
    if (repoRoot && isInside(repoRoot, packagePath)) {
      issues.push('authorization package must remain outside the repository');
    }
  }

  if (
    isCompletedText(source.target?.operationalWorkbookLabel) &&
    source.target.operationalWorkbookLabel === source.target?.backupWorkbookLabel
  ) {
    issues.push('operational and backup workbook labels must be distinct');
  }
  if (
    isCompletedText(source.target?.currentDeploymentLabel) &&
    source.target.currentDeploymentLabel === source.target?.rollbackVersionLabel
  ) {
    issues.push('current deployment and rollback labels must be distinct');
  }

  const start = Date.parse(source.window?.startsAt);
  const end = Date.parse(source.window?.endsAt);
  if (!Number.isNaN(start) && !Number.isNaN(end) && start >= end) {
    issues.push('window.endsAt must be after window.startsAt');
  }

  let authorizedThroughGate = issues.length ? 'NONE' : 'A';
  if (!issues.length) {
    for (const gate of Object.keys(ACTION_GATES)) {
      const approved = ACTION_GATES[gate].every((action) => decisions[action] === 'APPROVED');
      if (!approved) break;
      authorizedThroughGate = gate;
    }
  }

  const notApprovedActions = Object.values(ACTION_GATES)
    .flat()
    .filter((action) => decisions[action] !== 'APPROVED');
  if (!issues.length && notApprovedActions.length) {
    warnings.push(`external actions not approved: ${notApprovedActions.join(', ')}`);
  }

  return { valid: issues.length === 0, issues, warnings, authorizedThroughGate };
}

function usage() {
  return [
    'Usage:',
    '  node scripts/staging-authorization.mjs init <absolute-private-json-path>',
    '  node scripts/staging-authorization.mjs check <absolute-private-json-path>',
    '',
    'The package must stay outside the repository. Validation prints field names and gate decisions only.',
  ].join('\n');
}

async function run() {
  const [command, rawPackagePath] = process.argv.slice(2);
  const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  if (!['init', 'check'].includes(command) || !rawPackagePath) throw new SafeCliError(usage());

  const packagePath = path.resolve(rawPackagePath);

  if (command === 'init') {
    const resolvedParent = await realpath(path.dirname(packagePath));
    const resolvedDestination = path.join(resolvedParent, path.basename(packagePath));
    if (isInside(repoRoot, resolvedDestination)) {
      throw new SafeCliError('Refusing to place a private authorization package in the repository.');
    }
    await writeFile(resolvedDestination, `${JSON.stringify(createAuthorizationTemplate(), null, 2)}\n`, {
      flag: 'wx',
    });
    console.log(
      'Private authorization template created outside the repository. Complete it without copying values into Git or logs.',
    );
    return;
  }

  const resolvedPackagePath = await realpath(packagePath);
  if (isInside(repoRoot, resolvedPackagePath)) {
    throw new SafeCliError('Refusing to read a private authorization package from the repository.');
  }
  const source = JSON.parse(await readFile(resolvedPackagePath, 'utf8'));
  let claspConfigExists = false;
  let claspConfigOutsideRepository = false;
  if (typeof source.target?.privateClaspConfigPath === 'string') {
    try {
      const resolvedClaspPath = await realpath(source.target.privateClaspConfigPath);
      claspConfigExists = (await stat(resolvedClaspPath)).isFile();
      claspConfigOutsideRepository = !isInside(repoRoot, resolvedClaspPath);
    } catch {
      claspConfigExists = false;
    }
  }
  const result = validateAuthorizationPackage(source, {
    repoRoot,
    packagePath: resolvedPackagePath,
    claspConfigExists,
    claspConfigOutsideRepository,
  });
  if (!result.valid) {
    console.error('Authorization package: INVALID');
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log('Authorization package: VALID');
  console.log(`Authorized external sequence: through Gate ${result.authorizedThroughGate}`);
  for (const warning of result.warnings) console.log(`- ${warning}`);
  console.log(
    'No private values were printed. Validation is not staging acceptance or permission beyond the reported gate.',
  );
}

class SafeCliError extends Error {}

function safeCliError(error) {
  if (error instanceof SafeCliError) return error.message;
  if (error instanceof SyntaxError) return 'Authorization package is not valid JSON.';
  if (error?.code === 'EEXIST') return 'Refusing to overwrite an existing authorization package.';
  if (error?.code === 'ENOENT') return 'Authorization package path or destination directory does not exist.';
  if (error?.code === 'EACCES' || error?.code === 'EPERM') {
    return 'Authorization package path is not accessible to the current operator.';
  }
  return 'Authorization workflow failed without exposing private details.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(safeCliError(error));
    process.exitCode = 1;
  });
}
