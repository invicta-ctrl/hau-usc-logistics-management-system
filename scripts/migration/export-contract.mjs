import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const mappingPath = path.join(repoRoot, 'migration', 'google-sheets-to-d1.v1.json');

export async function readMapping() {
  return JSON.parse(await readFile(mappingPath, 'utf8'));
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalTabRows(rows) {
  return JSON.stringify(
    rows.map((row) =>
      Object.keys(row)
        .sort()
        .map((key) => [key, row[key] ?? null]),
    ),
  );
}

export function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

export async function validateExport(source, { candidateSha = '' } = {}) {
  const mapping = await readMapping();
  const issues = [];
  if (!source || typeof source !== 'object' || Array.isArray(source)) issues.push('export must be an object');
  if (source?.schemaVersion !== mapping.schemaVersion) issues.push('schemaVersion does not match the accepted export contract');
  if (source?.metadata?.exporterVersion !== mapping.exporterVersion) issues.push('metadata.exporterVersion is unsupported');
  if (!['SYNTHETIC', 'APPROVED_REDACTED'].includes(source?.metadata?.dataClassification)) issues.push('metadata.dataClassification must be SYNTHETIC or APPROVED_REDACTED');
  for (const key of ['snapshotAt', 'sourceWorkbookLabel', 'sourceOwnerLabel', 'permittedRowsLabel', 'candidateSha']) {
    if (!String(source?.metadata?.[key] ?? '').trim()) issues.push(`metadata.${key} is required`);
  }
  if (Number.isNaN(Date.parse(source?.metadata?.snapshotAt))) issues.push('metadata.snapshotAt must be an ISO date-time');
  if (candidateSha && source?.metadata?.candidateSha !== candidateSha) issues.push('metadata.candidateSha does not match the frozen candidate');
  const excluded = new Set(source?.metadata?.excludedColumns ?? []);
  for (const column of mapping.restrictedColumns) {
    if (!excluded.has(column)) issues.push(`metadata.excludedColumns must include ${column}`);
  }
  const tabs = source?.tabs && typeof source.tabs === 'object' ? source.tabs : {};
  const tabMetadata = new Map((source?.metadata?.tabs ?? []).map((entry) => [entry.label, entry]));
  const requiredTabs = source?.metadata?.requiredTabs ?? [];
  if (!Array.isArray(requiredTabs) || requiredTabs.length === 0) issues.push('metadata.requiredTabs must identify the approved source tabs');
  for (const tab of requiredTabs) {
    if (!mapping.tabs[tab]) issues.push(`required tab ${tab} has no accepted D1 mapping`);
    if (!Array.isArray(tabs[tab])) issues.push(`required tab ${tab} is missing`);
  }
  const verifiedTabs = [];
  for (const [label, rows] of Object.entries(tabs)) {
    if (!mapping.tabs[label]) {
      issues.push(`tab ${label} has no accepted D1 mapping`);
      continue;
    }
    if (!Array.isArray(rows)) {
      issues.push(`tab ${label} must be an array`);
      continue;
    }
    const metadata = tabMetadata.get(label);
    const hash = sha256(canonicalTabRows(rows));
    if (!metadata || metadata.rowCount !== rows.length || metadata.sha256 !== hash) issues.push(`tab ${label} count or hash does not match metadata`);
    rows.forEach((row, index) => {
      for (const column of mapping.restrictedColumns) {
        if (row?.[column] !== undefined && row[column] !== null && String(row[column]).trim() !== '') {
          issues.push(`tab ${label} row ${index + 2} contains restricted column ${column}`);
        }
      }
    });
    verifiedTabs.push({ label, rowCount: rows.length, sha256: hash });
  }
  const snapshotHash = sha256(
    verifiedTabs
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((entry) => `${entry.label}:${entry.sha256}:${entry.rowCount}`)
      .join('\n'),
  );
  if (source?.metadata?.snapshotHash !== snapshotHash) issues.push('metadata.snapshotHash does not match the tab manifest');
  return { valid: issues.length === 0, issues, mapping, verifiedTabs, snapshotHash };
}
