import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(path, 'utf8');

describe('repository-hardcoded playground release governance', () => {
  it('keeps universal governance rules in root AGENTS.md', () => {
    const agents = read('AGENTS.md');
    expect(agents).toContain('scope: account-wide-general');
    expect(agents).toContain('managed_replica_policy: byte-identical-generated');
    expect(agents).toContain('project_extension_path: .agents/PROJECT_POLICY.md');
    expect(agents).toContain('The only editable general-policy authority is:');
  });

  it('keeps the owner-approved main and Playground topology in project policy', () => {
    const policy = read('.agents/PROJECT_POLICY.md');
    expect(policy).toContain(
      'Exactly two permanent functional branches remain after preservation gates pass',
    );
    expect(policy).toMatch(/^main$/mu);
    expect(policy).toMatch(/^Playground$/mu);
    expect(policy).toContain('Legacy recovery, design, release, and work refs remain preserved');
    expect(policy).toContain('-> Earl explicit Production GO');
    expect(policy).toContain(
      "Production promotion requires Earl's explicit GO for the exact tested candidate.",
    );
  });

  it('accepts only an exact Playground-targeted temporary candidate and contains no Production continuation', () => {
    const workflow = read('.github/workflows/release-candidate.yml');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s+push:/mu);
    expect(workflow).toContain('(work|fix|reconcile)/playground-');
    expect(workflow).toContain('refs/remotes/origin/${EXPECTED_BRANCH}');
    expect(workflow).toContain('deploy-playground.mjs');
    expect(workflow).toContain('Stop for Earl manual testing');
    expect(workflow).not.toContain('deploy-environment.mjs production');
    expect(workflow).not.toContain('workflow_run:');
  });

  it('keeps reset targets server-owned and production resources outside runtime reset bindings', () => {
    const service = read('src/server/playground-service.js');
    const resetWorker = read('scripts/playground/r2-reset-worker.js');
    const config = read('scripts/playground/create-private-config.mjs');
    expect(service).toContain('confirmation !== expected');
    expect(service).not.toContain('databaseId: command');
    expect(resetWorker).not.toContain('PRODUCTION');
    expect(config).not.toContain("binding: 'BASELINE_BRAND'");
  });
});
