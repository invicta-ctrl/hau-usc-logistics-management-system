import { can } from './permissions.js';
import { operationalInteger } from './operational-integers.js';
import { isKnownQuantityUnit } from './quantity-units.js';

const EDITABLE_FIELDS = Object.freeze([
  'itemName',
  'aliases',
  'category',
  'catalogType',
  'stockArea',
  'storageLocation',
  'handling',
  'unit',
  'reorderThreshold',
  'lowStockAlertEnabled',
  'lowStockThreshold',
  'lendingAudience',
  'defaultLoanDays',
  'maximumLoanQuantity',
  'approvalRequired',
  'status',
  'verificationNote',
  'notes',
]);

export function canManageCatalog(currentUser) {
  if (!currentUser) return false;
  if (currentUser.authorization?.modelVersion >= 2) return can(currentUser, 'manage_catalog');
  if (currentUser.permissions?.manageCatalog === true) return true;
  return ['ADMIN', 'ADMINISTRATOR', 'DOL_DIRECTOR', 'DIRECTOR'].includes(
    String(currentUser.role ?? '').toUpperCase(),
  );
}

export function buildCatalogUpdateCommand(itemId, draft) {
  const command = { itemId };
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(draft, field)) command[field] = draft[field];
  }
  if (typeof command.aliases === 'string') {
    command.aliases = command.aliases
      .split(/[|,]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  command.reorderThreshold = Number(command.reorderThreshold || 0);
  if (Object.prototype.hasOwnProperty.call(command, 'lowStockAlertEnabled')) {
    command.lowStockAlertEnabled =
      command.lowStockAlertEnabled === true ||
      command.lowStockAlertEnabled === 'true' ||
      command.lowStockAlertEnabled === 'on';
  }
  if (Object.prototype.hasOwnProperty.call(command, 'lowStockThreshold')) {
    command.lowStockThreshold = command.lowStockThreshold === '' ? '' : Number(command.lowStockThreshold);
  }
  command.defaultLoanDays = command.defaultLoanDays === '' ? '' : Number(command.defaultLoanDays);
  command.maximumLoanQuantity = command.maximumLoanQuantity === '' ? '' : Number(command.maximumLoanQuantity);
  command.approvalRequired =
    command.approvalRequired === true ||
    command.approvalRequired === 'true' ||
    command.approvalRequired === 'on';
  return command;
}

export function validateCatalogDraft(draft) {
  for (const field of [
    'itemName',
    'category',
    'stockArea',
    'storageLocation',
    'handling',
    'unit',
    'catalogType',
    'lendingAudience',
  ]) {
    if (!String(draft[field] ?? '').trim()) return { valid: false, field, message: `${field} is required.` };
  }
  const quantityValidation = validateCatalogQuantities(draft);
  if (!quantityValidation.valid) return quantityValidation;
  return { valid: true };
}

export function validateCatalogQuantities(draft = {}) {
  const unit = String(draft.unit ?? '').trim();
  if (!isKnownQuantityUnit(unit)) {
    return { valid: false, field: 'unit', message: 'Select a supported quantity unit.' };
  }
  const validate = (field, { allowZero = false, optional = false, label = field } = {}) => {
    const value = draft[field];
    if (optional && String(value ?? '').trim() === '') return null;
    try {
      operationalInteger(value, { field, min: allowZero ? 0 : 1 });
    } catch {
      return {
        valid: false,
        field,
        message: `${label} must be a whole number ${allowZero ? 'zero or greater' : 'greater than zero'}.`,
      };
    }
    return null;
  };
  if (
    (draft.lowStockAlertEnabled === true ||
      draft.lowStockAlertEnabled === 'true' ||
      draft.lowStockAlertEnabled === 'on') &&
    String(draft.lowStockThreshold ?? '').trim() === ''
  ) {
    return {
      valid: false,
      field: 'lowStockThreshold',
      message: 'Low-stock threshold is required when the alert is enabled.',
    };
  }
  return (
    validate('reorderThreshold', { allowZero: true, label: 'Reorder threshold' }) ??
    validate('lowStockThreshold', { allowZero: true, optional: true, label: 'Low-stock threshold' }) ??
    validate('maximumLoanQuantity', { optional: true, label: 'Maximum lending quantity' }) ??
    validate('initialQuantity', { allowZero: true, optional: true, label: 'Initial quantity' }) ?? {
      valid: true,
    }
  );
}

export { EDITABLE_FIELDS };
