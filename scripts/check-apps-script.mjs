import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredFiles = [
  'Code.gs','Config.gs','Auth.gs','Router.gs','IdService.gs','Validation.gs','SheetRepository.gs',
  'ItemRepository.gs','RequestService.gs','InventoryService.gs','ReservationService.gs','LendingService.gs',
  'ReleaseService.gs','RestockService.gs','ProcurementService.gs','CanvassService.gs','EvidenceService.gs',
  'DriveService.gs','AuditService.gs','MigrationService.gs','BackupService.gs','ErrorService.gs','Setup.gs',
  'appsscript.json','Index.html','AppBody.html','AppStyles.html','AppScript.html',
];
const requiredFunctions = [
  'setupDatabase','validateDatabaseSchema','setupDriveFolders','validateDriveConfiguration','setupTimeTriggers',
  'seedRolesAndPermissions','runMigrationDryRun','applyApprovedMigration','createLaunchBackup','runReconciliation','healthCheck',
  'api_getBootstrapData','api_submitRequest','api_reviewRequest','api_confirmRelease','api_uploadEvidence',
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

const [index, body, styles, script] = await Promise.all([
  readFile(resolve(root, 'Index.html'), 'utf8'),
  readFile(resolve(root, 'AppBody.html'), 'utf8'),
  readFile(resolve(root, 'AppStyles.html'), 'utf8'),
  readFile(resolve(root, 'AppScript.html'), 'utf8'),
]);
const templateIncludes = ["include_('AppBody')", "include_('AppStyles')", "include_('AppScript')"];
const missingIncludes = templateIncludes.filter((marker) => !index.includes(marker));
if (missingIncludes.length) throw new Error(`Apps Script template is missing: ${missingIncludes.join(', ')}`);
if (index.length > 20_000) throw new Error('Apps Script Index.html must remain a small template shell.');
if (!body.includes('id="loading"') || !body.includes('id="primaryNav"')) throw new Error('AppBody.html is missing required interface markup.');
if (!styles.includes('.app-shell') || !styles.includes('.loading-overlay')) throw new Error('AppStyles.html is missing required interface styles.');
if (!script.includes('__HAU_RUNTIME_CONFIG__') || !script.includes('DOMContentLoaded')) throw new Error('AppScript.html is missing runtime configuration or bootstrap code.');

console.log(`Validated ${gasFiles.length} Apps Script source files, ${requiredFunctions.length} required functions, and split web-app bundle partials.`);
