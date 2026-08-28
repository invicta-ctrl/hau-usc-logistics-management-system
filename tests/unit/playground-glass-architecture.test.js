import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'u'));
  expect(match, `missing ${selector}`).not.toBeNull();
  return match[1];
}

describe('P17 restrained glass architecture', () => {
  const styles = read('src/frontend/styles/index.css');
  const theme = read('src/frontend/styles/theme.css');

  it('keeps dense record and history surfaces solid', () => {
    const ledger = rule(styles, '.command-ledger-list');
    expect(ledger).toContain('background: var(--content-surface)');
    expect(ledger).not.toContain('backdrop-filter');
    expect(styles).toMatch(
      /\.command-path-list,[\s\S]*?\.command-recon-list \{[^}]*background: var\(--content-surface\);[^}]*\}/u,
    );
    expect(rule(styles, '.command-table-page')).toContain('background: var(--background)');
    expect(rule(styles, '.command-table-page')).not.toContain('gradient');
  });

  it('uses solid semantic tokens for forms and desktop selected detail', () => {
    expect(theme).toContain('--content-surface: var(--paper-warm)');
    expect(theme).toContain('--content-surface: #242120');
    expect(read('src/frontend/app/auth/StaffSignInPage.tsx')).toContain('className={`content-surface w-full');
    expect(read('src/frontend/app/overview/ExceptionInspector.tsx')).toContain(
      'className="command-inspector"',
    );
    expect(styles).toMatch(
      /@media \(min-width: 60rem\)[\s\S]*?\.command-inspector \{[\s\S]*?background: var\(--content-surface\);[\s\S]*?backdrop-filter: none;/u,
    );
  });

  it('provides opaque fallbacks for every retained public material layer', () => {
    const retained = ['.public-nav--glass', '.nav-glass', '.hero-action--glass', '.atrium__secondary'];
    const unsupported = styles.slice(styles.indexOf('@supports not'));
    const reduced = styles.slice(styles.indexOf('@media (prefers-reduced-transparency: reduce)'));
    for (const selector of retained) {
      expect(unsupported).toContain(selector);
      expect(reduced).toContain(selector);
    }
    expect(reduced).toContain('backdrop-filter: none !important');
  });
});
