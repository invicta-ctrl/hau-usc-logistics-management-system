const QR_NAMESPACE = 'HAU-USC';
const QR_ENTITY_TYPE = 'ITEM';
const QR_VERSION = 'V1';
const QR_SEPARATOR = '|';
const MAX_ITEM_ID_LENGTH = 80;
const ITEM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export const INVENTORY_QR = Object.freeze({
  namespace: QR_NAMESPACE,
  entityType: QR_ENTITY_TYPE,
  version: QR_VERSION,
  separator: QR_SEPARATOR,
});

function failure(code, message) {
  return Object.freeze({ ok: false, code, message });
}

export function validateInventoryItemId(value) {
  const itemId = String(value ?? '').trim();
  if (!itemId) return failure('QR_ITEM_ID_REQUIRED', 'The inventory item ID is required.');
  if (itemId.length > MAX_ITEM_ID_LENGTH) {
    return failure('QR_ITEM_ID_TOO_LONG', 'The inventory item ID is too long.');
  }
  if (!ITEM_ID_PATTERN.test(itemId)) {
    return failure(
      'QR_ITEM_ID_INVALID',
      'The inventory item ID contains unsupported characters.',
    );
  }
  return Object.freeze({ ok: true, itemId });
}

export function buildInventoryQrPayload(itemIdValue) {
  const validated = validateInventoryItemId(itemIdValue);
  if (!validated.ok) {
    const error = new TypeError(validated.message);
    error.code = validated.code;
    throw error;
  }
  return [QR_NAMESPACE, QR_ENTITY_TYPE, validated.itemId, QR_VERSION].join(QR_SEPARATOR);
}

export function parseInventoryQrPayload(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return failure('QR_VALUE_REQUIRED', 'Scan or enter an inventory QR value.');

  const parts = raw.split(QR_SEPARATOR);
  if (parts.length !== 4) {
    return failure('QR_FORMAT_INVALID', 'This is not a supported HAU-USC inventory QR code.');
  }

  const [namespace, entityType, itemIdValue, version] = parts;
  if (namespace !== QR_NAMESPACE) {
    return failure('QR_NAMESPACE_UNSUPPORTED', 'This QR code was not issued by HAU-USC Logistics.');
  }
  if (entityType !== QR_ENTITY_TYPE) {
    return failure('QR_ENTITY_UNSUPPORTED', 'This QR code does not identify an inventory item.');
  }
  if (version !== QR_VERSION) {
    return failure('QR_VERSION_UNSUPPORTED', 'This inventory QR-code version is not supported.');
  }

  const validated = validateInventoryItemId(itemIdValue);
  if (!validated.ok) return validated;

  return Object.freeze({
    ok: true,
    source: 'qr',
    itemId: validated.itemId,
    payload: buildInventoryQrPayload(validated.itemId),
    version: QR_VERSION,
  });
}

export function parseInventoryQrInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return failure('QR_VALUE_REQUIRED', 'Scan or enter an inventory QR value.');
  if (raw.includes(QR_SEPARATOR)) return parseInventoryQrPayload(raw);

  const validated = validateInventoryItemId(raw);
  if (!validated.ok) return validated;
  return Object.freeze({
    ok: true,
    source: 'manual-item-id',
    itemId: validated.itemId,
    payload: buildInventoryQrPayload(validated.itemId),
    version: QR_VERSION,
  });
}
