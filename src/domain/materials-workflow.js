import { AppError } from '../app/errors.js';

export const MATERIAL_CATEGORIES = Object.freeze([
  'OFFICE_SUPPLIES',
  'PRINTING_SIGNAGE',
  'EVENT_MATERIALS',
  'CLEANING_SUPPLIES',
  'OTHER_CONTROLLED',
]);
export const MATERIAL_UNITS = Object.freeze([
  'piece',
  'box',
  'pack',
  'ream',
  'roll',
  'sheet',
  'bottle',
  'meter',
  'kilogram',
  'liter',
]);
export const MATERIAL_SOURCING_PREFERENCES = Object.freeze(['STOCK_REVIEW', 'PROCUREMENT_REQUIRED']);
export const MATERIAL_FULFILLMENT_PATHS = Object.freeze([
  'PENDING_DECISION',
  'STOCK_ISSUE',
  'PROCUREMENT_RECEIPT',
]);
export const MATERIAL_SUBSTITUTION_POLICIES = Object.freeze(['EXACT_ONLY', 'APPROVED_SUBSTITUTION']);
export const MATERIAL_BLOCKER_STATUSES = Object.freeze(['NONE', 'BLOCKED']);
export const MATERIAL_ATTENTION_FLAGS = Object.freeze({
  FULFILLMENT_PATH_PENDING: 'MATERIALS_FULFILLMENT_PATH_PENDING',
  SUBSTITUTION_APPROVAL_REQUIRED: 'MATERIALS_SUBSTITUTION_APPROVAL_REQUIRED',
  BLOCKED: 'MATERIALS_BLOCKED',
  COMPLETION_EVIDENCE_MISSING: 'MATERIALS_COMPLETION_EVIDENCE_MISSING',
});

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

