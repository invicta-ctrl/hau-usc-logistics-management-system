var HAU_REFERENCE_ADMIN_DOMAINS_ = Object.freeze({
  ORGANIZATION: { fields: ['displayName','aliases','description','effectiveFrom','effectiveTo'] },
  PEOPLE_MEMBERSHIPS: { fields: [], rosterOwned: true },
  COMMITTEES: { fields: ['displayName','aliases','description','effectiveFrom','effectiveTo'] },
  VENUES: { fields: ['displayName','aliases','category','location','unit','requestability','contactRole','routeId','effectiveFrom','effectiveTo','notes'] },
  EQUIPMENT: { fields: ['displayName','aliases','category','location','unit','requestability','contactRole','routeId','returnRequired','effectiveFrom','effectiveTo','notes'] },
  ROUTING: { fields: ['matchKind','referenceId','referenceType','category','ownerCommitteeId','ownerUserId','responsibleOfficeId','approvingAuthorityId','leadTimeBusinessDays','instructions','effectiveFrom','effectiveTo','notes'], review: true },
  LIFECYCLE: { fields: ['displayName','description','effectiveFrom','effectiveTo'] },
  PERMISSIONS: { fields: ['roleId','committeeIds','active','emergencyRevocation','reason'], review: true },
  SYNC_HEALTH: { fields: [], readOnly: true }
});
var HAU_REFERENCE_ADMIN_ACTIONS_ = ['ADD','UPDATE','ARCHIVE','RESTORE'];

function referenceAdminActor_(review) {
  if(typeof authorizationContractVersion_!=='function'||authorizationContractVersion_()<2){var legacy=resolveCurrentUser_(),legacyRole=canonicalRoleId_(legacy.Role_ID||legacy.Role||'');if(legacyRole!=='ADMINISTRATOR')throw appError_('FORBIDDEN','This administrative operation is not authorized.',false);return legacy;}
  var capability=review?HAU_CAPABILITIES_.ACCESS_ADMIN:HAU_CAPABILITIES_.REFERENCE_MANAGE;
  var actor=resolveCurrentUser_();
  if(typeof authorizationCan_!=='function'||!authorizationCan_(actor,capability,null,{allowUnresolvedScope:true}))throw appError_('FORBIDDEN','This administrative operation is not authorized.',false);
  return actor;
}

