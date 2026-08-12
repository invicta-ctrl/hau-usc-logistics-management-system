import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findInlineScriptElements } from '../../scripts/inline-script-elements.mjs';

const artifactPaths = ['dist/index.html', 'HAU-USC_Logistics-Prototype-Shareable.html'];
const requiredV5Markers = [
  '<div id="app"></div>',
  'HAU-USC Logistics',
  '__HAU_V5_INTEGRATION__',
  'public.request-intake',
  'public.lending-intake',
  'request.queue',
  'inventory.catalog',
  'Isolated Staging Playground',
];

describe('V5 distribution verifier', () => {
  it('recognizes forgiving browser forms of script closing tags', () => {
    const scripts = findInlineScriptElements(
      '<script>first()</script foo="ignored"><script data-runtime="v5">second()</SCRIPT\t\n bar>',
    );

    expect(scripts.map((match) => match[1])).toEqual(['first()', 'second()']);
  });

  it('does not treat similarly named elements as scripts', () => {
    expect(findInlineScriptElements('<script-template>notScript()</script-template>')).toEqual([]);
  });

  it('keeps generated preview artifacts canonical and byte-identical', () => {
    const artifacts = artifactPaths.map((path) => ({ path, bytes: readFileSync(path) }));

    expect(artifacts[1].bytes.equals(artifacts[0].bytes)).toBe(true);
    for (const { path, bytes } of artifacts) {
      const html = bytes.toString('utf8');
      expect(bytes.includes(0x0d), `${path} contains a CR byte`).toBe(false);
      expect(html, `${path} contains trailing whitespace`).not.toMatch(/[^\S\n]+$/mu);
      for (const marker of requiredV5Markers) expect(html, path).toContain(marker);
    }
  });
});
