import { AppError } from '../app/errors.js';
import { foodAttentionFlags, normalizeFoodDetails } from './food-workflow.js';
import { materialsAttentionFlags, normalizeMaterialsDetails } from './materials-workflow.js';
import { normalizeVenueEquipmentDetails, venueEquipmentAttentionFlags } from './venue-equipment-workflow.js';
import { isCountableUnit, isKnownQuantityUnit } from './quantity-units.js';

export const COMPOSITE_SECTION_TYPES = Object.freeze(['FOOD', 'MATERIALS', 'VENUE_EQUIPMENT']);

export const COMPOSITE_SECTION_LABELS = Object.freeze({
  FOOD: 'Food',
  MATERIALS: 'Materials',
  VENUE_EQUIPMENT: 'Venue & Equipment',
});

export const COMPOSITE_COMMITTEES = Object.freeze({
  FOOD: 'COM_FOOD',
  MATERIALS: 'COM_MATERIALS',
  VENUE_EQUIPMENT: 'COM_INVENTORY_PANTRY',
});

export const COMPOSITE_STATUSES = Object.freeze([
  'DRAFT',
  'FOR_REVIEW',
  'ACCEPTED',
  'IN_PROGRESS',
  'PARTIALLY_FULFILLED',
  'READY_FOR_HANDOFF',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

export const COMPOSITE_ATTENTION_FLAGS = Object.freeze({
  NEEDS_INFORMATION: 'NEEDS_INFORMATION',
  HAS_REJECTED_SECTION: 'HAS_REJECTED_SECTION',
  HAS_CANCELLED_SECTION: 'HAS_CANCELLED_SECTION',
  UNASSIGNED_SECTION: 'UNASSIGNED_SECTION',
  AMENDED: 'AMENDED',
  ESCALATED: 'ESCALATED',
  FOOD_ATTENTION: 'FOOD_ATTENTION',
  MATERIALS_ATTENTION: 'MATERIALS_ATTENTION',
  VENUE_EQUIPMENT_ATTENTION: 'VENUE_EQUIPMENT_ATTENTION',
});

const MAX_TEXT_LENGTH = 240;
const MAX_LINES_PER_SECTION = 100;
const TERMINAL_STATUSES = new Set(['COMPLETED', 'REJECTED', 'CANCELLED']);

function text(value, field, { required = false, max = MAX_TEXT_LENGTH } = {}) {
  const normalized = String(value ?? '').trim();
  if (required && !normalized)
    throw new AppError('VALIDATION_ERROR', `${field} is required.`, {
      fieldErrors: { [field]: `${field} is required.` },
    });
  if (normalized.length > max)
    throw new AppError('VALIDATION_ERROR', `${field} is too long.`, {
      fieldErrors: { [field]: `${field} must be ${max} characters or fewer.` },
    });
  return normalized;
}

function positiveQuantity(value, field, unit = null) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new AppError('VALIDATION_ERROR', `${field} must be greater than zero.`, {
      fieldErrors: { [field]: 'Enter a quantity greater than zero.' },
    });
  if (unit != null && !isKnownQuantityUnit(unit))
    throw new AppError('VALIDATION_ERROR', `${field} uses an unsupported unit.`, {
      fieldErrors: { [field]: 'Select a supported unit.' },
    });
  if (unit != null && isCountableUnit(unit) && !Number.isInteger(quantity))
    throw new AppError('VALIDATION_ERROR', `${field} must be a whole number for ${unit}.`, {
      fieldErrors: { [field]: `Enter a whole number for ${unit}.` },
    });
  return quantity;
}

function normalizedType(value) {
  const type = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!COMPOSITE_SECTION_TYPES.includes(type))
    throw new AppError('VALIDATION_ERROR', 'Section type is not supported.', {
      fieldErrors: { sectionType: `Use one of: ${COMPOSITE_SECTION_TYPES.join(', ')}.` },
    });
  return type;
}

function normalizedUnit(value, field) {
  return text(value, field, { required: true, max: 40 }).toLowerCase();
}

