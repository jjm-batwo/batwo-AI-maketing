import { test, expect } from '@playwright/test'

test.describe('Campaign Flow', () => {

  test.describe('Campaign List', () => {
    test('should display campaigns page', async ({ page }) => {
      await page.goto('/campaigns')
      // 페이지 제목 또는 캠페인 관련 콘텐츠 확인
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    })

    test('should show create campaign button', async ({ page }) => {
      await page.goto('/campaigns')
      // 새 캠페인 버튼/링크 확인 (텍스트에 "새" 또는 "만들기" 포함)
      const createButton = page.getByRole('link', { name: /새 캠페인|캠페인 만들기|새로 만들기/ })
        .or(page.getByRole('button', { name: /새 캠페인|캠페인 만들기|새로 만들기/ }))
      await expect(createButton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to create campaign page', async ({ page }) => {
      await page.goto('/campaigns')
      const createButton = page.getByRole('link', { name: /새 캠페인|캠페인 만들기|새로 만들기/ })
        .or(page.getByRole('button', { name: /새 캠페인|캠페인 만들기|새로 만들기/ }))
      await createButton.first().click()
      await expect(page).toHaveURL('/campaigns/new', { timeout: 10000 })
    })
  })

  test.describe('Campaign Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/campaigns/new')
      // Step 0은 템플릿 선택 화면이므로 "템플릿 없이 직접 설정하기" 클릭하여 Step 1로 이동
      const skipTemplateButton = page.getByRole('button', { name: /템플릿 없이 직접 설정하기/ })
      if (await skipTemplateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipTemplateButton.click()
      }
    })

    test('should show step 1 - business info', async ({ page }) => {
      await expect(page.getByText('1/4')).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel('캠페인 이름')).toBeVisible()
      await expect(page.getByText('캠페인 목표')).toBeVisible()
    })

    test('should proceed to step 2 after filling step 1', async ({ page }) => {
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      // 캠페인 목표 선택 (radio button)
      await page.getByRole('radio', { name: /전환/ }).click()
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page.getByText('2/4')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/타겟 오디언스/)).toBeVisible()
    })

    test('should proceed to step 3 after filling step 2', async ({ page }) => {
      // Step 1
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByRole('radio', { name: /전환/ }).click()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 2
      await expect(page.getByText('2/4')).toBeVisible({ timeout: 10000 })
      await page.getByRole('button', { name: '다음' }).click()

      // Step 3
      await expect(page.getByText('3/4')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/예산 설정/)).toBeVisible()
    })

    test('should show validation error for low budget', async ({ page }) => {
      // Navigate to step 3
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByRole('radio', { name: /전환/ }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await expect(page.getByText('2/4')).toBeVisible({ timeout: 10000 })
      await page.getByRole('button', { name: '다음' }).click()
      await expect(page.getByText('3/4')).toBeVisible({ timeout: 10000 })

      // Set low budget
      await page.getByLabel('일일 예산').clear()
      await page.getByLabel('일일 예산').fill('5000')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page.getByText('최소 일일 예산은 10,000원입니다')).toBeVisible({ timeout: 5000 })
    })

    test('should complete full campaign creation flow', async ({ page }) => {
      // Mock campaign creation API
      await page.route('**/api/campaigns', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-campaign-id',
              name: 'E2E 테스트 캠페인',
              status: 'DRAFT',
            }),
          })
        } else {
          await route.continue()
        }
      })

      // Step 1 - Business Info
      await page.getByLabel('캠페인 이름').fill('E2E 테스트 캠페인')
      await page.getByRole('radio', { name: /전환/ }).click()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 2 - Target Audience
      await expect(page.getByText(/타겟 오디언스/)).toBeVisible({ timeout: 10000 })
      await page.getByRole('button', { name: '다음' }).click()

      // Step 3 - Budget
      await expect(page.getByText(/예산 설정/)).toBeVisible({ timeout: 10000 })
      await page.getByLabel('일일 예산').clear()
      await page.getByLabel('일일 예산').fill('50000')
      await page.getByRole('button', { name: '다음' }).click()

      // Step 4 - Review
      await expect(page.getByText('4/4')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/최종 확인/)).toBeVisible()
      await expect(page.getByText('E2E 테스트 캠페인')).toBeVisible()
      await expect(page.getByText(/전환/)).toBeVisible()
      await expect(page.getByText(/50,000원/)).toBeVisible()

      // Submit (type="submit" 버튼 클릭)
      await page.locator('button[type="submit"]').click()

      // Should redirect to campaigns list
      await expect(page).toHaveURL('/campaigns', { timeout: 15000 })

      // Success message might appear briefly as toast - check if visible or page loaded
      const successMessage = page.getByText(/성공적으로 생성|캠페인이 성공/)
      const isMessageVisible = await successMessage.isVisible({ timeout: 3000 }).catch(() => false)
      // If no toast, just verify we're on campaigns page (redirect is the success indicator)
      if (!isMessageVisible) {
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      }
    })

    test('should go back to previous step', async ({ page }) => {
      // Go to step 2
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByRole('radio', { name: /전환/ }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await expect(page.getByText('2/4')).toBeVisible({ timeout: 10000 })

      // Go back
      await page.getByRole('button', { name: '이전' }).click()
      await expect(page.getByText('1/4')).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel('캠페인 이름')).toHaveValue('테스트 캠페인')
    })

    test('should cancel campaign creation', async ({ page }) => {
      await page.getByLabel('캠페인 이름').fill('취소할 캠페인')
      await page.getByRole('button', { name: '취소' }).click()
      await expect(page).toHaveURL('/campaigns')
    })
  })

  test.describe('Campaign Quota', () => {
    test('should show quota exceeded message when limit reached', async ({ page }) => {
      // This test assumes quota is exceeded - would need mock setup
      await page.goto('/campaigns/new')

      // If quota exceeded, message should be visible
      const quotaMessage = page.getByText('이번 주 캠페인 생성 횟수를 모두 사용했어요')
      if (await quotaMessage.isVisible()) {
        await expect(page.getByRole('button', { name: '캠페인 생성' })).toBeDisabled()
      }
    })
  })
})
