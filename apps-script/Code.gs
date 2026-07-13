function doGet(e) {
  var runtime = resolveRuntimeConfig_();
  var diagnostic = Boolean(e && e.parameter && e.parameter.diagnostic === '1');
  var portalMode = portalModeFromRequest_(e);
  var templateName = 'Index';
  if (diagnostic) {
    if (runtime.environment !== 'STAGING') {
      throw new Error('The HTML diagnostic shell is available only in STAGING.');
    }
    templateName = 'DiagnosticShell';
  }
  var template = HtmlService.createTemplateFromFile(templateName);
  template.portalMode = portalMode;
  template.requestOnly = portalMode !== 'internal';
  template.appEnvironment = runtime.environment;
  return template
    .evaluate()
    .setTitle(diagnostic ? 'HAU-USC Logistics Staging Diagnostic' : 'HAU-USC Logistics Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function portalModeFromRequest_(e) {
  var parameters = e && e.parameter || {};
  if (String(parameters.lending || '') === '1') return 'lending';
  if (String(parameters.request || '') === '1') return 'request';
  return 'internal';
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

function api_htmlDiagnosticPing() {
  return {
    ok: true,
    diagnostic: 'HTML_SERVICE',
    timestamp: new Date().toISOString()
  };
}

function htmlTemplateDiagnostics() {
  requirePermission_('Can_Admin');
  var template = HtmlService.createTemplateFromFile('Index');
  var raw = template.getRawContent();
  var generated = template.getCode();
  var generatedWithComments = template.getCodeWithComments();
  var report = {
    correlationId: 'HTML-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    rawTemplateLength: raw.length,
    generatedCodeLength: generated.length,
    generatedCodeWithCommentsLength: generatedWithComments.length,
    rawTemplatePrefix: boundedTemplateSnippet_(raw, true),
    rawTemplateSuffix: boundedTemplateSnippet_(raw, false),
    generatedPrefix: boundedTemplateSnippet_(generated, true),
    generatedSuffix: boundedTemplateSnippet_(generated, false)
  };
  console.log(JSON.stringify(report));
  return report;
}

function boundedTemplateSnippet_(value, fromStart) {
  var text = String(value || '');
  var limit = 160;
  var snippet = fromStart ? text.slice(0, limit) : text.slice(Math.max(0, text.length - limit));
  return snippet
    .replace(/[A-Za-z0-9_-]{24,}/g, '[REDACTED_TOKEN]')
    .replace(/\s+/g, ' ')
    .trim();
}
