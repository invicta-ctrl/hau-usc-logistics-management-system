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

describe('account-application verification migration integration', () => {
  it('creates, marks sent, and confirms a challenge through the schema-30 D1 repository', async () => {
    const repository = await migratedRepository();
    expect(sqlite.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      sqlite.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get(),
    ).toEqual({ value: '31' });
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
});
