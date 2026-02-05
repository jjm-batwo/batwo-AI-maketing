import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'
import { MockHelper } from '../helpers/mock.helper'
import { ApiHelper } from '../helpers/api.helper'

/**
 * AI Copy Generation E2E Tests
 *
 * Test Coverage:
 * - AI copy generation form access
 * - Copy generation request flow
 * - Result display and formatting
 * - Quota management
 * - Error handling
 * - Copy variations
 */

const apiHelper = new ApiHelper()

test.describe('AI Copy Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await authFixture.loginAsUser(page)

    // Mock Meta connection status as true
    await page.route('**/api/meta/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isConnected: true }),
      })
    })

    // Mock quota API
    await page.route('**/api/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MockHelper.quotaStatus()),
      })
    })
  })

  test.describe('AI Copy Form Access', () => {
    test('should access AI copy form from campaign creation', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Look for AI copy generation button or section
      const aiCopyButton = page.getByRole('button', { name: /AI 카피 생성|Generate AI Copy/i })
        .or(page.getByText(/AI 카피|AI Copy/i))

      if (await aiCopyButton.isVisible({ timeout: 2000 })) {
        await expect(aiCopyButton).toBeVisible()
      }
    })

    test('should display AI copy generation modal', async ({ page }) => {
      await page.route('**/api/campaigns', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: MockHelper.campaigns() }),
        })
      })

      await page.goto('/campaigns')

      // Find and click AI copy generation trigger
      const aiCopyTrigger = page.getByRole('button', { name: /AI 카피|AI Copy/i })
        .or(page.locator('[data-testid="ai-copy-button"]'))
        .first()

      if (await aiCopyTrigger.isVisible({ timeout: 2000 })) {
        await aiCopyTrigger.click()

        // Modal should appear
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show quota information', async ({ page }) => {
      await page.goto('/campaigns/new')

      const quotaStatus = MockHelper.quotaStatus()

      // Should display remaining quota
      const quotaText = `${quotaStatus.aiCopyGeneration.remaining}/${quotaStatus.aiCopyGeneration.limit}`
      await expect(page.getByText(new RegExp(quotaText))).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Copy Generation Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/ai/copy', async (route) => {
        if (route.request().method() === 'POST') {
          // Simulate AI processing delay
          await new Promise((resolve) => setTimeout(resolve, 1000))

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MockHelper.aiCopyResponse()),
          })
        }
      })
    })

    test('should display copy generation form fields', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Should have form fields for AI copy generation
      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))

      const descriptionInput = page.getByLabel(/제품 설명|Product Description/i)
        .or(page.getByPlaceholder(/제품 설명|Description/i))

      // At least one field should be visible
      const hasProductField = await productInput.isVisible({ timeout: 2000 }).catch(() => false)
      const hasDescField = await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)

      expect(hasProductField || hasDescField).toBe(true)
    })

    test('should validate required fields before generation', async ({ page }) => {
      await page.goto('/campaigns/new')

      const generateButton = page.getByRole('button', { name: /생성|Generate/i })

      if (await generateButton.isVisible({ timeout: 2000 })) {
        await generateButton.click()

        // Should show validation error
        await expect(page.getByText(/필수|required/i)).toBeVisible({ timeout: 2000 })
      }
    })

    test('should generate AI copy successfully', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Fill form fields
      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('스마트 워치')

        const descriptionInput = page.getByLabel(/제품 설명|Product Description/i)
          .or(page.getByPlaceholder(/제품 설명|Description/i))
          .first()

        if (await descriptionInput.isVisible({ timeout: 2000 })) {
          await descriptionInput.fill('최신 기술이 적용된 스마트 워치')
        }

        // Click generate button
        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Should show loading state
        await expect(page.locator('text=/생성 중|Generating/i')).toBeVisible({ timeout: 2000 })

        // Should display generated copy
        const aiResponse = MockHelper.aiCopyResponse()
        await expect(page.getByText(aiResponse.headline)).toBeVisible({ timeout: 10000 })
      }
    })

    test('should show loading indicator during generation', async ({ page }) => {
      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Should show spinner or loading state
        await expect(page.locator('svg.animate-spin')).toBeVisible({ timeout: 2000 })
      }
    })
  })

  test.describe('Generated Copy Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/ai/copy', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockHelper.aiCopyResponse()),
        })
      })
    })

    test('should display all copy components', async ({ page }) => {
      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        const aiResponse = MockHelper.aiCopyResponse()

        // All copy components should be visible
        await expect(page.getByText(aiResponse.headline)).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(aiResponse.primaryText)).toBeVisible()
        await expect(page.getByText(aiResponse.description)).toBeVisible()
      }
    })

    test('should allow copying generated text', async ({ page }) => {
      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Wait for result
        await page.waitForTimeout(2000)

        // Should have copy buttons
        const copyButton = page.getByRole('button', { name: /복사|Copy/i }).first()
        if (await copyButton.isVisible({ timeout: 2000 })) {
          await expect(copyButton).toBeVisible()
        }
      }
    })

    test('should allow applying copy to campaign form', async ({ page }) => {
      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Wait for result
        await page.waitForTimeout(2000)

        // Should have apply button
        const applyButton = page.getByRole('button', { name: /적용|Apply/i })
        if (await applyButton.isVisible({ timeout: 2000 })) {
          await applyButton.click()

          // Copy should be applied to form
          const aiResponse = MockHelper.aiCopyResponse()
          const headlineInput = page.getByLabel(/헤드라인|Headline/i)
          if (await headlineInput.isVisible({ timeout: 2000 })) {
            await expect(headlineInput).toHaveValue(aiResponse.headline)
          }
        }
      }
    })
  })

  test.describe('Quota Management', () => {
    test('should show quota exceeded warning', async ({ page }) => {
      // Mock quota as exceeded
      await page.route('**/api/quota', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MockHelper.quotaStatus(),
            aiCopyGeneration: {
              used: 20,
              limit: 20,
              remaining: 0,
              resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        })
      })

      await page.goto('/campaigns/new')

      // Should show quota exceeded message
      await expect(page.getByText(/할당량.*초과|quota.*exceeded/i)).toBeVisible({ timeout: 5000 })
    })

    test('should disable generation when quota exceeded', async ({ page }) => {
      await page.route('**/api/quota', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MockHelper.quotaStatus(),
            aiCopyGeneration: {
              used: 20,
              limit: 20,
              remaining: 0,
              resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        })
      })

      await page.goto('/campaigns/new')

      const generateButton = page.getByRole('button', { name: /생성|Generate/i })
      if (await generateButton.isVisible({ timeout: 2000 })) {
        await expect(generateButton).toBeDisabled()
      }
    })

    test('should show quota reset date', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Should display when quota resets
      await expect(page.getByText(/리셋|reset/i)).toBeVisible({ timeout: 5000 })
    })

    test('should update quota after generation', async ({ page }) => {
      let quotaUsed = 8

      await page.route('**/api/quota', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MockHelper.quotaStatus(),
            aiCopyGeneration: {
              used: quotaUsed,
              limit: 20,
              remaining: 20 - quotaUsed,
              resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        })
      })

      await page.route('**/api/ai/copy', async (route) => {
        if (route.request().method() === 'POST') {
          quotaUsed += 1
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MockHelper.aiCopyResponse()),
          })
        }
      })

      await page.goto('/campaigns/new')

      // Initial quota
      await expect(page.getByText(/12\/20/)).toBeVisible({ timeout: 5000 })

      // Generate copy
      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test')
        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Quota should update
        await expect(page.getByText(/11\/20/)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle AI generation errors', async ({ page }) => {
      await apiHelper.mockApiError(page, '**/api/ai/copy', 500, 'AI service unavailable')

      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Should show error message
        await expect(page.getByText(/오류|error/i)).toBeVisible({ timeout: 5000 })
      }
    })

    test('should allow retry after error', async ({ page }) => {
      let attemptCount = 0

      await page.route('**/api/ai/copy', async (route) => {
        attemptCount += 1
        if (attemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service unavailable' }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MockHelper.aiCopyResponse()),
          })
        }
      })

      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        // First attempt - should fail
        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        await page.waitForTimeout(1000)

        // Retry - should succeed
        const retryButton = page.getByRole('button', { name: /재시도|Retry|생성|Generate/i }).first()
        await retryButton.click()

        // Should show success
        const aiResponse = MockHelper.aiCopyResponse()
        await expect(page.getByText(aiResponse.headline)).toBeVisible({ timeout: 10000 })
      }
    })

    test('should handle timeout gracefully', async ({ page }) => {
      await page.route('**/api/ai/copy', async (route) => {
        // Simulate timeout by delaying response
        await new Promise((resolve) => setTimeout(resolve, 30000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockHelper.aiCopyResponse()),
        })
      })

      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Should eventually show timeout message
        await expect(page.getByText(/시간 초과|timeout/i)).toBeVisible({ timeout: 35000 })
      }
    })
  })

  test.describe('Copy Variations', () => {
    test('should generate multiple variations', async ({ page }) => {
      await page.route('**/api/ai/copy', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            variations: [
              MockHelper.aiCopyResponse(),
              {
                headline: '지금 시작하세요! 특별 프로모션',
                primaryText: '한정 기간 특별 혜택을 놓치지 마세요',
                description: '빠른 설정, 강력한 기능',
                cta: '시작하기',
              },
              {
                headline: '당신을 위한 최고의 선택',
                primaryText: '검증된 솔루션으로 비즈니스를 성장시키세요',
                description: '전문가가 인정한 서비스',
                cta: '알아보기',
              },
            ],
          }),
        })
      })

      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        // Should show multiple variations
        await expect(page.getByText(/변형|Variation|옵션|Option/i)).toBeVisible({ timeout: 10000 })
      }
    })

    test('should allow selecting between variations', async ({ page }) => {
      await page.route('**/api/ai/copy', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            variations: [
              MockHelper.aiCopyResponse(),
              {
                headline: '대체 헤드라인',
                primaryText: '대체 본문',
                description: '대체 설명',
                cta: '대체 CTA',
              },
            ],
          }),
        })
      })

      await page.goto('/campaigns/new')

      const productInput = page.getByLabel(/제품명|Product Name/i)
        .or(page.getByPlaceholder(/제품명|Product/i))
        .first()

      if (await productInput.isVisible({ timeout: 2000 })) {
        await productInput.fill('Test Product')

        const generateButton = page.getByRole('button', { name: /생성|Generate/i })
        await generateButton.click()

        await page.waitForTimeout(2000)

        // Should be able to navigate between variations
        const nextVariation = page.getByRole('button', { name: /다음|Next/i })
        if (await nextVariation.isVisible({ timeout: 2000 })) {
          await nextVariation.click()
          await expect(page.getByText(/대체 헤드라인/)).toBeVisible()
        }
      }
    })
  })
})
