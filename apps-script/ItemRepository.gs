function getItemById_(itemId) { return itemById_(itemId); }
function listTransactableItems_() { return readObjects_(HAU_SHEETS.ITEMS).filter(function(item) { return String(item.Status) === 'ACTIVE'; }); }
function listVerificationItems_() { return readObjects_(HAU_SHEETS.ITEMS).filter(function(item) { return String(item.Status) === 'VERIFY'; }); }

