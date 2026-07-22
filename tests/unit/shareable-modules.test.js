import { describe, expect, it } from 'vitest';
import { createModuleShareable } from '../../scripts/create-shareable.mjs';
import { shareableModules } from '../../scripts/shareable-module-registry.mjs';

const fixture = `<!doctype html>
<html lang="en">
<head><title>HAU-USC Logistics</title></head>
<body>
<button class="active" data-view="overview">Overview</button>
<button data-view="request">Request</button>
<h1 id="pageTitle">Operations Overview</h1>
<section id="overview" class="view active">Overview</section>
<section id="request" class="view">Request</section>${'  '}
</body>
</html>`;

describe('shareable module registry', () => {
  it('defines seven ordered modules with unique portable filenames', () => {
    expect(shareableModules).toHaveLength(7);
    expect(shareableModules.map(({ order }) => order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(shareableModules.map(({ id }) => id)).size).toBe(7);
    expect(new Set(shareableModules.map(({ filename }) => filename)).size).toBe(7);
    for (const module of shareableModules) {
      expect(module.filename).toMatch(/^hau-usc-logistics-0[1-7]-[a-z0-9-]+-shareable\.html$/);
    }
  });
});

describe('createModuleShareable', () => {
  it('creates an offline entry point that opens on the selected module', () => {
    const moduleHtml = createModuleShareable(fixture, {
      id: 'request',
      title: 'Request Center',
    });

    expect(moduleHtml).toContain('<html lang="en" data-shareable-module="request">');
    expect(moduleHtml).toContain('<body data-default-view="request">');
    expect(moduleHtml).toContain('<title>HAU-USC Logistics - Request Center</title>');
    expect(moduleHtml).toContain('<button class="active" data-view="request">');
    expect(moduleHtml).toContain('<section id="request" class="view active">');
    expect(moduleHtml).toContain('<h1 id="pageTitle">Request Center</h1>');
    expect(moduleHtml).not.toContain('<section id="overview" class="view active">');
    expect(moduleHtml).not.toMatch(/[ \t]+$/m);
  });

  it('fails closed when the expected authoritative shell markers drift', () => {
    expect(() =>
      createModuleShareable(fixture.replace('<body>', '<body class="changed">'), {
        id: 'request',
        title: 'Request Center',
      }),
    ).toThrow(/missing body element/i);
  });
});
