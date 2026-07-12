import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredFiles = [
  'Code.gs','Config.gs','Auth.gs','Router.gs','IdService.gs','Validation.gs','SheetRepository.gs',
  'ItemRepository.gs','RequestService.gs','InventoryService.gs','ReservationService.gs','LendingService.gs',
  'ReleaseService.gs','RestockService.gs','ProcurementService.gs','CanvassService.gs','EvidenceService.gs',
  'DriveService.gs','AuditService.gs','MigrationService.gs','BackupService.gs','ErrorService.gs','Setup.gs',
  'appsscript.json','Index.html',
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
console.log(`Validated ${gasFiles.length} Apps Script source files and ${requiredFunctions.length} required functions.`);

