import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APPEARANCE,
  THEME_FAMILIES,
  THEME_FAMILY_LABELS,
  THEME_MODES,
  isThemeFamily,
  isThemeMode,
} from '../../src/frontend/app/theme/themeContract';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFile(resolve(root, path), 'utf8');

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('P18 six-theme appearance contract', () => {
  it('defines the accepted six families, independent modes, and institutional default', () => {
    expect(THEME_FAMILIES).toEqual([
      'HAU_INSTITUTIONAL',
      'ANGELITE_IVORY',
      'MIDNIGHT_LEDGER',
      'EMERALD_OPERATIONS',
      'COBALT_SIGNAL',
      'GRAPHITE_COPPER',
    ]);
    expect(THEME_MODES).toEqual(['LIGHT', 'DARK', 'SYSTEM']);
    expect(DEFAULT_APPEARANCE).toEqual({ family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' });
    expect(Object.keys(THEME_FAMILY_LABELS)).toEqual([...THEME_FAMILIES]);
    expect(isThemeFamily('COBALT_SIGNAL')).toBe(true);
    expect(isThemeFamily('UNKNOWN')).toBe(false);
    expect(isThemeMode('DARK')).toBe(true);
    expect(isThemeMode('AUTO')).toBe(false);
  });

  it('defines every semantic role for every family in Light and Dark', async () => {
    const css = await source('src/frontend/styles/theme.css');
    const roles = [
      'page',
      'nav',
      'nav-text',
      'surface',
      'surface-muted',
      'surface-raised',
      'glass',
      'glass-strong',
      'primary',
      'primary-text',
      'accent',
      'accent-text',
      'text',
      'text-muted',
      'border',
      'focus',
      'selection',
      'table',
      'input',
      'success',
      'warning',
      'danger',
      'info',
      'unavailable',
      'pending',
    ];

    for (const family of THEME_FAMILIES) {
      for (const selector of [
        `:root[data-theme-family='${family}']`,
        `:root.dark[data-theme-family='${family}']`,
      ]) {
        const start = css.indexOf(selector);
        expect(start, selector).toBeGreaterThanOrEqual(0);
        const block = css.slice(start, css.indexOf('}', start));
        for (const role of roles) expect(block, `${selector} --theme-${role}`).toContain(`--theme-${role}:`);
      }
    }
  });

  it('persists family and mode separately through browser and reset-restored metadata contracts', async () => {
    const hook = await source('src/frontend/app/hooks/useTheme.ts');
    const repository = await source('src/server/d1/profile-repository.js');
    const profile = await source('src/frontend/app/profile/ProfileRoute.tsx');

    expect(hook).toContain("localStorage.setItem('hau-usc-theme-family', appearance.family)");
    expect(hook).toContain("localStorage.setItem('hau-usc-theme', appearance.mode.toLowerCase())");
    expect(repository).toContain('profile.appearance.family.${id}');
    expect(repository).toContain('profile.appearance.${id}');
    expect(profile).toContain('aria-label="Theme family"');
    expect(profile).toContain('aria-label="Display mode"');
  });

  it('keeps primary reading, navigation, action, and accent pairs at WCAG AA text contrast', async () => {
    const css = await source('src/frontend/styles/theme.css');
    for (const family of THEME_FAMILIES) {
      for (const selector of [
        `:root[data-theme-family='${family}']`,
        `:root.dark[data-theme-family='${family}']`,
      ]) {
        const start = css.indexOf(selector);
        const block = css.slice(start, css.indexOf('}', start));
        const value = (role) => block.match(new RegExp(`--theme-${role}:\\s*(#[0-9a-f]{6})`, 'iu'))?.[1];
        for (const [foreground, background] of [
          ['text', 'page'],
          ['text', 'surface'],
          ['nav-text', 'nav'],
          ['primary-text', 'primary'],
          ['accent-text', 'accent'],
        ]) {
          expect(contrast(value(foreground), value(background)), `${selector} ${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('routes authenticated shell chrome through semantic theme tokens', async () => {
    const shell = await Promise.all([
      source('src/frontend/app/shell/AuthenticatedShell.tsx'),
      source('src/frontend/app/shell/AuthShellSidebar.tsx'),
      source('src/frontend/app/shell/AuthShellTopbar.tsx'),
      source('src/frontend/app/shell/AuthMobileDrawer.tsx'),
      source('src/frontend/app/shell/SidebarNavItem.tsx'),
    ]).then((files) => files.join('\n'));

    for (const literal of ['#40070a', '#e8b93c', '#faeecb', 'rgba(250,238,203', 'rgba(242,209,92']) {
      expect(shell).not.toContain(literal);
    }
    expect(shell).toContain('var(--sidebar)');
    expect(shell).toContain('var(--sidebar-primary)');
    expect(shell).toContain('var(--theme-surface-raised)');
  });
});
