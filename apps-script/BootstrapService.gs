var HAU_BOOTSTRAP_CONTRACT_ = 'essential-bootstrap';
var HAU_BOOTSTRAP_MODULE_CONTRACT_ = 'bootstrap-module';
var HAU_BOOTSTRAP_VERSION_ = 2;
var HAU_BOOTSTRAP_MODULES_ = Object.freeze(['overview', 'request', 'lending', 'release', 'restocking', 'procurement', 'inventory']);
var HAU_BOOTSTRAP_SCOPE_FIELDS_ = Object.freeze(['Assigned_Committee', 'Owner_Committee', 'Committee']);

function bootstrapText_(value, fallback, maxLength) {
  var text = String(value == null ? fallback || '' : value).trim();
  return text.slice(0, maxLength || 160);
}

function bootstrapPublicUser_() {
  return { User_ID: 'PUBLIC', Display_Name: 'Requester', Role: 'REQUESTER', Committee: '', Active: true };
}

function bootstrapSession_(command) {
  var requestedRequestOnly = Boolean(command && command.requestOnly);
  var resolved = requestedRequestOnly ? bootstrapPublicUser_() : resolveRequesterUser_();
  var internal = !requestedRequestOnly && isInternalBootstrapUser_(resolved);
  var session = {
    requestedRequestOnly: requestedRequestOnly,
    requestOnly: !internal,
    internal: internal,
    user: internal ? resolved : bootstrapPublicUser_()
  };
  if (internal && typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2 && typeof authorizationContext_ === 'function') {
    session.authorization = authorizationContext_(resolved);
    if (typeof dashboardContext_ === 'function') {
      session.dashboardContext = dashboardContext_(command || {}, session);
      session.activeCommitteeId = session.dashboardContext.activeId;
      session.allowedCommitteeIds = session.dashboardContext.allowedIds.slice();
    }
  }
  return session;
}

function bootstrapModuleAllowed_(module, session) {
  if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2) {
    var canonical = {
      overview: [HAU_CAPABILITIES_.VIEW_COMMITTEE_SUMMARY, HAU_CAPABILITIES_.VIEW_ALL_SUMMARY],
      request: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.REQUEST_CREATE],
      lending: [HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.LENDING_APPROVE],
      release: [HAU_CAPABILITIES_.FULFILL_RELEASE],
      restocking: [HAU_CAPABILITIES_.FULFILL_RECEIVE, HAU_CAPABILITIES_.REQUEST_REVIEW],
      procurement: [HAU_CAPABILITIES_.FULFILL_RECEIVE, HAU_CAPABILITIES_.FULFILL_CANVASS],
      inventory: [HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE]
    }[module] || [];
    if (session.authorization) return session.authorization.mappingStatus === 'MAPPED' && canonical.some(function(capability) { return session.authorization.capabilities.indexOf(capability) >= 0; });
    return canonical.some(function(capability) { return authorizationCan_(session.user, capability, null, { allowUnresolvedScope: true }); });
  }
  if (session.requestOnly) return module === 'request';
  if (module === 'overview' || module === 'request') return true;
  if (module === 'lending' || module === 'inventory') return canPermission_(session.user, 'Can_Review');
  if (module === 'release') return canPermission_(session.user, 'Can_Release');
  if (module === 'restocking') return canPermission_(session.user, 'Can_Review') || canPermission_(session.user, 'Can_Receive');
  if (module === 'procurement') return canPermission_(session.user, 'Can_Review') || canPermission_(session.user, 'Can_Receive');
  return false;
}

function bootstrapNavigation_(session) {
  var labels = {
    overview: 'Operations Overview',
    request: 'Request Center',
    lending: 'Office Lending Hub',
    release: 'Release Desk',
    restocking: 'Restocking',
    procurement: 'Procurement & Deliverables',
    inventory: 'Inventory Management'
  };
  return HAU_BOOTSTRAP_MODULES_.map(function(module) {
    return { id: module, label: labels[module], enabled: bootstrapModuleAllowed_(module, session) };
  }).filter(function(entry) { return entry.enabled; });
}

