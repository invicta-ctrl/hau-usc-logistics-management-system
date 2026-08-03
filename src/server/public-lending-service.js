import { ApiError } from './d1/operational-service.js';
import { loadLendingCatalog } from './lending-catalog-service.js';
import { USC_DEPARTMENT_NAMES } from '../domain/usc-departments.js';
import { operationalInteger } from '../domain/operational-integers.js';

const PUBLIC_ACTOR_ID = 'SYSTEM-PUBLIC-REQUEST';
const OWNER_COMMITTEE_ID = 'COM_INVENTORY_PANTRY';
export const USC_DEPARTMENTS = USC_DEPARTMENT_NAMES;
const encoder = new TextEncoder();
const PUBLIC_POLICY_VERSION = '2026-07-28';
const UUID_V4_SUFFIX = /(?:^|[-_:])[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function requireAcknowledgment(command, field, message) {
  if (command[field] !== true) {
    throw new ApiError('VALIDATION_FAILED', message, { status: 422, details: { field } });
  }
}

const requiredText = (value, field, max) => {
  const result = String(value ?? '')
    .trim()
    .replace(/\s+/gu, ' ');
  if (!result || result.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, {
      status: 422,
      details: { field },
    });
  }
  return result;
};

const optionalText = (value, max) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/gu, ' ')
    .slice(0, max);

function strongClientRequestId(value) {
  const result = requiredText(value, 'clientRequestId', 80);
  if (!UUID_V4_SUFFIX.test(result)) {
    throw new ApiError('VALIDATION_FAILED', 'A strong retry key is required.', {
      status: 422,
      details: { field: 'clientRequestId' },
    });
  }
  return result;
}

function email(value) {
  const result = requiredText(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(result)) {
    throw new ApiError('VALIDATION_FAILED', 'Enter a valid email address.', {
      status: 422,
      details: { field: 'email' },
    });
  }
  return result;
}

function phone(value) {
  const result = requiredText(value, 'contactNumber', 24);
  if (!/^\+?[0-9][0-9 ()-]{7,19}$/u.test(result)) {
    throw new ApiError('VALIDATION_FAILED', 'Enter a valid contact number.', {
      status: 422,
      details: { field: 'contactNumber' },
    });
  }
  return result;
}

function dateOnly(value, field) {
  const result = requiredText(value, field, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(result);
  const parsed = new Date(`${result}T00:00:00Z`);
  if (
    !match ||
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(match[1]) ||
    parsed.getUTCMonth() + 1 !== Number(match[2]) ||
    parsed.getUTCDate() !== Number(match[3])
  ) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a valid date.`, {
      status: 422,
      details: { field },
    });
  }
  return result;
}

function positiveInteger(value, field) {
  try {
    return operationalInteger(value, { field, min: 1, max: 1000 });
  } catch {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a positive whole number.`, {
      status: 422,
      details: { field },
    });
  }
}

