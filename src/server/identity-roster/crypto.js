const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value) {
  const normalized = String(value ?? '').replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function keyMaterial(cryptoProvider, secret, purpose, algorithm, usages) {
  const value = String(secret ?? '');
  if (value.length < 32) throw new Error('Identity roster encryption is not configured.');
  const digest = await cryptoProvider.subtle.digest(
    'SHA-256',
    encoder.encode(`HAU-USC-IDENTITY-ROSTER:${purpose}:${value}`),
  );
  return cryptoProvider.subtle.importKey('raw', digest, algorithm, false, usages);
}

export function createIdentityRosterCrypto({
  secret,
  cryptoProvider = globalThis.crypto,
} = {}) {
  if (!cryptoProvider?.subtle || typeof cryptoProvider.getRandomValues !== 'function') {
    throw new Error('A Web Crypto compatible provider is required.');
  }

  const encryptionKey = keyMaterial(
    cryptoProvider,
    secret,
    'ENCRYPTION',
    { name: 'AES-GCM', length: 256 },
    ['encrypt', 'decrypt'],
  );
  const identityKey = keyMaterial(
    cryptoProvider,
    secret,
    'IDENTITY-KEY',
    { name: 'HMAC', hash: 'SHA-256' },
    ['sign'],
  );

  return Object.freeze({
    async identityKey(institutionalEmail) {
      const signature = await cryptoProvider.subtle.sign(
        'HMAC',
        await identityKey,
        encoder.encode(String(institutionalEmail ?? '').trim().toLowerCase()),
      );
      return `IDN-${bytesToBase64Url(new Uint8Array(signature))}`;
    },

    async encrypt(value) {
      const iv = cryptoProvider.getRandomValues(new Uint8Array(12));
      const ciphertext = await cryptoProvider.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await encryptionKey,
        encoder.encode(JSON.stringify(value)),
      );
      return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
    },

    async decrypt(envelope) {
      const [version, ivValue, ciphertextValue, extra] = String(envelope ?? '').split('.');
      if (version !== 'v1' || !ivValue || !ciphertextValue || extra) {
        throw new Error('Identity roster protected data is invalid.');
      }
      const plaintext = await cryptoProvider.subtle.decrypt(
        { name: 'AES-GCM', iv: base64UrlToBytes(ivValue) },
        await encryptionKey,
        base64UrlToBytes(ciphertextValue),
      );
      return JSON.parse(decoder.decode(plaintext));
    },

    async fingerprint(value) {
      const digest = await cryptoProvider.subtle.digest(
        'SHA-256',
        encoder.encode(JSON.stringify(value)),
      );
      return `SHA256-${bytesToBase64Url(new Uint8Array(digest))}`;
    },
  });
}
