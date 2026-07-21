var HAU_DASHBOARD_TERMINAL_STATUSES_ = Object.freeze(['COMPLETED', 'RETURNED', 'REJECTED', 'CANCELLED', 'ARCHIVED', 'RESTOCKED']);
var HAU_DASHBOARD_MAX_RECORD_IDS_ = 100;
var HAU_DASHBOARD_MAX_ACTIVITY_ = 20;
var HAU_DASHBOARD_DUE_SOON_DAYS_ = 7;
var HAU_DASHBOARD_UPCOMING_DAYS_ = 14;
var HAU_DASHBOARD_COMPLETED_WINDOW_DAYS_ = 30;

function dashboardText_(value, fallback, maxLength) {
  var text = String(value == null ? (fallback || '') : value).trim();
  return text.slice(0, maxLength || 160);
}

function dashboardCanonicalIds_(values) {
  var ids = [];
  [].concat(values || []).forEach(function(value) {
    var id = typeof canonicalCommitteeId_ === 'function' ? canonicalCommitteeId_(value) : String(value || '').trim();
    if (id && ids.indexOf(id) < 0) ids.push(id);
  });
  return ids;
}

function dashboardCommitteeName_(id) {
  var committee = typeof canonicalCommittee_ === 'function' ? canonicalCommittee_(id) : null;
  return dashboardText_(committee && committee.name, id || 'All committees', 100);
}

function dashboardContext_(command, session) {
  var user = session && session.user || {};
  var authorization = session && session.authorization || (typeof authorizationContext_ === 'function' ? authorizationContext_(user) : {});
  var scopeMode = authorization.scopeMode || 'ALL';
  var allowedIds = dashboardCanonicalIds_(authorization.committeeIds || String(user.Committee || '').split(/[|,;]/));
  if (scopeMode === 'ALL') allowedIds = ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'];
  var requested = dashboardText_(command && command.committeeId, '', 40);
  var activeId = requested ? (typeof canonicalCommitteeId_ === 'function' ? canonicalCommitteeId_(requested) : requested) : '';
  if (requested && !activeId) throw appError_('INVALID_REQUEST', 'The committee context is not recognized.', false);
  if (scopeMode === 'COMMITTEE' && !allowedIds.length) throw appError_('FORBIDDEN', 'A committee scope is required for this workspace.', false);
  if (activeId && allowedIds.indexOf(activeId) < 0) throw appError_('FORBIDDEN', 'The requested committee context is outside your authorized scope.', false, { reason: 'OUT_OF_SCOPE' });
  if (!activeId && scopeMode === 'COMMITTEE') activeId = allowedIds[0];
  if (scopeMode === 'SELF') activeId = '';
  return {
    scopeMode: scopeMode,
    capabilities: authorization.capabilities || [],
    allowedIds: allowedIds,
    activeId: activeId,
    activeName: activeId ? dashboardCommitteeName_(activeId) : 'All committees'
  };
}

function dashboardRowCommitteeIds_(row, type) {
  row = row || {};
  if (type === 'ITEM' || type === 'LENDING' || type === 'RESTOCK') return ['COM_INVENTORY_PANTRY'];
  var values = [row.Committee_ID, row.Committee, row.Assigned_Committee, row.Owner_Committee];
  if (type === 'EVENT') values.push(row.Owner_Committee);
  return dashboardCanonicalIds_(values);
}

function dashboardMatches_(row, type, context, inheritedIds) {
  if (!context || context.scopeMode === 'ALL' && !context.activeId) return true;
  if (context.scopeMode === 'SELF') return false;
  var ids = dashboardCanonicalIds_(inheritedIds && inheritedIds.length ? inheritedIds : dashboardRowCommitteeIds_(row, type));
  if (!ids.length) return false;
  if (context.activeId) return ids.indexOf(context.activeId) >= 0;
  return ids.some(function(id) { return context.allowedIds.indexOf(id) >= 0; });
}

function dashboardOpen_(status) {
  return HAU_DASHBOARD_TERMINAL_STATUSES_.indexOf(String(status || '').toUpperCase()) < 0;
}

function dashboardDate_(value) {
  if (!value) return null;
  var date = new Date(value);
  return isFinite(date.getTime()) ? date : null;
}

