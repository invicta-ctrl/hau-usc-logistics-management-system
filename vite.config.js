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

function prioritizeDeploymentStyles(mode) {
  if (!CLOUDFLARE_BUILD_MODES.has(mode)) return undefined;

  return {
    name: 'hau-prioritize-deployment-styles',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const stylesheetPattern = /<link rel="stylesheet"[^>]*>/g;
        const stylesheets = html.match(stylesheetPattern) ?? [];
        const moduleScriptPattern = /<script type="module"[^>]*><\/script>/;
        const moduleScript = html.match(moduleScriptPattern)?.[0];
        if (!moduleScript || stylesheets.length === 0 || html.indexOf(stylesheets[0]) < html.indexOf(moduleScript)) {
          return html;
        }
        const withoutStylesheets = html.replace(stylesheetPattern, '');
        return withoutStylesheets.replace(moduleScriptPattern, `${stylesheets.join('\n    ')}\n    ${moduleScript}`);
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

export default defineConfig(async ({ mode }) => {
  const singleFileBuild = !CLOUDFLARE_BUILD_MODES.has(mode);

  return {
    root: 'src',
    base: './',
    plugins: [
      cloudflareHeroMediaChunks(mode),
      react(),
      tailwindcss(),
      singleFileBuild ? viteSingleFile() : undefined,
      prioritizeDeploymentStyles(mode),
      deployArtifactMarker(mode),
    ].filter(Boolean),
    server: { host: '127.0.0.1', proxy: await playgroundProxy() },
    preview: { host: '127.0.0.1' },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      cssCodeSplit: !singleFileBuild,
      assetsInlineLimit: singleFileBuild ? 100_000_000 : 4096,
      rollupOptions: singleFileBuild ? { output: { inlineDynamicImports: true } } : undefined,
    },
    test: {
      environment: 'node',
      include: ['../tests/**/*.test.js'],
      fileParallelism: false,
      testTimeout: 10_000,
      coverage: { reporter: ['text', 'json-summary'] },
    },
  };
});
