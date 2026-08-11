const ROUTE_CAPABILITY = Object.freeze({
  REQUEST_REVIEW: 'request.review',
  REQUEST_MISSING_INFORMATION: 'request.missing_information',
  REQUEST_REJECT: 'request.reject',
  FULFILL_CANVASS: 'fulfillment.canvass',
  FULFILL_PROCURE: 'fulfillment.procure',
  FULFILL_RESERVE: 'fulfillment.reserve',
  FULFILL_RECEIVE: 'fulfillment.receive',
  FULFILL_RELEASE: 'fulfillment.release',
  LENDING_CREATE: 'lending.create',
  LENDING_APPROVE: 'lending.approve',
  LENDING_HANDOFF: 'lending.handoff',
  LENDING_RETURN: 'lending.return',
  INVENTORY_MERGE: 'inventory.merge_event_item',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_CLASSIFY: 'inventory.classify',
  EVENT_MANAGE: 'event.manage',
  CATALOG_MANAGE: 'reference.catalog.manage',
  VIEW_INTERNAL: 'view.internal',
});

const options = (...entries) => entries.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
const CLASSIFICATION_KIND_OPTIONS = options('UNVERIFIED', 'REUSABLE', 'CONSUMABLE');
const CONDITION_REVIEW_OPTIONS = options(
  'NOT_ASSESSED',
  'NOT_APPLICABLE',
  'NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
);
const MAINTENANCE_REVIEW_OPTIONS = options(
  'NOT_ASSESSED',
  'NOT_APPLICABLE',
  'CLEARED',
  'MAINTENANCE_REQUIRED',
);
const LENDING_AUDIENCE_OPTIONS = options(
  'NOT_AVAILABLE_FOR_LENDING',
  'USC_STAFF_ONLY',
  'STUDENTS_AND_STAFF',
  'DOL_INTERNAL_ONLY',
);