function dashboardMaxDate_(current, value) {
  var candidate = dashboardDate_(value);
  if (!candidate) return current;
  return !current || candidate.getTime() > current.getTime() ? candidate : current;
}

function dashboardRecordId_(row, type) {
  var field = {
    REQUEST: 'Request_ID',
    REQUEST_LINE: 'Request_Line_ID',
    DELIVERABLE: 'Deliverable_ID',
    LENDING: 'Lending_Ticket_ID',
    ITEM: 'Item_ID',
    RESTOCK: 'Restock_ID',
    EVENT: 'Event_ID'
  }[type];
  return dashboardText_(row && row[field], '', 100);
}

function dashboardRecords_(rows, type) {
  return (rows || []).map(function(row) {
    return { id: dashboardRecordId_(row, type), row: row, type: type };
  }).filter(function(record) { return Boolean(record.id); });
}

function dashboardQueue_(id, label, view, recordType, records) {
  var ids = (records || []).map(function(record) { return record.id; }).filter(Boolean);
  var unique = [];
  ids.forEach(function(value) { if (unique.indexOf(value) < 0) unique.push(value); });
  return {
    id: id,
    label: label,
    view: view,
    recordType: recordType,
    count: unique.length,
    recordIds: unique.slice(0, HAU_DASHBOARD_MAX_RECORD_IDS_),
    truncated: unique.length > HAU_DASHBOARD_MAX_RECORD_IDS_
  };
}

function dashboardVisibleRecords_(rows, type, context, inheritedById) {
  return dashboardRecords_(rows, type).filter(function(record) {
    var inherited = inheritedById && inheritedById[record.id];
    return dashboardMatches_(record.row, type, context, inherited);
  });
}

function dashboardStatusRecords_(records, statuses) {
  return (records || []).filter(function(record) { return statuses.indexOf(String(record.row.Status || '').toUpperCase()) >= 0; });
}

function dashboardRecordDate_(record, field) {
  return dashboardDate_(record && record.row && record.row[field]);
}

function dashboardDateRecords_(records, field, now, days, overdueOnly) {
  var end = new Date(now.getTime() + days * 86400000);
  return (records || []).filter(function(record) {
    if (!dashboardOpen_(record.row.Status)) return false;
    var date = dashboardRecordDate_(record, field);
    if (!date) return false;
    return overdueOnly ? date.getTime() < now.getTime() : date.getTime() >= now.getTime() && date.getTime() <= end.getTime();
  });
}

function dashboardCompletedRecords_(records, now) {
  var start = new Date(now.getTime() - HAU_DASHBOARD_COMPLETED_WINDOW_DAYS_ * 86400000);
  return (records || []).filter(function(record) {
    if (String(record.row.Status || '').toUpperCase() !== 'COMPLETED') return false;
    var completedAt = dashboardDate_(record.row.Completed_At || record.row.Updated_At || record.row.Closed_At);
    return completedAt && completedAt.getTime() >= start.getTime() && completedAt.getTime() <= now.getTime();
  });
}

function dashboardUserRows_() {
  try { return readObjects_(HAU_SHEETS.USERS); } catch (error) { return []; }
}

function dashboardStaff_(deliverables, now) {
  var users = dashboardUserRows_(), byKey = {};
  users.forEach(function(user) {
    var userId = dashboardText_(user.User_ID, '', 80), name = dashboardText_(user.Display_Name, '', 120);
    if (userId) byKey[userId.toLowerCase()] = { id: userId, name: name };
    if (name) byKey[name.toLowerCase()] = { id: userId, name: name };
  });
  var staff = {};
  (deliverables || []).forEach(function(record) {
    var assigned = dashboardText_(record.row.Assigned_Staff, '', 120);
    if (!assigned) return;
    var user = byKey[assigned.toLowerCase()];
    if (!user || !user.id || !user.name) return;
    var key = user.id.toLowerCase();
    if (!staff[key]) staff[key] = { displayName: user.name, openCount: 0, overdueCount: 0 };
    if (dashboardOpen_(record.row.Status)) {
      staff[key].openCount += 1;
      var due = dashboardDate_(record.row.Needed_At);
      if (due && due.getTime() < now.getTime()) staff[key].overdueCount += 1;
    }
  });
  return Object.keys(staff).map(function(key) { return staff[key]; }).sort(function(a, b) { return b.openCount - a.openCount || a.displayName.localeCompare(b.displayName); }).slice(0, 50);
}

