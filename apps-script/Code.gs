function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('HAU-USC Logistics Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include_(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function api_healthCheck() {
  return guardApi_('healthCheck', {}, function(correlationId) {
    requirePermission_('Can_Admin');
    return healthCheck_(correlationId);
  });
}