function bootstrapUserDto_(session) {
  var user = session.user;
  var authorization = typeof authorizationDto_ === 'function' ? authorizationDto_(user, session.authorization) : null;
  var dto = {
    id: bootstrapText_(user.User_ID, 'PUBLIC', 80),
    displayName: bootstrapText_(user.Display_Name, 'Requester', 120),
    role: bootstrapText_(authorization ? authorization.roleId || user.Role : user.Role, 'REQUESTER', 80),
    committee: bootstrapText_(authorization ? (authorization.committees[0] ? authorization.committees[0].name : '') : user.Committee, '', 120),
    permissions: userPermissionsDto_(user),
    scopes: { committee: authorization ? authorization.committeeIds.slice() : (user.Committee ? [bootstrapText_(user.Committee, '', 120)] : []), organization: [] }
  };
  if (authorization) dto.authorization = authorization;
  return dto;
}

function bootstrapRevision_(session) {
  if (!session.internal) return null;
  var revision = getDataRevision_();
  return { revision: revision.revision, updatedAt: revision.updatedAt };
}

function bootstrapUtf8Bytes_(value) {
  return unescape(encodeURIComponent(String(value || ''))).length;
}

function bootstrapBoundedResponse_(response) {
  var payloadBytes = 0;
  response.metrics.payloadBytes = 0;
  for (var attempt = 0; attempt < 3; attempt += 1) {
    payloadBytes = bootstrapUtf8Bytes_(JSON.stringify(response));
    if (response.metrics.payloadBytes === payloadBytes) break;
    response.metrics.payloadBytes = payloadBytes;
  }
  if (payloadBytes > 100 * 1024) throw appError_('BOOTSTRAP_PAYLOAD_TOO_LARGE', 'The bootstrap response exceeded the bounded payload limit.', true);
  return response;
}

function essentialBootstrapData_(command, stats) {
  var session = bootstrapSession_(command || {});
  return bootstrapBoundedResponse_({
    contract: HAU_BOOTSTRAP_CONTRACT_,
    contractVersion: HAU_BOOTSTRAP_VERSION_,
    appVersion: HAU_CONFIG.APP_VERSION,
    schemaVersion: HAU_CONFIG.SCHEMA_VERSION,
    backendMode: 'apps-script',
    environment: resolveRuntimeConfig_().environment,
    requestOnly: session.requestOnly,
    activeModule: session.requestOnly ? 'request' : 'overview',
    currentUser: bootstrapUserDto_(session),
    navigation: bootstrapNavigation_(session),
    moduleConfig: { maxPageSize: 50, defaultPageSize: 10, legacyEndpointAvailable: typeof authorizationContractVersion_ !== 'function' || authorizationContractVersion_() < 2, activeModuleOnly: true },
    revision: bootstrapRevision_(session),
    metrics: { readCount: stats.readCount, cacheHits: stats.cacheHits }
  });
}

function apiEssentialBootstrapData_(command) {
  return withRequestReadCache_(function(stats) { return essentialBootstrapData_(command || {}, stats); });
}

function bootstrapPage_(rows, command, mapFn) {
  command = command || {};
  var pageValue = command.page === undefined || command.page === null || command.page === '' ? 1 : Number(command.page);
  var pageSizeValue = command.pageSize === undefined || command.pageSize === null || command.pageSize === '' ? 10 : Number(command.pageSize);
  if (!isFinite(pageValue) || Math.floor(pageValue) !== pageValue || pageValue < 1) throw appError_('INVALID_REQUEST', 'Module page must be a positive integer.', false);
  if (!isFinite(pageSizeValue) || Math.floor(pageSizeValue) !== pageSizeValue || pageSizeValue < 1 || pageSizeValue > 50) throw appError_('INVALID_REQUEST', 'Module page size is outside the supported bound.', false);
  var page = pageValue;
  var pageSize = pageSizeValue;
  var total = rows.length;
  var start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize).map(mapFn || function(row) { return row; }),
    pagination: { page: page, pageSize: pageSize, total: total, hasMore: start + pageSize < total }
  };
}

