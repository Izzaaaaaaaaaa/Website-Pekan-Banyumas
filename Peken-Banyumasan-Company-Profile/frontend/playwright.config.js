import { defineConfig, devices } from '@playwright/test'

// FE-only E2E. Served via `vite preview` (the dev server has open:true which
// would pop a browser tab each run). All backend calls are stubbed in the
// specs, so no backend/Docker is required and runs are deterministic.
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
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    launchOptions: { slowMo: Number(process.env.PW_SLOW) || 0 },
    video: process.env.PW_VIDEO ? 'on' : 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Use the Vite dev server (fast, reliable teardown). PW_TEST suppresses
    // the config's auto-open so no browser tab pops during the run.
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { PW_TEST: '1' },
  },
})
