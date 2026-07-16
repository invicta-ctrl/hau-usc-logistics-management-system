var HAU_AUTHORIZATION_CONTRACT_ = 'canonical-authorization';
var HAU_AUTHORIZATION_CONTRACT_VERSION_ = 2;

var HAU_CAPABILITIES_ = Object.freeze({
  VIEW_REQUEST: 'view.request',
  VIEW_INTERNAL: 'view.internal',
  VIEW_COMMITTEE_SUMMARY: 'view.committee.summary',
  VIEW_ALL_SUMMARY: 'view.all.summary',
  VIEW_AUDIT: 'view.audit',
  VIEW_INVENTORY: 'view.inventory',
  REQUEST_CREATE: 'request.create',
  REQUEST_REVIEW: 'request.review',
  REQUEST_MISSING_INFORMATION: 'request.missing_information',
  REQUEST_REJECT: 'request.reject',
  REQUEST_REOPEN: 'request.reopen',
  ASSIGN_COMMITTEE: 'workflow.assign_committee',
  ASSIGN_STAFF: 'workflow.assign_staff',
  ESCALATE: 'workflow.escalate',
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
  REFERENCE_CATALOG_MANAGE: 'reference.catalog.manage',
  REFERENCE_MANAGE: 'reference.manage',
  ACCESS_ADMIN: 'access.admin',
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_DIAGNOSTICS: 'system.diagnostics',
  EVIDENCE_UPLOAD: 'evidence.upload'
});

var HAU_CAPABILITY_LIST_ = Object.freeze(Object.keys(HAU_CAPABILITIES_).map(function(key) { return HAU_CAPABILITIES_[key]; }));

var HAU_ROLE_REGISTRY_ = Object.freeze({
  REQUESTER: Object.freeze({ id: 'REQUESTER', label: 'Requester', scopeMode: 'SELF', capabilities: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.REQUEST_CREATE, HAU_CAPABILITIES_.LENDING_CREATE] }),
  DOL_STAFF: Object.freeze({ id: 'DOL_STAFF', label: 'DOL Staff', scopeMode: 'COMMITTEE', capabilities: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.VIEW_INTERNAL, HAU_CAPABILITIES_.VIEW_COMMITTEE_SUMMARY, HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.REQUEST_CREATE, HAU_CAPABILITIES_.LENDING_CREATE, HAU_CAPABILITIES_.REQUEST_REVIEW, HAU_CAPABILITIES_.REQUEST_MISSING_INFORMATION, HAU_CAPABILITIES_.REQUEST_REJECT, HAU_CAPABILITIES_.FULFILL_CANVASS, HAU_CAPABILITIES_.FULFILL_PROCURE, HAU_CAPABILITIES_.FULFILL_RESERVE, HAU_CAPABILITIES_.FULFILL_RECEIVE, HAU_CAPABILITIES_.FULFILL_RELEASE, HAU_CAPABILITIES_.LENDING_APPROVE, HAU_CAPABILITIES_.LENDING_HANDOFF, HAU_CAPABILITIES_.LENDING_RETURN, HAU_CAPABILITIES_.EVIDENCE_UPLOAD] }),
  COMMITTEE_HEAD: Object.freeze({ id: 'COMMITTEE_HEAD', label: 'Committee Head', scopeMode: 'COMMITTEE', capabilities: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.VIEW_INTERNAL, HAU_CAPABILITIES_.VIEW_COMMITTEE_SUMMARY, HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.REQUEST_CREATE, HAU_CAPABILITIES_.LENDING_CREATE, HAU_CAPABILITIES_.REQUEST_REVIEW, HAU_CAPABILITIES_.REQUEST_MISSING_INFORMATION, HAU_CAPABILITIES_.REQUEST_REJECT, HAU_CAPABILITIES_.REQUEST_REOPEN, HAU_CAPABILITIES_.ASSIGN_STAFF, HAU_CAPABILITIES_.ESCALATE, HAU_CAPABILITIES_.FULFILL_CANVASS, HAU_CAPABILITIES_.FULFILL_PROCURE, HAU_CAPABILITIES_.FULFILL_RESERVE, HAU_CAPABILITIES_.FULFILL_RECEIVE, HAU_CAPABILITIES_.LENDING_APPROVE, HAU_CAPABILITIES_.INVENTORY_MERGE, HAU_CAPABILITIES_.EVIDENCE_UPLOAD] }),
  DIRECTOR: Object.freeze({ id: 'DIRECTOR', label: 'DOL Director', scopeMode: 'ALL', capabilities: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.VIEW_INTERNAL, HAU_CAPABILITIES_.VIEW_ALL_SUMMARY, HAU_CAPABILITIES_.VIEW_AUDIT, HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.REQUEST_CREATE, HAU_CAPABILITIES_.LENDING_CREATE, HAU_CAPABILITIES_.REQUEST_REVIEW, HAU_CAPABILITIES_.REQUEST_MISSING_INFORMATION, HAU_CAPABILITIES_.REQUEST_REJECT, HAU_CAPABILITIES_.REQUEST_REOPEN, HAU_CAPABILITIES_.ASSIGN_COMMITTEE, HAU_CAPABILITIES_.ASSIGN_STAFF, HAU_CAPABILITIES_.ESCALATE, HAU_CAPABILITIES_.FULFILL_CANVASS, HAU_CAPABILITIES_.FULFILL_PROCURE, HAU_CAPABILITIES_.FULFILL_RESERVE, HAU_CAPABILITIES_.FULFILL_RECEIVE, HAU_CAPABILITIES_.FULFILL_RELEASE, HAU_CAPABILITIES_.LENDING_APPROVE, HAU_CAPABILITIES_.LENDING_HANDOFF, HAU_CAPABILITIES_.LENDING_RETURN, HAU_CAPABILITIES_.INVENTORY_MERGE, HAU_CAPABILITIES_.INVENTORY_ADJUST, HAU_CAPABILITIES_.EVIDENCE_UPLOAD] }),
  ADMINISTRATOR: Object.freeze({ id: 'ADMINISTRATOR', label: 'Administrator', scopeMode: 'ALL', capabilities: [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.VIEW_INTERNAL, HAU_CAPABILITIES_.VIEW_ALL_SUMMARY, HAU_CAPABILITIES_.VIEW_AUDIT, HAU_CAPABILITIES_.VIEW_INVENTORY, HAU_CAPABILITIES_.REQUEST_CREATE, HAU_CAPABILITIES_.LENDING_CREATE, HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE, HAU_CAPABILITIES_.REFERENCE_MANAGE, HAU_CAPABILITIES_.ACCESS_ADMIN, HAU_CAPABILITIES_.SYSTEM_ADMIN, HAU_CAPABILITIES_.SYSTEM_DIAGNOSTICS, HAU_CAPABILITIES_.EVIDENCE_UPLOAD] }),
  READ_ONLY_AUDITOR: Object.freeze({ id: 'READ_ONLY_AUDITOR', label: 'Read-only Auditor', scopeMode: 'ALL', capabilities: [HAU_CAPABILITIES_.VIEW_AUDIT] })
});

