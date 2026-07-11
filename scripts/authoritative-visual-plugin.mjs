import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const viewIds = [
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
];

export function authoritativeVisual() {
  return {
    name: 'hau-authoritative-visual',
    async transformIndexHtml(html) {
      const visualRoot = resolve(process.cwd(), 'src/visual');
      const fragments = await Promise.all([
        readFile(resolve(visualRoot, 'shell-before.html'), 'utf8'),
        ...viewIds.map((id) => readFile(resolve(visualRoot, `views/${id}.html`), 'utf8')),
        readFile(resolve(visualRoot, 'shell-after.html'), 'utf8'),
      ]);
      const marker = '<!-- AUTHORITATIVE_VISUAL -->';
      if (!html.includes(marker)) throw new Error(`Missing ${marker} in src/index.html`);
      return html.replace(marker, fragments.join('\n'));
    },
  };
}
