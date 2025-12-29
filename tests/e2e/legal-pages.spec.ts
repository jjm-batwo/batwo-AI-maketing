/**
 * 🔴 RED Phase: Legal Pages E2E Tests
 *
 * These tests verify legal page navigation and accessibility.
 */

import { test, expect } from '@playwright/test'

test.describe('Legal Pages', () => {
  test('should navigate to terms page from footer', async ({ page }) => {
    await page.goto('/')

    // Find and click the terms link in footer
    const termsLink = page.getByRole('link', { name: /이용약관/i })
    await termsLink.click()

    // Should be on terms page
    await expect(page).toHaveURL('/terms')
    await expect(page.getByRole('heading', { name: /이용약관/i })).toBeVisible()
  })

  test('should navigate to privacy page from footer', async ({ page }) => {
    await page.goto('/')

    // Find and click the privacy link in footer
    const privacyLink = page.getByRole('link', { name: /개인정보/i })
    await privacyLink.click()

    // Should be on privacy page
    await expect(page).toHaveURL('/privacy')
    await expect(
      page.getByRole('heading', { name: '개인정보처리방침', exact: true, level: 1 })
    ).toBeVisible()
  })

  test('terms page should be accessible', async ({ page }) => {
    await page.goto('/terms')

    // Page should load without errors
    await expect(page.locator('main')).toBeVisible()

    // Should have proper heading structure
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })

  test('privacy page should be accessible', async ({ page }) => {
    await page.goto('/privacy')

    // Page should load without errors
    await expect(page.locator('main')).toBeVisible()

    // Should have proper heading structure
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })

  test('legal pages should have navigation back to home', async ({ page }) => {
    await page.goto('/terms')

    const homeLink = page.getByRole('link', { name: /홈|바투/i })
    await expect(homeLink).toBeVisible()
  })

  test('legal pages should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/terms')

    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: /이용약관/i })).toBeVisible()
  })
})
