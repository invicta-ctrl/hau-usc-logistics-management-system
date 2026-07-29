import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { argument, isInside, repoRoot, validateExport } from './export-contract.mjs';

async function main() {
  const input = argument('--input');
  const candidateSha = argument('--candidate-sha');
  if (!input || !path.isAbsolute(input)) throw new Error('Use --input with an absolute private export path.');
  if (isInside(repoRoot, input)) throw new Error('The migration export must remain outside the repository.');
  const source = JSON.parse(await readFile(input, 'utf8'));
  const result = await validateExport(source, { candidateSha });
  if (!result.valid) {
    console.error('Migration export: INVALID');
    result.issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }
  console.log('Migration export: VALID');
  console.log(`Safe workbook label: ${source.metadata.sourceWorkbookLabel}`);
  console.log(`Snapshot hash: ${result.snapshotHash}`);
  for (const tab of result.verifiedTabs) console.log(`- ${tab.label}: ${tab.rowCount} rows; ${tab.sha256}`);
  console.log('No workbook ID or row values were printed.');
}

main().catch((error) => {
  console.error(error instanceof SyntaxError ? 'Migration export is not valid JSON.' : error.message);
  process.exitCode = 1;
});
