import { describe, expect, it } from 'vitest';
import {
  assertGuidedDemoShareable,
  createGuidedDemoShareable,
  guidedDemoSteps,
} from '../../scripts/guided-demo.mjs';
import { shareableModules } from '../../scripts/shareable-module-registry.mjs';

const fixture = `<!doctype html>
<html lang="en">
<head><title>HAU-USC Logistics</title></head>
<body><main id="app"></main></body>
</html>`;

describe('guided demo shareable', () => {
  it('tracks every authoritative module in the same order', () => {
    expect(guidedDemoSteps.map(({ id }) => id)).toEqual(shareableModules.map(({ id }) => id));
    for (const step of guidedDemoSteps) {
      expect(step.purpose.length).toBeGreaterThan(30);
      expect(step.highlights).toHaveLength(3);
    }
  });

  it('adds a self-contained accessible tour without an external dependency', () => {
    const html = createGuidedDemoShareable(fixture);
    expect(html).toContain('data-guided-demo="true"');
    expect(html).toContain('<title>HAU-USC Logistics - Guided Demo</title>');
    expect(html).toContain('id="demoGuideLauncher"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('prefers-reduced-motion');
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/[ \t]+$/m);
  });

  it('fails closed when the authoritative shell markers drift', () => {
    expect(() => createGuidedDemoShareable(fixture.replace('</head>', ''))).toThrow(
      /missing head closing tag/i,
    );
  });

  it('rejects a stale or hand-edited generated artifact', () => {
    const html = createGuidedDemoShareable(fixture);
    expect(() => assertGuidedDemoShareable(fixture, html)).not.toThrow();
    expect(() => assertGuidedDemoShareable(fixture, html.replace('Guided demo', 'Edited demo'))).toThrow(
      /does not match the deterministic output/i,
    );
  });
});
