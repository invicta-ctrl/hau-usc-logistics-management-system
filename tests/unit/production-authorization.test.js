import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createProductionAuthorizationTemplate,
  materialProductionWorkingTreeEntries,
  PRODUCTION_ACTIONS,
  validateProductionAuthorizationPackage,
} from '../../scripts/production-authorization.mjs';

const candidate = Object.freeze({
  branch: 'release/test',
  releaseSha: 'a'.repeat(40),
  distSha256: 'b'.repeat(64),
  workerSourceSha256: 'c'.repeat(64),
  googleMappingSha256: 'd'.repeat(64),
  migrationHashes: { '0001.sql': 'e'.repeat(64) },
});

let privateDirectory;
let privateFiles;

beforeAll(() => {
  privateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-production-authorization-'));
  privateFiles = ['wrangler.jsonc', 'google.json', 'backup.json'].map((name) => {
    const file = path.join(privateDirectory, name);
    fs.writeFileSync(file, '{}', { mode: 0o600 });
    return file;
  });
});

afterAll(() => {
  fs.rmSync(privateDirectory, { recursive: true, force: true });
});

async function completedPackage() {
  const source = await createProductionAuthorizationTemplate(candidate);
  source.authorization = {
    ownerLabel: 'Approved owner',
    operatorLabel: 'Approved operator',
    approvalReferenceLabel: 'Approval record',
    approvedAt: '2026-07-22T10:00:00.000Z',
    actions: Object.fromEntries(PRODUCTION_ACTIONS.map((action) => [action, 'APPROVED'])),
  };
  Object.assign(source.target, {
    confirmsProductionResourcesDistinctFromStaging: true,
    privateWranglerConfigPath: privateFiles[0],
    privateGoogleConfigPath: privateFiles[1],
    privateBackupManifestPath: privateFiles[2],
    cloudflareAccountLabel: 'Production account',
    workerLabel: 'Production Worker',
    d1Label: 'Production D1',
    routeLabel: 'Production route',
    workbookLabel: 'Approved workbook',
    driveMappingsLabel: 'Restricted Drive mappings',
    productionBackupLabel: 'Immutable production backup',
    rollbackTargetLabel: 'Immutable rollback target',
  });
  Object.assign(source.acceptance, {
    finalStagingEvidenceLabel: 'Final staging evidence',
    authenticationAcceptanceLabel: 'Authentication acceptance',
    accessManagementAcceptanceLabel: 'Access Management acceptance',
    rollbackRehearsalLabel: 'Rollback rehearsal',
    migrationReconciliationLabel: 'Migration reconciliation',
    securityPrivacyReview: 'PASS',
    migrationRecoveryReview: 'PASS',
    zeroOpenP0P1: true,
    artifactHashesConfirmed: true,
  });
  Object.assign(source.launch, {
    approvedSeedAccountsLabel: 'Approved seed accounts',
    approvedSmokeMutationsLabel: 'Approved smoke mutations',
    rollbackTriggersLabel: 'Rollback triggers',
    incidentTriggersLabel: 'Incident triggers',
    evidenceRetentionLabel: 'Evidence retention',
  });
  Object.assign(source.window, {
    startsAt: '2026-07-22T11:00:00.000Z',
    endsAt: '2026-07-22T13:00:00.000Z',
    stopAuthorityLabel: 'Stop authority',
    incidentContactLabel: 'Incident contact',
  });
  Object.assign(source.privacy, {
    privateEvidenceLocationLabel: 'Restricted evidence location',
    redactionRuleLabel: 'Redaction policy',
    privateValuesExcludedFromRepositoryEvidence: true,
    credentialAndIdentifierHandlingConfirmed: true,
  });
  return source;
}

describe('production authorization', () => {
  it('ignores only the preserved CodeGraph index when checking release cleanliness', () => {
    expect(
      materialProductionWorkingTreeEntries(
        '?? .codegraph/index.sqlite\n?? .codegraph/cache/graph.bin\n M src/worker/index.js\n?? evidence.txt',
      ),
    ).toEqual([' M src/worker/index.js', '?? evidence.txt']);
    expect(materialProductionWorkingTreeEntries('?? .codegraph/index.sqlite')).toEqual([]);
  });

  it('authorizes only an exact candidate with all approvals during the launch window', async () => {
    const source = await completedPackage();
    const result = await validateProductionAuthorizationPackage(source, {
      currentCandidate: candidate,
      packagePath: path.join(privateDirectory, 'production-authorization.json'),
      now: Date.parse('2026-07-22T12:00:00.000Z'),
    });
    expect(result).toMatchObject({ valid: true, launchAuthorized: true, windowActive: true, issues: [] });
  });

  it('fails closed when any production action is pending', async () => {
    const source = await completedPackage();
    source.authorization.actions.productionWorkerDeploy = 'PENDING';
    const result = await validateProductionAuthorizationPackage(source, {
      currentCandidate: candidate,
      now: Date.parse('2026-07-22T12:00:00.000Z'),
    });
    expect(result.valid).toBe(true);
    expect(result.launchAuthorized).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('productionWorkerDeploy')]),
    );
  });

  it('rejects stale candidate evidence and private configuration inside the repository', async () => {
    const source = await completedPackage();
    source.candidate.releaseSha = 'f'.repeat(40);
    source.target.privateWranglerConfigPath = path.join(process.cwd(), 'wrangler.jsonc');
    const result = await validateProductionAuthorizationPackage(source, {
      currentCandidate: candidate,
      now: Date.parse('2026-07-22T12:00:00.000Z'),
    });
    expect(result.valid).toBe(false);
    expect(result.launchAuthorized).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('candidate must match'),
        expect.stringContaining('must resolve outside the repository'),
      ]),
    );
  });
});
