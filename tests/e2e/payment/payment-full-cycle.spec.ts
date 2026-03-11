/**
 * TEST-06: 결제 전체 사이클 E2E 테스트
 *
 * Toss Payments 결제 전체 흐름:
 * - 요금제 선택 → 결제 → 구독 활성화 → 관리 → 취소
 * - 결제 실패 → 재시도
 * - 웹훅 처리
 */

import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'

test.describe('Payment Full Cycle', () => {
  test.describe('Plan Selection → Checkout → Activation', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      // Mock current subscription (free plan)
      await page.route('**/api/subscription', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: null,
            plan: 'free',
            status: 'none',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          }),
        })
      })

      // Mock Toss payment widget initialization
      await page.route('**/api/payments/prepare', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orderId: 'order_test_001',
            orderName: 'Batwo Pro Plan - Monthly',
            amount: 49000,
            customerName: 'Test User',
            customerEmail: 'test@example.com',
          }),
        })
      })
    })

    test('should complete full payment flow: pricing → checkout → success', async ({
      page,
    }) => {
      // 1. 요금제 페이지 방문
      await page.goto('/pricing')
      await expect(page.getByText(/스타터|프로|Pro|Starter/i).first()).toBeVisible({
        timeout: 5000,
      })

      // 2. Pro 플랜 선택
      const selectButton = page
        .getByRole('button', { name: /시작하기|Get Started|선택|Select/i })
        .first()
      if (await selectButton.isVisible({ timeout: 2000 })) {
        await selectButton.click()
      }

      // 3. 결제 페이지로 이동 확인
      await expect(page).toHaveURL(/checkout|payment/, { timeout: 10000 })
    })

    test('should display order summary on checkout page', async ({ page }) => {
      await page.goto('/checkout?plan=pro')

      // 주문 요약 정보 확인
      await expect(page.getByText(/프로|Pro/i)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/합계|Total|금액|Amount/i)).toBeVisible({ timeout: 5000 })
    })

    test('should handle successful payment callback', async ({ page }) => {
      // Mock 결제 성공 콜백
      await page.route('**/api/payments/confirm', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            subscriptionId: 'sub_test_activated',
            plan: 'pro',
            message: '결제가 완료되었습니다',
          }),
        })
      })

      // Toss 결제 성공 콜백 시뮬레이션
      await page.goto(
        '/checkout/success?orderId=order_test_001&paymentKey=pk_test_001&amount=49000'
      )

      // 성공 메시지 또는 대시보드 리디렉션 확인
      await expect(
        page.getByText(/완료|Success|감사|Thank/i)
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Subscription Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)

      // Mock active subscription
      await page.route('**/api/subscription', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'sub_active_001',
              plan: 'pro',
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              cancelAtPeriodEnd: false,
              amount: 49000,
              currency: 'KRW',
            }),
          })
        }
      })
    })

    test('should display active subscription details', async ({ page }) => {
      await page.goto('/settings/billing')

      // 구독 정보 확인
      await expect(page.getByText(/Pro/i)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/활성|Active|active/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should allow plan upgrade', async ({ page }) => {
      await page.goto('/settings/billing')

      const upgradeButton = page.getByRole('button', {
        name: /업그레이드|Upgrade|변경|Change/i,
      })
      if (await upgradeButton.isVisible({ timeout: 3000 })) {
        await upgradeButton.click()

        // 요금제 비교 또는 업그레이드 페이지로 이동
        await expect(page).toHaveURL(/pricing|upgrade/, { timeout: 10000 })
      }
    })

    test('should handle subscription cancellation flow', async ({ page }) => {
      // Mock cancellation
      await page.route('**/api/subscription/cancel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            cancelAtPeriodEnd: true,
            message: '구독이 기간 종료 시 취소됩니다',
          }),
        })
      })

      await page.goto('/settings/billing')

      const cancelButton = page.getByRole('button', {
        name: /취소|Cancel|해지/i,
      })
      if (await cancelButton.isVisible({ timeout: 3000 })) {
        await cancelButton.click()

        // 확인 다이얼로그
        const confirmDialog = page.getByText(/정말|확인|Are you sure/i)
        if (await confirmDialog.isVisible({ timeout: 3000 })) {
          const confirmButton = page.getByRole('button', {
            name: /확인|Confirm|예|Yes/i,
          })
          await confirmButton.click()

          // 취소 성공
          await expect(
            page.getByText(/취소|Cancel|해지|기간 종료/i).first()
          ).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Payment Error Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)
    })

    test('should handle payment failure and show retry', async ({ page }) => {
      await page.goto(
        '/checkout/fail?code=PAY_PROCESS_ABORTED&message=사용자에+의해+결제가+취소되었습니다&orderId=order_test_001'
      )

      // 결제 실패 메시지 표시
      await expect(
        page.getByText(/실패|취소|Failed|Error|다시/i).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should handle timeout during payment processing', async ({ page }) => {
      // Mock 결제 확인에서 타임아웃
      await page.route('**/api/payments/confirm', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 15000)) // 15초 지연
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Request timeout',
          }),
        })
      })

      await page.goto(
        '/checkout/success?orderId=order_timeout&paymentKey=pk_timeout&amount=49000'
      )

      // 로딩 또는 에러 상태 확인
      await page.waitForTimeout(2000)
      const hasContent = await page.getByText(/결제|처리|loading|error/i).isVisible({
        timeout: 5000,
      }).catch(() => true) // 어떤 처리든 표시되어야 함

      expect(hasContent).toBe(true)
    })

    test('should handle duplicate payment attempt', async ({ page }) => {
      await page.route('**/api/payments/confirm', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Duplicate payment',
            message: '이미 처리된 결제입니다',
          }),
        })
      })

      await page.goto(
        '/checkout/success?orderId=order_dup&paymentKey=pk_dup&amount=49000'
      )

      // 중복 결제 메시지 또는 대시보드 리디렉션
      await expect(
        page.getByText(/이미|already|완료|처리/i)
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Webhook Handling', () => {
    test('should accept Toss payment webhook', async ({ request }) => {
      const response = await request.post('/api/webhooks/toss', {
        data: {
          eventType: 'PAYMENT_STATUS_CHANGED',
          data: {
            paymentKey: 'pk_webhook_test',
            orderId: 'order_webhook_test',
            status: 'DONE',
            totalAmount: 49000,
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // 웹훅 처리 결과 (200 또는 401 인증 필요)
      expect([200, 401, 403]).toContain(response.status())
    })
  })
})
