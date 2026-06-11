import { test, expect } from '@playwright/test'

// Authenticated E2E: seed an admin session into localStorage BEFORE app scripts
// run, and stub all backend calls, so the protected admin shell renders
// deterministically without a backend.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-test-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'e2e-admin', email: 'admin@example.com', nama: 'E2E Admin',
      role: 'admin', status: 'aktif',
    }))
  })
})

test('an authenticated admin lands on the dashboard shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).not.toHaveURL(/\/login/)
  // AdminLayout renders this header for the "/" route, independent of page data.
  await expect(page.getByText('Dashboard Real-time')).toBeVisible()
})

test('the authenticated admin shell shows the seeded user name', async ({ page }) => {
  await page.goto('/')
  // AdminLayout reads the seeded user via getUser() and renders the name.
  await expect(page.getByText('E2E Admin').first()).toBeVisible()
})
