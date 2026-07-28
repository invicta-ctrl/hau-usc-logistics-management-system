import { ApiError } from './d1/operational-service.js';
import { loadLendingCatalog } from './lending-catalog-service.js';
import { USC_DEPARTMENT_NAMES } from '../domain/usc-departments.js';

const PUBLIC_ACTOR_ID = 'SYSTEM-PUBLIC-REQUEST';
const OWNER_COMMITTEE_ID = 'COM_INVENTORY_PANTRY';
export const USC_DEPARTMENTS = USC_DEPARTMENT_NAMES;
const encoder = new TextEncoder();
const PUBLIC_POLICY_VERSION = '2026-07-28';

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
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1 || result > 1000) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a positive whole number.`, {
      status: 422,
      details: { field },
    });
  }
  return result;
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

  async function rateLimit(networkKey) {
    const now = clock.now();
    const windowMs = 60 * 60 * 1000;
    const limiterKey = await hmac(trackingSecret, `SUBMIT:lending:${String(networkKey || 'untrusted')}`);
    const recent = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM public_lending_rate_limit_events
         WHERE limiter_key = ?1 AND action = 'SUBMIT' AND attempted_at > ?2`,
      )
      .bind(limiterKey, now - windowMs)
      .first();
    if (Number(recent?.count ?? 0) >= 10) {
      throw new ApiError('PUBLIC_RATE_LIMITED', 'Too many requests. Try again later.', { status: 429 });
    }
    await db.batch([
      db
        .prepare('DELETE FROM public_lending_rate_limit_events WHERE attempted_at <= ?1')
        .bind(now - 24 * windowMs),
      db
        .prepare(
          `INSERT INTO public_lending_rate_limit_events (id, limiter_key, action, attempted_at)
           VALUES (?1, ?2, 'SUBMIT', ?3)`,
        )
        .bind(createId('LRL'), limiterKey, now),
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

  async function normalizeLines(lines) {
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

  async function submit({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey);
    const clientRequestId = requiredText(command.clientRequestId, 'clientRequestId', 80);
    const existing = await db
      .prepare('SELECT id FROM public_lending_submissions WHERE client_request_id = ?1')
      .bind(clientRequestId)
      .first();
    if (existing) {
      return {
        ok: true,
        submissionId: existing.id,
        status: 'FOR_REVIEW',
        replayed: true,
        correlationId,
      };
    }
    requireAcknowledgment(
      command,
      'dataUseAcknowledged',
      'Privacy acknowledgment is required.',
    );
    requireAcknowledgment(
      command,
      'acceptableUseAcknowledged',
      'Acceptable Use acknowledgment is required.',
    );
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
    const courseYear =
      borrowerType === 'ANGELITE' ? requiredText(command.courseYear, 'courseYear', 80) : '';
    const academicDepartment =
      borrowerType === 'ANGELITE'
        ? requiredText(command.academicDepartment, 'academicDepartment', 120)
        : '';
    const uscDepartment =
      borrowerType === 'USC_STAFF' ? requiredText(command.uscDepartment, 'uscDepartment', 120) : '';
    if (borrowerType === 'USC_STAFF' && !USC_DEPARTMENTS.includes(uscDepartment)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved USC department or office.', {
        status: 422,
        details: { field: 'uscDepartment' },
      });
    }
    const positionRole =
      borrowerType === 'USC_STAFF' ? optionalText(command.positionRole, 120) : '';
    const contactNumber = phone(command.contactNumber);
    const borrowerEmail = email(command.email);
    const purpose = requiredText(command.purpose, 'purpose', 500);
    const pickupDate = dateOnly(command.pickupDate, 'pickupDate');
    const lines = await normalizeLines(command.lines);
    const dueDate = command.dueDate ? dateOnly(command.dueDate, 'dueDate') : '';
    const today = nowIso().slice(0, 10);
    if (
      pickupDate < today ||
      (dueDate && dueDate < pickupDate) ||
      (lines.some((line) => line.dueDateRequired) && !dueDate)
    ) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Pickup must be current or future and due date cannot precede pickup.',
        { status: 422, details: { field: pickupDate < today ? 'pickupDate' : 'dueDate' } },
      );
    }
    if (
      lines.some((line) => line.acknowledgmentRequired) &&
      command.responsibilityAcknowledged !== true
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Responsibility acknowledgment is required.', {
        status: 422,
        details: { field: 'responsibilityAcknowledged' },
      });
    }

    const submissionId = createId('LBR');
    const timestamp = nowIso();
    const receiptDigest = await hmac(
      trackingSecret,
      `lending-receipt:${submissionId}:${clientRequestId}:${timestamp}`,
    );
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
             ?14, ?15, ?16, ?14, ?14, ?17)`,
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
          timestamp,
          receiptDigest,
          clientRequestId,
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
        throw new ApiError('PUBLIC_LENDING_CONFLICT', 'This submission is already being processed.', {
          status: 409,
        });
      }
      throw error;
    }
    return {
      ok: true,
      submissionId,
      status: 'FOR_REVIEW',
      submittedAt: timestamp,
      replayed: false,
      correlationId,
    };
  }

  return Object.freeze({ catalog, submit });
}
