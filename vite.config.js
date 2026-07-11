import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { authoritativeVisual } from './scripts/authoritative-visual-plugin.mjs';

function standaloneClassicScript() {
  return {
    name: 'hau-standalone-classic-script',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || typeof html.source !== 'string') return;
      html.source = html.source.replace(/<script type="module" crossorigin>/g, '<script>');
    },
  };
}

export default defineConfig({
  root: 'src',
  base: './',
  plugins: [authoritativeVisual(), viteSingleFile(), standaloneClassicScript()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.js'],
    coverage: { reporter: ['text', 'json-summary'] },
  },
});
