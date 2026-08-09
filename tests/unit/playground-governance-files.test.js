import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(path, 'utf8');

describe('repository-hardcoded playground release governance', () => {
  it('keeps the exact five permanent pointers in root AGENTS.md', () => {
    const agents = read('AGENTS.md');
    for (const branch of [
      'main',
      'backup/last-known-good',
      'regression/r1',
      'regression/r2',
      'regression/r3',
    ]) {
      expect(agents).toContain(`\`${branch}\``);
    }
    expect(agents).toContain('Staging/playground and production are deployment environments');
    expect(agents).toContain("Earl's explicit GO");
  });

  it('automates candidate to playground and contains no production continuation', () => {
    const workflow = read('.github/workflows/release-candidate.yml');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s+push:/mu);
    expect(workflow).toContain('(release|fix|hotfix)/v');
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