function bootstrapQuery_(command) {
  var query = bootstrapText_(command && command.query, '', 80), filter = bootstrapText_(command && command.filter, '', 80);
  return [query, filter].filter(function(value) { return Boolean(value); }).join(' ').toLowerCase();
}
function bootstrapMatches_(row, query, fields) {
  if (!query) return true;
  return fields.map(function(field) { return String(row[field] == null ? '' : row[field]); }).join(' ').toLowerCase().indexOf(query) >= 0;
}

function bootstrapScopeValues_(session) {
  if (!session || !session.internal) return [];
  return String(session.user && session.user.Committee || '').split(/[|,;]/).map(function(value) { return value.trim().toLowerCase(); }).filter(Boolean);
}

function bootstrapDefaultScopeIds_(sheetName) {
  return [HAU_SHEETS.ITEMS, HAU_SHEETS.LENDING, HAU_SHEETS.RESTOCK].indexOf(sheetName) >= 0 ? ['COM_INVENTORY_PANTRY'] : [];
}

function bootstrapScopeMatches_(row, session, fields, sheetName) {
  if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2) {
    var authorization = session && session.authorization || authorizationContext_(session && session.user);
    var activeCommitteeId = session && session.activeCommitteeId || '';
    if (authorization.scopeMode === 'ALL' && !activeCommitteeId || authorization.scopeMode === 'SELF') return true;
    if (authorization.scopeMode !== 'COMMITTEE' && authorization.scopeMode !== 'ALL') return false;
    var allowedCommitteeIds = authorization.scopeMode === 'ALL' ? (session && session.allowedCommitteeIds || ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS']) : authorization.committeeIds;
    if (!allowedCommitteeIds.length) return false;
    var canonicalFields = fields && fields.length ? fields : HAU_BOOTSTRAP_SCOPE_FIELDS_;
    var canonicalRows = canonicalFields.map(function(field) { return canonicalCommitteeId_(row[field]); }).filter(Boolean);
    if (!canonicalRows.length) canonicalRows = bootstrapDefaultScopeIds_(sheetName);
    if (activeCommitteeId) return canonicalRows.indexOf(activeCommitteeId) >= 0;
    return canonicalRows.some(function(id) { return allowedCommitteeIds.indexOf(id) >= 0; });
  }
  var scopes = bootstrapScopeValues_(session);
  if (!scopes.length) return true;
  var scopeFields = fields && fields.length ? fields : HAU_BOOTSTRAP_SCOPE_FIELDS_;
  var explicitScopes = scopeFields.map(function(field) { return String(row[field] == null ? '' : row[field]).trim().toLowerCase(); }).filter(Boolean);
  if (!explicitScopes.length) return false;
  return explicitScopes.some(function(value) { return scopes.indexOf(value) >= 0; });
}

function bootstrapRows_(sheetName, command, session, queryFields, scopeFields, predicate) {
  var query = bootstrapQuery_(command);
  return readObjects_(sheetName).filter(function(row) {
    return (!predicate || predicate(row)) && bootstrapScopeMatches_(row, session, scopeFields && scopeFields.length ? scopeFields : HAU_BOOTSTRAP_SCOPE_FIELDS_, sheetName) && bootstrapMatches_(row, query, queryFields || []);
  });
}

function bootstrapEventRows_(command, session) {
  return bootstrapRows_(HAU_SHEETS.EVENTS, command, session, ['Event_ID', 'Event_Series_ID', 'Series_Code', 'Event_Series_Name', 'Event_Name', 'Venue', 'Status'], ['Owner_Committee', 'Committee'], function(row) {
    return String(row.Status || 'ACTIVE') !== 'ARCHIVED';
  });
}

function bootstrapRequestRows_(command, session) {
  return bootstrapRows_(HAU_SHEETS.REQUESTS, command, session, ['Request_ID', 'Request_Type', 'Request_Stage', 'Event_Series_ID', 'Event_ID', 'Catalog_Type', 'Department', 'Priority', 'Purpose', 'Status'], ['Assigned_Committee', 'Committee']);
}

