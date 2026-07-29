import { ROLES } from '../../domain/constants.js';

export const IDENTITY_ROSTER_HEADERS = Object.freeze([
  'Student_ID',
  'Institutional_Email',
  'Display_Name',
  'Verification_Result',
  'Active',
  'Review_Notes',
]);

const VERIFICATION_RESULTS = new Set(['VERIFIED', 'PENDING', 'NOT_VERIFIED', 'REJECTED']);

const ERROR_MESSAGES = Object.freeze({
  ROSTER_OWNER_REQUIRED: 'Only the System Owner may use the protected identity roster.',
  ROSTER_SOURCE_NOT_CONFIGURED: 'The approved private roster source is not configured.',
  ROSTER_SOURCE_AUTHORIZATION_FAILED: 'The approved private roster source could not be authorized.',
  ROSTER_SOURCE_UNAVAILABLE: 'The approved private roster source could not be read.',
  ROSTER_PREVIEW_NOT_FOUND: 'The identity roster sync preview was not found.',
  ROSTER_PREVIEW_REJECTED: 'The directory preview has no valid rows and cannot be applied.',
  ROSTER_PREVIEW_STALE: 'This directory preview is out of date. Create and review a new preview.',
  ROSTER_SOURCE_ALREADY_APPLIED: 'The protected directory already matches this reviewed update.',
  ROSTER_FINGERPRINT_CONFIRMATION_REQUIRED: 'Confirm the exact source fingerprint before applying.',
  ROSTER_REASON_REQUIRED: 'A specific reason of at least eight characters is required.',
  ROSTER_ROLLBACK_NOT_LATEST: 'Only the latest applied identity roster sync can be rolled back.',
  ROSTER_ROLLBACK_UNAVAILABLE: 'The protected rollback snapshot is unavailable.',
  ROSTER_RECONCILIATION_FAILED: 'The identity roster write did not reconcile.',
});

export class IdentityRosterError extends Error {
  constructor(code, { status = 400 } = {}) {
    super(ERROR_MESSAGES[code] ?? 'The identity roster request could not be completed.');
    this.name = 'IdentityRosterError';
    this.code = code;
    this.status = status;
  }
}

const fail = (code, options) => {
  throw new IdentityRosterError(code, options);
};

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
const normalizeText = (value) => String(value ?? '').trim();
const compact = (value) => normalizeText(value).replaceAll(/\s+/gu, ' ');

function activeValue(value) {
  if (value === true || value === false) return value;
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'TRUE') return true;
  if (normalized === 'FALSE') return false;
  return null;
}

function safeRun(run) {
  if (!run) return null;
  return {
    id: run.id,
    sourceFingerprint: run.sourceFingerprint,
    sourceRowCount: run.sourceRowCount,
    acceptedCount: run.acceptedCount,
    rejectionCount: run.rejectionCount,
    addCount: run.addCount,
    changeCount: run.changeCount,
    removalCount: run.removalCount,
    unchangedCount: run.unchangedCount,
    validationStatus: run.validationStatus,
    applyStatus: run.applyStatus,
    createdAt: run.createdAt,
    appliedAt: run.appliedAt,
    rolledBackAt: run.rolledBackAt,
  };
}

