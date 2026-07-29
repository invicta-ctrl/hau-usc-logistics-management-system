import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PHASE3_ACTION_GATES,
  validatePhase3AuthorizationPackage,
} from '../../scripts/phase3-staging-authorization.mjs';

const temporaryDirectories = [];
afterEach(() => {
  while (temporaryDirectories.length) {
    fs.rmSync(temporaryDirectories.pop(), { recursive: true, force: true });
  }
});

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-phase3-authorization-'));
  temporaryDirectories.push(directory);
  const wrangler = path.join(directory, 'wrangler.private.jsonc');
  const google = path.join(directory, 'google.private.json');
  const packagePath = path.join(directory, 'authorization.json');
  fs.writeFileSync(wrangler, '{}\n');
  fs.writeFileSync(google, '{}\n');
  const candidate = {
    branch: 'feature',
    sha: 'abc123',
    distSha256: 'dist-hash',
    workerSourceSha256: 'worker-hash',
    migrationHashes: { '0001.sql': 'migration-hash' },
  };
  const actions = Object.fromEntries(
    Object.values(PHASE3_ACTION_GATES).flat().map((action) => [action, 'APPROVED']),
  );
  return {
    candidate,
    packagePath,
    source: {
      schemaVersion: 1,
      candidate: structuredClone(candidate),
      authorization: {
        ownerLabel: 'Owner',
        operatorLabel: 'Operator',
        approvalReferenceLabel: 'Approval record',
        approvedAt: '2026-07-22T08:00:00+08:00',
        actions,
      },
      target: {
        environment: 'STAGING',
        confirmsNoProductionBindings: true,
        privateWranglerConfigPath: wrangler,
        privateGoogleConfigPath: google,
        cloudflareAccountLabel: 'Staging account',
        workerLabel: 'Staging Worker',
        d1Label: 'Staging D1',
        routeLabel: 'Restricted workers dev route',
        rollbackVersionLabel: 'Previous immutable Worker version',
        googleOperatorLabel: 'Google staging operator',
        workbookLabel: 'Approved redacted staging workbook',
        snapshotLabel: 'Approved snapshot',
        driveMappingsLabel: 'Restricted staging Drive mappings',
      },
      fixture: {
        namespaceLabel: 'P3-SYNTHETIC',
        dataClassification: 'SYNTHETIC',
        containsNoPersonalOrSupplierData: true,
        allowedMutationsLabel: 'Phase 3 staging matrix only',
      },
      window: {
        startsAt: '2026-07-22T09:00:00+08:00',
        endsAt: '2026-07-22T17:00:00+08:00',
        stopAuthorityLabel: 'Named stop authority',
        incidentContactLabel: 'Named incident contact',
      },
      evidence: {
        privateLocationLabel: 'Restricted evidence folder',
        redactionRuleLabel: 'Safe labels and synthetic values only',
        privateValuesExcludedFromRepositoryEvidence: true,
      },
    },
  };
}

describe('Phase 3 private staging authorization', () => {
  it('binds approval through Gate F to the exact candidate and private target files', async () => {
    const value = fixture();
    await expect(
      validatePhase3AuthorizationPackage(value.source, {
        packagePath: value.packagePath,
        currentCandidate: value.candidate,
      }),
    ).resolves.toMatchObject({ valid: true, authorizedThroughGate: 'F', issues: [] });
  });

  it('stops at the first pending external action without exposing private values', async () => {
    const value = fixture();
    value.source.authorization.actions.d1Backup = 'PENDING';
    const result = await validatePhase3AuthorizationPackage(value.source, {
      packagePath: value.packagePath,
      currentCandidate: value.candidate,
    });
    expect(result).toMatchObject({ valid: true, authorizedThroughGate: 'B' });
    expect(result.warnings).toEqual([expect.stringContaining('d1Backup')]);
    expect(JSON.stringify(result)).not.toContain(value.source.target.d1Label);
  });

  it('rejects production bindings and candidate drift', async () => {
    const value = fixture();
    value.source.target.environment = 'PRODUCTION';
    value.source.candidate.sha = 'different';
    const result = await validatePhase3AuthorizationPackage(value.source, {
      packagePath: value.packagePath,
      currentCandidate: value.candidate,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'candidate must match the current branch, SHA, artifact, Worker source, and migrations',
        'target.environment must be STAGING',
      ]),
    );
  });
});
