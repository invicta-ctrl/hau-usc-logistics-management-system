function api_getBootstrapData(command) { return guardApi_('getBootstrapData', command || {}, function() { return getBootstrapData_(command || {}); }); }
function api_searchCatalog(command) { return guardApi_('searchCatalog', command || {}, function() { var user=resolveRequesterUser_(),includeSensitive=canPermission_(user,'Can_Review');return { items: searchCatalog_(command || {},includeSensitive), availabilityProtected:!includeSensitive }; }); }
function api_getInventoryItem(command) { return guardApi_('getInventoryItem', command || {}, function() { return getInventoryItem_(command || {}); }); }
function api_submitRequest(command) { return guardMutationApi_('submitRequest', command, function(c) { return submitRequest_(command, c); }); }
function api_reviewRequest(command) { return guardMutationApi_('reviewRequest', command, function(c) { return reviewRequest_(command, c); }); }
function api_reserveStock(command) { return guardMutationApi_('reserveStock', command, function(c) { return reserveStockCommand_(command, c); }); }
function api_createLendingTicket(command) { return guardMutationApi_('createLendingTicket', command, function(c) { return createLendingTicket_(command, c); }); }
function api_approveLendingTicket(command) { return guardMutationApi_('approveLendingTicket', command, function(c) { return approveLendingTicket_(command, c); }); }
function api_confirmLendingHandoff(command) { return guardMutationApi_('confirmLendingHandoff', command, function(c) { return confirmLendingHandoff_(command, c); }); }
function api_confirmReturn(command) { return guardMutationApi_('confirmReturn', command, function(c) { return confirmReturn_(command, c); }); }
function api_saveCanvassReference(command) { return guardMutationApi_('saveCanvassReference', command, function(c) { return saveCanvassReference_(command, c); }); }
function api_selectPreferredCanvass(command) { return guardMutationApi_('selectPreferredCanvass', command, function(c) { return selectPreferredCanvass_(command, c); }); }
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
