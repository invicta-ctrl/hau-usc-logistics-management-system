import { describe, expect, it } from 'vitest';
import {
  authorizationDenialMessage,
  CAPABILITIES,
  capabilitiesFor,
  can,
  canonicalCommitteeId,
  canonicalRoleId,
  COMMITTEE_REGISTRY,
  permissionsFor,
  projectClientAuthorization,
} from '../../src/domain/permissions.js';

const canonicalAuthorization = (overrides = {}) => ({
  contract: 'canonical-authorization',
  contractVersion: 2,
  modelVersion: 2,
  roleId: 'ADMINISTRATOR',
  roleLabel: 'Administrator',
  scopeMode: 'ALL',
  committeeIds: [],
  committees: [],
  capabilities: ['view.request', 'reference.catalog.manage'],
  mappingStatus: 'MAPPED',
  active: true,
  ...overrides,
});

describe('canonical authorization projection', () => {
  it('keeps the canonical role and committee vocabulary bounded', () => {
    expect(canonicalRoleId('DOL Director')).toBe('DIRECTOR');
    expect(canonicalRoleId('admin')).toBe('ADMINISTRATOR');
    expect(canonicalCommitteeId('Pantry Committee')).toBe('COM_INVENTORY_PANTRY');
    expect(canonicalCommitteeId('Fourth Venue Committee')).toBe('');
    expect(COMMITTEE_REGISTRY).toHaveLength(3);
  });

  it('separates operational, reference, and system capabilities by role', () => {
    expect(capabilitiesFor('SYSTEM_OWNER')).toEqual(expect.arrayContaining(Object.values(CAPABILITIES)));
    expect(capabilitiesFor('SYSTEM_OWNER')).toHaveLength(Object.values(CAPABILITIES).length);
    expect(can('DOL_STAFF', 'release')).toBe(true);
    expect(can('COMMITTEE_HEAD', 'release')).toBe(false);
    expect(can('COMMITTEE_HEAD', 'merge_event_item')).toBe(true);
    expect(can('DIRECTOR', 'release')).toBe(true);
    expect(can('DIRECTOR', 'system_admin')).toBe(false);
    expect(can('ADMINISTRATOR', 'manage_catalog')).toBe(true);
    expect(can('ADMINISTRATOR', 'release')).toBe(false);
    expect(can('READ_ONLY_AUDITOR', 'view.audit')).toBe(true);
    expect(permissionsFor('ADMINISTRATOR').diagnostics).toBe(true);
  });

  it('maps the System Owner explicitly without treating ordinary Administrators as owners', () => {
    expect(canonicalRoleId('System Owner')).toBe('SYSTEM_OWNER');
    expect(canonicalRoleId('Administrator')).toBe('ADMINISTRATOR');
    expect(can('SYSTEM_OWNER', 'release')).toBe(true);
    expect(can('ADMINISTRATOR', 'release')).toBe(false);
  });

  it('uses server capabilities and mapping state instead of trusting the client role', () => {
    const projected = projectClientAuthorization({
      id: 'SYNTHETIC-USER-001',
      displayName: 'Synthetic Operator',
      role: 'ADMINISTRATOR',
      permissions: { review: true, release: true, receive: true, admin: true, manageCatalog: true },
      authorization: canonicalAuthorization({ capabilities: ['reference.catalog.manage'] }),
    });

    expect(can(projected, 'manage_catalog')).toBe(true);
    expect(can(projected, 'release')).toBe(false);
    expect(projected.permissions).toEqual({
      review: false,
      release: false,
      receive: false,
      admin: false,
      manageCatalog: true,
    });

    const unresolved = projectClientAuthorization({
      ...projected,
      authorization: canonicalAuthorization({ mappingStatus: 'NEEDS_REVIEW' }),
    });
    expect(can(unresolved, 'manage_catalog')).toBe(false);
    expect(unresolved.permissions.manageCatalog).toBe(false);
  });

  it('fails closed when a canonical bootstrap caller lacks authorization metadata', () => {
    const projected = projectClientAuthorization({
      id: 'SYNTHETIC-USER-002',
      displayName: 'Synthetic User',
      role: 'ADMINISTRATOR',
      permissions: { review: true, release: true, receive: true, admin: true, manageCatalog: true },
    }, { requireCanonical: true });

    expect(projected.permissions).toEqual({ review: false, release: false, receive: false, admin: false, manageCatalog: false });
    expect(can(projected, 'release')).toBe(false);
  });

  it('returns fixed denial messages without echoing operational values', () => {
    const message = authorizationDenialMessage('OUT_OF_SCOPE');
    expect(message).toMatch(/outside.*committee scope/i);
    expect(message).not.toContain('SYNTHETIC');
    expect(authorizationDenialMessage('UNKNOWN_REASON')).toBe('This action is not authorized.');
  });
});
