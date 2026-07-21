import { describe, expect, it } from 'vitest';
import {
  approveReferenceAdminChange,
  assertReferenceAdminDtoPrivacy,
  filterReferenceAdminRecords,
  previewReferenceAdminChange,
} from '../../src/domain/reference-administration.js';

const current = {
  id: 'SYN-VENUE-1', domain: 'VENUES', revision: 3, status: 'ACTIVE',
  payload: { displayName: 'Synthetic Hall', aliases: ['Synthetic Room'], effectiveFrom: '2026-01-01' },
};

describe('authorized reference-data administration', () => {
  it('previews a controlled non-destructive revision', () => {
    const result = previewReferenceAdminChange(
      { domain: 'VENUES', action: 'UPDATE', targetId: current.id, expectedRevision: 3, patch: { displayName: 'Synthetic Assembly Hall', aliases: 'Hall | Room' } },
      { current, actorId: 'SYN-ADMIN-1' },
    );
    expect(result).toMatchObject({ requiresReview: false, destructive: false, after: { revision: 4, status: 'ACTIVE' } });
    expect(result.after.payload.aliases).toEqual(['Hall', 'Room']);
  });

  it('rejects stale revisions with current comparison data', () => {
    expect(() => previewReferenceAdminChange(
      { domain: 'VENUES', action: 'UPDATE', targetId: current.id, expectedRevision: 2, patch: { displayName: 'Changed' } },
      { current, actorId: 'SYN-ADMIN-1' },
    )).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_REVISION_CONFLICT', retryable: true }));
  });

  it('keeps roster-owned and sync-health domains read-only', () => {
    expect(() => previewReferenceAdminChange({ domain: 'PEOPLE_MEMBERSHIPS', action: 'UPDATE', targetId: 'SYN-USER', expectedRevision: 1, patch: {} }, { current: { id: 'SYN-USER', domain: 'PEOPLE_MEMBERSHIPS', revision: 1 }, actorId: 'SYN-ADMIN' })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_ROSTER_OWNED' }));
    expect(() => previewReferenceAdminChange({ domain: 'SYNC_HEALTH', action: 'ADD', targetId: 'SYN-SYNC', patch: {} }, { actorId: 'SYN-ADMIN' })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_DOMAIN_READ_ONLY' }));
  });

  it('denies unallowlisted fields', () => {
    expect(() => previewReferenceAdminChange(
      { domain: 'VENUES', action: 'UPDATE', targetId: current.id, expectedRevision: 3, patch: { displayName: 'Safe', privateContact: 'not allowed' } },
      { current, actorId: 'SYN-ADMIN' },
    )).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_FIELD_NOT_EDITABLE' }));
  });

  it('requires dependency clearance before archive and produces a compensating revision', () => {
    expect(() => previewReferenceAdminChange(
      { domain: 'VENUES', action: 'ARCHIVE', targetId: current.id, expectedRevision: 3 },
      { current, actorId: 'SYN-ADMIN', dependencies: ['SYN-REQUEST-1'] },
    )).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_DEPENDENCY_CONFLICT' }));
    const archived = previewReferenceAdminChange(
      { domain: 'VENUES', action: 'ARCHIVE', targetId: current.id, expectedRevision: 3 },
      { current, actorId: 'SYN-ADMIN', dependencies: [] },
    );
    expect(archived.after).toMatchObject({ revision: 4, status: 'ARCHIVED' });
    expect(archived.permanentDelete).toBe(false);
  });

  it('requires a separate reviewer for permission escalation', () => {
    const permission = previewReferenceAdminChange(
      { domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 2, patch: { roleId: 'COMMITTEE_HEAD', committeeIds: ['COM_FOOD'], reason: 'Approved synthetic role' } },
      { current: { id: 'SYN-USER-2', domain: 'PERMISSIONS', revision: 2, payload: { roleId: 'REQUESTER', committeeIds: [] } }, actorId: 'SYN-ADMIN-1' },
    );
    expect(permission).toMatchObject({ requiresReview: true, risk: 'PERMISSION_ESCALATION' });
    expect(() => approveReferenceAdminChange(permission, { requesterId: 'SYN-ADMIN-1', reviewerId: 'SYN-ADMIN-1' })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SEPARATION_OF_DUTIES' }));
    expect(() => approveReferenceAdminChange(permission, { requesterId: 'SYN-ADMIN-1', reviewerId: 'SYN-USER-2' })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED' }));
    expect(approveReferenceAdminChange(permission, { requesterId: 'SYN-ADMIN-1', reviewerId: 'SYN-ADMIN-2' })).toMatchObject({ reviewStatus: 'APPROVED' });
  });

  it('denies administrator self-escalation while allowing audited emergency revocation', () => {
    expect(() => previewReferenceAdminChange(
      { domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-ADMIN-1', expectedRevision: 2, patch: { roleId: 'ADMINISTRATOR', active: true, reason: 'No' } },
      { current: { id: 'SYN-ADMIN-1', domain: 'PERMISSIONS', revision: 2, payload: { roleId: 'REQUESTER' } }, actorId: 'SYN-ADMIN-1' },
    )).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED' }));
    const revoke = previewReferenceAdminChange(
      { domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 2, patch: { active: false, emergencyRevocation: true, reason: 'Synthetic emergency revocation' } },
      { current: { id: 'SYN-USER-2', domain: 'PERMISSIONS', revision: 2, payload: { roleId: 'DOL_STAFF', active: true } }, actorId: 'SYN-ADMIN-1' },
    );
    expect(revoke).toMatchObject({ requiresReview: false, risk: 'STANDARD' });
    expect(() => previewReferenceAdminChange(
      { domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 2, patch: { active: false, emergencyRevocation: true, roleId: 'ADMINISTRATOR', reason: 'Dormant grant attempt' } },
      { current: { id: 'SYN-USER-2', domain: 'PERMISSIONS', revision: 2, payload: { roleId: 'DOL_STAFF', active: true } }, actorId: 'SYN-ADMIN-1' },
    )).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_VALIDATION_ERROR' }));
  });

  it('review-gates cross-office routes', () => {
    const result = previewReferenceAdminChange(
      { domain: 'ROUTING', action: 'ADD', targetId: 'SYN-ROUTE-1', patch: { responsibleOfficeId: 'SYN-OFFICE', approvingAuthorityId: 'SYN-AUTH', ownerCommitteeId: 'COM_MATERIALS', leadTimeBusinessDays: 5, instructions: 'Synthetic route' } },
      { actorId: 'SYN-ADMIN-1' },
    );
    expect(result).toMatchObject({ requiresReview: true, risk: 'CROSS_OFFICE_ROUTING' });
  });

  it('supports bounded search and safe DTO allowlists', () => {
    expect(filterReferenceAdminRecords([current], { domain: 'VENUES', query: 'hall', limit: 1 })).toHaveLength(1);
    expect(assertReferenceAdminDtoPrivacy({ items: [current] })).toBe(true);
    expect(() => assertReferenceAdminDtoPrivacy({ Email: 'restricted@example.invalid' })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_DTO_PRIVACY_VIOLATION' }));
  });
});
