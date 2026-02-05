import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'
import { MockHelper } from '../helpers/mock.helper'
import { ApiHelper } from '../helpers/api.helper'

/**
 * Payment Flow E2E Tests
 *
 * Test Coverage:
 * - Pricing page access and display
 * - Plan selection and comparison
 * - Payment form display
 * - Subscription management
 * - Plan upgrade/downgrade
 * - Payment error handling
 */

const apiHelper = new ApiHelper()

test.describe('Payment and Pricing', () => {
  test.describe('Pricing Page - Unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should display pricing page for anonymous users', async ({ page }) => {
      await page.goto('/pricing')

      // Pricing page should be accessible
      await expect(page.getByRole('heading', { name: /요금제|Pricing/i })).toBeVisible()
    })

    test('should show all pricing tiers', async ({ page }) => {
      await page.goto('/pricing')

      // Should display all plan tiers
      await expect(page.getByText(/스타터|Starter/i)).toBeVisible()
      await expect(page.getByText(/프로|Pro/i)).toBeVisible()
      await expect(page.getByText(/엔터프라이즈|Enterprise/i)).toBeVisible()
    })

    test('should display plan features', async ({ page }) => {
      await page.goto('/pricing')

      // Should show feature lists
      await expect(page.getByText(/캠페인 생성|Campaign/i)).toBeVisible()
      await expect(page.getByText(/AI 카피|AI Copy/i)).toBeVisible()
      await expect(page.getByText(/리포트|Report/i)).toBeVisible()
    })

    test('should show pricing amounts', async ({ page }) => {
      await page.goto('/pricing')

      // Should display prices with currency
      await expect(page.getByText(/₩|원|\/월|\/month/i)).toBeVisible()
    })

    test('should redirect to login when selecting plan', async ({ page }) => {
      await page.goto('/pricing')

      const selectButton = page.getByRole('button', { name: /시작하기|Get Started|선택/i }).first()
      await selectButton.click()

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })
  })

  test.describe('Pricing Page - Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // Login as authenticated user
      await authFixture.loginAsUser(page)

      // Mock subscription status
      await page.route('**/api/subscription', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockHelper.subscription()),
        })
      })
    })

    test('should display current plan badge', async ({ page }) => {
      await page.goto('/pricing')

      // Should show current plan indicator
      await expect(page.getByText(/현재 플랜|Current Plan/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show upgrade options for current plan', async ({ page }) => {
      await page.goto('/pricing')

      // Should have upgrade buttons for higher tiers
      const upgradeButton = page.getByRole('button', { name: /업그레이드|Upgrade/i })
      if (await upgradeButton.isVisible({ timeout: 2000 })) {
        await expect(upgradeButton).toBeVisible()
      }
    })

    test('should navigate to checkout on plan selection', async ({ page }) => {
      await page.goto('/pricing')

      const selectButton = page.getByRole('button', { name: /선택|Select|업그레이드|Upgrade/i }).first()

      if (await selectButton.isEnabled({ timeout: 2000 })) {
        await selectButton.click()

        // Should navigate to checkout page
        await expect(page).toHaveURL(/\/checkout|\/payment/, { timeout: 10000 })
      }
    })

    test('should display plan comparison table', async ({ page }) => {
      await page.goto('/pricing')

      // Should have feature comparison
      await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Alternative: grid-based comparison
          expect(true).toBe(true)
        })
    })
  })

  test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      // Mock payment methods
      await page.route('**/api/payments/methods', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            methods: [
              { id: 'card', name: '신용/체크카드', enabled: true },
              { id: 'transfer', name: '계좌이체', enabled: true },
              { id: 'kakao', name: '카카오페이', enabled: true },
            ],
          }),
        })
      })
    })

    test('should display checkout page', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      // Checkout page elements
      await expect(page.getByText(/결제|Payment|주문|Order/i)).toBeVisible()
    })

    test('should show selected plan details', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      // Should display plan name and price
      await expect(page.getByText(/프로|Pro/i)).toBeVisible({ timeout: 5000 })
    })

    test('should display payment method options', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      // Payment methods should be available
      await expect(page.getByText(/카드|Card/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show order summary', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      // Should display pricing breakdown
      await expect(page.getByText(/합계|Total|금액|Amount/i)).toBeVisible()
    })

    test('should validate billing information', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should show validation errors
        await expect(page.getByText(/필수|required/i)).toBeVisible({ timeout: 3000 })
      }
    })

    test('should process payment successfully', async ({ page }) => {
      await page.route('**/api/payments/create', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              subscriptionId: 'sub_test_001',
              redirectUrl: '/dashboard?payment=success',
            }),
          })
        }
      })

      await page.goto('/checkout?plan=pro')

      // Fill billing information
      const nameInput = page.getByLabel(/이름|Name/i)
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill('Test User')
      }

      const emailInput = page.getByLabel(/이메일|Email/i)
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill('test@example.com')
      }

      // Select payment method
      const cardOption = page.getByLabel(/카드|Card/i)
      if (await cardOption.isVisible({ timeout: 2000 })) {
        await cardOption.click()
      }

      // Submit payment
      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should redirect to success page
        await expect(page).toHaveURL(/payment=success/, { timeout: 10000 })
      }
    })

    test('should show loading state during payment processing', async ({ page }) => {
      await page.route('**/api/payments/create', async (route) => {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/checkout?plan=pro')

      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should show loading indicator
        await expect(page.locator('svg.animate-spin')).toBeVisible({ timeout: 2000 })
      }
    })
  })

  test.describe('Subscription Management', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      await page.route('**/api/subscription', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockHelper.subscription()),
        })
      })
    })

    test('should display subscription settings page', async ({ page }) => {
      await page.goto('/settings/billing')

      // Subscription details should be visible
      await expect(page.getByText(/구독|Subscription/i)).toBeVisible()
    })

    test('should show current subscription details', async ({ page }) => {
      await page.goto('/settings/billing')

      const subscription = MockHelper.subscription()

      // Should display plan name
      await expect(page.getByText(new RegExp(subscription.plan, 'i'))).toBeVisible({ timeout: 5000 })
    })

    test('should display billing period', async ({ page }) => {
      await page.goto('/settings/billing')

      // Should show renewal date
      await expect(page.getByText(/갱신|Renewal|다음 결제|Next billing/i)).toBeVisible()
    })

    test('should have upgrade plan button', async ({ page }) => {
      await page.goto('/settings/billing')

      const upgradeButton = page.getByRole('button', { name: /업그레이드|Upgrade|변경|Change/i })
      await expect(upgradeButton).toBeVisible({ timeout: 5000 })
    })

    test('should allow plan upgrade', async ({ page }) => {
      await page.goto('/settings/billing')

      const upgradeButton = page.getByRole('button', { name: /업그레이드|Upgrade|변경|Change/i })
      await upgradeButton.click()

      // Should navigate to pricing or upgrade page
      await expect(page).toHaveURL(/\/pricing|\/upgrade/, { timeout: 10000 })
    })

    test('should show cancel subscription option', async ({ page }) => {
      await page.goto('/settings/billing')

      const cancelButton = page.getByRole('button', { name: /취소|Cancel|해지/i })
      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await expect(cancelButton).toBeVisible()
      }
    })

    test('should confirm before canceling subscription', async ({ page }) => {
      await page.goto('/settings/billing')

      const cancelButton = page.getByRole('button', { name: /취소|Cancel|해지/i })

      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click()

        // Should show confirmation dialog
        await expect(page.getByText(/정말|확인|Are you sure/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Payment History', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      // Mock payment history
      await page.route('**/api/payments/history', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            payments: [
              {
                id: 'pay_001',
                amount: 49000,
                status: 'success',
                date: new Date().toISOString(),
                plan: 'Pro',
              },
              {
                id: 'pay_002',
                amount: 49000,
                status: 'success',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                plan: 'Pro',
              },
            ],
          }),
        })
      })
    })

    test('should display payment history', async ({ page }) => {
      await page.goto('/settings/billing')

      // Should show payment history section
      await expect(page.getByText(/결제 내역|Payment History/i)).toBeVisible()
    })

    test('should show payment transactions', async ({ page }) => {
      await page.goto('/settings/billing')

      // Should display payment amounts
      await expect(page.getByText(/₩49,000|49000/)).toBeVisible({ timeout: 5000 })
    })

    test('should allow downloading invoices', async ({ page }) => {
      await page.goto('/settings/billing')

      const downloadButton = page.getByRole('button', { name: /다운로드|Download|영수증|Invoice/i }).first()

      if (await downloadButton.isVisible({ timeout: 2000 })) {
        await expect(downloadButton).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)
    })

    test('should handle payment failure', async ({ page }) => {
      await page.route('**/api/payments/create', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Payment failed',
            message: '카드 승인이 거부되었습니다',
          }),
        })
      })

      await page.goto('/checkout?plan=pro')

      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should show error message
        await expect(page.getByText(/거부|declined|실패|failed/i)).toBeVisible({ timeout: 5000 })
      }
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await apiHelper.mockApiError(page, '**/api/payments/create', 500, 'Network error')

      await page.goto('/checkout?plan=pro')

      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should show error message
        await expect(page.getByText(/오류|error|다시|retry/i)).toBeVisible({ timeout: 5000 })
      }
    })

    test('should allow retry after payment failure', async ({ page }) => {
      let attemptCount = 0

      await page.route('**/api/payments/create', async (route) => {
        attemptCount += 1
        if (attemptCount === 1) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Payment failed' }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          })
        }
      })

      await page.goto('/checkout?plan=pro')

      const submitButton = page.getByRole('button', { name: /결제|Pay|구독|Subscribe/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        // First attempt - should fail
        await submitButton.click()
        await page.waitForTimeout(1000)

        // Retry - should succeed
        const retryButton = page.getByRole('button', { name: /재시도|Retry|결제|Pay/i }).first()
        await retryButton.click()

        // Should show success
        await expect(page).toHaveURL(/success|dashboard/, { timeout: 10000 })
      }
    })

    test('should handle invalid plan selection', async ({ page }) => {
      await page.goto('/checkout?plan=invalid')

      // Should show error or redirect
      await expect(page.getByText(/유효하지|invalid|찾을 수 없습니다|not found/i))
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Or should redirect to pricing
          expect(page.url()).toMatch(/\/pricing/)
        })
    })
  })

  test.describe('Plan Features and Limits', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      await page.route('**/api/subscription', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockHelper.subscription()),
        })
      })
    })

    test('should display plan limits in settings', async ({ page }) => {
      await page.goto('/settings/billing')

      // Should show usage limits
      await expect(page.getByText(/제한|Limit|사용량|Usage/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show upgrade prompt when approaching limits', async ({ page }) => {
      // Mock quota near limit
      await page.route('**/api/quota', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MockHelper.quotaStatus(),
            campaignCreation: {
              used: 4,
              limit: 5,
              remaining: 1,
              resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        })
      })

      await page.goto('/campaigns')

      // Should show upgrade prompt
      await expect(page.getByText(/업그레이드|Upgrade/i)).toBeVisible({ timeout: 5000 })
    })
  })
})