var HAU_ROLE_ALIASES_ = Object.freeze({
  ADMIN: 'ADMINISTRATOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
  DOL_DIRECTOR: 'DIRECTOR',
  DIRECTOR: 'DIRECTOR',
  DOL_STAFF: 'DOL_STAFF',
  'DOL STAFF': 'DOL_STAFF',
  COMMITTEE_HEAD: 'COMMITTEE_HEAD',
  'COMMITTEE HEAD': 'COMMITTEE_HEAD',
  REQUESTER: 'REQUESTER',
  READ_ONLY_AUDITOR: 'READ_ONLY_AUDITOR',
  'READ ONLY AUDITOR': 'READ_ONLY_AUDITOR'
});

var HAU_COMMITTEE_REGISTRY_ = Object.freeze([
  Object.freeze({ id: 'COM_FOOD', name: 'Food Committee', aliases: ['FOOD', 'FOOD COMMITTEE'] }),
  Object.freeze({ id: 'COM_INVENTORY_PANTRY', name: 'Inventory and Pantry Committee', aliases: ['INVENTORY', 'INVENTORY COMMITTEE', 'INVENTORY AND PANTRY COMMITTEE', 'INVENTORY & PANTRY COMMITTEE', 'PANTRY COMMITTEE'] }),
  Object.freeze({ id: 'COM_MATERIALS', name: 'Materials Committee', aliases: ['MATERIALS', 'MATERIALS COMMITTEE'] })
]);

var ROLE_PERMISSIONS_ = Object.freeze({
  REQUESTER: [],
  DOL_STAFF: ['Can_Review', 'Can_Release', 'Can_Receive'],
  COMMITTEE_HEAD: ['Can_Review', 'Can_Receive'],
  DIRECTOR: ['Can_Review', 'Can_Release', 'Can_Receive'],
  DOL_DIRECTOR: ['Can_Review', 'Can_Release', 'Can_Receive', 'Can_Admin', 'Can_Manage_Catalog'],
  ADMIN: ['Can_Review', 'Can_Release', 'Can_Receive', 'Can_Admin', 'Can_Manage_Catalog'],
  ADMINISTRATOR: ['Can_Admin', 'Can_Manage_Catalog'],
  READ_ONLY_AUDITOR: []
});

var HAU_FLAG_CAPABILITY_MAP_ = Object.freeze({
  Can_Review: HAU_CAPABILITIES_.REQUEST_REVIEW,
  Can_Release: HAU_CAPABILITIES_.FULFILL_RELEASE,
  Can_Receive: HAU_CAPABILITIES_.FULFILL_RECEIVE,
  Can_Admin: HAU_CAPABILITIES_.SYSTEM_ADMIN,
  Can_Manage_Catalog: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE
});

