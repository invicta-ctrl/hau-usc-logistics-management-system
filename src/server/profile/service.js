import { canonicalUsername, isGovernedUsername } from '../../domain/username.js';
import { ACCOUNT_STATUS, accountAuthorization } from '../auth/contracts.js';
import { validateNewPassword } from '../auth/crypto.js';
import { ApiError } from '../d1/operational-service.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MOBILE_PATTERN = /^\+?[0-9][0-9 ()-]{7,19}$/u;
const APPEARANCE_THEMES = Object.freeze(['LIGHT', 'DARK', 'SYSTEM']);
const AVATAR_CONTENT_TYPES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});
const MAX_AVATAR_BYTES = 750_000;

function fail(code, message, { status = 422, details } = {}) {
  throw new ApiError(code, message, { status, details });
}

function actorFrom(context = {}) {
  return context.actor ?? context.account ?? context.authenticatedAccount ?? null;
}

function assertSelf(context) {
  const actor = actorFrom(context);
  if (!actor?.id) fail('SESSION_REQUIRED', 'An authenticated account is required.', { status: 401 });
  if (actor.status !== ACCOUNT_STATUS.ACTIVE) {
    fail('ACCOUNT_UNAVAILABLE', 'This account cannot use self-service profile controls.', { status: 403 });
  }
  return actor;
}

function requiredClientRequestId(command) {
  const key = String(command.clientRequestId ?? command.idempotencyKey ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{3,127}$/u.test(key)) {
    fail('IDEMPOTENCY_REQUIRED', 'A safe retry key is required.', {
      details: { field: 'clientRequestId' },
    });
  }
  return key;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }
  return value;
}

async function requestFingerprint(value) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(stableValue(value))),
  );
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

async function mutationReplay(repository, scope, actor, command) {
  const key = requiredClientRequestId(command);
  const fingerprint = await requestFingerprint(command);
  const previous = await repository.getIdempotency(scope, key);
  if (!previous) return { key, fingerprint, result: null, replayed: false };
  if (previous.actorAccountId !== actor.id || previous.requestFingerprint !== fingerprint) {
    fail('IDEMPOTENCY_CONFLICT', 'This retry key was used with different values.', { status: 409 });
  }
  return { key, fingerprint, result: previous.result, replayed: true };
}

function normalizeContact(command) {
  const value = String(command.mobileNumber ?? command.contactNumber ?? '').trim();
  if (!MOBILE_PATTERN.test(value)) {
    fail('PROFILE_CONTACT_INVALID', 'Enter a valid contact number.', {
      details: { field: command.mobileNumber !== undefined ? 'mobileNumber' : 'contactNumber' },
    });
  }
  return value;
}

function normalizeUsername(value) {
  const username = canonicalUsername(value);
  if (!isGovernedUsername(username)) {
    fail('USERNAME_INVALID', 'Use 4-32 letters or numbers with single periods, underscores, or hyphens.', {
      details: { field: 'username' },
    });
  }
  return username;
}

function requiredSecret(value, field) {
  const secret = String(value ?? '');
  if (!secret || secret.length > 1024) {
    fail('CURRENT_PASSWORD_INVALID', 'The current password is incorrect.', { details: { field } });
  }
  return secret;
}

async function verifyCurrentPassword(passwordKdf, password, credential) {
  try {
    return await passwordKdf.verify(password, credential);
  } catch {
    return false;
  }
}

function requiredReason(value, fallback) {
  const reason = String(value ?? fallback).trim();
  if (reason.length < 1 || reason.length > 500) {
    fail('PROFILE_REASON_INVALID', 'Provide a brief reason for this profile change.', {
      details: { field: 'reason' },
    });
  }
  return reason;
}

function expectedRevision(command, profile) {
  const expected = String(command.expectedRevision ?? '').trim();
  if (!expected || expected !== String(profile.updatedAt)) {
    fail('REVISION_CONFLICT', 'Your profile changed; refresh before updating.', {
      status: 409,
      details: {
        field: 'expectedRevision',
        expectedRevision: expected,
        currentRevision: profile.updatedAt,
      },
    });
  }
  return expected;
}

function mapRepositoryError(error) {
  if (error?.code === 'REVISION_CONFLICT') {
    fail('REVISION_CONFLICT', 'Your profile changed; refresh before updating.', {
      status: 409,
      details: error.details,
    });
  }
  throw error;
}

