#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outputArgument = process.argv.find((argument) => argument.startsWith('--output='));
const outputPath = path.resolve(root, outputArgument?.slice('--output='.length) || '.codex/evidence/P25_THEME_ACCESSIBILITY_AUDIT.json');
const themeCss = await readFile(path.join(root, 'src/frontend/styles/theme.css'), 'utf8');
const indexCss = await readFile(path.join(root, 'src/frontend/styles/index.css'), 'utf8');

const families = [
  'HAU_INSTITUTIONAL',
  'ANGELITE_IVORY',
  'MIDNIGHT_LEDGER',
  'EMERALD_OPERATIONS',
  'COBALT_SIGNAL',
  'GRAPHITE_COPPER',
];

function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = themeCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'u'));
  if (!match) throw new Error(`Missing theme block: ${selector}`);
  return Object.fromEntries(
    [...match[1].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/giu)].map((entry) => [entry[1], entry[2].trim()]),
  );
}

function rgb(hex) {
  const match = String(hex).match(/^#([0-9a-f]{6})$/iu);
  if (!match) throw new Error(`Expected an opaque six-digit colour, received ${hex}`);
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

const textPairs = [
  ['text', 'page'],
  ['text', 'surface'],
  ['text', 'table'],
  ['text', 'input'],
  ['text-muted', 'page'],
  ['nav-text', 'nav'],
  ['primary-text', 'primary'],
  ['accent-text', 'accent'],
  ['success', 'surface'],
  ['warning', 'surface'],
  ['danger', 'surface'],
  ['info', 'surface'],
  ['unavailable', 'surface'],
  ['pending', 'surface'],
];
const nonTextPairs = [
  ['focus', 'page'],
  ['focus', 'surface'],
  ['border', 'page'],
  ['border', 'input'],
];

const palettes = [];
const failures = [];
for (const family of families) {
  for (const dark of [false, true]) {
    const selector = `:root${dark ? '.dark' : ''}[data-theme-family='${family}']`;
    const values = declarations(selector);
    const checks = [
      ...textPairs.map(([foreground, background]) => ({
        foreground,
        background,
        minimum: 4.5,
        ratio: contrast(values[`theme-${foreground}`], values[`theme-${background}`]),
      })),
      ...nonTextPairs.map(([foreground, background]) => ({
        foreground,
        background,
        minimum: 3,
        ratio: contrast(values[`theme-${foreground}`], values[`theme-${background}`]),
      })),
    ].map((check) => ({ ...check, ratio: Number(check.ratio.toFixed(3)), pass: check.ratio >= check.minimum }));
    for (const check of checks.filter(({ pass }) => !pass)) failures.push({ family, mode: dark ? 'DARK' : 'LIGHT', ...check });
    palettes.push({ family, mode: dark ? 'DARK' : 'LIGHT', selector, checks });
  }
}

const operationalRules = [...indexCss.matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map((match) => ({
  selectors: match[1].split(',').map((selector) => selector.trim()),
  declarations: match[2],
}));
const rowSelector = /(?:^|[\s>+~])(?:tr|td|th|tbody|\[role=['"]?row['"]?\])(?:$|[\s.:#>+~[])/iu;
const fallbackChecks = {
  unsupportedBackdropFilter: /@supports\s+not\s+\(\(backdrop-filter:[\s\S]*?\.public-nav--glass[\s\S]*?background:/u.test(indexCss),
  reducedTransparency: /@media\s+\(prefers-reduced-transparency:\s*reduce\)[\s\S]*?backdrop-filter:\s*none\s*!important/u.test(indexCss),
  reducedMotion: /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms\s*!important/u.test(indexCss),
  noTableRowBackdropRule: !operationalRules.some(
    (rule) => rule.selectors.some((selector) => rowSelector.test(selector)) && /backdrop-filter\s*:/iu.test(rule.declarations),
  ),
};
for (const [name, pass] of Object.entries(fallbackChecks)) {
  if (!pass) failures.push({ contract: name, pass });
}

const evidence = {
  schemaVersion: 1,
  phase: 'P25',
  generatedAt: new Date().toISOString(),
  source: {
    themeCss: 'src/frontend/styles/theme.css',
    operationalCss: 'src/frontend/styles/index.css',
  },
  coverage: {
    families: families.length,
    explicitPalettes: palettes.length,
    systemResolutions: 'SYSTEM resolves to the same audited Light or Dark palette through prefers-color-scheme.',
    textPairsPerPalette: textPairs.length,
    nonTextPairsPerPalette: nonTextPairs.length,
  },
  fallbackChecks,
  palettes,
  failures,
  pass: failures.length === 0,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`P25 theme audit: ${evidence.pass ? 'PASS' : 'FAIL'}; ${palettes.length} palettes; ${failures.length} failures.`);
console.log(`Evidence: ${path.relative(root, outputPath)}`);
if (!evidence.pass) process.exitCode = 1;