var HAU_OPERATION_CAPABILITIES_ = Object.freeze({
  getAuditTimeline: HAU_CAPABILITIES_.VIEW_AUDIT,
  getDataRevision: HAU_CAPABILITIES_.VIEW_INTERNAL,
  getInventoryItem: HAU_CAPABILITIES_.VIEW_INVENTORY,
  searchCatalog: HAU_CAPABILITIES_.VIEW_REQUEST,
  submitRequest: HAU_CAPABILITIES_.REQUEST_CREATE,
  submitCompositeRequest: HAU_CAPABILITIES_.REQUEST_CREATE,
  getCompositeRequest: HAU_CAPABILITIES_.VIEW_REQUEST,
  getFoodWorkQueue: HAU_CAPABILITIES_.VIEW_REQUEST,
  updateFoodComponent: HAU_CAPABILITIES_.REQUEST_REVIEW,
  getMaterialsWorkQueue: HAU_CAPABILITIES_.VIEW_REQUEST,
  updateMaterialsComponent: HAU_CAPABILITIES_.REQUEST_REVIEW,
  searchVenueEquipmentReferences: HAU_CAPABILITIES_.VIEW_REQUEST,
  getVenueEquipmentWorkQueue: HAU_CAPABILITIES_.VIEW_REQUEST,
  updateVenueEquipmentComponent: HAU_CAPABILITIES_.REQUEST_REVIEW,
  transitionCompositeComponent: HAU_CAPABILITIES_.REQUEST_REVIEW,
  cancelCompositeRequest: HAU_CAPABILITIES_.REQUEST_REVIEW,
  reopenCompositeRequest: HAU_CAPABILITIES_.REQUEST_REOPEN,
  amendCompositeRequest: HAU_CAPABILITIES_.REQUEST_REVIEW,
  addCompositeSection: HAU_CAPABILITIES_.REQUEST_REVIEW,
  assignCompositeComponent: HAU_CAPABILITIES_.ASSIGN_STAFF,
  escalateCompositeComponent: HAU_CAPABILITIES_.ESCALATE,
  reviewRequest: HAU_CAPABILITIES_.REQUEST_REVIEW,
  reserveStock: HAU_CAPABILITIES_.FULFILL_RESERVE,
  createLendingTicket: HAU_CAPABILITIES_.LENDING_CREATE,
  approveLendingTicket: HAU_CAPABILITIES_.LENDING_APPROVE,
  confirmLendingHandoff: HAU_CAPABILITIES_.LENDING_HANDOFF,
  confirmReturn: HAU_CAPABILITIES_.LENDING_RETURN,
  saveCanvassReference: HAU_CAPABILITIES_.FULFILL_CANVASS,
  selectPreferredCanvass: HAU_CAPABILITIES_.FULFILL_CANVASS,
  getRestockDetail: HAU_CAPABILITIES_.VIEW_REQUEST,
  transitionRestock: HAU_CAPABILITIES_.FULFILL_PROCURE,
  receiveRestock: HAU_CAPABILITIES_.FULFILL_RECEIVE,
  receiveDeliverable: HAU_CAPABILITIES_.FULFILL_RECEIVE,
  confirmRelease: HAU_CAPABILITIES_.FULFILL_RELEASE,
  transferEventItemToInventory: HAU_CAPABILITIES_.INVENTORY_MERGE,
  uploadEvidence: HAU_CAPABILITIES_.EVIDENCE_UPLOAD,
  transitionDeliverable: HAU_CAPABILITIES_.FULFILL_RECEIVE,
  postEmergencyIssue: HAU_CAPABILITIES_.FULFILL_RELEASE,
  postCycleCountAdjustment: HAU_CAPABILITIES_.INVENTORY_ADJUST,
  createInventoryItem: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE,
  updateInventoryItem: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE,
  updateInventoryStorageContext: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE,
  archiveInventoryItem: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE,
  restoreInventoryItem: HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE,
  getReferenceAdminWorkspace: HAU_CAPABILITIES_.REFERENCE_MANAGE,
  previewReferenceAdminChange: HAU_CAPABILITIES_.REFERENCE_MANAGE,
  submitReferenceAdminChange: HAU_CAPABILITIES_.REFERENCE_MANAGE,
  reviewReferenceAdminChange: HAU_CAPABILITIES_.ACCESS_ADMIN,
  healthCheck: HAU_CAPABILITIES_.SYSTEM_DIAGNOSTICS,
  createLaunchBackup: HAU_CAPABILITIES_.SYSTEM_ADMIN,
  runMigrationDryRun: HAU_CAPABILITIES_.SYSTEM_ADMIN,
  applyApprovedMigration: HAU_CAPABILITIES_.SYSTEM_ADMIN,
  runReconciliation: HAU_CAPABILITIES_.SYSTEM_ADMIN,
  seedRolesAndPermissions: HAU_CAPABILITIES_.ACCESS_ADMIN,
  getAuthorizationContract: HAU_CAPABILITIES_.ACCESS_ADMIN,
  runAuthorizationMappingDryRun: HAU_CAPABILITIES_.ACCESS_ADMIN,
  applyAuthorizationMapping: HAU_CAPABILITIES_.ACCESS_ADMIN,
  runRosterSync: HAU_CAPABILITIES_.ACCESS_ADMIN,
  getRosterSyncHealth: HAU_CAPABILITIES_.ACCESS_ADMIN,
  setRosterEmergencyDeny: HAU_CAPABILITIES_.ACCESS_ADMIN,
  setupRosterSyncTrigger: HAU_CAPABILITIES_.SYSTEM_ADMIN
});

var HAU_SCOPE_OPTIONAL_OPERATIONS_ = Object.freeze({
  getDataRevision: true,
  searchCatalog: true,
  searchVenueEquipmentReferences: true,
  getInventoryItem: true,
  submitRequest: true,
  submitCompositeRequest: true,
  getCompositeRequest: true,
  reserveStock: true,
  createLendingTicket: true,
  approveLendingTicket: true,
  confirmLendingHandoff: true,
  confirmReturn: true,
  uploadEvidence: true,
  postEmergencyIssue: true,
  postCycleCountAdjustment: true
});