function normalizedLine(line, index) {
  if (!line || typeof line !== 'object' || Array.isArray(line))
    throw new AppError('VALIDATION_ERROR', `Line ${index + 1} is invalid.`);
  const label = text(line.label ?? line.description ?? line.name, `lines[${index}].label`, {
    required: true,
  });
  const referenceId = text(line.referenceId ?? line.itemId, `lines[${index}].referenceId`, { max: 100 });
  const unit = normalizedUnit(line.unit, `lines[${index}].unit`);
  const notes = text(line.notes, `lines[${index}].notes`, { max: 240 });
  const category = text(line.category, `lines[${index}].category`, { max: 80 }).toUpperCase();
  const referenceRevision =
    line.referenceRevision == null || line.referenceRevision === ''
      ? undefined
      : positiveQuantity(line.referenceRevision, `lines[${index}].referenceRevision`);
  if (referenceRevision != null && !Number.isInteger(referenceRevision))
    throw new AppError('VALIDATION_ERROR', `lines[${index}].referenceRevision must be a positive integer.`);
  return {
    referenceId,
    ...(referenceRevision == null ? {} : { referenceRevision }),
    label,
    quantity: positiveQuantity(line.quantity, `lines[${index}].quantity`, unit),
    unit,
    category,
    notes,
  };
}

