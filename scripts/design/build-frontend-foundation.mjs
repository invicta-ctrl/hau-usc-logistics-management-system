#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CASCADE_LAYERS,
  FOUNDATION_TOKENS,
  STRUCTURAL_WIDTHS,
  TYPOGRAPHY_ROLES,
} from './foundation-source.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputPath = resolve(repositoryRoot, 'src/frontend/styles/foundation.css');
const checkOnly = process.argv.includes('--check');

const declarations = Object.entries(FOUNDATION_TOKENS)
  .map(([name, value]) => `    --${name}: ${value};`)
  .join('\n');

const typographyTokens = Object.entries(TYPOGRAPHY_ROLES)
  .flatMap(([role, values]) => [
    `    --type-${role}-family: ${values.family};`,
    `    --type-${role}-size: ${values.size};`,
    `    --type-${role}-line: ${values.lineHeight};`,
    `    --type-${role}-weight: ${values.weight};`,
    `    --type-${role}-tracking: ${values.tracking};`,
  ])
  .join('\n');

const typographyUtilities = Object.keys(TYPOGRAPHY_ROLES)
  .map(
    (role) => `  .type-${role} {
    font-family: var(--type-${role}-family);
    font-size: var(--type-${role}-size);
    font-weight: var(--type-${role}-weight);
    letter-spacing: var(--type-${role}-tracking);
    line-height: var(--type-${role}-line);
  }`,
  )
  .join('\n\n');

const css = `/* HAU-USC Logistics — generated mobile-first design foundation.
 *
 * Source: scripts/design/foundation-source.mjs
 * Accepted structural widths: ${STRUCTURAL_WIDTHS.join(' / ')} CSS px
 * Run: npm run design:foundation
 */

@layer ${CASCADE_LAYERS.join(', ')};

@layer tokens {
  :root {
${declarations}
${typographyTokens}

    /* Compatibility aliases for accepted pre-U02 shared styles. */
    --dur-response: var(--motion-duration-feedback);
    --dur-state: var(--motion-duration-state);
    --dur-surface: var(--motion-duration-surface);
    --dur-narrative: var(--motion-duration-context);
    --ease-out: var(--motion-ease-enter);
    --ease-in: var(--motion-ease-exit);
    --ease-in-out: var(--motion-ease-standard);
    --radius: var(--radius-surface);
    --z-base: var(--z-content);
  }

  @supports (height: 100dvh) {
    :root {
      --viewport-block: 100dvh;
    }
  }
}

@layer base {
  html {
    scrollbar-gutter: stable;
    text-size-adjust: 100%;
  }

  body {
    min-block-size: var(--viewport-block);
    font-family: var(--type-body-family);
    font-size: var(--type-body-size);
    font-weight: var(--type-body-weight);
    line-height: var(--type-body-line);
  }

  :where(a, button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])):focus-visible {
    outline: 2px solid var(--theme-focus, var(--ring));
    outline-offset: 3px;
  }
}

@layer layout {
  .layout-container {
    inline-size: 100%;
    max-inline-size: var(--content-workbench);
    margin-inline: auto;
    padding-inline-start: max(var(--space-page-inline), var(--safe-area-left));
    padding-inline-end: max(var(--space-page-inline), var(--safe-area-right));
  }

  .layout-query {
    container-name: hau-layout;
    container-type: inline-size;
    min-inline-size: 0;
  }

  .layout-query-grid {
    display: grid;
    gap: var(--space-stack-gap);
    min-inline-size: 0;
  }

  @container hau-layout (min-width: 42rem) {
    .layout-query-grid {
      grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.42fr);
      gap: var(--space-section-gap);
    }
  }
}

@layer components {
  .control-target {
    min-block-size: var(--control-hit-area-min);
    min-inline-size: var(--control-hit-area-min);
    border-radius: var(--radius-control);
  }

  .surface-content {
    border: 1px solid var(--border-subtle-role);
    border-radius: var(--radius-surface);
    background: var(--surface-content);
    box-shadow: var(--elevation-content);
  }

  .surface-raised {
    border: 1px solid var(--border-subtle-role);
    border-radius: var(--radius-overlay);
    background: var(--surface-raised);
    box-shadow: var(--elevation-raised);
  }
}

@layer utilities {
${typographyUtilities}

  .type-numeric {
    font-variant-numeric: tabular-nums lining-nums;
  }

  .type-mono-reference {
    overflow-wrap: anywhere;
  }

  .safe-area-block {
    padding-block-start: max(var(--space-page-block), var(--safe-area-top));
    padding-block-end: max(var(--space-page-block), var(--safe-area-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  @layer tokens {
    :root {
      --motion-duration-feedback: 0.01ms;
      --motion-duration-state: 0.01ms;
      --motion-duration-surface: 0.01ms;
      --motion-duration-context: 0.01ms;
    }
  }

  @layer base {
    html:focus-within {
      scroll-behavior: auto;
    }
  }
}

@media (forced-colors: active) {
  @layer base {
    :where(a, button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])):focus-visible {
      outline: 2px solid Highlight !important;
      outline-offset: 3px;
      forced-color-adjust: auto;
    }
  }

  @layer components {
    .surface-content,
    .surface-raised {
      border-color: CanvasText;
      box-shadow: none;
      forced-color-adjust: auto;
    }
  }
}
`;

if (checkOnly) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== css) {
    process.stderr.write('frontend foundation is stale — run: npm run design:foundation\n');
    process.exit(1);
  }
  process.stdout.write('frontend foundation is current\n');
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, css);
  process.stdout.write(`wrote ${relative(repositoryRoot, outputPath)}\n`);
}
