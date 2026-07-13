var HAU_ADMIN_ROLES_ = Object.freeze(['REQUESTER','DOL_STAFF','COMMITTEE_HEAD','DOL_DIRECTOR','ADMIN','READ_ONLY_AUDITOR']);
var HAU_CONTENT_TYPES_ = Object.freeze(['ROADMAP','CHANGELOG','ANNOUNCEMENT','GUIDE','PAGE','JSON']);
var HAU_BRANDING_MIME_TYPES_ = Object.freeze(['image/jpeg','image/png','image/webp']);

function adminRows_(sheetName) { try{return sheetName?readObjects_(sheetName):[];}catch(ignored){return[];} }
function adminBoolean_(value,defaultValue){if(value===''||value==null)return Boolean(defaultValue);if(value===true||String(value).toUpperCase()==='TRUE'||String(value)==='1')return true;if(value===false||String(value).toUpperCase()==='FALSE'||String(value)==='0')return false;throw appError_('VALIDATION_ERROR','Boolean value is invalid.',false);}
function adminEmail_(value){var email=normalizeEmail_(requireText_(value,'email'));if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw appError_('VALIDATION_ERROR','A valid email address is required.',false,{field:'email'});return email;}
function adminText_(value,field,max){var text=requireText_(value,field);if(text.length>(max||500))throw appError_('VALIDATION_ERROR',field+' is too long.',false,{field:field,maxLength:max||500});return text;}
function adminHttpsUrl_(value,field){var url=String(value||'').trim();if(!url)return'';if(!/^https:\/\//i.test(url))throw appError_('VALIDATION_ERROR',field+' must use HTTPS.',false,{field:field});return url.slice(0,2000);}
function rolePermissions_(role){return ROLE_PERMISSIONS_[role]||[];}
function userAccessDto_(row){return{id:row.User_ID,email:row.Email,displayName:row.Display_Name,role:row.Role,committee:row.Committee||'',active:String(row.Active).toUpperCase()!=='FALSE',permissions:{review:canPermission_(row,'Can_Review'),release:canPermission_(row,'Can_Release'),receive:canPermission_(row,'Can_Receive'),admin:canPermission_(row,'Can_Admin'),manageCatalog:canPermission_(row,'Can_Manage_Catalog')},createdAt:row.Created_At||'',updatedAt:row.Updated_At||''};}
function permissionInput_(command,name){var aliases={Can_Review:{short:'review',browser:'canReview'},Can_Release:{short:'release',browser:'canRelease'},Can_Receive:{short:'receive',browser:'canReceive'},Can_Admin:{short:'admin',browser:'canAdmin'},Can_Manage_Catalog:{short:'manageCatalog',browser:'canManageCatalog'}},alias=aliases[name],nested=command.permissions&&typeof command.permissions==='object'?command.permissions:{};if(Object.prototype.hasOwnProperty.call(command,name))return{present:true,value:command[name]};if(alias&&Object.prototype.hasOwnProperty.call(command,alias.short))return{present:true,value:command[alias.short]};if(alias&&Object.prototype.hasOwnProperty.call(command,alias.browser))return{present:true,value:command[alias.browser]};if(alias&&Object.prototype.hasOwnProperty.call(nested,alias.short))return{present:true,value:nested[alias.short]};if(alias&&Object.prototype.hasOwnProperty.call(nested,alias.browser))return{present:true,value:nested[alias.browser]};return{present:false,value:false};}
function permissionValue_(command,name,role){var input=permissionInput_(command,name);if(input.present)return adminBoolean_(input.value,false);return rolePermissions_(role).indexOf(name)>=0;}
function activeAdminCount_(excludingId){return adminRows_(HAU_SHEETS.USERS).filter(function(row){return String(row.User_ID)!==String(excludingId||'')&&String(row.Active).toUpperCase()!=='FALSE'&&canPermission_(row,'Can_Admin');}).length;}

function createUserAccess_(command,correlationId,user,key){var email=adminEmail_(command.email),existing=adminRows_(HAU_SHEETS.USERS).find(function(row){return normalizeEmail_(row.Email)===email;});if(existing)throw appError_('USER_EMAIL_EXISTS','An access row already exists for this email.',false);var role=String(command.role||'REQUESTER').toUpperCase();if(HAU_ADMIN_ROLES_.indexOf(role)<0)throw appError_('VALIDATION_ERROR','Choose a supported role.',false,{field:'role'});var now=nowIso_(),row={User_ID:allocateId_('USR',{year:false}),Email:email,Display_Name:adminText_(command.displayName||email,'displayName',120),Role:role,Committee:String(command.committee||'').trim().slice(0,120),Active:adminBoolean_(command.active,true),Can_Review:permissionValue_(command,'Can_Review',role),Can_Release:permissionValue_(command,'Can_Release',role),Can_Receive:permissionValue_(command,'Can_Receive',role),Can_Admin:permissionValue_(command,'Can_Admin',role),Created_At:now,Updated_At:now,Last_Login_At:'',Notes:String(command.notes||'').slice(0,500),Can_Manage_Catalog:permissionValue_(command,'Can_Manage_Catalog',role)};appendObject_(HAU_SHEETS.USERS,row);history_('USER_ACCESS',row.User_ID,'',row.Active?'ACTIVE':'INACTIVE',user,command.reason||'Access row created',{idempotencyKey:key});audit_('CREATE_USER_ACCESS','USER_ACCESS',row.User_ID,user,correlationId,{after:userAccessDto_(row),notes:command.reason||''});return row;}

function updateUserAccess_(command,correlationId,user,key){var row=findOne_(HAU_SHEETS.USERS,'User_ID',requireText_(command.userId,'userId'));if(!row)throw appError_('USER_NOT_FOUND','The access row was not found.',false);var role=String(command.role||row.Role).toUpperCase();if(HAU_ADMIN_ROLES_.indexOf(role)<0)throw appError_('VALIDATION_ERROR','Choose a supported role.',false,{field:'role'});var email=command.email?adminEmail_(command.email):row.Email;if(adminRows_(HAU_SHEETS.USERS).some(function(candidate){return String(candidate.User_ID)!==String(row.User_ID)&&normalizeEmail_(candidate.Email)===email;}))throw appError_('USER_EMAIL_EXISTS','An access row already exists for this email.',false);var active=Object.prototype.hasOwnProperty.call(command,'active')?adminBoolean_(command.active,true):String(row.Active).toUpperCase()!=='FALSE',review=permissionInput_(command,'Can_Review'),release=permissionInput_(command,'Can_Release'),receive=permissionInput_(command,'Can_Receive'),admin=permissionInput_(command,'Can_Admin'),catalog=permissionInput_(command,'Can_Manage_Catalog');var patch={Email:email,Display_Name:command.displayName?adminText_(command.displayName,'displayName',120):row.Display_Name,Role:role,Committee:Object.prototype.hasOwnProperty.call(command,'committee')?String(command.committee||'').trim().slice(0,120):row.Committee,Active:active,Can_Review:review.present?adminBoolean_(review.value,false):row.Can_Review,Can_Release:release.present?adminBoolean_(release.value,false):row.Can_Release,Can_Receive:receive.present?adminBoolean_(receive.value,false):row.Can_Receive,Can_Admin:admin.present?adminBoolean_(admin.value,false):row.Can_Admin,Can_Manage_Catalog:catalog.present?adminBoolean_(catalog.value,false):row.Can_Manage_Catalog,Updated_At:nowIso_(),Notes:Object.prototype.hasOwnProperty.call(command,'notes')?String(command.notes||'').slice(0,500):row.Notes};var after=Object.assign({},row,patch);if(canPermission_(row,'Can_Admin')&&(!active||!canPermission_(after,'Can_Admin'))&&activeAdminCount_(row.User_ID)<1)throw appError_('LAST_ADMIN_REQUIRED','At least one other active administrator must remain.',false);if(String(row.User_ID)===String(user.User_ID)&&!active)throw appError_('SELF_DEACTIVATION_BLOCKED','Administrators cannot deactivate their own active session.',false);updateObject_(HAU_SHEETS.USERS,row._row,patch);if(String(row.Active).toUpperCase()!==String(active).toUpperCase())history_('USER_ACCESS',row.User_ID,String(row.Active).toUpperCase()==='FALSE'?'INACTIVE':'ACTIVE',active?'ACTIVE':'INACTIVE',user,command.reason||'Access state changed',{idempotencyKey:key});audit_('UPDATE_USER_ACCESS','USER_ACCESS',row.User_ID,user,correlationId,{before:userAccessDto_(row),after:userAccessDto_(after),notes:command.reason||''});return after;}

function saveUserAccess_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Admin'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var row=command.userId?updateUserAccess_(command,correlationId,user,key):createUserAccess_(command,correlationId,user,key);return recordIdempotency_(key,{user:userAccessDto_(row),userId:row.User_ID,entityType:'USER_ACCESS',entityId:row.User_ID},user,correlationId);});}
function deactivateUserAccess_(command,correlationId){return saveUserAccess_(Object.assign({},command,{active:false}),correlationId);}

function eventDate_(value,field,required){if(!value&&!required)return'';var date=new Date(requireText_(value,field));if(isNaN(date.getTime()))throw appError_('VALIDATION_ERROR',field+' must be a valid date and time.',false,{field:field});return date.toISOString();}
function eventAdminDto_(row){return{id:row.Event_ID,seriesId:row.Event_Series_ID,seriesCode:row.Series_Code,seriesName:row.Event_Series_Name,name:row.Event_Name,startAt:row.Start_At,endAt:row.End_At,venue:row.Venue||'',ownerCommittee:row.Owner_Committee||'',department:row.Department||'',status:row.Status,active:String(row.Active).toUpperCase()!=='FALSE',createdAt:row.Created_At||'',updatedAt:row.Updated_At||''};}
function createEvent_(command,correlationId,user,key){var seriesId=String(command.eventSeriesId||'').trim(),seriesRow=seriesId?adminRows_(HAU_SHEETS.EVENTS).find(function(row){return String(row.Event_Series_ID)===seriesId;}):null;if(seriesId&&!seriesRow)throw appError_('EVENT_SERIES_NOT_FOUND','The selected event series was not found.',false);if(!seriesId)seriesId=allocateId_('SER');var start=eventDate_(command.startAt,'startAt',true),end=eventDate_(command.endAt,'endAt',true);if(new Date(end)<=new Date(start))throw appError_('VALIDATION_ERROR','endAt must be after startAt.',false,{field:'endAt'});var now=nowIso_(),row={Event_ID:allocateId_('EVT'),Event_Series_ID:seriesId,Series_Code:seriesRow?seriesRow.Series_Code:sanitizeSystemToken_(command.seriesCode||command.seriesName||command.eventName).slice(0,24),Event_Series_Name:seriesRow?seriesRow.Event_Series_Name:adminText_(command.seriesName||command.eventName,'seriesName',160),Event_Name:adminText_(command.eventName||command.name,'eventName',160),Start_At:start,End_At:end,Venue:String(command.venue||'').slice(0,200),Owner_Committee:String(command.ownerCommittee||'').slice(0,160),Department:String(command.department||'').slice(0,160),Status:'ACTIVE',Created_At:now,Updated_At:now,Created_By:user.User_ID,Archived_At:'',Notes:String(command.notes||'').slice(0,1000),External_Reference:String(command.externalReference||'').slice(0,200),Active:true};appendObject_(HAU_SHEETS.EVENTS,row);history_('EVENT',row.Event_ID,'','ACTIVE',user,command.reason||'Event created',{eventId:row.Event_ID,idempotencyKey:key});audit_('CREATE_EVENT','EVENT',row.Event_ID,user,correlationId,{after:eventAdminDto_(row),eventId:row.Event_ID,notes:command.reason||''});return row;}
function updateEvent_(command,correlationId,user,key){var row=findOne_(HAU_SHEETS.EVENTS,'Event_ID',requireText_(command.eventId,'eventId'));if(!row)throw appError_('EVENT_NOT_FOUND','The event was not found.',false);var patch={};if(command.eventName||command.name)patch.Event_Name=adminText_(command.eventName||command.name,'eventName',160);if(Object.prototype.hasOwnProperty.call(command,'seriesName'))patch.Event_Series_Name=adminText_(command.seriesName,'seriesName',160);if(Object.prototype.hasOwnProperty.call(command,'seriesCode'))patch.Series_Code=sanitizeSystemToken_(command.seriesCode).slice(0,24);if(Object.prototype.hasOwnProperty.call(command,'startAt'))patch.Start_At=eventDate_(command.startAt,'startAt',true);if(Object.prototype.hasOwnProperty.call(command,'endAt'))patch.End_At=eventDate_(command.endAt,'endAt',true);var start=patch.Start_At||row.Start_At,end=patch.End_At||row.End_At;if(start&&end&&new Date(end)<=new Date(start))throw appError_('VALIDATION_ERROR','endAt must be after startAt.',false,{field:'endAt'});['venue','ownerCommittee','department','notes','externalReference'].forEach(function(field){if(Object.prototype.hasOwnProperty.call(command,field)){var columns={venue:'Venue',ownerCommittee:'Owner_Committee',department:'Department',notes:'Notes',externalReference:'External_Reference'};patch[columns[field]]=String(command[field]||'').slice(0,field==='notes'?1000:200);}});if(command.action==='ARCHIVE'||String(command.status).toUpperCase()==='ARCHIVED'){patch.Status='ARCHIVED';patch.Active=false;patch.Archived_At=nowIso_();}else if(command.action==='RESTORE'){patch.Status='ACTIVE';patch.Active=true;patch.Archived_At='';}patch.Updated_At=nowIso_();var after=Object.assign({},row,patch);updateObject_(HAU_SHEETS.EVENTS,row._row,patch);if(patch.Status&&patch.Status!==row.Status)history_('EVENT',row.Event_ID,row.Status,patch.Status,user,command.reason||'Event status changed',{eventId:row.Event_ID,idempotencyKey:key});audit_('UPDATE_EVENT','EVENT',row.Event_ID,user,correlationId,{before:eventAdminDto_(row),after:eventAdminDto_(after),eventId:row.Event_ID,notes:command.reason||''});return after;}
function updateEventSeries_(command,correlationId,user,key){var seriesId=requireText_(command.eventSeriesId,'eventSeriesId'),rows=adminRows_(HAU_SHEETS.EVENTS).filter(function(row){return String(row.Event_Series_ID)===seriesId;});if(!rows.length)throw appError_('EVENT_SERIES_NOT_FOUND','The selected event series was not found.',false);var patch={};if(Object.prototype.hasOwnProperty.call(command,'seriesName'))patch.Event_Series_Name=adminText_(command.seriesName,'seriesName',160);if(Object.prototype.hasOwnProperty.call(command,'seriesCode'))patch.Series_Code=sanitizeSystemToken_(command.seriesCode).slice(0,24);['ownerCommittee','department'].forEach(function(field){if(Object.prototype.hasOwnProperty.call(command,field))patch[field==='ownerCommittee'?'Owner_Committee':'Department']=String(command[field]||'').slice(0,160);});var previousStatus=rows.every(function(row){return String(row.Status)==='ARCHIVED';})?'ARCHIVED':'ACTIVE';if(command.action==='ARCHIVE'||String(command.status).toUpperCase()==='ARCHIVED'){patch.Status='ARCHIVED';patch.Active=false;patch.Archived_At=nowIso_();}else if(command.action==='RESTORE'){patch.Status='ACTIVE';patch.Active=true;patch.Archived_At='';}patch.Updated_At=nowIso_();rows.forEach(function(row){updateObject_(HAU_SHEETS.EVENTS,row._row,patch);});var nextStatus=patch.Status||previousStatus;if(nextStatus!==previousStatus)history_('EVENT_SERIES',seriesId,previousStatus,nextStatus,user,command.reason||'Event series status changed',{idempotencyKey:key});var result={id:seriesId,code:patch.Series_Code||rows[0].Series_Code,name:patch.Event_Series_Name||rows[0].Event_Series_Name,status:nextStatus,eventCount:rows.length};audit_('UPDATE_EVENT_SERIES','EVENT_SERIES',seriesId,user,correlationId,{before:{id:seriesId,code:rows[0].Series_Code,name:rows[0].Event_Series_Name,status:previousStatus,eventCount:rows.length},after:result,notes:command.reason||''});return result;}
function saveEvent_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Admin'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var seriesScope=String(command.scope||command.entityType||'').toUpperCase()==='SERIES'||String(command.scope||command.entityType||'').toUpperCase()==='EVENT_SERIES';if(seriesScope){var series=updateEventSeries_(command,correlationId,user,key);return recordIdempotency_(key,{eventSeries:series,eventSeriesId:series.id,entityType:'EVENT_SERIES',entityId:series.id},user,correlationId);}var row=command.eventId?updateEvent_(command,correlationId,user,key):createEvent_(command,correlationId,user,key);return recordIdempotency_(key,{event:eventAdminDto_(row),eventId:row.Event_ID,entityType:'EVENT',entityId:row.Event_ID},user,correlationId);});}

function contentBodyJson_(value){var parsed=value;if(typeof value==='string'){try{parsed=JSON.parse(value);}catch(error){throw appError_('VALIDATION_ERROR','Content body must be valid JSON.',false,{field:'body'});}}if(parsed==null||typeof parsed!=='object')throw appError_('VALIDATION_ERROR','Content body must be a JSON object or array.',false,{field:'body'});var serialized=safeJson_(parsed);if(serialized.length>100000)throw appError_('VALIDATION_ERROR','Content body exceeds the 100 KB limit.',false,{field:'body'});if(/<script\b|javascript:/i.test(serialized))throw appError_('UNSAFE_CONTENT','Executable markup and javascript URLs are not allowed in structured content.',false);return serialized;}
function contentDto_(row){var body=null;try{body=JSON.parse(row.Body_JSON||'null');}catch(ignored){}return{revisionId:row.Content_Revision_ID,key:row.Content_Key,type:row.Content_Type,title:row.Title,body:body,status:row.Status,revision:Number(row.Revision_Number||0),notes:row.Notes||'',publishedAt:row.Published_At||'',createdAt:row.Created_At||'',updatedAt:row.Updated_At||''};}
function publishedContentDto_(row){var dto=contentDto_(row);return{key:dto.key,type:dto.type,title:dto.title,body:dto.body,status:'PUBLISHED',revision:dto.revision,publishedAt:dto.publishedAt,updatedAt:dto.updatedAt};}
function contentKey_(value){var key=adminText_(value,'contentKey',80).toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{1,79}$/.test(key))throw appError_('VALIDATION_ERROR','contentKey must be a stable uppercase token.',false,{field:'contentKey'});return key;}
function contentRowsForKey_(key,rows){return(rows||adminRows_(HAU_SHEETS.CONTENT)).filter(function(row){return String(row.Content_Key)===String(key);});}
function latestContentRevisionNumber_(key,rows){return contentRowsForKey_(key,rows).reduce(function(max,row){return Math.max(max,Number(row.Revision_Number||0));},0);}
function requireExpectedContentRevision_(command,key,rows){var actual=latestContentRevisionNumber_(key,rows);if(command.expectedRevision===''||command.expectedRevision==null)return actual;var expected=Number(command.expectedRevision);if(!isFinite(expected)||expected<0||Math.floor(expected)!==expected)throw appError_('VALIDATION_ERROR','expectedRevision must be a non-negative whole number.',false,{field:'expectedRevision'});if(expected!==actual)throw appError_('CONTENT_REVISION_CONFLICT','Content changed after this form was loaded. Refresh before saving, publishing, or reverting.',false,{expectedRevision:expected,actualRevision:actual,contentKey:key});return actual;}
function nextContentRevision_(key,rows){return latestContentRevisionNumber_(key,rows)+1;}
function saveContentRevision_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Admin'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var contentKey=contentKey_(command.contentKey||command.key),rows=adminRows_(HAU_SHEETS.CONTENT),latest=requireExpectedContentRevision_(command,contentKey,rows),type=String(command.contentType||command.type||'JSON').toUpperCase();if(HAU_CONTENT_TYPES_.indexOf(type)<0)throw appError_('VALIDATION_ERROR','Choose a supported content type.',false,{field:'contentType'});var latestRow=contentRowsForKey_(contentKey,rows).sort(function(a,b){return Number(b.Revision_Number||0)-Number(a.Revision_Number||0);})[0],now=nowIso_(),row={Content_Revision_ID:allocateId_('CNT'),Content_Key:contentKey,Content_Type:type,Title:adminText_(command.title,'title',180),Body_JSON:contentBodyJson_(command.bodyJson==null?command.body:command.bodyJson),Status:'DRAFT',Revision_Number:latest+1,Published_At:'',Published_By:'',Created_At:now,Created_By:user.User_ID,Updated_At:now,Updated_By:user.User_ID,Supersedes_Revision_ID:String(command.supersedesRevisionId||latestRow&&latestRow.Content_Revision_ID||''),Reverted_From_Revision_ID:'',Notes:String(command.notes||command.changeNote||'').slice(0,1000)};appendObject_(HAU_SHEETS.CONTENT,row);audit_('SAVE_CONTENT_DRAFT','CONTENT',row.Content_Revision_ID,user,correlationId,{after:{key:row.Content_Key,type:row.Content_Type,title:row.Title,revision:row.Revision_Number,status:row.Status},notes:row.Notes});return recordIdempotency_(key,{content:contentDto_(row),contentRevisionId:row.Content_Revision_ID,entityType:'CONTENT',entityId:row.Content_Revision_ID},user,correlationId);});}
function contentRevision_(command){var rows=adminRows_(HAU_SHEETS.CONTENT),id=String(command.contentRevisionId||command.revisionId||'');if(id)return rows.find(function(row){return String(row.Content_Revision_ID)===id;})||null;var raw=command.contentKey||command.key||'',key=raw?contentKey_(raw):'';return rows.filter(function(row){return String(row.Content_Key)===key&&String(row.Status)==='DRAFT';}).sort(function(a,b){return Number(b.Revision_Number||0)-Number(a.Revision_Number||0);})[0]||null;}
function publishContentRevision_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Admin'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var target=contentRevision_(command);if(!target)throw appError_('CONTENT_REVISION_NOT_FOUND','The content revision was not found.',false);var rows=adminRows_(HAU_SHEETS.CONTENT),contentKey=contentKey_(target.Content_Key),reason=String(command.reason||command.notes||command.changeNote||'Content published').slice(0,1000);requireExpectedContentRevision_(command,contentKey,rows);rows.filter(function(row){return String(row.Content_Key)===contentKey&&String(row.Status)==='PUBLISHED'&&String(row.Content_Revision_ID)!==String(target.Content_Revision_ID);}).forEach(function(row){updateObject_(HAU_SHEETS.CONTENT,row._row,{Status:'SUPERSEDED',Updated_At:nowIso_(),Updated_By:user.User_ID});});var patch={Status:'PUBLISHED',Published_At:nowIso_(),Published_By:user.User_ID,Updated_At:nowIso_(),Updated_By:user.User_ID};updateObject_(HAU_SHEETS.CONTENT,target._row,patch);var after=Object.assign({},target,patch);history_('CONTENT',target.Content_Revision_ID,target.Status,'PUBLISHED',user,reason,{idempotencyKey:key});audit_('PUBLISH_CONTENT','CONTENT',target.Content_Revision_ID,user,correlationId,{after:{key:contentKey,revision:target.Revision_Number,status:'PUBLISHED'},notes:reason});return recordIdempotency_(key,{content:contentDto_(after),contentRevisionId:target.Content_Revision_ID,entityType:'CONTENT',entityId:target.Content_Revision_ID},user,correlationId);});}
function revertContentRevision_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Admin'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var rows=adminRows_(HAU_SHEETS.CONTENT),contentKey=contentKey_(command.contentKey||command.key),current=contentRowsForKey_(contentKey,rows).filter(function(row){return String(row.Status)==='PUBLISHED';}).sort(function(a,b){return Number(b.Revision_Number||0)-Number(a.Revision_Number||0);})[0],targetId=String(command.targetRevisionId||command.contentRevisionId||command.revisionId||''),target=targetId?rows.find(function(row){return String(row.Content_Revision_ID)===targetId&&String(row.Content_Key)===contentKey;}):contentRowsForKey_(contentKey,rows).filter(function(row){return!current||String(row.Content_Revision_ID)!==String(current.Content_Revision_ID);}).sort(function(a,b){return Number(b.Revision_Number||0)-Number(a.Revision_Number||0);})[0];if(!target)throw appError_('CONTENT_REVISION_NOT_FOUND','No earlier content revision is available to revert.',false);if(current&&String(current.Content_Revision_ID)===String(target.Content_Revision_ID))throw appError_('CONTENT_REVERT_TARGET_CURRENT','Choose an earlier content revision to revert.',false);var latest=requireExpectedContentRevision_(command,contentKey,rows),reason=String(command.reason||command.notes||command.changeNote||'Published revision reverted').slice(0,1000);if(current)updateObject_(HAU_SHEETS.CONTENT,current._row,{Status:'SUPERSEDED',Updated_At:nowIso_(),Updated_By:user.User_ID});var now=nowIso_(),row={Content_Revision_ID:allocateId_('CNT'),Content_Key:target.Content_Key,Content_Type:target.Content_Type,Title:target.Title,Body_JSON:target.Body_JSON,Status:'PUBLISHED',Revision_Number:latest+1,Published_At:now,Published_By:user.User_ID,Created_At:now,Created_By:user.User_ID,Updated_At:now,Updated_By:user.User_ID,Supersedes_Revision_ID:current&&current.Content_Revision_ID||'',Reverted_From_Revision_ID:target.Content_Revision_ID,Notes:reason};appendObject_(HAU_SHEETS.CONTENT,row);history_('CONTENT',row.Content_Revision_ID,'','PUBLISHED',user,reason,{idempotencyKey:key,metadata:{revertedFrom:target.Content_Revision_ID}});audit_('REVERT_CONTENT','CONTENT',row.Content_Revision_ID,user,correlationId,{after:{key:row.Content_Key,revision:row.Revision_Number,revertedFrom:target.Content_Revision_ID},notes:reason});return recordIdempotency_(key,{content:contentDto_(row),contentRevisionId:row.Content_Revision_ID,entityType:'CONTENT',entityId:row.Content_Revision_ID},user,correlationId);});}
function previewContentRevision_(command){requirePermission_('Can_Admin');var row=contentRevision_(command);if(!row)throw appError_('CONTENT_REVISION_NOT_FOUND','The content revision was not found.',false);return{content:contentDto_(row)};}
function getPublishedContent_(){return{content:adminRows_(HAU_SHEETS.CONTENT).filter(function(row){return String(row.Status)==='PUBLISHED';}).map(publishedContentDto_)};}

function brandingVersionNumber_(assetKey) {
  return adminRows_(HAU_SHEETS.BRANDING).filter(function(row) { return String(row.Asset_Key) === assetKey; })
    .reduce(function(max, row) { return Math.max(max, Number(row.Version_Number || 0)); }, 0) + 1;
}

function brandingAdminDto_(row) {
  return {
    versionId: row.Branding_Version_ID, assetKey: row.Asset_Key, displayName: row.Display_Name,
    altText: row.Alt_Text, mimeType: row.Mime_Type, fileExtension: row.File_Extension,
    sizeBytes: Number(row.Size_Bytes || 0), width: Number(row.Width_Px || 0), height: Number(row.Height_Px || 0),
    status: row.Status, version: Number(row.Version_Number || 0),
    active: String(row.Active).toUpperCase() === 'TRUE' || row.Active === true,
    createdAt: row.Created_At || '', activatedAt: row.Activated_At || ''
  };
}

function brandingPublicDto_(row) {
  return {
    assetKey: row.Asset_Key, displayName: row.Display_Name, altText: row.Alt_Text,
    mimeType: row.Mime_Type, width: Number(row.Width_Px || 0), height: Number(row.Height_Px || 0),
    version: Number(row.Version_Number || 0), active: true, deliveryAvailable: false,
    useFallback: true, fallbackKey: 'BUILT_IN_WORDMARK'
  };
}

function requireBrandingMetadataOnly_(command) {
  if (command.base64 || command.bytes || command.fileData || command.dataUrl || command.data) {
    throw appError_('BRANDING_METADATA_ONLY', 'This branding operation is metadata only. Use the protected branding upload operation for file bytes.', false);
  }
}

function brandingAssetKey_(value) {
  var key = adminText_(value, 'assetKey', 80).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,79}$/.test(key)) throw appError_('VALIDATION_ERROR', 'assetKey must be a stable uppercase token.', false, { field: 'assetKey' });
  return key;
}

