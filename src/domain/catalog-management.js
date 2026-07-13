const EDITABLE_FIELDS = Object.freeze([
  'itemName', 'aliases', 'category', 'catalogType', 'stockArea', 'storageLocation',
  'handling', 'unit', 'reorderThreshold', 'lendingAudience', 'defaultLoanDays',
  'maximumLoanQuantity', 'approvalRequired', 'status', 'verificationNote', 'notes',
]);

export function canManageCatalog(currentUser) {
  if (!currentUser) return false;
  if (currentUser.permissions?.manageCatalog === true) return true;
  return ['ADMIN', 'DOL_DIRECTOR'].includes(String(currentUser.role ?? '').toUpperCase());
}

export function buildCatalogUpdateCommand(itemId, draft) {
  const command = { itemId };
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(draft, field)) command[field] = draft[field];
  }
  if (typeof command.aliases === 'string') {
    command.aliases = command.aliases.split(/[|,]/).map((value) => value.trim()).filter(Boolean);
  }
  command.reorderThreshold = Number(command.reorderThreshold || 0);
  command.defaultLoanDays = command.defaultLoanDays === '' ? '' : Number(command.defaultLoanDays);
  command.maximumLoanQuantity = command.maximumLoanQuantity === '' ? '' : Number(command.maximumLoanQuantity);
  command.approvalRequired = command.approvalRequired === true || command.approvalRequired === 'true' || command.approvalRequired === 'on';
  return command;
}

export function validateCatalogDraft(draft) {
  for (const field of ['itemName', 'category', 'stockArea', 'storageLocation', 'handling', 'unit', 'catalogType', 'lendingAudience']) {
    if (!String(draft[field] ?? '').trim()) return { valid: false, field, message: `${field} is required.` };
  }
  if (Number(draft.reorderThreshold) < 0) return { valid: false, field: 'reorderThreshold', message: 'Reorder threshold cannot be negative.' };
  return { valid: true };
}

export { EDITABLE_FIELDS };