function dashboardActivity_(historyRows, visibleIds, context) {
  var activity = (historyRows || []).filter(function(row) {
    var id = dashboardText_(row.Entity_ID, '', 100);
    return Boolean(id && visibleIds[id] && dashboardMatches_(row, 'HISTORY', context, visibleIds[id]));
  }).map(function(row) {
    return {
      id: dashboardText_(row.History_ID || row.Audit_ID, '', 100),
      entityType: dashboardText_(row.Entity_Type, '', 40),
      entityId: dashboardText_(row.Entity_ID, '', 100),
      status: dashboardText_(row.New_Status || row.Action || row.Status, '', 60),
      at: dashboardText_(row.Changed_At || row.Created_At, '', 64)
    };
  }).filter(function(row) { return row.id && row.entityId && row.at; });
  return activity.sort(function(a, b) { return new Date(b.at).getTime() - new Date(a.at).getTime(); }).slice(0, HAU_DASHBOARD_MAX_ACTIVITY_);
}

function dashboardLinks_(session, context) {
  var links = [{ id: 'overview', label: 'Main Hub', view: 'overview' }];
  var capabilities = context && context.capabilities || [];
  var can = function(capability) { return capabilities.indexOf(capability) >= 0; };
  if (can(HAU_CAPABILITIES_.VIEW_INVENTORY)) {
    links.push({ id: 'inventory', label: 'Inventory and Pantry', view: 'inventory' });
    links.push({ id: 'lending', label: 'Lending Hub', view: 'lending' });
  }
  if (can(HAU_CAPABILITIES_.FULFILL_RECEIVE)) links.push({ id: 'restocking', label: 'Restocking', view: 'restocking' });
  if (can(HAU_CAPABILITIES_.FULFILL_CANVASS)) links.push({ id: 'procurement', label: 'Procurement', view: 'procurement' });
  return links;
}

