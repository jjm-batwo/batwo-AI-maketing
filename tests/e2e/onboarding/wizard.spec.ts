import { test, expect } from '@playwright/test'
import * as path from 'path'
import { MockHelper } from '../helpers/mock.helper'

/**
 * Onboarding Wizard E2E Tests
 *
 * Tests based on design document: docs/02-design/features/improvement-roadmap.design.md
 * Section 2.2.2: 온보딩 테스트 (onboarding/)
 *
 * Test Coverage:
 * - Step 1: Welcome screen
 * - Step 2: Meta account connection
 * - Step 3: Pixel setup
 * - Step 4: Completion screen
 * - Skip functionality
 * - Progress indicators
 * - Navigation (next/previous)
 */

// Use fresh storage state (auth only, no onboarding completion)
test.use({ storageState: path.join(__dirname, '../storage-state-fresh.json') })

// Helper to mock common APIs
async function mockCommonAPIs(page: import('@playwright/test').Page) {
  // Mock dashboard KPI API
  await page.route('**/api/dashboard/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: {
          totalSpend: 1000000,
          totalConversions: 50,
          averageRoas: 2.5,
          averageCtr: 1.5,
          changes: { spend: 5, conversions: 10, roas: 15, ctr: 5 },
        },
        chartData: [],
      }),
    })
  })

  // Mock campaigns API
  await page.route('**/api/campaigns**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ campaigns: [] }),
    })
  })
}

// Helper to mock authenticated session
async function mockAuthSession(page: import('@playwright/test').Page, metaConnected: boolean = false) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          ...(metaConnected && { metaAccessToken: 'mock-meta-token' }),
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    })
  })
}

