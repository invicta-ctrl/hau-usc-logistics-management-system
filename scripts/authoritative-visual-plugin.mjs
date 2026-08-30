import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { legacyVisualViewIds } from './legacy-visual-view-registry.mjs';

export function authoritativeVisual() {
  return {
    name: 'hau-authoritative-visual',
    async transformIndexHtml(html) {
      const visualRoot = resolve(process.cwd(), 'src/visual');
      const fragments = await Promise.all([
        readFile(resolve(visualRoot, 'shell-before.html'), 'utf8'),
        ...legacyVisualViewIds.map((id) => readFile(resolve(visualRoot, `views/${id}.html`), 'utf8')),
        readFile(resolve(visualRoot, 'views/reference-admin.html'), 'utf8'),
        readFile(resolve(visualRoot, 'shell-after.html'), 'utf8'),
      ]);
      const marker = '<!-- AUTHORITATIVE_VISUAL -->';
      if (!html.includes(marker)) throw new Error(`Missing ${marker} in src/index.html`);
      const assembled = fragments
        .join('\n')
        .replace(
          '</nav>',
          '<button data-admin-view="referenceAdmin" hidden><span class="nav-icon">⚙</span><span class="nav-copy">Reference Administration<small>Controlled data and access</small></span></button></nav>',
        );
      return html.replace(marker, assembled);
    },
  };
}