function committeeDashboard_(command, session) {
  var context = dashboardContext_(command || {}, session || {}), now = new Date();
  var eventRows = readObjects_(HAU_SHEETS.EVENTS).filter(function(row) { return String(row.Status || 'ACTIVE') !== 'ARCHIVED'; });
  var requestRows = readObjects_(HAU_SHEETS.REQUESTS).filter(function(row) { return dashboardOpen_(row.Status) || String(row.Status) === 'COMPLETED'; });
  var lineRows = readObjects_(HAU_SHEETS.REQUEST_LINES);
  var deliverableRows = readObjects_(HAU_SHEETS.DELIVERABLES);
  var lendingRows = readObjects_(HAU_SHEETS.LENDING);
  var itemRows = readObjects_(HAU_SHEETS.ITEMS).filter(function(row) { return String(row.Status) !== 'ARCHIVED'; });
  var restockRows = readObjects_(HAU_SHEETS.RESTOCK);
  var eventScopes = {}, lineToDeliverable = {}, requestScopes = {}, deliverableScopes = {};
  eventRows.forEach(function(row) {
    var id = dashboardRecordId_(row, 'EVENT');
    if (id) eventScopes[id] = dashboardRowCommitteeIds_(row, 'EVENT');
  });
  requestRows.forEach(function(row) {
    var requestId = dashboardRecordId_(row, 'REQUEST'), ids = dashboardCanonicalIds_(dashboardRowCommitteeIds_(row, 'REQUEST').concat(eventScopes[dashboardText_(row.Event_ID, '', 100)] || []));
    if (requestId && ids.length) requestScopes[requestId] = dashboardCanonicalIds_((requestScopes[requestId] || []).concat(ids));
  });
  deliverableRows.forEach(function(row) {
    var id = dashboardRecordId_(row, 'DELIVERABLE'), lineId = dashboardText_(row.Request_Line_ID, '', 100), requestId = dashboardText_(row.Request_ID, '', 100);
    var ids = dashboardCanonicalIds_(dashboardRowCommitteeIds_(row, 'DELIVERABLE').concat(eventScopes[dashboardText_(row.Event_ID, '', 100)] || [], requestScopes[requestId] || []));
    if (id) deliverableScopes[id] = ids;
    if (lineId) lineToDeliverable[lineId] = dashboardCanonicalIds_((lineToDeliverable[lineId] || []).concat(ids));
    if (requestId && ids.length) requestScopes[requestId] = dashboardCanonicalIds_((requestScopes[requestId] || []).concat(ids));
  });
  var lineScopes = lineRows.reduce(function(map, row) {
    var lineId = dashboardRecordId_(row, 'REQUEST_LINE'), requestId = dashboardText_(row.Request_ID, '', 100);
    map[lineId] = dashboardCanonicalIds_((requestScopes[requestId] || []).concat(lineToDeliverable[lineId] || []));
    return map;
  }, {});
  var requestRecords = dashboardVisibleRecords_(requestRows, 'REQUEST', context, requestScopes);
  var lineRecords = dashboardVisibleRecords_(lineRows, 'REQUEST_LINE', context, lineScopes);
  var deliverableRecords = dashboardVisibleRecords_(deliverableRows, 'DELIVERABLE', context, deliverableScopes);
  var eventRecords = dashboardVisibleRecords_(eventRows, 'EVENT', context);
  var lendingRecords = dashboardVisibleRecords_(lendingRows, 'LENDING', context);
  var itemRecords = dashboardVisibleRecords_(itemRows, 'ITEM', context);
  var restockRecords = dashboardVisibleRecords_(restockRows, 'RESTOCK', context);
  var indexes = typeof inventoryIndexes_ === 'function' ? inventoryIndexes_(itemRows) : { onHand: {}, reserved: {} };
  var inventoryAttention = itemRecords.filter(function(record) {
    var row = record.row, onHand = Number(indexes.onHand && indexes.onHand[row.Item_ID] || row.Opening_Qty || 0), threshold = Number(row.Reorder_Threshold || 0);
    return String(row.Status) === 'VERIFY' || onHand <= threshold;
  });
  var review = dashboardStatusRecords_(requestRecords, ['FOR_REVIEW']);
  var newOrUnassigned = requestRecords.filter(function(record) {
    var status = String(record.row.Status || '').toUpperCase();
    return ['NEW', 'NEW_REQUEST', 'DRAFT', 'UNASSIGNED'].indexOf(status) >= 0 || !dashboardText_(record.row.Assigned_Committee || record.row.Committee || record.row.Owner_Committee, '', 100);
  });
  var needsInfo = dashboardStatusRecords_(requestRecords, ['NEEDS_INFORMATION', 'NEEDS_INFO', 'REQUEST_MISSING_INFORMATION']);
  var blocked = requestRecords.concat(lineRecords, deliverableRecords).filter(function(record) { return ['BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION', 'NEEDS_INFO'].indexOf(String(record.row.Status || '').toUpperCase()) >= 0; });
  var missingEvidence = deliverableRecords.concat(restockRecords).filter(function(record) { return dashboardOpen_(record.row.Status) && !dashboardText_(record.row.Evidence_ID, '', 100); });
  var escalated = requestRecords.concat(lineRecords, deliverableRecords).filter(function(record) { return String(record.row.Status || '').toUpperCase() === 'ESCALATED' || ['URGENT', 'CRITICAL'].indexOf(String(record.row.Priority || '').toUpperCase()) >= 0; });
  var dueSoon = dashboardDateRecords_(lineRecords, 'Needed_At', now, HAU_DASHBOARD_DUE_SOON_DAYS_, false).concat(dashboardDateRecords_(lendingRecords, 'Due_At', now, HAU_DASHBOARD_DUE_SOON_DAYS_, false));
  var overdue = dashboardDateRecords_(lineRecords, 'Needed_At', now, 0, true).concat(dashboardDateRecords_(lendingRecords, 'Due_At', now, 0, true));
  var lendingReview = dashboardStatusRecords_(lendingRecords, ['FOR_REVIEW']);
  var lendingOverdue = dashboardDateRecords_(lendingRecords, 'Due_At', now, 0, true);
  var upcomingNeeds = eventRecords.filter(function(record) { var start = dashboardDate_(record.row.Start_At); return start && start.getTime() >= now.getTime() && start.getTime() <= now.getTime() + HAU_DASHBOARD_UPCOMING_DAYS_ * 86400000; });
  var completed = dashboardCompletedRecords_(requestRecords.concat(deliverableRecords), now);
  var queues = [
    dashboardQueue_('new-unassigned', 'New or unassigned', 'requests', 'REQUEST', newOrUnassigned),
    dashboardQueue_('requests-review', 'Awaiting review', 'requests', 'REQUEST', review),
    dashboardQueue_('needs-information', 'Needs information', 'requests', 'REQUEST', needsInfo),
    dashboardQueue_('due-soon', 'Due in 7 days', 'overview', 'MIXED', dueSoon),
    dashboardQueue_('overdue', 'Overdue', 'overview', 'MIXED', overdue),
    dashboardQueue_('blocked', 'Blocked or waiting', 'overview', 'MIXED', blocked),
    dashboardQueue_('missing-evidence', 'Missing evidence', 'overview', 'MIXED', missingEvidence),
    dashboardQueue_('escalated', 'Escalated', 'overview', 'MIXED', escalated),
    dashboardQueue_('inventory-attention', 'Inventory attention', 'inventory', 'ITEM', inventoryAttention),
    dashboardQueue_('lending-review', 'Lending review', 'lending', 'LENDING', lendingReview),
    dashboardQueue_('lending-overdue', 'Lending overdue', 'lending', 'LENDING', lendingOverdue),
    dashboardQueue_('upcoming-needs', 'Upcoming needs', 'overview', 'EVENT', upcomingNeeds),
    dashboardQueue_('completed', 'Recent completions', 'overview', 'MIXED', completed)
  ];
  var visibleIds = {};
  requestRecords.forEach(function(record) { visibleIds[record.id] = requestScopes[record.id] || dashboardRowCommitteeIds_(record.row, record.type); });
  lineRecords.forEach(function(record) { visibleIds[record.id] = lineScopes[record.id] || dashboardRowCommitteeIds_(record.row, record.type); });
  deliverableRecords.forEach(function(record) { visibleIds[record.id] = deliverableScopes[record.id] || dashboardRowCommitteeIds_(record.row, record.type); });
  eventRecords.concat(lendingRecords, itemRecords, restockRecords).forEach(function(record) {
    visibleIds[record.id] = dashboardCanonicalIds_(dashboardRowCommitteeIds_(record.row, record.type));
  });
  var historyRows = [];
  try { historyRows = readObjects_(HAU_SHEETS.HISTORY); } catch (error) { historyRows = []; }
  var auditRows = [];
  try { auditRows = readObjects_(HAU_SHEETS.AUDIT); } catch (error) { auditRows = []; }
  var activity = dashboardActivity_(historyRows.concat(auditRows), visibleIds, context);
  var staff = dashboardStaff_(deliverableRecords, now);
  var latest = null;
  [eventRows, requestRows, lineRows, deliverableRows, lendingRows, itemRows, restockRows, historyRows, auditRows].forEach(function(rows) {
    (rows || []).forEach(function(row) { latest = dashboardMaxDate_(latest, row.Updated_At || row.Changed_At || row.Created_At); });
  });
  var lastUpdatedAt = latest ? latest.toISOString() : '';
  var allowedCommittees = context.allowedIds.map(function(id) { return { id: id, name: dashboardCommitteeName_(id) }; });
  var meta = {
    scopeMode: context.scopeMode,
    activeCommitteeId: context.activeId,
    activeCommitteeName: context.activeName,
    allowedCommitteeIds: context.allowedIds.slice(),
    allowedCommittees: allowedCommittees,
    generatedAt: now.toISOString(),
    lastUpdatedAt: lastUpdatedAt,
    stale: false,
    staleAfterSeconds: 300,
    refreshMode: 'REVISION_OR_MANUAL',
    dueSoonDays: HAU_DASHBOARD_DUE_SOON_DAYS_,
    upcomingDays: HAU_DASHBOARD_UPCOMING_DAYS_,
    completedWindowDays: HAU_DASHBOARD_COMPLETED_WINDOW_DAYS_,
    visibleRecordCount: requestRecords.length + lineRecords.length + deliverableRecords.length + eventRecords.length + lendingRecords.length + itemRecords.length + restockRecords.length,
    queueCount: queues.reduce(function(total, queue) { return total + queue.count; }, 0)
  };
  return {
    meta: [meta],
    queues: queues,
    staff: staff,
    activity: activity,
    links: dashboardLinks_(session, context),
    counts: { lendingReview: lendingReview.length, lendingOverdue: lendingOverdue.length, inventoryAttention: inventoryAttention.length }
  };
}
