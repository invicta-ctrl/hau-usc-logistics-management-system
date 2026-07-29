function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function createInMemoryAuthRepository(seedAccounts = []) {
  const accounts = new Map();
  const accessIndex = new Map();
  const verifiedEmailIndex = new Map();
  const sessions = new Map();
  const resetTokens = new Map();
  const auditEvents = [];

  const saveAccount = async (account) => {
    const next = clone(account);
    const prior = accounts.get(next.id);
    if (prior?.accessIdNormalized && prior.accessIdNormalized !== next.accessIdNormalized) {
      accessIndex.delete(prior.accessIdNormalized);
    }
    if (prior?.profileEmailVerifiedAt && prior.profile?.email) {
      verifiedEmailIndex.delete(prior.profile.email.toLowerCase());
    }
    if (next.profileEmailVerifiedAt && next.profile?.email) {
      const email = next.profile.email.toLowerCase();
      const assigned = verifiedEmailIndex.get(email);
      if (assigned && assigned !== next.id) throw new Error('Verified email is already assigned.');
      verifiedEmailIndex.set(email, next.id);
    }
    accounts.set(next.id, next);
    accessIndex.set(next.accessIdNormalized, next.id);
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
      const id = accessIndex.get(identifier) ?? verifiedEmailIndex.get(identifier);
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
