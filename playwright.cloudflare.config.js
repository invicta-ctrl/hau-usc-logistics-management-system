import { defineConfig } from '@playwright/test';
import { localWorkerBaseUrl, resolveLocalWorkerPort } from './scripts/local-worker-port.mjs';

const localWorkerPort = resolveLocalWorkerPort();
const localWorkerBaseURL = localWorkerBaseUrl(localWorkerPort);

export default defineConfig({
  testDir: './tests/cloudflare-e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.HAU_CLOUDFLARE_BASE_URL || localWorkerBaseURL,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/start-local-worker-acceptance.mjs',
    url: `${localWorkerBaseURL}/api/health`,
    reuseExistingServer: process.env.HAU_CLOUDFLARE_REUSE_SERVER === '1',
    // A fresh local D1 seed applies all 32 migrations before Wrangler listens.
    // Keep reuse opt-in, but allow the measured cold-start path enough headroom.
    timeout: 300_000,
  },
});