function authorizationNormalize_(value) {
  return String(value == null ? '' : value).trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function canonicalRoleId_(value) {
  var raw = String(value == null ? '' : value).trim();
  var normalized = authorizationNormalize_(raw);
  if (HAU_ROLE_REGISTRY_[normalized]) return normalized;
  return HAU_ROLE_ALIASES_[raw] || HAU_ROLE_ALIASES_[normalized] || '';
}

function canonicalRole_(value) {
  var id = canonicalRoleId_(value);
  return id ? HAU_ROLE_REGISTRY_[id] : null;
}

function canonicalCommitteeId_(value) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) return '';
  var normalized = authorizationNormalize_(raw);
  for (var index = 0; index < HAU_COMMITTEE_REGISTRY_.length; index += 1) {
    var committee = HAU_COMMITTEE_REGISTRY_[index];
    if (raw === committee.id || normalized === authorizationNormalize_(committee.id) || normalized === authorizationNormalize_(committee.name)) return committee.id;
    if (committee.aliases.some(function(alias) { return normalized === authorizationNormalize_(alias); })) return committee.id;
  }
  return '';
}

function canonicalCommittee_(value) {
  var id = canonicalCommitteeId_(value);
  return HAU_COMMITTEE_REGISTRY_.filter(function(committee) { return committee.id === id; })[0] || null;
}

function authorizationUnique_(values) {
  var result = [];
  (values || []).forEach(function(value) { if (value && result.indexOf(value) < 0) result.push(value); });
  return result;
}

function authorizationJsonObject_(value) {
  if (!value) return { value: {}, valid: true };
  if (Object.prototype.toString.call(value) === '[object Object]') return { value: value, valid: true };
  try {
    var parsed = JSON.parse(String(value));
    return { value: parsed, valid: Object.prototype.toString.call(parsed) === '[object Object]' };
  } catch (error) {
    return { value: {}, valid: false };
  }
}

function authorizationJsonArray_(value) {
  if (Array.isArray(value)) return { value: value, valid: true };
  if (value == null || value === '') return { value: [], valid: true };
  try {
    var parsed = JSON.parse(String(value));
    return { value: parsed, valid: Array.isArray(parsed) };
  } catch (error) {
    return { value: [], valid: false };
  }
}

function authorizationActiveValue_(value) {
  var token = String(value == null ? '' : value).trim().toUpperCase();
  return { active: value === true || token === 'TRUE', valid: value === true || value === false || token === 'TRUE' || token === 'FALSE' };
}

function authorizationMembershipRows_(user, suppliedRows) {
  if (suppliedRows) return suppliedRows.filter(function(row) { return String(row.User_ID || '') === String(user && user.User_ID || ''); });
  if (typeof readObjects_ !== 'function' || !HAU_SHEETS.USER_COMMITTEE_SCOPE) return [];
  try { return readObjects_(HAU_SHEETS.USER_COMMITTEE_SCOPE).filter(function(row) { return String(row.User_ID || '') === String(user && user.User_ID || ''); }); } catch (error) { return []; }
}

function authorizationAllMembershipRows_() {
  if (typeof readObjects_ !== 'function' || !HAU_SHEETS.USER_COMMITTEE_SCOPE) return [];
  try { return readObjects_(HAU_SHEETS.USER_COMMITTEE_SCOPE); } catch (error) { return []; }
}

function authorizationCommitteeResolution_(user, options) {
  var issues = [], ids = [], rows = authorizationMembershipRows_(user, options && options.membershipRows);
  if (rows.length) {
    rows.forEach(function(row) {
       if (authorizationActiveValue_(row.Active).valid && !authorizationActiveValue_(row.Active).active) return;
      var id = canonicalCommitteeId_(row.Committee_ID || row.Committee || '');
      if (id) ids.push(id); else if (row.Committee_ID || row.Committee) issues.push('UNKNOWN_COMMITTEE');
    });
  } else {
    var parsed = authorizationJsonArray_(user && user.Committee_IDs_JSON);
    if (!parsed.valid) issues.push('INVALID_COMMITTEE_MAPPING');
    if (parsed.valid && parsed.value.length) {
      parsed.value.forEach(function(value) { var id = canonicalCommitteeId_(value); if (id) ids.push(id); else issues.push('UNKNOWN_COMMITTEE'); });
    } else {
      var legacy = String(user && user.Committee || '').split(/[|,;]/).map(function(value) { return value.trim(); }).filter(Boolean);
      legacy.forEach(function(value) { var id = canonicalCommitteeId_(value); if (id) ids.push(id); else issues.push('UNKNOWN_COMMITTEE'); });
    }
  }
  return { ids: authorizationUnique_(ids), issues: authorizationUnique_(issues) };
}