function brandingSafeText_(value, field, maximum) {
  var text = adminText_(value, field, maximum);
  if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw appError_('UNSAFE_BRANDING_METADATA', field + ' contains unsupported markup or control characters.', false, { field: field });
  return text;
}

function brandingMimeAndExtension_(mimeValue, extensionValue) {
  var mime = String(mimeValue || '').trim().toLowerCase();
  if (HAU_BRANDING_MIME_TYPES_.indexOf(mime) < 0) throw appError_('UNSUPPORTED_FILE_TYPE', 'Branding assets must be JPG, PNG, or WEBP.', false);
  var extension = String(extensionValue || '').trim().toLowerCase().replace(/^\./, '');
  if (extension === 'jpeg') extension = 'jpg';
  if (extension !== extensionForMime_(mime)) throw appError_('MIME_EXTENSION_MISMATCH', 'Branding file extension does not match MIME type.', false);
  return { mime: mime, extension: extension };
}

function brandingLatestVersion_(assetKey) {
  return adminRows_(HAU_SHEETS.BRANDING).filter(function(row) { return String(row.Asset_Key) === assetKey; })
    .sort(function(left, right) { return Number(right.Version_Number || 0) - Number(left.Version_Number || 0); })[0] || null;
}

function verifyBrandingFile_(file, folder, expected) {
  if (!fileHasOnlyParent_(file, folder)) throw appError_('BRANDING_PARENT_MISMATCH', 'Branding storage is outside the controlled Branding folder.', false);
  requireSafeDriveSharing_(folder, 'DRIVE_BRANDING_FOLDER_ID');
  requireSafeDriveSharing_(file, 'BRANDING_FILE');
  var size;
  try { size = Number(file.getSize()); }
  catch (error) { throw appError_('BRANDING_STORAGE_VERIFICATION_FAILED', 'Branding file size could not be verified.', false); }
  if (!isFinite(size) || size <= 0 || size > HAU_CONFIG.MAX_UPLOAD_BYTES) throw appError_('FILE_TOO_LARGE', 'Branding file size is invalid or exceeds the upload limit.', false, { maxBytes: HAU_CONFIG.MAX_UPLOAD_BYTES });
  var bytes;
  try { bytes = file.getBlob().getBytes(); }
  catch (error) { throw appError_('BRANDING_STORAGE_VERIFICATION_FAILED', 'Branding bytes could not be verified.', false); }
  if (bytes.length !== size || bytes.length > HAU_CONFIG.MAX_UPLOAD_BYTES) throw appError_('BRANDING_SIZE_MISMATCH', 'Branding stored size does not match verified bytes.', false);
  validateUploadedBytes_(bytes, expected.mime, false);
  var dimensions = imageDimensions_(bytes, expected.mime);
  var digest = sha256Hex_(bytes);
  var actualMime = typeof file.getMimeType === 'function' ? String(file.getMimeType() || '').toLowerCase() : expected.mime;
  if (actualMime !== expected.mime) throw appError_('BRANDING_MIME_MISMATCH', 'Stored branding MIME type does not match metadata.', false);
  if (normalizedUploadExtension_(file.getName()) !== expected.extension) throw appError_('MIME_EXTENSION_MISMATCH', 'Stored branding filename extension does not match MIME type.', false);
  return { bytes: bytes, size: size, width: dimensions.width, height: dimensions.height, sha256: digest };
}