function dateOnly(value, field) {
  const normalized = boundedText(value, field, { required: true, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || !Number.isFinite(Date.parse(`${normalized}T00:00:00Z`)))
    validation(`${field} must be a valid ISO date.`, field);
  return normalized;
}

function sourceSnapshot(line, resolveMaterialReference, existingSnapshot = null) {
  const referenceId = boundedText(line.referenceId, 'line.referenceId', { max: 100 });
  if (!referenceId) return null;
  const item = resolveMaterialReference?.(referenceId);
  if (!item) throw new AppError('MATERIAL_REFERENCE_NOT_FOUND', 'The selected material reference was not found.');
  const status = String(item.status ?? item.Status ?? '').trim().toUpperCase();
  if (status === 'VERIFY')
    throw new AppError(
      'MATERIAL_VERIFY_BLOCKED',
      'Materials marked VERIFY cannot be requested or fulfilled until explicitly resolved.',
    );
  if (status !== 'ACTIVE')
    throw new AppError('MATERIAL_REFERENCE_INACTIVE', 'The selected material reference is not active.');
  const catalogName = boundedText(item.name ?? item.Item_Name, 'catalogName', { required: true });
  const catalogUnit = controlled(item.unit ?? item.Unit, MATERIAL_UNITS, 'catalogUnit', { lower: true });
  const sourceCategory = controlled(
    item.category ?? item.Category,
    MATERIAL_CATEGORIES,
    'sourceCategory',
  );
  if (catalogUnit !== line.unit)
    throw new AppError(
      'MATERIAL_UNIT_MISMATCH',
      `The selected material must retain its exact catalog unit (${catalogUnit}).`,
    );
  if (catalogName.toLowerCase() !== line.label.toLowerCase())
    throw new AppError(
      'MATERIAL_SOURCE_NAME_MISMATCH',
      'The selected material must retain its exact source name.',
    );
  if (sourceCategory !== line.category)
    throw new AppError(
      'MATERIAL_CATEGORY_MISMATCH',
      'The selected material must retain its exact controlled category.',
    );
  const preserved =
    existingSnapshot &&
    existingSnapshot.referenceId === referenceId &&
    existingSnapshot.catalogName === catalogName &&
    existingSnapshot.catalogUnit === catalogUnit &&
    existingSnapshot.sourceCategory === sourceCategory
      ? existingSnapshot
      : null;
  return {
    referenceId,
    catalogName,
    catalogUnit,
    requestedQuantity: Number(line.quantity),
    sourceCategory,
    sourceName: preserved?.sourceName ?? boundedText(
        item.legacySourceName ?? item._Helper_Name ?? catalogName,
        'sourceName',
        { required: true },
      ),
    sourceQuantity:
      preserved?.sourceQuantity ??
      item.legacySourceQuantity ??
      item._Helper_Qty ??
      item.openingOnHand ??
      item.Opening_Qty ??
      '',
    sourceUnit:
      preserved?.sourceUnit ??
      boundedText(item.legacySourceUnit ?? item._Helper_Unit ?? catalogUnit, 'sourceUnit', {
        required: true,
        max: 40,
      }),
    sourceStatus: preserved?.sourceStatus ?? status,
    sourceSheet:
      preserved?.sourceSheet ??
      boundedText(item.legacySourceSheet ?? item.Legacy_Source_Sheet, 'sourceSheet', { max: 120 }),
    sourceRow:
      preserved?.sourceRow ??
      boundedText(item.legacySourceRow ?? item.Legacy_Source_Row, 'sourceRow', { max: 40 }),
    sourceBlock:
      preserved?.sourceBlock ??
      boundedText(item.legacySourceBlock ?? item.Legacy_Source_Block, 'sourceBlock', { max: 120 }),
  };
}

export function normalizeMaterialsDetails(
  raw,
  lines,
  { resolveMaterialReference, existingMaterials = null } = {},
) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    validation('Materials workflow details are required.', 'materials');
  const remainingSnapshots = [...(existingMaterials?.lineSnapshots ?? [])];
  const normalizedLines = (lines ?? []).map((line, index) => {
    const unit = controlled(line.unit, MATERIAL_UNITS, `lines[${index}].unit`, { lower: true });
    const category = controlled(
      line.category ?? raw.materialCategory,
      MATERIAL_CATEGORIES,
      `lines[${index}].category`,
    );
    const normalized = { ...line, unit, category };
    const snapshotIndex = remainingSnapshots.findIndex(
      (snapshot) =>
        snapshot.referenceId === normalized.referenceId &&
        snapshot.catalogName?.toLowerCase() === normalized.label.toLowerCase() &&
        snapshot.catalogUnit === normalized.unit,
    );
    const existingSnapshot = snapshotIndex >= 0 ? remainingSnapshots.splice(snapshotIndex, 1)[0] : null;
    return {
      ...normalized,
      sourceSnapshot: sourceSnapshot(normalized, resolveMaterialReference, existingSnapshot),
    };
  });
  if (!normalizedLines.length) validation('Materials needs at least one line.', 'materials.lines');
  const materialCategory = controlled(raw.materialCategory, MATERIAL_CATEGORIES, 'materials.materialCategory');
  if (normalizedLines.some((line) => line.category !== materialCategory))
    validation('Every Materials line must use the selected controlled category.', 'materials.materialCategory');
  const specification = boundedText(raw.specification, 'materials.specification', { required: true, max: 500 });
  if (materialCategory === 'OTHER_CONTROLLED' && specification.length < 5)
    validation('Constrained Other materials require a specific description.', 'materials.specification');
  const lineSnapshots = normalizedLines.map((line) => line.sourceSnapshot).filter(Boolean);
  const priorHistory = Array.isArray(existingMaterials?.provenanceHistory)
    ? existingMaterials.provenanceHistory
    : [];
  const snapshotsChanged =
    existingMaterials &&
    JSON.stringify(existingMaterials.lineSnapshots ?? []) !== JSON.stringify(lineSnapshots);
  const provenanceHistory = snapshotsChanged
    ? [
        ...priorHistory,
        {
          version: Number(existingMaterials.version || 1),
          lineSnapshots: existingMaterials.lineSnapshots ?? [],
        },
      ]
    : priorHistory;
  return {
    version: 1,
    materialCategory,
    specification,
    requiredBy: dateOnly(raw.requiredBy, 'materials.requiredBy'),
    usagePurpose: boundedText(raw.usagePurpose, 'materials.usagePurpose', { required: true, max: 500 }),
    sourcingPreference: controlled(
      raw.sourcingPreference,
      MATERIAL_SOURCING_PREFERENCES,
      'materials.sourcingPreference',
    ),
    fulfillmentPath: existingMaterials?.fulfillmentPath ?? 'PENDING_DECISION',
    substitutionPolicy: existingMaterials?.substitutionPolicy ?? 'EXACT_ONLY',
    approvedSubstitutionReferenceId: existingMaterials?.approvedSubstitutionReferenceId ?? '',
    substitutionReason: existingMaterials?.substitutionReason ?? '',
    blockerStatus: existingMaterials?.blockerStatus ?? 'NONE',
    blockerReason: existingMaterials?.blockerReason ?? '',
    fulfillmentEvidenceId: existingMaterials?.fulfillmentEvidenceId ?? '',
    lineSnapshots,
    provenanceHistory,
    lines: normalizedLines.map(({ sourceSnapshot: _snapshot, ...line }) => line),
  };
}

export function materialsAttentionFlags(materials) {
  const flags = [];
  if (materials.fulfillmentPath === 'PENDING_DECISION')
    flags.push(MATERIAL_ATTENTION_FLAGS.FULFILLMENT_PATH_PENDING);
  if (
    materials.substitutionPolicy === 'APPROVED_SUBSTITUTION' &&
    !materials.approvedSubstitutionReferenceId
  )
    flags.push(MATERIAL_ATTENTION_FLAGS.SUBSTITUTION_APPROVAL_REQUIRED);
  if (materials.blockerStatus === 'BLOCKED') flags.push(MATERIAL_ATTENTION_FLAGS.BLOCKED);
  if (!materials.fulfillmentEvidenceId)
    flags.push(MATERIAL_ATTENTION_FLAGS.COMPLETION_EVIDENCE_MISSING);
  return flags;
}

