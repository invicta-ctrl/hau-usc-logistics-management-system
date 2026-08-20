import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { EMAIL_VERIFICATION_PURPOSE } from '../../src/server/account-application/contracts.js';
import { createD1AccountApplicationRepository } from '../../src/server/d1/account-application-repository.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let sqlite;

afterEach(() => {
  sqlite?.close();
  sqlite = null;
});

function d1Adapter(database) {
  return {
    prepare(sql) {
      const prepared = database.prepare(sql);
      let bindings = [];
      return {
        bind(...values) {
          bindings = values;
          return this;
        },
        async first() {
          return prepared.get(...bindings) ?? null;
        },
        async all() {
          return { results: prepared.all(...bindings) };
        },
        async run() {
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
        async executeBatchStatement() {
          if (/^\s*(?:SELECT|PRAGMA)\b/iu.test(sql)) {
            return { results: prepared.all(...bindings), meta: { changes: 0 } };
          }
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
    async batch(statements) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.executeBatchStatement());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

async function migratedRepository() {
  sqlite = new DatabaseSync(':memory:');
  const migrationDirectory = resolve(repositoryRoot, 'migrations');
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations) {
    sqlite.exec(await readFile(resolve(migrationDirectory, migration), 'utf8'));
  }
  return createD1AccountApplicationRepository(d1Adapter(sqlite));
}

function verificationChallenge(overrides = {}) {
  const id = overrides.id ?? 'CHALLENGE-LIFECYCLE-DEFAULT';
  return {
    id,
    emailFingerprint: `KEYED-EMAIL-FP-${id}`,
    protectedEmailEnvelope: 'v1.synthetic.email-envelope',
    identityClassId: 'SYNTHETIC_STAFF',
    secretDigest: `CODE-DIGEST-${id}`,
    purpose: EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION,
    expiresAt: '2026-08-03T11:00:00.000Z',
    resendCount: 1,
    createdAt: '2026-08-03T10:00:00.000Z',
    ...overrides,
  };
}

function submissionInput({ suffix, emailFingerprint }) {
  const createdAt = '2026-08-03T10:35:00.000Z';
  const applicationId = `APPLICATION-LIFECYCLE-${suffix}`;
  return {
    application: {
      id: applicationId,
      applicationCode: `AAP-LIFECYCLE-${suffix}`,
      emailFingerprint,
      identityClassId: 'SYNTHETIC_STAFF',
      protectedEmailEnvelope: 'v1.synthetic.email-envelope',
      protectedProfileEnvelope: 'v1.synthetic.profile-envelope',
      departmentId: 'USC-DEPT-DOL',
      courseId: 'COURSE-SYNTHETIC',
      yearLevel: 2,
      requestedUsernameNormalized: `sqlite.applicant.${suffix.toLowerCase()}`,
      pendingPasswordCredential: { hash: `synthetic-hash-${suffix}` },
      requestedAccess: { requestedRoleId: 'REQUESTER' },
      state: 'PENDING_ADMIN_REVIEW',
      revision: 2,
      statusTokenDigest: `STATUS-DIGEST-${suffix}`,
      statusTokenExpiresAt: '2026-09-03T10:00:00.000Z',
      clientRequestId: `submit-lifecycle-${suffix}`,
      expiresAt: '2026-09-03T10:00:00.000Z',
      createdAt,
    },
    history: {
      draft: {
        id: `HISTORY-LIFECYCLE-DRAFT-${suffix}`,
        applicationId,
        fromState: 'EMAIL_UNVERIFIED',
        toState: 'DRAFT',
        actorAccountId: '',
        applicantAuthorityFingerprint: 'SYNTHETIC-APPLICANT-AUTHORITY',
        reason: '',
        before: {},
        after: { state: 'DRAFT' },
        expectedRevision: 0,
        resultingRevision: 1,
        idempotencyKey: `initial:${applicationId}`,
        correlationId: `COR-LIFECYCLE-DRAFT-${suffix}`,
        createdAt,
      },
      submission: {
        id: `HISTORY-LIFECYCLE-SUBMIT-${suffix}`,
        applicationId,
        fromState: 'DRAFT',
        toState: 'PENDING_ADMIN_REVIEW',
        actorAccountId: '',
        applicantAuthorityFingerprint: 'SYNTHETIC-APPLICANT-AUTHORITY',
        reason: '',
        before: { state: 'DRAFT' },
        after: { state: 'PENDING_ADMIN_REVIEW' },
        expectedRevision: 1,
        resultingRevision: 2,
        idempotencyKey: `submit-lifecycle-${suffix}`,
        correlationId: `COR-LIFECYCLE-SUBMIT-${suffix}`,
        createdAt,
      },
    },
    audit: {
      id: `AUDIT-LIFECYCLE-SUBMIT-${suffix}`,
      applicationId,
      actorAccountId: '',
      action: 'ACCOUNT_APPLICATION_SUBMITTED',
      before: {},
      after: { state: 'PENDING_ADMIN_REVIEW' },
      correlationId: `COR-LIFECYCLE-AUDIT-${suffix}`,
      reason: '',
      createdAt,
    },
  };
}

describe('account-application verification migration integration', () => {
  it('creates, marks sent, and confirms a challenge through the additive schema-32 D1 repository', async () => {
    const repository = await migratedRepository();
    expect(sqlite.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      sqlite.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get(),
    ).toEqual({ value: '32' });
    const purpose = EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION;
    const challenge = await repository.createVerificationChallenge({
      id: 'CHALLENGE-SCHEMA-30-001',
      emailFingerprint: 'KEYED-EMAIL-FP-SCHEMA-30',
      protectedEmailEnvelope: 'v1.synthetic.email-envelope',
      identityClassId: 'SYNTHETIC_STAFF',
      secretDigest: 'CODE-DIGEST-SCHEMA-30',
      purpose,
      expiresAt: '2026-08-03T10:10:00.000Z',
      resendCount: 0,
      createdAt: '2026-08-03T10:00:00.000Z',
    });

    expect(challenge).toMatchObject({
      purpose: 'STAFF_ACCOUNT_APPLICATION',
      state: 'PENDING',
      lastSentAt: '',
    });

    await repository.markVerificationChallengeSent({
      challengeId: challenge.id,
      emailFingerprint: challenge.emailFingerprint,
      sentAt: '2026-08-03T10:00:01.000Z',
    });
    await expect(repository.getVerificationChallengeById(challenge.id)).resolves.toMatchObject({
      lastSentAt: '2026-08-03T10:00:01.000Z',
    });

    const confirmed = await repository.confirmVerificationChallenge({
      emailFingerprint: challenge.emailFingerprint,
      identityClassId: challenge.identityClassId,
      purpose,
      secretDigest: 'CODE-DIGEST-SCHEMA-30',
      verificationReceiptDigest: 'RECEIPT-DIGEST-SCHEMA-30',
      confirmedAt: '2026-08-03T10:00:02.000Z',
      receiptExpiresAt: '2026-08-03T10:15:02.000Z',
      maxAttempts: 5,
    });

    expect(confirmed).toMatchObject({
      verified: true,
      challenge: {
        purpose: 'STAFF_ACCOUNT_APPLICATION',
        state: 'VERIFIED',
        verificationReceiptDigest: 'RECEIPT-DIGEST-SCHEMA-30',
      },
    });
  });

  it('enforces expiry, attempts, resend invalidation, cooldown rollback, and one-time receipt use in SQLite D1 batches', async () => {
    const repository = await migratedRepository();
    const purpose = EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION;

    const expired = verificationChallenge({
      id: 'CHALLENGE-LIFECYCLE-EXPIRED',
      expiresAt: '2026-08-03T10:00:00.000Z',
      createdAt: '2026-08-03T09:59:00.000Z',
    });
    await repository.createVerificationChallenge(expired);
    await expect(
      repository.confirmVerificationChallenge({
        emailFingerprint: expired.emailFingerprint,
        identityClassId: expired.identityClassId,
        purpose,
        secretDigest: expired.secretDigest,
        verificationReceiptDigest: 'RECEIPT-DIGEST-EXPIRED',
        confirmedAt: '2026-08-03T10:00:00.000Z',
        receiptExpiresAt: '2026-08-03T10:15:00.000Z',
        maxAttempts: 5,
      }),
    ).resolves.toEqual({ verified: false });
    expect(
      sqlite
        .prepare('SELECT status, attempt_count FROM email_verification_challenges WHERE id = ?')
        .get(expired.id),
    ).toEqual({ status: 'EXPIRED', attempt_count: 0 });

    const attempts = verificationChallenge({ id: 'CHALLENGE-LIFECYCLE-ATTEMPTS' });
    await repository.createVerificationChallenge(attempts);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        repository.confirmVerificationChallenge({
          emailFingerprint: attempts.emailFingerprint,
          identityClassId: attempts.identityClassId,
          purpose,
          secretDigest: 'CODE-DIGEST-WRONG',
          verificationReceiptDigest: `RECEIPT-DIGEST-WRONG-${attempt}`,
          confirmedAt: '2026-08-03T10:01:00.000Z',
          receiptExpiresAt: '2026-08-03T10:16:00.000Z',
          maxAttempts: 5,
        }),
      ).resolves.toEqual({ verified: false });
    }
    expect(
      sqlite
        .prepare('SELECT status, attempt_count FROM email_verification_challenges WHERE id = ?')
        .get(attempts.id),
    ).toEqual({ status: 'REVOKED', attempt_count: 5 });

    const firstResend = verificationChallenge({
      id: 'CHALLENGE-LIFECYCLE-RESEND-FIRST',
      emailFingerprint: 'KEYED-EMAIL-FP-RESEND',
      secretDigest: 'CODE-DIGEST-RESEND-FIRST',
      createdAt: '2026-08-03T10:20:00.000Z',
    });
    await repository.createVerificationChallenge(firstResend);
    await repository.markVerificationChallengeSent({
      challengeId: firstResend.id,
      emailFingerprint: firstResend.emailFingerprint,
      sentAt: '2026-08-03T10:20:00.000Z',
    });
    const secondResend = verificationChallenge({
      id: 'CHALLENGE-LIFECYCLE-RESEND-SECOND',
      emailFingerprint: firstResend.emailFingerprint,
      secretDigest: 'CODE-DIGEST-RESEND-SECOND',
      createdAt: '2026-08-03T10:21:00.000Z',
      resendCooldownCutoffAt: '2026-08-03T10:20:00.000Z',
    });
    await repository.createVerificationChallenge(secondResend);
    expect(
      sqlite
        .prepare(
          'SELECT id, status FROM email_verification_challenges WHERE email_fingerprint = ? ORDER BY id',
        )
        .all(firstResend.emailFingerprint),
    ).toEqual([
      { id: firstResend.id, status: 'REVOKED' },
      { id: secondResend.id, status: 'PENDING' },
    ]);

    const beforeCooldown = sqlite
      .prepare(
        'SELECT id, status, last_sent_at FROM email_verification_challenges WHERE email_fingerprint = ? ORDER BY id',
      )
      .all(firstResend.emailFingerprint);
    await expect(
      repository.createVerificationChallenge(
        verificationChallenge({
          id: 'CHALLENGE-LIFECYCLE-RESEND-BLOCKED',
          emailFingerprint: firstResend.emailFingerprint,
          secretDigest: 'CODE-DIGEST-RESEND-BLOCKED',
          createdAt: '2026-08-03T10:21:30.000Z',
          resendCooldownCutoffAt: '2026-08-03T10:20:30.000Z',
        }),
      ),
    ).rejects.toThrow();
    expect(
      sqlite
        .prepare(
          'SELECT id, status, last_sent_at FROM email_verification_challenges WHERE email_fingerprint = ? ORDER BY id',
        )
        .all(firstResend.emailFingerprint),
    ).toEqual(beforeCooldown);

    const receiptChallenge = verificationChallenge({
      id: 'CHALLENGE-LIFECYCLE-RECEIPT',
      emailFingerprint: 'KEYED-EMAIL-FP-RECEIPT',
      secretDigest: 'CODE-DIGEST-RECEIPT',
      createdAt: '2026-08-03T10:30:00.000Z',
    });
    await repository.createVerificationChallenge(receiptChallenge);
    await expect(
      repository.confirmVerificationChallenge({
        emailFingerprint: receiptChallenge.emailFingerprint,
        identityClassId: receiptChallenge.identityClassId,
        purpose,
        secretDigest: receiptChallenge.secretDigest,
        verificationReceiptDigest: 'RECEIPT-DIGEST-ONE-TIME',
        confirmedAt: '2026-08-03T10:31:00.000Z',
        receiptExpiresAt: '2026-08-03T10:46:00.000Z',
        maxAttempts: 5,
      }),
    ).resolves.toMatchObject({ verified: true });

    const firstSubmission = submissionInput({
      suffix: 'FIRST',
      emailFingerprint: receiptChallenge.emailFingerprint,
    });
    await expect(
      repository.createSubmittedApplication({
        ...firstSubmission,
        verificationReceiptDigest: 'RECEIPT-DIGEST-ONE-TIME',
        eligibilityApproved: true,
      }),
    ).resolves.toMatchObject({ id: firstSubmission.application.id });
    expect(
      sqlite
        .prepare('SELECT status FROM email_verification_challenges WHERE id = ?')
        .get(receiptChallenge.id),
    ).toEqual({ status: 'CONSUMED' });

    const replayedReceipt = submissionInput({
      suffix: 'SECOND',
      emailFingerprint: 'KEYED-EMAIL-FP-RECEIPT-OTHER',
    });
    await expect(
      repository.createSubmittedApplication({
        ...replayedReceipt,
        verificationReceiptDigest: 'RECEIPT-DIGEST-ONE-TIME',
        eligibilityApproved: true,
      }),
    ).rejects.toThrow();
    expect(sqlite.prepare('SELECT id FROM account_applications ORDER BY id').all()).toEqual([
      { id: firstSubmission.application.id },
    ]);
  });
});
