import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sessionUserDto } from '../../src/server/auth/contracts.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');

describe('v0.7.2 requester affiliation contract', () => {
  it('uses the staff profile affiliation without requiring the legacy unique department account field', () => {
    const user = sessionUserDto(
      {
        id: 'ACCOUNT-SYNTHETIC-001',
        status: 'ACTIVE',
        roleId: 'REQUESTER',
        committeeIds: [],
        accessProfile: { presetId: 'REQUESTER_ONLY' },
        departmentId: '',
        profileDepartmentId: 'USC-DEPT-DOL',
        departmentDisplayName: 'Department of Logistics',
        onboardingCompletedAt: '2026-08-03T10:00:00.000Z',
      },
      { expiresAt: '2026-08-04T10:00:00.000Z' },
    );

    expect(user.requesterDepartment).toEqual({
      id: 'USC-DEPT-DOL',
      displayName: 'Department of Logistics',
    });
  });

  it('routes requester portal reads and writes through the resolved profile department', async () => {
    const source = await readFile(resolve(repositoryRoot, 'src/server/d1/operational-service.js'), 'utf8');
    expect(source).toContain("return account?.profileDepartmentId || account?.departmentId || '';");
    expect(source).toContain('[account.id, departmentId]');
    expect(source).toContain('.bind(departmentId, eventSeriesId, eventId)');
    expect(source).not.toMatch(/requester_department_id[\s\S]{0,260}account\.departmentId/u);
  });
});