export function canonicalCompositeLineKey(line) {
  const referenceId = String(line.referenceId ?? '')
    .trim()
    .toLowerCase();
  const label = String(line.label ?? line.description ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const unit = String(line.unit ?? '')
    .trim()
    .toLowerCase();
  const notes = String(line.notes ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return JSON.stringify([referenceId, label, unit, notes]);
}

export function consolidateCompositeLines(lines) {
  const consolidated = [];
  const byKey = new Map();
  for (const line of lines) {
    const key = canonicalCompositeLineKey(line);
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += Number(line.quantity);
      existing.duplicateCount += 1;
    } else {
      const copy = { ...line, duplicateCount: 0 };
      byKey.set(key, copy);
      consolidated.push(copy);
    }
  }
  return consolidated;
}

function normalizeSection(section, index, context = {}) {
  if (!section || typeof section !== 'object' || Array.isArray(section))
    throw new AppError('VALIDATION_ERROR', `sections[${index}] is invalid.`);
  const type = normalizedType(section.type);
  const lines = Array.isArray(section.lines) ? section.lines : [];
  const label = text(section.label, `sections[${index}].label`, { max: 120 });
  const notes = text(section.notes, `sections[${index}].notes`, { max: 240 });
  if (!lines.length && !label && !notes) return null;
  if (!lines.length)
    throw new AppError('VALIDATION_ERROR', `${COMPOSITE_SECTION_LABELS[type]} needs at least one line.`, {
      fieldErrors: { [`sections[${index}].lines`]: 'Add at least one line or leave the section blank.' },
    });
  if (lines.length > MAX_LINES_PER_SECTION)
    throw new AppError('VALIDATION_ERROR', `${COMPOSITE_SECTION_LABELS[type]} has too many lines.`);
  const normalizedLines = consolidateCompositeLines(
    lines.map((line, lineIndex) => normalizedLine(line, lineIndex)),
  );
  const food = type === 'FOOD' ? normalizeFoodDetails(section.food, context) : undefined;
  const normalizedMaterials =
    type === 'MATERIALS' ? normalizeMaterialsDetails(section.materials, normalizedLines, context) : undefined;
  const normalizedVenueEquipment =
    type === 'VENUE_EQUIPMENT' && (context.requireVenueEquipmentDetails || section.venueEquipment)
      ? normalizeVenueEquipmentDetails(section.venueEquipment, normalizedLines, context)
      : undefined;
  const materials = normalizedMaterials ? { ...normalizedMaterials } : undefined;
  if (materials) delete materials.lines;
  const venueEquipment = normalizedVenueEquipment ? { ...normalizedVenueEquipment } : undefined;
  if (venueEquipment) delete venueEquipment.lines;
  return {
    type,
    label: label || COMPOSITE_SECTION_LABELS[type],
    notes,
    clientComponentId: text(section.clientComponentId, `sections[${index}].clientComponentId`, { max: 120 }),
    lines: normalizedMaterials?.lines ?? normalizedVenueEquipment?.lines ?? normalizedLines,
    ...(normalizedVenueEquipment
      ? {
          ownerCommitteeId: normalizedVenueEquipment.ownerCommitteeId,
          ownerUserId: normalizedVenueEquipment.ownerUserId,
        }
      : {}),
    ...(food ? { food } : {}),
    ...(materials ? { materials } : {}),
    ...(venueEquipment ? { venueEquipment } : {}),
  };
}

function requestValue(command, key, nestedKey) {
  return command?.[key] ?? command?.requester?.[nestedKey] ?? '';
}

export function validateCompositeDraft(command, context = {}) {
  if (!command || typeof command !== 'object' || Array.isArray(command))
    throw new AppError('VALIDATION_ERROR', 'Composite request is required.');
  if (command.requestId || command.parentRequestId || command.componentId)
    throw new AppError('CLIENT_AUTHORITY_VIOLATION', 'Request and component IDs are server-owned.');
  const requesterName = text(requestValue(command, 'requesterName', 'name'), 'requesterName', {
    required: true,
  });
  const requesterEmail = text(requestValue(command, 'requesterEmail', 'email'), 'requesterEmail', {
    max: 240,
  }).toLowerCase();
  const department = text(requestValue(command, 'department', 'department'), 'department', {
    required: true,
  });
  const purpose = text(command.purpose, 'purpose', { required: true, max: 1000 });
  const eventId = text(command.eventId ?? command.event?.id, 'eventId', { required: true, max: 120 });
  const eventSeriesId = text(command.eventSeriesId ?? command.event?.seriesId, 'eventSeriesId', { max: 120 });
  const eventName = text(command.eventName ?? command.event?.name, 'eventName', { max: 240 });
  const eventStartAt = text(command.eventStartAt ?? command.event?.startAt, 'eventStartAt', { max: 80 });
  const eventEndAt = text(command.eventEndAt ?? command.event?.endAt, 'eventEndAt', { max: 80 });
  const priority = text(command.priority, 'priority', { max: 40 }) || 'ROUTINE';
  const rawSections = Array.isArray(command.sections) ? command.sections : [];
  const submittedAt = command.submittedAt || new Date().toISOString();
  const sections = rawSections
    .map((section, index) =>
      normalizeSection(section, index, {
        ...context,
        submittedAt,
        eventStartAt,
        examWeeks: command.examWeeks,
      }),
    )
    .filter(Boolean);
  const seenTypes = new Set();
  for (const section of sections) {
    if (seenTypes.has(section.type))
      throw new AppError(
        'VALIDATION_ERROR',
        `The ${COMPOSITE_SECTION_LABELS[section.type]} section was repeated.`,
      );
    seenTypes.add(section.type);
  }
  if (!sections.length)
    throw new AppError('COMPOSITE_SECTIONS_REQUIRED', 'Add at least one non-empty logistics section.', {
      fieldErrors: { sections: 'Select Food, Materials, or Venue & Equipment and add a line.' },
    });
  return {
    requesterName,
    requesterEmail,
    department,
    purpose,
    eventId,
    eventSeriesId,
    eventName,
    eventStartAt,
    eventEndAt,
    priority,
    submittedAt,
    sections,
  };
}

export function createCompositePacket(
  command,
  {
    requestId,
    componentIds,
    actor = 'SYSTEM',
    now = new Date().toISOString(),
    resolveMaterialReference,
    requireVenueEquipmentDetails = false,
    resolveVenueEquipmentReference,
    resolveVenueEquipmentRoute,
    resolveVenueEquipmentOtherRoute,
  } = {},
) {
  const draft = validateCompositeDraft(command, {
    resolveMaterialReference,
    requireVenueEquipmentDetails,
    resolveVenueEquipmentReference,
    resolveVenueEquipmentRoute,
    resolveVenueEquipmentOtherRoute,
  });
  if (!requestId) throw new AppError('SERVER_ID_REQUIRED', 'A server request ID is required.');
  if (
    !Array.isArray(componentIds) ||
    componentIds.length !== draft.sections.length ||
    componentIds.some((id) => !id)
  )
    throw new AppError('SERVER_ID_REQUIRED', 'Server component IDs are required for every section.');
  const parent = {
    requestId,
    recordType: 'PARENT',
    relationshipType: 'COMPOSITE_PARENT',
    relationshipVersion: 1,
    status: 'FOR_REVIEW',
    requesterName: draft.requesterName,
    requesterEmail: draft.requesterEmail,
    department: draft.department,
    eventSeriesId: draft.eventSeriesId,
    eventId: draft.eventId,
    eventName: draft.eventName,
    eventStartAt: draft.eventStartAt,
    eventEndAt: draft.eventEndAt,
    priority: draft.priority,
    purpose: draft.purpose,
    componentCount: draft.sections.length,
    attentionFlags: [],
    progress: {
      total: draft.sections.length,
      completed: 0,
      active: draft.sections.length,
      rejected: 0,
      cancelled: 0,
    },
    revision: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    children: [],
  };
  parent.children = draft.sections.map((section, index) => ({
    componentId: componentIds[index],
    requestId,
    recordType: 'COMPONENT',
    relationshipType: 'COMPOSITE_CHILD',
    relationshipVersion: 1,
    componentType: section.type,
    label: section.label,
    ownerCommitteeId: section.ownerCommitteeId || COMPOSITE_COMMITTEES[section.type],
    ownerUserId: section.ownerUserId || '',
    dueAt: draft.eventStartAt,
    status: 'FOR_REVIEW',
    attentionFlags: section.food
      ? foodAttentionFlags(section.food)
      : section.materials
        ? materialsAttentionFlags(section.materials)
        : section.venueEquipment
          ? venueEquipmentAttentionFlags(section.venueEquipment)
          : [],
    progress: {
      lineCount: section.lines.length,
      duplicateCount: section.lines.reduce((sum, line) => sum + line.duplicateCount, 0),
    },
    payload: {
      notes: section.notes,
      lines: section.lines.map(({ duplicateCount: _duplicateCount, ...line }) => line),
      ...(section.food ? { food: section.food } : {}),
      ...(section.materials ? { materials: section.materials } : {}),
      ...(section.venueEquipment ? { venueEquipment: section.venueEquipment } : {}),
    },
    revision: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    clientComponentId: text(command.sections[index]?.clientComponentId, 'clientComponentId', { max: 120 }),
  }));
  return { parent, children: parent.children, draft };
}

export function deriveCompositeParentStatus(children) {
  if (!Array.isArray(children) || !children.length)
    throw new AppError('COMPOSITE_CHILDREN_REQUIRED', 'A composite request must have at least one child.');
  const statuses = children.map((child) => String(child.status || 'DRAFT').toUpperCase());
  const counts = statuses.reduce((result, status) => {
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  const completed = counts.COMPLETED || 0;
  const rejected = counts.REJECTED || 0;
  const cancelled = counts.CANCELLED || 0;
  const active = children.length - rejected - cancelled;
  const hasProgress = statuses.some((status) =>
    ['IN_PROGRESS', 'PARTIALLY_FULFILLED', 'READY_FOR_HANDOFF', 'COMPLETED'].includes(status),
  );
  const allRemainingCompleted = children
    .filter((child) => child.status !== 'CANCELLED')
    .every((child) => child.status === 'COMPLETED');
  let status = 'FOR_REVIEW';
  if (cancelled === children.length) status = 'CANCELLED';
  else if (rejected === children.length) status = 'REJECTED';
  else if (allRemainingCompleted) status = 'COMPLETED';
  else if (rejected || completed || hasProgress) status = 'PARTIALLY_FULFILLED';
  else if (statuses.every((value) => value === 'DRAFT')) status = 'DRAFT';
  else if (statuses.every((value) => value === 'FOR_REVIEW')) status = 'FOR_REVIEW';
  else if (statuses.some((value) => value === 'ACCEPTED')) status = 'ACCEPTED';
  const attentionFlags = [];
  if (rejected && rejected < children.length)
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.HAS_REJECTED_SECTION);
  if (cancelled) attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.HAS_CANCELLED_SECTION);
  if (
    children.some((child) =>
      (child.attentionFlags || []).includes(COMPOSITE_ATTENTION_FLAGS.NEEDS_INFORMATION),
    )
  )
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.NEEDS_INFORMATION);
  if (children.some((child) => (child.attentionFlags || []).some((flag) => String(flag).startsWith('FOOD_'))))
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.FOOD_ATTENTION);
  if (
    children.some((child) =>
      (child.attentionFlags || []).some((flag) => String(flag).startsWith('MATERIALS_')),
    )
  )
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.MATERIALS_ATTENTION);
  if (
    children.some((child) =>
      (child.attentionFlags || []).some((flag) => String(flag).startsWith('VENUE_EQUIPMENT_')),
    )
  )
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.VENUE_EQUIPMENT_ATTENTION);
  if (children.some((child) => !child.ownerCommitteeId || !child.ownerUserId))
    attentionFlags.push(COMPOSITE_ATTENTION_FLAGS.UNASSIGNED_SECTION);
  return {
    status,
    attentionFlags,
    progress: { total: children.length, active, completed, rejected, cancelled, byStatus: counts },
  };
}