function sameProfile(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function requiredReason(value) {
  const reason = compact(value);
  if (reason.length < 8 || reason.length > 500) fail('ROSTER_REASON_REQUIRED');
  return reason;
}

function assertOwner(actor) {
  if (String(actor?.roleId ?? '').toUpperCase() !== ROLES.SYSTEM_OWNER) {
    fail('ROSTER_OWNER_REQUIRED', { status: 403 });
  }
}

export function validateIdentityRosterSource(source) {
  const headers = Array.isArray(source?.headers) ? source.headers.map(normalizeText) : [];
  const rows = Array.isArray(source?.rows) ? source.rows : [];
  const rejections = [];
  if (
    headers.length !== IDENTITY_ROSTER_HEADERS.length ||
    headers.some((header, index) => header !== IDENTITY_ROSTER_HEADERS[index])
  ) {
    return {
      valid: false,
      sourceRowCount: rows.length,
      rows: [],
      rejections: [{ rowNumber: 1, codes: ['SOURCE_SCHEMA_INVALID'] }],
    };
  }

  const accepted = [];
  const meaningfulRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => Array.isArray(row) && row.some((value) => normalizeText(value) !== ''));
  const emailCounts = new Map();
  const studentIdCounts = new Map();
  for (const { row } of meaningfulRows) {
    const email = normalizeEmail(row[1]);
    const studentId = compact(row[0]).toUpperCase();
    if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
    if (studentId) studentIdCounts.set(studentId, (studentIdCounts.get(studentId) ?? 0) + 1);
  }
  meaningfulRows.forEach(({ row, index }) => {
    const studentId = compact(row[0]);
    const institutionalEmail = normalizeEmail(row[1]);
    const displayName = compact(row[2]);
    const verificationResult = normalizeText(row[3]).toUpperCase();
    const active = activeValue(row[4]);
    const reviewNotes = compact(row[5]);
    const codes = [];
    if (studentId.length < 3 || studentId.length > 64) codes.push('STUDENT_ID_INVALID');
    if (
      institutionalEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(institutionalEmail)
    )
      codes.push('INSTITUTIONAL_EMAIL_INVALID');
    if (displayName.length < 2 || displayName.length > 160) codes.push('DISPLAY_NAME_INVALID');
    if (!VERIFICATION_RESULTS.has(verificationResult)) codes.push('VERIFICATION_RESULT_INVALID');
    if (active === null) codes.push('ACTIVE_VALUE_INVALID');
    if (reviewNotes.length > 1000) codes.push('REVIEW_NOTES_TOO_LONG');
    if (institutionalEmail && emailCounts.get(institutionalEmail) > 1) {
      codes.push('DUPLICATE_INSTITUTIONAL_EMAIL');
    }
    if (studentId && studentIdCounts.get(studentId.toUpperCase()) > 1) {
      codes.push('DUPLICATE_STUDENT_ID');
    }
    if (codes.length) {
      rejections.push({
        rowNumber: index + 2,
        studentId,
        institutionalEmail,
        codes,
      });
      return;
    }
    accepted.push({
      studentId,
      institutionalEmail,
      displayName,
      verificationResult,
      active,
      reviewNotes,
    });
  });
  if (!accepted.length && !rejections.length) {
    rejections.push({ rowNumber: 2, codes: ['SOURCE_EMPTY'] });
  }
  accepted.sort((left, right) =>
    left.institutionalEmail.localeCompare(right.institutionalEmail),
  );
  return {
    valid: accepted.length > 0,
    sourceRowCount: accepted.length + rejections.length,
    rows: accepted,
    rejections,
  };
}

