import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_APPLICATION_NONTERMINAL_STATES,
  ACCOUNT_APPLICATION_STATE,
  ACCOUNT_APPLICATION_STATES,
  assertAccountApplicationTransition,
  canTransitionAccountApplication,
  publicApplicationStatusDto,
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
});