function authorizationContext_(user, options) {
  var row = user || {}, roleId = canonicalRoleId_(row.Role_ID || row.Role), role = roleId ? HAU_ROLE_REGISTRY_[roleId] : null;
  var activeValue = authorizationActiveValue_(row.Active), active = activeValue.active;
  var committees = authorizationCommitteeResolution_(row, options || {});
  var issues = committees.issues.slice();
  if (!role) issues.push('UNKNOWN_ROLE');
  if (!activeValue.valid) issues.push('INVALID_ACTIVE');
  if (activeValue.valid && !active) issues.push('INACTIVE_USER');
  var capabilities = role ? role.capabilities.slice() : [];
  var override = authorizationJsonObject_(row.Authorization_Overrides_JSON);
  if (!override.valid || (override.valid && override.value && (override.value.grant !== undefined || override.value.revoke !== undefined) && (!Array.isArray(override.value.grant || []) || !Array.isArray(override.value.revoke || [])))) issues.push('INVALID_CAPABILITY_OVERRIDE');
  if (override.valid && override.value && role) {
    (override.value.grant || []).forEach(function(capability) { if (HAU_CAPABILITY_LIST_.indexOf(capability) >= 0) capabilities.push(capability); else issues.push('UNKNOWN_CAPABILITY'); });
    (override.value.revoke || []).forEach(function(capability) {
      if (HAU_CAPABILITY_LIST_.indexOf(capability) >= 0) capabilities = capabilities.filter(function(existing) { return existing !== capability; }); else issues.push('UNKNOWN_CAPABILITY');
    });
  }
  capabilities = authorizationUnique_(capabilities);
  if (role && role.scopeMode === 'COMMITTEE' && !committees.ids.length) issues.push('MISSING_COMMITTEE_SCOPE');
  var status = !role ? 'UNKNOWN_ROLE' : activeValue.valid && !active ? 'INACTIVE' : issues.length ? 'NEEDS_REVIEW' : 'MAPPED';
  if (status !== 'MAPPED') capabilities = [];
  return {
    contract: HAU_AUTHORIZATION_CONTRACT_,
    contractVersion: HAU_AUTHORIZATION_CONTRACT_VERSION_,
    modelVersion: authorizationContractVersion_(),
    active: active,
    activeValid: activeValue.valid,
    roleId: roleId,
    roleLabel: role ? role.label : '',
    scopeMode: role ? role.scopeMode : 'DENY',
    committeeIds: committees.ids,
    capabilities: capabilities,
    mappingStatus: status,
    issues: authorizationUnique_(issues)
  };
}

function authorizationContractVersion_() {
  try { return resolveAuthorizationContractVersion_(PropertiesService.getScriptProperties()); } catch (error) { return 1; }
}

function authorizationResourceCommitteeIds_(resource) {
  var values = [];
  resource = resource || {};
  [].concat(resource.committeeIds || [], resource.committeeId || [], resource.committee || [], resource.assignedCommittee || [], resource.ownerCommittee || []).forEach(function(value) {
    if (Array.isArray(value)) value.forEach(function(item) { var id = canonicalCommitteeId_(item); if (id) values.push(id); });
    else { var id = canonicalCommitteeId_(value); if (id) values.push(id); }
  });
  return authorizationUnique_(values);
}

function authorizationDecision_(user, capability, resource, options) {
  var context = authorizationContext_(user, options || {}), opts = options || {};
  if (!context.active && context.activeValid) return { allowed: false, reason: 'INACTIVE_USER', context: context };
  if (!context.roleId) return { allowed: false, reason: 'UNKNOWN_ROLE', context: context };
  if (context.mappingStatus !== 'MAPPED') return { allowed: false, reason: 'MAPPING_RECONCILIATION_REQUIRED', context: context };
  if (context.capabilities.indexOf(capability) < 0) return { allowed: false, reason: 'CAPABILITY_NOT_GRANTED', context: context };
  if (context.scopeMode === 'COMMITTEE') {
    if (!context.committeeIds.length) return { allowed: false, reason: 'MISSING_COMMITTEE_SCOPE', context: context };
    var resourceIds = authorizationResourceCommitteeIds_(resource);
    if (!resourceIds.length) {
      if (!opts.allowUnresolvedScope) return { allowed: false, reason: 'ENTITY_SCOPE_REQUIRED', context: context };
    } else if (!resourceIds.every(function(id) { return context.committeeIds.indexOf(id) >= 0; })) {
      return { allowed: false, reason: 'OUT_OF_SCOPE', context: context };
    }
  }
  if (context.scopeMode === 'SELF' && resource && resource.userId && String(resource.userId) !== String(user && user.User_ID || '')) return { allowed: false, reason: 'SELF_SCOPE_ONLY', context: context };
  return { allowed: true, reason: '', context: context };
}

function authorizationCan_(user, capability, resource, options) {
  return authorizationDecision_(user, capability, resource, options).allowed;
}

function authorizationMessage_(reason) {
  return ({
    INACTIVE_USER: 'Your access is inactive.',
    AMBIGUOUS_IDENTITY: 'Your account has multiple active access mappings and requires administrator review.',
    UNKNOWN_ROLE: 'Your account role is not recognized.',
    CAPABILITY_NOT_GRANTED: 'Your account is not permitted to perform this action.',
    MISSING_COMMITTEE_SCOPE: 'Your account has no active committee scope for this action.',
    ENTITY_SCOPE_REQUIRED: 'The requested record has no verified authorization scope.',
    OUT_OF_SCOPE: 'The requested record is outside your authorized committee scope.',
    SELF_SCOPE_ONLY: 'This action is limited to your own request scope.'
    ,MAPPING_RECONCILIATION_REQUIRED: 'Your account authorization mapping requires reconciliation before this action is available.'
  })[reason] || 'This action is not authorized.';
}

function authorizationRequire_(user, capability, resource, options) {
  var decision = authorizationDecision_(user, capability, resource, options);
  if (!decision.allowed) throw appError_('AUTHORIZATION_DENIED', authorizationMessage_(decision.reason), false, { reason: decision.reason });
  return user;
}

