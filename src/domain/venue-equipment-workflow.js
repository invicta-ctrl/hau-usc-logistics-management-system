import { AppError } from '../app/errors.js';

export const VENUE_EQUIPMENT_REFERENCE_TYPES = Object.freeze(['VENUE', 'EQUIPMENT']);
export const VENUE_EQUIPMENT_CATEGORIES = Object.freeze([
  'MEETING_SPACE',
  'EVENT_SPACE',
  'AUDIO_VISUAL',
  'FURNITURE',
  'LOGISTICS_SUPPORT',
  'OTHER_CONTROLLED',
]);
export const VENUE_EQUIPMENT_UNITS = Object.freeze(['service', 'piece', 'set', 'unit']);
export const VENUE_EQUIPMENT_CONFIRMATION_STATUSES = Object.freeze([
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'DECLINED',
]);
export const VENUE_EQUIPMENT_TRIAGE_STATUSES = Object.freeze([
  'NOT_REQUIRED',
  'PENDING_CLASSIFICATION',
  'APPROVED_AS_SPECIFIED',
]);
export const VENUE_EQUIPMENT_BLOCKER_STATUSES = Object.freeze(['NONE', 'BLOCKED']);
export const VENUE_EQUIPMENT_RETURN_STATUSES = Object.freeze([
  'NOT_REQUIRED',
  'PENDING_RETURN',
  'RETURNED',
]);
export const VENUE_EQUIPMENT_ATTENTION_FLAGS = Object.freeze({
  CONFIRMATION_PENDING: 'VENUE_EQUIPMENT_CONFIRMATION_PENDING',
  OTHER_TRIAGE_PENDING: 'VENUE_EQUIPMENT_OTHER_TRIAGE_PENDING',
  BLOCKED: 'VENUE_EQUIPMENT_BLOCKED',
  RETURN_PENDING: 'VENUE_EQUIPMENT_RETURN_PENDING',
  EVIDENCE_MISSING: 'VENUE_EQUIPMENT_EVIDENCE_MISSING',
  LEAD_TIME_SHORT: 'VENUE_EQUIPMENT_LEAD_TIME_SHORT',
});

const ALLOWED_OWNER_COMMITTEES = new Set([
  'COM_FOOD',
  'COM_INVENTORY_PANTRY',
  'COM_MATERIALS',
]);

function validation(message, field) {
  throw new AppError('VALIDATION_ERROR', message, {
    fieldErrors: field ? { [field]: message } : undefined,
  });
}

function boundedText(value, field, { required = false, max = 240 } = {}) {
  const normalized = String(value ?? '').trim();
  if (required && !normalized) validation(`${field} is required.`, field);
  if (normalized.length > max) validation(`${field} must be ${max} characters or fewer.`, field);
  return normalized;
}

function controlled(value, allowed, field, { lower = false } = {}) {
  const normalized = String(value ?? '').trim()[lower ? 'toLowerCase' : 'toUpperCase']();
  if (!allowed.includes(normalized)) validation(`${field} is not supported.`, field);
  return normalized;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) validation(`${field} must be a positive integer.`, field);
  return number;
}

function isoDateTime(value, field, { required = false } = {}) {
  const normalized = boundedText(value, field, { required, max: 80 });
  if (!normalized) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) || !Number.isFinite(Date.parse(normalized)))
    validation(`${field} must be a valid ISO date-time.`, field);
  return normalized;
}

function dateOnly(value, field) {
  const normalized = boundedText(value, field, { max: 10 });
  if (!normalized) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || !Number.isFinite(Date.parse(`${normalized}T00:00:00Z`)))
    validation(`${field} must be a valid ISO date.`, field);
  return normalized;
}

function activeAt(record, at) {
  const date = String(at || '').slice(0, 10);
  const from = dateOnly(record.effectiveFrom, 'effectiveFrom');
  const to = dateOnly(record.effectiveTo, 'effectiveTo');
  return (!from || date >= from) && (!to || date <= to);
}

