import { randomUUID } from 'node:crypto';
import { readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privatePath(value, { existing }) {
  if (!path.isAbsolute(value ?? '')) throw new Error('P31 evidence paths must be absolute.');
  const resolved = existing
    ? await realpath(value)
    : path.join(await realpath(path.dirname(value)), path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('P31 evidence paths must remain outside the repository.');
  if (existing && !(await stat(resolved)).isFile()) throw new Error('P31 input evidence must be a file.');
  if (!existing) {
    try {
      await stat(resolved);
      throw new Error('P31 output evidence exists; refusing to overwrite it.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return resolved;
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(`P31 profile reset verification failed: ${message}.`);
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function createSession(baseUrl) {
  const { response, payload } = await jsonRequest(`${baseUrl}/api/playground/session`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: baseUrl,
      referer: `${baseUrl}/`,
    },
    body: '{}',
  });
  const cookie = String(response.headers.get('set-cookie') ?? '').split(';', 1)[0];
  requireCondition(response.status === 200 && cookie, 'new Playground session was issued');
  requireCondition(payload?.state === 'AUTHENTICATED', 'new Playground session authenticated');
  requireCondition(payload?.user?.authorization?.roleId === 'SYSTEM_OWNER', 'new session is System Owner');
  requireCondition(payload?.csrfToken, 'new session includes CSRF protection');
  return { cookie, csrfToken: String(payload.csrfToken) };
}

async function authenticated(baseUrl, endpoint, session, { method = 'GET', body } = {}) {
  const headers = { accept: 'application/json', cookie: session.cookie };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    headers['x-csrf-token'] = session.csrfToken;
    headers.origin = baseUrl;
    headers.referer = `${baseUrl}/`;
  }
  return jsonRequest(`${baseUrl}${endpoint}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function profileFrom(result, label) {
  requireCondition(result.response.status === 200, `${label} returned HTTP 200`);
  requireCondition(result.payload?.profile?.revision, `${label} returned a profile revision`);
  return result.payload.profile;
}

function baselineProfile(profile) {
  return {
    displayName: String(profile.displayName ?? ''),
    username: String(profile.username ?? ''),
    contactNumber: String(profile.contactNumber ?? ''),
    revision: String(profile.revision ?? ''),
    credentialVersion: Number(profile.credentialVersion ?? -1),
    appearance: {
      family: String(profile.appearance?.family ?? ''),
      mode: String(profile.appearance?.mode ?? ''),
    },
    avatar: {
      available: profile.avatar?.available === true,
      updatedAt: String(profile.avatar?.updatedAt ?? ''),
    },
  };
}

function nextAppearance(current) {
  const families = [
    'HAU_INSTITUTIONAL',
    'ANGELITE_IVORY',
    'MIDNIGHT_LEDGER',
    'EMERALD_OPERATIONS',
    'COBALT_SIGNAL',
    'GRAPHITE_COPPER',
  ];
  const modes = ['LIGHT', 'DARK', 'SYSTEM'];
  return {
    family: families.find((value) => value !== current.family) ?? 'ANGELITE_IVORY',
    mode: modes.find((value) => value !== current.mode) ?? 'DARK',
  };
}

const [mode, manifestArg, snapshotArg, reportArg] = process.argv.slice(2);
requireCondition(['stage-mutate', 'verify-restored'].includes(mode), 'mode is stage-mutate or verify-restored');
const manifestPath = await privatePath(manifestArg, { existing: true });
const snapshotPath = await privatePath(snapshotArg, { existing: mode === 'verify-restored' });
const reportPath = await privatePath(reportArg, { existing: false });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const hostname = String(manifest.playgroundHostname ?? '')
  .replace(/^https?:\/\//u, '')
  .replace(/\/$/u, '');
requireCondition(
  manifest.status === 'READY' && hostname && hostname !== 'logistics.hausc.org',
  'manifest identifies isolated Playground',
);
const baseUrl = `https://${hostname}`;
const session = await createSession(baseUrl);

if (mode === 'stage-mutate') {
  const original = baselineProfile(profileFrom(await authenticated(baseUrl, '/api/me/profile', session), 'profile read'));
  const contactNumber = `+63917${String(Date.now()).slice(-7)}`;
  requireCondition(contactNumber !== original.contactNumber, 'synthetic contact differs from baseline');
  const contact = profileFrom(
    await authenticated(baseUrl, '/api/me/profile', session, {
      method: 'PATCH',
      body: {
        contactNumber,
        expectedRevision: original.revision,
        clientRequestId: `p31-contact-${randomUUID()}`,
      },
    }),
    'contact mutation',
  );
  requireCondition(contact.contactNumber === contactNumber, 'contact mutation persisted');

  const appearance = nextAppearance(original.appearance);
  const appearanceResult = profileFrom(
    await authenticated(baseUrl, '/api/me/appearance', session, {
      method: 'PATCH',
      body: { ...appearance, clientRequestId: `p31-appearance-${randomUUID()}` },
    }),
    'appearance mutation',
  );
  requireCondition(
    appearanceResult.appearance?.family === appearance.family &&
      appearanceResult.appearance?.mode === appearance.mode,
    'appearance mutation persisted',
  );

  const current = profileFrom(await authenticated(baseUrl, '/api/me/profile', session), 'profile reread');
  const avatar = profileFrom(
    await authenticated(baseUrl, '/api/me/avatar', session, {
      method: 'POST',
      body: {
        contentType: 'image/png',
        base64: PNG_BASE64,
        expectedRevision: current.revision,
        clientRequestId: `p31-avatar-${randomUUID()}`,
      },
    }),
    'avatar mutation',
  );
  requireCondition(avatar.avatar?.available === true, 'avatar metadata persisted');
  const avatarRead = await fetch(`${baseUrl}/api/me/avatar`, {
    headers: { accept: 'image/*', cookie: session.cookie },
  });
  requireCondition(avatarRead.status === 200, 'avatar object is readable from working R2');
  await avatarRead.arrayBuffer();

  const snapshot = { schemaVersion: 1, capturedAt: new Date().toISOString(), profile: original };
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        status: 'PASS',
        checkedAt: new Date().toISOString(),
        mode,
        target: 'PLAYGROUND',
        productionMutation: 'NONE',
        googleMutation: 'NONE',
        d1: {
          contactChanged: true,
          appearanceChanged: true,
          profileRevisionChanged: avatar.revision !== original.revision,
        },
        r2: { avatarUploaded: true, avatarReadable: true },
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  console.log('P31 profile/theme/avatar mutation: PASS');
} else {
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const expected = snapshot.profile;
  const restored = baselineProfile(
    profileFrom(await authenticated(baseUrl, '/api/me/profile', session), 'restored profile read'),
  );
  requireCondition(restored.displayName === expected.displayName, 'display name restored');
  requireCondition(restored.username === expected.username, 'username restored');
  requireCondition(restored.contactNumber === expected.contactNumber, 'contact restored');
  requireCondition(restored.revision === expected.revision, 'profile revision restored');
  requireCondition(restored.credentialVersion === expected.credentialVersion, 'credential version restored');
  requireCondition(
    restored.appearance.family === expected.appearance.family && restored.appearance.mode === expected.appearance.mode,
    'appearance restored',
  );
  requireCondition(restored.avatar.available === expected.avatar.available, 'avatar availability restored');
  requireCondition(restored.avatar.updatedAt === expected.avatar.updatedAt, 'avatar revision restored');
  if (expected.avatar.available) {
    const avatarRead = await fetch(`${baseUrl}/api/me/avatar`, {
      headers: { accept: 'image/*', cookie: session.cookie },
    });
    requireCondition(avatarRead.status === 200, 'restored profile avatar object is readable');
    await avatarRead.arrayBuffer();
  }
  await rm(snapshotPath, { force: true });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        status: 'PASS',
        checkedAt: new Date().toISOString(),
        mode,
        target: 'PLAYGROUND',
        productionMutation: 'NONE',
        googleMutation: 'NONE',
        d1: { profileRestored: true, appearanceRestored: true },
        r2: {
          avatarStateRestored: true,
          objectProbe: expected.avatar.available ? 'HTTP_200' : 'NOT_APPLICABLE_TO_INITIALS_FALLBACK',
        },
        newEntry: true,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  console.log('P31 profile/theme/avatar restoration: PASS');
}

console.log('Private session material, profile fields, provider identities, object keys, and hashes were not printed.');
