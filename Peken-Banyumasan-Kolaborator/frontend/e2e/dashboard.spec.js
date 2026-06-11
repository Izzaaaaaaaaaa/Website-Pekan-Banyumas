import { test, expect } from '@playwright/test'

// Authenticated E2E: seed an aktif kolaborator session into localStorage BEFORE
// app scripts run, and stub all backend calls, so the protected dashboard shell
// renders deterministically without a backend.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
})

function seedSession(page, status) {
  return page.addInitScript((st) => {
    localStorage.setItem('token', 'e2e-test-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'e2e-kolab', email: 'e2e@example.com', nama: 'E2E Kolaborator',
      role: 'kolaborator', status: st,
    }))
  }, status)
}

test('an aktif kolaborator reaches the dashboard shell', async ({ page }) => {
  await seedSession(page, 'aktif')
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/)
  // The authenticated shell shows the seeded user's name (sidebar + hero).
  await expect(page.getByText('E2E Kolaborator').first()).toBeVisible()
})

test('a pending account is bounced from /dashboard to /status', async ({ page }) => {
  await seedSession(page, 'pending')
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/status/)
})