function normalizedSearch(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function requireRoute(route, { at, referenceType, category, referenceId = '' }) {
  if (!route)
    throw new AppError('VENUE_EQUIPMENT_ROUTE_NOT_FOUND', 'No approved route exists for this reference.');
  const status = String(route.status ?? '').trim().toUpperCase();
  if (status !== 'ACTIVE' || !activeAt(route, at))
    throw new AppError('VENUE_EQUIPMENT_ROUTE_INACTIVE', 'The approved route is not active or effective.');
  const ownerCommitteeId = boundedText(route.ownerCommitteeId, 'route.ownerCommitteeId', {
    required: true,
    max: 80,
  });
  if (!ALLOWED_OWNER_COMMITTEES.has(ownerCommitteeId))
    throw new AppError(
      'VENUE_EQUIPMENT_ROUTE_SCOPE_INVALID',
      'Venue and Equipment routing must target an approved existing committee.',
    );
  const matchKind = controlled(route.matchKind, ['REFERENCE', 'CATEGORY', 'OTHER'], 'route.matchKind');
  if (matchKind === 'REFERENCE' && String(route.referenceId || '') !== String(referenceId))
    throw new AppError('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The reference route does not match the selected reference.');
  if (
    matchKind === 'CATEGORY' &&
    (String(route.referenceType || '').toUpperCase() !== referenceType ||
      String(route.category || '').toUpperCase() !== category)
  )
    throw new AppError('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The category route does not match the selected reference.');
  if (matchKind === 'OTHER' && category !== 'OTHER_CONTROLLED')
    throw new AppError('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The Other route is limited to controlled Other lines.');
  return {
    routeId: boundedText(route.id, 'route.id', { required: true, max: 100 }),
    routeRevision: positiveInteger(route.revision, 'route.revision'),
    matchKind,
    ownerCommitteeId,
    ownerUserId: boundedText(route.ownerUserId, 'route.ownerUserId', { max: 100 }),
    responsibleOfficeId: boundedText(route.responsibleOfficeId, 'route.responsibleOfficeId', {
      required: true,
      max: 100,
    }),
    approvingAuthorityId: boundedText(route.approvingAuthorityId, 'route.approvingAuthorityId', {
      required: true,
      max: 100,
    }),
    leadTimeBusinessDays: positiveInteger(route.leadTimeBusinessDays, 'route.leadTimeBusinessDays'),
    instructions: boundedText(route.instructions, 'route.instructions', { required: true, max: 500 }),
    effectiveFrom: dateOnly(route.effectiveFrom, 'route.effectiveFrom'),
    effectiveTo: dateOnly(route.effectiveTo, 'route.effectiveTo'),
  };
}

function referenceSnapshot(line, context, existingSnapshot = null) {
  const referenceId = boundedText(line.referenceId, 'line.referenceId', { max: 100 });
  if (!referenceId) return null;
  const reference = context.resolveVenueEquipmentReference?.(referenceId, context.submittedAt);
  if (!reference)
    throw new AppError('VENUE_EQUIPMENT_REFERENCE_NOT_FOUND', 'The selected reference was not found.');
  if (String(reference.status ?? '').trim().toUpperCase() !== 'ACTIVE' || !activeAt(reference, context.submittedAt))
    throw new AppError('VENUE_EQUIPMENT_REFERENCE_INACTIVE', 'The selected reference is not active or effective.');
  if (String(reference.requestability ?? '').trim().toUpperCase() !== 'REQUESTABLE')
    throw new AppError(
      'VENUE_EQUIPMENT_NOT_REQUESTABLE',
      'The selected reference is not currently requestable. This is not a booking availability result.',
    );
  const referenceType = controlled(
    reference.type,
    VENUE_EQUIPMENT_REFERENCE_TYPES,
    'reference.type',
  );
  const category = controlled(reference.category, VENUE_EQUIPMENT_CATEGORIES, 'reference.category');
  const name = boundedText(reference.name, 'reference.name', { required: true });
  const unit = controlled(reference.unit, VENUE_EQUIPMENT_UNITS, 'reference.unit', { lower: true });
  const revision = positiveInteger(reference.revision, 'reference.revision');
  if (line.referenceRevision != null && Number(line.referenceRevision) !== revision)
    throw new AppError(
      'VENUE_EQUIPMENT_REFERENCE_REVISION_CONFLICT',
      'The selected reference changed; refresh before submitting.',
      { retryable: true },
    );
  if (line.label.toLowerCase() !== name.toLowerCase())
    throw new AppError('VENUE_EQUIPMENT_REFERENCE_NAME_MISMATCH', 'Use the current canonical reference name.');
  if (line.unit !== unit)
    throw new AppError('VENUE_EQUIPMENT_UNIT_MISMATCH', `The selected reference requires unit ${unit}.`);
  if (line.category !== category)
    throw new AppError('VENUE_EQUIPMENT_CATEGORY_MISMATCH', 'The selected reference category changed.');
  const route = requireRoute(context.resolveVenueEquipmentRoute?.(reference.routeId, context.submittedAt), {
    at: context.submittedAt,
    referenceType,
    category,
    referenceId,
  });
  const preserved =
    existingSnapshot &&
    existingSnapshot.referenceId === referenceId &&
    Number(existingSnapshot.referenceRevision) === revision &&
    existingSnapshot.routeId === route.routeId &&
    Number(existingSnapshot.routeRevision) === route.routeRevision
      ? existingSnapshot
      : null;
  return {
    referenceId,
    referenceRevision: revision,
    referenceType,
    category,
    name,
    aliases: [...new Set((reference.aliases ?? []).map((alias) => boundedText(alias, 'reference.alias', { max: 120 })))],
    location: boundedText(reference.location, 'reference.location', { max: 160 }),
    unit,
    requestedQuantity: Number(line.quantity),
    requestability: 'REQUESTABLE',
    requestabilityLabel: 'Requestable — confirmation required; not a booking guarantee',
    returnRequired: referenceType === 'EQUIPMENT' && reference.returnRequired === true,
    contactRole: preserved?.contactRole ?? boundedText(reference.contactRole, 'reference.contactRole', { max: 120 }),
    sourceRevision:
      preserved?.sourceRevision ?? boundedText(reference.sourceRevision, 'reference.sourceRevision', { max: 120 }),
    ...route,
  };
}

function otherSnapshot(line, context) {
  if (line.category !== 'OTHER_CONTROLLED')
    throw new AppError(
      'VENUE_EQUIPMENT_REFERENCE_REQUIRED',
      'Select an approved reference or use constrained Other.',
    );
  if (line.label.length < 5 || normalizedSearch(line.label) === 'other')
    validation('Other requires a specific description.', 'line.label');
  const route = requireRoute(context.resolveVenueEquipmentOtherRoute?.(context.submittedAt), {
    at: context.submittedAt,
    referenceType: 'OTHER',
    category: 'OTHER_CONTROLLED',
  });
  return {
    referenceId: '',
    referenceRevision: 1,
    referenceType: 'OTHER',
    category: 'OTHER_CONTROLLED',
    name: line.label,
    aliases: [],
    location: '',
    unit: line.unit,
    requestedQuantity: Number(line.quantity),
    requestability: 'PENDING_CLASSIFICATION',
    requestabilityLabel: 'Pending classification — no booking or stock promise',
    returnRequired: false,
    contactRole: '',
    sourceRevision: '',
    ...route,
  };
}

function leadTimeStatus(snapshots, submittedAt, scheduleStartAt) {
  if (!submittedAt || !scheduleStartAt) return 'UNKNOWN';
  const start = new Date(submittedAt);
  const finish = new Date(scheduleStartAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(finish.getTime()) || finish <= start)
    return 'SHORT';
  let businessDays = 0;
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(finish);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) businessDays += 1;
  }
  const required = Math.max(...snapshots.map((snapshot) => snapshot.leadTimeBusinessDays), 0);
  return businessDays >= required ? 'MET' : 'SHORT';
}

