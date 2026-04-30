import { defineConfig, devices } from '@playwright/test';

const localServerPort = Number(process.env.PLAYWRIGHT_LOCAL_PORT || 5173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${localServerPort}`;
const useLocalWebServer = process.env.PLAYWRIGHT_USE_LOCAL_SERVER !== 'false';

export default defineConfig({
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useLocalWebServer
    ? {
        command: `npm run dev -- --port ${localServerPort}`,
        url: `http://localhost:${localServerPort}`,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});