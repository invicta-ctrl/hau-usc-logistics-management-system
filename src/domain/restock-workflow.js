const TERMINAL = Object.freeze(['RESTOCKED', 'REJECTED', 'CANCELLED']);

export const RESTOCK_ACTIONS = Object.freeze({
  SEND_TO_BUDGET_REVIEW: Object.freeze({
    from: Object.freeze(['FOR_CANVASSING']),
    to: 'WAITING_FOR_BUDGET',
    label: 'Send to budget review',
    consequence: 'Records that a preferred quote is ready for budget review.',
    requiresPreferredQuote: true,
  }),
  AUTHORIZE_PROCUREMENT: Object.freeze({
    from: Object.freeze(['WAITING_FOR_BUDGET']),
    to: 'TO_BE_PROCURED',
    label: 'Authorize procurement',
    consequence: 'Authorizes procurement against the recorded preferred quote.',
    requiresPreferredQuote: true,
  }),
  REJECT: Object.freeze({
    from: Object.freeze(['FOR_CANVASSING', 'WAITING_FOR_BUDGET']),
    to: 'REJECTED',
    label: 'Reject restock line',
    consequence: 'Stops remaining work while preserving the request history.',
  }),
  CANCEL: Object.freeze({
    from: Object.freeze(['FOR_REVIEW', 'FOR_CANVASSING', 'WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PARTIALLY_RECEIVED']),
    to: 'CANCELLED',
    label: 'Cancel remaining work',
    consequence: 'Stops remaining work; prior receipts and ledger entries remain immutable.',
  }),
});

export const restockProjectionId = (requestLineId) => `RRQ-${String(requestLineId ?? '').trim()}`;

export function restockActionDecisions({
  status,
  featureEnabled = true,
  canTransition = true,
  canReceive = true,
  hasPreferredQuote = false,
  reconciliationRequired = false,
} = {}) {
  const current = String(status ?? '').trim().toUpperCase();
  const decisions = Object.entries(RESTOCK_ACTIONS).map(([action, rule]) => {
    let reason = '';
    if (!featureEnabled) reason = 'Restock workflow writes are disabled; review remains read-only.';
    else if (reconciliationRequired) reason = 'Receipt totals require reconciliation before another action.';
    else if (!canTransition) reason = 'Your current server authorization does not permit this transition.';
    else if (!rule.from.includes(current)) reason = `Action is not available from ${current || 'the current status'}.`;
    else if (rule.requiresPreferredQuote && !hasPreferredQuote)
      reason = 'Select one active preferred quote before this action.';
    return {
      action,
      label: rule.label,
      consequence: rule.consequence,
      targetStatus: rule.to,
      allowed: !reason,
      disabledReason: reason,
    };
  });
  const receivingStatus = ['TO_BE_PROCURED', 'PARTIALLY_RECEIVED'].includes(current);
  let receiveReason = '';
  if (!featureEnabled) receiveReason = 'Restock workflow writes are disabled; review remains read-only.';
  else if (reconciliationRequired) receiveReason = 'Receipt totals require reconciliation before another receipt.';
  else if (!canReceive) receiveReason = 'Your current server authorization does not permit receiving.';
  else if (!receivingStatus) receiveReason = 'Receiving is available only after procurement is authorized.';
  decisions.push({
    action: 'RECEIVE',
    label: 'Receive this line',
    consequence: 'Appends one immutable receipt and purchase-receipt ledger entry for this line only.',
    targetStatus: current === 'PARTIALLY_RECEIVED' ? 'PARTIALLY_RECEIVED_OR_RESTOCKED' : 'PARTIALLY_RECEIVED_OR_RESTOCKED',
    allowed: !receiveReason,
    disabledReason: receiveReason,
  });
  return decisions;
}

export function validateRestockTransition({
  status,
  action,
  reason,
  hasPreferredQuote = false,
  expectedRevision,
  currentRevision,
} = {}) {
  const normalizedAction = String(action ?? '').trim().toUpperCase();
  const rule = RESTOCK_ACTIONS[normalizedAction];
  if (!rule) return { valid: false, code: 'RESTOCK_ACTION_INVALID', message: 'Choose an approved restock action.' };
  const current = String(status ?? '').trim().toUpperCase();
  if (TERMINAL.includes(current) || !rule.from.includes(current))
    return { valid: false, code: 'INVALID_TRANSITION', message: `The action is not allowed from ${current || 'the current status'}.` };
  if (!String(reason ?? '').trim())
    return { valid: false, code: 'TRANSITION_REASON_REQUIRED', message: 'Record a reason for this restock action.' };
  if (rule.requiresPreferredQuote && !hasPreferredQuote)
    return { valid: false, code: 'PREFERRED_QUOTE_REQUIRED', message: 'Select one active preferred quote first.' };
  if (!Number.isInteger(Number(expectedRevision)) || Number(expectedRevision) !== Number(currentRevision))
    return { valid: false, code: 'REVISION_CONFLICT', message: 'The restock line changed. Refresh before acting.' };
  return { valid: true, action: normalizedAction, targetStatus: rule.to };
}

export function restockReceiptStatus({ requestedQuantity, receivedQuantity, receivedNow } = {}) {
  const required = Number(requestedQuantity);
  const total = Number(receivedQuantity || 0) + Number(receivedNow);
  if (!(required > 0) || !(Number(receivedNow) > 0))
    return { valid: false, code: 'VALIDATION_ERROR', message: 'Receipt quantity must be positive.' };
  if (total > required)
    return { valid: false, code: 'OVER_RECEIPT', message: 'Receipt exceeds the authorized line quantity.', total };
  return {
    valid: true,
    total,
    remaining: required - total,
    status: total === required ? 'RESTOCKED' : 'PARTIALLY_RECEIVED',
  };
}