export function normalizeVenueEquipmentDetails(
  raw,
  lines,
  {
    submittedAt = new Date().toISOString(),
    eventStartAt = '',
    eventEndAt = '',
    resolveVenueEquipmentReference,
    resolveVenueEquipmentRoute,
    resolveVenueEquipmentOtherRoute,
    existingVenueEquipment = null,
  } = {},
) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    validation('Venue and Equipment workflow details are required.', 'venueEquipment');
  const scheduleStartAt = isoDateTime(
    raw.scheduleStartAt ?? eventStartAt,
    'venueEquipment.scheduleStartAt',
    { required: true },
  );
  const scheduleEndAt = isoDateTime(raw.scheduleEndAt ?? eventEndAt, 'venueEquipment.scheduleEndAt');
  if (scheduleEndAt && Date.parse(scheduleEndAt) <= Date.parse(scheduleStartAt))
    validation('Schedule end must be after schedule start.', 'venueEquipment.scheduleEndAt');
  const remaining = [...(existingVenueEquipment?.referenceSnapshots ?? [])];
  const normalizedLines = (lines ?? []).map((line, index) => {
    const unit = controlled(line.unit, VENUE_EQUIPMENT_UNITS, `lines[${index}].unit`, { lower: true });
    const category = controlled(line.category, VENUE_EQUIPMENT_CATEGORIES, `lines[${index}].category`);
    const normalized = { ...line, unit, category };
    const snapshotIndex = remaining.findIndex(
      (snapshot) =>
        snapshot.referenceId === normalized.referenceId &&
        snapshot.name?.toLowerCase() === normalized.label.toLowerCase() &&
        snapshot.unit === normalized.unit,
    );
    const prior = snapshotIndex >= 0 ? remaining.splice(snapshotIndex, 1)[0] : null;
    const reference = normalized.referenceId
      ? referenceSnapshot(normalized, {
          submittedAt,
          resolveVenueEquipmentReference,
          resolveVenueEquipmentRoute,
        }, prior)
      : otherSnapshot(normalized, { submittedAt, resolveVenueEquipmentOtherRoute });
    return { ...normalized, referenceSnapshot: reference };
  });
  if (!normalizedLines.length)
    validation('Venue and Equipment needs at least one line.', 'venueEquipment.lines');
  const snapshots = normalizedLines.map((line) => line.referenceSnapshot);
  const ownerCommitteeIds = new Set(snapshots.map((snapshot) => snapshot.ownerCommitteeId));
  if (ownerCommitteeIds.size !== 1)
    throw new AppError(
      'VENUE_EQUIPMENT_ROUTE_CONFLICT',
      'Selected references resolve to different committee routes. Submit one approved route per section.',
    );
  const hasOther = snapshots.some((snapshot) => snapshot.referenceType === 'OTHER');
  const returnRequired = snapshots.some((snapshot) => snapshot.returnRequired);
  const previousHistory = Array.isArray(existingVenueEquipment?.provenanceHistory)
    ? existingVenueEquipment.provenanceHistory
    : [];
  const snapshotsChanged =
    existingVenueEquipment &&
    JSON.stringify(existingVenueEquipment.referenceSnapshots ?? []) !== JSON.stringify(snapshots);
  return {
    version: 1,
    purposeDetail: boundedText(raw.purposeDetail, 'venueEquipment.purposeDetail', {
      required: true,
      max: 500,
    }),
    scheduleStartAt,
    scheduleEndAt,
    ownerCommitteeId: snapshots[0].ownerCommitteeId,
    ownerUserId: snapshots.every((snapshot) => snapshot.ownerUserId === snapshots[0].ownerUserId)
      ? snapshots[0].ownerUserId
      : '',
    leadTimeStatus: leadTimeStatus(snapshots, submittedAt, scheduleStartAt),
    confirmationStatus: existingVenueEquipment?.confirmationStatus ?? 'PENDING_CONFIRMATION',
    confirmationReference: existingVenueEquipment?.confirmationReference ?? '',
    otherTriageStatus: hasOther
      ? existingVenueEquipment?.otherTriageStatus === 'APPROVED_AS_SPECIFIED'
        ? 'APPROVED_AS_SPECIFIED'
        : 'PENDING_CLASSIFICATION'
      : 'NOT_REQUIRED',
    otherTriageReason: hasOther ? existingVenueEquipment?.otherTriageReason ?? '' : '',
    blockerStatus: existingVenueEquipment?.blockerStatus ?? 'NONE',
    blockerReason: existingVenueEquipment?.blockerReason ?? '',
    returnRequired,
    returnStatus: returnRequired
      ? existingVenueEquipment?.returnStatus === 'RETURNED'
        ? 'RETURNED'
        : 'PENDING_RETURN'
      : 'NOT_REQUIRED',
    fulfillmentEvidenceId: existingVenueEquipment?.fulfillmentEvidenceId ?? '',
    referenceSnapshots: snapshots,
    provenanceHistory: snapshotsChanged
      ? [
          ...previousHistory,
          {
            version: Number(existingVenueEquipment.version || 1),
            referenceSnapshots: existingVenueEquipment.referenceSnapshots ?? [],
          },
        ]
      : previousHistory,
    lines: normalizedLines.map(({ referenceSnapshot: _snapshot, ...line }) => line),
  };
}

