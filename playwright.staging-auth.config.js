import { defineConfig } from '@playwright/test';

const baseURL = process.env.HAU_STAGING_BASE_URL;

if (!baseURL) {
  throw new Error('HAU_STAGING_BASE_URL is required for the deployed staging auth smoke test.');
}

const parsedBaseUrl = new URL(baseURL);
if (parsedBaseUrl.protocol !== 'https:') {
  throw new Error('The deployed staging auth smoke test requires an HTTPS base URL.');
}

export default defineConfig({
  testDir: './tests/staging-e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: parsedBaseUrl.origin,
    browserName: 'chromium',
    viewport: { width: 1366, height: 900 },
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
});
