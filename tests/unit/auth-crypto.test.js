import { timingSafeEqual, webcrypto } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  createPasswordKdf,
  createTokenCrypto,
  PASSWORD_KDF,
  validateNewPassword,
} from '../../src/server/auth/crypto.js';

describe('authentication cryptography', () => {
  it('hashes with a unique salt and verifies through the timing-safe adapter', async () => {
    const compare = vi.fn((actual, expected) => timingSafeEqual(actual, expected));
    const kdf = createPasswordKdf({
      cryptoProvider: webcrypto,
      timingSafeEqual: compare,
      defaultIterations: 1_000,
      minimumIterations: 1_000,
    });

    const first = await kdf.hash('Strong!Password9472');
    const second = await kdf.hash('Strong!Password9472');

    expect(first.algorithm).toBe(PASSWORD_KDF.algorithm);
    expect(first.salt).not.toBe(second.salt);
    await expect(kdf.verify('Strong!Password9472', first)).resolves.toBe(true);
    await expect(kdf.verify('Wrong!Password9472', first)).resolves.toBe(false);
    expect(compare).toHaveBeenCalledTimes(2);
  });

  it('fails closed for weak or malformed credentials', async () => {
    const kdf = createPasswordKdf({
      cryptoProvider: webcrypto,
      timingSafeEqual,
      defaultIterations: 1_000,
      minimumIterations: 1_000,
    });

    expect(validateNewPassword('short')).toMatchObject({ valid: false, code: 'PASSWORD_POLICY_FAILED' });
    await expect(kdf.hash('short')).rejects.toMatchObject({ code: 'PASSWORD_POLICY_FAILED' });
    await expect(kdf.verify('Strong!Password9472', { algorithm: 'PLAINTEXT', hash: 'secret' })).resolves.toBe(
      false,
    );
  });

  it('uses the protected pepper for new hashes while preserving explicit legacy hash verification', async () => {
    const legacy = createPasswordKdf({
      cryptoProvider: webcrypto,
      timingSafeEqual,
      defaultIterations: 1_000,
      minimumIterations: 1_000,
    });
    const protectedKdf = createPasswordKdf({
      cryptoProvider: webcrypto,
      timingSafeEqual,
      defaultIterations: 1_000,
      minimumIterations: 1_000,
      pepper: 'staging-private-pepper-value',
    });
    const legacyCredential = await legacy.hash('Legacy!Password9472');
    const protectedCredential = await protectedKdf.hash('Protected!Password9472');

    expect(legacyCredential.peppered).toBe(false);
    expect(protectedCredential.peppered).toBe(true);
    await expect(protectedKdf.verify('Legacy!Password9472', legacyCredential)).resolves.toBe(true);
    await expect(protectedKdf.verify('Protected!Password9472', protectedCredential)).resolves.toBe(true);
    await expect(legacy.verify('Protected!Password9472', protectedCredential)).resolves.toBe(false);
  });

  it('keeps the production work factor inside the Cloudflare Workers PBKDF2 limit', async () => {
    const maximumIterations = 100_000;
    const cloudflareCompatibleCrypto = {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: {
        importKey: webcrypto.subtle.importKey.bind(webcrypto.subtle),
        deriveBits(algorithm, key, length) {
          if (algorithm.iterations > maximumIterations) {
            throw new DOMException(
              `iteration counts above ${maximumIterations} are not supported`,
              'NotSupportedError',
            );
          }
          return webcrypto.subtle.deriveBits(algorithm, key, length);
        },
      },
    };
    const kdf = createPasswordKdf({
      cryptoProvider: cloudflareCompatibleCrypto,
      timingSafeEqual,
    });

    expect(PASSWORD_KDF.productionIterations).toBe(maximumIterations);
    const credential = await kdf.hash('Cloudflare!Password9472');
    await expect(kdf.verify('Cloudflare!Password9472', credential)).resolves.toBe(true);
  });

  it('creates opaque tokens and validates their digest with a timing-safe comparison', async () => {
    const tokenCrypto = createTokenCrypto({ cryptoProvider: webcrypto, timingSafeEqual });
    const token = tokenCrypto.createToken();
    const digest = await tokenCrypto.digest(token);

    expect(token).not.toBe(digest);
    await expect(tokenCrypto.matches(token, digest)).resolves.toBe(true);
    await expect(tokenCrypto.matches(`${token}x`, digest)).resolves.toBe(false);
    expect(() => tokenCrypto.createToken(16)).toThrow(/at least 32/u);
  });
});
