import { defineConfig } from '@playwright/test';

const baseURL = process.env.HAU_STAGING_BASE_URL;

if (!baseURL) throw new Error('HAU_STAGING_BASE_URL is required for Phase 23 acceptance.');

const target = new URL(baseURL);
if (target.protocol !== 'https:') throw new Error('Phase 23 acceptance requires an HTTPS staging URL.');

export default defineConfig({
  testDir: './tests/staging-e2e',
  testMatch: 'phase23-acceptance.spec.js',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: target.origin,
    browserName: 'chromium',
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
});
