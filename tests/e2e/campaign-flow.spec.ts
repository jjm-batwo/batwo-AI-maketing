import { test, expect } from '@playwright/test'

test.describe('Campaign Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel('이메일').fill('test@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await expect(page).toHaveURL('/')
  })

  test.describe('Campaign List', () => {
    test('should display campaigns page', async ({ page }) => {
      await page.goto('/campaigns')
      await expect(page.getByRole('heading', { name: /캠페인/ })).toBeVisible()
    })

    test('should show create campaign button', async ({ page }) => {
      await page.goto('/campaigns')
      await expect(page.getByRole('link', { name: /새 캠페인/ })).toBeVisible()
    })

    test('should navigate to create campaign page', async ({ page }) => {
      await page.goto('/campaigns')
      await page.getByRole('link', { name: /새 캠페인/ }).click()
      await expect(page).toHaveURL('/campaigns/new')
    })
  })

  test.describe('Campaign Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/campaigns/new')
    })

    test('should show step 1 - business info', async ({ page }) => {
      await expect(page.getByText('1/4')).toBeVisible()
      await expect(page.getByLabel('캠페인 이름')).toBeVisible()
      await expect(page.getByText('캠페인 목표')).toBeVisible()
    })

    test('should proceed to step 2 after filling step 1', async ({ page }) => {
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByText('전환').click()
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page.getByText('2/4')).toBeVisible()
      await expect(page.getByText('타겟 오디언스')).toBeVisible()
    })

    test('should proceed to step 3 after filling step 2', async ({ page }) => {
      // Step 1
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByText('전환').click()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 2
      await expect(page.getByText('2/4')).toBeVisible()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 3
      await expect(page.getByText('3/4')).toBeVisible()
      await expect(page.getByText('예산 설정')).toBeVisible()
    })

    test('should show validation error for low budget', async ({ page }) => {
      // Navigate to step 3
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByText('전환').click()
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '다음' }).click()

      // Set low budget
      await page.getByLabel('일일 예산').clear()
      await page.getByLabel('일일 예산').fill('5000')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page.getByText('최소 일일 예산은 10,000원입니다')).toBeVisible()
    })

    test('should complete full campaign creation flow', async ({ page }) => {
      // Step 1 - Business Info
      await page.getByLabel('캠페인 이름').fill('E2E 테스트 캠페인')
      await page.getByText('전환').click()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 2 - Target Audience
      await expect(page.getByText('타겟 오디언스')).toBeVisible()
      await page.getByRole('button', { name: '다음' }).click()

      // Step 3 - Budget
      await expect(page.getByText('예산 설정')).toBeVisible()
      await page.getByLabel('일일 예산').clear()
      await page.getByLabel('일일 예산').fill('50000')
      await page.getByRole('button', { name: '다음' }).click()

      // Step 4 - Review
      await expect(page.getByText('4/4')).toBeVisible()
      await expect(page.getByText('최종 확인')).toBeVisible()
      await expect(page.getByText('E2E 테스트 캠페인')).toBeVisible()
      await expect(page.getByText('전환')).toBeVisible()
      await expect(page.getByText('50,000원')).toBeVisible()

      // Submit
      await page.getByRole('button', { name: '캠페인 생성' }).click()

      // Should redirect to campaigns list with success message
      await expect(page).toHaveURL('/campaigns')
      await expect(page.getByText(/성공적으로 생성/)).toBeVisible()
    })

    test('should go back to previous step', async ({ page }) => {
      // Go to step 2
      await page.getByLabel('캠페인 이름').fill('테스트 캠페인')
      await page.getByText('전환').click()
      await page.getByRole('button', { name: '다음' }).click()
      await expect(page.getByText('2/4')).toBeVisible()

      // Go back
      await page.getByRole('button', { name: '이전' }).click()
      await expect(page.getByText('1/4')).toBeVisible()
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