function verifyBrandingStoredRow_(row) {
  if (!row.Drive_File_ID || !row.Drive_Folder_ID || !row.SHA256) throw appError_('BRANDING_STORAGE_REQUIRED', 'Branding cannot be activated until verified storage metadata and checksum are present.', false);
  var expected = brandingMimeAndExtension_(row.Mime_Type, row.File_Extension);
  var folder = brandingFolder_();
  if (String(row.Drive_Folder_ID) !== String(folder.getId())) throw appError_('BRANDING_PARENT_MISMATCH', 'Branding metadata does not reference the controlled Branding folder.', false);
  var file;
  try { file = DriveApp.getFileById(String(row.Drive_File_ID)); }
  catch (error) { throw appError_('BRANDING_STORAGE_VERIFICATION_FAILED', 'Branding file cannot be accessed for activation.', false); }
  var verified = verifyBrandingFile_(file, folder, expected);
  if (verified.size !== Number(row.Size_Bytes) || verified.width !== Number(row.Width_Px) || verified.height !== Number(row.Height_Px) || verified.sha256 !== String(row.SHA256).toLowerCase()) {
    throw appError_('BRANDING_METADATA_MISMATCH', 'Stored branding bytes do not match the recorded verified metadata.', false);
  }
  return verified;
}

