import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Default testDir — overridden per project
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { open: 'never', outputFolder: 'tests/report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // ── Performance tests ──
    {
      name: 'perf-desktop',
      testDir: './tests/performance',
      workers: 1, // Sequential for consistent perf measurements
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'perf-mobile',
      testDir: './tests/performance',
      workers: 1,
      use: {
        ...devices['Pixel 5'],
      },
    },
    // ── E2E functional tests ──
    // workers: 1 to reduce API rate-limit pressure (backend: 300 req/15min anon)
    {
      name: 'e2e-desktop',
      testDir: './tests/e2e',
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'e2e-mobile',
      testDir: './tests/e2e',
      fullyParallel: false,
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'e2e-mobile-small',
      testDir: './tests/e2e',
      fullyParallel: false,
      use: {
        ...devices['iPhone SE'],
      },
    },
  ],
});
