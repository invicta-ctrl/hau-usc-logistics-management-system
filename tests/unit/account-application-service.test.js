import { timingSafeEqual, webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_APPLICATION_CAPABILITY,
  ACCOUNT_APPLICATION_STATE,
} from '../../src/server/account-application/contracts.js';
import { createFailClosedEmailProvider } from '../../src/server/account-application/email-provider.js';
import { createPasswordKdf, createTokenCrypto } from '../../src/server/auth/crypto.js';
import { createAccountApplicationService } from '../../src/server/account-application/service.js';

const clone = (value) => structuredClone(value);

const nonterminalApplicationStates = new Set([
  ACCOUNT_APPLICATION_STATE.EMAIL_UNVERIFIED,
  ACCOUNT_APPLICATION_STATE.DRAFT,
  ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
  ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
  ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
  ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
]);

function createRepository() {
  const challenges = new Map();
  const applications = new Map();
  const accounts = new Map();
  const history = [];
  const audits = [];
  const reviewQueries = [];

  const repository = {
    async createVerificationChallenge(challenge) {
      for (const current of challenges.values()) {
        if (
          current.emailFingerprint === challenge.emailFingerprint &&
          current.purpose === challenge.purpose &&
          current.state === 'PENDING'
        ) {
          current.state = 'REVOKED';
        }
      }
      const next = { ...clone(challenge), state: 'PENDING', verificationReceiptDigest: '', attemptCount: 0 };
      challenges.set(next.id, next);
      return clone(next);
    },

    async markVerificationChallengeSent({ challengeId, emailFingerprint, sentAt }) {
      const challenge = challenges.get(challengeId);
      if (!challenge || challenge.emailFingerprint !== emailFingerprint || challenge.state !== 'PENDING') {
        throw new Error('challenge send conflict');
      }
      challenge.lastSentAt = sentAt;
    },

    async confirmVerificationChallenge({
      emailFingerprint,
      identityClassId,
      purpose,
      secretDigest,
      verificationReceiptDigest,
      confirmedAt,
      receiptExpiresAt,
      maxAttempts,
    }) {
      const current = [...challenges.values()]
        .filter(
          (challenge) =>
            challenge.emailFingerprint === emailFingerprint &&
            challenge.identityClassId === identityClassId &&
            challenge.purpose === purpose &&
            challenge.state === 'PENDING',
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      if (!current || current.expiresAt <= confirmedAt || current.attemptCount >= maxAttempts) {
        if (current?.expiresAt <= confirmedAt) current.state = 'EXPIRED';
        return { verified: false };
      }
      if (current.secretDigest !== secretDigest) {
        current.attemptCount += 1;
        if (current.attemptCount >= maxAttempts) current.state = 'REVOKED';
        return { verified: false };
      }
      current.state = 'VERIFIED';
      current.verificationReceiptDigest = verificationReceiptDigest;
      current.verifiedAt = confirmedAt;
      current.expiresAt = receiptExpiresAt;
      return { verified: true, challenge: clone(current) };
    },

    async getVerificationChallengeByReceiptDigest(digest) {
      return clone(
        [...challenges.values()].find((challenge) => challenge.verificationReceiptDigest === digest),
      );
    },

    async getApplicationByClientRequestId(clientRequestId) {
      return clone(
        [...applications.values()].find((application) => application.clientRequestId === clientRequestId),
      );
    },

    async usernameCollides(username, excludeApplicationId = '') {
      const collisionKey = String(username).replaceAll(/[._-]/gu, '');
      return (
        [...accounts.values()].some(
          (account) =>
            account.usernameNormalized === username ||
            String(account.accessIdNormalized ?? '').toLowerCase() === username ||
            String(account.accessIdNormalized ?? '')
              .replaceAll(/[^A-Za-z0-9]/gu, '')
              .toLowerCase() === collisionKey,
        ) ||
        [...applications.values()].some(
          (application) =>
            application.id !== excludeApplicationId &&
            nonterminalApplicationStates.has(application.state) &&
            application.requestedUsernameNormalized === username,
        )
      );
    },

    async identityCollides(emailFingerprint, excludeApplicationId = '') {
      return (
        [...accounts.values()].some(
          (account) =>
            ['ACTIVE', 'STARTER'].includes(account.status) &&
            account.verifiedEmailFingerprint === emailFingerprint,
        ) ||
        [...applications.values()].some(
          (application) =>
            application.id !== excludeApplicationId &&
            nonterminalApplicationStates.has(application.state) &&
            application.emailFingerprint === emailFingerprint,
        )
      );
    },

    async createSubmittedApplication({
      application,
      verificationReceiptDigest,
      eligibilityApproved,
      history: entries,
      audit,
    }) {
      const receipt = [...challenges.values()].find(
        (challenge) => challenge.verificationReceiptDigest === verificationReceiptDigest,
      );
      if (!receipt || receipt.state !== 'VERIFIED' || receipt.expiresAt <= application.createdAt) {
        throw new Error('receipt conflict');
      }
      if (
        applications.has(application.id) ||
        (await repository.getApplicationByClientRequestId(application.clientRequestId))
      ) {
        throw new Error('application conflict');
      }
      if (
        eligibilityApproved !== true ||
        [...accounts.values()].some(
          (account) =>
            ['ACTIVE', 'STARTER'].includes(account.status) &&
            account.verifiedEmailFingerprint === application.emailFingerprint,
        ) ||
        [...applications.values()].some(
          (candidate) =>
            nonterminalApplicationStates.has(candidate.state) &&
            (candidate.emailFingerprint === application.emailFingerprint ||
              candidate.requestedUsernameNormalized === application.requestedUsernameNormalized),
        )
      ) {
        throw new Error('submission guard conflict');
      }
      receipt.state = 'CONSUMED';
      receipt.consumedAt = application.createdAt;
      applications.set(application.id, clone(application));
      history.push(clone(entries.draft), clone(entries.submission));
      audits.push(clone(audit));
      return repository.getApplicationById(application.id);
    },

    async getApplicationById(applicationId) {
      return clone(applications.get(applicationId));
    },

    async listApplicationsForReview({ states, limit, offset }) {
      reviewQueries.push(clone({ states, limit, offset }));
      return clone(
        [...applications.values()]
          .filter((application) => states.includes(application.state))
          .sort(
            (left, right) =>
              String(left.createdAt).localeCompare(String(right.createdAt)) ||
              left.id.localeCompare(right.id),
          )
          .slice(offset, offset + limit),
      );
    },

    async getApplicationForReview({ applicationId, states }) {
      const application = applications.get(applicationId);
      if (!application || !states.includes(application.state)) return undefined;
      return clone(application);
    },

    async listHistoryByApplicationId(applicationId) {
      return clone(history.filter((entry) => entry.applicationId === applicationId));
    },

    async getApplicationByStatusTokenDigest(digest, now) {
      return clone(
        [...applications.values()].find(
          (application) => application.statusTokenDigest === digest && application.statusTokenExpiresAt > now,
        ),
      );
    },

    async resubmitApplication({
      applicationId,
      expectedRevision,
      idempotencyKey,
      occurredAt,
      eligibilityApproved,
      emailFingerprint,
      updates,
      history: entry,
      audit,
    }) {
      const application = applications.get(applicationId);
      if (
        !application ||
        application.state !== 'CHANGES_REQUESTED' ||
        application.revision !== expectedRevision ||
        application.emailFingerprint !== emailFingerprint ||
        eligibilityApproved !== true ||
        history.some((candidate) => candidate.idempotencyKey === idempotencyKey) ||
        [...accounts.values()].some(
          (account) =>
            ['ACTIVE', 'STARTER'].includes(account.status) &&
            (account.verifiedEmailFingerprint === emailFingerprint ||
              account.usernameNormalized === updates.requestedUsernameNormalized ||
              String(account.accessIdNormalized ?? '').toLowerCase() === updates.requestedUsernameNormalized),
        ) ||
        [...applications.values()].some(
          (candidate) =>
            candidate.id !== applicationId &&
            nonterminalApplicationStates.has(candidate.state) &&
            (candidate.emailFingerprint === emailFingerprint ||
              candidate.requestedUsernameNormalized === updates.requestedUsernameNormalized),
        )
      ) {
        throw new Error('resubmission guard conflict');
      }
      Object.assign(application, clone(updates), {
        state: 'PENDING_ADMIN_REVIEW',
        revision: application.revision + 1,
        administratorReviewerId: '',
        administratorReviewedAt: '',
        directorReviewerId: '',
        directorReviewedAt: '',
        changeRequestSummary: '',
        updatedAt: occurredAt,
      });
      history.push(clone(entry));
      audits.push(clone(audit));
      return clone(application);
    },

    async getApplicationReplayByIdempotencyKey(idempotencyKey) {
      const entry = history.find((candidate) => candidate.idempotencyKey === idempotencyKey);
      if (!entry) return undefined;
      return { application: await repository.getApplicationById(entry.applicationId), history: clone(entry) };
    },

    async transitionApplication({
      applicationId,
      fromState,
      toState,
      expectedRevision,
      actorAccountId,
      idempotencyKey,
      updates,
      history: entry,
      audit,
      requireDistinctFromAdministrator,
      revokeApprovedStarter,
    }) {
      const application = applications.get(applicationId);
      if (
        !application ||
        application.state !== fromState ||
        application.revision !== expectedRevision ||
        history.some((candidate) => candidate.idempotencyKey === idempotencyKey) ||
        (requireDistinctFromAdministrator && application.administratorReviewerId === actorAccountId)
      ) {
        throw new Error('transition guard conflict');
      }
      if (revokeApprovedStarter) {
        const account = accounts.get(application.approvedAccountId);
        if (!account || account.status !== 'STARTER') throw new Error('starter revocation guard conflict');
        account.status = 'REVOKED';
      }
      Object.assign(application, clone(updates), { state: toState, revision: application.revision + 1 });
      if (toState === 'CHANGES_REQUESTED') application.changeRequestSummary = entry.reason;
      history.push(clone(entry));
      audits.push(clone(audit));
      return clone(application);
    },

    async approveApplication({
      applicationId,
      expectedRevision,
      actorAccountId,
      idempotencyKey,
      starterAccount,
      history: entry,
      accountAudit,
      applicationAudit,
      allowSameReviewer,
    }) {
      const application = applications.get(applicationId);
      if (
        !application ||
        application.state !== 'PENDING_DIRECTOR_APPROVAL' ||
        application.revision !== expectedRevision ||
        !application.administratorReviewerId ||
        (!allowSameReviewer && application.administratorReviewerId === actorAccountId) ||
        accounts.has(starterAccount.id) ||
        history.some((candidate) => candidate.idempotencyKey === idempotencyKey)
      ) {
        throw new Error('approval guard conflict');
      }
      accounts.set(starterAccount.id, clone({ ...starterAccount, status: 'STARTER' }));
      Object.assign(application, {
        state: 'APPROVED_ACTIVATION_REQUIRED',
        revision: application.revision + 1,
        directorReviewerId: actorAccountId,
        directorReviewedAt: entry.createdAt,
        approvedAccountId: starterAccount.id,
        accountCode: starterAccount.accessIdNormalized,
      });
      history.push(clone(entry));
      audits.push(clone(accountAudit), clone(applicationAudit));
      return clone(application);
    },

    inspect() {
      return clone({
        challenges: [...challenges.values()],
        applications: [...applications.values()],
        accounts: [...accounts.values()],
        history,
        audits,
        reviewQueries,
      });
    },

    seedAccount(account) {
      accounts.set(account.id, clone(account));
    },
  };
  return repository;
}

function testContext({ providerConfigured = true, eligibilityDecision } = {}) {
  let timestamp = Date.parse('2026-08-03T08:00:00.000Z');
  let sequence = 0;
  const sent = [];
  const eligibilityCalls = [];
  const clock = { now: () => timestamp, advance: (milliseconds) => (timestamp += milliseconds) };
  const repository = createRepository();
  const tokenCrypto = createTokenCrypto({ cryptoProvider: webcrypto, timingSafeEqual });
  const passwordKdf = createPasswordKdf({
    cryptoProvider: webcrypto,
    timingSafeEqual,
    defaultIterations: 1_000,
    minimumIterations: 1_000,
  });
  const emailProvider = providerConfigured
    ? {
        configured: true,
        async sendVerification(command) {
          sent.push(clone(command));
        },
      }
    : createFailClosedEmailProvider();
  const service = createAccountApplicationService({
    repository,
    emailProvider,
    identityProtection: {
      async prepareEmail(email) {
        if (String(email).toLowerCase() !== 'eligible@example.test') return { approved: false };
        return {
          approved: true,
          emailFingerprint: 'KEYED-FINGERPRINT-ELIGIBLE',
          protectedEmailEnvelope: 'v1.synthetic.email-envelope',
          identityClassId: 'SYNTHETIC_APPROVED_STAFF',
          providerDelivery: { opaqueDestination: 'synthetic' },
        };
      },
      async protectApplicationProfile() {
        return {
          protectedProfileEnvelope: 'v1.synthetic.profile-envelope',
          profileFingerprint: 'KEYED-PROFILE-FINGERPRINT',
        };
      },
      async fingerprintRequestedAccess() {
        return 'KEYED-ACCESS-FINGERPRINT';
      },
    },
    passwordKdf,
    tokenCrypto,
    rateLimiter: {
      async consume() {
        return { allowed: true };
      },
    },
    submissionEligibility: {
      async evaluate(input) {
        eligibilityCalls.push(clone(input));
        return (
          eligibilityDecision?.(input) ?? {
            allowed: true,
            claimFingerprint: 'ROSTER-POLICY-CLAIM-SYNTHETIC',
          }
        );
      },
    },
    reviewDisclosure: {
      async reveal() {
        return {
          verifiedEmail: 'eligible@example.test',
          legalName: 'Synthetic Applicant Name',
          contactNumber: '+63 917 000 0000',
          identityVerification: { rosterMatched: true, legalNameMatched: true },
        };
      },
    },
    activationHandoff: {
      async prepare({ approvedAt }) {
        return {
          starterAccount: {
            id: 'ACCOUNT-SYNTHETIC-001',
            accessIdNormalized: 'HAU-STAFF-001',
            collisionKey: 'HAUSTAFF001',
            roleId: 'REQUESTER',
            defaultCommitteeId: '',
            committeeIds: [],
            accessProfile: {
              presetId: 'REQUESTER',
              workspaceIds: [],
              defaultWorkspaceId: '',
              locationScopeIds: [],
              eventSeriesScopeIds: [],
              eventScopeIds: [],
              capabilityGrants: [],
              capabilityDenies: [],
            },
            temporaryCredential: {
              algorithm: 'PBKDF2-SHA-256',
              iterations: 1_000,
              salt: 'synthetic-salt',
              hash: 'synthetic-hash',
              peppered: false,
              expiresAt: approvedAt,
              consumedAt: null,
            },
            createdAt: approvedAt,
            lendingEligible: false,
            institutionId: '',
            departmentId: '',
          },
          privateHandoff: {
            accountCode: 'HAU-STAFF-001',
            temporaryCredential: 'ONE-TIME-PRIVATE-CREDENTIAL',
          },
        };
      },
    },
    clock,
    createId: () => `SYNTHETIC-${String(++sequence).padStart(4, '0')}`,
  });
  return { clock, eligibilityCalls, repository, sent, service };
}

const applicationCommand = (verificationReceipt, clientRequestId = 'submit-synthetic-0001') => ({
  verificationReceipt,
  legalName: 'Synthetic Applicant Name',
  contactNumber: '+63 917 000 0000',
  departmentId: 'USC-DEPT-DOL',
  courseId: 'COURSE-SYNTHETIC',
  yearLevel: 2,
  requestedUsername: 'synthetic.applicant',
  requestedAccountType: 'STAFF',
  requestedRoleId: 'REQUESTER',
  requestedCommitteeIds: [],
  requestedWorkspaceIds: [],
  lendingSelfService: true,
  internalLendingOperations: false,
  requestCenterAccess: true,
  password: 'Applicant!Password9472',
  confirmPassword: 'Applicant!Password9472',
  clientRequestId,
});

async function submittedApplication(context) {
  await context.service.startEmailVerification({ email: 'eligible@example.test' });
  const confirmation = await context.service.confirmEmailVerification({
    email: 'eligible@example.test',
    code: context.sent[0].verificationCode,
  });
  const submitted = await context.service.submitApplication(
    applicationCommand(confirmation.verificationReceipt),
  );
  return { confirmation, submitted };
}

describe('account-application service', () => {
  it('keeps verification start generic for unknown identity, unavailable provider, and approved identity', async () => {
    const configured = testContext();
    const approved = await configured.service.startEmailVerification({ email: 'eligible@example.test' });
    const unknown = await configured.service.startEmailVerification({ email: 'unknown@example.test' });
    expect(approved).toEqual(unknown);
    expect(configured.sent).toHaveLength(1);

    const failClosed = testContext({ providerConfigured: false });
    const unavailable = await failClosed.service.startEmailVerification({ email: 'eligible@example.test' });
    expect(unavailable).toEqual(approved);
    expect(failClosed.repository.inspect().challenges).toEqual([]);
  });

  it('stores only verification/status digests and returns each opaque credential boundary once', async () => {
    const context = testContext();
    const { confirmation, submitted } = await submittedApplication(context);
    const stored = context.repository.inspect();
    const serialized = JSON.stringify(stored);

    expect(submitted.statusToken).toBeTruthy();
    expect(stored.challenges[0]).toMatchObject({ state: 'CONSUMED' });
    expect(stored.challenges[0].secretDigest).not.toBe(context.sent[0].verificationCode);
    expect(stored.challenges[0].verificationReceiptDigest).not.toBe(confirmation.verificationReceipt);
    expect(stored.applications[0].statusTokenDigest).not.toBe(submitted.statusToken);
    expect(serialized).not.toContain(context.sent[0].verificationCode);
    expect(serialized).not.toContain(confirmation.verificationReceipt);
    expect(serialized).not.toContain(submitted.statusToken);
    expect(serialized).not.toContain('Applicant!Password9472');
    expect(serialized).not.toContain('Synthetic Applicant Name');

    await expect(
      context.service.confirmEmailVerification({
        email: 'eligible@example.test',
        code: context.sent[0].verificationCode,
      }),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INVALID' });
  });

  it('fails closed and generically for protected-roster decisions and duplicate active or pending identities', async () => {
    const rosterDenied = testContext({ eligibilityDecision: () => ({ allowed: false }) });
    await rosterDenied.service.startEmailVerification({ email: 'eligible@example.test' });
    const deniedConfirmation = await rosterDenied.service.confirmEmailVerification({
      email: 'eligible@example.test',
      code: rosterDenied.sent[0].verificationCode,
    });
    await expect(
      rosterDenied.service.submitApplication(applicationCommand(deniedConfirmation.verificationReceipt)),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_INVALID' });
    expect(rosterDenied.repository.inspect().applications).toEqual([]);
    expect(rosterDenied.eligibilityCalls).toEqual([
      {
        emailFingerprint: 'KEYED-FINGERPRINT-ELIGIBLE',
        identityClassId: 'SYNTHETIC_APPROVED_STAFF',
        requestedUsernameNormalized: 'synthetic.applicant',
        requestedAccessFingerprint: 'KEYED-ACCESS-FINGERPRINT',
      },
    ]);
    expect(JSON.stringify(rosterDenied.eligibilityCalls)).not.toContain('eligible@example.test');
    expect(JSON.stringify(rosterDenied.eligibilityCalls)).not.toContain('Applicant!Password9472');

    const activeDuplicate = testContext();
    activeDuplicate.repository.seedAccount({
      id: 'ACCOUNT-EXISTING-001',
      status: 'STARTER',
      verifiedEmailFingerprint: 'KEYED-FINGERPRINT-ELIGIBLE',
    });
    await activeDuplicate.service.startEmailVerification({ email: 'eligible@example.test' });
    const duplicateConfirmation = await activeDuplicate.service.confirmEmailVerification({
      email: 'eligible@example.test',
      code: activeDuplicate.sent[0].verificationCode,
    });
    await expect(
      activeDuplicate.service.submitApplication(
        applicationCommand(duplicateConfirmation.verificationReceipt),
      ),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_INVALID' });
    expect(activeDuplicate.repository.inspect().applications).toEqual([]);
    expect(activeDuplicate.repository.inspect().challenges[0]).toMatchObject({ state: 'VERIFIED' });

    const pendingDuplicate = testContext();
    await submittedApplication(pendingDuplicate);
    await pendingDuplicate.service.startEmailVerification({ email: 'eligible@example.test' });
    const pendingConfirmation = await pendingDuplicate.service.confirmEmailVerification({
      email: 'eligible@example.test',
      code: pendingDuplicate.sent.at(-1).verificationCode,
    });
    await expect(
      pendingDuplicate.service.submitApplication(
        applicationCommand(pendingConfirmation.verificationReceipt, 'submit-synthetic-duplicate-0002'),
      ),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_INVALID' });
    expect(pendingDuplicate.repository.inspect().applications).toHaveLength(1);
    expect(pendingDuplicate.repository.inspect().challenges.at(-1)).toMatchObject({ state: 'VERIFIED' });

    const usernameConflict = testContext();
    usernameConflict.repository.seedAccount({
      id: 'ACCOUNT-USERNAME-001',
      status: 'ACTIVE',
      usernameNormalized: 'synthetic.applicant',
      verifiedEmailFingerprint: 'KEYED-FINGERPRINT-OTHER',
    });
    await usernameConflict.service.startEmailVerification({ email: 'eligible@example.test' });
    const usernameConfirmation = await usernameConflict.service.confirmEmailVerification({
      email: 'eligible@example.test',
      code: usernameConflict.sent[0].verificationCode,
    });
    await expect(
      usernameConflict.service.submitApplication(
        applicationCommand(usernameConfirmation.verificationReceipt, 'submit-username-conflict-0001'),
      ),
    ).rejects.toMatchObject({
      code: 'ACCOUNT_APPLICATION_USERNAME_TAKEN',
      details: {
        field: 'requestedUsername',
        usernameSuggestions: ['synthetic.applicant.01', 'synthetic.applicant.02', 'synthetic.applicant.03'],
      },
    });
  });

  it('enforces expected revision and returns an idempotent withdrawal replay without a second transition', async () => {
    const context = testContext();
    const { submitted } = await submittedApplication(context);
    await expect(
      context.service.withdraw({
        statusToken: submitted.statusToken,
        expectedRevision: 1,
        reason: 'Applicant chooses not to continue.',
        clientRequestId: 'withdraw-synthetic-0001',
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_REVISION_CONFLICT' });

    const withdrawn = await context.service.withdraw({
      statusToken: submitted.statusToken,
      expectedRevision: 2,
      reason: 'Applicant chooses not to continue.',
      clientRequestId: 'withdraw-synthetic-0001',
    });
    const replayed = await context.service.withdraw({
      statusToken: submitted.statusToken,
      expectedRevision: 2,
      reason: 'Applicant chooses not to continue.',
      clientRequestId: 'withdraw-synthetic-0001',
    });

    expect(withdrawn).toMatchObject({ state: ACCOUNT_APPLICATION_STATE.WITHDRAWN, revision: 3 });
    expect(replayed).toEqual(withdrawn);
    expect(context.repository.inspect().history).toHaveLength(3);
  });

  it('returns a safe change summary and revalidates an applicant resubmission idempotently', async () => {
    const context = testContext();
    const { submitted } = await submittedApplication(context);
    const applicationId = context.repository.inspect().applications[0].id;
    const admin = {
      id: 'ADMIN-SYNTHETIC-001',
      capabilities: [ACCOUNT_APPLICATION_CAPABILITY.ADMIN_REVIEW],
    };
    await context.service.adminRequestChanges({
      actor: admin,
      applicationId,
      expectedRevision: 2,
      reason: 'Please correct the requested username and contact details.',
      reviewEvidence: {
        evidenceFingerprint: 'EVIDENCE-FINGERPRINT-RESUBMIT',
        protectedReviewEnvelope: 'v1.synthetic.review-envelope-resubmit',
      },
      clientRequestId: 'admin-changes-resubmit-0001',
    });

    await expect(context.service.getStatus({ statusToken: submitted.statusToken })).resolves.toMatchObject({
      state: ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
      revision: 3,
      changeRequestSummary: 'Please correct the requested username and contact details.',
    });

    const command = {
      ...applicationCommand('', 'applicant-resubmit-0001'),
      statusToken: submitted.statusToken,
      expectedRevision: 3,
      requestedUsername: 'synthetic.updated',
      contactNumber: '+63 917 000 0042',
    };
    const resubmitted = await context.service.resubmitApplication(command);
    const replayed = await context.service.resubmitApplication(command);

    expect(resubmitted).toMatchObject({
      state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
      revision: 4,
    });
    expect(resubmitted).not.toHaveProperty('statusToken');
    expect(resubmitted).not.toHaveProperty('changeRequestSummary');
    expect(replayed).toEqual(resubmitted);
    expect(context.eligibilityCalls.at(-1)).toMatchObject({
      emailFingerprint: 'KEYED-FINGERPRINT-ELIGIBLE',
      identityClassId: 'SYNTHETIC_APPROVED_STAFF',
      requestedUsernameNormalized: 'synthetic.updated',
    });
    expect(context.repository.inspect().applications[0]).toMatchObject({
      state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
      requestedUsernameNormalized: 'synthetic.updated',
      administratorReviewerId: '',
      directorReviewerId: '',
    });
    expect(context.repository.inspect().history).toHaveLength(4);
  });

  it('requires distinct Administrator and Director review, then preserves a one-time private activation handoff', async () => {
    const context = testContext();
    const { submitted } = await submittedApplication(context);
    const admin = { id: 'ADMIN-SYNTHETIC-001', capabilities: [ACCOUNT_APPLICATION_CAPABILITY.ADMIN_REVIEW] };
    const director = {
      id: 'DIRECTOR-SYNTHETIC-001',
      capabilities: [ACCOUNT_APPLICATION_CAPABILITY.DIRECTOR_DECIDE],
    };
    const applicationId = context.repository.inspect().applications[0].id;
    const dualRoleReviewer = {
      id: admin.id,
      capabilities: [
        ACCOUNT_APPLICATION_CAPABILITY.ADMIN_REVIEW,
        ACCOUNT_APPLICATION_CAPABILITY.DIRECTOR_DECIDE,
      ],
    };
    const adminQueue = await context.service.adminList({ actor: admin, limit: 1 });
    const adminDetail = await context.service.adminGet({ actor: admin, applicationId });
    const redactedAdminReview = JSON.stringify({ adminQueue, adminDetail });
    expect(adminQueue).toMatchObject({
      ok: true,
      applications: [
        {
          id: applicationId,
          state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          requestedRoleId: 'REQUESTER',
        },
      ],
      pagination: { limit: 1, offset: 0, hasMore: false, nextOffset: null },
    });
    expect(adminDetail).toMatchObject({
      ok: true,
      application: {
        id: applicationId,
        requestedUsername: 'synthetic.applicant',
        requestedAccess: { requestedRoleId: 'REQUESTER' },
        verifiedEmail: 'eligible@example.test',
        legalName: 'Synthetic Applicant Name',
        contactNumber: '+63 917 000 0000',
        identityVerification: { rosterMatched: true, legalNameMatched: true },
        review: { administrator: { completed: false }, director: { completed: false } },
        history: [
          {
            toState: ACCOUNT_APPLICATION_STATE.DRAFT,
            resultingRevision: 1,
          },
          {
            toState: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
            resultingRevision: 2,
          },
        ],
      },
    });
    expect(redactedAdminReview).not.toContain('KEYED-FINGERPRINT-ELIGIBLE');
    expect(redactedAdminReview).not.toContain('v1.synthetic');
    expect(redactedAdminReview).not.toContain('Applicant!Password9472');
    expect(redactedAdminReview).not.toContain('STATUS-DIGEST');
    expect(redactedAdminReview).not.toContain('submit-synthetic-0001');
    expect(context.repository.inspect().reviewQueries).toEqual([
      {
        states: [ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW],
        limit: 2,
        offset: 0,
      },
    ]);
    await expect(context.service.directorList({ actor: admin })).rejects.toMatchObject({
      code: 'ACCOUNT_APPLICATION_AUTHORITY_REQUIRED',
    });
    await expect(
      context.service.adminList({
        actor: admin,
        filter: { state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL },
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_INVALID' });
    const forwarded = await context.service.adminForward({
      actor: admin,
      applicationId,
      expectedRevision: submitted.revision,
      reason: 'Verified directory and proposed access were reviewed.',
      reviewEvidence: {
        evidenceFingerprint: 'ADMIN-EVIDENCE-FP',
        protectedReviewEnvelope: 'v1.admin-review',
      },
      clientRequestId: 'admin-forward-synthetic-001',
    });
    expect(forwarded).toMatchObject({
      state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
      revision: 3,
    });

    await expect(context.service.adminGet({ actor: admin, applicationId })).rejects.toMatchObject({
      code: 'ACCOUNT_APPLICATION_NOT_FOUND',
    });
    const directorQueue = await context.service.directorList({
      actor: director,
      state: 'PENDING_DIRECTOR_APPROVAL',
    });
    const directorDetail = await context.service.directorGet({ actor: director, applicationId });
    expect(directorQueue).toMatchObject({
      applications: [{ id: applicationId, state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL }],
      pagination: { limit: 25, offset: 0, hasMore: false, nextOffset: null },
    });
    expect(directorDetail).toMatchObject({
      application: {
        id: applicationId,
        review: { administrator: { completed: true }, director: { completed: false } },
      },
    });

    await expect(
      context.service.directorApprove({
        actor: dualRoleReviewer,
        applicationId,
        expectedRevision: 3,
        reason: 'Attempting prohibited same-reviewer approval.',
        reviewEvidence: {
          evidenceFingerprint: 'DIRECTOR-EVIDENCE-FP',
          protectedReviewEnvelope: 'v1.director-review',
        },
        clientRequestId: 'director-approve-synthetic-001',
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_SAME_REVIEWER' });

    const approved = await context.service.directorApprove({
      actor: director,
      applicationId,
      expectedRevision: 3,
      reason: 'Director approved the independently reviewed application.',
      reviewEvidence: {
        evidenceFingerprint: 'DIRECTOR-EVIDENCE-FP',
        protectedReviewEnvelope: 'v1.director-review',
      },
      clientRequestId: 'director-approve-synthetic-002',
    });
    const replayed = await context.service.directorApprove({
      actor: director,
      applicationId,
      expectedRevision: 3,
      reason: 'Director approved the independently reviewed application.',
      reviewEvidence: {
        evidenceFingerprint: 'DIRECTOR-EVIDENCE-FP',
        protectedReviewEnvelope: 'v1.director-review',
      },
      clientRequestId: 'director-approve-synthetic-002',
    });
    const persisted = JSON.stringify(context.repository.inspect());

    expect(approved).toMatchObject({
      state: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      revision: 4,
      accountCode: 'HAU-STAFF-001',
      activationReady: true,
      activationHandoff: { temporaryCredential: 'ONE-TIME-PRIVATE-CREDENTIAL' },
    });
    expect(replayed).toMatchObject({ replayed: true, activationReady: true });
    expect(replayed).not.toHaveProperty('activationHandoff');
    expect(persisted).not.toContain('ONE-TIME-PRIVATE-CREDENTIAL');
    expect(JSON.stringify(context.repository.inspect().audits)).not.toContain('v1.admin-review');
    expect(JSON.stringify(context.repository.inspect().audits)).not.toContain('v1.director-review');
  });

  it('requires owner override confirmation and durable safe follow-up capture', async () => {
    const context = testContext();
    const { submitted } = await submittedApplication(context);
    const applicationId = context.repository.inspect().applications[0].id;
    const owner = {
      id: 'OWNER-SYNTHETIC-001',
      capabilities: [ACCOUNT_APPLICATION_CAPABILITY.OWNER_OVERRIDE],
    };

    await expect(
      context.service.ownerOverride({
        actor: owner,
        applicationId,
        expectedRevision: submitted.revision,
        reason: 'System Owner reviews a documented exception.',
        clientRequestId: 'owner-override-synthetic-001',
        override: {
          action: 'FORWARD',
          currentState: 'DRAFT',
          effectiveAccessFingerprint: 'ACCESS-FP',
          sessionImpactFingerprint: 'SESSION-FP',
          followUpReviewReference: 'FOLLOW-UP-001',
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_APPLICATION_OVERRIDE_INVALID' });

    const result = await context.service.ownerOverride({
      actor: owner,
      applicationId,
      expectedRevision: submitted.revision,
      reason: 'System Owner reviews a documented exception.',
      clientRequestId: 'owner-override-synthetic-002',
      override: {
        action: 'FORWARD',
        currentState: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
        effectiveAccessFingerprint: 'ACCESS-FP',
        sessionImpactFingerprint: 'SESSION-FP',
        followUpReviewReference: 'FOLLOW-UP-001',
      },
    });
    expect(result).toMatchObject({ state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL, revision: 3 });
    expect(context.repository.inspect().history.at(-1).after).toMatchObject({
      ownerOverride: true,
      effectiveAccessFingerprint: 'ACCESS-FP',
      sessionImpactFingerprint: 'SESSION-FP',
      followUpReviewReference: 'FOLLOW-UP-001',
    });
  });
});
