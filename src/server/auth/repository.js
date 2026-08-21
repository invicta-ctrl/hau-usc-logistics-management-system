function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function resetConflictError() {
  const error = new Error('The password reset could not be completed.');
  error.code = 'RESET_CONFLICT';
  return error;
}

function restoreMap(target, entries) {
  target.clear();
  for (const [key, value] of entries) target.set(key, value);
}

export function createInMemoryAuthRepository(seedAccounts = []) {
  const accounts = new Map();
  const accessIndex = new Map();
  const usernameIndex = new Map();
  const verifiedEmailIndex = new Map();
  const sessions = new Map();
  const resetTokens = new Map();
  const auditEvents = [];
  let passwordResetCommitQueue = Promise.resolve();

  const serializePasswordResetCommit = (commit) => {
    const result = passwordResetCommitQueue.then(commit);
    passwordResetCommitQueue = result.catch(() => undefined);
    return result;
  };

  const saveAccount = async (account) => {
    const next = clone(account);
    const prior = accounts.get(next.id);
    const nextUsername = next.usernameNormalized?.toLowerCase() ?? '';
    const assignedUsername = nextUsername ? usernameIndex.get(nextUsername) : '';
    if (assignedUsername && assignedUsername !== next.id) throw new Error('Username is already assigned.');
    if (prior?.accessIdNormalized && prior.accessIdNormalized !== next.accessIdNormalized) {
      accessIndex.delete(prior.accessIdNormalized);
    }
    if (prior?.profileEmailVerifiedAt && prior.profile?.email) {
      verifiedEmailIndex.delete(prior.profile.email.toLowerCase());
    }
    if (prior?.usernameNormalized) usernameIndex.delete(prior.usernameNormalized.toLowerCase());
    if (next.profileEmailVerifiedAt && next.profile?.email) {
      const email = next.profile.email.toLowerCase();
      const assigned = verifiedEmailIndex.get(email);
      if (assigned && assigned !== next.id) throw new Error('Verified email is already assigned.');
      verifiedEmailIndex.set(email, next.id);
    }
    accounts.set(next.id, next);
    accessIndex.set(next.accessIdNormalized, next.id);
    if (nextUsername) usernameIndex.set(nextUsername, next.id);
    return clone(next);
  };

  const repository = {
    async runTransaction(callback) {
      return callback(repository);
    },
    async getAccountByAccessId(accessIdNormalized) {
      const id = accessIndex.get(accessIdNormalized);
      return clone(id ? accounts.get(id) : undefined);
    },
    async getAccountByLoginIdentifier(identifier) {
      const value = String(identifier ?? '');
      const id =
        accessIndex.get(value.toUpperCase()) ??
        usernameIndex.get(value.toLowerCase()) ??
        verifiedEmailIndex.get(value.toLowerCase());
      return clone(id ? accounts.get(id) : undefined);
    },
    async getAccountById(accountId) {
      return clone(accounts.get(accountId));
    },
    saveAccount,
    async createSession(session) {
      sessions.set(session.tokenDigest, clone(session));
      return clone(session);
    },
    async getSession(tokenDigest) {
      return clone(sessions.get(tokenDigest));
    },
    async saveSession(session) {
      sessions.set(session.tokenDigest, clone(session));
      return clone(session);
    },
    async deleteSession(tokenDigest) {
      sessions.delete(tokenDigest);
    },
    async deleteSessionsForAccount(accountId) {
      for (const [digest, session] of sessions) {
        if (session.accountId === accountId) sessions.delete(digest);
      }
    },
    async createResetToken(resetToken) {
      resetTokens.set(resetToken.tokenDigest, clone(resetToken));
      return clone(resetToken);
    },
    async getResetToken(tokenDigest) {
      return clone(resetTokens.get(tokenDigest));
    },
    async consumeResetToken(tokenDigest, consumedAt) {
      const token = resetTokens.get(tokenDigest);
      if (!token || token.consumedAt) return false;
      token.consumedAt = consumedAt;
      resetTokens.set(tokenDigest, token);
      return true;
    },
    async commitPasswordReset({
      tokenDigest,
      accountId,
      expectedCredentialVersion,
      passwordCredential,
      resetAt,
      audit,
    } = {}) {
      return serializePasswordResetCommit(async () => {
        const snapshot = {
          accounts: clone([...accounts]),
          accessIndex: clone([...accessIndex]),
          usernameIndex: clone([...usernameIndex]),
          verifiedEmailIndex: clone([...verifiedEmailIndex]),
          sessions: clone([...sessions]),
          resetTokens: clone([...resetTokens]),
          auditEvents: clone(auditEvents),
        };
        try {
          const token = resetTokens.get(tokenDigest);
          const account = accounts.get(accountId);
          const resetAtMs = new Date(resetAt).getTime();
          if (
            !token ||
            token.accountId !== accountId ||
            token.consumedAt ||
            !Number.isFinite(resetAtMs) ||
            new Date(token.expiresAt).getTime() <= resetAtMs ||
            !account ||
            account.status !== 'ACTIVE' ||
            account.lockedAt ||
            account.credentialVersion !== expectedCredentialVersion
          ) {
            throw resetConflictError();
          }

          const consumed = await repository.consumeResetToken(tokenDigest, resetAt);
          if (!consumed) throw resetConflictError();

          const fresh = accounts.get(accountId);
          if (
            !fresh ||
            fresh.status !== 'ACTIVE' ||
            fresh.lockedAt ||
            fresh.credentialVersion !== expectedCredentialVersion
          ) {
            throw resetConflictError();
          }
          const next = {
            ...fresh,
            passwordCredential: clone(passwordCredential),
            credentialVersion: fresh.credentialVersion + 1,
            passwordChangedAt: resetAt,
            updatedAt: resetAt,
          };
          accounts.set(accountId, next);
          await repository.deleteSessionsForAccount(accountId);
          await repository.appendAudit({
            ...audit,
            accountId,
            event: 'PASSWORD_RESET_COMPLETED',
          });
          return clone(next);
        } catch (error) {
          restoreMap(accounts, snapshot.accounts);
          restoreMap(accessIndex, snapshot.accessIndex);
          restoreMap(usernameIndex, snapshot.usernameIndex);
          restoreMap(verifiedEmailIndex, snapshot.verifiedEmailIndex);
          restoreMap(sessions, snapshot.sessions);
          restoreMap(resetTokens, snapshot.resetTokens);
          auditEvents.splice(0, auditEvents.length, ...snapshot.auditEvents);
          throw error;
        }
      });
    },
    async appendAudit(event) {
      auditEvents.push(clone(event));
    },
    inspect() {
      return clone({
        accounts: [...accounts.values()],
        sessions: [...sessions.values()],
        resetTokens: [...resetTokens.values()],
        auditEvents,
      });
    },
  };

  for (const account of seedAccounts) {
    accounts.set(account.id, clone(account));
    accessIndex.set(account.accessIdNormalized, account.id);
    if (account.profileEmailVerifiedAt && account.profile?.email) {
      verifiedEmailIndex.set(account.profile.email.toLowerCase(), account.id);
    }
  }
  return repository;
}

export function createSlidingWindowRateLimiter({ limit = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();
  return Object.freeze({
    consume(key, nowMs) {
      const cutoff = nowMs - windowMs;
      const recent = (attempts.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
      if (recent.length >= limit) {
        return { allowed: false, retryAfterMs: Math.max(1, recent[0] + windowMs - nowMs) };
      }
      recent.push(nowMs);
      attempts.set(key, recent);
      return { allowed: true, remaining: Math.max(0, limit - recent.length) };
    },
    reset(key) {
      attempts.delete(key);
    },
  });
}
