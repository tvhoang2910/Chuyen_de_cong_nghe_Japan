import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/system',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 120_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/system' }]],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-system',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
