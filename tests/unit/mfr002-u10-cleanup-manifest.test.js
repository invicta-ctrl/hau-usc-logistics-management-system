import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const manifestPath = resolve(root, '.codex/MFR002_U10_CLEANUP_ARCHIVE_MANIFEST.md');

describe('MFR-002 U10 cleanup preservation manifest', () => {
  it('classifies every production dependency and records a zero-deletion decision', () => {
    const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    const manifest = readFileSync(manifestPath, 'utf8');

    expect(Object.keys(packageJson.dependencies).sort()).toEqual(['lucide-react', 'react', 'react-dom']);
    for (const dependency of Object.keys(packageJson.dependencies)) {
      expect(manifest).toMatch(new RegExp(`\\|\\s+\`${dependency}\`\\s+\\|\\s+\`PRODUCTION_USED\``, 'u'));
    }
    expect(manifest).toContain('DEPENDENCY_REMOVAL: ZERO');
    expect(manifest).toContain('SCRIPT_REMOVAL: ZERO');
    expect(manifest).toContain('DOCUMENT_DELETION_OR_MOVE: ZERO');
    expect(manifest).toContain('UNKNOWN_DELETION: ZERO');
    expect(manifest).toContain('FONT_BINARY_COUNT: ZERO');
  });

  it('preserves referenced historical pointers and confirms named loose-source candidates are absent', () => {
    for (const path of [
      '.codex/IMPECCABLE_V2_CURRENT.md',
      '.codex/IMPECCABLE_V3_CURRENT.md',
      '.codex/IMPECCABLE_V4_CURRENT.md',
      '.codex/V0_4_2_FRONTEND_CURRENT.md',
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(true);
    }
    for (const path of [
      'SDD Implementation Review.txt',
      'Project Status Summary PDF.txt',
      'Lending Center Fixes.txt',
      'AGENTS(3).md',
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(false);
    }
  });
});
