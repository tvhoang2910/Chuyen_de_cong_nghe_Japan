import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_WEB_BASE_URL || process.env.PLAYWRIGHT_SYSTEM_BASE_URL || process.env.PLAYWRIGHT_BASE_URL;
const useNgrokBypassHeader = process.env.E2E_NGROK_SKIP_WARNING !== 'false';
const extraHTTPHeaders = useNgrokBypassHeader
  ? { 'ngrok-skip-browser-warning': 'true' }
  : undefined;

export default defineConfig({
  testDir: './tests/system',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 120_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/system' }]],
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-system',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