test.describe('Onboarding Wizard', () => {
  test.describe('Step 1: Welcome Screen', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Wait for onboarding dialog
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
    })

    test('should display welcome screen with correct title', async ({ page }) => {
      // Verify welcome step is visible
      await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()

      // Verify progress indicator shows 1/4
      await expect(page.getByText('1/4')).toBeVisible()
    })

    test('should show feature highlights', async ({ page }) => {
      // Check for feature highlights in welcome step
      await expect(page.getByText(/실시간 성과 분석/i)).toBeVisible()
      await expect(page.getByText(/AI 최적화 추천/i)).toBeVisible()
    })

    test('should have progress bar at 25%', async ({ page }) => {
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()
      await expect(progressbar).toHaveAttribute('aria-valuenow', '1')
      await expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    })

    test('should allow navigation to next step', async ({ page }) => {
      // Click next button
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)

      // Should be on Meta connect step
      await expect(page.getByText(/Meta 광고 계정 연결/i)).toBeVisible()
      await expect(page.getByText('2/4')).toBeVisible()
    })

    test('should allow skipping from welcome step', async ({ page }) => {
      // Click skip button
      await page.getByRole('button', { name: /건너뛰기/i }).click()

      // Onboarding should be dismissed
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should not show previous button on first step', async ({ page }) => {
      // Previous button should not be visible on step 1
      await expect(page.getByRole('button', { name: /이전/i })).not.toBeVisible()
    })
  })

  test.describe('Step 2: Meta Account Connection', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Wait for dialog and navigate to step 2
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
    })

    test('should display Meta connect step', async ({ page }) => {
      await expect(page.getByText(/Meta 광고 계정 연결/i)).toBeVisible()
      await expect(page.getByText('2/4')).toBeVisible()
    })

    test('should show connect button when Meta is not connected', async ({ page }) => {
      // Should show connect button
      await expect(page.getByRole('link', { name: /Meta 계정 연결하기/i })).toBeVisible()
    })

    test('should show why connect section', async ({ page }) => {
      // Should show permissions explanation
      await expect(page.getByText(/왜 Meta 연결이 필요한가요/i)).toBeVisible()
      await expect(page.getByText(/광고 데이터 읽기/i)).toBeVisible()
      await expect(page.getByText(/광고 관리/i)).toBeVisible()
    })

    test('should navigate back to welcome step', async ({ page }) => {
      // Click previous button
      await page.getByRole('button', { name: /이전/i }).click()

      // Should be on welcome step
      await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()
      await expect(page.getByText('1/4')).toBeVisible()
    })

    test('should navigate to pixel setup step', async ({ page }) => {
      // Click next button
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)

      // Should be on pixel setup step
      await expect(page.getByText(/Meta 픽셀을 설치하여/i)).toBeVisible()
      await expect(page.getByText('3/4')).toBeVisible()
    })

    test('should have progress bar at 50%', async ({ page }) => {
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()
      await expect(progressbar).toHaveAttribute('aria-valuenow', '2')
      await expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    })
  })

  test.describe('Step 2: Meta Connected State', () => {
    test.beforeEach(async ({ page }) => {
      // Mock with Meta connected
      await mockAuthSession(page, true)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Navigate to step 2
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
    })

    test('should show connected status when Meta is connected', async ({ page }) => {
      // Should show connected badge
      await expect(page.getByText(/연결됨/i)).toBeVisible()
      await expect(page.getByText(/다음 단계로 진행해주세요/i)).toBeVisible()
    })

    test('should not show connect button when Meta is connected', async ({ page }) => {
      // Connect button should not be visible
      await expect(page.getByRole('link', { name: /Meta 계정 연결하기/i })).not.toBeVisible()
    })
  })

  test.describe('Step 3: Pixel Setup', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page, true)

      // Mock pixels API
      await page.route('**/api/pixel', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 'pixel-1',
                  metaPixelId: '123456789012345',
                  name: 'Test Pixel 1',
                  isActive: true,
                  setupMethod: 'MANUAL',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 'pixel-2',
                  metaPixelId: '987654321098765',
                  name: 'Test Pixel 2',
                  isActive: true,
                  setupMethod: 'MANUAL',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            }),
          })
        }
      })

      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Navigate to step 3
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
    })

    test('should display pixel setup step', async ({ page }) => {
      await expect(page.getByText(/Meta 픽셀을 설치하여/i)).toBeVisible()
      await expect(page.getByText('3/4')).toBeVisible()
    })

    test('should show pixel selector', async ({ page }) => {
      // Wait for pixels to load
      await expect(page.getByText('Test Pixel 1')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Test Pixel 2')).toBeVisible()
    })

    test('should show pixel benefits', async ({ page }) => {
      await expect(page.getByText(/픽셀 설치 효과/i)).toBeVisible()
      await expect(page.getByText(/웹사이트 방문자 행동 추적/i)).toBeVisible()
      await expect(page.getByText(/전환 이벤트 측정/i)).toBeVisible()
    })

    test('should show skip message', async ({ page }) => {
      await expect(page.getByText(/나중에 설정에서도 가능합니다/i)).toBeVisible()
    })

    test('should navigate back to Meta connect step', async ({ page }) => {
      await page.getByRole('button', { name: /이전/i }).click()

      await expect(page.getByText(/Meta 광고 계정 연결/i)).toBeVisible()
      await expect(page.getByText('2/4')).toBeVisible()
    })

    test('should navigate to completion step', async ({ page }) => {
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)

      await expect(page.getByText(/설정이 완료되었습니다/i)).toBeVisible()
      await expect(page.getByText('4/4')).toBeVisible()
    })

    test('should have progress bar at 75%', async ({ page }) => {
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()
      await expect(progressbar).toHaveAttribute('aria-valuenow', '3')
      await expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    })

    test('should allow pixel selection', async ({ page }) => {
      // Wait for and click on pixel
      await expect(page.getByText('Test Pixel 1')).toBeVisible({ timeout: 10000 })
      await page.getByText('Test Pixel 1').click()

      // Should show selected state
      await expect(page.getByText(/선택됨/i)).toBeVisible()
    })
  })

  test.describe('Step 3: Without Meta Connection', () => {
    test.beforeEach(async ({ page }) => {
      // Mock without Meta token
      await mockAuthSession(page, false)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Navigate to step 3
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
    })

    test('should show warning when Meta is not connected', async ({ page }) => {
      await expect(page.getByText(/먼저 Meta 계정을 연결해주세요/i)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Step 4: Completion', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page, true)

      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        })
      })

      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      // Navigate to step 4
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })

      // Navigate through all steps
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /다음/i }).click()
        await page.waitForTimeout(500)
      }
    })

    test('should display completion step', async ({ page }) => {
      await expect(page.getByText(/설정이 완료되었습니다/i)).toBeVisible()
      await expect(page.getByText('4/4')).toBeVisible()
    })

    test('should show next steps information', async ({ page }) => {
      await expect(page.getByText(/다음 단계/i)).toBeVisible()
      await expect(page.getByText(/첫 캠페인 만들기/i)).toBeVisible()
      await expect(page.getByText(/대시보드에서 성과 확인/i)).toBeVisible()
    })

    test('should have progress bar at 100%', async ({ page }) => {
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()
      await expect(progressbar).toHaveAttribute('aria-valuenow', '4')
      await expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    })

    test('should show start button instead of next button', async ({ page }) => {
      // On last step, button should say "시작하기"
      await expect(page.getByRole('button', { name: /시작하기/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /^다음$/i })).not.toBeVisible()
    })

    test('should navigate back to pixel setup', async ({ page }) => {
      await page.getByRole('button', { name: /이전/i }).click()

      await expect(page.getByText(/Meta 픽셀을 설치하여/i)).toBeVisible()
      await expect(page.getByText('3/4')).toBeVisible()
    })

    test('should complete onboarding when clicking start button', async ({ page }) => {
      await page.getByRole('button', { name: /시작하기/i }).click()

      // Dialog should be dismissed
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Skip Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
    })

    test('should allow skipping from any step', async ({ page }) => {
      // Test skipping from step 1
      let skipButton = page.getByRole('button', { name: /건너뛰기/i })
      await expect(skipButton).toBeVisible()

      // Navigate to step 2
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(skipButton).toBeVisible()

      // Navigate to step 3
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(skipButton).toBeVisible()
    })

    test('should dismiss dialog when skipping', async ({ page }) => {
      await page.getByRole('button', { name: /건너뛰기/i }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    })

    test('should persist skip state in localStorage', async ({ page }) => {
      await page.getByRole('button', { name: /건너뛰기/i }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Dialog should not reappear
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Progress Indicators', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page, true)

      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        })
      })

      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
    })

    test('should show correct step numbers', async ({ page }) => {
      // Step 1
      await expect(page.getByText('1/4')).toBeVisible()

      // Step 2
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(page.getByText('2/4')).toBeVisible()

      // Step 3
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(page.getByText('3/4')).toBeVisible()

      // Step 4
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(page.getByText('4/4')).toBeVisible()
    })

    test('should update progress bar correctly', async ({ page }) => {
      const progressbar = page.getByRole('progressbar')

      // Step 1: 25%
      await expect(progressbar).toHaveAttribute('aria-valuenow', '1')

      // Step 2: 50%
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(progressbar).toHaveAttribute('aria-valuenow', '2')

      // Step 3: 75%
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(progressbar).toHaveAttribute('aria-valuenow', '3')

      // Step 4: 100%
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await expect(progressbar).toHaveAttribute('aria-valuenow', '4')
    })

    test('should show correct step titles', async ({ page }) => {
      const stepTitles = [
        /시작하기/i,
        /Meta 계정 연결/i,
        /픽셀 설정/i,
        /완료/i,
      ]

      for (let i = 0; i < stepTitles.length; i++) {
        await expect(page.getByText(stepTitles[i])).toBeVisible()

        if (i < stepTitles.length - 1) {
          await page.getByRole('button', { name: /다음/i }).click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page, true)

      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        })
      })

      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
    })

    test('should complete full forward navigation', async ({ page }) => {
      // Navigate through all steps forward
      for (let step = 1; step <= 4; step++) {
        await expect(page.getByText(`${step}/4`)).toBeVisible()

        if (step < 4) {
          await page.getByRole('button', { name: /다음/i }).click()
          await page.waitForTimeout(500)
        }
      }

      // Should be on completion step
      await expect(page.getByText(/설정이 완료되었습니다/i)).toBeVisible()
    })

    test('should complete full backward navigation', async ({ page }) => {
      // Navigate to last step
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /다음/i }).click()
        await page.waitForTimeout(500)
      }

      await expect(page.getByText('4/4')).toBeVisible()

      // Navigate back through all steps
      for (let step = 4; step > 1; step--) {
        await expect(page.getByText(`${step}/4`)).toBeVisible()
        await page.getByRole('button', { name: /이전/i }).click()
        await page.waitForTimeout(500)
      }

      // Should be on welcome step
      await expect(page.getByText('1/4')).toBeVisible()
      await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()
    })

    test('should maintain state when navigating back and forth', async ({ page }) => {
      // Go forward 2 steps
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)

      await expect(page.getByText('3/4')).toBeVisible()

      // Go back 1 step
      await page.getByRole('button', { name: /이전/i }).click()
      await page.waitForTimeout(500)

      await expect(page.getByText('2/4')).toBeVisible()

      // Go forward 1 step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.waitForTimeout(500)

      await expect(page.getByText('3/4')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthSession(page)
      await mockCommonAPIs(page)
      await page.goto('/dashboard')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15000 })
    })

    test('should have proper ARIA labels', async ({ page }) => {
      const dialog = page.getByRole('dialog')
      await expect(dialog).toHaveAttribute('role', 'dialog')

      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toHaveAttribute('aria-valuenow')
      await expect(progressbar).toHaveAttribute('aria-valuemin')
      await expect(progressbar).toHaveAttribute('aria-valuemax')
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab to next button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Press Enter to go to next step
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      await expect(page.getByText('2/4')).toBeVisible()
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for dialog title (h2)
      const title = page.getByRole('heading', { level: 2 })
      await expect(title).toBeVisible()
    })
  })
})
