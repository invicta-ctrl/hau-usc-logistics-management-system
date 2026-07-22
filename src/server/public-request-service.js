import { ApiError } from './d1/operational-service.js';

const PUBLIC_ACTOR_ID = 'SYSTEM-PUBLIC-REQUEST';
const CATEGORIES = Object.freeze([
  'Inventory Item',
  'Food',
  'Materials',
  'Venue / Facility',
  'Logistics / Equipment',
  'Other',
]);
const encoder = new TextEncoder();

const requiredText = (value, field, max) => {
  const result = String(value ?? '').trim().replace(/\s+/gu, ' ');
  if (!result || result.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, { status: 422, details: { field } });
  }
  return result;
};

const optionalText = (value, max) => String(value ?? '').trim().slice(0, max);

const positiveNumber = (value, field) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0 || result > 100000) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be greater than zero.`, {
      status: 422,
      details: { field },
    });
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

function dateOnly(value, field, { required = false } = {}) {
  const result = optionalText(value, 10);
  if (!result && !required) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(result) || Number.isNaN(new Date(`${result}T00:00:00Z`).getTime())) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a valid date.`, {
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

function parseReference(row) {
  try {
    const payload = JSON.parse(row.payload_json);
    if (payload.requestability !== 'REQUESTABLE') return null;
    return {
      id: row.stable_id,
      group: row.domain === 'VENUES' ? 'Venues / Facilities' : 'Equipment',
      name: String(payload.displayName ?? row.stable_id),
      category: String(payload.category ?? ''),
      unit: String(payload.unit ?? 'service'),
    };
  } catch {
    return null;
  }
}

async function rows(db, sql, values = []) {
  let statement = db.prepare(sql);
  if (values.length) statement = statement.bind(...values);
  return (await statement.all()).results ?? [];
}

export function createPublicRequestService({ db, trackingSecret, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (String(trackingSecret ?? '').length < 32) throw new Error('A protected tracking secret is required.');
  const nowIso = () => new Date(clock.now()).toISOString();
  const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

  async function rateLimit(networkKey, action) {
    const now = clock.now();
    const windowMs = 60 * 60 * 1000;
    const limit = action === 'SUBMIT' ? 10 : 60;
    const limiterKey = await hmac(trackingSecret, `${action}:${String(networkKey || 'untrusted')}`);
    const recent = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM public_request_rate_limit_events
         WHERE limiter_key = ?1 AND action = ?2 AND attempted_at > ?3`,
      )
      .bind(limiterKey, action, now - windowMs)
      .first();
    if (Number(recent?.count ?? 0) >= limit) {
      throw new ApiError('PUBLIC_RATE_LIMITED', 'Too many requests. Try again later.', { status: 429 });
    }
    await db.batch([
      db
        .prepare('DELETE FROM public_request_rate_limit_events WHERE attempted_at <= ?1')
        .bind(now - 24 * windowMs),
      db
        .prepare(
          `INSERT INTO public_request_rate_limit_events (id, limiter_key, action, attempted_at)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(createId('PRL'), limiterKey, action, now),
    ]);
  }

  async function options() {
    const [items, events, references] = await Promise.all([
      rows(
        db,
        `SELECT id, name, category, unit FROM inventory_items
         WHERE status = 'ACTIVE' ORDER BY name LIMIT 500`,
      ),
      rows(
        db,
        `SELECT id, event_series_id, name, starts_at, ends_at, status FROM events
         WHERE active = 1 AND status NOT IN ('COMPLETED', 'CANCELLED')
         ORDER BY starts_at LIMIT 200`,
      ),
      rows(
        db,
        `SELECT domain, stable_id, payload_json FROM reference_records
         WHERE domain IN ('VENUES', 'EQUIPMENT') AND status = 'ACTIVE' AND archived_at IS NULL
         ORDER BY domain, stable_id LIMIT 500`,
      ),
    ]);
    return {
      ok: true,
      categories: CATEGORIES,
      items: items.map((item) => ({ id: item.id, name: item.name, category: item.category, unit: item.unit })),
      events: events.map((event) => ({
        id: event.id,
        seriesId: event.event_series_id,
        name: event.name,
        startAt: event.starts_at,
        endAt: event.ends_at,
        status: event.status,
      })),
      references: references.map(parseReference).filter(Boolean),
    };
  }

  async function normalizeLines(lines) {
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 50) {
      throw new ApiError('VALIDATION_FAILED', 'Add between 1 and 50 requested items.', { status: 422 });
    }
    const normalized = [];
    for (const [index, source] of lines.entries()) {
      const category = requiredText(source.category, `lines[${index}].category`, 40);
      if (!CATEGORIES.includes(category)) {
        throw new ApiError('VALIDATION_FAILED', `lines[${index}].category is invalid.`, { status: 422 });
      }
      const quantity = positiveNumber(source.quantity, `lines[${index}].quantity`);
      if (category === 'Inventory Item') {
        const item = await db
          .prepare("SELECT id, name, category, unit FROM inventory_items WHERE id = ?1 AND status = 'ACTIVE'")
          .bind(requiredText(source.itemId, `lines[${index}].itemId`, 80))
          .first();
        if (!item) throw new ApiError('PUBLIC_REFERENCE_UNAVAILABLE', 'A selected item is unavailable.', { status: 409 });
        normalized.push({
          itemId: item.id,
          description: item.name,
          specification: optionalText(source.specification, 1000),
          category,
          quantity,
          unit: item.unit,
        });
        continue;
      }
      if (['Venue / Facility', 'Logistics / Equipment'].includes(category) && source.referenceId) {
        const domain = category === 'Venue / Facility' ? 'VENUES' : 'EQUIPMENT';
        const reference = await db
          .prepare(
            `SELECT domain, stable_id, payload_json FROM reference_records
             WHERE domain = ?1 AND stable_id = ?2 AND status = 'ACTIVE' AND archived_at IS NULL
             ORDER BY revision DESC LIMIT 1`,
          )
          .bind(domain, requiredText(source.referenceId, `lines[${index}].referenceId`, 100))
          .first();
        const safeReference = reference ? parseReference(reference) : null;
        if (!safeReference) {
          throw new ApiError('PUBLIC_REFERENCE_UNAVAILABLE', 'A selected reference is unavailable.', { status: 409 });
        }
        normalized.push({
          itemId: null,
          description: safeReference.name,
          specification: optionalText(source.specification, 1000),
          category,
          quantity,
          unit: safeReference.unit,
        });
        continue;
      }
      normalized.push({
        itemId: null,
        description: requiredText(source.description, `lines[${index}].description`, 240),
        specification: optionalText(source.specification, 1000),
        category,
        quantity,
        unit: requiredText(source.unit, `lines[${index}].unit`, 40),
      });
    }
    return normalized;
  }

  async function submit({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey, 'SUBMIT');
    const clientRequestId = requiredText(command.clientRequestId, 'clientRequestId', 80);
    const existing = await db
      .prepare(
        `SELECT id, status FROM requests
         WHERE created_by = ?1 AND client_request_id = ?2 LIMIT 1`,
      )
      .bind(PUBLIC_ACTOR_ID, clientRequestId)
      .first();
    if (existing) {
      return {
        ok: true,
        requestId: existing.id,
        status: existing.status,
        trackingCode: await hmac(trackingSecret, `request-code:${existing.id}:${clientRequestId}`),
        replayed: true,
        correlationId,
      };
    }
    const requesterName = requiredText(command.requesterName, 'requesterName', 120);
    const organization = requiredText(command.organization, 'organization', 120);
    const requesterEmail = email(command.email);
    const contactNumber = phone(command.contactNumber);
    const purpose = requiredText(command.purpose, 'purpose', 500);
    const startDate = dateOnly(command.startDate, 'startDate');
    const endDate = dateOnly(command.endDate, 'endDate');
    if (startDate && endDate && endDate < startDate) {
      throw new ApiError('VALIDATION_FAILED', 'endDate cannot be before startDate.', {
        status: 422,
        details: { field: 'endDate' },
      });
    }
    const eventId = optionalText(command.eventId, 80);
    if (eventId) {
      const event = await db
        .prepare("SELECT id FROM events WHERE id = ?1 AND active = 1 AND status NOT IN ('COMPLETED', 'CANCELLED')")
        .bind(eventId)
        .first();
      if (!event) throw new ApiError('PUBLIC_REFERENCE_UNAVAILABLE', 'The selected event is unavailable.', { status: 409 });
    }
    const lines = await normalizeLines(command.lines);
    const requestId = createId('REQ');
    const trackingCode = await hmac(trackingSecret, `request-code:${requestId}:${clientRequestId}`);
    const trackingDigest = await hmac(trackingSecret, `request-digest:${trackingCode}`);
    const timestamp = nowIso();
    const statements = [
      db
        .prepare(
          `INSERT INTO requests (
             id, request_type, request_stage, event_id, requester_name, requester_email,
             department, priority, purpose, status, client_request_id, created_at, updated_at, created_by
           ) VALUES (?1, 'PUBLIC_LOGISTICS', 'REVIEW', ?2, ?3, ?4, ?5, 'NORMAL', ?6,
             'FOR_REVIEW', ?7, ?8, ?8, ?9)`,
        )
        .bind(
          requestId,
          eventId || null,
          requesterName,
          requesterEmail,
          organization,
          purpose,
          clientRequestId,
          timestamp,
          PUBLIC_ACTOR_ID,
        ),
      db
        .prepare(
          `INSERT INTO public_request_access (
             request_id, tracking_digest, contact_number, requested_start_date, requested_end_date, created_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(requestId, trackingDigest, contactNumber, startDate || null, endDate || null, timestamp),
    ];
    lines.forEach((line, index) => {
      statements.push(
        db
          .prepare(
            `INSERT INTO request_lines (
               id, request_id, event_id, item_id, description, specification, category,
               requested_quantity, unit, fulfillment_source, status, client_line_id,
               created_at, updated_at, created_by
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
               'PENDING_REVIEW', 'FOR_REVIEW', ?10, ?11, ?11, ?12)`,
          )
          .bind(
            createId('LIN'),
            requestId,
            eventId || null,
            line.itemId,
            line.description,
            line.specification,
            line.category,
            line.quantity,
            line.unit,
            `public-line-${index + 1}`,
            timestamp,
            PUBLIC_ACTOR_ID,
          ),
      );
    });
    statements.push(
      db
        .prepare(
          `INSERT INTO status_history (
             id, entity_type, entity_id, new_status, changed_at, changed_by,
             reason, request_id, idempotency_key, metadata_json
           ) VALUES (?1, 'REQUEST', ?2, 'FOR_REVIEW', ?3, ?4,
             'Public request submitted; no stock movement.', ?2, ?5, '{}')`,
        )
        .bind(createId('HIS'), requestId, timestamp, PUBLIC_ACTOR_ID, clientRequestId),
      db
        .prepare(
          `INSERT INTO audit_log (
             id, created_at, action, entity_type, entity_id, actor_account_id,
             request_id, after_json, correlation_id
           ) VALUES (?1, ?2, 'PUBLIC_REQUEST_SUBMITTED', 'REQUEST', ?3, ?4,
             ?3, ?5, ?6)`,
        )
        .bind(
          createId('AUD'),
          timestamp,
          requestId,
          PUBLIC_ACTOR_ID,
          JSON.stringify({ status: 'FOR_REVIEW', lineCount: lines.length }),
          correlationId,
        ),
      db.prepare("UPDATE data_revisions SET revision = revision + 1, updated_at = ?1 WHERE scope IN ('global', 'request')").bind(timestamp),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
        throw new ApiError('PUBLIC_REQUEST_CONFLICT', 'This submission is already being processed.', { status: 409 });
      }
      throw error;
    }
    return { ok: true, requestId, status: 'FOR_REVIEW', trackingCode, replayed: false, correlationId };
  }

  async function track({ command = {}, networkKey = '', correlationId = '' } = {}) {
    await rateLimit(networkKey, 'TRACK');
    const requestId = requiredText(command.requestId, 'requestId', 80);
    const trackingCode = requiredText(command.trackingCode, 'trackingCode', 128);
    const digest = await hmac(trackingSecret, `request-digest:${trackingCode}`);
    const access = await db
      .prepare(
        `SELECT request.id, request.status, request.created_at, request.updated_at
         FROM public_request_access access
         JOIN requests request ON request.id = access.request_id
         WHERE access.request_id = ?1 AND access.tracking_digest = ?2`,
      )
      .bind(requestId, digest)
      .first();
    if (!access) {
      throw new ApiError('PUBLIC_REQUEST_NOT_FOUND', 'The request or tracking code is invalid.', { status: 404 });
    }
    const [lines, history] = await Promise.all([
      rows(
        db,
        `SELECT description, category, requested_quantity, unit, status
         FROM request_lines WHERE request_id = ?1 ORDER BY created_at, id`,
        [requestId],
      ),
      rows(
        db,
        `SELECT new_status, changed_at FROM status_history
         WHERE entity_type = 'REQUEST' AND entity_id = ?1 ORDER BY changed_at`,
        [requestId],
      ),
    ]);
    return {
      ok: true,
      correlationId,
      request: {
        id: access.id,
        status: access.status,
        createdAt: access.created_at,
        updatedAt: access.updated_at,
        lines: lines.map((line) => ({
          description: line.description,
          category: line.category,
          quantity: Number(line.requested_quantity),
          unit: line.unit,
          status: line.status,
        })),
        history: history.map((entry) => ({ status: entry.new_status, at: entry.changed_at })),
      },
    };
  }

  return Object.freeze({ options, submit, track });
}
