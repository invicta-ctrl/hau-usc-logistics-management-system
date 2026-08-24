/* R3-A1-A2 — the owner-approved routing matrix, asserted directly.
 *
 * `docs/frontend/ROUTING.md` §"Entry-intent routing matrix" is the prose form of
 * these cases. This file is the executable form: every row of that table has a
 * test here, so the matrix cannot drift from the code without a red test.
 */

import { describe, expect, it } from 'vitest';

import {
  DENIAL_COPY,
  resolvePostAuthDestination,
  resolveStaffHome,
  STAFF_HOME_ORDER,
} from '../../src/frontend/app/entryIntent';

/** Non-DOL eligible USC requester. Mirrors ROLES.REQUESTER in src/domain/permissions.js:
 *  [view.request, request.create, lending.create] — no view.internal. */
const requester = {
  authenticated: true,
  displayName: 'USC Officer',
  role: 'REQUESTER',
  initials: 'UO',
  capabilities: ['request-center', 'profile'],
  requesterEligible: true,
  internalOperator: false,
};

/** DOL staff. Carries view.internal plus request.create, so it is both an
 *  internal operator and an eligible requester. */
const dolStaff = {
  authenticated: true,
  displayName: 'DOL Staff',
  role: 'DOL_STAFF',
  initials: 'DS',
  capabilities: [
    'overview',
    'inventory',
    'request-center',
    'lending',
    'release',
    'restocking',
    'procurement',
    'profile',
  ],
  requesterEligible: true,
  internalOperator: true,
};

/** An internal operator whose capability set does not include Overview. Proves
 *  the DOL shortcut resolves a capability-appropriate home rather than assuming
 *  Overview exists for everyone. */
const releaseOnlyStaff = {
  ...dolStaff,
  displayName: 'Release Desk',
  capabilities: ['release', 'profile'],
};

/** Signed in, but neither an eligible requester nor an internal operator —
 *  an ordinary student account, or a revoked one. */
const ineligible = {
  authenticated: true,
  displayName: 'Angelite Student',
  role: 'REQUESTER',
  initials: 'AS',
  capabilities: [],
  requesterEligible: false,
  internalOperator: false,
};

describe('R3-A1-A2 entry-intent routing matrix', () => {
  describe('explicit External Request Center intent is preserved', () => {
    it('routes an eligible non-DOL requester to the External Request Center', () => {
      expect(resolvePostAuthDestination(requester, 'EXTERNAL_REQUEST_CENTER', null)).toEqual({
        outcome: 'authorized',
        route: 'external-request',
        requesterMode: true,
      });
    });

    it('keeps DOL staff in requester mode instead of diverting them to the Main Logistics Hub', () => {
      // This is the specific defect R3-A1-A2 §10 names: a DOL account that chose
      // "Start a logistics request" asked for requester mode, and capability-based
      // default routing must not override that explicit intent.
      expect(resolvePostAuthDestination(dolStaff, 'EXTERNAL_REQUEST_CENTER', null)).toEqual({
        outcome: 'authorized',
        route: 'external-request',
        requesterMode: true,
      });
    });

    it('denies an ineligible account without revealing anything about other accounts', () => {
      const decision = resolvePostAuthDestination(ineligible, 'EXTERNAL_REQUEST_CENTER', null);
      expect(decision).toEqual({ outcome: 'denied', reason: 'NOT_ELIGIBLE_REQUESTER' });
      const copy = DENIAL_COPY[decision.reason];
      expect(copy.detail).toContain('Public Lending');
      expect(copy.detail).not.toMatch(/directory|does not exist|no such account/iu);
    });
  });

  describe('generic staff sign-in chooses a default home from capabilities', () => {
    it('sends DOL/internal staff to the Main Logistics Hub', () => {
      expect(resolvePostAuthDestination(dolStaff, 'GENERIC_STAFF_SIGN_IN', null)).toEqual({
        outcome: 'authorized',
        route: 'overview',
        requesterMode: false,
      });
    });

    it('sends an eligible non-DOL requester to the External Request Center', () => {
      expect(resolvePostAuthDestination(requester, 'GENERIC_STAFF_SIGN_IN', null)).toEqual({
        outcome: 'authorized',
        route: 'external-request',
        requesterMode: true,
      });
    });

    it('never assumes Overview: an internal account without it lands on what it does hold', () => {
      expect(resolvePostAuthDestination(releaseOnlyStaff, 'GENERIC_STAFF_SIGN_IN', null)).toEqual({
        outcome: 'authorized',
        route: 'release',
        requesterMode: false,
      });
    });

    it('states a truthful access state when the account holds nothing at all', () => {
      expect(resolvePostAuthDestination(ineligible, 'GENERIC_STAFF_SIGN_IN', null)).toEqual({
        outcome: 'denied',
        reason: 'NO_ACCESS_AT_ALL',
      });
    });

    it('does not treat the authenticated Profile route as a workspace entitlement', () => {
      const profileOnly = { ...ineligible, capabilities: ['profile'] };
      expect(resolveStaffHome(profileOnly)).toBeNull();
      expect(resolvePostAuthDestination(profileOnly, 'GENERIC_STAFF_SIGN_IN', null)).toEqual({
        outcome: 'denied',
        reason: 'NO_ACCESS_AT_ALL',
      });
    });
  });

  describe('direct internal destinations are checked against server-derived capability', () => {
    it('admits DOL staff holding the Request capability to the Internal Request Hub', () => {
      expect(resolvePostAuthDestination(dolStaff, 'INTERNAL_REQUEST_HUB', null)).toEqual({
        outcome: 'authorized',
        route: 'request-center',
        requesterMode: false,
      });
    });

    it('denies an internal destination the account lacks capability for', () => {
      expect(resolvePostAuthDestination(releaseOnlyStaff, 'INTERNAL_REQUEST_HUB', null)).toEqual({
        outcome: 'denied',
        reason: 'NO_INTERNAL_CAPABILITY',
      });
    });

    it('denies a non-DOL requester reaching for an internal route', () => {
      // `requester` does carry the `request-center` route capability (view.request),
      // so the meaningful denial is a route it genuinely lacks.
      expect(resolvePostAuthDestination(requester, 'OTHER_INTERNAL_DESTINATION', 'administration')).toEqual({
        outcome: 'denied',
        reason: 'NO_INTERNAL_CAPABILITY',
      });
    });
  });

  describe('resolveStaffHome', () => {
    it('returns null for an account with no internal route', () => {
      expect(resolveStaffHome(ineligible)).toBeNull();
      expect(resolveStaffHome(null)).toBeNull();
    });

    it('follows the declared priority order', () => {
      expect(resolveStaffHome(dolStaff)).toBe('overview');
      expect(resolveStaffHome(releaseOnlyStaff)).toBe('release');
      expect(STAFF_HOME_ORDER[0]).toBe('overview');
    });
  });
});