function activateBrandingCore_(row, user, correlationId, reason, key) {
  verifyBrandingStoredRow_(row);
  adminRows_(HAU_SHEETS.BRANDING).filter(function(candidate) {
    return String(candidate.Asset_Key) === String(row.Asset_Key) &&
      String(candidate.Branding_Version_ID) !== String(row.Branding_Version_ID) &&
      (candidate.Active === true || String(candidate.Active).toUpperCase() === 'TRUE');
  }).forEach(function(candidate) { updateObject_(HAU_SHEETS.BRANDING, candidate._row, { Active: false, Status: 'SUPERSEDED' }); });
  var patch = { Active: true, Status: 'ACTIVE', Activated_At: nowIso_(), Activated_By: user.User_ID };
  var after = Object.assign({}, row, patch);
  updateObject_(HAU_SHEETS.BRANDING, row._row, patch);
  history_('BRANDING', row.Branding_Version_ID, row.Status || 'DRAFT', 'ACTIVE', user, reason || 'Branding version activated', { idempotencyKey: key || '' });
  audit_('ACTIVATE_BRANDING', 'BRANDING', row.Branding_Version_ID, user, correlationId, { before: brandingAdminDto_(row), after: brandingAdminDto_(after), notes: reason || '' });
  return after;
}

function brandingRow_(command, user, verifiedStorage) {
  var assetKey = brandingAssetKey_(command.assetKey);
  var metadata = brandingMimeAndExtension_(command.mimeType, command.fileExtension || normalizedUploadExtension_(command.originalFileName));
  var latest = brandingLatestVersion_(assetKey);
  var storage = verifiedStorage || {};
  var now = nowIso_();
  return {
    Branding_Version_ID: storage.versionId || allocateId_('BRD'), Asset_Key: assetKey,
    Display_Name: brandingSafeText_(command.displayName, 'displayName', 160),
    Alt_Text: brandingSafeText_(command.altText, 'altText', 250), Mime_Type: metadata.mime,
    File_Extension: metadata.extension, Size_Bytes: storage.size == null ? nonNegativeNumber_(command.sizeBytes, 'sizeBytes') : storage.size,
    Width_Px: storage.width == null ? positiveNumber_(command.widthPx, 'widthPx') : storage.width,
    Height_Px: storage.height == null ? positiveNumber_(command.heightPx, 'heightPx') : storage.height,
    SHA256: storage.sha256 || String(command.sha256 || '').toLowerCase(),
    Drive_File_ID: storage.fileId || String(command.driveFileId || ''),
    Drive_Folder_ID: storage.folderId || String(command.driveFolderId || ''),
    Drive_URL: storage.driveUrl || '', Status: 'DRAFT', Version_Number: brandingVersionNumber_(assetKey),
    Active: false, Created_At: now, Created_By: user.User_ID, Activated_At: '', Activated_By: '',
    Supersedes_Version_ID: latest && latest.Branding_Version_ID || '', Notes: String(command.notes || '').slice(0, 1000)
  };
}

