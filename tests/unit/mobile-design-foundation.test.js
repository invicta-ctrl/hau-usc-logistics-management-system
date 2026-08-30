import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CASCADE_LAYERS,
  FOUNDATION_TOKENS,
  STRUCTURAL_WIDTHS,
  TYPOGRAPHY_ROLES,
} from '../../scripts/design/foundation-source.mjs';
import { THEME_FAMILIES } from '../../src/frontend/app/theme/themeContract';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFile(resolve(root, path), 'utf8');

describe('MFR-002 U02 mobile-first design foundation', () => {
  it('defines one semantic typography contract instead of blessing route literals', async () => {
    const css = await source('src/frontend/styles/foundation.css');
    expect(Object.keys(TYPOGRAPHY_ROLES)).toEqual([
      'display',
      'editorial',
      'page-title',
      'section-title',
      'record-title',
      'body',
      'compact-body',
      'label',
      'caption',
      'numeric',
      'mono-reference',
    ]);

    for (const role of Object.keys(TYPOGRAPHY_ROLES)) {
      for (const property of ['family', 'size', 'line', 'weight', 'tracking']) {
        expect(css, `${role} ${property}`).toContain(`--type-${role}-${property}:`);
      }
      expect(css).toContain(`.type-${role} {`);
    }
    expect(css).toContain('font-variant-numeric: tabular-nums lining-nums');
  });

  it('emits the complete shared token and cascade contract from its source', async () => {
    const [css, theme, applicationStyles, main, packageJson] = await Promise.all([
      source('src/frontend/styles/foundation.css'),
      source('src/frontend/styles/theme.css'),
      source('src/frontend/styles/index.css'),
      source('src/frontend/main.jsx'),
      source('package.json').then(JSON.parse),
    ]);

    expect(css).toContain(`@layer ${CASCADE_LAYERS.join(', ')};`);
    for (const [name, value] of Object.entries(FOUNDATION_TOKENS)) {
      expect(css, name).toContain(`--${name}: ${value};`);
    }
    expect(packageJson.scripts['design:foundation:check']).toBe(
      'node scripts/design/build-frontend-foundation.mjs --check',
    );
    expect(packageJson.scripts.build).toContain('design:foundation:check');
    for (const retiredThemeToken of ['--space-2xs:', '--dur-response:', '--z-modal:', '--radius:']) {
      expect(theme, `${retiredThemeToken} has one authority`).not.toContain(retiredThemeToken);
    }
    expect(css).toContain('--radius: var(--radius-surface)');
    expect(css).toContain('--z-base: var(--z-content)');
    expect(applicationStyles.match(/@import '\.\/foundation\.css';/gu)).toHaveLength(1);
    expect(applicationStyles.match(/@import '\.\/atrium-motion\.css';/gu)).toHaveLength(1);
    expect(main).not.toContain("import './styles/atrium-motion.css'");
  });

  it('provides safe-area, dynamic-viewport, container-query, and touch primitives', async () => {
    const css = await source('src/frontend/styles/foundation.css');

    expect(css).toContain('env(safe-area-inset-bottom, 0px)');
    expect(css).toContain('@supports (height: 100dvh)');
    expect(css).toContain('--viewport-block: 100dvh');
    expect(css).toContain('container-type: inline-size');
    expect(css).toContain('@container hau-layout (min-width: 42rem)');
    expect(css).toContain('min-block-size: var(--control-hit-area-min)');
    expect(css).toContain('padding-inline-start: max(');
  });

  it('preserves motion choice, visible focus, and forced-color operation', async () => {
    const css = await source('src/frontend/styles/foundation.css');

    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('--motion-duration-context: 0.01ms');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('outline: 2px solid Highlight !important');
    expect(css).toContain('border-color: CanvasText');
  });

  it('keeps the exact five-width matrix and all twelve family/mode selectors', async () => {
    const [config, theme] = await Promise.all([
      source('playwright.frontend.config.js'),
      source('src/frontend/styles/theme.css'),
    ]);

    expect(STRUCTURAL_WIDTHS).toEqual([320, 390, 768, 1024, 1440]);
    expect(config).toContain(`const widths = [${STRUCTURAL_WIDTHS.join(', ')}];`);
    for (const family of THEME_FAMILIES) {
      expect(theme).toContain(`:root[data-theme-family='${family}']`);
      expect(theme).toContain(`:root.dark[data-theme-family='${family}']`);
    }
  });
});
