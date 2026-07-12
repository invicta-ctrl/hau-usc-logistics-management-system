function api_getBootstrapData(command) { return guardApi_('getBootstrapData', command || {}, function() { return getBootstrapData_(command || {}); }); }
function api_searchCatalog(command) { return guardApi_('searchCatalog', command || {}, function() { var user=resolveRequesterUser_(),includeSensitive=canPermission_(user,'Can_Review');return { items: searchCatalog_(command || {},includeSensitive), availabilityProtected:!includeSensitive }; }); }
function api_submitRequest(command) { return guardApi_('submitRequest', command, function(c) { return submitRequest_(command, c); }); }
function api_reviewRequest(command) { return guardApi_('reviewRequest', command, function(c) { return reviewRequest_(command, c); }); }
function api_reserveStock(command) { return guardApi_('reserveStock', command, function(c) { return reserveStockCommand_(command, c); }); }
function api_createLendingTicket(command) { return guardApi_('createLendingTicket', command, function(c) { return createLendingTicket_(command, c); }); }
function api_approveLendingTicket(command) { return guardApi_('approveLendingTicket', command, function(c) { return approveLendingTicket_(command, c); }); }
function api_confirmLendingHandoff(command) { return guardApi_('confirmLendingHandoff', command, function(c) { return confirmLendingHandoff_(command, c); }); }
function api_confirmReturn(command) { return guardApi_('confirmReturn', command, function(c) { return confirmReturn_(command, c); }); }
function api_saveCanvassReference(command) { return guardApi_('saveCanvassReference', command, function(c) { return saveCanvassReference_(command, c); }); }
function api_selectPreferredCanvass(command) { return guardApi_('selectPreferredCanvass', command, function(c) { return selectPreferredCanvass_(command, c); }); }
function api_receiveRestock(command) { return guardApi_('receiveRestock', command, function(c) { return receiveRestock_(command, c); }); }
function api_receiveDeliverable(command) { return guardApi_('receiveDeliverable', command, function(c) { return receiveDeliverable_(command, c); }); }
function api_confirmRelease(command) { return guardApi_('confirmRelease', command, function(c) { return confirmRelease_(command, c); }); }
function api_transferEventItemToInventory(command) { return guardApi_('transferEventItemToInventory', command, function(c) { return transferEventItemToInventory_(command, c); }); }
function api_uploadEvidence(command) { return guardApi_('uploadEvidence', command, function(c) { return withScriptLock_(function(){ return uploadEvidence_(command, c); }); }); }
function api_transitionDeliverable(command) { return guardApi_('transitionDeliverable', command, function(c) { return transitionDeliverable_(command, c); }); }
function api_postEmergencyIssue(command) { return guardApi_('postEmergencyIssue', command, function(c) { return postEmergencyIssue_(command, c); }); }
function api_postCycleCountAdjustment(command) { return guardApi_('postCycleCountAdjustment', command, function(c) { return postCycleCountAdjustment_(command, c); }); }
function api_acceptRequest(command) { command=Object.assign({},command,{decision:'ACCEPT'}); return api_reviewRequest(command); }
function api_confirmLendingReturn(command) { return api_confirmReturn(command); }
function api_transferEventItem(command) { return api_transferEventItemToInventory(command); }
function api_finalizeEvidence(command) { return api_uploadEvidence(command); }