function authorizationDto_(user, suppliedContext) {
  var context = suppliedContext || authorizationContext_(user), committees = context.committeeIds.map(function(id) {
    var committee = canonicalCommittee_(id);
    return { id: id, name: committee ? committee.name : id };
  });
  return {
    contract: context.contract,
    contractVersion: context.contractVersion,
    modelVersion: context.modelVersion,
    roleId: context.roleId || '',
    roleLabel: context.roleLabel || '',
    scopeMode: context.scopeMode,
    committeeIds: context.committeeIds,
    committees: committees,
    capabilities: context.capabilities,
    mappingStatus: context.mappingStatus,
    active: context.active
  };
}

function authorizationResourceAddRow_(resource, row) {
  if (!row) return;
  ['Committee_ID', 'Committee', 'Assigned_Committee', 'Owner_Committee', 'Owner_Committee_ID'].forEach(function(field) {
    var id = canonicalCommitteeId_(row[field]);
    if (id) resource.committeeIds.push(id);
  });
}

function authorizationResourceFindOne_(sheet, key, value) {
  if (!value || typeof findOne_ !== 'function') return null;
  try { return findOne_(sheet, key, value); } catch (error) { return null; }
}

function authorizationResourceFindAll_(sheet, predicate) {
  if (typeof findAll_ !== 'function') return [];
  try { return findAll_(sheet, predicate) || []; } catch (error) { return []; }
}

function authorizationResourceAppendEvent_(resource, eventId) {
  var event = authorizationResourceFindOne_(HAU_SHEETS.EVENTS, 'Event_ID', eventId);
  authorizationResourceAddRow_(resource, event);
}

function authorizationResourceAppendRequest_(resource, requestId) {
  var request = authorizationResourceFindOne_(HAU_SHEETS.REQUESTS, 'Request_ID', requestId);
  if (!request) return;
  authorizationResourceAddRow_(resource, request);
  if (request.Event_ID) authorizationResourceAppendEvent_(resource, request.Event_ID);
}

function authorizationResourceAppendRequestLine_(resource, lineId) {
  var line = authorizationResourceFindOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', lineId);
  if (!line) return;
  authorizationResourceAddRow_(resource, line);
  if (line.Request_ID) authorizationResourceAppendRequest_(resource, line.Request_ID);
  if (line.Event_ID) authorizationResourceAppendEvent_(resource, line.Event_ID);
}

function authorizationResourceAppendDeliverable_(resource, deliverableId) {
  var deliverable = authorizationResourceFindOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', deliverableId);
  if (!deliverable) return;
  authorizationResourceAddRow_(resource, deliverable);
  if (deliverable.Request_Line_ID) authorizationResourceAppendRequestLine_(resource, deliverable.Request_Line_ID);
  if (deliverable.Request_ID) authorizationResourceAppendRequest_(resource, deliverable.Request_ID);
  if (deliverable.Event_ID) authorizationResourceAppendEvent_(resource, deliverable.Event_ID);
}

function authorizationResourceAppendRestock_(resource, restockId) {
  var restock = authorizationResourceFindOne_(HAU_SHEETS.RESTOCK, 'Restock_ID', restockId);
  if (!restock) return;
  authorizationResourceAddRow_(resource, restock);
  if (restock.Source_Request_Line_ID) authorizationResourceAppendRequestLine_(resource, restock.Source_Request_Line_ID);
  if (restock.Source_Request_ID) authorizationResourceAppendRequest_(resource, restock.Source_Request_ID);
}

function authorizationResourceAppendCanvass_(resource, canvassId) {
  var canvass = authorizationResourceFindOne_(HAU_SHEETS.CANVASS, 'Canvass_ID', canvassId);
  if (!canvass) return;
  authorizationResourceAddRow_(resource, canvass);
  if (canvass.Linked_Request_Line_ID) authorizationResourceAppendRequestLine_(resource, canvass.Linked_Request_Line_ID);
  if (canvass.Linked_Deliverable_ID) authorizationResourceAppendDeliverable_(resource, canvass.Linked_Deliverable_ID);
  if (canvass.Linked_Restock_ID) authorizationResourceAppendRestock_(resource, canvass.Linked_Restock_ID);
}

function authorizationResourceAppendLending_(resource, ticketId) {
  var ticket = authorizationResourceFindOne_(HAU_SHEETS.LENDING, 'Lending_Ticket_ID', ticketId);
  if (!ticket) return;
  authorizationResourceAddRow_(resource, ticket);
  if (ticket.Request_ID) authorizationResourceAppendRequest_(resource, ticket.Request_ID);
  if (ticket.Event_ID) authorizationResourceAppendEvent_(resource, ticket.Event_ID);
}

function authorizationResourceAppendRelease_(resource, releaseId) {
  var release = authorizationResourceFindOne_(HAU_SHEETS.RELEASES, 'Release_ID', releaseId);
  if (!release) return;
  authorizationResourceAddRow_(resource, release);
  if (release.Request_ID) authorizationResourceAppendRequest_(resource, release.Request_ID);
  if (release.Event_ID) authorizationResourceAppendEvent_(resource, release.Event_ID);
}

