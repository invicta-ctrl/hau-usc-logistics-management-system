import { describe, expect, it } from 'vitest';
import { createD1ProfileRepository } from '../../src/server/d1/profile-repository.js';

function statementFactory(db, sql) {
  const statement = {
    sql: String(sql),
    values: [],
    bind(...values) {
      statement.values = values;
      return statement;
    },
    async first() {
      return db.firstResult;
    },
    async all() {
      return { results: db.allResults };
    },
  };
  return statement;
}

class FakeDb {
  constructor() {
    this.firstResult = null;
    this.allResults = [];
    this.batchCalls = [];
    this.forceConflict = false;
  }

  prepare(sql) {
    return statementFactory(this, sql);
  }

  async batch(statements) {
    this.batchCalls.push(statements);
    if (this.forceConflict) return [{ meta: { changes: 0 } }];
    return statements.map(() => ({ meta: { changes: 1 } }));
  }
}

const evidence = {
  audit: {
    id: 'AUD-PROFILE-1',
    createdAt: '2026-08-03T12:00:00.000Z',
    action: 'PROFILE_CONTACT_UPDATED',
    accountId: 'ACCOUNT-1',
    actorId: 'ACCOUNT-1',
    before: { contactChanged: true },
    after: { contactChanged: true },
    correlationId: 'COR-PROFILE-1',
  },
  idempotency: {
    scope: 'PROFILE_CONTACT_UPDATE',
    key: 'profile-key-0001',
    actorAccountId: 'ACCOUNT-1',
    requestFingerprint: 'fingerprint',
    result: { ok: true },
    createdAt: '2026-08-03T12:00:00.000Z',
  },
};

describe('v0.7.2 profile D1 repository', () => {
  it('uses an updated_at guard and emits no evidence after a stale zero-row update', async () => {
    const db = new FakeDb();
    db.forceConflict = true;
    const repository = createD1ProfileRepository(db);
    await expect(
      repository.updateContact({
        accountId: 'ACCOUNT-1',
        expectedUpdatedAt: '2026-08-03T12:00:00.000Z',
        mobileNumber: '+639171234567',
        changedAt: '2026-08-03T12:01:00.000Z',
        evidence,
      }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT', status: 409 });
    expect(db.batchCalls).toHaveLength(1);
    expect(db.batchCalls[0]).toHaveLength(1);
    expect(db.batchCalls[0][0].sql).toContain('updated_at = ?4');
  });

  it('guards password changes with credential_version and updated_at, then revokes sessions', async () => {
    const db = new FakeDb();
    const repository = createD1ProfileRepository(db);
    await repository.changePassword({
      accountId: 'ACCOUNT-1',
      expectedCredentialVersion: 3,
      expectedUpdatedAt: '2026-08-03T12:00:00.000Z',
      passwordCredential: { algorithm: 'TEST', hash: 'opaque' },
      changedAt: '2026-08-03T12:01:00.000Z',
      evidence,
    });
    expect(db.batchCalls).toHaveLength(2);
    expect(db.batchCalls[0][0].sql).toContain('credential_version = ?4');
    expect(db.batchCalls[0][0].sql).toContain('updated_at = ?5');
    expect(db.batchCalls[1].some((statement) => statement.sql.includes('DELETE FROM sessions'))).toBe(true);
  });

  it('writes username history and keeps audit evidence free of username values', async () => {
    const db = new FakeDb();
    const repository = createD1ProfileRepository(db);
    await repository.changeUsername({
      accountId: 'ACCOUNT-1',
      expectedUpdatedAt: '2026-08-03T12:00:00.000Z',
      oldUsername: 'old.user',
      newUsername: 'new.user',
      changedAt: '2026-08-03T12:01:00.000Z',
      reason: 'Self-service username change',
      historyId: 'USERNAME-HISTORY-1',
      evidence: {
        ...evidence,
        audit: { ...evidence.audit, action: 'PROFILE_USERNAME_CHANGED', after: { sessionsRevoked: true } },
        idempotency: { ...evidence.idempotency, scope: 'PROFILE_USERNAME_CHANGE' },
      },
    });
    expect(db.batchCalls[1].some((statement) => statement.sql.includes('INSERT INTO username_history'))).toBe(
      true,
    );
    const auditStatement = db.batchCalls[1].find((statement) =>
      statement.sql.includes('INSERT INTO audit_log'),
    );
    expect(JSON.stringify(auditStatement.values)).not.toContain('new.user');
  });
});
