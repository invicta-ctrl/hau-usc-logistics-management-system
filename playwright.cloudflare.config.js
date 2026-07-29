import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/cloudflare-e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787',
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/start-local-worker-acceptance.mjs',
    url: 'http://127.0.0.1:8787/api/health',
    reuseExistingServer: process.env.HAU_CLOUDFLARE_REUSE_SERVER === '1',
    timeout: 60_000,
  },
});