function authorizationResourceAppendEntity_(resource, type, id) {
  if (!id) return;
  var normalized = authorizationNormalize_(type);
  if (normalized === 'EVENT') return authorizationResourceAppendEvent_(resource, id);
  if (normalized === 'REQUEST') return authorizationResourceAppendRequest_(resource, id);
  if (normalized === 'REQUEST_LINE') return authorizationResourceAppendRequestLine_(resource, id);
  if (normalized === 'DELIVERABLE') return authorizationResourceAppendDeliverable_(resource, id);
  if (normalized === 'RESTOCK') return authorizationResourceAppendRestock_(resource, id);
  if (normalized === 'CANVASS') return authorizationResourceAppendCanvass_(resource, id);
  if (normalized === 'LENDING' || normalized === 'LENDING_TICKET') return authorizationResourceAppendLending_(resource, id);
  if (normalized === 'RELEASE') return authorizationResourceAppendRelease_(resource, id);
}

function authorizationResourceAppendEventItem_(resource, eventItemId) {
  if (!eventItemId) return;
  authorizationResourceFindAll_(HAU_SHEETS.REQUEST_LINES, function(row) { return String(row.Event_Item_ID) === String(eventItemId); }).forEach(function(row) {
    authorizationResourceAddRow_(resource, row);
    if (row.Request_ID) authorizationResourceAppendRequest_(resource, row.Request_ID);
    if (row.Event_ID) authorizationResourceAppendEvent_(resource, row.Event_ID);
  });
  authorizationResourceFindAll_(HAU_SHEETS.DELIVERABLES, function(row) { return String(row.Event_Item_ID) === String(eventItemId); }).forEach(function(row) {
    authorizationResourceAddRow_(resource, row);
    if (row.Request_Line_ID) authorizationResourceAppendRequestLine_(resource, row.Request_Line_ID);
    if (row.Request_ID) authorizationResourceAppendRequest_(resource, row.Request_ID);
    if (row.Event_ID) authorizationResourceAppendEvent_(resource, row.Event_ID);
  });
}

function authorizationResourceFromCommand_(operationName, command) {
  if (arguments.length === 1) { command = operationName; operationName = ''; }
  command = command || {};
  var resource = { committeeIds: [], userId: command.userId || command.createdBy || '' };
  authorizationResourceCommitteeIds_(command).forEach(function(id) { resource.committeeIds.push(id); });
  authorizationResourceAppendEvent_(resource, command.eventId);
  authorizationResourceAppendRequest_(resource, command.requestId || command.sourceRequestId);
  authorizationResourceAppendRequestLine_(resource, command.requestLineId || command.sourceRequestLineId || command.linkedRequestLineId || command.linkedLineId);
  authorizationResourceAppendDeliverable_(resource, command.deliverableId || command.linkedDeliverableId);
  authorizationResourceAppendRestock_(resource, command.restockId || command.linkedRestockId);
  authorizationResourceAppendCanvass_(resource, command.canvassId);
  authorizationResourceAppendLending_(resource, command.ticketId || command.lendingTicketId);
  authorizationResourceAppendRelease_(resource, command.releaseId);
  authorizationResourceAppendEventItem_(resource, command.eventItemId);
  [].concat(command.lines || []).forEach(function(line) {
    if (line && line.requestLineId) authorizationResourceAppendRequestLine_(resource, line.requestLineId);
  });
  if (String(operationName || '') !== 'getCompositeRequest' && /(?:Composite|Food|Materials|VenueEquipment)/.test(String(operationName || '')) && typeof authorizationResourceFindAll_ === 'function' && HAU_SHEETS.COMPOSITE_REQUESTS) {
    authorizationResourceFindAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) {
      if (command.componentId) return String(row.Component_ID) === String(command.componentId);
      return command.requestId && String(row.Request_ID) === String(command.requestId);
    }).forEach(function(row) { authorizationResourceAddRow_(resource, row); });
  }
  authorizationResourceAppendEntity_(resource, command.entityType || command.relatedEntityType, command.entityId || command.relatedEntityId);
  if (command.evidence) {
    authorizationResourceAppendEntity_(resource, command.evidence.relatedEntityType, command.evidence.relatedEntityId);
    authorizationResourceAppendRequest_(resource, command.evidence.requestId);
    authorizationResourceAppendRequestLine_(resource, command.evidence.requestLineId);
    authorizationResourceAppendEvent_(resource, command.evidence.eventId);
    authorizationResourceAppendEventItem_(resource, command.evidence.eventItemId);
  }
  resource.committeeIds = authorizationUnique_(resource.committeeIds);
  return resource;
}

function authorizeOperation_(operationName, command) {
  if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() < 2) return null;
  var capability = HAU_OPERATION_CAPABILITIES_[operationName];
  if (!capability) return null;
  var user = resolveCurrentUser_();
  var allowUnresolvedScope = [HAU_CAPABILITIES_.VIEW_REQUEST, HAU_CAPABILITIES_.VIEW_INTERNAL].indexOf(capability) >= 0 || HAU_SCOPE_OPTIONAL_OPERATIONS_[operationName] === true;
  return authorizationRequire_(user, capability, authorizationResourceFromCommand_(operationName, command), { allowUnresolvedScope: allowUnresolvedScope });
}

function authorizationContractDto_() {
  return {
    contract: HAU_AUTHORIZATION_CONTRACT_,
    contractVersion: HAU_AUTHORIZATION_CONTRACT_VERSION_,
    modelVersion: authorizationContractVersion_(),
    roles: Object.keys(HAU_ROLE_REGISTRY_).map(function(id) { var role = HAU_ROLE_REGISTRY_[id]; return { id: role.id, label: role.label, scopeMode: role.scopeMode, capabilities: role.capabilities.slice() }; }),
    committees: HAU_COMMITTEE_REGISTRY_.map(function(committee) { return { id: committee.id, name: committee.name }; }),
    capabilities: HAU_CAPABILITY_LIST_.slice()
  };
}

