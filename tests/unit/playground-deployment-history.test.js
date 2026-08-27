import { describe, expect, it } from 'vitest';
import {
  latestDeploymentVersionId,
  newestDeploymentsFirst,
} from '../../scripts/playground/deployment-history.mjs';

describe('playground Cloudflare deployment history', () => {
  it('selects the newest deployment when Cloudflare returns oldest-first history', () => {
    const deployments = [
      { created_on: '2026-08-27T08:00:00.000Z', versions: [{ version_id: 'oldest' }] },
      { created_on: '2026-08-27T09:00:00.000Z', versions: [{ version_id: 'middle' }] },
      { created_on: '2026-08-27T10:00:00.000Z', versions: [{ version_id: 'newest' }] },
    ];

    expect(latestDeploymentVersionId(deployments)).toBe('newest');
    expect(newestDeploymentsFirst(deployments).map((row) => row.versions[0].version_id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('does not trust array order and fails closed on unusable rows', () => {
    const deployments = [
      { created_on: '2026-08-27T10:00:00.000Z', versions: [{ version_id: 'newest' }] },
      { created_on: 'not-a-time', versions: [{ version_id: 'invalid' }] },
      { created_on: '2026-08-27T08:00:00.000Z', versions: [{ version_id: 'oldest' }] },
    ];

    expect(latestDeploymentVersionId(deployments)).toBe('newest');
    expect(latestDeploymentVersionId([])).toBe('');
    expect(latestDeploymentVersionId(null)).toBe('');
  });
});
