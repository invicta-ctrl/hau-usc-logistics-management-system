import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createAuthorizationTemplate,
  validateAuthorizationPackage,
} from '../../scripts/staging-authorization.mjs';

const FAKE_REPO_ROOT = path.resolve('test-paths', 'repo');
const FAKE_PRIVATE_ROOT = path.resolve('test-paths', 'private');
const FAKE_PACKAGE_PATH = path.join(FAKE_PRIVATE_ROOT, 'authorization.json');

function completedPackage(privateClaspConfigPath = path.join(FAKE_PRIVATE_ROOT, 'approved.clasp.json')) {
  const source = createAuthorizationTemplate(privateClaspConfigPath);
  source.authorization.owner = 'Owner label';
  source.authorization.operatorAccountLabel = 'Operator label';
  source.authorization.approvalReferenceLabel = 'Approval record label';
  source.authorization.approvedAt = '2026-07-16T10:00:00+08:00';
  for (const action of Object.keys(source.authorization.actions))
    source.authorization.actions[action] = 'APPROVED';

  Object.assign(source.target, {
    stagingProjectLabel: 'Approved staging',
    operationalWorkbookLabel: 'Staging operations',
    backupWorkbookLabel: 'Staging backup',
    currentDeploymentLabel: 'Current staging deployment',
    rollbackVersionLabel: 'Immutable rollback version',
  });
  for (const [key, mapping] of Object.entries(source.target.driveMappings)) {
    mapping.label = `${key} folder`;
    mapping.confirmedRestricted = true;
  }

  Object.assign(source.fixture, {
    versionLabel: 'Synthetic fixture v1',
    recordNamespace: 'S13-TEST',
    allowedMutationsLabel: 'Slice 13 matrix only',
    cleanupOrRetentionLabel: 'Retain through sign-off',
    containsNoPersonalOrSupplierData: true,
  });
  for (const role of Object.keys(source.people.testers)) source.people.testers[role] = `${role} tester`;
  for (const role of Object.keys(source.people.signatories))
    source.people.signatories[role] = `${role} signatory`;

  Object.assign(source.window, {
    startsAt: '2026-07-17T09:00:00+08:00',
    endsAt: '2026-07-17T17:00:00+08:00',
    stopAuthority: 'Stop authority label',
    incidentContactLabel: 'Incident contact label',
  });
  Object.assign(source.evidence, {
    privateLocationLabel: 'Restricted evidence folder',
    viewerGroupLabel: 'Acceptance reviewers',
    redactionRuleLabel: 'Synthetic and safe labels only',
    disposalDate: '2026-08-17',
    privateValuesExcludedFromRepositoryEvidence: true,
  });
  Object.assign(source.capacity, {
    confirmedBy: 'Capacity owner',
    confirmedAt: '2026-07-16T10:00:00+08:00',
    storageHeadroomSufficient: true,
  });
  Object.assign(source.secretHandling, {
    custodian: 'Configuration custodian',
    localPermissionsConfirmed: true,
    operatorSessionConfirmed: true,
    privateValuesExcludedFromCapturedEvidence: true,
  });
  return source;
}

describe('staging authorization package', () => {
  it('binds a complete private package to the reviewed candidate and all gates', () => {
    const result = validateAuthorizationPackage(completedPackage(), {
      repoRoot: FAKE_REPO_ROOT,
      packagePath: FAKE_PACKAGE_PATH,
      claspConfigExists: true,
    });
    expect(result).toMatchObject({ valid: true, authorizedThroughGate: 'F', issues: [], warnings: [] });
  });

  it('reports only explicit field names for incomplete private values', () => {
    const source = completedPackage();
    source.authorization.owner = 'REPLACE_PRIVATELY';
    source.people.testers.accessibility = '';
    const result = validateAuthorizationPackage(source, {
      repoRoot: FAKE_REPO_ROOT,
      packagePath: FAKE_PACKAGE_PATH,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('authorization.owner'),
        expect.stringContaining('people.testers.accessibility'),
      ]),
    );
    expect(JSON.stringify(result)).not.toContain('Operator label');
  });

  it('fails closed for repository paths and missing private clasp configuration', () => {
    const source = completedPackage();
    source.target.privateClaspConfigPath = path.join(FAKE_REPO_ROOT, 'private.clasp.json');
    const result = validateAuthorizationPackage(source, {
      repoRoot: FAKE_REPO_ROOT,
      packagePath: path.join(FAKE_REPO_ROOT, 'authorization.json'),
      claspConfigExists: false,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'target.privateClaspConfigPath must remain outside the repository',
        'target.privateClaspConfigPath does not exist',
        'authorization package must remain outside the repository',
      ]),
    );
  });

  it('distinguishes a valid package from authorization to cross later gates', () => {
    const source = completedPackage();
    source.authorization.actions.backupCreation = 'DENIED';
    const result = validateAuthorizationPackage(source, {
      repoRoot: FAKE_REPO_ROOT,
      packagePath: FAKE_PACKAGE_PATH,
    });
    expect(result.valid).toBe(true);
    expect(result.authorizedThroughGate).toBe('B');
    expect(result.warnings).toEqual([expect.stringContaining('backupCreation')]);
  });

  it('requires rollback rehearsal authorization before Gate E acceptance work', () => {
    const source = completedPackage();
    source.authorization.actions.rollbackRehearsal = 'DENIED';
    const result = validateAuthorizationPackage(source, {
      repoRoot: FAKE_REPO_ROOT,
      packagePath: FAKE_PACKAGE_PATH,
    });
    expect(result.valid).toBe(true);
    expect(result.authorizedThroughGate).toBe('D');
    expect(result.warnings).toEqual([expect.stringContaining('rollbackRehearsal')]);
  });

  it('validates a complete outside-repository file without echoing private values', () => {
    const privateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-s13-authorization-'));
    try {
      const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
      const scriptPath = path.join(repoRoot, 'scripts', 'staging-authorization.mjs');
      const claspPath = path.join(privateDirectory, 'approved.clasp.json');
      const packagePath = path.join(privateDirectory, 'authorization.json');
      const source = completedPackage();
      source.authorization.owner = 'PRIVATE-OWNER-MARKER';
      source.target.privateClaspConfigPath = claspPath;
      fs.writeFileSync(claspPath, '{}\n');
      fs.writeFileSync(packagePath, `${JSON.stringify(source)}\n`);

      const result = spawnSync(process.execPath, [scriptPath, 'check', packagePath], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Authorization package: VALID');
      expect(result.stdout).toContain('Authorized external sequence: through Gate F');
      expect(`${result.stdout}${result.stderr}`).not.toContain('PRIVATE-OWNER-MARKER');
    } finally {
      fs.rmSync(privateDirectory, { recursive: true, force: true });
    }
  });

  it('does not overwrite an existing private authorization file', () => {
    const privateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-s13-authorization-'));
    try {
      const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
      const scriptPath = path.join(repoRoot, 'scripts', 'staging-authorization.mjs');
      const packagePath = path.join(privateDirectory, 'authorization.json');
      fs.writeFileSync(packagePath, 'preserve-existing-file\n');

      const result = spawnSync(process.execPath, [scriptPath, 'init', packagePath], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(fs.readFileSync(packagePath, 'utf8')).toBe('preserve-existing-file\n');
      expect(`${result.stdout}${result.stderr}`).not.toContain(packagePath);
    } finally {
      fs.rmSync(privateDirectory, { recursive: true, force: true });
    }
  });
});