export function updateMaterialsWorkflow(current, patch = {}, { resolveMaterialReference } = {}) {
  if (!current || current.version !== 1)
    throw new AppError('MATERIALS_WORKFLOW_VERSION_UNSUPPORTED', 'Materials workflow version is unsupported.');
  const next = { ...current };
  if (patch.fulfillmentPath != null)
    next.fulfillmentPath = controlled(
      patch.fulfillmentPath,
      MATERIAL_FULFILLMENT_PATHS,
      'fulfillmentPath',
    );
  if (patch.substitutionPolicy != null)
    next.substitutionPolicy = controlled(
      patch.substitutionPolicy,
      MATERIAL_SUBSTITUTION_POLICIES,
      'substitutionPolicy',
    );
  if (patch.approvedSubstitutionReferenceId != null)
    next.approvedSubstitutionReferenceId = boundedText(
      patch.approvedSubstitutionReferenceId,
      'approvedSubstitutionReferenceId',
      { max: 100 },
    );
  if (patch.substitutionReason != null)
    next.substitutionReason = boundedText(patch.substitutionReason, 'substitutionReason', { max: 500 });
  if (next.substitutionPolicy === 'EXACT_ONLY') {
    if (next.approvedSubstitutionReferenceId || next.substitutionReason)
      validation('Exact-only requests cannot record a substitution.', 'substitutionPolicy');
  } else if (!next.approvedSubstitutionReferenceId || !next.substitutionReason) {
    validation(
      'An approved substitution requires the replacement reference and recorded reason.',
      'approvedSubstitutionReferenceId',
    );
  } else if (resolveMaterialReference) {
    const replacement = resolveMaterialReference(next.approvedSubstitutionReferenceId);
    if (!replacement)
      throw new AppError(
        'MATERIAL_REFERENCE_NOT_FOUND',
        'The approved substitution reference was not found.',
      );
    sourceSnapshot(
      {
        referenceId: next.approvedSubstitutionReferenceId,
        label: replacement.name ?? replacement.Item_Name,
        quantity: 1,
        unit: replacement.unit ?? replacement.Unit,
        category: current.materialCategory,
      },
      () => replacement,
    );
  }
  if (patch.blockerStatus != null)
    next.blockerStatus = controlled(patch.blockerStatus, MATERIAL_BLOCKER_STATUSES, 'blockerStatus');
  if (patch.blockerReason != null)
    next.blockerReason = boundedText(patch.blockerReason, 'blockerReason', { max: 500 });
  if (next.blockerStatus === 'BLOCKED' && !next.blockerReason)
    validation('A blocker reason is required while Materials is blocked.', 'blockerReason');
  if (next.blockerStatus === 'NONE') next.blockerReason = '';
  if (patch.fulfillmentEvidenceId != null)
    next.fulfillmentEvidenceId = boundedText(patch.fulfillmentEvidenceId, 'fulfillmentEvidenceId', {
      max: 120,
    });
  return next;
}

export function assertMaterialsTransition(materials, action, { evidenceUploaded = false } = {}) {
  const normalizedAction = String(action ?? '').trim().toUpperCase();
  if (['READY_FOR_HANDOFF', 'COMPLETE'].includes(normalizedAction)) {
    if (materials.fulfillmentPath === 'PENDING_DECISION')
      throw new AppError(
        'MATERIALS_FULFILLMENT_PATH_REQUIRED',
        'Choose exactly one stock-issue or procurement-receipt path before handoff.',
      );
    if (materials.blockerStatus === 'BLOCKED')
      throw new AppError('MATERIALS_BLOCKED', 'Resolve the Materials blocker before handoff.');
    if (
      materials.substitutionPolicy === 'APPROVED_SUBSTITUTION' &&
      !materials.approvedSubstitutionReferenceId
    )
      throw new AppError(
        'MATERIALS_SUBSTITUTION_APPROVAL_REQUIRED',
        'Record the approved substitution before handoff.',
      );
  }
  if (normalizedAction === 'COMPLETE' && (!materials.fulfillmentEvidenceId || !evidenceUploaded))
    throw new AppError(
      'MATERIALS_COMPLETION_EVIDENCE_REQUIRED',
      'Uploaded issue or receipt evidence is required before Materials completion.',
    );
  return true;
}

export function buildMaterialsQueueItem(parent, child) {
  if (child.componentType !== 'MATERIALS')
    throw new AppError('MATERIALS_COMPONENT_REQUIRED', 'A Materials component is required.');
  return {
    requestId: parent.requestId,
    componentId: child.componentId,
    status: child.status,
    ownerCommitteeId: 'COM_MATERIALS',
    ownerUserId: child.ownerUserId || '',
    dueAt: child.dueAt || '',
    revision: Number(child.revision || 1),
    parent: {
      eventId: parent.eventId || '',
      eventName: parent.eventName || '',
      eventStartAt: parent.eventStartAt || '',
      priority: parent.priority || 'ROUTINE',
      purpose: parent.purpose || '',
      department: parent.department || '',
    },
    materials: child.payload?.materials,
    lines: child.payload?.lines || [],
    attentionFlags: child.attentionFlags || [],
  };
}
