import { test, expect } from '@playwright/test'

// Stub backend so the public site renders deterministically without a backend.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
})

test('navigates through every main section via the nav', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation')
  for (const item of ['ABOUT', 'PROGRAM', 'PUBLICATION', 'GALLERY', 'HOME']) {
    await nav.getByRole('link', { name: item }).click()
    await expect(nav.getByRole('link', { name: item })).toHaveAttribute('aria-current', 'page')
  }
})

test('renders the global footer landmark', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('contentinfo')).toBeVisible()
})