const ACTIONS = Object.freeze({
  SUBMIT: 'SUBMIT',
  ACCEPT: 'ACCEPT',
  REQUEST_INFORMATION: 'REQUEST_INFORMATION',
  START: 'START',
  PARTIALLY_FULFILL: 'PARTIALLY_FULFILL',
  READY_FOR_HANDOFF: 'READY_FOR_HANDOFF',
  COMPLETE: 'COMPLETE',
  REJECT: 'REJECT',
  CANCEL: 'CANCEL',
  REOPEN: 'REOPEN',
  CLEAR_ATTENTION: 'CLEAR_ATTENTION',
});

export { ACTIONS as COMPOSITE_ACTIONS };

const STATUS_TRANSITIONS = Object.freeze({
  SUBMIT: { DRAFT: 'FOR_REVIEW' },
  ACCEPT: { FOR_REVIEW: 'ACCEPTED' },
  START: { ACCEPTED: 'IN_PROGRESS' },
  PARTIALLY_FULFILL: { IN_PROGRESS: 'PARTIALLY_FULFILLED' },
  READY_FOR_HANDOFF: { IN_PROGRESS: 'READY_FOR_HANDOFF', PARTIALLY_FULFILLED: 'READY_FOR_HANDOFF' },
  COMPLETE: { READY_FOR_HANDOFF: 'COMPLETED' },
  REJECT: { FOR_REVIEW: 'REJECTED', ACCEPTED: 'REJECTED' },
  CANCEL: {
    DRAFT: 'CANCELLED',
    FOR_REVIEW: 'CANCELLED',
    ACCEPTED: 'CANCELLED',
    IN_PROGRESS: 'CANCELLED',
    PARTIALLY_FULFILLED: 'CANCELLED',
    READY_FOR_HANDOFF: 'CANCELLED',
  },
  REOPEN: { REJECTED: 'FOR_REVIEW', CANCELLED: 'FOR_REVIEW' },
});