function saveBrandingMetadata_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Admin');
    var key = requireIdempotency_(command);
    var replay = idempotencyReplay_(key, user);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    requireBrandingMetadataOnly_(command);
    var suppliedFileId = String(command.driveFileId || '').trim();
    var suppliedFolderId = String(command.driveFolderId || '').trim();
    var suppliedSha = String(command.sha256 || '').trim().toLowerCase();
    if (suppliedFileId && !/^[A-Za-z0-9_-]{20,}$/.test(suppliedFileId)) throw appError_('VALIDATION_ERROR', 'driveFileId is invalid.', false, { field: 'driveFileId' });
    if (suppliedFolderId && !/^[A-Za-z0-9_-]{20,}$/.test(suppliedFolderId)) throw appError_('VALIDATION_ERROR', 'driveFolderId is invalid.', false, { field: 'driveFolderId' });
    if (suppliedFolderId && !suppliedFileId) throw appError_('VALIDATION_ERROR', 'driveFolderId requires a verified driveFileId.', false, { field: 'driveFolderId' });
    if (suppliedSha && !/^[a-f0-9]{64}$/.test(suppliedSha)) throw appError_('VALIDATION_ERROR', 'sha256 must be a hexadecimal SHA-256 digest.', false, { field: 'sha256' });
    var verifiedStorage = null;
    if (suppliedFileId) {
      var metadata = brandingMimeAndExtension_(command.mimeType, command.fileExtension);
      var folder = brandingFolder_();
      if (command.driveFolderId && String(command.driveFolderId) !== String(folder.getId())) throw appError_('BRANDING_PARENT_MISMATCH', 'Branding metadata must use the controlled Branding folder.', false);
      var file;
      try { file = DriveApp.getFileById(suppliedFileId); }
      catch (error) { throw appError_('BRANDING_STORAGE_VERIFICATION_FAILED', 'Branding file cannot be accessed for verification.', false); }
      var verified = verifyBrandingFile_(file, folder, metadata);
      if (suppliedSha && suppliedSha !== verified.sha256) throw appError_('BRANDING_METADATA_MISMATCH', 'Supplied checksum does not match the verified branding bytes.', false);
      if (command.sizeBytes != null && command.sizeBytes !== '' && Number(command.sizeBytes) !== verified.size) throw appError_('BRANDING_METADATA_MISMATCH', 'Supplied size does not match the verified branding bytes.', false);
      if (command.widthPx != null && command.widthPx !== '' && Number(command.widthPx) !== verified.width || command.heightPx != null && command.heightPx !== '' && Number(command.heightPx) !== verified.height) throw appError_('BRANDING_DIMENSIONS_MISMATCH', 'Supplied dimensions do not match the verified branding image.', false);
      verifiedStorage = { size: verified.size, width: verified.width, height: verified.height, sha256: verified.sha256, fileId: file.getId(), folderId: folder.getId(), driveUrl: file.getUrl() };
    }
    var row = brandingRow_(command, user, verifiedStorage);
    appendObject_(HAU_SHEETS.BRANDING, row);
    audit_('SAVE_BRANDING_METADATA', 'BRANDING', row.Branding_Version_ID, user, correlationId, { after: brandingAdminDto_(row) });
    if (command.activate === true || String(command.activate).toUpperCase() === 'TRUE') row = activateBrandingCore_(row, user, correlationId, command.reason, key);
    return recordIdempotency_(key, { branding: brandingAdminDto_(row), brandingVersionId: row.Branding_Version_ID, entityType: 'BRANDING', entityId: row.Branding_Version_ID }, user, correlationId);
  });
}

