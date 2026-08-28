import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const frontendRoot = path.join(repositoryRoot, 'src/frontend');

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:js|jsx|ts|tsx)$/u.test(entry.name) ? [target] : [];
  });
}

function source(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

describe('P19 canonical UI language', () => {
  it('removes the rejected slogan and normal-user development phrases', () => {
    const combined = sourceFiles(frontendRoot).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    for (const rejected of [
      'Every request. Every handoff. On record.',
      'Design fixture',
      'Synthetic prototype',
      'Contract evidence',
      'Server-decided access scope',
      'No backend',
      'Preview fixture',
      'Local inspection presentation',
      'Implementation-ready',
      'Route reserved · not yet built',
      'Preview-only contact',
    ]) {
      expect(combined, rejected).not.toContain(rejected);
    }
  });

  it('does not use vague standalone action labels', () => {
    const combined = sourceFiles(frontendRoot).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    expect(combined).not.toMatch(/>\s*(?:Continue|Proceed|Manage|Confirm|Save)\s*</u);
  });

  it('keeps operational routes free of infrastructure-facing success and error copy', () => {
    const operational = [
      'src/frontend/app/lending/InternalLendingHub.tsx',
      'src/frontend/app/operations/OperationalModuleRoute.tsx',
      'src/frontend/app/request/InternalRequestHub.tsx',
    ].map(source).join('\n');
    for (const rejected of [
      'Correlation ID',
      'Real backend',
      'Server review recorded',
      'Server issue recorded',
      'Server handoff recorded',
      'Worker/D1',
      'server-projected session',
    ]) {
      expect(operational, rejected).not.toContain(rejected);
    }
  });

  it('documents every required canonical writing category', () => {
    const guide = source('docs/frontend/UI_LANGUAGE_GUIDE.md');
    for (const heading of [
      '## Voice',
      '## Action labels',
      '## Statuses',
      '## Errors and recovery',
      '## Helper text',
      '## Technical terms',
      '## Playground terminology',
      '## Capitalization, dates, and numbers',
    ]) {
      expect(guide).toContain(heading);
    }
  });
});
