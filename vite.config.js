import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './scripts/playground-proxy-guard.mjs';

const CLOUDFLARE_BUILD_MODES = new Set(['staging', 'production']);
const DEPLOY_ARTIFACT_MARKER_NAME = 'hau-deploy-target';
const HERO_MEDIA_SUFFIX = '/frontend/assets/hero/hausc-institutional-logistics-hero.mp4';
const HERO_MEDIA_CHUNK_BYTES = 20_000_000;

function cloudflareHeroMediaChunks(mode) {
  if (!CLOUDFLARE_BUILD_MODES.has(mode)) return undefined;

  return {
    name: 'hau-cloudflare-hero-media-chunks',
    enforce: 'pre',
    load(id) {
      const normalizedId = id.replaceAll('\\', '/').split('?', 1)[0];
      if (!normalizedId.endsWith(HERO_MEDIA_SUFFIX)) return undefined;

      const media = readFileSync(normalizedId);
      const references = [];
      for (let offset = 0, index = 0; offset < media.length; offset += HERO_MEDIA_CHUNK_BYTES, index += 1) {
        references.push(
          this.emitFile({
            type: 'asset',
            fileName: `hero/hausc-institutional-logistics-hero.mp4.part${index}`,
            source: media.subarray(offset, Math.min(offset + HERO_MEDIA_CHUNK_BYTES, media.length)),
          }),
        );
      }

      return `export default [${references
        .map((reference) => `import.meta.ROLLUP_FILE_URL_${reference}`)
        .join(',')}];`;
    },
  };
}

function deployArtifactMarker(mode) {
  const normalizedMode = String(mode ?? '')
    .trim()
    .toLowerCase();
  if (!CLOUDFLARE_BUILD_MODES.has(normalizedMode)) return undefined;

  return {
    name: 'hau-deploy-artifact-marker',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'meta',
            attrs: { name: DEPLOY_ARTIFACT_MARKER_NAME, content: normalizedMode },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

async function playgroundProxy() {
  const configured = String(process.env.HAU_PLAYGROUND_PROXY_ORIGIN ?? '').trim();
  if (!configured) return undefined;
  const target = parsePlaygroundOrigin(configured);
  await verifyPlaygroundOrigin(target);
  const options = () => ({
    target: target.origin,
    changeOrigin: true,
    secure: true,
    configure(proxy) {
      proxy.on('proxyReq', (request) => {
        request.setHeader('origin', target.origin);
        request.setHeader('referer', `${target.origin}/`);
      });
    },
  });
  return { '/api': options(), '/brand': options(), '/media': options() };
}

export default defineConfig(async ({ mode }) => ({
  root: 'src',
  base: './',
  plugins: [
    cloudflareHeroMediaChunks(mode),
    react(),
    tailwindcss(),
    viteSingleFile(),
    deployArtifactMarker(mode),
  ].filter(Boolean),
  server: { host: '127.0.0.1', proxy: await playgroundProxy() },
  preview: { host: '127.0.0.1' },
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
    fileParallelism: false,
    testTimeout: 10_000,
    coverage: { reporter: ['text', 'json-summary'] },
  },
}));