export function venueEquipmentAttentionFlags(details) {
  const flags = [];
  if (details.confirmationStatus !== 'CONFIRMED')
    flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.CONFIRMATION_PENDING);
  if (details.otherTriageStatus === 'PENDING_CLASSIFICATION')
    flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.OTHER_TRIAGE_PENDING);
  if (details.blockerStatus === 'BLOCKED') flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.BLOCKED);
  if (details.returnStatus === 'PENDING_RETURN')
    flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.RETURN_PENDING);
  if (!details.fulfillmentEvidenceId) flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.EVIDENCE_MISSING);
  if (details.leadTimeStatus === 'SHORT') flags.push(VENUE_EQUIPMENT_ATTENTION_FLAGS.LEAD_TIME_SHORT);
  return flags;
}

export function updateVenueEquipmentWorkflow(current, patch = {}) {
  if (!current || current.version !== 1)
    throw new AppError(
      'VENUE_EQUIPMENT_WORKFLOW_VERSION_UNSUPPORTED',
      'Venue and Equipment workflow version is unsupported.',
    );
  const next = { ...current };
  if (patch.confirmationStatus != null)
    next.confirmationStatus = controlled(
      patch.confirmationStatus,
      VENUE_EQUIPMENT_CONFIRMATION_STATUSES,
      'confirmationStatus',
    );
  if (patch.confirmationReference != null)
    next.confirmationReference = boundedText(patch.confirmationReference, 'confirmationReference', {
      max: 120,
    });
  if (next.confirmationStatus === 'CONFIRMED' && !next.confirmationReference)
    validation('Confirmed routing requires a confirmation reference.', 'confirmationReference');
  if (patch.otherTriageStatus != null)
    next.otherTriageStatus = controlled(
      patch.otherTriageStatus,
      VENUE_EQUIPMENT_TRIAGE_STATUSES,
      'otherTriageStatus',
    );
  if (patch.otherTriageReason != null)
    next.otherTriageReason = boundedText(patch.otherTriageReason, 'otherTriageReason', { max: 500 });
  if (current.otherTriageStatus === 'NOT_REQUIRED' && next.otherTriageStatus !== 'NOT_REQUIRED')
    validation('Other triage is not applicable to this child.', 'otherTriageStatus');
  if (current.otherTriageStatus !== 'NOT_REQUIRED' && next.otherTriageStatus === 'NOT_REQUIRED')
    validation('Other lines require an authorized triage disposition.', 'otherTriageStatus');
  if (next.otherTriageStatus === 'APPROVED_AS_SPECIFIED' && !next.otherTriageReason)
    validation('Approved Other lines require a recorded disposition.', 'otherTriageReason');
  if (patch.blockerStatus != null)
    next.blockerStatus = controlled(
      patch.blockerStatus,
      VENUE_EQUIPMENT_BLOCKER_STATUSES,
      'blockerStatus',
    );
  if (patch.blockerReason != null)
    next.blockerReason = boundedText(patch.blockerReason, 'blockerReason', { max: 500 });
  if (next.blockerStatus === 'BLOCKED' && !next.blockerReason)
    validation('A blocker reason is required.', 'blockerReason');
  if (next.blockerStatus === 'NONE') next.blockerReason = '';
  if (patch.returnStatus != null)
    next.returnStatus = controlled(
      patch.returnStatus,
      VENUE_EQUIPMENT_RETURN_STATUSES,
      'returnStatus',
    );
  if (!current.returnRequired && next.returnStatus !== 'NOT_REQUIRED')
    validation('Return status is not applicable to this child.', 'returnStatus');
  if (current.returnRequired && next.returnStatus === 'NOT_REQUIRED')
    validation('Equipment return obligations cannot be removed.', 'returnStatus');
  if (patch.fulfillmentEvidenceId != null)
    next.fulfillmentEvidenceId = boundedText(patch.fulfillmentEvidenceId, 'fulfillmentEvidenceId', {
      max: 120,
    });
  return next;
}