const text = (value) => String(value ?? '').trim();
const currentRoute = () => text(globalThis.location?.hash).replace(/^#\/?/u, '') || 'index';
const recordId = (record) =>
  text(
    record?.id ??
      record?.requestId ??
      record?.requestLineId ??
      record?.ticketId ??
      record?.itemId ??
      record?.restockId ??
      record?.restockRequestId ??
      record?.deliverableId ??
      record?.eventSeriesId ??
      record?.eventDayId ??
      record?.activityId ??
      record?.eventId,
  );

function values(source) {
  if (source instanceof Set) return source;
  return new Set(Array.isArray(source) ? source : []);
}

function clientRequestId(action) {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error('A strong client request identifier could not be created.');
  return `${action}:${id}`;
}

function collection(state, ...names) {
  for (const name of names) if (Array.isArray(state?.[name])) return state[name];
  return [];
}

function selectedValue(selection, ...names) {
  for (const name of names) {
    const value = selection?.[name];
    if (value && typeof value === 'object') return recordId(value);
    if (text(value)) return text(value);
  }
  return '';
}

function selectedRecord(state, selection, listNames, selectionNames) {
  for (const name of selectionNames) {
    const candidate = selection?.[name];
    if (candidate && typeof candidate === 'object') return candidate;
  }
  const id = selectedValue(selection, ...selectionNames);
  if (!id) return null;
  return collection(state, ...listNames).find((entry) => recordId(entry) === id) ?? null;
}

function optionRows(records, label) {
  return records
    .map((record) => ({
      value: recordId(record),
      label: text(label?.(record)) || recordId(record),
    }))
    .filter((entry) => entry.value);
}

const field = (name, label, options = {}) => ({ name, label, ...options });

function contextFor(state, selection) {
  const request = selectedRecord(
    state,
    selection,
    ['requests'],
    ['request', 'selectedRequest', 'requestId', 'selectedRequestId'],
  );
  const lending = selectedRecord(
    state,
    selection,
    ['lendingTickets', 'loans'],
    ['lending', 'loan', 'ticket', 'lendingTicketId', 'ticketId', 'loanId', 'selectedLoanId'],
  );
  const item = selectedRecord(
    state,
    selection,
    ['inventoryItems'],
    ['inventoryItem', 'item', 'inventoryId', 'itemId', 'selectedInventoryId'],
  );
  const restock = selectedRecord(
    state,
    selection,
    ['restockRequests'],
    ['restock', 'restockId', 'restockRequestId', 'selectedRestockId'],
  );
  const deliverable = selectedRecord(
    state,
    selection,
    ['deliverables'],
    ['deliverable', 'deliverableId', 'selectedDeliverableId'],
  );
  const release = selectedRecord(
    state,
    selection,
    ['releaseConfirmations', 'releaseRecords'],
    ['release', 'releaseConfirmationId', 'selectedReleaseConfirmationId'],
  );
  const series = selectedRecord(
    state,
    selection,
    ['eventSeries'],
    ['eventSeries', 'series', 'eventSeriesId', 'selectedEventSeriesId'],
  );
  const day = selectedRecord(
    state,
    selection,
    ['eventDays'],
    ['eventDay', 'day', 'eventDayId', 'selectedEventDayId'],
  );
  const activity = selectedRecord(
    state,
    selection,
    ['events', 'eventActivities'],
    ['activity', 'event', 'activityId', 'eventId', 'selectedActivityId'],
  );
  return { state, selection, request, lending, item, restock, deliverable, release, series, day, activity };
}

function requestForms(context) {
  const { request, state } = context;
  if (!request) return [];
  const requestId = recordId(request);
  const lines = collection(state, 'requestLines').filter(
    (line) => text(line.requestId ?? line.request_id) === requestId,
  );
  return [
    {
      id: 'request-review',
      title: 'Submit explicit line review',
      capability: ROUTE_CAPABILITY.REQUEST_REVIEW,
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        ...lines.map((line, index) => {
          const options = [];
          if (text(line.itemId ?? line.item_id))
            options.push({ value: 'ISSUE_FROM_STOCK', label: 'Issue from stock' });
          if (text(request.requestType ?? request.request_type) !== 'CATALOG_RESTOCK') {
            options.push({ value: 'PROCUREMENT', label: 'Procurement' });
          }
          if (
            text(line.itemId ?? line.item_id) &&
            (text(request.requestType ?? request.request_type) === 'CATALOG_RESTOCK' ||
              text(request.ownerCommitteeId ?? request.owner_committee_id) === 'COM_INVENTORY_PANTRY')
          ) {
            options.push({ value: 'RESTOCK', label: 'Restock' });
          }
          options.push(
            { value: 'MISSING_INFORMATION', label: 'Missing information' },
            { value: 'REJECT', label: 'Reject line' },
          );
          return field(`lineDecision${index}`, text(line.description ?? line.itemName ?? recordId(line)), {
            kind: 'select',
            required: true,
            options,
          });
        }),
        field('note', 'Review note', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: (data) => ({
        method: 'reviewRequest',
        args: [
          requestId,
          'ACCEPT',
          text(data.note),
          lines.map((line, index) => ({
            lineId: recordId(line),
            decision: data[`lineDecision${index}`],
          })),
        ],
      }),
    },
    {
      id: 'request-information',
      title: 'Ask for information',
      capability: ROUTE_CAPABILITY.REQUEST_MISSING_INFORMATION,
      capabilities: [ROUTE_CAPABILITY.REQUEST_REVIEW, ROUTE_CAPABILITY.REQUEST_MISSING_INFORMATION],
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        field('note', 'Information required', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: ({ note }) => ({ method: 'reviewRequest', args: [requestId, 'MISSING_INFORMATION', note] }),
    },
    {
      id: 'request-reject',
      title: 'Reject request',
      capability: ROUTE_CAPABILITY.REQUEST_REJECT,
      capabilities: [ROUTE_CAPABILITY.REQUEST_REVIEW, ROUTE_CAPABILITY.REQUEST_REJECT],
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        field('note', 'Rejection reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: ({ note }) => ({ method: 'reviewRequest', args: [requestId, 'REJECT', note] }),
    },
    {
      id: 'request-reserve',
      title: 'Reserve approved stock',
      capability: ROUTE_CAPABILITY.FULFILL_RESERVE,
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        field('requestLineId', 'Approved request line', {
          kind: 'select',
          required: true,
          options: optionRows(
            lines.filter((line) => text(line.itemId ?? line.item_id)),
            (line) =>
              `${recordId(line)} - ${text(line.description ?? line.itemName ?? line.itemId ?? line.item_id)}`,
          ),
        }),
        field('quantity', 'Quantity to reserve', { kind: 'number', required: true, min: 0.01, step: 'any' }),
      ],
      invoke: ({ requestLineId, quantity }) => {
        const line = lines.find((entry) => recordId(entry) === requestLineId);
        if (!line) throw new Error('Choose a current request line.');
        const itemId = text(line.itemId ?? line.item_id);
        if (!itemId) throw new Error('The selected request line has no authoritative inventory item.');
        return {
          method: 'reserveStock',
          args: [itemId, quantity, { requestId, requestLineId }],
        };
      },
    },
  ].filter((definition) => definition.id !== 'request-review' || lines.length > 0);
}

function lendingCreateForm(context) {
  const items = collection(context.state, 'inventoryItems').filter(
    (item) => item.isLendable !== false && text(item.status ?? 'ACTIVE') !== 'ARCHIVED',
  );
  return {
    id: 'lending-create',
    title: 'Create internal lending ticket',
    capability: ROUTE_CAPABILITY.LENDING_CREATE,
    fields: [
      field('itemId', 'Inventory item', {
        kind: 'select',
        required: true,
        options: optionRows(items, (item) => `${text(item.name ?? item.itemName)} - ${recordId(item)}`),
      }),
      field('borrowerName', 'Borrower name', { required: true, maxLength: 120 }),
      field('borrowerType', 'Borrower type', {
        kind: 'select',
        required: true,
        options: [
          { value: 'ANGELITE', label: 'Angelite student' },
          { value: 'USC_STAFF', label: 'USC staff or officer' },
        ],
      }),
      field('studentIdNumber', 'Student or account reference', { required: true, maxLength: 8 }),
      field('department', 'Department or organization', { required: true, maxLength: 120 }),
      field('contact', 'Contact', { required: true, maxLength: 120 }),
      field('quantity', 'Quantity', { kind: 'number', required: true, min: 0.01, step: 'any' }),
      field('ticketType', 'Ticket type', {
        kind: 'select',
        required: true,
        options: [
          { value: 'LOAN', label: 'Reusable loan' },
          { value: 'CONSUMABLE', label: 'Consumable issue' },
        ],
      }),
      field('purpose', 'Purpose', { kind: 'textarea', required: true, maxLength: 500 }),
      field('dueAt', 'Due date or time', { kind: 'datetime-local' }),
      field('notes', 'Notes', { kind: 'textarea', maxLength: 500 }),
    ],
    invoke: (data) => {
      const item = items.find((entry) => recordId(entry) === data.itemId);
      const unit = text(item?.unit ?? item?.lendingUnit ?? item?.lending_unit);
      if (!item || !unit) throw new Error('Choose an inventory item with a current lending unit.');
      return {
        method: 'createLendingTicket',
        payload: { ...data, unit, clientRequestId: clientRequestId('lending-create') },
      };
    },
  };
}

function lendingDetailForms(context) {
  const ticket = context.lending;
  if (!ticket) return [];
  const ticketId = recordId(ticket);
  const ticketQuantity = Number(ticket.quantity ?? ticket.approvedQuantity ?? 0) || '';
  const inventoryItems = collection(context.state, 'inventoryItems');
  const assets = collection(context.state, 'inventoryAssetInstances', 'assetInstances');
  return [
    {
      id: 'lending-approve',
      title: 'Review lending ticket',
      capability: ROUTE_CAPABILITY.LENDING_APPROVE,
      fields: [
        field('ticketId', 'Lending ticket', { value: ticketId, readonly: true, required: true }),
        field('decision', 'Decision', {
          kind: 'select',
          required: true,
          options: ['APPROVE', 'PARTIAL_APPROVE', 'SUBSTITUTE', 'REJECT'].map((value) => ({
            value,
            label: value.replaceAll('_', ' '),
          })),
        }),
        field('approvedQuantity', 'Approved quantity', {
          kind: 'number',
          value: ticketQuantity,
          required: true,
          min: 0.01,
          step: 'any',
        }),
        field('substitutionItemId', 'Substitution item', {
          kind: 'select',
          options: optionRows(inventoryItems, (item) => `${text(item.name)} - ${recordId(item)}`),
        }),
        field('assetIds', 'Assigned asset IDs', {
          hint: 'Enter one current asset ID per line.',
          kind: 'textarea',
          list: true,
        }),
        field('identityVerified', 'Borrower identity verified', { kind: 'checkbox', required: true }),
        field('identityVerificationSource', 'Identity verification source', {
          required: true,
          maxLength: 120,
        }),
        field('reviewReason', 'Reason for partial, substitute, or reject', {
          kind: 'textarea',
          maxLength: 500,
        }),
        field('reviewNotes', 'Review notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: ({ ticketId: ignored, ...details }) => {
        void ignored;
        if (details.decision !== 'APPROVE' && !text(details.reviewReason)) {
          throw new Error('A review reason is required for this decision.');
        }
        return { method: 'approveLendingTicket', args: [ticketId, details] };
      },
    },
    {
      id: 'lending-handoff',
      title: 'Confirm physical handoff',
      capability: ROUTE_CAPABILITY.LENDING_HANDOFF,
      fields: [
        field('ticketId', 'Lending ticket', { value: ticketId, readonly: true, required: true }),
        field('conditionLabel', 'Condition at handoff', { required: true, maxLength: 80 }),
        field('notes', 'Handoff notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: ({ ticketId: ignored, ...details }) => {
        void ignored;
        return { method: 'confirmLoanHandoff', args: [ticketId, details] };
      },
    },
    {
      id: 'lending-return',
      title: 'Record return',
      capability: ROUTE_CAPABILITY.LENDING_RETURN,
      fields: [
        field('ticketId', 'Lending ticket', { value: ticketId, readonly: true, required: true }),
        field('returnedQuantity', 'Returned quantity', {
          kind: 'number',
          value: ticketQuantity,
          required: true,
          min: 0,
          step: 'any',
        }),
        field('lostQuantity', 'Lost quantity', {
          kind: 'number',
          value: 0,
          required: true,
          min: 0,
          step: 'any',
        }),
        field('damagedBeyondUseQuantity', 'Damaged beyond use', {
          kind: 'number',
          value: 0,
          required: true,
          min: 0,
          step: 'any',
        }),
        field('conditionLabel', 'Return condition', { required: true, maxLength: 80 }),
        field('evidenceId', 'Stored return evidence ID', { required: true, maxLength: 100 }),
        field('notes', 'Inspection notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: ({ ticketId: ignored, ...details }) => {
        void ignored;
        const total = details.returnedQuantity + details.lostQuantity + details.damagedBeyondUseQuantity;
        if (ticketQuantity !== '' && Math.abs(total - Number(ticketQuantity)) > 0.000001) {
          throw new Error('Returned, lost, and damaged quantities must equal the current ticket quantity.');
        }
        if ((details.lostQuantity || details.damagedBeyondUseQuantity) && !text(details.notes)) {
          throw new Error('Inspection notes are required for lost or damaged items.');
        }
        return { method: 'confirmReturn', args: [ticketId, details] };
      },
    },
    {
      id: 'asset-register',
      title: 'Register traceable asset',
      capability: ROUTE_CAPABILITY.LENDING_APPROVE,
      fields: [
        field('itemId', 'Inventory item', {
          value: text(ticket.itemId ?? ticket.item_id),
          readonly: true,
          required: true,
        }),
        field('assetTag', 'Asset tag', { required: true, maxLength: 80 }),
        field('serialNumber', 'Serial number', { maxLength: 120 }),
        field('conditionLabel', 'Condition', {
          kind: 'select',
          required: true,
          options: ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map((value) => ({ value, label: value })),
        }),
        field('notes', 'Registration notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'registerInventoryAsset', direct: true, payload }),
    },
    {
      id: 'asset-maintenance',
      title: 'Record asset maintenance',
      capability: ROUTE_CAPABILITY.LENDING_RETURN,
      fields: [
        field('assetId', 'Asset instance', {
          kind: 'select',
          required: true,
          options: optionRows(assets, (asset) => text(asset.assetTag ?? asset.asset_tag ?? recordId(asset))),
        }),
        field('eventType', 'Maintenance event', {
          kind: 'select',
          required: true,
          options: ['OPENED', 'INSPECTED', 'REPAIRED', 'COMPLETED', 'DECLARED_DAMAGED'].map((value) => ({
            value,
            label: value.replaceAll('_', ' '),
          })),
        }),
        field('conditionLabel', 'Condition after event', { maxLength: 24 }),
        field('evidenceAssetKey', 'Stored evidence reference', { maxLength: 160 }),
        field('notes', 'Maintenance notes', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'recordAssetMaintenance', direct: true, payload }),
    },
  ];
}

function releaseForms(context) {
  const request = context.request;
  const requestId = recordId(request) || selectedValue(context.selection, 'releaseId', 'selectedReleaseId');
  if (!requestId) return [];
  const lines = collection(context.state, 'requestLines').filter(
    (line) => text(line.requestId ?? line.request_id) === requestId,
  );
  const forms = [
    {
      id: 'release-confirm',
      title: 'Record physical release',
      capability: ROUTE_CAPABILITY.FULFILL_RELEASE,
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        field('requestLineId', 'Ready release line', {
          kind: 'select',
          required: true,
          options: optionRows(
            lines,
            (line) => `${recordId(line)} - ${text(line.description ?? line.itemName)}`,
          ),
        }),
        field('quantity', 'Quantity released now', {
          kind: 'number',
          required: true,
          min: 0.01,
          step: 'any',
        }),
        field('recipientName', 'Recipient name', { required: true, maxLength: 120 }),
        field('recipientRole', 'Recipient role', { required: true, maxLength: 120 }),
        field('department', 'Department', { required: true, maxLength: 120 }),
        field('evidenceId', 'Stored handoff evidence ID', { required: true, maxLength: 100 }),
        field('recipientConfirmed', 'Recipient confirmed the handoff', { kind: 'checkbox', required: true }),
        field('notes', 'Release notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: ({ requestLineId, quantity, ...data }) => ({
        method: 'confirmRelease',
        payload: {
          ...data,
          requestId,
          lines: [{ requestLineId, quantity }],
          clientRequestId: clientRequestId('release'),
        },
      }),
    },
  ];
  const role = text(context.state?.role ?? context.state?.currentUser?.roleId).toUpperCase();
  if (role === 'SYSTEM_OWNER' && context.release) {
    forms.push({
      id: 'release-correct',
      title: 'Post compensating release correction',
      capability: ROUTE_CAPABILITY.FULFILL_RELEASE,
      fields: [
        field('releaseConfirmationId', 'Release confirmation', {
          value: recordId(context.release),
          readonly: true,
          required: true,
        }),
        field('quantity', 'Correction quantity', { kind: 'number', required: true, min: 0.01, step: 'any' }),
        field('reason', 'Correction reason', { kind: 'textarea', required: true, maxLength: 500 }),
        field('evidenceId', 'Stored correction evidence ID', { required: true, maxLength: 100 }),
        field('correctionConfirmed', 'Confirm append-only correction', { kind: 'checkbox', required: true }),
      ],
      invoke: (payload) => ({ method: 'correctRelease', payload }),
    });
  }
  return forms;
}

function inventoryCatalogForms(context) {
  const pending = collection(context.state, 'inventoryItems').filter(
    (item) => text(item.classificationStatus ?? item.classification_status) === 'NEEDS_CLASSIFICATION',
  );
  return [
    {
      id: 'inventory-create',
      title: 'Create inventory catalog item',
      capability: ROUTE_CAPABILITY.CATALOG_MANAGE,
      fields: [
        field('itemName', 'Item name', { required: true, maxLength: 240 }),
        field('category', 'Category', { required: true, maxLength: 120 }),
        field('stockArea', 'Stock area', { required: true, maxLength: 120 }),
        field('storageLocation', 'Storage location', { required: true, maxLength: 160 }),
        field('handling', 'Handling', { required: true, maxLength: 80 }),
        field('unit', 'Quantity unit', { required: true, maxLength: 40 }),
        field('initialQuantity', 'Initial quantity', { kind: 'number', required: true, min: 0, step: 'any' }),
        field('reason', 'Creation reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'createInventoryItem', payload }),
    },
    {
      id: 'inventory-bulk-classify',
      title: 'Classify a verified similar group',
      capability: ROUTE_CAPABILITY.INVENTORY_CLASSIFY,
      fields: [
        field('itemIds', 'Inventory item IDs', {
          kind: 'select-multiple-source',
          list: true,
          required: true,
          options: optionRows(pending, (item) => `${text(item.name)} - ${recordId(item)}`),
          hint: 'Enter two or more current item IDs, one per line.',
        }),
        field('inventoryKind', 'Inventory kind', {
          kind: 'select',
          required: true,
          options: CLASSIFICATION_KIND_OPTIONS,
        }),
        field('classificationStatus', 'Classification status', {
          kind: 'select',
          required: true,
          options: [
            { value: 'CLASSIFIED', label: 'Classified' },
            { value: 'NEEDS_CLASSIFICATION', label: 'Needs classification' },
          ],
        }),
        field('conditionReviewState', 'Condition review state', {
          kind: 'select',
          required: true,
          options: CONDITION_REVIEW_OPTIONS,
        }),
        field('maintenanceReviewState', 'Maintenance review state', {
          kind: 'select',
          required: true,
          options: MAINTENANCE_REVIEW_OPTIONS,
        }),
        field('lendingAudience', 'Lending audience', {
          kind: 'select',
          required: true,
          options: LENDING_AUDIENCE_OPTIONS,
        }),
        field('isLendable', 'Enable lending', { kind: 'checkbox' }),
        field('enableLendingConfirmed', 'Confirm governed lending eligibility', { kind: 'checkbox' }),
        field('classificationNotes', 'Classification notes', {
          kind: 'textarea',
          required: true,
          maxLength: 1000,
        }),
        field('reason', 'Bulk classification reason', { kind: 'textarea', required: true, maxLength: 1000 }),
        field('similarityConfirmed', 'Confirm these items share the same classification', {
          kind: 'checkbox',
          required: true,
        }),
      ],
      invoke: ({ itemIds, reason, similarityConfirmed, ...classification }) => {
        if (itemIds.length < 2) throw new Error('Choose at least two current inventory items.');
        return {
          method: 'bulkClassifyInventoryItems',
          payload: {
            items: itemIds.map((itemId) => {
              const current = pending.find((item) => recordId(item) === itemId);
              if (!current)
                throw new Error(`Inventory item ${itemId} is not in the current classification queue.`);
              const expectedRevision = Number(
                current.classificationRevision ?? current.classification_revision,
              );
              if (!Number.isInteger(expectedRevision)) {
                throw new Error(`Inventory item ${itemId} has no current classification revision.`);
              }
              return { itemId, expectedRevision, ...classification };
            }),
            reason,
            similarityConfirmed,
          },
        };
      },
    },
  ];
}

function inventoryItemForms(context) {
  const item = context.item;
  if (!item) return [];
  const itemId = recordId(item);
  const base = [field('itemId', 'Inventory item', { value: itemId, readonly: true, required: true })];
  const status = text(item.status).toUpperCase();
  return [
    {
      id: 'inventory-update',
      title: 'Update catalog details',
      capability: ROUTE_CAPABILITY.CATALOG_MANAGE,
      fields: [
        ...base,
        field('itemName', 'Item name', {
          value: text(item.name ?? item.itemName),
          required: true,
          maxLength: 240,
        }),
        field('category', 'Category', { value: text(item.category), required: true, maxLength: 120 }),
        field('handling', 'Handling', { value: text(item.handling), required: true, maxLength: 80 }),
        field('unit', 'Quantity unit', { value: text(item.unit), required: true, maxLength: 40 }),
        field('reason', 'Update reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'updateInventoryItem', payload }),
    },
    {
      id: 'inventory-storage',
      title: 'Update storage context',
      capability: ROUTE_CAPABILITY.CATALOG_MANAGE,
      fields: [
        ...base,
        field('stockArea', 'Stock area', {
          value: text(item.stockArea ?? item.stock_area ?? item.area),
          required: true,
          maxLength: 120,
        }),
        field('storageLocation', 'Storage location', {
          value: text(item.storageLocation ?? item.storage_location ?? item.storage),
          required: true,
          maxLength: 160,
        }),
        field('reason', 'Storage change reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'updateInventoryStorageContext', payload }),
    },
    {
      id: 'inventory-lifecycle',
      title: status === 'ARCHIVED' ? 'Restore catalog item' : 'Archive catalog item',
      capability: ROUTE_CAPABILITY.CATALOG_MANAGE,
      fields: [
        ...base,
        field('reason', status === 'ARCHIVED' ? 'Restore reason' : 'Archive reason', {
          kind: 'textarea',
          required: true,
          maxLength: 500,
        }),
      ],
      invoke: ({ itemId: ignored, ...options }) => {
        void ignored;
        return {
          method: status === 'ARCHIVED' ? 'restoreInventoryItem' : 'archiveInventoryItem',
          args: [itemId, options],
        };
      },
    },
    {
      id: 'inventory-classify',
      title: 'Classify inventory item',
      capability: ROUTE_CAPABILITY.INVENTORY_CLASSIFY,
      fields: [
        ...base,
        field('expectedRevision', 'Current classification revision', {
          value: item.classificationRevision ?? item.classification_revision,
          readonly: true,
          required: true,
          kind: 'number',
        }),
        field('inventoryKind', 'Inventory kind', {
          kind: 'select',
          required: true,
          value: text(item.inventoryKind ?? item.inventory_kind),
          options: CLASSIFICATION_KIND_OPTIONS,
        }),
        field('classificationStatus', 'Classification status', {
          kind: 'select',
          required: true,
          value: text(item.classificationStatus ?? item.classification_status),
          options: [
            { value: 'CLASSIFIED', label: 'Classified' },
            { value: 'NEEDS_CLASSIFICATION', label: 'Needs classification' },
          ],
        }),
        field('conditionReviewState', 'Condition review state', {
          kind: 'select',
          required: true,
          value: text(item.conditionReviewState ?? item.condition_review_state),
          options: CONDITION_REVIEW_OPTIONS,
        }),
        field('maintenanceReviewState', 'Maintenance review state', {
          kind: 'select',
          required: true,
          value: text(item.maintenanceReviewState ?? item.maintenance_review_state),
          options: MAINTENANCE_REVIEW_OPTIONS,
        }),
        field('lendingAudience', 'Lending audience', {
          kind: 'select',
          required: true,
          value: text(item.lendingAudience ?? item.lending_audience),
          options: LENDING_AUDIENCE_OPTIONS,
        }),
        field('isLendable', 'Enable lending', { kind: 'checkbox' }),
        field('enableLendingConfirmed', 'Confirm governed lending eligibility', { kind: 'checkbox' }),
        field('classificationNotes', 'Classification notes', {
          kind: 'textarea',
          required: true,
          maxLength: 1000,
        }),
      ],
      invoke: (payload) => ({ method: 'classifyInventoryItem', payload }),
    },
    {
      id: 'inventory-cycle-count',
      title: 'Post cycle-count adjustment',
      capability: ROUTE_CAPABILITY.INVENTORY_ADJUST,
      fields: [
        ...base,
        field('countedQuantity', 'Physical counted quantity', {
          kind: 'number',
          required: true,
          min: 0,
          step: 'any',
        }),
        field('reason', 'Adjustment reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'postCycleCountAdjustment', direct: true, payload }),
    },
  ];
}

function restockForms(context) {
  const restock = context.restock;
  const id = recordId(restock);
  if (!restock || !id) return [];
  const revision = restock.revision ?? restock.expectedRevision;
  return [
    {
      id: 'restock-transition',
      title: 'Advance restock workflow',
      capability: ROUTE_CAPABILITY.FULFILL_PROCURE,
      fields: [
        field('restockId', 'Restock request', { value: id, readonly: true, required: true }),
        field('expectedRevision', 'Current revision', {
          value: revision,
          readonly: true,
          required: true,
          kind: 'number',
        }),
        field('action', 'Workflow action', { required: true, maxLength: 40 }),
        field('reason', 'Transition reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'transitionRestock', payload }),
    },
    {
      id: 'restock-receive',
      title: 'Record restock receipt',
      capability: ROUTE_CAPABILITY.FULFILL_RECEIVE,
      fields: [
        field('restockId', 'Restock request', { value: id, readonly: true, required: true }),
        field('quantity', 'Quantity received now', {
          kind: 'number',
          required: true,
          min: 0.01,
          step: 'any',
        }),
        field('unit', 'Approved unit', { value: text(restock.unit), readonly: true, required: true }),
        field('evidenceId', 'Stored receipt evidence ID', { required: true, maxLength: 100 }),
        field('invoiceStatus', 'Invoice status', { maxLength: 80 }),
        field('invoiceNumber', 'Invoice number', { maxLength: 120 }),
        field('notes', 'Receiving notes', { kind: 'textarea', maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'receiveRestock', payload }),
    },
  ];
}

function procurementForms(context) {
  const deliverables = collection(context.state, 'deliverables');
  const canvasses = collection(context.state, 'canvassReferences');
  const eventItems = deliverables.filter((entry) => text(entry.eventItemId ?? entry.event_item_id));
  const forms = [
    {
      id: 'canvass-create',
      title: 'Record canvass reference',
      capability: ROUTE_CAPABILITY.FULFILL_CANVASS,
      fields: [
        field('linkedRequestLineId', 'Linked request line ID', { maxLength: 80 }),
        field('linkedDeliverableId', 'Linked deliverable ID', { maxLength: 80 }),
        field('linkedRestockId', 'Linked restock ID', { maxLength: 80 }),
        field('supplierId', 'Existing supplier ID', { maxLength: 80 }),
        field('supplierName', 'Supplier name', { required: true, maxLength: 160 }),
        field('itemSpec', 'Item specification', { kind: 'textarea', required: true, maxLength: 500 }),
        field('price', 'Quoted price', { kind: 'number', required: true, min: 0.01, step: 'any' }),
        field('unit', 'Quote unit', { required: true, maxLength: 40 }),
        field('checkedAt', 'Checked at', { kind: 'datetime-local', required: true }),
        field('sourceUrl', 'Source URL', { kind: 'url' }),
        field('evidenceId', 'Stored quote evidence ID', { required: true, maxLength: 100 }),
        field('notes', 'Canvass notes', { kind: 'textarea', maxLength: 1000 }),
      ],
      invoke: (payload) => {
        const links = [
          payload.linkedRequestLineId,
          payload.linkedDeliverableId,
          payload.linkedRestockId,
        ].filter(Boolean);
        if (links.length !== 1)
          throw new Error('Choose exactly one current request line, deliverable, or restock link.');
        return { method: 'saveCanvassReference', payload };
      },
    },
    {
      id: 'canvass-preferred',
      title: 'Select preferred canvass',
      capability: ROUTE_CAPABILITY.FULFILL_PROCURE,
      fields: [
        field('canvassId', 'Canvass record', {
          kind: 'select',
          required: true,
          options: optionRows(
            canvasses,
            (entry) => `${text(entry.supplierName ?? entry.supplier)} - ${recordId(entry)}`,
          ),
        }),
        field('rationale', 'Selection rationale', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'selectPreferredCanvass', payload }),
    },
  ];
  const deliverable = context.deliverable;
  if (deliverable) {
    const deliverableId = recordId(deliverable);
    forms.push(
      {
        id: 'deliverable-transition',
        title: 'Advance deliverable workflow',
        capability: ROUTE_CAPABILITY.FULFILL_PROCURE,
        fields: [
          field('deliverableId', 'Deliverable', { value: deliverableId, readonly: true, required: true }),
          field('status', 'Target status', { required: true, maxLength: 40 }),
          field('reason', 'Transition reason', { kind: 'textarea', required: true, maxLength: 500 }),
        ],
        invoke: (payload) => ({ method: 'transitionDeliverable', payload }),
      },
      {
        id: 'deliverable-receive',
        title: 'Record deliverable receipt',
        capability: ROUTE_CAPABILITY.FULFILL_RECEIVE,
        fields: [
          field('deliverableId', 'Deliverable', { value: deliverableId, readonly: true, required: true }),
          field('quantity', 'Quantity received now', {
            kind: 'number',
            required: true,
            min: 0.01,
            step: 'any',
          }),
          field('unit', 'Approved unit', { value: text(deliverable.unit), readonly: true, required: true }),
          field('evidenceId', 'Stored delivery evidence ID', { required: true, maxLength: 100 }),
          field('notes', 'Receiving notes', { kind: 'textarea', maxLength: 500 }),
        ],
        invoke: (payload) => ({ method: 'receiveDeliverable', payload }),
      },
    );
  }
  if (eventItems.length) {
    forms.push({
      id: 'event-item-transfer',
      title: 'Transfer event item to inventory',
      capability: ROUTE_CAPABILITY.INVENTORY_MERGE,
      fields: [
        field('deliverableId', 'Event deliverable', {
          kind: 'select',
          required: true,
          options: optionRows(
            eventItems,
            (entry) => `${text(entry.description ?? entry.itemName)} - ${recordId(entry)}`,
          ),
        }),
        field('destinationItemId', 'Destination inventory item ID', { required: true, maxLength: 80 }),
        field('quantity', 'Quantity to transfer', { kind: 'number', required: true, min: 0.01, step: 'any' }),
        field('unit', 'Matching unit', { required: true, maxLength: 40 }),
        field('handling', 'Matching handling', { required: true, maxLength: 80 }),
        field('mergeReason', 'Semantic merge reason', { kind: 'textarea', required: true, maxLength: 500 }),
        field('semanticConfirmed', 'Confirm the source and destination are semantically identical', {
          kind: 'checkbox',
          required: true,
        }),
      ],
      invoke: (payload) => ({ method: 'transferEventItemToInventory', payload }),
    });
  }
  return forms;
}

function eventForms(context) {
  const seriesRows = collection(context.state, 'eventSeries');
  const dayRows = collection(context.state, 'eventDays');
  const activityRows = collection(context.state, 'events', 'eventActivities');
  const series = context.series;
  const day = context.day;
  const activity = context.activity;
  return [
    {
      id: 'event-series-save',
      title: series ? 'Update event series' : 'Create event series',
      capability: ROUTE_CAPABILITY.EVENT_MANAGE,
      fields: [
        ...(series
          ? [
              field('eventSeriesId', 'Event series', {
                value: recordId(series),
                readonly: true,
                required: true,
              }),
              field('expectedRevision', 'Current revision', {
                value: series.revision,
                readonly: true,
                required: true,
                kind: 'number',
              }),
            ]
          : []),
        field('name', 'Series name', { value: text(series?.name), required: true, maxLength: 200 }),
        field('year', 'Series year', {
          value: series?.year ?? '',
          kind: 'number',
          required: true,
          min: 2000,
          max: 2200,
        }),
        field('status', 'Status', {
          kind: 'select',
          required: true,
          value: text(series?.status),
          options: ['ACTIVE', 'ARCHIVED'].map((value) => ({ value, label: value })),
        }),
        field('reason', 'Change reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'saveEventSeries', payload }),
    },
    {
      id: 'event-day-save',
      title: day ? 'Update event day' : 'Create event day',
      capability: ROUTE_CAPABILITY.EVENT_MANAGE,
      fields: [
        ...(day
          ? [
              field('eventDayId', 'Event day', { value: recordId(day), readonly: true, required: true }),
              field('expectedRevision', 'Current revision', {
                value: day.revision,
                readonly: true,
                required: true,
                kind: 'number',
              }),
            ]
          : []),
        field('eventSeriesId', 'Event series', {
          kind: 'select',
          required: true,
          value: text(day?.eventSeriesId ?? day?.event_series_id),
          options: optionRows(seriesRows, (entry) => text(entry.name ?? recordId(entry))),
        }),
        field('name', 'Event day name', { value: text(day?.name), required: true, maxLength: 200 }),
        field('date', 'Event date', {
          value: text(day?.date ?? day?.eventDate ?? day?.event_date),
          kind: 'date',
          required: true,
        }),
        field('status', 'Status', {
          kind: 'select',
          required: true,
          value: text(day?.status),
          options: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].map((value) => ({
            value,
            label: value,
          })),
        }),
        field('reason', 'Change reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'saveEventDay', payload }),
    },
    {
      id: 'event-activity-save',
      title: activity ? 'Update event activity' : 'Create event activity',
      capability: ROUTE_CAPABILITY.EVENT_MANAGE,
      fields: [
        ...(activity
          ? [
              field('activityId', 'Activity', { value: recordId(activity), readonly: true, required: true }),
              field('expectedRevision', 'Current revision', {
                value: activity.revision,
                readonly: true,
                required: true,
                kind: 'number',
              }),
            ]
          : []),
        field('eventDayId', 'Event day', {
          kind: 'select',
          required: true,
          value: text(activity?.eventDayId ?? activity?.event_day_id),
          options: optionRows(dayRows, (entry) => text(entry.name ?? entry.date ?? recordId(entry))),
        }),
        field('name', 'Activity name', { value: text(activity?.name), required: true, maxLength: 240 }),
        field('activityType', 'Activity type', {
          value: text(activity?.activityType),
          required: true,
          maxLength: 120,
        }),
        field('venue', 'Venue', { value: text(activity?.venue), required: true, maxLength: 240 }),
        field('timeStatus', 'Time status', {
          kind: 'select',
          required: true,
          value: text(activity?.timeStatus ?? activity?.time_status),
          options: ['TBA', 'SCHEDULED'].map((value) => ({ value, label: value })),
        }),
        field('startAt', 'Starts at', {
          kind: 'datetime-local',
          value: text(activity?.startAt ?? activity?.starts_at),
        }),
        field('endAt', 'Ends at', {
          kind: 'datetime-local',
          value: text(activity?.endAt ?? activity?.ends_at),
        }),
        field('includedItems', 'Included items', {
          kind: 'textarea',
          list: true,
          hint: 'One item per line.',
        }),
        field('reason', 'Change reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method: 'saveEventActivity', payload }),
    },
    {
      id: 'event-link',
      title: 'Link operational record',
      capability: ROUTE_CAPABILITY.EVENT_MANAGE,
      fields: [
        field('activityId', 'Event activity', {
          kind: 'select',
          required: true,
          value: recordId(activity),
          options: optionRows(activityRows, (entry) => text(entry.name ?? recordId(entry))),
        }),
        field('linkType', 'Operational record type', {
          kind: 'select',
          required: true,
          options: options(
            'REQUEST',
            'FOOD_REQUIREMENT',
            'MATERIAL',
            'PROCUREMENT',
            'INVENTORY_REQUIREMENT',
            'RELEASE',
          ),
        }),
        field('linkedEntityId', 'Current record ID', { required: true, maxLength: 100 }),
        field('reason', 'Link reason', { kind: 'textarea', required: true, maxLength: 500 }),
        field('notes', 'Link notes', { kind: 'textarea', maxLength: 1000 }),
      ],
      invoke: (payload) => ({ method: 'linkEventOperationalRecord', payload }),
    },
  ];
}

function specializedForms(routeName, context) {
  const requestId = selectedValue(context.selection, 'requestId', 'selectedRequestId');
  const componentId = selectedValue(context.selection, 'componentId', 'selectedComponentId');
  const method = routeName === 'food.overview' ? 'updateFoodComponent' : 'updateMaterialsComponent';
  const label = routeName === 'food.overview' ? 'food' : 'materials';
  const forms = [];
  if (requestId && componentId) {
    forms.push({
      id: `${label}-component-update`,
      title: `Update ${label} workflow component`,
      capability: ROUTE_CAPABILITY.VIEW_INTERNAL,
      fields: [
        field('requestId', 'Request', { value: requestId, readonly: true, required: true }),
        field('componentId', 'Component', { value: componentId, readonly: true, required: true }),
        field('status', 'Target status', { required: true, maxLength: 40 }),
        field('reason', 'Workflow reason', { kind: 'textarea', required: true, maxLength: 500 }),
      ],
      invoke: (payload) => ({ method, payload }),
    });
  }
  return forms;
}

function formsForRoute(routeName, context) {
  if (routeName === 'request.queue') return requestForms(context);
  if (routeName === 'lending.queue') return [lendingCreateForm(context)];
  if (routeName === 'lending.detail') return lendingDetailForms(context);
  if (routeName === 'release.desk') return releaseForms(context);
  if (routeName === 'inventory.catalog') return inventoryCatalogForms(context);
  if (routeName === 'inventory.item') return inventoryItemForms(context);
  if (routeName === 'restocking.queue') return restockForms(context);
  if (routeName === 'procurement.board') return procurementForms(context);
  if (routeName === 'events.series') return eventForms(context);
  if (routeName === 'food.overview' || routeName === 'materials.overview') {
    return specializedForms(routeName, context);
  }
  return [];
}

function element(tag, className = '', content = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function appendField(formRow, definition) {
  const wrap = element('div', 'field');
  const label = element('label', '', definition.label);
  const id = `v5-operation-${definition.name}-${Math.random().toString(36).slice(2)}`;
  label.htmlFor = id;
  let control;
  if (definition.kind === 'textarea' || definition.kind === 'select-multiple-source') {
    control = element('textarea');
  } else if (definition.kind === 'select') {
    control = element('select');
    const placeholder = element('option', '', `Choose ${definition.label.toLowerCase()}`);
    placeholder.value = '';
    control.append(placeholder);
    for (const option of definition.options ?? []) {
      const node = element('option', '', option.label);
      node.value = option.value;
      control.append(node);
    }
  } else {
    control = element('input');
    control.type = definition.kind === 'checkbox' ? 'checkbox' : definition.kind || 'text';
  }
  control.id = id;
  control.name = definition.name;
  control.required = definition.required === true;
  control.readOnly = definition.readonly === true;
  if (definition.maxLength) control.maxLength = definition.maxLength;
  if (definition.min !== undefined) control.min = String(definition.min);
  if (definition.max !== undefined) control.max = String(definition.max);
  if (definition.step !== undefined) control.step = String(definition.step);
  if (definition.list) control.dataset.list = 'true';
  if (definition.kind === 'checkbox') control.checked = definition.checked === true;
  else if (definition.value !== undefined && definition.value !== null)
    control.value = String(definition.value);
  wrap.append(label, control);
  if (definition.hint) wrap.append(element('span', 'field__hint', definition.hint));
  formRow.append(wrap);
}

function renderForm(definition) {
  const panel = element('div', 'panel');
  panel.dataset.v5Operation = definition.id;
  const body = element('div', 'panel__body');
  body.append(element('h3', 'block-title', definition.title));
  const form = element('form');
  form.dataset.v5Command = definition.id;
  form.noValidate = false;
  const row = element('div', 'form-row');
  definition.fields.forEach((entry) => appendField(row, entry));
  const actions = element('div', 'section__head');
  const submit = element('button', 'btn btn--primary', definition.title);
  submit.type = 'submit';
  const reset = element('button', 'btn btn--quiet', 'Clear operator fields');
  reset.type = 'button';
  reset.dataset.v5CommandReset = definition.id;
  actions.append(submit, reset);
  form.append(row, actions);
  body.append(form);
  panel.append(body);
  return panel;
}

function readForm(form) {
  const result = {};
  for (const control of form.querySelectorAll('input, select, textarea')) {
    if (!control.name || control.disabled) continue;
    if (control.type === 'checkbox') {
      result[control.name] = control.checked === true;
      continue;
    }
    const raw = text(control.value);
    if (!raw) continue;
    if (control.dataset.list === 'true') {
      result[control.name] = [
        ...new Set(
          raw
            .split(/[\r\n,]+/u)
            .map(text)
            .filter(Boolean),
        ),
      ];
    } else if (control.type === 'number') {
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) throw new Error(`${control.name} must be a number.`);
      result[control.name] = numeric;
    } else {
      result[control.name] = raw;
    }
  }
  return result;
}

function resetOperatorFields(form) {
  for (const control of form.querySelectorAll('input, select, textarea')) {
    if (control.readOnly || control.disabled) continue;
    if (control.type === 'checkbox') control.checked = false;
    else control.value = '';
  }
}

export function createOperationsParityController({
  backend,
  app,
  getState,
  getSelection,
  getCapabilities,
  refresh,
  toast,
}) {
  void app;
  const definitions = new Map();

  function notify(message, error = false) {
    toast?.(text(message) || 'The operation could not be completed.', error);
  }

  function afterRender() {
    document.querySelector('[data-v5-operations-parity]')?.remove();
    definitions.clear();
    const state = getState?.() ?? {};
    const selection = getSelection?.() ?? {};
    const capabilities = values(getCapabilities?.());
    const routeName = currentRoute();
    const forms = formsForRoute(routeName, contextFor(state, selection)).filter((definition) =>
      (definition.capabilities ?? [definition.capability]).every((capability) =>
        capabilities.has(capability),
      ),
    );
    if (!forms.length) return 0;
    const root = document.getElementById('surface-main');
    if (!root) return 0;
    const section = element('section', 'section');
    section.dataset.v5OperationsParity = routeName;
    section.dataset.v5ParityActions = routeName;
    const head = element('div', 'section__head');
    head.append(element('h2', '', 'Authorized operations'));
    const reload = element('button', 'btn btn--quiet', 'Reload current data');
    reload.type = 'button';
    reload.dataset.v5CommandRefresh = 'true';
    head.append(reload);
    section.append(head);
    for (const definition of forms) {
      definitions.set(definition.id, definition);
      section.append(renderForm(definition));
    }
    root.append(section);
    return forms.length;
  }

  function onClick(event) {
    const refreshButton = event.target?.closest?.('[data-v5-command-refresh]');
    if (refreshButton) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      void Promise.resolve(refresh?.()).catch((error) => notify(error?.message, true));
      return true;
    }
    const resetButton = event.target?.closest?.('[data-v5-command-reset]');
    if (!resetButton) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const form = resetButton.closest('form[data-v5-command]');
    if (form) resetOperatorFields(form);
    return true;
  }

  async function invokeOperation(operation) {
    const payload = {
      ...(operation.payload ?? {}),
      ...(operation.direct || operation.payload
        ? { clientRequestId: operation.payload?.clientRequestId ?? clientRequestId(operation.method) }
        : {}),
    };
    if (operation.direct) {
      if (typeof backend.api?.[operation.method] === 'function') {
        return backend.api[operation.method](payload);
      }
      if (typeof backend.api?._call === 'function') return backend.api._call(operation.method, payload);
      throw new Error(`${operation.method} is not available through the current backend adapter.`);
    }
    const command = backend.commands?.[operation.method];
    if (typeof command !== 'function') {
      throw new Error(`${operation.method} is not available through the current backend adapter.`);
    }
    if (operation.args) return command(...operation.args);
    return command(payload);
  }

  function onSubmit(event) {
    const form = event.target?.closest?.('form[data-v5-command]');
    if (!form) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const definition = definitions.get(form.dataset.v5Command);
    if (!definition) return true;
    if (form.reportValidity && !form.reportValidity()) return true;
    const button = event.submitter ?? form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    void (async () => {
      try {
        const operation = definition.invoke(readForm(form));
        await invokeOperation(operation);
        notify(`${definition.title} completed.`);
        await refresh?.();
      } catch (error) {
        notify(
          error?.correlationId ? `${error.message} Reference: ${error.correlationId}.` : error?.message,
          true,
        );
      } finally {
        if (button) button.disabled = false;
      }
    })();
    return true;
  }

  return Object.freeze({ afterRender, onClick, onSubmit });
}