function uploadBrandingAsset_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Admin');
    var key = requireIdempotency_(command);
    var replay = idempotencyReplay_(key, user);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var assetKey = brandingAssetKey_(command.assetKey);
    var metadata = brandingMimeAndExtension_(command.mimeType, normalizedUploadExtension_(command.originalFileName));
    brandingSafeText_(command.displayName, 'displayName', 160);
    brandingSafeText_(command.altText, 'altText', 250);
    var bytes = decodeEvidenceBytes_(command);
    validateUploadedBytes_(bytes, metadata.mime, false);
    var dimensions = imageDimensions_(bytes, metadata.mime);
    if (command.widthPx && Number(command.widthPx) !== dimensions.width || command.heightPx && Number(command.heightPx) !== dimensions.height) {
      throw appError_('BRANDING_DIMENSIONS_MISMATCH', 'Declared branding dimensions do not match the verified image.', false);
    }
    var digest = sha256Hex_(bytes);
    var duplicate = adminRows_(HAU_SHEETS.BRANDING).find(function(row) {
      return String(row.Asset_Key) === assetKey && String(row.SHA256).toLowerCase() === digest && String(row.Status) !== 'ARCHIVED';
    });
    if (duplicate) {
      verifyBrandingStoredRow_(duplicate);
      var duplicateRow = duplicate;
      if ((command.activate === true || String(command.activate).toUpperCase() === 'TRUE') && !(duplicate.Active === true || String(duplicate.Active).toUpperCase() === 'TRUE')) duplicateRow = activateBrandingCore_(duplicate, user, correlationId, command.reason, key);
      audit_('DUPLICATE_BRANDING_UPLOAD', 'BRANDING', duplicate.Branding_Version_ID, user, correlationId, { after: { assetKey: assetKey, checksumReplay: true } });
      return recordIdempotency_(key, { branding: brandingAdminDto_(duplicateRow), brandingVersionId: duplicateRow.Branding_Version_ID, duplicate: true, entityType: 'BRANDING', entityId: duplicateRow.Branding_Version_ID }, user, correlationId);
    }
    var folder = brandingFolder_();
    var version = brandingVersionNumber_(assetKey);
    var versionId = allocateId_('BRD');
    var filename = ['BRAND', assetKey, 'V' + version, Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss'), sanitizeSystemToken_(versionId).slice(-24)].join('_') + '.' + metadata.extension;
    var file;
    try {
      file = folder.createFile(Utilities.newBlob(bytes, metadata.mime, filename));
      file.setName(filename);
      file.setDescription('HAU-USC verified branding asset | ' + assetKey + ' | version ' + version);
      verifyCreatedFileParent_(file, folder);
      requireSafeDriveSharing_(file, 'BRANDING_FILE');
    } catch (error) {
      var recovery = file ? moveToQuarantine_(file, 'branding upload verification failed') : { status: 'NOT_CREATED' };
      throw appError_(error && error.code || 'BRANDING_UPLOAD_FAILED', 'Branding could not be stored in verified private storage.', true, { recoveryStatus: recovery.status });
    }
    var row = brandingRow_(Object.assign({}, command, { assetKey: assetKey, fileExtension: metadata.extension }), user, {
      size: bytes.length, width: dimensions.width, height: dimensions.height, sha256: digest,
      fileId: file.getId(), folderId: folder.getId(), driveUrl: file.getUrl(), versionId: versionId
    });
    row.Version_Number = version;
    try { appendObject_(HAU_SHEETS.BRANDING, row); }
    catch (error) {
      var metadataRecovery = moveToQuarantine_(file, 'branding metadata write failed');
      try {
        audit_('QUARANTINE_BRANDING_ASSET', 'BRANDING', row.Branding_Version_ID, user, correlationId, {
          after: { assetKey: row.Asset_Key, recoveryStatus: metadataRecovery.status, metadataRecorded: false }
        });
      } catch (ignored) {}
      throw appError_('BRANDING_METADATA_FAILED', 'The branding file was quarantined because version metadata could not be recorded.', true, { recoveryStatus: metadataRecovery.status });
    }
    audit_('UPLOAD_BRANDING_ASSET', 'BRANDING', row.Branding_Version_ID, user, correlationId, { after: brandingAdminDto_(row) });
    if (command.activate === true || String(command.activate).toUpperCase() === 'TRUE') row = activateBrandingCore_(row, user, correlationId, command.reason, key);
    return recordIdempotency_(key, { branding: brandingAdminDto_(row), brandingVersionId: row.Branding_Version_ID, duplicate: false, entityType: 'BRANDING', entityId: row.Branding_Version_ID }, user, correlationId);
  });
}

