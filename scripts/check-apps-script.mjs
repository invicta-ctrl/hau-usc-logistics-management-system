import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  analyzeAssembledDocument,
  assembleAppsScriptTemplate,
  bundleDiagnostics,
  createAppsScriptBundleFromProject,
  extractRawTextElementContent,
  tokenizeHtml,
} from './apps-script-bundle-lib.mjs';

const requiredFiles = [
  'Code.gs','Config.gs','Auth.gs','Authorization.gs','BootstrapService.gs','Router.gs','IdService.gs','Validation.gs','SheetRepository.gs','DataRevisionService.gs',
  'ItemRepository.gs','RequestService.gs','InventoryService.gs','ReservationService.gs','LendingService.gs',
  'ReleaseService.gs','RestockService.gs','ProcurementService.gs','CanvassService.gs','EvidenceService.gs',
  'DriveService.gs','AuditService.gs','MigrationService.gs','BackupService.gs','ErrorService.gs','Setup.gs',
  'RosterSyncService.gs','CommitteeDashboardService.gs',
  'appsscript.json','Index.html','AppBody.html','AppStyles.html','AppScript.html','DiagnosticShell.html',
];
const requiredFunctions = [
  'setupDatabase','validateDatabaseSchema','setupDriveFolders','validateDriveConfiguration','setupTimeTriggers',
  'seedRolesAndPermissions','runMigrationDryRun','applyApprovedMigration','createLaunchBackup','runReconciliation','healthCheck',
  'api_getBootstrapData','api_getEssentialBootstrapData','api_getBootstrapModule','api_getAuthorizationContract','runAuthorizationMappingDryRun','applyAuthorizationMapping','api_submitRequest','api_reviewRequest','api_confirmRelease','api_uploadEvidence',
  'api_getDataRevision','setupOperationalEditTrigger','handleOperationalSheetEdit','api_getInventoryItem',
  'api_createInventoryItem','api_updateInventoryItem','api_updateInventoryStorageContext','api_archiveInventoryItem','api_restoreInventoryItem',
  'api_htmlDiagnosticPing','htmlTemplateDiagnostics',
  'api_runRosterSync','api_getRosterSyncHealth','api_setRosterEmergencyDeny','setupRosterSyncTrigger','runScheduledRosterSync','committeeDashboard_',
];
const root = resolve('apps-script');
const existing = new Set(await readdir(root));
const missing = requiredFiles.filter((file) => !existing.has(file));
if (missing.length) throw new Error(`Missing Apps Script files: ${missing.join(', ')}`);
const gasFiles = [...existing].filter((file) => file.endsWith('.gs')).sort();
let combined = '';
for (const file of gasFiles) {
  const source = await readFile(resolve(root, file), 'utf8');
  new Function(source);
  combined += `\n${source}`;
}
const missingFunctions = requiredFunctions.filter((name) => !new RegExp(`function\\s+${name}\\s*\\(`).test(combined));
if (missingFunctions.length) throw new Error(`Missing Apps Script functions: ${missingFunctions.join(', ')}`);
const manifest = JSON.parse(await readFile(resolve(root, 'appsscript.json'), 'utf8'));
if (manifest.runtimeVersion !== 'V8' || manifest.timeZone !== 'Asia/Manila') throw new Error('Apps Script manifest is not configured for V8 and Asia/Manila.');

