import { mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argument, canonicalTabRows, isInside, readMapping, repoRoot, sha256 } from './export-contract.mjs';

async function main() {
  const output = argument('--output');
  const candidateSha = argument('--candidate-sha') || 'LOCAL_UNFROZEN';
  if (!output || !path.isAbsolute(output)) {
    throw new Error('Use --output with an absolute path outside the repository.');
  }
  if (isInside(repoRoot, output)) {
    throw new Error('The synthetic export must remain outside the repository.');
  }
  await mkdir(path.dirname(output), { recursive: true });
  const destination = path.join(await realpath(path.dirname(output)), path.basename(output));
  const mapping = await readMapping();
  const snapshotAt = '2026-07-22T00:00:00.000Z';
  const tabs = {
    '01_ITEM_MASTER': [
      {
        Item_ID: 'ITM-MIG-001',
        Item_Name: 'Synthetic Migration Tote',
        Aliases: 'Migration Tote|Synthetic Tote',
        Category: 'Synthetic',
        Stock_Area: 'Office Inventory',
        Handling: 'REUSABLE_ASSET',
        Unit: 'piece',
        Opening_Qty: 5,
        Status: 'ACTIVE',
        Catalog_Type: 'OFFICE_INVENTORY',
        Storage_Location: 'Synthetic Migration Shelf',
        Reorder_Threshold: 1,
        Lending_Audience: 'USC_STAFF_ONLY',
        Default_Loan_Days: 3,
        Maximum_Loan_Qty: 2,
        Approval_Required: true,
        Updated_At: snapshotAt,
        Updated_By: 'SYNTHETIC-EXPORT',
        Notes: 'Fictional local migration fixture.',
      },
    ],
    '13_EVENTS': [
      {
        Event_ID: 'EVT-MIG-001',
        Event_Series_ID: 'SER-MIG-001',
        Series_Code: 'MIG',
        Event_Series_Name: 'Synthetic Migration Series',
        Event_Name: 'Synthetic Migration Event',
        Start_At: '2026-08-03T08:00:00+08:00',
        End_At: '2026-08-03T17:00:00+08:00',
        Venue: 'Synthetic Venue',
        Owner_Committee: 'COM_INVENTORY_PANTRY',
        Department: 'Department of Logistics',
        Status: 'ACTIVE',
        Created_At: snapshotAt,
        Updated_At: snapshotAt,
        External_Reference: 'SYNTHETIC-MIGRATION',
        Active: true,
      },
    ],
  };
  const manifest = Object.entries(tabs)
    .map(([label, rows]) => ({ label, rowCount: rows.length, sha256: sha256(canonicalTabRows(rows)) }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const snapshotHash = sha256(
    manifest.map((entry) => `${entry.label}:${entry.sha256}:${entry.rowCount}`).join('\n'),
  );
  const value = {
    schemaVersion: mapping.schemaVersion,
    metadata: {
      exporterVersion: mapping.exporterVersion,
      snapshotAt,
      snapshotHash,
      sourceWorkbookLabel: 'Synthetic local migration workbook',
      sourceOwnerLabel: 'Synthetic local operator',
      permittedRowsLabel: 'Two fictional local rows only',
      candidateSha,
      dataClassification: 'SYNTHETIC',
      requiredTabs: Object.keys(tabs),
      excludedColumns: mapping.restrictedColumns,
      tabs: manifest,
    },
    tabs,
  };
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Synthetic migration export created outside the repository.');
  console.log(`Snapshot hash: ${snapshotHash}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