function activateBrandingVersion_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Admin');
    var key = requireIdempotency_(command);
    var replay = idempotencyReplay_(key, user);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var row = findOne_(HAU_SHEETS.BRANDING, 'Branding_Version_ID', requireText_(command.brandingVersionId, 'brandingVersionId'));
    if (!row) throw appError_('BRANDING_VERSION_NOT_FOUND', 'The branding version was not found.', false);
    var after = activateBrandingCore_(row, user, correlationId, command.reason, key);
    return recordIdempotency_(key, { branding: brandingAdminDto_(after), brandingVersionId: after.Branding_Version_ID, entityType: 'BRANDING', entityId: after.Branding_Version_ID }, user, correlationId);
  });
}

function getBrandingState_() {
  var rows = adminRows_(HAU_SHEETS.BRANDING).filter(function(row) { return row.Active === true || String(row.Active).toUpperCase() === 'TRUE'; });
  var assets = rows.map(brandingPublicDto_);
  if (!assets.length) assets = [{ assetKey: 'BRAND_WORDMARK', displayName: 'HAU-USC Logistics', altText: 'HAU-USC Logistics', active: false, deliveryAvailable: false, useFallback: true, fallbackKey: 'BUILT_IN_WORDMARK' }];
  return { branding: assets, fallbackRequired: true };
}

function getAdminDashboard_(){var user=requirePermission_('Can_Admin'),commands=adminRows_(HAU_SHEETS.COMMANDS);return{environment:resolveRuntimeConfig_().environment,currentUser:{id:user.User_ID,displayName:user.Display_Name||'',role:user.Role},counts:{users:adminRows_(HAU_SHEETS.USERS).length,events:adminRows_(HAU_SHEETS.EVENTS).length,contentRevisions:adminRows_(HAU_SHEETS.CONTENT).length,brandingVersions:adminRows_(HAU_SHEETS.BRANDING).length,pendingCommands:commands.filter(function(row){return String(row.Status)==='PENDING';}).length,failedCommands:commands.filter(function(row){return String(row.Status)==='FAILED';}).length},users:adminRows_(HAU_SHEETS.USERS).map(userAccessDto_),events:adminRows_(HAU_SHEETS.EVENTS).map(eventAdminDto_),content:adminRows_(HAU_SHEETS.CONTENT).map(contentDto_),branding:adminRows_(HAU_SHEETS.BRANDING).map(brandingAdminDto_)};}
