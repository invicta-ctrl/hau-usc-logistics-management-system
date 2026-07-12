function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.requestOnly = Boolean(e && e.parameter && e.parameter.request === '1');
  return template
    .evaluate()
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