function bootstrapDeliverableRows_(command, session) {
  return bootstrapRows_(HAU_SHEETS.DELIVERABLES, command, session, ['Deliverable_ID', 'Request_ID', 'Item_Spec', 'Assigned_Committee', 'Status'], ['Assigned_Committee', 'Committee'], function(row) {
    return ['COMPLETED', 'REJECTED', 'CANCELLED'].indexOf(String(row.Status)) < 0;
  });
}

function bootstrapSeriesFromEvents_(events) {
  var byId = {};
  events.forEach(function(row) {
    var id = String(row.Event_Series_ID || row.seriesId || '').trim();
    if (!id || byId[id]) return;
    byId[id] = { id: id, code: row.Series_Code || row.code || '', name: row.Event_Series_Name || row.seriesName || row.Event_Name || row.name || id, status: row.Status || row.status || 'ACTIVE' };
  });
  return Object.keys(byId).map(function(id) { return byId[id]; });
}

function bootstrapEventDto_(row, requestOnly) {
  if (requestOnly) return requesterEventDto_(row);
  return { id: row.Event_ID, seriesId: row.Event_Series_ID, code: row.Series_Code, name: row.Event_Name, startAt: row.Start_At, endAt: row.End_At, venue: row.Venue, status: row.Status };
}

function bootstrapInventoryDto_(row, indexes) {
  var onHand = indexes ? Number(indexes.onHand[row.Item_ID] || 0) : Number(row.Opening_Qty || 0);
  var reserved = indexes ? Number(indexes.reserved[row.Item_ID] || 0) : 0;
  return {
    id: row.Item_ID,
    name: row.Item_Name,
    aliases: String(row.Aliases || '').split('|').filter(Boolean),
    category: row.Category,
    stockArea: row.Stock_Area,
    catalogType: row.Catalog_Type || normalizeCatalogType_('', row.Stock_Area),
    storageLocation: row.Storage_Location || '',
    handling: row.Handling,
    handlingCode: normalizeHandling_(row.Handling),
    unit: row.Unit,
    openingOnHand: Number(row.Opening_Qty || 0),
    onHand: onHand,
    reserved: reserved,
    availableToPromise: onHand - reserved,
    status: row.Status,
    reorderThreshold: Number(row.Reorder_Threshold || 0),
    lendingAudience: effectiveLendingAudience_(row),
    defaultLoanDays: row.Default_Loan_Days === '' ? '' : Number(row.Default_Loan_Days || 0),
    maximumLoanQuantity: row.Maximum_Loan_Qty === '' ? '' : Number(row.Maximum_Loan_Qty || 0),
    approvalRequired: booleanValue_(row.Approval_Required, true),
    updatedAt: row.Updated_At || ''
  };
}

function bootstrapRequestDto_(row) {
  return { id: row.Request_ID, type: row.Request_Type, stage: row.Request_Stage, parentRequestId: row.Parent_Request_ID, eventSeriesId: row.Event_Series_ID, eventId: row.Event_ID, catalogType: row.Catalog_Type, department: row.Department, priority: row.Priority, purpose: row.Purpose, status: row.Status, createdAt: row.Created_At, updatedAt: row.Updated_At };
}

function bootstrapLineDto_(row) {
  return { id: row.Request_Line_ID, requestId: row.Request_ID, eventId: row.Event_ID, itemId: row.Item_ID, description: row.Description, specification: row.Specification, category: row.Category, quantity: Number(row.Requested_Qty || 0), unit: row.Unit, fulfillmentSource: row.Fulfillment_Source, neededAt: row.Needed_At, returnDue: row.Return_Due, releasedQuantity: Number(row.Released_Qty || 0), receivedQuantity: Number(row.Received_Qty || 0), status: row.Status, workflowRevision: Number(row.Workflow_Revision || 1), createdAt: row.Created_At, updatedAt: row.Updated_At };
}

function bootstrapLendingDto_(row) {
  return { id: row.Lending_Ticket_ID, itemId: row.Item_ID, quantity: Number(row.Quantity || 0), unit: row.Unit, borrowerType: row.Borrower_Type, department: row.Department_Organization, purpose: row.Purpose, dueAt: row.Due_At, ticketType: row.Ticket_Type, status: row.Status, createdAt: row.Created_At, updatedAt: row.Updated_At };
}