function authorizationMappingDryRun_() {
  var users = typeof readObjects_ === 'function' ? readObjects_(HAU_SHEETS.USERS) : [], membershipRows = authorizationAllMembershipRows_(), report = {
    mode: 'DRY_RUN',
    contract: HAU_AUTHORIZATION_CONTRACT_,
    contractVersion: HAU_AUTHORIZATION_CONTRACT_VERSION_,
    modelVersion: authorizationContractVersion_(),
    totalUsers: users.length,
    activeUsers: 0,
    mappedUsers: 0,
    needsReviewUsers: 0,
    unknownRoleCount: 0,
    unknownCommitteeCount: 0,
    missingCommitteeScopeCount: 0,
    invalidOverrideCount: 0,
    unresolvedIssueCount: 0,
    countsByRole: {},
    countsByCommittee: {},
    issueRows: [],
    activationReady: false,
    destructiveChanges: 0,
    immutableHistoryChanged: 0,
    legacyLabelsPreserved: true
  };
  users.forEach(function(user, index) {
    if (authorizationActiveValue_(user.Active).active) report.activeUsers += 1;
    var context = authorizationContext_(user, { membershipRows: membershipRows }), rowNumber = Number(user._row || index + 2);
    if (context.mappingStatus === 'MAPPED' || context.mappingStatus === 'INACTIVE') report.mappedUsers += context.mappingStatus === 'MAPPED' ? 1 : 0; else report.needsReviewUsers += 1;
    if (context.roleId) report.countsByRole[context.roleId] = Number(report.countsByRole[context.roleId] || 0) + 1;
    context.committeeIds.forEach(function(id) { report.countsByCommittee[id] = Number(report.countsByCommittee[id] || 0) + 1; });
    context.issues.forEach(function(issue) {
      if (issue === 'UNKNOWN_ROLE') report.unknownRoleCount += 1;
      if (issue === 'UNKNOWN_COMMITTEE') report.unknownCommitteeCount += 1;
      if (issue === 'MISSING_COMMITTEE_SCOPE') report.missingCommitteeScopeCount += 1;
      if (issue === 'INVALID_CAPABILITY_OVERRIDE') report.invalidOverrideCount += 1;
    });
    if (context.mappingStatus !== 'INACTIVE' && context.issues.length) report.unresolvedIssueCount += context.issues.length;
    if (context.issues.length) report.issueRows.push({ row: rowNumber, status: context.mappingStatus, issues: context.issues.slice() });
  });
  report.activationReady = report.unresolvedIssueCount === 0;
  return report;
}

function applyAuthorizationMapping_(command, correlationId) {
  return withScriptLock_(function() {
    var user = resolveCurrentUser_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var approved = String(getConfigValue_('AUTHORIZATION_MAPPING_APPROVED', false) || '').toUpperCase() === 'TRUE';
    if (!approved) throw appError_('AUTHORIZATION_MAPPING_NOT_APPROVED', 'Authorization mapping is not approved for activation.', false, { reason: 'APPROVAL_REQUIRED' });
    var report = authorizationMappingDryRun_();
    if (!report.activationReady) throw appError_('AUTHORIZATION_MAPPING_INCOMPLETE', 'Authorization mapping has unresolved records.', false, { reason: 'RECONCILIATION_REQUIRED' });
    var users = readObjects_(HAU_SHEETS.USERS), applied = [];
    users.forEach(function(row) {
      var context = authorizationContext_(row);
      var patch = { Role_ID: context.roleId, Committee_IDs_JSON: JSON.stringify(context.committeeIds), Authorization_Status: context.mappingStatus, Authorization_Revision: 'AUTH-2' };
      if (context.roleId && row._row) { updateObject_(HAU_SHEETS.USERS, row._row, patch); applied.push(row._row); }
    });
    setConfigValue_('AUTHORIZATION_MAPPING_VERSION', 'AUTH-2', 'ALL', 'Canonical authorization mapping version', 'VALID', user);
    var result = { mode: 'APPLIED', appliedCount: applied.length, destructiveChanges: 0, immutableHistoryChanged: 0, reconciliation: report };
    audit_('APPLY_AUTHORIZATION_MAPPING', 'USERS_ACCESS', 'BATCH', user, correlationId, { after: { appliedCount: applied.length, revision: 'AUTH-2', destructiveChanges: 0, immutableHistoryChanged: 0 } });
    return recordIdempotency_(key, result, user, correlationId);
  });
}

function runAuthorizationMappingDryRun() { return guardApi_('runAuthorizationMappingDryRun', {}, function() { requireCapability_(HAU_CAPABILITIES_.ACCESS_ADMIN); return authorizationMappingDryRun_(); }); }
function applyAuthorizationMapping(command) { return guardMutationApi_('applyAuthorizationMapping', command || {}, function(correlationId) { return applyAuthorizationMapping_(command || {}, correlationId); }); }
function api_getAuthorizationContract() { return guardApi_('getAuthorizationContract', {}, function() { requireCapability_(HAU_CAPABILITIES_.ACCESS_ADMIN); return authorizationContractDto_(); }); }
