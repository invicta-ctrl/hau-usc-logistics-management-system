function lendingPortalItemDto_(item) {
  var status = String(item.Status || '').toUpperCase();
  var handlingCode = String(item.Handling || 'NON_CIRCULATING').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return {
    id: item.Item_ID,
    name: item.Item_Name,
    aliases: String(item.Aliases || '').split('|').filter(Boolean),
    category: item.Category,
    catalogType: item.Catalog_Type || (String(item.Stock_Area || '').toUpperCase() === 'PANTRY' ? 'PANTRY' : 'OFFICE_INVENTORY'),
    handling: item.Handling,
    handlingCode: handlingCode,
    unit: item.Unit,
    status: status === 'VERIFY' ? 'VERIFY' : 'ACTIVE',
    lendingAudience: item.Lending_Audience || 'NOT_AVAILABLE_FOR_LENDING',
    defaultLoanDays: item.Default_Loan_Days === '' || item.Default_Loan_Days == null ? '' : Number(item.Default_Loan_Days),
    maximumLoanQuantity: item.Maximum_Loan_Qty === '' || item.Maximum_Loan_Qty == null ? '' : Number(item.Maximum_Loan_Qty),
    approvalRequired: !(item.Approval_Required === false || String(item.Approval_Required).toUpperCase() === 'FALSE'),
    returnRequired: handlingCode === 'LOANABLE' || handlingCode === 'REUSABLE_ASSET',
    availabilityProtected: true
  };
}

function getLendingBootstrap_() {
  var user = resolveRequesterUser_();
  var internal = isInternalBootstrapUser_(user);
  var items = readObjects_(HAU_SHEETS.ITEMS).filter(function(item) {
    var status = String(item.Status || '').toUpperCase();
    return status === 'ACTIVE' || status === 'VERIFY';
  }).map(lendingPortalItemDto_);
  return {
    version: HAU_CONFIG.APP_VERSION,
    schemaVersion: HAU_CONFIG.SCHEMA_VERSION,
    backendMode: 'apps-script',
    environment: resolveRuntimeConfig_().environment,
    portalMode: 'lending',
    currentUser: {
      displayName: internal ? user.Display_Name || 'Authenticated staff' : 'Requester',
      authenticatedStaff: internal
    },
    inventoryItems: items,
    catalogAvailabilityProtected: true,
    historyAvailable: false
  };
}