export function assertVenueEquipmentTransition(details, action, { evidenceUploaded = false } = {}) {
  const normalized = String(action ?? '').trim().toUpperCase();
  if (['READY_FOR_HANDOFF', 'COMPLETE'].includes(normalized)) {
    if (details.confirmationStatus !== 'CONFIRMED')
      throw new AppError(
        'VENUE_EQUIPMENT_CONFIRMATION_REQUIRED',
        'Record approved confirmation before handoff.',
      );
    if (details.otherTriageStatus === 'PENDING_CLASSIFICATION')
      throw new AppError(
        'VENUE_EQUIPMENT_OTHER_TRIAGE_REQUIRED',
        'Resolve controlled Other lines before handoff.',
      );
    if (details.blockerStatus === 'BLOCKED')
      throw new AppError('VENUE_EQUIPMENT_BLOCKED', 'Resolve the blocker before handoff.');
  }
  if (normalized === 'COMPLETE') {
    if (details.returnRequired && details.returnStatus !== 'RETURNED')
      throw new AppError(
        'VENUE_EQUIPMENT_RETURN_REQUIRED',
        'Resolve all equipment return obligations before completion.',
      );
    if (!details.fulfillmentEvidenceId || !evidenceUploaded)
      throw new AppError(
        'VENUE_EQUIPMENT_EVIDENCE_REQUIRED',
        'Uploaded component confirmation evidence is required before completion.',
      );
  }
  return true;
}