function base64Url(buffer) {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export function createPublicLendingService({ db, trackingSecret, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (String(trackingSecret ?? '').length < 32) {
    throw new Error('A protected public-submission secret is required.');
  }
  const nowIso = () => new Date(clock.now()).toISOString();
  const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

  async function rateLimit(networkKey, action = 'SUBMIT') {
    const now = clock.now();
    const windowMs = 60 * 60 * 1000;
    const limit = action === 'TRACK' ? 60 : 10;
    const limiterKey = await hmac(trackingSecret, `${action}:lending:${String(networkKey || 'untrusted')}`);
    const recent = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM public_lending_rate_limit_events
         WHERE limiter_key = ?1 AND action = ?2 AND attempted_at > ?3`,
      )
      .bind(limiterKey, action, now - windowMs)
      .first();
    if (Number(recent?.count ?? 0) >= limit) {
      throw new ApiError('PUBLIC_RATE_LIMITED', 'Too many requests. Try again later.', { status: 429 });
    }
    await db.batch([
      db
        .prepare('DELETE FROM public_lending_rate_limit_events WHERE attempted_at <= ?1')
        .bind(now - 24 * windowMs),
      db
        .prepare(
          `INSERT INTO public_lending_rate_limit_events (id, limiter_key, action, attempted_at)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(createId('LRL'), limiterKey, action, now),
    ]);
  }

  async function catalog() {
    return {
      ok: true,
      uscDepartments: USC_DEPARTMENTS,
      items: await loadLendingCatalog(db, { publicOnly: true }),
      process: [
        'Submit a borrowing request for staff review.',
        'Wait for Ready to Claim instructions before pickup.',
        'Present the approved borrower identity at handoff.',
        'Return reusable items by the approved due date.',
      ],
    };
  }

  async function normalizeLines(lines, { replay = false } = {}) {
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 12) {
      throw new ApiError('VALIDATION_FAILED', 'Select between 1 and 12 lending items.', {
        status: 422,
      });
    }
    const seen = new Set();
    const normalized = [];
    for (const [index, line] of lines.entries()) {
      const itemId = requiredText(line.itemId, `lines[${index}].itemId`, 80);
      if (seen.has(itemId)) {
        throw new ApiError('VALIDATION_FAILED', 'Each lending item may be selected once.', {
          status: 422,
        });
      }
      seen.add(itemId);
      if (replay) {
        // A retry must survive catalog availability changes; persisted request lines are the proof.
        normalized.push({ itemId, quantity: positiveInteger(line.quantity, `lines[${index}].quantity`) });
        continue;
      }
      const [item] = await loadLendingCatalog(db, { publicOnly: true, itemId, staff: true });
      if (!item) {
        throw new ApiError('PUBLIC_REFERENCE_UNAVAILABLE', 'A selected lending item is unavailable.', {
          status: 409,
        });
      }
      const quantity = positiveInteger(line.quantity, `lines[${index}].quantity`);
      if (
        !['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(item.availability) ||
        quantity > item.maximumQuantity ||
        quantity > item.lendableAvailable
      ) {
        throw new ApiError(
          'LENDING_QUANTITY_UNAVAILABLE',
          'A selected quantity is not currently available.',
          { status: 409 },
        );
      }
      normalized.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        ticketType: item.type === 'REUSABLE' ? 'LOAN' : 'CONSUMABLE',
        dueDateRequired: item.dueDateRequired,
        acknowledgmentRequired: item.acknowledgmentRequired,
      });
    }
    return normalized;
  }

  const trackingCodeFor = (submissionId, clientRequestId) =>
    hmac(trackingSecret, `lending-code:${submissionId}:${clientRequestId}`);
  const trackingDigestFor = (trackingCode) => hmac(trackingSecret, `lending-digest:${trackingCode}`);
  const requestFingerprintFor = (submission) =>
    hmac(
      trackingSecret,
      `lending-request:${JSON.stringify({
        borrowerType: submission.borrowerType,
        borrowerName: submission.borrowerName,
        studentId: submission.studentId,
        courseYear: submission.courseYear,
        academicDepartment: submission.academicDepartment,
        uscDepartment: submission.uscDepartment,
        positionRole: submission.positionRole,
        contactNumber: submission.contactNumber,
        email: submission.email,
        purpose: submission.purpose,
        pickupDate: submission.pickupDate,
        dueDate: submission.dueDate,
        responsibilityAcknowledged: submission.responsibilityAcknowledged === true,
        dataUseAcknowledged: submission.dataUseAcknowledged === true,
        acceptableUseAcknowledged: submission.acceptableUseAcknowledged === true,
        borrowerResponsibilityAcknowledged: submission.borrowerResponsibilityAcknowledged === true,
        evidenceConsentAcknowledged: submission.evidenceConsentAcknowledged === true,
        lines: submission.lines.map((line) => ({
          itemId: line.itemId,
          quantity: line.fingerprintQuantity ?? line.quantity,
        })),
      })}`,
    );

  async function trackedLines(submissionId, { includeItemId = false } = {}) {
    const result = await db
      .prepare(
        `SELECT ticket.item_id, ticket.requested_item_id, ticket.requested_quantity,
           ticket.status, ticket.ticket_type, ticket.quantity, ticket.unit,
           ticket.due_at, item.name AS item_name
         FROM public_lending_submission_tickets link
         JOIN lending_tickets ticket ON ticket.id = link.lending_ticket_id
         LEFT JOIN inventory_items item ON item.id = ticket.item_id
         WHERE link.public_lending_submission_id = ?1
         ORDER BY ticket.created_at, ticket.id`,
      )
      .bind(submissionId)
      .all();
    return (result.results ?? []).map((row) => ({
      ...(includeItemId
        ? {
            itemId: row.requested_item_id ?? row.item_id,
            fingerprintQuantity: row.requested_quantity ?? row.quantity,
          }
        : {}),
      itemName: String(row.item_name ?? 'Requested item'),
      ticketType: row.ticket_type,
      quantity: row.quantity,
      unit: row.unit,
      status: row.status,
      dueAt: row.due_at,
    }));
  }

  function overallStatus(lines) {
    const statuses = [...new Set(lines.map((line) => line.status).filter(Boolean))];
    if (!statuses.length) return 'FOR_REVIEW';
    return statuses.length === 1 ? statuses[0] : 'IN_PROGRESS';
  }

  async function validateSubmission(command, { replay = false } = {}) {
    requireAcknowledgment(command, 'dataUseAcknowledged', 'Privacy acknowledgment is required.');
    requireAcknowledgment(command, 'acceptableUseAcknowledged', 'Acceptable Use acknowledgment is required.');
    requireAcknowledgment(
      command,
      'borrowerResponsibilityAcknowledged',
      'Borrower responsibility acknowledgment is required.',
    );
    requireAcknowledgment(
      command,
      'evidenceConsentAcknowledged',
      'Evidence and photo acknowledgment is required.',
    );

    const borrowerType = requiredText(command.borrowerType, 'borrowerType', 20).toUpperCase();
    if (!['USC_STAFF', 'ANGELITE'].includes(borrowerType)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose USC Staff/Officer or Angelite Student.', {
        status: 422,
        details: { field: 'borrowerType' },
      });
    }
    const borrowerName = requiredText(command.borrowerName, 'borrowerName', 120);
    const studentId = requiredText(command.studentId, 'studentId', 8);
    if (!/^\d{1,8}$/u.test(studentId)) {
      throw new ApiError('VALIDATION_FAILED', 'Student ID must contain one to eight digits.', {
        status: 422,
        details: { field: 'studentId' },
      });
    }
    const courseYear = borrowerType === 'ANGELITE' ? requiredText(command.courseYear, 'courseYear', 80) : '';
    const academicDepartment =
      borrowerType === 'ANGELITE' ? requiredText(command.academicDepartment, 'academicDepartment', 120) : '';
    const uscDepartment =
      borrowerType === 'USC_STAFF' ? requiredText(command.uscDepartment, 'uscDepartment', 120) : '';
    if (borrowerType === 'USC_STAFF' && !USC_DEPARTMENTS.includes(uscDepartment)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved USC department or office.', {
        status: 422,
        details: { field: 'uscDepartment' },
      });
    }
    const positionRole = borrowerType === 'USC_STAFF' ? optionalText(command.positionRole, 120) : '';
    const contactNumber = phone(command.contactNumber);
    const borrowerEmail = email(command.email);
    const purpose = requiredText(command.purpose, 'purpose', 500);
    const pickupDate = dateOnly(command.pickupDate, 'pickupDate');
    const lines = await normalizeLines(command.lines, { replay });
    const dueDate = command.dueDate ? dateOnly(command.dueDate, 'dueDate') : '';
    const today = nowIso().slice(0, 10);
    if (
      (!replay && pickupDate < today) ||
      (dueDate && dueDate < pickupDate) ||
      (!replay && lines.some((line) => line.dueDateRequired) && !dueDate)
    ) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Pickup must be current or future and due date cannot precede pickup.',
        { status: 422, details: { field: pickupDate < today ? 'pickupDate' : 'dueDate' } },
      );
    }
    if (
      !replay &&
      lines.some((line) => line.acknowledgmentRequired) &&
      command.responsibilityAcknowledged !== true
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Responsibility acknowledgment is required.', {
        status: 422,
        details: { field: 'responsibilityAcknowledged' },
      });
    }
    return {
      borrowerType,
      borrowerName,
      studentId,
      courseYear,
      academicDepartment,
      uscDepartment,
      positionRole,
      contactNumber,
      borrowerEmail,
      purpose,
      pickupDate,
      dueDate,
      responsibilityAcknowledged: command.responsibilityAcknowledged === true,
      dataUseAcknowledged: command.dataUseAcknowledged === true,
      acceptableUseAcknowledged: command.acceptableUseAcknowledged === true,
      borrowerResponsibilityAcknowledged: command.borrowerResponsibilityAcknowledged === true,
      evidenceConsentAcknowledged: command.evidenceConsentAcknowledged === true,
      lines,
    };
  }

  const replayConflict = () =>
    new ApiError('PUBLIC_LENDING_CONFLICT', 'The submission could not be safely replayed.', {
      status: 409,
    });

  async function replayExisting(existing, normalized, correlationId) {
    const storedLines = await trackedLines(existing.id, { includeItemId: true });
    const expectedFingerprint = await requestFingerprintFor({
      borrowerType: existing.borrower_type,
      borrowerName: existing.borrower_name,
      studentId: existing.student_id,
      courseYear: existing.course_year,
      academicDepartment: existing.academic_department,
      uscDepartment: existing.usc_department,
      positionRole: existing.position_role,
      contactNumber: existing.contact_number,
      email: existing.email,
      purpose: existing.purpose,
      pickupDate: existing.requested_pickup_date,
      dueDate: existing.requested_due_date,
      responsibilityAcknowledged: Boolean(existing.responsibility_acknowledged_at),
      dataUseAcknowledged: true,
      acceptableUseAcknowledged: true,
      borrowerResponsibilityAcknowledged: true,
      evidenceConsentAcknowledged: true,
      lines: storedLines,
    });
    const actualFingerprint = await requestFingerprintFor({
      ...normalized,
      email: normalized.borrowerEmail,
    });
    if (expectedFingerprint !== actualFingerprint) throw replayConflict();
    return {
      ok: true,
      submissionId: existing.id,
      status: overallStatus(storedLines),
      trackingCode: await trackingCodeFor(existing.id, existing.client_request_id),
      replayed: true,
      correlationId,
    };
  }

  async function submit({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey);
    const clientRequestIdValue = strongClientRequestId(command.clientRequestId);
    const existing = await db
      .prepare(
        `SELECT id, client_request_id, borrower_type, borrower_name, student_id,
           course_year, academic_department, usc_department, position_role, contact_number,
           email, purpose, requested_pickup_date, requested_due_date,
           responsibility_acknowledged_at, receipt_digest, created_at, updated_at
         FROM public_lending_submissions
         WHERE client_request_id = ?1`,
      )
      .bind(clientRequestIdValue)
      .first();
    if (existing) {
      try {
        const normalized = await validateSubmission(command, { replay: true });
        return await replayExisting(existing, normalized, correlationId);
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PUBLIC_LENDING_CONFLICT') throw error;
        throw replayConflict();
      }
    }
    const normalized = await validateSubmission(command);
    const {
      borrowerType,
      borrowerName,
      studentId,
      courseYear,
      academicDepartment,
      uscDepartment,
      positionRole,
      contactNumber,
      borrowerEmail,
      purpose,
      pickupDate,
      dueDate,
      lines,
    } = normalized;
    const clientRequestId = clientRequestIdValue;

    const submissionId = createId('LBR');
    const timestamp = nowIso();
    const trackingCode = await trackingCodeFor(submissionId, clientRequestId);
    const receiptDigest = await trackingDigestFor(trackingCode);
    const department = borrowerType === 'USC_STAFF' ? uscDepartment : academicDepartment;
    const statements = [
      db
        .prepare(
          `INSERT INTO public_lending_submissions (
             id, borrower_type, borrower_name, student_id, course_year, academic_department,
             usc_department, position_role, contact_number, email, purpose,
             requested_pickup_date, requested_due_date, responsibility_acknowledged_at,
             receipt_digest, client_request_id, created_at, updated_at, created_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
             ?14, ?15, ?16, ?17, ?17, ?18)`,
        )
        .bind(
          submissionId,
          borrowerType,
          borrowerName,
          studentId,
          courseYear,
          academicDepartment,
          uscDepartment,
          positionRole,
          contactNumber,
          borrowerEmail,
          purpose,
          pickupDate,
          dueDate,
          normalized.responsibilityAcknowledged ? timestamp : '',
          receiptDigest,
          clientRequestId,
          timestamp,
          PUBLIC_ACTOR_ID,
        ),
    ];
    lines.forEach((line, index) => {
      const ticketId = createId('LND');
      statements.push(
        db
          .prepare(
            `INSERT INTO lending_tickets (
               id, borrower_reference, borrower_name, borrower_type, department_organization,
               contact, item_id, quantity, unit, purpose, due_at, ticket_type, status,
               requested_item_id, requested_quantity, requested_start_at, requested_end_at,
               owner_committee_id, created_by, notes, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
               'FOR_REVIEW', ?7, ?8, ?13, ?14, ?15, ?16,
               'Public responsibility acknowledgment recorded.', ?17, ?17)`,
          )
          .bind(
            ticketId,
            studentId,
            borrowerName,
            borrowerType === 'USC_STAFF' ? 'PUBLIC_USC_STAFF' : 'PUBLIC_ANGELITE',
            department,
            contactNumber,
            line.itemId,
            line.quantity,
            line.unit,
            purpose,
            line.ticketType === 'LOAN' ? dueDate : null,
            line.ticketType,
            pickupDate,
            dueDate || null,
            OWNER_COMMITTEE_ID,
            PUBLIC_ACTOR_ID,
            timestamp,
          ),
        db
          .prepare(
            `INSERT INTO public_lending_submission_tickets (
               public_lending_submission_id, lending_ticket_id
             ) VALUES (?1, ?2)`,
          )
          .bind(submissionId, ticketId),
        db
          .prepare(
            `INSERT INTO status_history (
               id, entity_type, entity_id, new_status, changed_at, changed_by,
               reason, idempotency_key, metadata_json
             ) VALUES (?1, 'LENDING', ?2, 'FOR_REVIEW', ?3, ?4,
               'Public lending request submitted; no reservation or stock movement.', ?5, ?6)`,
          )
          .bind(
            createId('HIS'),
            ticketId,
            timestamp,
            PUBLIC_ACTOR_ID,
            `${clientRequestId}:${index + 1}`,
            JSON.stringify({ submissionId, borrowerType }),
          ),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               after_json, correlation_id
             ) VALUES (?1, ?2, 'PUBLIC_LENDING_SUBMITTED', 'LENDING', ?3, ?4, ?5, ?6)`,
          )
          .bind(
            createId('AUD'),
            timestamp,
            ticketId,
            PUBLIC_ACTOR_ID,
            JSON.stringify({
              submissionId,
              borrowerType,
              status: 'FOR_REVIEW',
              policyVersion: PUBLIC_POLICY_VERSION,
              dataUseAcknowledged: true,
              acceptableUseAcknowledged: true,
              borrowerResponsibilityAcknowledged: true,
              responsibilityAcknowledged: normalized.responsibilityAcknowledged,
              evidenceConsentAcknowledged: true,
            }),
            correlationId,
          ),
      );
    });
    statements.push(
      db
        .prepare(
          "UPDATE data_revisions SET revision = revision + 1, updated_at = ?1 WHERE scope IN ('global', 'lending')",
        )
        .bind(timestamp),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
        const raced = await db
          .prepare(
            `SELECT id, client_request_id, borrower_type, borrower_name, student_id,
               course_year, academic_department, usc_department, position_role, contact_number,
               email, purpose, requested_pickup_date, requested_due_date,
               responsibility_acknowledged_at, receipt_digest, created_at, updated_at
             FROM public_lending_submissions
             WHERE client_request_id = ?1`,
          )
          .bind(clientRequestId)
          .first();
        if (raced) {
          try {
            return await replayExisting(raced, normalized, correlationId);
          } catch {
            throw replayConflict();
          }
        }
        throw replayConflict();
      }
      throw error;
    }
    return {
      ok: true,
      submissionId,
      status: 'FOR_REVIEW',
      trackingCode,
      submittedAt: timestamp,
      replayed: false,
      correlationId,
    };
  }

  async function track({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey, 'TRACK');
    const submissionId = requiredText(command.submissionId, 'submissionId', 80);
    const trackingCode = requiredText(command.trackingCode, 'trackingCode', 128);
    const receiptDigest = await trackingDigestFor(trackingCode);
    const submission = await db
      .prepare(
        `SELECT id, created_at, updated_at
         FROM public_lending_submissions
         WHERE id = ?1 AND receipt_digest = ?2`,
      )
      .bind(submissionId, receiptDigest)
      .first();
    if (!submission) {
      throw new ApiError('PUBLIC_LENDING_NOT_FOUND', 'The lending request or tracking code is invalid.', {
        status: 404,
      });
    }
    const [linesResult, historyResult] = await Promise.all([
      trackedLines(submissionId),
      db
        .prepare(
          `SELECT history.new_status, history.changed_at
           FROM status_history history
           JOIN public_lending_submission_tickets link
             ON link.lending_ticket_id = history.entity_id
           WHERE link.public_lending_submission_id = ?1
             AND history.entity_type = 'LENDING'
           ORDER BY history.changed_at, history.id
           LIMIT 200`,
        )
        .bind(submissionId)
        .all(),
    ]);
    return {
      ok: true,
      submissionId,
      status: overallStatus(linesResult),
      submittedAt: submission.created_at,
      updatedAt: submission.updated_at,
      lines: linesResult,
      history: (historyResult.results ?? []).map((row) => ({
        status: row.new_status,
        changedAt: row.changed_at,
      })),
      correlationId,
    };
  }

  return Object.freeze({ catalog, submit, track });
}
