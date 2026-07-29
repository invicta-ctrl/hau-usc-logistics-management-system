import { describe, expect, it } from 'vitest';
import {
  accountAccessPolicy,
  effectiveCapabilities,
  normalizeAccessPolicy,
  roleWorkspaceIds,
} from '../../src/server/access/policy.js';

const references = {
  locationScopeIds: ['MAIN_STORAGE'],
  eventSeriesScopeIds: ['SER-001'],
  eventScopeIds: ['EVT-001'],
};

describe('advanced access policy', () => {
  it('derives fail-closed workspace assignments from role and committee scope', () => {
    expect(roleWorkspaceIds('DOL_STAFF', ['COM_FOOD', 'COM_MATERIALS'])).toEqual([
      'food',
      'materials',
    ]);
    expect(roleWorkspaceIds('REQUESTER', [])).toEqual([]);
    expect(accountAccessPolicy({ roleId: 'DIRECTOR' })).toMatchObject({
      workspaceIds: ['director'],
      defaultWorkspaceId: 'director',
    });
  });

  it('projects a governed Materials preset with bounded scopes and effective actions', () => {
    const result = normalizeAccessPolicy(
      {
        presetId: 'MATERIALS_OPERATOR',
        locationScopeIds: ['MAIN_STORAGE'],
        eventSeriesScopeIds: ['SER-001'],
        eventScopeIds: ['EVT-001'],
        capabilityDenies: ['lending.usage.view'],
      },
      { actorRoleId: 'SYSTEM_OWNER', reference: references },
    );
    expect(result).toMatchObject({
      valid: true,
      preview: {
        roleId: 'DOL_STAFF',
        workspaceIds: ['materials'],
        defaultWorkspaceId: 'materials',
        committeeIds: ['COM_MATERIALS'],
        locationScopeIds: ['MAIN_STORAGE'],
        eventSeriesScopeIds: ['SER-001'],
        eventScopeIds: ['EVT-001'],
        explicitDenies: ['lending.usage.view'],
        sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
      },
    });
    expect(effectiveCapabilities(result.account)).not.toContain('lending.usage.view');
  });

  it('requires owner approval for Administrator assignment and sensitive grants', () => {
    expect(
      normalizeAccessPolicy(
        { presetId: 'ADMINISTRATOR' },
        { actorRoleId: 'ADMINISTRATOR', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'OWNER_APPROVAL_REQUIRED' });
    expect(
      normalizeAccessPolicy(
        {
          presetId: 'FOOD_OPERATOR',
          capabilityGrants: ['system.admin'],
        },
        { actorRoleId: 'ADMINISTRATOR', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'OWNER_APPROVAL_REQUIRED' });
  });

  it('rejects default workspaces and governed values outside the assigned set', () => {
    expect(
      normalizeAccessPolicy(
        {
          presetId: 'FOOD_OPERATOR',
          defaultWorkspaceId: 'materials',
        },
        { actorRoleId: 'SYSTEM_OWNER', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'DEFAULT_WORKSPACE_OUT_OF_SCOPE' });
    expect(
      normalizeAccessPolicy(
        {
          presetId: 'FOOD_OPERATOR',
          locationScopeIds: ['UNKNOWN_STORAGE'],
        },
        { actorRoleId: 'SYSTEM_OWNER', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'GOVERNED_SCOPE_INVALID' });
  });

  it('never permits SYSTEM_OWNER creation through a custom policy', () => {
    expect(
      normalizeAccessPolicy(
        { presetId: 'CUSTOM', roleId: 'SYSTEM_OWNER', workspaceIds: ['administrator'] },
        { actorRoleId: 'SYSTEM_OWNER', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'ACCESS_ROLE_INVALID' });
  });

  it('fails closed for values absent from governed workspace, scope, and capability registries', () => {
    const base = { presetId: 'FOOD_OPERATOR', defaultWorkspaceId: 'food' };
    expect(
      normalizeAccessPolicy(
        { ...base, workspaceIds: ['food', 'unknown-workspace'] },
        { actorRoleId: 'SYSTEM_OWNER', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'WORKSPACE_ASSIGNMENT_INVALID' });
    expect(
      normalizeAccessPolicy(
        { ...base, locationScopeIds: ['MAIN_STORAGE'] },
        { actorRoleId: 'SYSTEM_OWNER', reference: {} },
      ),
    ).toMatchObject({ valid: false, code: 'GOVERNED_SCOPE_INVALID' });
    expect(
      normalizeAccessPolicy(
        { ...base, capabilityGrants: ['not.a.real.capability'] },
        { actorRoleId: 'SYSTEM_OWNER', reference: references },
      ),
    ).toMatchObject({ valid: false, code: 'CAPABILITY_OVERRIDE_INVALID' });
  });
});