function bootstrapReleaseDto_(row) {
  return { id: row.Release_ID, requestId: row.Request_ID, eventId: row.Event_ID, lendingTicketId: row.Lending_Ticket_ID, recipientRole: row.Recipient_Role, department: row.Department, releasedAt: row.Released_At, status: row.Status, createdAt: row.Created_At };
}

function bootstrapRestockDto_(row) {
  return { id: row.Restock_ID, sourceRequestId: row.Source_Request_ID, sourceRequestLineId: row.Source_Request_Line_ID, itemId: row.Item_ID, quantity: Number(row.Quantity || 0), unit: row.Unit, supplierName: row.Supplier_Name, invoiceStatus: row.Invoice_Status, storageArea: row.Storage_Area, storageLocation: row.Storage_Location, status: row.Status, requestedAt: row.Requested_At, receivedAt: row.Received_At, createdAt: row.Created_At, updatedAt: row.Updated_At };
}

function bootstrapDeliverableDto_(row) {
  return { id: row.Deliverable_ID, requestId: row.Request_ID, requestLineId: row.Request_Line_ID, eventId: row.Event_ID, itemId: row.Inventory_Match_ID, itemSpec: row.Item_Spec, quantity: Number(row.Quantity_Requested || 0), quantityReceived: Number(row.Quantity_Received || 0), quantityReleased: Number(row.Quantity_Released || 0), unit: row.Unit, fulfillmentSource: row.Fulfillment_Source, assignedCommittee: row.Assigned_Committee, status: row.Status, neededAt: row.Needed_At, createdAt: row.Created_At, updatedAt: row.Updated_At };
}

function bootstrapCanvassDto_(row) {
  return { id: row.Canvass_ID, linkedLineIds: row.Linked_Request_Line_ID ? [row.Linked_Request_Line_ID] : [], supplierId: row.Supplier_ID, supplierName: row.Supplier_Name, location: row.Location, itemSpec: row.Item_Spec, price: Number(row.Price || 0), unit: row.Unit, receiptStatus: row.Receipt_Status, reliability: row.Reliability, checkedAt: row.Checked_At, status: row.Status };
}

function bootstrapRowsForItems_(command, session, includeBalances) {
  var rows = bootstrapRows_(HAU_SHEETS.ITEMS, command, session, ['Item_ID', 'Item_Name', 'Aliases', 'Category', 'Stock_Area', 'Handling', 'Unit', 'Status'], [], function(row) {
    return String(row.Status) !== 'ARCHIVED';
  });
  var indexes = includeBalances ? inventoryIndexes_(rows) : null;
  return bootstrapPage_(rows, command, function(row) { return session.requestOnly ? requesterItemDto_(row) : bootstrapInventoryDto_(row, indexes); });
}

function bootstrapRequestModule_(command, session) {
  var eventRows = bootstrapEventRows_(command, session);
  var eventPage = bootstrapPage_(eventRows, command, function(row) { return bootstrapEventDto_(row, session.requestOnly); });
  var itemsPage = bootstrapRowsForItems_(command, session, false);
  return {
    data: { eventSeries: bootstrapSeriesFromEvents_(eventPage.rows), events: eventPage.rows, inventoryItems: itemsPage.rows },
    pagination: itemsPage.pagination,
    cache: { safe: session.requestOnly, scope: session.requestOnly ? 'PUBLIC_REFERENCE' : 'SESSION_OPERATIONAL', ttlMs: session.requestOnly ? 300000 : 0 }
  };
}

