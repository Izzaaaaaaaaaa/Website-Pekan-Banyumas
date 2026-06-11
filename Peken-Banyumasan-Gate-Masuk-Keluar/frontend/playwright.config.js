import { defineConfig, devices } from '@playwright/test'

// FE-only E2E: the dev server is started automatically and all backend calls
// are stubbed in the specs, so these tests need no backend or Docker.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  // PW_SLOW=<ms> slows actions down for screen-recording; PW_VIDEO=1 makes
  // Playwright save a .webm of each test to test-results/. Both are opt-in and
  // have zero effect on normal/CI runs.
  workers: process.env.PW_SLOW ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    launchOptions: { slowMo: Number(process.env.PW_SLOW) || 0 },
    video: process.env.PW_VIDEO ? 'on' : 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
