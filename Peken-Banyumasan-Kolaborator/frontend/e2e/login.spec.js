import { test, expect } from '@playwright/test'

// Stub every backend call with an empty success envelope so the FE renders
// deterministically without a running backend (the login page fires
// eventApi.list() on mount).
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: null, data: [] }),
    })
  )
})

test('redirects an unauthenticated visitor to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Selamat datang!' })).toBeVisible()
  await expect(page.getByPlaceholder('nama@email.com')).toBeVisible()
  await expect(page.getByRole('button', { name: /Masuk ke Dashboard/ })).toBeVisible()
})

test('shows a client-side validation error when the form is submitted empty', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /Masuk ke Dashboard/ }).click()
  await expect(page.getByText('Email dan password wajib diisi')).toBeVisible()
})

test('navigates to the register page via the "Daftar sekarang" link', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Daftar sekarang' }).click()
  await expect(page).toHaveURL(/\/register$/)
})