function referenceAdminText_(value, field, required, max) {
  var normalized = String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  if (required && !normalized) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR', field + ' is required.', false, { field: field });
  if (normalized.length > Number(max || 500)) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR', field + ' is too long.', false, { field: field });
  return normalized;
}
function referenceAdminDomain_(value) {
  var domain = referenceAdminText_(value, 'domain', true, 40).toUpperCase();
  if (!HAU_REFERENCE_ADMIN_DOMAINS_[domain]) throw appError_('REFERENCE_ADMIN_DOMAIN_UNSUPPORTED', 'The administrative domain is not supported.', false, { domain: domain });
  return domain;
}
function referenceAdminAction_(value) {
  var action = referenceAdminText_(value, 'action', true, 20).toUpperCase();
  if (HAU_REFERENCE_ADMIN_ACTIONS_.indexOf(action) < 0) throw appError_('REFERENCE_ADMIN_ACTION_UNSUPPORTED', 'The administrative action is not supported.', false, { action: action });
  return action;
}
function referenceAdminDate_(value, field) {
  var normalized = referenceAdminText_(value, field, false, 10);
  if (normalized && (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || isNaN(new Date(normalized + 'T00:00:00Z').getTime()))) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR', field + ' must be an ISO date.', false, { field: field });
  return normalized;
}
function referenceAdminAliases_(value) {
  var entries = Array.isArray(value) ? value : String(value || '').split(/[|,]/), seen = {}, result = [];
  entries.forEach(function(entry) { var normalized = referenceAdminText_(entry, 'aliases', false, 120); var key = normalized.toLowerCase(); if (normalized && !seen[key] && result.length < 20) { seen[key] = true; result.push(normalized); } });
  return result;
}
function referenceAdminPatch_(domain, raw) {
  raw = raw || {}; if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR', 'A controlled change is required.', false, { field: 'patch' });
  var definition = HAU_REFERENCE_ADMIN_DOMAINS_[domain], result = {}, unknown = Object.keys(raw).filter(function(field) { return definition.fields.indexOf(field) < 0; });
  if (unknown.length) throw appError_('REFERENCE_ADMIN_FIELD_NOT_EDITABLE', 'One or more fields are not editable in this domain.', false, { fields: unknown });
  definition.fields.forEach(function(field) {
    if (!Object.prototype.hasOwnProperty.call(raw, field)) return;
    if (field === 'aliases') result[field] = referenceAdminAliases_(raw[field]);
    else if (field === 'committeeIds') { var ids = Array.isArray(raw[field]) ? raw[field] : []; result[field] = ids.map(function(id) { return referenceAdminText_(id, field, false, 80); }).filter(Boolean).slice(0, 3); }
    else if (field === 'active' || field === 'emergencyRevocation' || field === 'returnRequired') result[field] = raw[field] === true;
    else if (field === 'leadTimeBusinessDays') { var days = Number(raw[field]); if (!isFinite(days) || Math.floor(days) !== days || days < 1 || days > 90) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR', 'leadTimeBusinessDays must be an integer from 1 to 90.', false, { field: field }); result[field] = days; }
    else if (field === 'effectiveFrom' || field === 'effectiveTo') result[field] = referenceAdminDate_(raw[field], field);
    else result[field] = referenceAdminText_(raw[field], field, false, ['instructions','notes','description','reason'].indexOf(field) >= 0 ? 500 : 160);
  });
  if (result.effectiveFrom && result.effectiveTo && result.effectiveFrom > result.effectiveTo) throw appError_('REFERENCE_ADMIN_EFFECTIVE_RANGE_INVALID', 'effectiveTo cannot precede effectiveFrom.', false);
  if(domain==='PERMISSIONS'){
    if(result.roleId&&['REQUESTER','DOL_STAFF','COMMITTEE_HEAD','DIRECTOR','ADMINISTRATOR','READ_ONLY_AUDITOR'].indexOf(String(result.roleId).toUpperCase())<0)throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','roleId is not approved.',false,{field:'roleId'});
    if(result.committeeIds&&result.committeeIds.some(function(id){return['COM_FOOD','COM_INVENTORY_PANTRY','COM_MATERIALS'].indexOf(id)<0;}))throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','committeeIds contain an unapproved committee.',false,{field:'committeeIds'});
    if(!result.reason)throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','Permission changes require a reason.',false,{field:'reason'});
    if(result.emergencyRevocation&&result.active!==false)throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','Emergency access action is revocation-only.',false,{field:'emergencyRevocation'});
    if(result.emergencyRevocation&&(result.roleId||(result.committeeIds||[]).length))throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','Emergency revocation cannot carry role or committee grants.',false,{field:'emergencyRevocation'});
  }
  if(domain==='ROUTING'&&result.ownerCommitteeId&&['COM_FOOD','COM_INVENTORY_PANTRY','COM_MATERIALS'].indexOf(result.ownerCommitteeId)<0)throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','Routing must target an existing approved committee.',false,{field:'ownerCommitteeId'});
  return result;
}
function referenceAdminGenericRows_() { return readObjects_(HAU_SHEETS.REFERENCE_ADMIN_RECORDS); }
function referenceAdminProjection_(domain) {
  if (domain === 'VENUES' || domain === 'EQUIPMENT') return readObjects_(HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES).filter(function(row) { return String(row.Reference_Type).toUpperCase() === (domain === 'VENUES' ? 'VENUE' : 'EQUIPMENT'); }).map(function(row) { return { id:String(row.Reference_ID),domain:domain,revision:Number(row.Revision||1),status:String(row.Status||'ACTIVE').toUpperCase(),payload:{displayName:row.Display_Name||'',aliases:compositeParse_(row.Aliases_JSON,[]),category:row.Category_ID||'',location:row.Location_Label||'',unit:row.Unit||'',requestability:row.Requestability||'',contactRole:row.Contact_Role||'',routeId:row.Route_ID||'',returnRequired:String(row.Return_Required).toUpperCase()==='TRUE',effectiveFrom:row.Effective_From||'',effectiveTo:row.Effective_To||'',notes:row.Notes||''},effectiveFrom:row.Effective_From||'',effectiveTo:row.Effective_To||'',updatedAt:row.Updated_At||'',_row:row._row}; });
  if (domain === 'ROUTING') return readObjects_(HAU_SHEETS.VENUE_EQUIPMENT_ROUTES).map(function(row) { return { id:String(row.Route_ID),domain:domain,revision:Number(row.Revision||1),status:String(row.Status||'ACTIVE').toUpperCase(),payload:{matchKind:row.Match_Kind||'',referenceId:row.Reference_ID||'',referenceType:row.Reference_Type||'',category:row.Category_ID||'',ownerCommitteeId:row.Owner_Committee_ID||'',ownerUserId:row.Owner_User_ID||'',responsibleOfficeId:row.Responsible_Office_ID||'',approvingAuthorityId:row.Approving_Authority_ID||'',leadTimeBusinessDays:Number(row.Lead_Time_Business_Days||0),instructions:row.Instructions||'',effectiveFrom:row.Effective_From||'',effectiveTo:row.Effective_To||'',notes:row.Notes||''},effectiveFrom:row.Effective_From||'',effectiveTo:row.Effective_To||'',updatedAt:row.Updated_At||'',_row:row._row}; });
  if (domain === 'PEOPLE_MEMBERSHIPS' || domain === 'PERMISSIONS') return readObjects_(HAU_SHEETS.USERS).map(function(row) { return { id:String(row.User_ID),domain:domain,revision:Number(row.Admin_Revision||1),status:String(row.Active).toUpperCase()==='FALSE'?'ARCHIVED':'ACTIVE',payload:domain==='PERMISSIONS'?{roleId:row.Role_ID||row.Role||'',committeeIds:compositeParse_(row.Committee_IDs_JSON,[]),active:String(row.Active).toUpperCase()!=='FALSE'}:{displayName:row.Display_Name||'',rosterManaged:String(row.Roster_Managed).toUpperCase()==='TRUE'},updatedAt:row.Updated_At||'',_row:row._row}; });
  if (domain === 'SYNC_HEALTH') return readObjects_(HAU_SHEETS.ACCESS_SYNC_RUNS).slice(-20).map(function(row) { return { id:String(row.Sync_Run_ID),domain:domain,revision:1,status:String(row.Validation_Status||'UNKNOWN').toUpperCase(),payload:{activationStatus:row.Activation_Status||'',validationStatus:row.Validation_Status||'',completedAt:row.Completed_At||'',freshnessExpiresAt:row.Freshness_Expires_At||'',conflictCount:Number(row.Conflict_Count||0),revocationCount:Number(row.Revocation_Count||0)},updatedAt:row.Completed_At||''}; });
  return referenceAdminGenericRows_().filter(function(row) { return String(row.Domain).toUpperCase() === domain; }).map(function(row) { return { id:String(row.Stable_ID),domain:domain,revision:Number(row.Revision||1),status:String(row.Status||'ACTIVE').toUpperCase(),payload:compositeParse_(row.Payload_JSON,{}),effectiveFrom:row.Effective_From||'',effectiveTo:row.Effective_To||'',updatedAt:row.Updated_At||'',_row:row._row}; });
}
function referenceAdminCurrent_(domain, id) {
  var rows = referenceAdminProjection_(domain).filter(function(row) { return row.id === String(id) && row.status !== 'SUPERSEDED'; }).sort(function(a,b){ return b.revision-a.revision; });
  if(rows.length>1)throw appError_('REFERENCE_ADMIN_RECONCILIATION_REQUIRED','Multiple current revisions require reconciliation before further changes.',true,{domain:domain,targetId:String(id),revisions:rows.map(function(row){return row.revision;})});
  return rows[0] || null;
}
function referenceAdminDependencies_(domain, id) {
  var dependencies = [];
  if (domain === 'ROUTING') readObjects_(HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES).forEach(function(row) { if (String(row.Route_ID) === String(id) && String(row.Status).toUpperCase() === 'ACTIVE') dependencies.push(String(row.Reference_ID)); });
  if (domain === 'VENUES' || domain === 'EQUIPMENT') readObjects_(HAU_SHEETS.COMPOSITE_REQUESTS).forEach(function(row) { if (String(row.Component_Payload_JSON||'').indexOf('"referenceId":"'+String(id)+'"') >= 0 && ['COMPLETED','CANCELLED','REJECTED'].indexOf(String(row.Lifecycle_Status).toUpperCase()) < 0) dependencies.push(String(row.Component_ID||row.Request_ID)); });
  return dependencies.slice(0,20);
}
function referenceAdminPreview_(command, actor) {
  var domain=referenceAdminDomain_(command.domain), action=referenceAdminAction_(command.action), definition=HAU_REFERENCE_ADMIN_DOMAINS_[domain];
  if (definition.readOnly) throw appError_('REFERENCE_ADMIN_DOMAIN_READ_ONLY','This administrative domain is read-only.',false);
  if (definition.rosterOwned) throw appError_('REFERENCE_ADMIN_ROSTER_OWNED','Roster-owned identity and membership fields must be changed in the authoritative roster.',false);
  var id=referenceAdminText_(command.targetId,'targetId',true,100), current=referenceAdminCurrent_(domain,id), currentSafe=current?referenceAdminSafe_(current):null;
  if (action==='ADD' && current) throw appError_('REFERENCE_ADMIN_ALREADY_EXISTS','The reference already exists.',false);
  if (action!=='ADD' && !current) throw appError_('REFERENCE_ADMIN_NOT_FOUND','The reference was not found.',false);
  if (current && Number(command.expectedRevision)!==current.revision) throw appError_('REFERENCE_ADMIN_REVISION_CONFLICT','The record changed. Refresh and compare before retrying.',true,{expectedRevision:Number(command.expectedRevision),currentRevision:current.revision,current:currentSafe});
  var dependencies=action==='ARCHIVE'?referenceAdminDependencies_(domain,id):[]; if(dependencies.length) throw appError_('REFERENCE_ADMIN_DEPENDENCY_CONFLICT','This record cannot be archived while active dependencies exist.',false,{dependencies:dependencies});
  var patch=action==='ARCHIVE'||action==='RESTORE'?{}:referenceAdminPatch_(domain,command.patch), after={id:id,domain:domain,revision:(current?current.revision:0)+1,status:action==='ARCHIVE'?'ARCHIVED':'ACTIVE',payload:Object.assign({},current&&current.payload||{},patch),effectiveFrom:patch.effectiveFrom||current&&current.effectiveFrom||'',effectiveTo:patch.effectiveTo||current&&current.effectiveTo||''};
  if(action==='ADD'&&!referenceAdminText_(after.payload.displayName||after.payload.roleId||after.payload.instructions,'displayName',false,500)) throw appError_('REFERENCE_ADMIN_VALIDATION_ERROR','A display name, role, or route instruction is required.',false);
  var actorId=String(actor.User_ID||''), escalation=domain==='PERMISSIONS'&&(patch.active===true||!!patch.roleId||(patch.committeeIds||[]).length>0); if(escalation&&actorId===id) throw appError_('REFERENCE_ADMIN_SELF_ESCALATION_DENIED','Administrators cannot grant or expand their own access.',false);
  var crossOffice=domain==='ROUTING'&&!!(patch.responsibleOfficeId||patch.approvingAuthorityId||patch.ownerCommitteeId), requiresReview=!!definition.review&&(domain!=='PERMISSIONS'||patch.emergencyRevocation!==true);
  return {contractVersion:1,domain:domain,action:action,targetId:id,expectedRevision:current?current.revision:0,before:currentSafe,after:after,changedFields:Object.keys(patch),requiresReview:requiresReview||crossOffice,risk:escalation?'PERMISSION_ESCALATION':crossOffice?'CROSS_OFFICE_ROUTING':action==='ARCHIVE'?'DEPENDENCY_SENSITIVE':'STANDARD',destructive:false,permanentDelete:false};
}
function referenceAdminSafe_(record) { return {id:record.id,domain:record.domain,revision:record.revision,status:record.status,payload:record.payload,effectiveFrom:record.effectiveFrom||'',effectiveTo:record.effectiveTo||'',updatedAt:record.updatedAt||''}; }
function getReferenceAdminWorkspace_(command) {
  var actor=referenceAdminActor_(false),domain=referenceAdminDomain_(command.domain||'VENUES'),query=referenceAdminText_(command.query,'query',false,120).toLowerCase(),status=String(command.status||'ALL').toUpperCase(),limit=Math.min(Math.max(Number(command.limit)||50,1),100);
  var currentById={}; referenceAdminProjection_(domain).filter(function(row){return row.status!=='SUPERSEDED';}).forEach(function(row){if(currentById[row.id])throw appError_('REFERENCE_ADMIN_RECONCILIATION_REQUIRED','Multiple current revisions require reconciliation before administration can continue.',true,{domain:domain,targetId:row.id});currentById[row.id]=row;});
  var items=Object.keys(currentById).map(function(id){return currentById[id];}).filter(function(row){return(status==='ALL'||row.status===status)&&(!query||JSON.stringify([row.id,row.payload.displayName,row.payload.aliases]).toLowerCase().indexOf(query)>=0);}).sort(function(a,b){return String(a.id).localeCompare(String(b.id));}).slice(0,limit).map(referenceAdminSafe_);
  var pending=readObjects_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES).filter(function(row){return ['PENDING_REVIEW','APPLYING'].indexOf(String(row.Review_Status).toUpperCase())>=0&&(domain===String(row.Domain).toUpperCase());}).slice(0,50).map(function(row){return{changeId:row.Change_ID,domain:row.Domain,action:row.Action,targetId:row.Target_ID,expectedRevision:Number(row.Expected_Revision),risk:row.Risk,requestedAt:row.Requested_At,requestedBy:row.Requested_By,reviewStatus:row.Review_Status,changedFields:compositeParse_(row.Changed_Fields_JSON,[]),before:compositeParse_(row.Before_JSON,null),after:compositeParse_(row.After_JSON,{})};});
  return {contract:'reference-administration',contractVersion:1,domain:domain,writesEnabled:resolveReferenceAdminWritesEnabled_(),items:items,pendingChanges:pending,fieldOwnership:{peopleMemberships:'AUTHORITATIVE_ROSTER_READ_ONLY',permissions:'REVIEW_GATED',routing:'REVIEW_GATED'},actor:{id:actor.User_ID||'',role:canonicalRoleId_(actor.Role_ID||actor.Role||'')}};
}
function previewReferenceAdminChange_(command) { return referenceAdminPreview_(command,referenceAdminActor_(false)); }
function referenceAdminSupersedeExpected_(preview,now) {
  if(preview.domain==='PERMISSIONS'||preview.domain==='PEOPLE_MEMBERSHIPS'||preview.domain==='SYNC_HEALTH')return;
  var expected=referenceAdminProjection_(preview.domain).filter(function(row){return row.id===preview.targetId&&Number(row.revision)===Number(preview.expectedRevision);})[0];
  if(!expected||!expected._row)return;
  var sheet=preview.domain==='VENUES'||preview.domain==='EQUIPMENT'?HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES:preview.domain==='ROUTING'?HAU_SHEETS.VENUE_EQUIPMENT_ROUTES:HAU_SHEETS.REFERENCE_ADMIN_RECORDS;
  updateObject_(sheet,expected._row,{Status:'SUPERSEDED',Updated_At:now});
}
function referenceAdminAppendVersion_(preview,actor,changeId) {
  var after=preview.after,now=nowIso_(),payload=after.payload,appended;
  if(preview.domain==='PERMISSIONS') { var user=readObjects_(HAU_SHEETS.USERS).filter(function(row){return String(row.User_ID)===after.id;})[0]; if(!user||!user._row) throw appError_('REFERENCE_ADMIN_NOT_FOUND','The permission subject was not found.',false); updateObject_(HAU_SHEETS.USERS,user._row,{Role_ID:payload.roleId||user.Role_ID||user.Role,Committee_IDs_JSON:JSON.stringify(payload.committeeIds||compositeParse_(user.Committee_IDs_JSON,[])),Active:payload.active!==false,Admin_Revision:after.revision,Updated_At:now}); return after; }
  if(preview.domain==='VENUES'||preview.domain==='EQUIPMENT') appended=appendObject_(HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES,{Reference_ID:after.id,Reference_Type:preview.domain==='VENUES'?'VENUE':'EQUIPMENT',Category_ID:payload.category||'',Display_Name:payload.displayName||'',Aliases_JSON:JSON.stringify(payload.aliases||[]),Location_Label:payload.location||'',Unit:payload.unit||'',Requestability:payload.requestability||'NOT_REQUESTABLE',Contact_Role:payload.contactRole||'',Route_ID:payload.routeId||'',Return_Required:payload.returnRequired===true,Effective_From:after.effectiveFrom,Effective_To:after.effectiveTo,Revision:after.revision,Source_Revision:changeId,Status:after.status,Created_At:now,Updated_At:now,Archived_At:after.status==='ARCHIVED'?now:'',Notes:payload.notes||''});
  else if(preview.domain==='ROUTING') appended=appendObject_(HAU_SHEETS.VENUE_EQUIPMENT_ROUTES,{Route_ID:after.id,Match_Kind:payload.matchKind||'',Reference_ID:payload.referenceId||'',Reference_Type:payload.referenceType||'',Category_ID:payload.category||'',Owner_Committee_ID:payload.ownerCommitteeId||'',Owner_User_ID:payload.ownerUserId||'',Responsible_Office_ID:payload.responsibleOfficeId||'',Approving_Authority_ID:payload.approvingAuthorityId||'',Lead_Time_Business_Days:payload.leadTimeBusinessDays||'',Instructions:payload.instructions||'',Effective_From:after.effectiveFrom,Effective_To:after.effectiveTo,Revision:after.revision,Status:after.status,Created_At:now,Updated_At:now,Archived_At:after.status==='ARCHIVED'?now:'',Notes:payload.notes||''});
  else appended=appendObject_(HAU_SHEETS.REFERENCE_ADMIN_RECORDS,{Record_ID:allocateId_('RAR'),Domain:after.domain,Stable_ID:after.id,Revision:after.revision,Status:after.status,Payload_JSON:JSON.stringify(payload),Effective_From:after.effectiveFrom,Effective_To:after.effectiveTo,Created_At:now,Updated_At:now,Created_By:actor.User_ID||'',Source_Change_ID:changeId,Archived_At:after.status==='ARCHIVED'?now:''});
  referenceAdminSupersedeExpected_(preview,now);
  return appended;
}
function referenceAdminStoredPreview_(row) { return {contractVersion:1,domain:String(row.Domain),action:String(row.Action),targetId:String(row.Target_ID),expectedRevision:Number(row.Expected_Revision),before:compositeParse_(row.Before_JSON,null),after:compositeParse_(row.After_JSON,{}),changedFields:compositeParse_(row.Changed_Fields_JSON,[]),requiresReview:String(row.Risk)==='PERMISSION_ESCALATION'||String(row.Risk)==='CROSS_OFFICE_ROUTING',risk:String(row.Risk),destructive:false,permanentDelete:false}; }
function referenceAdminExistingKey_(key) {
  var row=readObjects_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES).filter(function(entry){return String(entry.Idempotency_Key)===String(key);})[0];
  if(!row)return null;
  var status=String(row.Review_Status).toUpperCase();
  if(status==='APPLYING')throw appError_('REFERENCE_ADMIN_RECONCILIATION_REQUIRED','This change reached the apply boundary and requires reconciliation before retry.',true,{changeId:row.Change_ID});
  return {changeId:row.Change_ID,reviewStatus:status,applied:status==='APPLIED'||status==='APPROVED_APPLIED',preview:referenceAdminStoredPreview_(row),idempotentReplay:true};
}
function referenceAdminApply_(preview,actor,correlationId,changeId) { var applied=referenceAdminAppendVersion_(preview,actor,changeId); history_('REFERENCE_ADMIN_CHANGE',preview.targetId,preview.before&&preview.before.status||'',preview.after.status,actor,'Reference administration '+preview.action,{idempotencyKey:changeId,metadata:{domain:preview.domain,revision:preview.after.revision,changeId:changeId}}); audit_('REFERENCE_ADMIN_'+preview.action,'REFERENCE_ADMIN',preview.targetId,actor,correlationId,{before:preview.before,after:preview.after,notes:'Change '+changeId}); return applied; }
function submitReferenceAdminChange_(command,correlationId) { return withScriptLock_(function(){ var actor=referenceAdminActor_(false),key=requireIdempotency_(command),replay=idempotencyReplay_(key); if(replay)return Object.assign({idempotentReplay:true},replay);var existing=referenceAdminExistingKey_(key);if(existing)return existing; if(!resolveReferenceAdminWritesEnabled_())throw appError_('REFERENCE_ADMIN_WRITES_DISABLED','Reference administration is read-only until the controlled write flag is enabled.',false); var preview=referenceAdminPreview_(command,actor),changeId=allocateId_('RAC'),now=nowIso_(),initialStatus=preview.requiresReview?'PENDING_REVIEW':'APPLYING'; appendObject_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES,{Change_ID:changeId,Domain:preview.domain,Action:preview.action,Target_ID:preview.targetId,Expected_Revision:preview.expectedRevision,Before_JSON:safeJson_(preview.before),After_JSON:safeJson_(preview.after),Changed_Fields_JSON:JSON.stringify(preview.changedFields),Risk:preview.risk,Review_Status:initialStatus,Requested_By:actor.User_ID||'',Requested_At:now,Reviewed_By:'',Reviewed_At:'',Idempotency_Key:key,Correlation_ID:correlationId,Notes:referenceAdminText_(command.reason||'','reason',false,500)}); var status=initialStatus;if(!preview.requiresReview){referenceAdminApply_(preview,actor,correlationId,changeId);var stored=readObjects_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES).filter(function(entry){return String(entry.Change_ID)===changeId;})[0];if(!stored||!stored._row)throw appError_('REFERENCE_ADMIN_RECONCILIATION_REQUIRED','The applied change record could not be finalized.',true,{changeId:changeId});updateObject_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES,stored._row,{Review_Status:'APPLIED',Reviewed_By:actor.User_ID||'',Reviewed_At:nowIso_()});status='APPLIED';}else audit_('REFERENCE_ADMIN_REVIEW_REQUESTED','REFERENCE_ADMIN_CHANGE',changeId,actor,correlationId,{after:{domain:preview.domain,targetId:preview.targetId,risk:preview.risk}}); return recordIdempotency_(key,{changeId:changeId,reviewStatus:status,applied:!preview.requiresReview,preview:preview},actor,correlationId); }); }
function reviewReferenceAdminChange_(command,correlationId) { return withScriptLock_(function(){ var reviewer=referenceAdminActor_(true),key=requireIdempotency_(command),replay=idempotencyReplay_(key); if(replay)return Object.assign({idempotentReplay:true},replay); if(!resolveReferenceAdminWritesEnabled_())throw appError_('REFERENCE_ADMIN_WRITES_DISABLED','Reference administration is read-only until the controlled write flag is enabled.',false); var row=readObjects_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES).filter(function(entry){return String(entry.Change_ID)===String(command.changeId);})[0]; if(!row||!row._row)throw appError_('REFERENCE_ADMIN_CHANGE_NOT_FOUND','The requested administrative change was not found.',false); if(String(row.Review_Status).toUpperCase()==='APPLYING')throw appError_('REFERENCE_ADMIN_RECONCILIATION_REQUIRED','This reviewed change reached the apply boundary and requires reconciliation before retry.',true,{changeId:row.Change_ID}); if(String(row.Review_Status).toUpperCase()!=='PENDING_REVIEW')throw appError_('REFERENCE_ADMIN_CHANGE_ALREADY_REVIEWED','The administrative change is no longer pending.',false); if(String(row.Requested_By)===String(reviewer.User_ID))throw appError_('REFERENCE_ADMIN_SEPARATION_OF_DUTIES','The requester cannot approve the same change.',false); var decision=referenceAdminText_(command.decision,'decision',true,20).toUpperCase(),reviewReason=referenceAdminText_(command.reason,'reason',true,500); if(['APPROVE','REJECT'].indexOf(decision)<0)throw appError_('REFERENCE_ADMIN_REVIEW_DECISION_INVALID','Review decision must be APPROVE or REJECT.',false); var preview=referenceAdminStoredPreview_(row); referenceAdminPatch_(preview.domain,preview.action==='ARCHIVE'||preview.action==='RESTORE'?{}:preview.after.payload||{});if(decision==='APPROVE'&&preview.domain==='PERMISSIONS'&&preview.risk==='PERMISSION_ESCALATION'&&String(reviewer.User_ID)===preview.targetId)throw appError_('REFERENCE_ADMIN_SELF_ESCALATION_DENIED','Reviewers cannot approve a permission grant targeting themselves.',false);var current=referenceAdminCurrent_(preview.domain,preview.targetId),currentRevision=current?current.revision:0; if(decision==='APPROVE'&&currentRevision!==preview.expectedRevision)throw appError_('REFERENCE_ADMIN_REVISION_CONFLICT','The target changed while review was pending.',true,{expectedRevision:preview.expectedRevision,currentRevision:currentRevision,current:current?referenceAdminSafe_(current):null}); var now=nowIso_(),status=decision==='APPROVE'?'APPROVED_APPLIED':'REJECTED'; if(decision==='APPROVE'){updateObject_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES,row._row,{Review_Status:'APPLYING',Reviewed_By:reviewer.User_ID||'',Reviewed_At:now,Notes:reviewReason});referenceAdminApply_(preview,reviewer,correlationId,row.Change_ID);} updateObject_(HAU_SHEETS.REFERENCE_ADMIN_CHANGES,row._row,{Review_Status:status,Reviewed_By:reviewer.User_ID||'',Reviewed_At:now,Notes:reviewReason}); audit_('REFERENCE_ADMIN_REVIEW_'+decision,'REFERENCE_ADMIN_CHANGE',row.Change_ID,reviewer,correlationId,{before:{reviewStatus:'PENDING_REVIEW'},after:{reviewStatus:status}}); return recordIdempotency_(key,{changeId:row.Change_ID,reviewStatus:status,applied:decision==='APPROVE'},reviewer,correlationId); }); }
