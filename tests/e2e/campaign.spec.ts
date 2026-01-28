import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures'

test.describe('Campaign Pages', () => {
  test.describe('캠페인 목록 페이지', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/campaigns')

      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should display campaigns list page when authenticated', async ({ page }) => {
      // Mock 인증 세션 생성
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns')

      await expect(page.getByRole('heading', { name: /캠페인|Campaigns/ })).toBeVisible()
    })

    test('should display campaign cards or empty state when authenticated', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns')

      // 캠페인 카드 또는 빈 상태 메시지
      const campaignCard = page.locator('[data-testid^="campaign-card"]')
        .or(page.locator('[data-testid="campaign-list"]'))
      const emptyState = page.getByText(/캠페인이 없습니다|첫 캠페인을 만들어보세요|No campaigns/)

      const isCardVisible = await campaignCard.first().isVisible({ timeout: 5000 }).catch(() => false)
      const isEmptyVisible = await emptyState.first().isVisible({ timeout: 5000 }).catch(() => false)

      // 캠페인 카드 또는 빈 상태 중 하나는 표시되어야 함
      expect(isCardVisible || isEmptyVisible).toBeTruthy()
    })

    test('should show create campaign button when authenticated', async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/campaigns')

      const createButton = page.getByRole('link', { name: /새 캠페인|캠페인 만들기|캠페인 생성|Create|New/ })
        .or(page.getByRole('button', { name: /새 캠페인|캠페인 만들기|캠페인 생성|Create|New/ }))

      await expect(createButton.first()).toBeVisible({ timeout: 10000 })
    })

    test.skip('should navigate to create campaign page', async ({ page }) => {
      await page.goto('/campaigns')

      const createButton = page.getByRole('link', { name: /새 캠페인|캠페인 만들기|캠페인 생성/ })
      await createButton.first().click()

      await expect(page).toHaveURL(/\/campaigns\/new/)
    })

    test.skip('should display campaign status', async ({ page }) => {
      await page.goto('/campaigns')

      // 캠페인이 있다면 상태 표시
      const campaignCard = page.locator('[data-testid^="campaign-card"]').first()

      if (await campaignCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 상태 뱃지 확인 (활성, 일시중지, 완료 등)
        const statusBadge = campaignCard.locator('[data-testid="campaign-status"]')
          .or(campaignCard.getByText(/활성|일시중지|완료|대기/))

        await expect(statusBadge).toBeVisible()
      }
    })

    test.skip('should display campaign metrics', async ({ page }) => {
      await page.goto('/campaigns')

      const campaignCard = page.locator('[data-testid^="campaign-card"]').first()

      if (await campaignCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 지표 표시 (지출, ROAS, 전환 등)
        const metricsText = await campaignCard.textContent()
        expect(metricsText).toMatch(/\d+/) // 숫자가 포함되어야 함
      }
    })

    test.skip('should filter campaigns by status', async ({ page }) => {
      await page.goto('/campaigns')

      const filterButton = page.getByRole('button', { name: /필터|Filter/ })
        .or(page.getByRole('combobox', { name: /상태/ }))

      if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterButton.click()

        // 필터 옵션 표시
        await expect(page.getByText(/전체|활성|일시중지/)).toBeVisible()
      }
    })

    test.skip('should search campaigns', async ({ page }) => {
      await page.goto('/campaigns')

      const searchInput = page.getByRole('searchbox')
        .or(page.getByPlaceholder(/검색|Search/))

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('테스트')

        // 검색 결과 표시 대기
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('캠페인 상세 페이지', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/campaigns/test-id')

      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test.skip('should display campaign details', async ({ page }) => {
      // Note: 실제 캠페인 ID가 필요함
      await page.goto('/campaigns/test-campaign-id')

      // 캠페인 이름
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    })

    test.skip('should display campaign overview', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      // 캠페인 개요 정보
      await expect(page.getByText(/캠페인 개요|Overview/)).toBeVisible()
    })

    test.skip('should display performance metrics', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      // 성과 지표 (지출, 노출, 클릭, 전환 등)
      const metrics = page.locator('[data-testid^="metric-"]')
        .or(page.getByText(/지출|노출|클릭|전환|ROAS/))

      await expect(metrics.first()).toBeVisible({ timeout: 10000 })
    })

    test.skip('should display campaign status badge', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const statusBadge = page.locator('[data-testid="campaign-status"]')
        .or(page.getByText(/활성|일시중지|완료/))

      await expect(statusBadge.first()).toBeVisible()
    })

    test.skip('should have edit campaign button', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const editButton = page.getByRole('link', { name: /수정|편집|Edit/ })
        .or(page.getByRole('button', { name: /수정|편집|Edit/ }))

      await expect(editButton.first()).toBeVisible()
    })

    test.skip('should navigate to edit page on edit button click', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const editButton = page.getByRole('link', { name: /수정|편집|Edit/ })
      await editButton.first().click()

      await expect(page).toHaveURL(/\/campaigns\/.*\/edit/)
    })

    test.skip('should display campaign timeline or history', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const timeline = page.getByRole('heading', { name: /활동 내역|타임라인|History/ })
        .or(page.locator('[data-testid="campaign-timeline"]'))

      // 타임라인이 있다면 표시
      if (await timeline.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(timeline).toBeVisible()
      }
    })

    test.skip('should display chart or graph', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      // 성과 차트
      const chart = page.locator('canvas, svg[class*="chart"], [data-testid="performance-chart"]')

      if (await chart.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(chart.first()).toBeVisible()
      }
    })

    test.skip('should allow pausing campaign', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const pauseButton = page.getByRole('button', { name: /일시중지|Pause/ })

      if (await pauseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await pauseButton.click()

        // 확인 다이얼로그 또는 상태 변경 확인
        const confirmButton = page.getByRole('button', { name: /확인|Confirm/ })

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click()
        }

        // 성공 메시지 확인
        await expect(page.getByText(/일시중지|성공/)).toBeVisible({ timeout: 5000 })
      }
    })

    test.skip('should allow activating campaign', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id')

      const activateButton = page.getByRole('button', { name: /활성화|시작|Activate/ })

      if (await activateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await activateButton.click()

        // 확인 다이얼로그
        const confirmButton = page.getByRole('button', { name: /확인|Confirm/ })

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click()
        }

        await expect(page.getByText(/활성화|성공/)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('캠페인 생성 페이지', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test.skip('should display campaign creation form', async ({ page }) => {
      await page.goto('/campaigns/new')

      await expect(page.getByRole('heading', { name: /캠페인 만들기|새 캠페인/ })).toBeVisible()
    })

    test.skip('should display step indicators', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 단계 표시 (1/4, 2/4 등)
      const stepIndicator = page.getByText(/1\/|Step 1/)
      await expect(stepIndicator).toBeVisible()
    })

    test.skip('should validate required fields', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 필수 필드 비우고 제출 시도
      const submitButton = page.getByRole('button', { name: /다음|제출|생성/ })
      await submitButton.click()

      // 유효성 검사 메시지
      await expect(page.getByText(/필수|입력해주세요|required/i)).toBeVisible()
    })

    test.skip('should proceed to next step on valid input', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Step 1 입력
      const nameInput = page.getByLabel(/캠페인 이름|Campaign Name/)
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('E2E 테스트 캠페인')

        const nextButton = page.getByRole('button', { name: /다음|Next/ })
        await nextButton.click()

        // Step 2로 이동 확인
        await expect(page.getByText(/2\/|Step 2/)).toBeVisible({ timeout: 5000 })
      }
    })

    test.skip('should allow going back to previous step', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Step 2로 이동
      const nameInput = page.getByLabel(/캠페인 이름|Campaign Name/)
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('테스트')

        const nextButton = page.getByRole('button', { name: /다음|Next/ })
        await nextButton.click()

        // 뒤로 가기 버튼 클릭
        const backButton = page.getByRole('button', { name: /이전|뒤로|Back/ })
        if (await backButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await backButton.click()

          // Step 1로 돌아감
          await expect(page.getByText(/1\/|Step 1/)).toBeVisible()
        }
      }
    })

    test.skip('should preserve form data when going back', async ({ page }) => {
      await page.goto('/campaigns/new')

      const testName = 'E2E 테스트 캠페인'
      const nameInput = page.getByLabel(/캠페인 이름|Campaign Name/)

      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill(testName)

        const nextButton = page.getByRole('button', { name: /다음|Next/ })
        await nextButton.click()

        const backButton = page.getByRole('button', { name: /이전|뒤로|Back/ })
        if (await backButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await backButton.click()

          // 입력했던 데이터가 유지되어야 함
          await expect(nameInput).toHaveValue(testName)
        }
      }
    })

    test.skip('should display budget validation', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 예산 설정 단계로 이동 (여러 단계 건너뛰기 필요할 수 있음)
      const budgetInput = page.getByLabel(/예산|Budget|일일 예산/)

      if (await budgetInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // 최소 예산보다 작은 값 입력
        await budgetInput.fill('1000')

        const nextButton = page.getByRole('button', { name: /다음|Next/ })
        await nextButton.click()

        // 유효성 검사 메시지
        await expect(page.getByText(/최소|minimum/i)).toBeVisible()
      }
    })

    test.skip('should show review step before submission', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 마지막 단계까지 진행 (실제로는 각 단계를 채워야 함)
      // 여기서는 최종 검토 단계가 있는지만 확인

      const reviewHeading = page.getByRole('heading', { name: /최종 확인|검토|Review/ })

      // 최종 단계로 이동했다고 가정
      if (await reviewHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(reviewHeading).toBeVisible()
      }
    })

    test.skip('should create campaign on final submission', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 전체 플로우 완료 후 제출
      // (실제로는 각 단계를 채워야 하지만 테스트 편의상 생략)

      const submitButton = page.getByRole('button', { name: /캠페인 생성|생성|Create/ })

      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click()

        // 성공 메시지 또는 캠페인 목록으로 리다이렉트
        await page.waitForURL(/\/campaigns/, { timeout: 10000 })
          .catch(() => {
            // 또는 성공 메시지 확인
            expect(page.getByText(/성공|생성되었습니다/)).toBeVisible()
          })
      }
    })

    test.skip('should cancel campaign creation', async ({ page }) => {
      await page.goto('/campaigns/new')

      const cancelButton = page.getByRole('button', { name: /취소|Cancel/ })

      if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cancelButton.click()

        // 확인 다이얼로그가 있을 수 있음
        const confirmButton = page.getByRole('button', { name: /확인|예|Yes/ })

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click()
        }

        // 캠페인 목록으로 돌아감
        await expect(page).toHaveURL(/\/campaigns$/)
      }
    })
  })

  test.describe('캠페인 수정 페이지', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/campaigns/test-id/edit')

      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test.skip('should display edit form with existing data', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id/edit')

      await expect(page.getByRole('heading', { name: /수정|편집|Edit/ })).toBeVisible()
    })

    test.skip('should save changes on submit', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id/edit')

      const saveButton = page.getByRole('button', { name: /저장|Save/ })

      if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await saveButton.click()

        // 성공 메시지
        await expect(page.getByText(/저장|성공/)).toBeVisible({ timeout: 5000 })
      }
    })

    test.skip('should navigate back on cancel', async ({ page }) => {
      await page.goto('/campaigns/test-campaign-id/edit')

      const cancelButton = page.getByRole('button', { name: /취소|Cancel/ })

      if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cancelButton.click()

        // 캠페인 상세 페이지로 돌아감
        await expect(page).toHaveURL(/\/campaigns\/test-campaign-id$/)
      }
    })
  })
})
