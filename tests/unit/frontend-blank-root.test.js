import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(path, 'utf8');

describe('Playground root mount remains fail-open when motion cannot advance', () => {
  it('mounts the public app synchronously without waiting for session or version bootstrap', () => {
    const html = read('src/index.html');
    const main = read('src/frontend/main.jsx');
    const renderer = read('src/frontend/app/AppRouteRenderer.tsx');

    expect(html).toContain('<div id="app"></div>');
    expect(html).toContain('<script type="module" src="./frontend/main.jsx"></script>');
    expect(main).toContain('if (previewGateRequested) {');
    expect(main).toContain('await loadFrontendVersion().catch(() => undefined);');
    expect(main).toContain('createRoot(appRoot).render(');
    expect(renderer).toContain('<LandingPage onNavigate={navigate}');
  });

  it('keeps critical landing copy visible by default and limits opacity zero to the running keyframe', () => {
    const css = read('src/frontend/styles/index.css');
    const reveal = css.match(/\.atrium__reveal\s*\{(?<body>[\s\S]*?)\}/u)?.groups?.body ?? '';
    const keyframes = css.match(/@keyframes atrium-enter\s*\{(?<body>[\s\S]*?)\n\}/u)?.groups?.body ?? '';

    expect(reveal).toContain('opacity: 1');
    expect(reveal).toContain('transform: none');
    expect(reveal).not.toContain('opacity: 0');
    expect(keyframes).toMatch(/from\s*\{\s*opacity:\s*0;\s*transform:\s*translateY\(8px\);\s*\}/u);
    expect(keyframes).toMatch(/to\s*\{\s*opacity:\s*1;\s*transform:\s*none;\s*\}/u);
  });
});