export function createIdentityRosterService({
  repository,
  source,
  crypto,
  clock = { now: () => Date.now() },
  createId = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!repository || !source || !crypto) {
    throw new Error('Identity roster repository, source, and crypto are required.');
  }
  const nowIso = () => new Date(clock.now()).toISOString();

  const decryptedEntries = async () => {
    const entries = await repository.listEntries();
    return Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        profile: await crypto.decrypt(entry.protectedProfileEnvelope),
      })),
    );
  };

  return Object.freeze({
    async status({ actor }) {
      assertOwner(actor);
      const [latestRun, runs, entries] = await Promise.all([
        repository.latestRun(),
        repository.listRuns(20),
        repository.listEntries(),
      ]);
      return {
        source: source.status(),
        latestRun: safeRun(latestRun),
        runs: runs.map(safeRun),
        directory: {
          total: entries.length,
          active: entries.filter((entry) => entry.active).length,
        },
      };
    },

    async preview({ actor, correlationId = '' }) {
      assertOwner(actor);
      let sourceData;
      try {
        sourceData = await source.read();
      } catch (error) {
        const code = Object.hasOwn(ERROR_MESSAGES, error?.code)
          ? error.code
          : 'ROSTER_SOURCE_UNAVAILABLE';
        fail(code, { status: code === 'ROSTER_SOURCE_NOT_CONFIGURED' ? 503 : 502 });
      }
      const validation = validateIdentityRosterSource(sourceData);
      const sourceFingerprint = await crypto.fingerprint(
        sourceData.fingerprintSource ?? {
          headers: sourceData.headers,
          rows: sourceData.rows,
        },
      );
      const current = await decryptedEntries();
      const currentByKey = new Map(current.map((entry) => [entry.identityKey, entry]));
      const planned = [];
      for (const profile of validation.rows) {
        const identityKey = await crypto.identityKey(profile.institutionalEmail);
        const existing = currentByKey.get(identityKey);
        planned.push({ identityKey, profile, action: existing ? (sameProfile(existing.profile, profile) ? 'UNCHANGED' : 'CHANGE') : 'ADD' });
        currentByKey.delete(identityKey);
      }
      const rejectedEmails = new Set(
        validation.rejections.map((rejection) => normalizeEmail(rejection.institutionalEmail)).filter(Boolean),
      );
      const rejectedStudentIds = new Set(
        validation.rejections
          .map((rejection) => compact(rejection.studentId).toUpperCase())
          .filter(Boolean),
      );
      const preservedProfiles = [];
      for (const [identityKey, entry] of currentByKey) {
        const email = normalizeEmail(entry.profile.institutionalEmail);
        const studentId = compact(entry.profile.studentId).toUpperCase();
        if (rejectedEmails.has(email) || rejectedStudentIds.has(studentId)) {
          preservedProfiles.push(entry.profile);
          currentByKey.delete(identityKey);
        }
      }
      const addCount = planned.filter((entry) => entry.action === 'ADD').length;
      const changeCount = planned.filter((entry) => entry.action === 'CHANGE').length;
      const unchangedCount =
        planned.filter((entry) => entry.action === 'UNCHANGED').length + preservedProfiles.length;
      const removalCount = currentByKey.size;
      const validationStatus = validation.valid
        ? validation.rejections.length
          ? 'VALID_WITH_REJECTIONS'
          : 'VALID'
        : 'REJECTED';
      const run = {
        id: `RSY-${createId()}`,
        sourceFingerprint,
        sourceRowCount: validation.sourceRowCount,
        acceptedCount: validation.rows.length,
        rejectionCount: validation.rejections.length,
        addCount,
        changeCount,
        removalCount,
        unchangedCount,
        validationStatus,
        protectedSourceEnvelope: await crypto.encrypt([...validation.rows, ...preservedProfiles]),
        protectedRejectionsEnvelope: await crypto.encrypt(validation.rejections),
        createdByAccountId: actor.id,
        createdAt: nowIso(),
        correlationId,
      };
      await repository.createPreview(run);
      return {
        ...safeRun({ ...run, applyStatus: 'PREVIEWED' }),
        rejections: validation.rejections.map(({ rowNumber, codes }) => ({ rowNumber, codes })),
      };
    },

    async directory({ actor, command = {} }) {
      assertOwner(actor);
      const query = compact(command.query).toLowerCase();
      const pageSize = Math.max(1, Math.min(100, Number(command.pageSize) || 25));
      const all = (await decryptedEntries()).filter((entry) => {
        if (!query) return true;
        const profile = entry.profile;
        return [profile.studentId, profile.institutionalEmail, profile.displayName, profile.verificationResult]
          .some((value) => String(value).toLowerCase().includes(query));
      });
      const page = Math.max(1, Number(command.page) || 1);
      const start = (page - 1) * pageSize;
      return {
        items: all.slice(start, start + pageSize).map((entry) => ({
          ...entry.profile,
          sourceFingerprint: entry.sourceFingerprint,
          sourceRunId: entry.sourceRunId,
          updatedAt: entry.updatedAt,
        })),
        pagination: {
          page,
          pageSize,
          total: all.length,
          totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
        },
      };
    },

    async selfProfile({ actor }) {
      const email = normalizeEmail(actor?.profile?.email);
      if (!email) return { linked: false, profile: null };
      const entry = await repository.getEntry(await crypto.identityKey(email));
      if (!entry) return { linked: false, profile: null };
      const profile = await crypto.decrypt(entry.protectedProfileEnvelope);
      return {
        linked: true,
        profile: {
          studentId: profile.studentId,
          institutionalEmail: profile.institutionalEmail,
          displayName: profile.displayName,
          verificationResult: profile.verificationResult,
          active: profile.active,
          updatedAt: entry.updatedAt,
        },
      };
    },

    async apply({ actor, command = {}, correlationId = '' }) {
      assertOwner(actor);
      const reason = requiredReason(command.reason);
      const run = await repository.getRun(String(command.runId ?? ''));
      if (!run) fail('ROSTER_PREVIEW_NOT_FOUND', { status: 404 });
      if (run.applyStatus === 'APPLIED') return { applied: true, replayed: true, run: safeRun(run) };
      if (!['VALID', 'VALID_WITH_REJECTIONS'].includes(run.validationStatus)) {
        fail('ROSTER_PREVIEW_REJECTED', { status: 409 });
      }
      if (run.applyStatus !== 'PREVIEWED') fail('ROSTER_PREVIEW_REJECTED', { status: 409 });
      if (String(command.confirmSourceFingerprint ?? '') !== run.sourceFingerprint) {
        fail('ROSTER_FINGERPRINT_CONFIRMATION_REQUIRED', { status: 409 });
      }
      const latestRun = await repository.latestRun();
      if (!latestRun || latestRun.id !== run.id) fail('ROSTER_PREVIEW_STALE', { status: 409 });
      if (run.addCount === 0 && run.changeCount === 0 && run.removalCount === 0) {
        fail('ROSTER_SOURCE_ALREADY_APPLIED', { status: 409 });
      }
      let currentSource;
      try {
        currentSource = await source.read();
      } catch (error) {
        const code = Object.hasOwn(ERROR_MESSAGES, error?.code)
          ? error.code
          : 'ROSTER_SOURCE_UNAVAILABLE';
        fail(code, { status: code === 'ROSTER_SOURCE_NOT_CONFIGURED' ? 503 : 502 });
      }
      const currentFingerprint = await crypto.fingerprint(
        currentSource.fingerprintSource ?? {
          headers: currentSource.headers,
          rows: currentSource.rows,
        },
      );
      if (currentFingerprint !== run.sourceFingerprint) fail('ROSTER_PREVIEW_STALE', { status: 409 });
      const [profiles, current] = await Promise.all([
        crypto.decrypt(run.protectedSourceEnvelope),
        repository.listEntries(),
      ]);
      const appliedAt = nowIso();
      const entries = [];
      for (const profile of profiles) {
        entries.push({
          identityKey: await crypto.identityKey(profile.institutionalEmail),
          protectedProfileEnvelope: await crypto.encrypt(profile),
          active: profile.active,
          sourceFingerprint: run.sourceFingerprint,
          sourceRunId: run.id,
          updatedAt: appliedAt,
        });
      }
      const snapshotEnvelope = await crypto.encrypt(current);
      await repository.applyRun({
        run: { ...run, currentEntryCount: current.length },
        entries,
        snapshotEnvelope,
        actor,
        appliedAt,
        correlationId,
        auditId: `AUD-${createId()}`,
        reason,
      });
      const reconciliation = await repository.reconcile(run.sourceFingerprint, entries.length);
      if (!reconciliation.reconciled) fail('ROSTER_RECONCILIATION_FAILED', { status: 500 });
      return { applied: true, replayed: false, run: safeRun({ ...run, applyStatus: 'APPLIED', appliedAt }), reconciliation };
    },

    async rollback({ actor, command = {}, correlationId = '' }) {
      assertOwner(actor);
      const reason = requiredReason(command.reason);
      const run = await repository.getRun(String(command.runId ?? ''));
      const latest = await repository.latestAppliedRun();
      if (!run || !latest || latest.id !== run.id || run.applyStatus !== 'APPLIED') {
        fail('ROSTER_ROLLBACK_NOT_LATEST', { status: 409 });
      }
      if (String(command.confirmSourceFingerprint ?? '') !== run.sourceFingerprint) {
        fail('ROSTER_FINGERPRINT_CONFIRMATION_REQUIRED', { status: 409 });
      }
      const snapshotEnvelope = await repository.getSnapshotEnvelope(run.id);
      if (!snapshotEnvelope) fail('ROSTER_ROLLBACK_UNAVAILABLE', { status: 409 });
      const entries = await crypto.decrypt(snapshotEnvelope);
      const rolledBackAt = nowIso();
      await repository.rollbackRun({
        run,
        entries,
        actor,
        rolledBackAt,
        correlationId,
        auditId: `AUD-${createId()}`,
        reason,
      });
      const expectedFingerprint = entries[0]?.sourceFingerprint ?? '';
      const reconciliation = expectedFingerprint
        ? await repository.reconcile(expectedFingerprint, entries.length)
        : { entryCount: 0, matchingCount: 0, reconciled: (await repository.listEntries()).length === 0 };
      if (!reconciliation.reconciled) fail('ROSTER_RECONCILIATION_FAILED', { status: 500 });
      return { rolledBack: true, run: safeRun({ ...run, applyStatus: 'ROLLED_BACK', rolledBackAt }), reconciliation };
    },
  });
}