export function searchVenueEquipmentReferences(
  references,
  { query = '', type = '', category = '', at = new Date().toISOString(), limit = 20, resolveRoute } = {},
) {
  const groups = new Map();
  const aliases = new Map();
  const safe = [];
  for (const reference of references ?? []) {
    const id = boundedText(reference.id, 'reference.id', { required: true, max: 100 });
    const revisions = groups.get(id) ?? [];
    revisions.push(reference);
    groups.set(id, revisions);
  }
  for (const [id, revisions] of groups) {
    const effective = revisions.filter(
      (reference) =>
        String(reference.status ?? '').trim().toUpperCase() === 'ACTIVE' && activeAt(reference, at),
    );
    if (effective.length > 1)
      throw new AppError(
        'VENUE_EQUIPMENT_REFERENCE_CONFLICT',
        'A reference ID has overlapping active effective revisions.',
      );
    if (!effective.length) continue;
    const reference = effective[0];
    const referenceType = controlled(reference.type, VENUE_EQUIPMENT_REFERENCE_TYPES, 'reference.type');
    const referenceCategory = controlled(
      reference.category,
      VENUE_EQUIPMENT_CATEGORIES,
      'reference.category',
    );
    const name = boundedText(reference.name, 'reference.name', { required: true });
    for (const alias of [name, ...(reference.aliases ?? [])]) {
      const key = normalizedSearch(alias);
      if (aliases.has(key) && aliases.get(key) !== id)
        throw new AppError(
          'VENUE_EQUIPMENT_ALIAS_CONFLICT',
          'Active reference names and aliases must be unique.',
        );
      aliases.set(key, id);
    }
    if (String(reference.requestability ?? '').trim().toUpperCase() !== 'REQUESTABLE') continue;
    const route = requireRoute(resolveRoute?.(reference.routeId, at), {
      at,
      referenceType,
      category: referenceCategory,
      referenceId: id,
    });
    safe.push({
      id,
      type: referenceType,
      category: referenceCategory,
      name,
      aliases: [...(reference.aliases ?? [])],
      location: boundedText(reference.location, 'reference.location', { max: 160 }),
      unit: controlled(reference.unit, VENUE_EQUIPMENT_UNITS, 'reference.unit', { lower: true }),
      referenceRevision: positiveInteger(reference.revision, 'reference.revision'),
      requestability: 'REQUESTABLE',
      requestabilityLabel: 'Requestable — confirmation required; not a booking guarantee',
      leadTimeBusinessDays: route.leadTimeBusinessDays,
      responsibleOfficeId: route.responsibleOfficeId,
      approvingAuthorityId: route.approvingAuthorityId,
      instructions: route.instructions,
    });
  }
  const normalizedQuery = normalizedSearch(query);
  const normalizedType = String(type || '').trim().toUpperCase();
  const normalizedCategory = String(category || '').trim().toUpperCase();
  return safe
    .filter((reference) => {
      const haystack = normalizedSearch(
        [reference.id, reference.name, ...reference.aliases, reference.category, reference.location].join(' '),
      );
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (!normalizedType || reference.type === normalizedType) &&
        (!normalizedCategory || reference.category === normalizedCategory)
      );
    })
    .sort((left, right) =>
      [left.type, left.category, left.name].join('|').localeCompare([right.type, right.category, right.name].join('|')),
    )
    .slice(0, Math.min(Math.max(Number(limit) || 20, 1), 50));
}

export function buildVenueEquipmentQueueItem(parent, child) {
  if (child.componentType !== 'VENUE_EQUIPMENT')
    throw new AppError(
      'VENUE_EQUIPMENT_COMPONENT_REQUIRED',
      'A Venue and Equipment component is required.',
    );
  return {
    requestId: parent.requestId,
    componentId: child.componentId,
    status: child.status,
    ownerCommitteeId: child.ownerCommitteeId,
    ownerUserId: child.ownerUserId || '',
    dueAt: child.dueAt || '',
    revision: Number(child.revision || 1),
    parent: {
      eventId: parent.eventId || '',
      eventName: parent.eventName || '',
      eventStartAt: parent.eventStartAt || '',
      eventEndAt: parent.eventEndAt || '',
      priority: parent.priority || 'ROUTINE',
      purpose: parent.purpose || '',
      department: parent.department || '',
    },
    venueEquipment: child.payload?.venueEquipment,
    lines: child.payload?.lines || [],
    attentionFlags: child.attentionFlags || [],
  };
}