function bootstrapOverviewModule_(command, session) {
  var eventRows = bootstrapEventRows_(command, session);
  var items = bootstrapRows_(HAU_SHEETS.ITEMS, command, session, ['Item_ID', 'Item_Name', 'Aliases', 'Category', 'Stock_Area', 'Handling', 'Unit', 'Status'], [], function(row) {
    return String(row.Status) !== 'ARCHIVED';
  });
  var indexes = inventoryIndexes_(items);
  var eventPage = bootstrapPage_(eventRows, command, function(row) { return bootstrapEventDto_(row, false); });
  var itemsPage = bootstrapPage_(items, command, function(row) { return bootstrapInventoryDto_(row, indexes); });
  var requestPage = bootstrapPage_(bootstrapRequestRows_(command, session), command, bootstrapRequestDto_);
  var linePage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.REQUEST_LINES, command, session, ['Request_Line_ID', 'Request_ID', 'Event_ID', 'Item_ID', 'Description', 'Specification', 'Category', 'Status'], [], null), command, bootstrapLineDto_);
  var lendingPage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.LENDING, command, session, ['Lending_Ticket_ID', 'Item_ID', 'Borrower_Type', 'Department_Organization', 'Purpose', 'Status'], [], function(row) {
    return ['RETURNED', 'COMPLETED', 'REJECTED', 'CANCELLED'].indexOf(String(row.Status)) < 0;
  }), command, bootstrapLendingDto_);
  var deliverablePage = bootstrapPage_(bootstrapDeliverableRows_(command, session), command, bootstrapDeliverableDto_);
  var dashboard = committeeDashboard_(command, session);
  return {
    data: { eventSeries: bootstrapSeriesFromEvents_(eventPage.rows), events: eventPage.rows, requests: requestPage.rows, requestLines: linePage.rows, inventoryItems: itemsPage.rows, lendingTickets: lendingPage.rows, restockRequests: [], deliverables: deliverablePage.rows, roadmapMilestones: [], dashboardMeta: dashboard.meta, dashboardQueues: dashboard.queues, dashboardStaffWorkload: dashboard.staff, dashboardActivity: dashboard.activity, dashboardLinks: dashboard.links },
    pagination: requestPage.pagination,
    cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 }
  };
}

function bootstrapInventoryModule_(command, session) {
  var page = bootstrapRowsForItems_(command, session, true);
  return { data: { inventoryItems: page.rows }, pagination: page.pagination, cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 } };
}

function bootstrapLendingModule_(command, session) {
  var rows = bootstrapRows_(HAU_SHEETS.LENDING, command, session, ['Lending_Ticket_ID', 'Item_ID', 'Borrower_Type', 'Department_Organization', 'Purpose', 'Status'], [], null);
  var page = bootstrapPage_(rows, command, bootstrapLendingDto_);
  var itemPage = bootstrapRowsForItems_(command, session, true);
  return { data: { inventoryItems: itemPage.rows, lendingTickets: page.rows }, pagination: page.pagination, cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 } };
}

function bootstrapReleaseModule_(command, session) {
  var requestPage = bootstrapPage_(bootstrapRequestRows_(command, session), command, bootstrapRequestDto_);
  var linePage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.REQUEST_LINES, command, session, ['Request_Line_ID', 'Request_ID', 'Event_ID', 'Item_ID', 'Description', 'Specification', 'Category', 'Status'], [], null), command, bootstrapLineDto_);
  var lendingPage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.LENDING, command, session, ['Lending_Ticket_ID', 'Item_ID', 'Borrower_Type', 'Department_Organization', 'Purpose', 'Status'], [], function(row) { return String(row.Status) === 'READY_TO_CLAIM'; }), command, bootstrapLendingDto_);
  var releasePage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.RELEASES, command, session, ['Release_ID', 'Request_ID', 'Event_ID', 'Lending_Ticket_ID', 'Recipient_Role', 'Department', 'Status'], [], null), command, bootstrapReleaseDto_);
  return { data: { eventSeries: [], events: [], requests: requestPage.rows, requestLines: linePage.rows, lendingTickets: lendingPage.rows, releaseConfirmations: releasePage.rows }, pagination: requestPage.pagination, cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 } };
}

