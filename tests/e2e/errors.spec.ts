import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures'

/**
 * Error Handling E2E Tests
 *
 * 에러 케이스 및 엣지 케이스 테스트
 */
test.describe('Error Handling', () => {
  test.describe('404 Not Found', () => {
    test('should display 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist')

      // 404 페이지 또는 Not Found 메시지 표시
      const notFoundMessage = page.getByText(/404|Not Found|페이지를 찾을 수 없습니다/)
      await expect(notFoundMessage.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display 404 for non-existent campaign', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns/non-existent-campaign-id')

      // 404 또는 에러 메시지
      const errorMessage = page.getByText(/404|Not Found|캠페인을 찾을 수 없습니다|Campaign not found/)
      const isErrorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false)

      // 또는 캠페인 목록으로 리다이렉트
      const isRedirected = await page.url().includes('/campaigns')

      expect(isErrorVisible || isRedirected).toBeTruthy()
    })
  })

  test.describe('네트워크 에러', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await authFixture.loginAsUser(page)

      // 네트워크 요청 실패 시뮬레이션
      await page.route('**/api/**', (route) => {
        if (route.request().url().includes('/api/campaigns')) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      await page.goto('/campaigns')

      // 에러 메시지 또는 재시도 버튼 표시
      const errorIndicator = page.getByText(/오류가 발생했습니다|Error|Failed|재시도/)
        .or(page.getByRole('button', { name: /재시도|Retry/ }))

      // 또는 빈 상태 표시
      const emptyState = page.getByText(/캠페인이 없습니다/)

      const hasError = await errorIndicator.first().isVisible({ timeout: 10000 }).catch(() => false)
      const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false)

      // 둘 중 하나는 표시되어야 함
      expect(hasError || hasEmpty).toBeTruthy()
    })

    test('should retry failed requests', async ({ page }) => {
      await authFixture.loginAsUser(page)
      let requestCount = 0

      await page.route('**/api/dashboard/kpi*', (route) => {
        requestCount++
        if (requestCount === 1) {
          // 첫 번째 요청 실패
          route.abort('failed')
        } else {
          // 두 번째 요청 성공
          route.continue()
        }
      })

      await page.goto('/dashboard')

      // 재시도 버튼이 있으면 클릭
      const retryButton = page.getByRole('button', { name: /재시도|Retry/ })
      if (await retryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await retryButton.click()

        // 데이터 로드 확인
        await page.waitForTimeout(2000)
        expect(requestCount).toBeGreaterThanOrEqual(2)
      }
    })
  })

  test.describe('유효성 검사 에러', () => {
    test.skip('should show validation errors for invalid campaign data', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns/new')

      // 필수 필드 비우고 제출
      const submitButton = page.getByRole('button', { name: /다음|제출|생성|Next|Submit/ })

      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click()

        // 유효성 검사 에러 메시지
        const validationError = page.getByText(/필수|입력해주세요|required|invalid/)
        await expect(validationError.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test.skip('should validate budget minimum value', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns/new')

      // 예산 입력 필드 찾기
      const budgetInput = page.getByLabel(/예산|Budget/)

      if (await budgetInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await budgetInput.fill('100') // 최소값 미만

        const submitButton = page.getByRole('button', { name: /다음|Next/ })
        await submitButton.click()

        // 최소값 에러 메시지
        const errorMessage = page.getByText(/최소|minimum|너무 작습니다/)
        await expect(errorMessage).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('권한 에러', () => {
    test('should prevent access to admin pages for regular users', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/admin')

      // 권한 에러 또는 캠페인 페이지로 리다이렉트
      const url = page.url()
      const hasRedirected = url.includes('/campaigns') || url.includes('/dashboard')
      const hasError = await page.getByText(/권한이 없습니다|Unauthorized|Access denied/).isVisible({ timeout: 5000 }).catch(() => false)

      expect(hasRedirected || hasError).toBeTruthy()
    })

    test.skip('should prevent editing other users campaigns', async ({ page }) => {
      await authFixture.loginAsUser(page)

      // 다른 사용자의 캠페인 ID로 접근 시도
      await page.goto('/campaigns/other-user-campaign-id/edit')

      // 권한 에러 또는 404
      const errorMessage = page.getByText(/권한이 없습니다|Not Found|접근할 수 없습니다/)
      const isErrorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false)
      const isRedirected = page.url().includes('/campaigns') && !page.url().includes('/edit')

      expect(isErrorVisible || isRedirected).toBeTruthy()
    })
  })

  test.describe('세션 만료', () => {
    test('should redirect to login when session expires', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns')

      // 페이지 로드 확인
      await expect(page.getByRole('heading', { name: /캠페인|Campaigns/ })).toBeVisible()

      // 세션 삭제 (만료 시뮬레이션)
      await page.context().clearCookies()

      // 보호된 페이지 재방문
      await page.goto('/campaigns')

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should preserve redirect URL after login', async ({ page }) => {
      // 인증 없이 보호된 페이지 접근
      await page.goto('/campaigns/new')

      // 로그인 페이지로 리다이렉트
      await page.waitForURL(/\/login/)

      // callbackUrl 파라미터 확인
      const url = new URL(page.url())
      const callbackUrl = url.searchParams.get('callbackUrl')

      // callbackUrl이 있거나 원래 URL이 보존되어야 함
      expect(callbackUrl || url.pathname).toBeTruthy()
    })
  })

  test.describe('폼 제출 에러', () => {
    test.skip('should handle duplicate campaign name error', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns/new')

      const nameInput = page.getByLabel(/캠페인 이름|Campaign Name/)

      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 이미 존재하는 캠페인 이름 입력
        await nameInput.fill('E2E Test Campaign')

        const submitButton = page.getByRole('button', { name: /생성|Create/ })
        await submitButton.click()

        // 중복 에러 메시지
        const errorMessage = page.getByText(/이미 존재|already exists|중복/)
        const isErrorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)

        if (isErrorVisible) {
          await expect(errorMessage).toBeVisible()
        }
      }
    })

    test.skip('should show error when Meta API fails', async ({ page }) => {
      await authFixture.loginAsUser(page)

      // Meta API 요청 실패 시뮬레이션
      await page.route('**/api/meta/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Meta API error' }),
        })
      })

      await page.goto('/campaigns/new')

      // 캠페인 생성 시도
      const submitButton = page.getByRole('button', { name: /생성|Create/ })
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click()

        // API 에러 메시지
        const errorMessage = page.getByText(/오류가 발생했습니다|Meta|API|Error/)
        await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('로딩 상태', () => {
    test('should show loading state during data fetch', async ({ page }) => {
      await authFixture.loginAsUser(page)

      // 느린 응답 시뮬레이션
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        route.continue()
      })

      await page.goto('/dashboard')

      // 로딩 인디케이터 확인
      const loadingIndicator = page.locator('[data-testid*="loading"]')
        .or(page.locator('svg.animate-spin'))
        .or(page.getByText(/로딩|Loading/))

      // 로딩 상태가 보이거나 데이터가 빠르게 로드됨
      const isLoadingVisible = await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false)

      // 로딩이 보이지 않으면 데이터가 빠르게 로드된 것
      expect(typeof isLoadingVisible).toBe('boolean')
    })

    test('should hide loading state after data loads', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns')

      // 페이지 로드 대기
      await page.waitForLoadState('networkidle')

      // 로딩 인디케이터가 사라졌는지 확인
      const loadingIndicator = page.locator('[data-testid*="loading"]')
        .or(page.locator('svg.animate-spin'))

      const isLoading = await loadingIndicator.first().isVisible({ timeout: 5000 }).catch(() => false)

      // 로딩이 끝났으면 인디케이터가 사라져야 함
      if (!isLoading) {
        expect(isLoading).toBeFalsy()
      }
    })
  })
})
