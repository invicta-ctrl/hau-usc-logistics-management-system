const EVENT_TYPES = new Set(['ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT']);
const ACTION_CODES = new Set([
  'ACCESS_ID_CHANGED',
  'STARTER_ACCOUNT_CREATED',
  'ACCOUNT_STATUS_CHANGED',
  'ACCOUNT_APPLICATION_ACTIVATED',
  'LINK_CREATED',
  'LINK_STATE_CHANGED',
  'ASSIGNMENT_CREATED',
  'ASSIGNMENT_STATE_CHANGED',
  'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED',
]);

const DEFAULT_PAGE_SIZE = 25;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

export class StaffAccountActivityHistoryError extends Error {
  constructor(code) {
    super('The staff account activity history request is invalid.');
    this.name = 'StaffAccountActivityHistoryError';
    this.code = code;
    this.status = 400;
  }
}

function invalid(code) {
  throw new StaffAccountActivityHistoryError(code);
}

function requiredPersonId(value) {
  if (typeof value !== 'string') invalid('STAFF_ACCOUNT_ACTIVITY_HISTORY_PERSON_ID_INVALID');
  const personId = value.trim();
  if (!personId || personId.length > 128) invalid('STAFF_ACCOUNT_ACTIVITY_HISTORY_PERSON_ID_INVALID');
  return personId;
}

function optionalQuery(value) {
  if (value == null) return null;
  if (typeof value !== 'string') invalid('STAFF_ACCOUNT_ACTIVITY_HISTORY_QUERY_INVALID');
  const query = value.trim();
  if (!query || query.length > 120) invalid('STAFF_ACCOUNT_ACTIVITY_HISTORY_QUERY_INVALID');
  return query;
}

function optionalEnum(value, allowed, code) {
  if (value == null) return null;
  if (typeof value !== 'string' || !allowed.has(value)) invalid(code);
  return value;
}

function page(value) {
  if (value == null) return 1;
  if (!Number.isInteger(value) || value < 1) invalid('STAFF_ACCOUNT_ACTIVITY_HISTORY_PAGE_INVALID');
  return value;
}

function pageSize(value) {
  if (!Number.isInteger(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, value));
}

function safeItem(row) {
  return {
    id: row?.event_id ?? row?.id ?? null,
    occurredAt: row?.occurred_at ?? row?.occurredAt ?? null,
    eventType: row?.event_type ?? row?.eventType ?? null,
    actionCode: row?.action_code ?? row?.actionCode ?? null,
    accountId: row?.account_id ?? row?.accountId ?? null,
    accountAccessIdSnapshot: row?.account_access_id_snapshot ?? row?.accountAccessIdSnapshot ?? null,
    correlationId: row?.correlation_id ?? row?.correlationId ?? null,
    linkState: row?.link_state ?? row?.linkState ?? null,
    previousLinkState: row?.previous_link_state ?? row?.previousLinkState ?? null,
    assignmentState: row?.assignment_state ?? row?.assignmentState ?? null,
    previousAssignmentState: row?.previous_assignment_state ?? row?.previousAssignmentState ?? null,
    oldEffectiveFrom: row?.old_effective_from ?? row?.oldEffectiveFrom ?? null,
    oldEffectiveTo: row?.old_effective_to ?? row?.oldEffectiveTo ?? null,
    newEffectiveFrom: row?.new_effective_from ?? row?.newEffectiveFrom ?? null,
    newEffectiveTo: row?.new_effective_to ?? row?.newEffectiveTo ?? null,
  };
}

function count(value) {
  return Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
}

export function createStaffAccountActivityHistoryService({ repository } = {}) {
  if (!repository || typeof repository.listStaffAccountActivityHistory !== 'function') {
    throw new TypeError('A staff account activity history repository is required.');
  }

  return Object.freeze({
    async list(command = {}) {
      const normalized = {
        personId: requiredPersonId(command?.personId),
        query: optionalQuery(command?.query),
        eventType: optionalEnum(
          command?.eventType,
          EVENT_TYPES,
          'STAFF_ACCOUNT_ACTIVITY_HISTORY_EVENT_TYPE_INVALID',
        ),
        actionCode: optionalEnum(
          command?.actionCode,
          ACTION_CODES,
          'STAFF_ACCOUNT_ACTIVITY_HISTORY_ACTION_CODE_INVALID',
        ),
        page: page(command?.page),
        pageSize: pageSize(command?.pageSize),
      };
      const result = await repository.listStaffAccountActivityHistory(normalized);
      const total = count(result?.total);
      return {
        personId: normalized.personId,
        historyStartsAt: result?.historyStartsAt ?? null,
        page: normalized.page,
        pageSize: normalized.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / normalized.pageSize),
        items: (Array.isArray(result?.items) ? result.items : []).map(safeItem),
      };
    },
  });
}