export function transitionCompositeChild(child, action, { reason = '' } = {}) {
  if (!child || typeof child !== 'object')
    throw new AppError('VALIDATION_ERROR', 'Composite child is required.');
  const normalizedAction = String(action ?? '')
    .trim()
    .toUpperCase();
  if (normalizedAction === ACTIONS.REQUEST_INFORMATION) {
    if (!['FOR_REVIEW', 'ACCEPTED'].includes(child.status))
      throw new AppError('INVALID_TRANSITION', `Cannot request information from ${child.status}.`);
    return {
      ...child,
      attentionFlags: [
        ...new Set([...(child.attentionFlags || []), COMPOSITE_ATTENTION_FLAGS.NEEDS_INFORMATION]),
      ],
      transitionReason: text(reason, 'reason', { required: true }),
    };
  }
  if (normalizedAction === ACTIONS.CLEAR_ATTENTION) {
    return {
      ...child,
      attentionFlags: (child.attentionFlags || []).filter(
        (flag) => flag !== COMPOSITE_ATTENTION_FLAGS.NEEDS_INFORMATION,
      ),
    };
  }
  const nextStatus = STATUS_TRANSITIONS[normalizedAction]?.[child.status];
  if (!nextStatus)
    throw new AppError(
      'INVALID_TRANSITION',
      `Composite child cannot move from ${child.status} with ${normalizedAction}.`,
    );
  if (normalizedAction === ACTIONS.COMPLETE && child.status !== 'READY_FOR_HANDOFF')
    throw new AppError('INVALID_TRANSITION', 'A child must be ready for handoff before completion.');
  return {
    ...child,
    status: nextStatus,
    attentionFlags:
      normalizedAction === ACTIONS.REOPEN
        ? child.componentType === 'FOOD'
          ? foodAttentionFlags(child.payload?.food)
          : child.componentType === 'MATERIALS'
            ? materialsAttentionFlags(child.payload?.materials)
            : child.componentType === 'VENUE_EQUIPMENT' && child.payload?.venueEquipment
              ? venueEquipmentAttentionFlags(child.payload.venueEquipment)
              : []
        : (child.attentionFlags || []).filter((flag) => flag !== COMPOSITE_ATTENTION_FLAGS.NEEDS_INFORMATION),
    transitionReason: text(reason, 'reason', { max: 500 }),
  };
}

