const encoder = new TextEncoder();

export const PASSWORD_KDF = Object.freeze({
  algorithm: 'PBKDF2-SHA-256',
  hash: 'SHA-256',
  saltBytes: 16,
  derivedBytes: 32,
  // Cloudflare Workers rejects PBKDF2 calls above 100,000 iterations.
  productionIterations: 100_000,
});

function requireCrypto(cryptoProvider) {
  if (!cryptoProvider?.subtle || typeof cryptoProvider.getRandomValues !== 'function') {
    throw new Error('A Web Crypto compatible provider is required.');
  }
  return cryptoProvider;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value) {
  const normalized = String(value ?? '')
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomBytes(cryptoProvider, length) {
  return cryptoProvider.getRandomValues(new Uint8Array(length));
}

function validateCredential(credential, minimumIterations) {
  if (credential?.algorithm !== PASSWORD_KDF.algorithm) return false;
  if (!Number.isSafeInteger(credential.iterations) || credential.iterations < minimumIterations) return false;
  try {
    return (
      base64UrlToBytes(credential.salt).length === PASSWORD_KDF.saltBytes &&
      base64UrlToBytes(credential.hash).length === PASSWORD_KDF.derivedBytes
    );
  } catch {
    return false;
  }
}

async function derivePassword(cryptoProvider, password, salt, iterations) {
  const key = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await cryptoProvider.subtle.deriveBits(
    { name: 'PBKDF2', hash: PASSWORD_KDF.hash, salt, iterations },
    key,
    PASSWORD_KDF.derivedBytes * 8,
  );
  return new Uint8Array(bits);
}

export function validateNewPassword(password) {
  const value = String(password ?? '');
  const categories = [/[a-z]/u, /[A-Z]/u, /\d/u, /[^\p{L}\p{N}\s]/u].filter((pattern) =>
    pattern.test(value),
  ).length;
  if (value.length < 12 || value.length > 128 || categories < 3) {
    return {
      valid: false,
      code: 'PASSWORD_POLICY_FAILED',
      message:
        'Use 12–128 characters and include at least three of: uppercase, lowercase, number, or symbol.',
    };
  }
  return { valid: true };
}

export function createPasswordKdf({
  cryptoProvider = globalThis.crypto,
  timingSafeEqual,
  defaultIterations = PASSWORD_KDF.productionIterations,
  minimumIterations = PASSWORD_KDF.productionIterations,
} = {}) {
  const cryptoValue = requireCrypto(cryptoProvider);
  if (typeof timingSafeEqual !== 'function') {
    throw new Error('A platform timing-safe comparison function is required.');
  }
  if (!Number.isSafeInteger(defaultIterations) || defaultIterations < minimumIterations) {
    throw new Error('The default password work factor is below the configured minimum.');
  }

  return Object.freeze({
    async hash(password) {
      const policy = validateNewPassword(password);
      if (!policy.valid) throw Object.assign(new Error(policy.message), { code: policy.code });
      const salt = randomBytes(cryptoValue, PASSWORD_KDF.saltBytes);
      const hash = await derivePassword(cryptoValue, String(password), salt, defaultIterations);
      return Object.freeze({
        algorithm: PASSWORD_KDF.algorithm,
        iterations: defaultIterations,
        salt: bytesToBase64Url(salt),
        hash: bytesToBase64Url(hash),
      });
    },
    async verify(password, credential) {
      const value = String(password ?? '');
      if (value.length > 1024 || !validateCredential(credential, minimumIterations)) return false;
      const expected = base64UrlToBytes(credential.hash);
      const actual = await derivePassword(
        cryptoValue,
        value,
        base64UrlToBytes(credential.salt),
        credential.iterations,
      );
      return Boolean(timingSafeEqual(actual, expected));
    },
    minimumIterations,
  });
}

export function createTokenCrypto({ cryptoProvider = globalThis.crypto, timingSafeEqual } = {}) {
  const cryptoValue = requireCrypto(cryptoProvider);
  if (typeof timingSafeEqual !== 'function') {
    throw new Error('A platform timing-safe comparison function is required.');
  }
  const digest = async (token) => {
    const value = String(token ?? '');
    if (!value) return '';
    return bytesToBase64Url(
      new Uint8Array(await cryptoValue.subtle.digest('SHA-256', encoder.encode(value))),
    );
  };
  return Object.freeze({
    createToken(byteLength = 32) {
      if (!Number.isSafeInteger(byteLength) || byteLength < 32) {
        throw new Error('Security tokens require at least 32 random bytes.');
      }
      return bytesToBase64Url(randomBytes(cryptoValue, byteLength));
    },
    digest,
    async matches(token, expectedDigest) {
      try {
        const actualDigest = await digest(token);
        return Boolean(
          actualDigest &&
          expectedDigest &&
          timingSafeEqual(base64UrlToBytes(actualDigest), base64UrlToBytes(expectedDigest)),
        );
      } catch {
        return false;
      }
    },
  });
}