function bootstrapRestockingModule_(command, session) {
  var records = bootstrapRows_(HAU_SHEETS.RESTOCK, command, session, ['Restock_ID', 'Item_ID', 'Supplier_Name', 'Status'], [], null);
  var page = bootstrapPage_(records, command, bootstrapRestockDto_);
  var itemPage = bootstrapRowsForItems_(command, session, true);
  var canvassPage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.CANVASS, command, session, ['Canvass_ID', 'Linked_Request_Line_ID', 'Linked_Deliverable_ID', 'Supplier_ID', 'Supplier_Name', 'Location', 'Item_Spec', 'Status'], [], null), command, bootstrapCanvassDto_);
  var restockRows = typeof restockQueueDtos_ === 'function' ? restockQueueDtos_(session.user) : [];
  return { data: { inventoryItems: itemPage.rows, restockRequests: restockRows, restockRecords: page.rows, canvassReferences: canvassPage.rows }, pagination: page.pagination, cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 } };
}

function bootstrapProcurementModule_(command, session) {
  var deliverables = bootstrapDeliverableRows_(command, session);
  var page = bootstrapPage_(deliverables, command, bootstrapDeliverableDto_);
  var requestPage = bootstrapPage_(bootstrapRequestRows_(command, session), command, bootstrapRequestDto_);
  var linePage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.REQUEST_LINES, command, session, ['Request_Line_ID', 'Request_ID', 'Event_ID', 'Item_ID', 'Description', 'Specification', 'Category', 'Status'], [], null), command, bootstrapLineDto_);
  var eventPage = bootstrapPage_(bootstrapEventRows_(command, session), command, function(row) { return bootstrapEventDto_(row, false); });
  var canvassPage = bootstrapPage_(bootstrapRows_(HAU_SHEETS.CANVASS, command, session, ['Canvass_ID', 'Linked_Request_Line_ID', 'Linked_Deliverable_ID', 'Supplier_ID', 'Supplier_Name', 'Location', 'Item_Spec', 'Status'], [], null), command, bootstrapCanvassDto_);
  return { data: { eventSeries: bootstrapSeriesFromEvents_(eventPage.rows), events: eventPage.rows, requests: requestPage.rows, requestLines: linePage.rows, deliverables: page.rows, canvassReferences: canvassPage.rows }, pagination: page.pagination, cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 } };
}

function bootstrapModuleData_(module, command, session) {
  if (module === 'request') return bootstrapRequestModule_(command, session);
  if (module === 'overview') return bootstrapOverviewModule_(command, session);
  if (module === 'inventory') return bootstrapInventoryModule_(command, session);
  if (module === 'lending') return bootstrapLendingModule_(command, session);
  if (module === 'release') return bootstrapReleaseModule_(command, session);
  if (module === 'restocking') return bootstrapRestockingModule_(command, session);
  if (module === 'procurement') return bootstrapProcurementModule_(command, session);
  throw appError_('MODULE_NOT_FOUND', 'The requested workspace module is not available.', false);
}

function bootstrapModuleResponse_(command, stats) {
  var module = bootstrapText_(command && command.module, '', 40).toLowerCase();
  if (HAU_BOOTSTRAP_MODULES_.indexOf(module) < 0) throw appError_('MODULE_NOT_FOUND', 'The requested workspace module is not available.', false);
  var session = bootstrapSession_(command || {});
  if (!bootstrapModuleAllowed_(module, session)) throw appError_('FORBIDDEN', 'This workspace module is not available for the current session.', false);
  var built = bootstrapModuleData_(module, command || {}, session);
  var revision = bootstrapRevision_(session);
  return bootstrapBoundedResponse_({
    contract: HAU_BOOTSTRAP_MODULE_CONTRACT_,
    contractVersion: HAU_BOOTSTRAP_VERSION_,
    appVersion: HAU_CONFIG.APP_VERSION,
    schemaVersion: HAU_CONFIG.SCHEMA_VERSION,
    backendMode: 'apps-script',
    environment: resolveRuntimeConfig_().environment,
    requestOnly: session.requestOnly,
    module: module,
    data: built.data,
    pagination: built.pagination,
    revision: revision,
    cache: built.cache,
    metrics: { readCount: stats.readCount, cacheHits: stats.cacheHits }
  });
}

function apiGetBootstrapModule_(command) {
  return withRequestReadCache_(function(stats) { return bootstrapModuleResponse_(command || {}, stats); });
}
