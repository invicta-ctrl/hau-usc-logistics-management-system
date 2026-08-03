function api_getBootstrapData(command) { return guardApi_('getBootstrapData', command || {}, function() { if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2) throw appError_('LEGACY_BOOTSTRAP_DISABLED', 'The legacy bootstrap endpoint is disabled while the canonical bootstrap contract is active.', false, { reason: 'CANONICAL_BOOTSTRAP_REQUIRED' }); return getBootstrapData_(command || {}); }); }
function api_getEssentialBootstrapData(command) { return guardApi_('getEssentialBootstrapData', command || {}, function() { return apiEssentialBootstrapData_(command || {}); }); }
function api_getBootstrapModule(command) { return guardApi_('getBootstrapModule', command || {}, function() { return apiGetBootstrapModule_(command || {}); }); }
function api_runAuthorizationMappingDryRun() { return runAuthorizationMappingDryRun(); }
function api_applyAuthorizationMapping(command) { return applyAuthorizationMapping(command || {}); }
function api_searchCatalog(command) { return guardApi_('searchCatalog', command || {}, function() { var user=resolveRequesterUser_(),includeSensitive=canPermission_(user,'Can_Review');return { items: searchCatalog_(command || {},includeSensitive), availabilityProtected:!includeSensitive }; }); }
function api_getInventoryItem(command) { return guardApi_('getInventoryItem', command || {}, function() { return getInventoryItem_(command || {}); }); }
function api_submitRequest(command) { return guardMutationApi_('submitRequest', command, function(c) { return submitRequest_(command, c); }); }
function api_reviewRequest(command) { return guardMutationApi_('reviewRequest', command, function(c) { return reviewRequest_(command, c); }); }
function api_submitCompositeRequest(command) { return guardMutationApi_('submitCompositeRequest', command, function(c) { return submitCompositeRequest_(command, c); }); }
function api_getCompositeRequest(command) { return guardApi_('getCompositeRequest', command || {}, function() { return getCompositeRequest_(command || {}); }); }
function api_getFoodWorkQueue(command) { return guardApi_('getFoodWorkQueue', command || {}, function() { return getFoodWorkQueue_(); }); }
function api_updateFoodComponent(command) { return guardMutationApi_('updateFoodComponent', command, function(c) { return updateFoodComponent_(command, c); }); }
function api_getMaterialsWorkQueue(command) { return guardApi_('getMaterialsWorkQueue', command || {}, function() { return getMaterialsWorkQueue_(); }); }
function api_updateMaterialsComponent(command) { return guardMutationApi_('updateMaterialsComponent', command, function(c) { return updateMaterialsComponent_(command, c); }); }
function api_searchVenueEquipmentReferences(command) { return guardApi_('searchVenueEquipmentReferences', command || {}, function() { return { items: searchVenueEquipmentReferences_(command || {}), availabilityProtected: true }; }); }
function api_getVenueEquipmentWorkQueue(command) { return guardApi_('getVenueEquipmentWorkQueue', command || {}, function() { return getVenueEquipmentWorkQueue_(command || {}); }); }
function api_updateVenueEquipmentComponent(command) { return guardMutationApi_('updateVenueEquipmentComponent', command, function(c) { return updateVenueEquipmentComponent_(command, c); }); }
function api_getReferenceAdminWorkspace(command) { return guardApi_('getReferenceAdminWorkspace', command || {}, function() { return getReferenceAdminWorkspace_(command || {}); }); }
function api_previewReferenceAdminChange(command) { return guardApi_('previewReferenceAdminChange', command || {}, function() { return previewReferenceAdminChange_(command || {}); }); }
function api_submitReferenceAdminChange(command) { return guardMutationApi_('submitReferenceAdminChange', command || {}, function(c) { return submitReferenceAdminChange_(command || {}, c); }); }
function api_reviewReferenceAdminChange(command) { return guardMutationApi_('reviewReferenceAdminChange', command || {}, function(c) { return reviewReferenceAdminChange_(command || {}, c); }); }
function api_transitionCompositeComponent(command) { return guardMutationApi_('transitionCompositeComponent', command, function(c) { return transitionCompositeComponent_(command, c); }); }
function api_cancelCompositeRequest(command) { return guardMutationApi_('cancelCompositeRequest', command, function(c) { return cancelCompositeRequest_(command, c); }); }
function api_reopenCompositeRequest(command) { return guardMutationApi_('reopenCompositeRequest', command, function(c) { return reopenCompositeRequest_(command, c); }); }
function api_amendCompositeRequest(command) { return guardMutationApi_('amendCompositeRequest', command, function(c) { return amendCompositeRequest_(command, c); }); }
function api_addCompositeSection(command) { return guardMutationApi_('addCompositeSection', command, function(c) { return addCompositeSection_(command, c); }); }
function api_assignCompositeComponent(command) { return guardMutationApi_('assignCompositeComponent', command, function(c) { return assignCompositeComponent_(command, c); }); }
function api_escalateCompositeComponent(command) { return guardMutationApi_('escalateCompositeComponent', command, function(c) { return escalateCompositeComponent_(command, c); }); }
function api_reserveStock(command) { return guardMutationApi_('reserveStock', command, function(c) { return reserveStockCommand_(command, c); }); }
function api_createLendingTicket(command) { return guardMutationApi_('createLendingTicket', command, function(c) { return createLendingTicket_(command, c); }); }
function api_approveLendingTicket(command) { return guardMutationApi_('approveLendingTicket', command, function(c) { return approveLendingTicket_(command, c); }); }
function api_confirmLendingHandoff(command) { return guardMutationApi_('confirmLendingHandoff', command, function(c) { return confirmLendingHandoff_(command, c); }); }
function api_confirmReturn(command) { return guardMutationApi_('confirmReturn', command, function(c) { return confirmReturn_(command, c); }); }
function api_saveCanvassReference(command) { return guardMutationApi_('saveCanvassReference', command, function(c) { return saveCanvassReference_(command, c); }); }
function api_updateCanvassReference(command) { return guardMutationApi_('updateCanvassReference', command, function(c) { return updateCanvassReference_(command, c); }); }
function api_archiveCanvassReference(command) { return guardMutationApi_('archiveCanvassReference', command, function(c) { return archiveCanvassReference_(command, c); }); }
function api_selectPreferredCanvass(command) { return guardMutationApi_('selectPreferredCanvass', command, function(c) { return selectPreferredCanvass_(command, c); }); }
function api_getRestockDetail(command) { return guardApi_('getRestockDetail', command || {}, function() { return getRestockDetail_(command || {}); }); }
function api_transitionRestock(command) { return guardMutationApi_('transitionRestock', command, function(c) { return transitionRestock_(command, c); }); }
function api_receiveRestock(command) { return guardMutationApi_('receiveRestock', command, function(c) { return receiveRestock_(command, c); }); }
function api_receiveDeliverable(command) { return guardMutationApi_('receiveDeliverable', command, function(c) { return receiveDeliverable_(command, c); }); }
function api_confirmRelease(command) { return guardMutationApi_('confirmRelease', command, function(c) { return confirmRelease_(command, c); }); }
function api_transferEventItemToInventory(command) { return guardMutationApi_('transferEventItemToInventory', command, function(c) { return transferEventItemToInventory_(command, c); }); }
function api_uploadEvidence(command) { return guardMutationApi_('uploadEvidence', command, function(c) { return withScriptLock_(function(){ return uploadEvidence_(command, c); }); }); }
function api_transitionDeliverable(command) { return guardMutationApi_('transitionDeliverable', command, function(c) { return transitionDeliverable_(command, c); }); }
function api_postEmergencyIssue(command) { return guardMutationApi_('postEmergencyIssue', command, function(c) { return postEmergencyIssue_(command, c); }); }
function api_postCycleCountAdjustment(command) { return guardMutationApi_('postCycleCountAdjustment', command, function(c) { return postCycleCountAdjustment_(command, c); }); }
function api_createInventoryItem(command) { return guardMutationApi_('createInventoryItem', command, function(c) { return createInventoryItem_(command, c); }); }
function api_updateInventoryItem(command) { return guardMutationApi_('updateInventoryItem', command, function(c) { return updateInventoryItem_(command, c); }); }
function api_updateInventoryStorageContext(command) { return guardMutationApi_('updateInventoryStorageContext', command, function(c) { return updateInventoryStorageContext_(command, c); }); }
function api_archiveInventoryItem(command) { return guardMutationApi_('archiveInventoryItem', command, function(c) { return archiveInventoryItem_(command, c); }); }
function api_restoreInventoryItem(command) { return guardMutationApi_('restoreInventoryItem', command, function(c) { return restoreInventoryItem_(command, c); }); }
function api_acceptRequest(command) { command=Object.assign({},command,{decision:'ACCEPT'}); return api_reviewRequest(command); }
function api_confirmLendingReturn(command) { return api_confirmReturn(command); }
function api_transferEventItem(command) { return api_transferEventItemToInventory(command); }
function api_finalizeEvidence(command) { return api_uploadEvidence(command); }
