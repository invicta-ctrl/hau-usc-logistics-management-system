import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readScript = (name) =>
  readFileSync(new URL(`../../scripts/playground/${name}`, import.meta.url), 'utf8');

describe('Playground baseline coverage v2 safety contract', () => {
  it('derives coverage only from an existing private sanitized baseline', () => {
    const source = readScript('create-baseline-v2.mjs');

    expect(source).toContain("privateExisting(argument('--source-database')");
    expect(source).toContain('await copyFile(sourcePath, outputPath, 0)');
    expect(source).toContain('DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ');
    expect(source).toContain('PLAYGROUND_BASELINE_COVERAGE_V2');
    expect(source).not.toMatch(/\bfetch\s*\(/u);
    expect(source).not.toContain('wrangler');
  });

  it('exports only additive DML and uses deferred foreign-key enforcement for schema-32 identity links', () => {
    const source = readScript('export-baseline-v2-overlay.mjs');

    expect(source).toContain("'PRAGMA defer_foreign_keys = ON;'");
    expect(source).toContain('staff_account_activity_transition_context');
    expect(source).toContain('/\\bDROP\\b/iu');
    expect(source).toContain('/\\bDELETE\\b/iu');
    expect(source).toContain('/\\bALTER\\b/iu');
    expect(source).toContain('/\\bCREATE\\s+TABLE\\b/iu');
  });

  it('requires integrity, foreign keys, reconciliation, and every missing coverage domain', () => {
    const source = readScript('verify-baseline-v2-overlay.mjs');

    expect(source).toContain("reconciliation.summary.disposition !== 'RECONCILED'");
    for (const label of [
      'lendableItems',
      'activeReservations',
      'activeLending',
      'eventOperationalLinks',
      'canonicalPeople',
      'accountPersonLinks',
      'staffActivityRows',
      'referenceRecords',
      'referenceLinks',
    ]) {
      expect(source).toContain(label);
    }
  });

  it('keeps the private audit aggregate-only and redacts paths and row identities from output', () => {
    const source = readScript('audit-clean-baseline.mjs');

    expect(source).toContain('sourceClassification');
    expect(source).toContain('transformVersion');
    expect(source).toContain('domainCounts');
    expect(source).toContain('roleCapabilities');
    expect(source).not.toContain('console.log(reportPath)');
    expect(source).not.toContain('console.log(manifestPath)');
    expect(source).not.toContain('console.log(databasePath)');
  });

  it('gates the live install on fixed identity, a clean reset, and a reversible pre-apply bookmark', () => {
    const source = readScript('install-baseline-v2.mjs');

    expect(source).toContain("privateExisting(argument('--manifest')");
    expect(source).toContain("privateExisting(argument('--reset-report')");
    expect(source).toContain("privateNew(argument('--output-manifest')");
    expect(source).toContain('Fixed Playground D1 identity mismatch.');
    expect(source).toContain('Live Playground is not the exact clean post-reset baseline.');
    expect(source).toContain('Reversible pre-apply bookmark is unavailable.');
    expect(source.indexOf('const preApplyBookmark')).toBeLessThan(
      source.indexOf("wrangler(['d1', 'execute', databaseId, '--remote', '--file'"),
    );
  });

  it('restores and verifies the pre-apply bookmark before reporting a failed install as rolled back', () => {
    const source = readScript('install-baseline-v2.mjs');

    expect(source).toContain(
      "wrangler(['d1', 'time-travel', 'restore', databaseId, '--bookmark', preApplyBookmark])",
    );
    expect(source).toContain("let rollbackStatus = 'FAILED_ROLLBACK_UNVERIFIED'");
    expect(source).toContain("rollbackStatus = 'FAILED_ROLLED_BACK'");
    expect(source).toContain("rollbackWorkingState.state !== 'CLEAN'");
    expect(source).toContain('rollback?.baseline_id !== preflight?.baseline_id');
    expect(source).toContain('await rm(outputManifestPath, { force: true })');
    expect(source).toContain('rollback could not be verified.');
  });

  it('publishes a distinct clean bookmark only after live coverage and reconciliation pass', () => {
    const source = readScript('install-baseline-v2.mjs');

    expect(source).toContain("postflight?.baseline_id !== 'PGBL-20260828-COVERAGE-V2'");
    expect(source).toContain("reconciliation.summary.disposition !== 'RECONCILED'");
    expect(source).toContain('cleanBaselineBookmark === preApplyBookmark');
    expect(source).toContain('cleanBaselineBookmark,');
    expect(source).not.toContain('console.log(preApplyBookmark)');
    expect(source).not.toContain('console.log(cleanBaselineBookmark)');
  });
});
