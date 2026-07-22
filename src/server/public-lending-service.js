import { ApiError } from './d1/operational-service.js';

const PUBLIC_ACTOR_ID = 'SYSTEM-PUBLIC-REQUEST';
const OWNER_COMMITTEE_ID = 'COM_INVENTORY_PANTRY';
const DEPARTMENTS = Object.freeze(['SEA', 'SBA', 'CCJEF', 'SAS', 'SED', 'SOC', 'SNAMS']);
const encoder = new TextEncoder();

const requiredText = (value, field, max) => {
  const result = String(value ?? '').trim().replace(/\s+/gu, ' ');
  if (!result || result.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, { status: 422, details: { field } });
  }
  return result;
};

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

async function rows(db, sql, values = []) {
  let statement = db.prepare(sql);
  if (values.length) statement = statement.bind(...values);
  return (await statement.all()).results ?? [];
}

function itemType(handling) {
  return /LOAN|REUSABLE/iu.test(String(handling ?? '')) ? 'REUSABLE' : 'CONSUMABLE';
}

export function createPublicLendingService({ db, trackingSecret, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (String(trackingSecret ?? '').length < 32) throw new Error('A protected tracking secret is required.');
  const nowIso = () => new Date(clock.now()).toISOString();
  const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

  async function rateLimit(networkKey, action) {
    const now = clock.now();
    const windowMs = 60 * 60 * 1000;
    const limit = action === 'SUBMIT' ? 10 : 60;
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
    const items = await rows(
      db,
      `SELECT item.id, item.name, item.category, item.unit, item.handling,
              item.default_loan_days, item.maximum_loan_quantity,
              balance.available_to_promise
       FROM inventory_items item
       JOIN inventory_balances balance ON balance.item_id = item.id
       WHERE item.status = 'ACTIVE' AND item.lending_audience = 'STUDENTS_AND_STAFF'
       ORDER BY item.name LIMIT 500`,
    );
    return {
      ok: true,
      departments: DEPARTMENTS,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        type: itemType(item.handling),
        availability: Number(item.available_to_promise) > 0 ? 'AVAILABLE' : 'CURRENTLY_UNAVAILABLE',
        maximumQuantity: Math.max(1, Number(item.maximum_loan_quantity ?? 1) || 1),
        defaultLoanDays: Math.max(0, Number(item.default_loan_days ?? 0) || 0),
      })),
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
      throw new ApiError('VALIDATION_FAILED', 'Select between 1 and 12 lending items.', { status: 422 });
    }
    const seen = new Set();
    const normalized = [];
    for (const [index, line] of lines.entries()) {
      const itemId = requiredText(line.itemId, `lines[${index}].itemId`, 80);
      if (seen.has(itemId)) {
        throw new ApiError('VALIDATION_FAILED', 'Each lending item may be selected once.', { status: 422 });
      }
      seen.add(itemId);
      const item = await db
        .prepare(
          `SELECT item.id, item.name, item.category, item.unit, item.handling,
                  item.maximum_loan_quantity, balance.available_to_promise
           FROM inventory_items item
           JOIN inventory_balances balance ON balance.item_id = item.id
           WHERE item.id = ?1 AND item.status = 'ACTIVE'
             AND item.lending_audience = 'STUDENTS_AND_STAFF'`,
        )
        .bind(itemId)
        .first();
      if (!item) throw new ApiError('PUBLIC_REFERENCE_UNAVAILABLE', 'A selected lending item is unavailable.', { status: 409 });
      const quantity = positiveInteger(line.quantity, `lines[${index}].quantity`);
      const maximum = Math.max(1, Number(item.maximum_loan_quantity ?? 1) || 1);
      if (quantity > maximum || quantity > Number(item.available_to_promise)) {
        throw new ApiError('LENDING_QUANTITY_UNAVAILABLE', 'A selected quantity is not currently available.', { status: 409 });
      }
      normalized.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        ticketType: itemType(item.handling) === 'REUSABLE' ? 'LOAN' : 'CONSUMABLE',
      });
    }
    return normalized;
  }

  async function submit({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey, 'SUBMIT');
    const clientRequestId = requiredText(command.clientRequestId, 'clientRequestId', 80);
    const existing = await db
      .prepare('SELECT id FROM public_lending_requests WHERE client_request_id = ?1')
      .bind(clientRequestId)
      .first();
    if (existing) {
      return {
        ok: true,
        ticketId: existing.id,
        status: 'FOR_REVIEW',
        trackingCode: await hmac(trackingSecret, `lending-code:${existing.id}:${clientRequestId}`),
        replayed: true,
        correlationId,
      };
    }
    const borrowerName = requiredText(command.borrowerName, 'borrowerName', 120);
    const studentId = requiredText(command.studentId, 'studentId', 8);
    if (!/^\d{1,8}$/u.test(studentId)) {
      throw new ApiError('VALIDATION_FAILED', 'Student ID must contain one to eight digits.', {
        status: 422,
        details: { field: 'studentId' },
      });
    }
    const courseYear = requiredText(command.courseYear, 'courseYear', 80);
    const department = requiredText(command.department, 'department', 12).toUpperCase();
    if (!DEPARTMENTS.includes(department)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved department.', { status: 422 });
    }
    const contactNumber = phone(command.contactNumber);
    const borrowerEmail = email(command.email);
    const purpose = requiredText(command.purpose, 'purpose', 500);
    const pickupDate = dateOnly(command.pickupDate, 'pickupDate');
    const dueDate = dateOnly(command.dueDate, 'dueDate');
    const today = nowIso().slice(0, 10);
    if (pickupDate < today || dueDate < pickupDate) {
      throw new ApiError('VALIDATION_FAILED', 'Pickup must be current or future and due date cannot precede pickup.', {
        status: 422,
        details: { field: dueDate < pickupDate ? 'dueDate' : 'pickupDate' },
      });
    }
    if (command.responsibilityAcknowledged !== true) {
      throw new ApiError('VALIDATION_FAILED', 'Responsibility acknowledgment is required.', {
        status: 422,
        details: { field: 'responsibilityAcknowledged' },
      });
    }
    const lines = await normalizeLines(command.lines);
    const publicId = createId('LBR');
    const trackingCode = await hmac(trackingSecret, `lending-code:${publicId}:${clientRequestId}`);
    const trackingDigest = await hmac(trackingSecret, `lending-digest:${trackingCode}`);
    const timestamp = nowIso();
    const statements = [
      db
        .prepare(
          `INSERT INTO public_lending_requests (
             id, tracking_digest, borrower_name, student_id, course_year, department,
             contact_number, email, purpose, requested_pickup_date, requested_due_date,
             responsibility_acknowledged_at, client_request_id, created_at, updated_at, created_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?12, ?12, ?14)`,
        )
        .bind(
          publicId,
          trackingDigest,
          borrowerName,
          studentId,
          courseYear,
          department,
          contactNumber,
          borrowerEmail,
          purpose,
          pickupDate,
          dueDate,
          timestamp,
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
               owner_committee_id, created_by, notes, created_at, updated_at
             ) VALUES (?1, ?2, ?3, 'PUBLIC_ANGELITE', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
               'FOR_REVIEW', ?12, ?13, 'Public responsibility acknowledgment recorded.', ?14, ?14)`,
          )
          .bind(
            ticketId,
            studentId,
            borrowerName,
            department,
            contactNumber,
            line.itemId,
            line.quantity,
            line.unit,
            purpose,
            line.ticketType === 'LOAN' ? dueDate : null,
            line.ticketType,
            OWNER_COMMITTEE_ID,
            PUBLIC_ACTOR_ID,
            timestamp,
          ),
        db
          .prepare(
            `INSERT INTO public_lending_request_tickets (public_lending_request_id, lending_ticket_id)
             VALUES (?1, ?2)`,
          )
          .bind(publicId, ticketId),
        db
          .prepare(
            `INSERT INTO status_history (
               id, entity_type, entity_id, new_status, changed_at, changed_by,
               reason, idempotency_key, metadata_json
             ) VALUES (?1, 'LENDING', ?2, 'FOR_REVIEW', ?3, ?4,
               'Public lending request submitted; no reservation or stock movement.', ?5, '{}')`,
          )
          .bind(createId('HIS'), ticketId, timestamp, PUBLIC_ACTOR_ID, `${clientRequestId}:${index + 1}`),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               after_json, correlation_id
             ) VALUES (?1, ?2, 'PUBLIC_LENDING_SUBMITTED', 'LENDING', ?3, ?4,
               ?5, ?6)`,
          )
          .bind(
            createId('AUD'),
            timestamp,
            ticketId,
            PUBLIC_ACTOR_ID,
            JSON.stringify({ publicRequestId: publicId, status: 'FOR_REVIEW' }),
            correlationId,
          ),
      );
    });
    statements.push(
      db.prepare("UPDATE data_revisions SET revision = revision + 1, updated_at = ?1 WHERE scope IN ('global', 'lending')").bind(timestamp),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
        throw new ApiError('PUBLIC_LENDING_CONFLICT', 'This submission is already being processed.', { status: 409 });
      }
      throw error;
    }
    return { ok: true, ticketId: publicId, status: 'FOR_REVIEW', trackingCode, replayed: false, correlationId };
  }

  async function track({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey, 'TRACK');
    const ticketId = requiredText(command.ticketId, 'ticketId', 80);
    const trackingCode = requiredText(command.trackingCode, 'trackingCode', 128);
    const digest = await hmac(trackingSecret, `lending-digest:${trackingCode}`);
    const request = await db
      .prepare(
        `SELECT id, requested_pickup_date, requested_due_date, created_at, updated_at
         FROM public_lending_requests WHERE id = ?1 AND tracking_digest = ?2`,
      )
      .bind(ticketId, digest)
      .first();
    if (!request) {
      throw new ApiError('PUBLIC_LENDING_NOT_FOUND', 'The lending ticket or tracking code is invalid.', { status: 404 });
    }
    const tickets = await rows(
      db,
      `SELECT ticket.id, item.name AS item_name, ticket.quantity, ticket.unit,
              ticket.ticket_type, ticket.status, ticket.created_at, ticket.updated_at
       FROM public_lending_request_tickets link
       JOIN lending_tickets ticket ON ticket.id = link.lending_ticket_id
       JOIN inventory_items item ON item.id = ticket.item_id
       WHERE link.public_lending_request_id = ?1
       ORDER BY ticket.created_at, ticket.id`,
      [ticketId],
    );
    const statuses = new Set(tickets.map((ticket) => ticket.status));
    return {
      ok: true,
      correlationId,
      request: {
        id: request.id,
        status: statuses.size === 1 ? tickets[0]?.status ?? 'FOR_REVIEW' : 'IN_PROGRESS',
        pickupDate: request.requested_pickup_date,
        dueDate: request.requested_due_date,
        createdAt: request.created_at,
        updatedAt: tickets.reduce(
          (latest, ticket) => (ticket.updated_at > latest ? ticket.updated_at : latest),
          request.updated_at,
        ),
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          itemName: ticket.item_name,
          quantity: Number(ticket.quantity),
          unit: ticket.unit,
          type: ticket.ticket_type,
          status: ticket.status,
        })),
      },
    };
  }

  return Object.freeze({ catalog, submit, track });
}