export function amendCompositeSection(
  child,
  patch,
  {
    now = new Date().toISOString(),
    resolveMaterialReference,
    resolveVenueEquipmentReference,
    resolveVenueEquipmentRoute,
    resolveVenueEquipmentOtherRoute,
  } = {},
) {
  if (!child || TERMINAL_STATUSES.has(child.status))
    throw new AppError(
      'AMENDMENT_NOT_ALLOWED',
      'Completed, rejected, or cancelled sections cannot be amended directly.',
    );
  const existingMaterials = child.payload?.materials ?? null;
  const materialsDraft = existingMaterials
    ? { ...existingMaterials, ...(patch?.materials ?? {}) }
    : patch?.materials;
  const existingVenueEquipment = child.payload?.venueEquipment ?? null;
  const venueEquipmentDraft = existingVenueEquipment
    ? { ...existingVenueEquipment, ...(patch?.venueEquipment ?? {}) }
    : patch?.venueEquipment;
  const section = normalizeSection(
    {
      type: child.componentType,
      label: patch?.label ?? child.label,
      notes: patch?.notes ?? '',
      lines: patch?.lines ?? child.payload?.lines,
      food: patch?.food ?? child.payload?.food,
      materials: materialsDraft,
      venueEquipment: venueEquipmentDraft,
    },
    0,
    {
      resolveMaterialReference,
      existingMaterials,
      requireVenueEquipmentDetails: Boolean(existingVenueEquipment || venueEquipmentDraft),
      resolveVenueEquipmentReference,
      resolveVenueEquipmentRoute,
      resolveVenueEquipmentOtherRoute,
      existingVenueEquipment,
    },
  );
  if (!section) throw new AppError('VALIDATION_ERROR', 'An amended section cannot be blank.');
  return {
    ...child,
    label: section.label,
    ownerCommitteeId: section.ownerCommitteeId || child.ownerCommitteeId,
    ownerUserId: section.ownerUserId || '',
    status: 'FOR_REVIEW',
    attentionFlags: [
      ...new Set([
        ...(section.food
          ? foodAttentionFlags(section.food)
          : section.materials
            ? [
                ...(child.attentionFlags || []).filter((flag) => !String(flag).startsWith('MATERIALS_')),
                ...materialsAttentionFlags(section.materials),
              ]
            : section.venueEquipment
              ? [
                  ...(child.attentionFlags || []).filter(
                    (flag) => !String(flag).startsWith('VENUE_EQUIPMENT_'),
                  ),
                  ...venueEquipmentAttentionFlags(section.venueEquipment),
                ]
              : child.attentionFlags || []),
        COMPOSITE_ATTENTION_FLAGS.AMENDED,
      ]),
    ],
    payload: {
      notes: section.notes,
      lines: section.lines.map(({ duplicateCount: _duplicateCount, ...line }) => line),
      ...(section.food ? { food: section.food } : {}),
      ...(section.materials ? { materials: section.materials } : {}),
      ...(section.venueEquipment ? { venueEquipment: section.venueEquipment } : {}),
    },
    relationshipVersion: Number(child.relationshipVersion || 1) + 1,
    revision: Number(child.revision || 1) + 1,
    updatedAt: now,
  };
}

export function buildCompositeView(parent, children) {
  const derived = deriveCompositeParentStatus(children);
  return {
    requestId: parent.requestId,
    recordType: 'PARENT',
    relationshipType: parent.relationshipType,
    relationshipVersion: parent.relationshipVersion,
    status: derived.status,
    attentionFlags: derived.attentionFlags,
    progress: derived.progress,
    requester: { name: parent.requesterName, department: parent.department },
    event: {
      seriesId: parent.eventSeriesId,
      id: parent.eventId,
      name: parent.eventName,
      startAt: parent.eventStartAt,
      endAt: parent.eventEndAt,
    },
    priority: parent.priority,
    purpose: parent.purpose,
    children: children.map((child) => ({
      componentId: child.componentId,
      componentType: child.componentType,
      label: child.label,
      ownerCommitteeId: child.ownerCommitteeId,
      ownerUserId: child.ownerUserId || '',
      dueAt: child.dueAt || '',
      status: child.status,
      attentionFlags: child.attentionFlags || [],
      progress: child.progress || {},
      relationshipVersion: child.relationshipVersion,
      revision: child.revision,
      payload: child.payload || { lines: [] },
    })),
  };
}
