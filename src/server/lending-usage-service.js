import { accountAuthorization } from './auth/contracts.js';
import { ApiError } from './d1/operational-service.js';

const ALLOWED_ROLES = new Set(['DIRECTOR', 'ADMINISTRATOR']);
const INVENTORY_COMMITTEE_ID = 'COM_INVENTORY_PANTRY';

const optionalText = (value, max = 120) =>
  String(value ?? '')
    .trim()
    .slice(0, max);

function assertAuthorized(account) {
  const authorization = accountAuthorization(account);
  const inventoryScoped = authorization.committeeIds.includes(INVENTORY_COMMITTEE_ID);
  if (
    !authorization.capabilities.includes('lending.usage.view') ||
    (!ALLOWED_ROLES.has(authorization.roleId) && !inventoryScoped)
  ) {
    throw new ApiError('AUTHORIZATION_DENIED', 'Lending Usage is restricted to authorized roles.', {
      status: 403,
    });
  }
  return authorization;
}

function dateFilter(value, field) {
  const result = optionalText(value, 10);
  if (result && !/^\d{4}-\d{2}-\d{2}$/u.test(result)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be YYYY-MM-DD.`, {
      status: 422,
      details: { field },
    });
  }
  return result;
}

function filters(command = {}) {
  return {
    from: dateFilter(command.from, 'from'),
    to: dateFilter(command.to, 'to'),
    department: optionalText(command.department),
    staff: optionalText(command.staff),
    itemId: optionalText(command.itemId, 80),
  };
}

function whereClause(filter) {
  return {
    sql: `WHERE (?1 = '' OR date(ticket.created_at) >= ?1)
      AND (?2 = '' OR date(ticket.created_at) <= ?2)
      AND (?3 = '' OR COALESCE(submission.usc_department, ticket.department_organization) = ?3)
      AND (?4 = '' OR lower(ticket.borrower_name) LIKE '%' || lower(?4) || '%')
      AND (?5 = '' OR ticket.item_id = ?5)`,
    bind: [filter.from, filter.to, filter.department, filter.staff, filter.itemId],
  };
}

async function queryRows(statement) {
  const result = await statement.all();
  return result.results ?? [];
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createLendingUsageService({ db } = {}) {
  if (!db) throw new Error('D1 database binding is required.');

  async function report({ account, command = {}, correlationId = '' } = {}) {
    assertAuthorized(account);
    const filter = filters(command);
    const where = whereClause(filter);
    const source = `FROM lending_tickets ticket
      LEFT JOIN public_lending_submission_tickets link
        ON link.lending_ticket_id = ticket.id
      LEFT JOIN public_lending_submissions submission
        ON submission.id = link.public_lending_submission_id
      JOIN inventory_items item ON item.id = ticket.item_id`;
    const activity = await queryRows(
      db
        .prepare(
          `SELECT
             ticket.borrower_name AS staff_name,
             COALESCE(NULLIF(submission.usc_department, ''), ticket.department_organization) AS department,
             COUNT(DISTINCT COALESCE(link.public_lending_submission_id, ticket.id)) AS request_count,
             SUM(CASE WHEN ticket.ticket_type = 'CONSUMABLE' THEN 1 ELSE 0 END) AS consumable_requests,
             SUM(CASE WHEN ticket.ticket_type = 'CONSUMABLE'
               THEN COALESCE(ticket.quantity, 0) ELSE 0 END) AS consumable_quantity,
             SUM(CASE WHEN ticket.ticket_type = 'LOAN'
               AND ticket.status IN ('READY_TO_CLAIM', 'ON_LOAN', 'RETURNED')
               THEN COALESCE(ticket.quantity, 0) ELSE 0 END) AS reusable_borrowed,
             SUM(CASE WHEN ticket.ticket_type = 'LOAN' AND ticket.status = 'ON_LOAN'
               THEN COALESCE(ticket.quantity, 0) ELSE 0 END) AS reusable_outstanding,
             SUM(CASE WHEN ticket.ticket_type = 'LOAN' AND ticket.status = 'ON_LOAN'
               AND ticket.due_at IS NOT NULL AND datetime(ticket.due_at) < datetime('now')
               THEN COALESCE(ticket.quantity, 0) ELSE 0 END) AS reusable_overdue,
             MIN(ticket.created_at) AS first_request_at,
             MAX(ticket.created_at) AS latest_request_at
           ${source}
           ${where.sql}
           GROUP BY ticket.borrower_name,
             COALESCE(NULLIF(submission.usc_department, ''), ticket.department_organization)
           ORDER BY request_count DESC, latest_request_at DESC, staff_name
           LIMIT 500`,
        )
        .bind(...where.bind),
    );
    const frequentItems = await queryRows(
      db
        .prepare(
          `SELECT ticket.item_id AS item_id, item.name AS item_name, item.lending_kind AS item_type,
             COUNT(*) AS request_count,
             SUM(COALESCE(ticket.quantity, 0)) AS quantity
           ${source}
           ${where.sql}
           GROUP BY ticket.item_id, item.name, item.lending_kind
           ORDER BY request_count DESC, quantity DESC, item.name
           LIMIT 25`,
        )
        .bind(...where.bind),
    );
    const [departments, staff, items] = await Promise.all([
      queryRows(
        db.prepare(
          `SELECT DISTINCT COALESCE(NULLIF(submission.usc_department, ''), ticket.department_organization) AS value
           ${source}
           WHERE COALESCE(NULLIF(submission.usc_department, ''), ticket.department_organization) <> ''
           ORDER BY value`,
        ),
      ),
      queryRows(
        db.prepare(
          `SELECT DISTINCT ticket.borrower_name AS value
           ${source} WHERE ticket.borrower_name <> '' ORDER BY value`,
        ),
      ),
      queryRows(
        db.prepare(
          `SELECT DISTINCT ticket.item_id AS id, item.name
           ${source} ORDER BY item.name, ticket.item_id`,
        ),
      ),
    ]);
    return {
      ok: true,
      correlationId,
      generatedAt: new Date().toISOString(),
      filters: filter,
      options: {
        departments: departments.map((row) => row.value),
        staff: staff.map((row) => row.value),
        items,
      },
      activity,
      frequentItems,
    };
  }

  async function csv(context) {
    const result = await report(context);
    const header = [
      'Staff or officer',
      'Department',
      'Request count',
      'Consumable requests',
      'Consumable quantity',
      'Reusable borrowed',
      'Reusable outstanding',
      'Reusable overdue',
      'First request',
      'Latest request',
    ];
    const rows = result.activity.map((row) => [
      row.staff_name,
      row.department,
      row.request_count,
      row.consumable_requests,
      row.consumable_quantity,
      row.reusable_borrowed,
      row.reusable_outstanding,
      row.reusable_overdue,
      row.first_request_at,
      row.latest_request_at,
    ]);
    return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  }

  return Object.freeze({ report, csv });
}
