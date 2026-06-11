import { test, expect } from '@playwright/test'

// Stub every backend call so the FE renders deterministically without a backend.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
})

test('redirects an unauthenticated visitor to the admin login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Masuk ke Dashboard' })).toBeVisible()
  await expect(page.getByPlaceholder('admin@pekenbanyumas.com')).toBeVisible()
  await expect(page.getByRole('button', { name: /Masuk ke Dashboard/ })).toBeVisible()
})

test('email and password are required (HTML5 validation)', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('admin@pekenbanyumas.com')).toHaveJSProperty('required', true)
  await expect(page.getByPlaceholder('••••••••')).toHaveJSProperty('required', true)
})
