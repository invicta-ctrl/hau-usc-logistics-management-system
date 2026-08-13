import { ROLES } from '../../domain/constants.js';
import { normalizeEmailForMatching } from './contracts.js';

export const IDENTITY_FOUNDATION_RECONCILIATION_STATUS = Object.freeze({
  READY: 'READY',
  READY_WITH_QUARANTINE: 'READY_WITH_QUARANTINE',
  BLOCKED_SOURCE_PROJECTION_MISMATCH: 'BLOCKED_SOURCE_PROJECTION_MISMATCH',
  BLOCKED_NO_APPLIED_PROJECTION: 'BLOCKED_NO_APPLIED_PROJECTION',
});

export class IdentityFoundationReconciliationError extends Error {
  constructor(code, { status = 400 } = {}) {
    super('The canonical identity reconciliation request is not authorized.');
    this.name = 'IdentityFoundationReconciliationError';
    this.code = code;
    this.status = status;
  }
}

function assertOwner(actor) {
  if (String(actor?.roleId ?? '').toUpperCase() !== ROLES.SYSTEM_OWNER) {
    throw new IdentityFoundationReconciliationError('IDENTITY_FOUNDATION_OWNER_REQUIRED', { status: 403 });
  }
}

function count(value) {
  return Math.max(0, Number(value) || 0);
}

function activeVerifiedCanonicalMatches(matches) {
  return matches.filter(
    (entry) =>
      String(entry?.state).toUpperCase() === 'ACTIVE' &&
      String(entry?.verificationState).toUpperCase() === 'VERIFIED',
  );
}

function eligibleAccountCandidates(accounts) {
  return accounts.filter(
    (account) =>
      ['ACTIVE', 'STARTER'].includes(String(account?.status).toUpperCase()) &&
      Boolean(String(account?.profileEmailVerifiedAt ?? '').trim()),
  );
}

function emptyCandidates() {
  return {
    canonicalPersonCreateCount: 0,
    canonicalPersonExistingCount: 0,
    explicitAccountLinkCandidateCount: 0,
    existingAccountLinkCount: 0,
    quarantineCount: 0,
    preservedInactiveOrUnverifiedCount: 0,
    assignmentCreateCount: 0,
  };
}

function safeSource(run, entryCount, matchingProjectionCount) {
  const acceptedProjectionCount = count(run?.acceptedCount);
  return Object.freeze({
    sourceRowCount: count(run?.sourceRowCount),
    acceptedProjectionCount,
    rejectedSourceRowCount: count(run?.rejectionCount),
    currentProjectionEntryCount: entryCount,
    matchingProjectionEntryCount: matchingProjectionCount,
    projectionDiscrepancy: Math.max(
      Math.abs(acceptedProjectionCount - entryCount),
      Math.abs(acceptedProjectionCount - matchingProjectionCount),
      Math.abs(entryCount - matchingProjectionCount),
    ),
    providerRead: false,
  });
}

function safety() {
  return Object.freeze({
    dataMutation: false,
    providerRead: false,
    privilegeMutation: false,
    assignmentMutation: false,
    effectiveDatesInvented: false,
  });
}

export function createIdentityFoundationReconciliationService({
  legacyRosterRepository,
  foundationRepository,
  crypto,
} = {}) {
  if (!legacyRosterRepository || !foundationRepository || !crypto) {
    throw new Error('Canonical identity reconciliation dependencies are required.');
  }

  return Object.freeze({
    async preview({ actor } = {}) {
      assertOwner(actor);
      const [run, entries] = await Promise.all([
        legacyRosterRepository.latestAppliedRun(),
        legacyRosterRepository.listEntries(),
      ]);
      if (!run || String(run.applyStatus).toUpperCase() !== 'APPLIED') {
        return Object.freeze({
          status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_NO_APPLIED_PROJECTION,
          source: safeSource(null, entries.length, 0),
          candidates: emptyCandidates(),
          safety: safety(),
          planFingerprint: await crypto.fingerprint({ status: 'BLOCKED_NO_APPLIED_PROJECTION' }),
        });
      }

      const matchingEntries = entries.filter(
        (entry) =>
          entry?.sourceRunId === run.id &&
          String(entry?.sourceFingerprint ?? '') === String(run.sourceFingerprint ?? ''),
      );
      const source = safeSource(run, entries.length, matchingEntries.length);
      if (source.projectionDiscrepancy !== 0) {
        return Object.freeze({
          status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_SOURCE_PROJECTION_MISMATCH,
          source,
          candidates: emptyCandidates(),
          safety: safety(),
          planFingerprint: await crypto.fingerprint({
            status: 'BLOCKED_SOURCE_PROJECTION_MISMATCH',
            source,
          }),
        });
      }

      const candidates = emptyCandidates();
      for (const entry of matchingEntries) {
        let profile;
        try {
          profile = await crypto.decrypt(entry.protectedProfileEnvelope);
        } catch {
          candidates.quarantineCount += 1;
          continue;
        }
        const email = normalizeEmailForMatching(profile?.institutionalEmail);
        const identityKey = await crypto.identityKey(email);
        const verifiedActive =
          profile?.active === true && String(profile?.verificationResult).toUpperCase() === 'VERIFIED';
        if (!email || identityKey !== entry.identityKey) {
          candidates.quarantineCount += 1;
          continue;
        }
        if (!verifiedActive) {
          candidates.preservedInactiveOrUnverifiedCount += 1;
          continue;
        }

        const [matches, accounts] = await Promise.all([
          foundationRepository.listCanonicalEmailMatches(entry.identityKey),
          foundationRepository.listAccountsByVerifiedEmailFingerprint(entry.identityKey),
        ]);
        const activeMatches = activeVerifiedCanonicalMatches(matches);
        const matchingPersonIds = new Set(activeMatches.map((match) => match.personId));
        if (matchingPersonIds.size > 1 || (matches.length && activeMatches.length !== 1)) {
          candidates.quarantineCount += 1;
          continue;
        }

        const accountCandidates = eligibleAccountCandidates(accounts);
        if (accountCandidates.length > 1) {
          candidates.quarantineCount += 1;
          continue;
        }

        const personId = activeMatches[0]?.personId ?? null;
        if (personId) candidates.canonicalPersonExistingCount += 1;
        else candidates.canonicalPersonCreateCount += 1;
        const account = accountCandidates[0];
        if (!account) continue;
        const activeLink = await foundationRepository.getActiveAccountStaffLink(account.id);
        if (!activeLink) {
          candidates.explicitAccountLinkCandidateCount += 1;
        } else if (personId && activeLink.personId === personId) {
          candidates.existingAccountLinkCount += 1;
        } else {
          candidates.quarantineCount += 1;
        }
      }

      const status =
        candidates.quarantineCount > 0
          ? IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE
          : IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY;
      const plan = Object.freeze({
        status,
        source,
        candidates: Object.freeze(candidates),
        safety: safety(),
      });
      return Object.freeze({
        ...plan,
        planFingerprint: await crypto.fingerprint({ status, source, candidates }),
      });
    },
  });
}