const [index, appBody, appStyles, appScript, diagnosticShell] = await Promise.all([
  readFile(resolve(root, 'Index.html'), 'utf8'),
  readFile(resolve(root, 'AppBody.html'), 'utf8'),
  readFile(resolve(root, 'AppStyles.html'), 'utf8'),
  readFile(resolve(root, 'AppScript.html'), 'utf8'),
  readFile(resolve(root, 'DiagnosticShell.html'), 'utf8'),
]);
const files = { index, appBody, appStyles, appScript };
const templateIncludes = ["include_('AppBody')", "include_('AppStyles')", "include_('AppScript')"];
const missingIncludes = templateIncludes.filter((marker) => !index.includes(marker));
if (missingIncludes.length) throw new Error(`Apps Script template is missing: ${missingIncludes.join(', ')}`);
if (!index.includes("data-request-only=\"<?= requestOnly ? 'true' : 'false' ?>\"")) {
  throw new Error('Apps Script template does not expose the server request-only flag.');
}
if (!index.includes('data-bootstrap-contract-version="<?= bootstrapContractVersion ?>"')) {
  throw new Error('Apps Script template does not expose the server bootstrap contract flag.');
}
if (index.length > 20_000) throw new Error('Apps Script Index.html must remain a small template shell.');
if (!appBody.includes('id="loading"') || !appBody.includes('id="primaryNav"')) throw new Error('AppBody.html is missing required interface markup.');
if (!appStyles.includes('.app-shell') || !appStyles.includes('.loading-overlay')) throw new Error('AppStyles.html is missing required interface styles.');
if (appBody.includes('<?') || appBody.includes('?>') || appStyles.includes('<?') || appStyles.includes('?>') || appScript.includes('<?') || appScript.includes('?>')) {
  throw new Error('Apps Script generated partials must not contain template delimiters.');
}

const bodyTags = tokenizeHtml(appBody).filter((token) => token.type === 'tag' && (token.name === 'script' || token.name === 'style'));
if (bodyTags.length) throw new Error('AppBody.html must not contain script or style elements.');
const styleSource = extractRawTextElementContent(appStyles, 'style', 'hau-app-styles');
const scriptSource = extractRawTextElementContent(appScript, 'script', 'hau-app-script');
if (/<\/style/i.test(styleSource)) throw new Error('AppStyles.html contains an unsafe closing-style sequence.');
if (/<\/script/i.test(scriptSource)) throw new Error('AppScript.html contains an unsafe closing-script sequence.');
if (!scriptSource.includes('__HAU_RUNTIME_CONFIG__') || !scriptSource.includes('__HAU_APP_SCRIPT_LOADED__')) throw new Error('AppScript.html is missing Apps Script runtime markers.');
if (!scriptSource.includes('DOMContentLoaded')) throw new Error('AppScript.html is missing the application bootstrap registration.');
new Function(scriptSource);

const assembled = assembleAppsScriptTemplate(files);
const assembledAnalysis = analyzeAssembledDocument(assembled);
if (assembledAnalysis.bodyCount !== 1 || assembledAnalysis.styleCount !== 1 || assembledAnalysis.scriptCount !== 1) {
  throw new Error(`Assembled Apps Script document has invalid executable element counts: ${JSON.stringify({ body: assembledAnalysis.bodyCount, style: assembledAnalysis.styleCount, script: assembledAnalysis.scriptCount })}`);
}
if (assembledAnalysis.suspiciousVisibleJavaScriptTokenCount !== 0) throw new Error('Assembled Apps Script document exposes JavaScript as visible body text.');
const requestOnlyAssembled = assembleAppsScriptTemplate(files, { requestOnly: true });
const requestOnlyBody = tokenizeHtml(requestOnlyAssembled).find(
  (token) => token.type === 'tag' && !token.closing && token.name === 'body',
);
if (requestOnlyBody?.attributes.get('data-request-only') !== 'true') {
  throw new Error('Assembled Apps Script request-only document lost the server request flag.');
}
if (tokenizeHtml(assembled).find((token) => token.type === 'tag' && !token.closing && token.name === 'body')?.attributes.get('data-bootstrap-contract-version') !== '2') {
  throw new Error('Assembled Apps Script document lost the v2 bootstrap contract flag.');
}
if (!diagnosticShell.includes('api_htmlDiagnosticPing') || !diagnosticShell.includes('data-inline-script')) throw new Error('DiagnosticShell.html is missing its isolated client/server checks.');

const regenerated = await createAppsScriptBundleFromProject();
for (const [name, source] of Object.entries(files)) {
  if (regenerated[name] !== source) throw new Error(`Generated Apps Script file parity failed for ${name}. Run npm run build and commit only generator output.`);
}

console.log(
  JSON.stringify(
    {
      message: 'Validated Apps Script sources, parser-safe package assembly, executable bootstrap, and deterministic generated-file parity.',
      appsScriptSourceFiles: gasFiles.length,
      requiredFunctions: requiredFunctions.length,
      generatedFiles: bundleDiagnostics(files),
    },
    null,
    2,
  ),
);