function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase()
    : (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

function safeAccessSummary(actor, profile) {
  const authorization = accountAuthorization({
    ...actor,
    roleId: profile.roleId,
    status: profile.status,
    committeeIds: profile.committeeIds,
    defaultCommitteeId: profile.defaultCommitteeId,
    profile: {
      fullName: profile.fullName,
      mobileNumber: profile.mobileNumber,
      email: profile.email,
    },
  });
  return {
    roleId: authorization.roleId,
    roleLabel: authorization.roleLabel,
    committeeIds: authorization.committeeIds,
    capabilities: authorization.capabilities,
    workspaceIds: authorization.workspaceIds,
    defaultWorkspaceId: authorization.defaultWorkspaceId,
    scopeMode: authorization.scopeMode,
  };
}

function profileDto(actor, profile, { avatarEnabled = false } = {}) {
  const avatarAvailable = avatarEnabled && Boolean(profile.avatarAssetKey);
  const appearanceTheme = APPEARANCE_THEMES.includes(profile.appearanceTheme)
    ? profile.appearanceTheme
    : 'SYSTEM';
  return {
    displayName: profile.fullName,
    legalName: profile.fullName,
    verifiedEmail: profile.profileEmailVerifiedAt ? profile.email : '',
    username: profile.username,
    contactNumber: profile.mobileNumber,
    affiliation: {
      institutionId: profile.institutionId,
      departmentId: profile.departmentId,
      departmentDisplayName: profile.departmentDisplayName,
      courseId: profile.courseId,
      yearLevel: profile.yearLevel,
    },
    roleId: profile.roleId,
    committeeIds: profile.committeeIds,
    accountCode: profile.accessId,
    accessSummary: safeAccessSummary(actor, profile),
    revision: profile.updatedAt,
    credentialVersion: profile.credentialVersion,
    updatedAt: profile.updatedAt,
    avatar: {
      available: avatarAvailable,
      initials: initials(profile.fullName),
      fallback: 'INITIALS',
      url: avatarAvailable ? '/api/me/avatar' : '',
      updatedAt: avatarAvailable ? (profile.avatarUpdatedAt ?? '') : '',
    },
    appearance: { theme: appearanceTheme },
  };
}

function avatarBytes(command) {
  const contentType = String(command.contentType ?? '')
    .trim()
    .toLowerCase();
  const extension = AVATAR_CONTENT_TYPES[contentType];
  if (!extension)
    fail('PROFILE_AVATAR_TYPE_INVALID', 'Use a JPEG, PNG, or WebP profile picture.', { status: 415 });
  let bytes;
  try {
    const binary = atob(String(command.base64 ?? ''));
    bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    fail('PROFILE_AVATAR_INVALID', 'The profile picture could not be read.');
  }
  if (bytes.length < 32 || bytes.length > MAX_AVATAR_BYTES) {
    fail('PROFILE_AVATAR_SIZE_INVALID', 'Profile pictures must be no larger than 750 KB.', { status: 413 });
  }
  const signatureMatches =
    (contentType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (contentType === 'image/png' &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) ||
    (contentType === 'image/webp' &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP');
  if (!signatureMatches) {
    fail('PROFILE_AVATAR_SIGNATURE_INVALID', 'The file contents do not match the selected image type.');
  }
  return { bytes, contentType, extension };
}

function requireProfile(repository, actor) {
  return repository.getProfile(actor.id).then((profile) => {
    if (!profile || profile.status !== ACCOUNT_STATUS.ACTIVE) {
      fail('ACCOUNT_UNAVAILABLE', 'This account is no longer available.', { status: 403 });
    }
    return profile;
  });
}

function genericAudit({ action, actor, changedAt, correlationId, before = {}, after = {}, notes = '' }) {
  return {
    id: `AUD-${globalThis.crypto.randomUUID()}`,
    createdAt: changedAt,
    action,
    accountId: actor.id,
    actorId: actor.id,
    before,
    after,
    correlationId,
    notes,
  };
}

function genericIdempotency({ scope, replay, actor, result, changedAt }) {
  return {
    scope,
    key: replay.key,
    actorAccountId: actor.id,
    requestFingerprint: replay.fingerprint,
    result,
    createdAt: changedAt,
  };
}

function nextTimestamp(clock, previous = '') {
  const candidate = new Date(clock.now()).getTime();
  const previousTime = Date.parse(String(previous ?? ''));
  const next = Number.isFinite(previousTime) && candidate <= previousTime ? previousTime + 1 : candidate;
  return new Date(next).toISOString();
}

export function createProfileService({
  repository,
  passwordKdf,
  protectIdentityRequest,
  avatarBucket,
  clock = Date,
  createId = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!repository) throw new Error('Profile repository is required.');
  if (!passwordKdf) throw new Error('Profile password KDF is required.');
  const nowIso = () => new Date(clock.now()).toISOString();
  const dto = (actor, profile) => profileDto(actor, profile, { avatarEnabled: Boolean(avatarBucket) });

  async function get(context = {}) {
    const actor = assertSelf(context);
    const profile = await requireProfile(repository, actor);
    return { ok: true, profile: dto(actor, profile) };
  }

  async function getAppearance(context = {}) {
    const actor = assertSelf(context);
    const profile = await requireProfile(repository, actor);
    const theme = APPEARANCE_THEMES.includes(profile.appearanceTheme) ? profile.appearanceTheme : 'SYSTEM';
    return { ok: true, appearance: { theme } };
  }

  async function updateContact({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const replay = await mutationReplay(repository, 'PROFILE_CONTACT_UPDATE', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const expectedUpdatedAt = expectedRevision(command, profile);
    const mobileNumber = normalizeContact(command);
    const changedAt = nextTimestamp(clock, profile.updatedAt);
    const result = {
      ok: true,
      changed: true,
      sessionsRevoked: false,
      revision: changedAt,
      updatedAt: changedAt,
      replayed: false,
    };
    result.profile = dto(currentActor, { ...profile, mobileNumber, updatedAt: changedAt });
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_CONTACT_UPDATED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { contactChanged: true },
        after: { contactChanged: true, sessionsRevoked: false },
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_CONTACT_UPDATE',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    let refreshed;
    try {
      refreshed = await repository.updateContact({
        accountId: currentActor.id,
        expectedUpdatedAt,
        mobileNumber,
        changedAt,
        evidence,
      });
    } catch (error) {
      mapRepositoryError(error);
    }
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  async function changeUsername({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const replay = await mutationReplay(repository, 'PROFILE_USERNAME_CHANGE', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const expectedUpdatedAt = expectedRevision(command, profile);
    const currentPassword = requiredSecret(command.currentPassword, 'currentPassword');
    if (!(await verifyCurrentPassword(passwordKdf, currentPassword, profile.passwordCredential))) {
      fail('CURRENT_PASSWORD_INVALID', 'The current password is incorrect.');
    }
    const username = normalizeUsername(command.username ?? command.newUsername);
    if (username === profile.username) fail('USERNAME_UNCHANGED', 'Choose a different username.');
    if (username === String(profile.accessId ?? '').toLowerCase()) {
      fail('USERNAME_TAKEN', 'That username is already in use.', { status: 409 });
    }
    if (await repository.findUsername(username, currentActor.id)) {
      fail('USERNAME_TAKEN', 'That username is already in use.', { status: 409 });
    }
    const historyReason = requiredReason(command.reason, 'Self-service username change');
    const changedAt = nextTimestamp(clock, profile.updatedAt);
    const result = {
      ok: true,
      changed: true,
      username,
      sessionsRevoked: true,
      revision: changedAt,
      updatedAt: changedAt,
      replayed: false,
    };
    result.profile = dto(currentActor, { ...profile, username, updatedAt: changedAt });
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_USERNAME_CHANGED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { usernameChanged: true },
        after: { usernameChanged: true, sessionsRevoked: true },
        notes: 'Self-service username change',
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_USERNAME_CHANGE',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    let refreshed;
    try {
      refreshed = await repository.changeUsername({
        accountId: currentActor.id,
        expectedUpdatedAt,
        oldUsername: profile.username,
        newUsername: username,
        changedAt,
        reason: historyReason,
        historyId: createId(),
        evidence,
      });
    } catch (error) {
      if (
        error?.code === 'REVISION_CONFLICT' ||
        /UNIQUE|CONSTRAINT/iu.test(String(error?.message ?? error))
      ) {
        if (error?.code === 'REVISION_CONFLICT') mapRepositoryError(error);
        fail('USERNAME_TAKEN', 'That username is already in use.', { status: 409 });
      }
      throw error;
    }
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  async function changePassword({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const replay = await mutationReplay(repository, 'PROFILE_PASSWORD_CHANGE', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const expectedUpdatedAt = expectedRevision(command, profile);
    const currentPassword = requiredSecret(command.currentPassword, 'currentPassword');
    if (!(await verifyCurrentPassword(passwordKdf, currentPassword, profile.passwordCredential))) {
      fail('CURRENT_PASSWORD_INVALID', 'The current password is incorrect.');
    }
    const nextPassword = String(command.newPassword ?? command.password ?? '');
    const confirmation = String(command.confirmPassword ?? command.passwordConfirmation ?? '');
    if (nextPassword !== confirmation) {
      fail('PASSWORD_CONFIRMATION_FAILED', 'The new passwords do not match.', {
        details: { field: 'confirmPassword' },
      });
    }
    const policy = validateNewPassword(nextPassword);
    if (!policy.valid) fail('PASSWORD_POLICY_FAILED', policy.message, { details: { field: 'newPassword' } });
    requiredReason(command.reason, 'Self-service password change');
    let passwordCredential;
    try {
      passwordCredential = await passwordKdf.hash(nextPassword);
    } catch (error) {
      if (error?.code === 'PASSWORD_POLICY_FAILED') {
        fail('PASSWORD_POLICY_FAILED', 'The new password does not meet the security requirements.', {
          details: { field: 'newPassword' },
        });
      }
      fail('PASSWORD_UNAVAILABLE', 'Password changes are temporarily unavailable.', { status: 503 });
    }
    const changedAt = nextTimestamp(clock, profile.updatedAt);
    const result = {
      ok: true,
      changed: true,
      sessionsRevoked: true,
      credentialVersion: profile.credentialVersion + 1,
      revision: changedAt,
      updatedAt: changedAt,
      replayed: false,
    };
    result.profile = dto(currentActor, {
      ...profile,
      credentialVersion: result.credentialVersion,
      passwordCredential: null,
      updatedAt: changedAt,
    });
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_PASSWORD_CHANGED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { credentialChanged: true },
        after: { credentialChanged: true, sessionsRevoked: true },
        notes: 'Self-service password change',
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_PASSWORD_CHANGE',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    let refreshed;
    try {
      refreshed = await repository.changePassword({
        accountId: currentActor.id,
        expectedCredentialVersion: profile.credentialVersion,
        expectedUpdatedAt,
        passwordCredential,
        changedAt,
        evidence,
      });
    } catch (error) {
      mapRepositoryError(error);
    }
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  async function requestIdentityCorrection({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const replay = await mutationReplay(repository, 'PROFILE_IDENTITY_CORRECTION', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    await requireProfile(repository, currentActor);
    if (typeof protectIdentityRequest !== 'function') {
      fail('IDENTITY_CORRECTION_UNAVAILABLE', 'Protected identity correction is temporarily unavailable.', {
        status: 503,
      });
    }
    const requested = {
      legalName: String(command.legalName ?? command.fullName ?? '').trim(),
      contactNumber: String(command.contactNumber ?? command.mobileNumber ?? '').trim(),
      email: String(command.email ?? '')
        .trim()
        .toLowerCase(),
      reason: String(command.reason ?? '').trim(),
    };
    if (requested.legalName.length < 3 || requested.legalName.length > 120) {
      fail('IDENTITY_CORRECTION_INVALID', 'Enter the proposed legal name.', {
        details: { field: 'legalName' },
      });
    }
    if (!MOBILE_PATTERN.test(requested.contactNumber)) {
      fail('IDENTITY_CORRECTION_INVALID', 'Enter a valid proposed contact number.', {
        details: { field: 'contactNumber' },
      });
    }
    if (!EMAIL_PATTERN.test(requested.email) || requested.email.length > 254) {
      fail('IDENTITY_CORRECTION_INVALID', 'Enter a valid proposed email address.', {
        details: { field: 'email' },
      });
    }
    if (requested.reason.length < 1 || requested.reason.length > 500) {
      fail('IDENTITY_CORRECTION_INVALID', 'Provide a reason for the correction request.', {
        details: { field: 'reason' },
      });
    }
    let protectedRequestEnvelope;
    try {
      protectedRequestEnvelope = await protectIdentityRequest(requested, { accountId: currentActor.id });
    } catch {
      fail('IDENTITY_CORRECTION_UNAVAILABLE', 'Protected identity correction is temporarily unavailable.', {
        status: 503,
      });
    }
    if (
      protectedRequestEnvelope === undefined ||
      protectedRequestEnvelope === null ||
      (typeof protectedRequestEnvelope === 'string' && !protectedRequestEnvelope.trim())
    ) {
      fail('IDENTITY_CORRECTION_UNAVAILABLE', 'Protected identity correction is temporarily unavailable.', {
        status: 503,
      });
    }
    const createdAt = nowIso();
    const correction = {
      id: createId(),
      state: 'PENDING',
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    };
    const result = {
      ok: true,
      created: true,
      replayed: false,
      correction,
      canonicalIdentityChanged: false,
    };
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_IDENTITY_CORRECTION_REQUESTED',
        actor: currentActor,
        changedAt: createdAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { canonicalIdentityChanged: false },
        after: { correctionRequested: true, state: 'PENDING', canonicalIdentityChanged: false },
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_IDENTITY_CORRECTION',
        replay,
        actor: currentActor,
        result,
        changedAt: createdAt,
      }),
    };
    try {
      await repository.createIdentityCorrection({
        ...correction,
        accountId: currentActor.id,
        protectedRequestEnvelope:
          typeof protectedRequestEnvelope === 'string'
            ? protectedRequestEnvelope
            : JSON.stringify(protectedRequestEnvelope),
        clientRequestId: replay.key,
        correlationId: evidence.audit.correlationId,
        evidence,
      });
    } catch (error) {
      if (/UNIQUE|CONSTRAINT/iu.test(String(error?.message ?? error))) {
        fail('IDEMPOTENCY_CONFLICT', 'This retry key was used with different values.', { status: 409 });
      }
      throw error;
    }
    return result;
  }

  async function updateAppearance({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const replay = await mutationReplay(repository, 'PROFILE_APPEARANCE_UPDATE', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const theme = String(command.theme ?? '')
      .trim()
      .toUpperCase();
    if (!APPEARANCE_THEMES.includes(theme)) {
      fail('PROFILE_APPEARANCE_INVALID', 'Choose Light, Dark, or System appearance.', {
        details: { field: 'theme' },
      });
    }
    const changedAt = nowIso();
    const result = {
      ok: true,
      changed: theme !== profile.appearanceTheme,
      replayed: false,
      appearance: { theme },
      profile: dto(currentActor, { ...profile, appearanceTheme: theme }),
    };
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_APPEARANCE_UPDATED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: {
          theme: APPEARANCE_THEMES.includes(profile.appearanceTheme) ? profile.appearanceTheme : 'SYSTEM',
        },
        after: { theme },
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_APPEARANCE_UPDATE',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    const refreshed = await repository.updateAppearance({
      accountId: currentActor.id,
      theme,
      changedAt,
      evidence,
    });
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  function requireAvatarBucket() {
    if (
      !avatarBucket ||
      typeof avatarBucket.get !== 'function' ||
      typeof avatarBucket.put !== 'function' ||
      typeof avatarBucket.delete !== 'function'
    ) {
      fail('PROFILE_AVATAR_UNAVAILABLE', 'Profile picture storage is unavailable in this environment.', {
        status: 404,
      });
    }
    return avatarBucket;
  }

  async function avatar(context = {}) {
    const currentActor = assertSelf(context);
    const bucket = requireAvatarBucket();
    const profile = await requireProfile(repository, currentActor);
    if (!profile.avatarAssetKey)
      fail('PROFILE_AVATAR_NOT_FOUND', 'No profile picture is available.', { status: 404 });
    const object = await bucket.get(profile.avatarAssetKey);
    if (!object) fail('PROFILE_AVATAR_NOT_FOUND', 'No profile picture is available.', { status: 404 });
    const contentType = String(object.httpMetadata?.contentType ?? '').toLowerCase();
    if (!AVATAR_CONTENT_TYPES[contentType]) {
      fail('PROFILE_AVATAR_INVALID', 'The stored profile picture is unavailable.', { status: 404 });
    }
    const headers = new Headers({
      'cache-control': 'private, no-store',
      'content-type': contentType,
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
    });
    if (object.httpEtag) headers.set('etag', object.httpEtag);
    return new Response(object.body, { headers });
  }

  async function uploadAvatar({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const bucket = requireAvatarBucket();
    const replay = await mutationReplay(repository, 'PROFILE_AVATAR_UPLOAD', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const expectedUpdatedAt = expectedRevision(command, profile);
    const media = avatarBytes(command);
    const objectKey = `playground-redacted/profile-avatars/${createId()}.${media.extension}`;
    const changedAt = nextTimestamp(clock, profile.updatedAt);
    const result = {
      ok: true,
      changed: true,
      replayed: false,
      cleanupPending: false,
      profile: dto(currentActor, {
        ...profile,
        avatarAssetKey: objectKey,
        avatarUpdatedAt: changedAt,
        updatedAt: changedAt,
      }),
    };
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_AVATAR_REPLACED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { avatarAvailable: Boolean(profile.avatarAssetKey) },
        after: { avatarAvailable: true, contentType: media.contentType, byteSize: media.bytes.length },
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_AVATAR_UPLOAD',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    await bucket.put(objectKey, media.bytes, {
      httpMetadata: { contentType: media.contentType },
      customMetadata: { purpose: 'playground-profile-avatar' },
    });
    let refreshed;
    try {
      refreshed = await repository.updateAvatar({
        accountId: currentActor.id,
        expectedUpdatedAt,
        avatarAssetKey: objectKey,
        changedAt,
        evidence,
      });
    } catch (error) {
      try {
        await bucket.delete(objectKey);
      } catch {
        // Preserve the authoritative D1 error; reset reconciliation remains the fallback cleanup.
      }
      mapRepositoryError(error);
    }
    if (profile.avatarAssetKey && profile.avatarAssetKey !== objectKey) {
      try {
        await bucket.delete(profile.avatarAssetKey);
      } catch {
        result.cleanupPending = true;
      }
    }
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  async function deleteAvatar({ account, actor, command = {}, correlationId = '' } = {}) {
    const currentActor = assertSelf({ account, actor });
    const bucket = requireAvatarBucket();
    const replay = await mutationReplay(repository, 'PROFILE_AVATAR_DELETE', currentActor, command);
    if (replay.result) return { ...replay.result, replayed: true };
    const profile = await requireProfile(repository, currentActor);
    const expectedUpdatedAt = expectedRevision(command, profile);
    const changedAt = nextTimestamp(clock, profile.updatedAt);
    const result = {
      ok: true,
      changed: Boolean(profile.avatarAssetKey),
      replayed: false,
      cleanupPending: false,
      profile: dto(currentActor, {
        ...profile,
        avatarAssetKey: '',
        avatarUpdatedAt: changedAt,
        updatedAt: changedAt,
      }),
    };
    const evidence = {
      audit: genericAudit({
        action: 'PROFILE_AVATAR_REMOVED',
        actor: currentActor,
        changedAt,
        correlationId: String(correlationId || `PROFILE_${createId()}`),
        before: { avatarAvailable: Boolean(profile.avatarAssetKey) },
        after: { avatarAvailable: false },
      }),
      idempotency: genericIdempotency({
        scope: 'PROFILE_AVATAR_DELETE',
        replay,
        actor: currentActor,
        result,
        changedAt,
      }),
    };
    let refreshed;
    try {
      refreshed = await repository.updateAvatar({
        accountId: currentActor.id,
        expectedUpdatedAt,
        avatarAssetKey: '',
        changedAt,
        evidence,
      });
    } catch (error) {
      mapRepositoryError(error);
    }
    if (profile.avatarAssetKey) {
      try {
        await bucket.delete(profile.avatarAssetKey);
      } catch {
        result.cleanupPending = true;
      }
    }
    if (refreshed) result.profile = dto(currentActor, refreshed);
    return result;
  }

  return Object.freeze({
    get,
    getProfile: get,
    getAppearance,
    updateContact,
    update: updateContact,
    changeUsername,
    usernameChange: changeUsername,
    changePassword,
    passwordChange: changePassword,
    requestIdentityCorrection,
    identityCorrectionRequest: requestIdentityCorrection,
    updateAppearance,
    avatar,
    uploadAvatar,
    deleteAvatar,
  });
}
