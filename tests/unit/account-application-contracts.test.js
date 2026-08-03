import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_APPLICATION_NONTERMINAL_STATES,
  ACCOUNT_APPLICATION_REVIEW_QUEUE,
  ACCOUNT_APPLICATION_STATE,
  ACCOUNT_APPLICATION_STATES,
  assertAccountApplicationTransition,
  canTransitionAccountApplication,
  publicApplicationStatusDto,
  redactedReviewApplicationDetailDto,
  redactedReviewApplicationListDto,
} from '../../src/server/account-application/contracts.js';

describe('account-application contracts', () => {
  it('locks every canonical state and accepted transition', () => {
    expect(ACCOUNT_APPLICATION_STATES).toEqual([
      'EMAIL_UNVERIFIED',
      'DRAFT',
      'PENDING_ADMIN_REVIEW',
      'CHANGES_REQUESTED',
      'PENDING_DIRECTOR_APPROVAL',
      'APPROVED_ACTIVATION_REQUIRED',
      'ACTIVE',
      'REJECTED',
      'WITHDRAWN',
      'EXPIRED',
      'ARCHIVED',
    ]);
    for (const [fromState, toState] of [
      ['EMAIL_UNVERIFIED', 'DRAFT'],
      ['DRAFT', 'PENDING_ADMIN_REVIEW'],
      ['PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED'],
      ['CHANGES_REQUESTED', 'PENDING_ADMIN_REVIEW'],
      ['PENDING_ADMIN_REVIEW', 'PENDING_DIRECTOR_APPROVAL'],
      ['PENDING_ADMIN_REVIEW', 'REJECTED'],
      ['PENDING_DIRECTOR_APPROVAL', 'CHANGES_REQUESTED'],
      ['PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'],
      ['PENDING_DIRECTOR_APPROVAL', 'REJECTED'],
      ['APPROVED_ACTIVATION_REQUIRED', 'ACTIVE'],
    ]) {
      expect(canTransitionAccountApplication(fromState, toState)).toBe(true);
    }
    for (const fromState of ACCOUNT_APPLICATION_NONTERMINAL_STATES) {
      expect(canTransitionAccountApplication(fromState, ACCOUNT_APPLICATION_STATE.WITHDRAWN)).toBe(true);
    }
    expect(canTransitionAccountApplication('PENDING_ADMIN_REVIEW', 'EXPIRED')).toBe(true);
    expect(canTransitionAccountApplication('REJECTED', 'ARCHIVED')).toBe(true);
    expect(canTransitionAccountApplication('ACTIVE', 'ARCHIVED')).toBe(true);
  });

  it('rejects illegal transitions without inventing a recovery path', () => {
    expect(canTransitionAccountApplication('DRAFT', 'ACTIVE')).toBe(false);
    expect(canTransitionAccountApplication('REJECTED', 'PENDING_ADMIN_REVIEW')).toBe(false);
    expect(canTransitionAccountApplication('ARCHIVED', 'ACTIVE')).toBe(false);
    let thrown;
    try {
      assertAccountApplicationTransition('PENDING_ADMIN_REVIEW', 'ACTIVE');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 'ACCOUNT_APPLICATION_TRANSITION_INVALID' });
  });

  it('creates a private-status DTO without envelopes, fingerprints, audit data, or credentials', () => {
    const dto = publicApplicationStatusDto({
      applicationCode: 'AAP-SYNTHETIC-001',
      state: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      revision: 7,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T01:00:00.000Z',
      emailFingerprint: 'fp-not-public',
      protectedEmailEnvelope: 'v1.not-public',
      protectedProfileEnvelope: 'v1.not-public',
      statusTokenDigest: 'digest-not-public',
      pendingPasswordCredential: { hash: 'not-public' },
      administratorReviewerId: 'ADMIN-NOT-PUBLIC',
      accountCode: 'HAU-SYNTHETIC-001',
    });

    expect(dto).toEqual({
      ok: true,
      applicationCode: 'AAP-SYNTHETIC-001',
      state: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      revision: 7,
      submittedAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T01:00:00.000Z',
      nextStep: 'COMPLETE_STARTER_ACCOUNT_ACTIVATION',
      accountCode: 'HAU-SYNTHETIC-001',
      activationReady: true,
    });
  });

  it('projects only authorized, redacted Administrator and Director review fields', () => {
    const application = {
      id: 'APP-SYNTHETIC-001',
      applicationCode: 'AAP-SYNTHETIC-001',
      state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
      revision: 3,
      departmentId: 'USC-DEPT-DOL',
      courseId: 'COURSE-SYNTHETIC',
      yearLevel: 2,
      requestedUsernameNormalized: 'synthetic.applicant',
      requestedAccess: {
        requestedAccountType: 'STAFF',
        requestedRoleId: 'REQUESTER',
        requestedCommitteeIds: ['DOL'],
        requestedWorkspaceIds: ['REQUEST_CENTER'],
        lendingSelfService: true,
        internalLendingOperations: false,
        requestCenterAccess: true,
        hiddenPolicyInput: 'must-not-leak',
      },
      administratorReviewerId: 'ADMIN-NOT-PUBLIC',
      administratorReviewedAt: '2026-08-03T01:00:00.000Z',
      directorReviewerId: 'DIRECTOR-NOT-PUBLIC',
      directorReviewedAt: '',
      emailFingerprint: 'fp-not-public',
      protectedEmailEnvelope: 'v1.not-public',
      protectedProfileEnvelope: 'v1.not-public',
      pendingPasswordCredential: { hash: 'not-public' },
      statusTokenDigest: 'digest-not-public',
      clientRequestId: 'retry-not-public',
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T01:00:00.000Z',
      expiresAt: '2026-09-03T00:00:00.000Z',
    };
    const list = redactedReviewApplicationListDto(application);
    const detail = redactedReviewApplicationDetailDto(application);

    expect(ACCOUNT_APPLICATION_REVIEW_QUEUE.ADMINISTRATOR.state).toBe('PENDING_ADMIN_REVIEW');
    expect(ACCOUNT_APPLICATION_REVIEW_QUEUE.DIRECTOR.state).toBe('PENDING_DIRECTOR_APPROVAL');
    expect(list).toMatchObject({
      id: 'APP-SYNTHETIC-001',
      requestedRoleId: 'REQUESTER',
      submittedAt: '2026-08-03T00:00:00.000Z',
    });
    expect(detail).toMatchObject({
      requestedUsername: 'synthetic.applicant',
      requestedAccess: { requestedCommitteeIds: ['DOL'], requestedWorkspaceIds: ['REQUEST_CENTER'] },
      review: { administrator: { completed: true }, director: { completed: false } },
    });
    const serialized = JSON.stringify({ list, detail });
    for (const forbidden of [
      'ADMIN-NOT-PUBLIC',
      'DIRECTOR-NOT-PUBLIC',
      'fp-not-public',
      'v1.not-public',
      'not-public',
      'digest-not-public',
      'retry-not-public',
      'must-not-leak',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
