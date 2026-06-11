import { test, expect } from '@playwright/test'

// Stub every backend call with an empty success envelope so the public site
// renders deterministically without a running backend.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
})

test('renders the public navigation on the home page', async ({ page }) => {
  await page.goto('/')
  // Scope to the <nav> landmark — the same labels also appear in the footer.
  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('img', { name: 'Peken Banyumasan' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Buka pilihan login' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'GALLERY' })).toBeVisible()
})

test('marks a nav item as current when clicked', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation')
  await nav.getByRole('link', { name: 'ABOUT' }).click()
  await expect(nav.getByRole('link', { name: 'ABOUT' })).toHaveAttribute('aria-current', 'page')
})
