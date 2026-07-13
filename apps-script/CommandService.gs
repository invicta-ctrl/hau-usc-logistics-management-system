function commandNow_() {
  return typeof nowIso_ === 'function' ? nowIso_() : new Date().toISOString();
}

function commandOperation_() {
  return HAU_MUTATION_CONTEXT_ && HAU_MUTATION_CONTEXT_.operation || 'UNSCOPED_MUTATION';
}

function commandActor_(user) {
  if (user && user.User_ID) return user;
  try {
    if (typeof resolveRequesterUser_ === 'function') return resolveRequesterUser_();
    if (typeof resolveCurrentUser_ === 'function') return resolveCurrentUser_();
  } catch (ignored) {}
  return { User_ID:'SYSTEM', Email:'' };
}

function commandStableValue_(value) {
  if (Array.isArray(value)) return value.map(commandStableValue_);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce(function(output,key){output[key]=commandStableValue_(value[key]);return output;},{});
  }
  return value;
}

function commandPayloadHash_() {
  var payload = HAU_MUTATION_CONTEXT_ && HAU_MUTATION_CONTEXT_.command || {};
  var serialized = safeJson_(commandStableValue_(payload));
  if (typeof Utilities !== 'undefined' && Utilities.computeDigest) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, serialized).map(function(value){return (value<0?value+256:value).toString(16).padStart(2,'0');}).join('');
  }
  var hash = 2166136261;
  for (var index=0; index<serialized.length; index+=1) { hash ^= serialized.charCodeAt(index); hash = Math.imul(hash,16777619); }
  return 'FNV32-' + (hash >>> 0).toString(16);
}

function commandScope_(key, user) {
  var actor = commandActor_(user);
  return {
    operation: commandOperation_(),
    actor: actor,
    key: String(key),
    scope: [commandOperation_(), String(actor.User_ID || 'SYSTEM'), String(key)].join('|'),
    payloadHash: commandPayloadHash_()
  };
}

function commandJournalAvailable_() {
  return Boolean(HAU_SHEETS && HAU_SHEETS.COMMANDS && typeof readObjects_ === 'function' && typeof appendObject_ === 'function' && typeof updateObject_ === 'function');
}

function commandJournalRows_() {
  if (!commandJournalAvailable_()) return null;
  return readObjects_(HAU_SHEETS.COMMANDS);
}

function commandId_() {
  if (typeof allocateId_ === 'function') return allocateId_('CMD');
  return 'CMD-' + (typeof Utilities !== 'undefined' && Utilities.getUuid ? Utilities.getUuid() : String(Date.now()));
}

function beginOrReplayScopedCommand_(key, user) {
  var scoped = commandScope_(key,user), rows = commandJournalRows_();
  if (!rows) return undefined;
  if (rows) {
    var row = rows.find(function(candidate){return String(candidate.Idempotency_Scope)===scoped.scope;});
    if (row) {
      if (row.Payload_SHA256 && String(row.Payload_SHA256)!==scoped.payloadHash) throw appError_('IDEMPOTENCY_PAYLOAD_MISMATCH','This idempotency key was already used with a different payload.',false);
      if (String(row.Status)==='COMPLETED') { try{return JSON.parse(row.Result_JSON||'{}');}catch(error){throw appError_('IDEMPOTENCY_RESULT_INVALID','The stored command result is invalid.',false);} }
      throw appError_('COMMAND_RECOVERY_REQUIRED','A previous attempt with this idempotency key did not complete cleanly. An administrator must review its recovery state.',false,{correlationId:row.Correlation_ID||''});
    }
    var legacy = legacySameActorReplay_(key,scoped.actor);
    if (legacy) return legacy;
    var now = commandNow_();
    var pending = {
      Command_ID:commandId_(), Operation:scoped.operation, Actor_User_ID:scoped.actor.User_ID||'SYSTEM', Actor_Email:scoped.actor.Email||'',
      Idempotency_Scope:scoped.scope, Client_Request_ID:scoped.key, Payload_SHA256:scoped.payloadHash, Status:'PENDING',
      Started_At:now, Completed_At:'', Correlation_ID:HAU_MUTATION_CONTEXT_&&HAU_MUTATION_CONTEXT_.correlationId||'',
      Related_Entity_Type:'', Related_Entity_ID:'', Result_JSON:'', Error_Code:'', Error_Message:'', Recovery_Status:'NOT_REQUIRED', Recovery_Notes:''
    };
    appendObject_(HAU_SHEETS.COMMANDS,pending);
    if (HAU_MUTATION_CONTEXT_) (HAU_MUTATION_CONTEXT_.commandScopes=HAU_MUTATION_CONTEXT_.commandScopes||[]).push(scoped.scope);
  }
  return null;
}

function completeScopedCommand_(key, result, user, correlationId) {
  var scoped=commandScope_(key,user), rows=commandJournalRows_();
  if (!rows) return;
  var row=rows.find(function(candidate){return String(candidate.Idempotency_Scope)===scoped.scope;});
  var patch={Status:'COMPLETED',Completed_At:commandNow_(),Correlation_ID:correlationId||'',Related_Entity_Type:result&&result.entityType||'',Related_Entity_ID:result&&result.entityId||result&&result.itemId||'',Result_JSON:safeJson_(result||{}),Error_Code:'',Error_Message:'',Recovery_Status:'NOT_REQUIRED',Recovery_Notes:''};
  if (row) updateObject_(HAU_SHEETS.COMMANDS,row._row,patch);
  else appendObject_(HAU_SHEETS.COMMANDS,Object.assign({Command_ID:commandId_(),Operation:scoped.operation,Actor_User_ID:scoped.actor.User_ID||'SYSTEM',Actor_Email:scoped.actor.Email||'',Idempotency_Scope:scoped.scope,Client_Request_ID:scoped.key,Payload_SHA256:scoped.payloadHash,Started_At:commandNow_()},patch));
}

function failScopedCommands_(context,error) {
  if (!context || !context.commandScopes || !context.commandScopes.length) return;
  var rows=commandJournalRows_(); if(!rows)return;
  context.commandScopes.forEach(function(scope){var row=rows.find(function(candidate){return String(candidate.Idempotency_Scope)===String(scope)&&String(candidate.Status)==='PENDING';});if(row)updateObject_(HAU_SHEETS.COMMANDS,row._row,{Status:'FAILED',Completed_At:commandNow_(),Error_Code:error&&error.code||'INTERNAL_ERROR',Error_Message:error&&error.code?String(error.message||'').slice(0,500):'The command failed after it started.',Recovery_Status:'REVIEW_REQUIRED'});});
}

function legacySameActorReplay_(key,user) {
  if (typeof readObjects_!=='function') return null;
  var actor=commandActor_(user); if(String(actor.User_ID||'')==='PUBLIC')return null;
  var rows;try{rows=readObjects_(HAU_SHEETS.AUDIT);}catch(ignored){return null;}
  var row=rows.find(function(candidate){if(candidate.Action!=='IDEMPOTENCY_COMPLETED'||String(candidate.Actor_User_ID||'SYSTEM')!==String(actor.User_ID||'SYSTEM'))return false;try{var notes=JSON.parse(candidate.Notes||'{}');return notes.scope?notes.scope===commandScope_(key,actor).scope:notes.key===key;}catch(error){return false;}});
  if(!row)return null;try{return JSON.parse(row.After_JSON||'{}');}catch(ignored){return null;}
}
