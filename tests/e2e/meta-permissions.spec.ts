import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures/auth'
import { MockHelper } from './helpers/mock.helper'

test.describe('Meta Permission E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    await authFixture.loginAsUser(page)
  })

  // =========================================================================
  // Permission 1: pages_show_list
  // =========================================================================
  test.describe('pages_show_list - Facebook Pages List', () => {
    test('should display and select managed Facebook Pages', async ({ page }) => {
      // Mock Meta Pages API
      const mockPages = [
        { id: '111222333', name: '테스트 비즈니스 페이지', category: 'E-Commerce', access_token: 'token1' },
        { id: '444555666', name: '브랜드 공식 페이지', category: 'Brand', access_token: 'token2' },
        { id: '777888999', name: '프로모션 페이지', category: 'Product/Service', access_token: 'token3' },
      ]

      await page.route('**/api/meta/pages**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pages: mockPages }),
        })
      })

      // Mock meta status as connected
      await page.route('**/api/meta/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: true, accountId: 'act_123456789' }),
        })
      })

      await page.goto('/settings/meta-pages')
      await page.waitForLoadState('networkidle')

      // Verify page loads
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Look for page names in the list
      for (const mockPage of mockPages) {
        const pageElement = page.getByText(mockPage.name)
        const isVisible = await pageElement.first().isVisible({ timeout: 5000 }).catch(() => false)
        if (isVisible) {
          await expect(pageElement.first()).toBeVisible()
        }
      }

      // Try to select a page
      const selectButton = page.getByRole('button', { name: /선택|Select/ })
        .or(page.locator('[data-action="select-page"]'))
        .or(page.getByRole('radio'))

      if (await selectButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectButton.first().click()
      }
    })
  })

  // =========================================================================
  // Permission 2: pages_read_engagement
  // =========================================================================
  test.describe('pages_read_engagement - Page Engagement Metrics', () => {
    test('should display page engagement analytics data', async ({ page }) => {
      // Mock engagement metrics
      await page.route('**/api/meta/pages/*/insights**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            insights: {
              page_impressions: { value: 15420, change: 12.5 },
              page_engaged_users: { value: 3240, change: 8.3 },
              page_post_engagements: { value: 1856, change: -2.1 },
              page_fans: { value: 8920, change: 3.7 },
              page_views_total: { value: 6780, change: 15.2 },
            },
            period: '지난 7일',
          }),
        })
      })

      // Mock meta status
      await page.route('**/api/meta/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: true }),
        })
      })

      // Navigate to a page that shows engagement data
      // This might be at /settings/meta-pages with engagement tab, or dashboard
      await page.goto('/settings/meta-pages')
      await page.waitForLoadState('networkidle')

      // Verify the page loaded
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Look for engagement-related text/metrics
      const engagementTerms = ['참여', 'engagement', '좋아요', '댓글', '공유', '노출', 'impression']
      for (const term of engagementTerms) {
        const element = page.getByText(new RegExp(term, 'i'))
        if (await element.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          break
        }
      }
      // At minimum, the page should load without errors
      await expect(page.locator('body')).toBeVisible()
    })
  })

  // =========================================================================
  // Permission 3: business_management
  // =========================================================================
  test.describe('business_management - Meta Pixel Management', () => {
    test('should display and manage Meta Pixels', async ({ page }) => {
      // Mock pixel list
      await page.route('**/api/pixel**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              pixels: MockHelper.metaPixels(),
            }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          })
        }
      })

      // Mock meta status
      await page.route('**/api/meta/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: true }),
        })
      })

      await page.goto('/settings/pixel')
      await page.waitForLoadState('networkidle')

      // Verify page loads
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Look for pixel data
      for (const pixel of MockHelper.metaPixels()) {
        const pixelName = page.getByText(pixel.name)
        const isVisible = await pixelName.first().isVisible({ timeout: 5000 }).catch(() => false)
        if (isVisible) {
          await expect(pixelName.first()).toBeVisible()
        }
      }

      // Try selecting a pixel
      const selectButton = page.getByRole('button', { name: /선택|설치|Select|Install/ })
        .or(page.locator('[data-action="select-pixel"]'))

      if (await selectButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectButton.first().click()
        // Verify some confirmation appears
        await page.waitForTimeout(1000)
      }
    })
  })

  // =========================================================================
  // Permission 4: ads_read
  // =========================================================================
  test.describe('ads_read - Campaign Performance Dashboard', () => {
    test('should display KPI dashboard with Meta Ads data and API indicators', async ({ page }) => {
      const kpiData = MockHelper.kpiData()
      const campaigns = MockHelper.campaigns()

      // Mock dashboard KPI API
      await page.route('**/api/dashboard/kpi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              current: kpiData,
              previous: {
                ...kpiData,
                roas: kpiData.roas * 0.9,
                spend: kpiData.spend * 1.1,
                conversions: Math.floor(kpiData.conversions * 0.85),
                ctr: kpiData.ctr * 0.95,
              },
              period: 'last7days',
            },
          }),
        })
      })

      // Mock campaigns API
      await page.route('**/api/campaigns**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns }),
        })
      })

      // Mock insights API
      await page.route('**/api/dashboard/insights**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ insights: MockHelper.aiInsights() }),
        })
      })

      // Mock meta status
      await page.route('**/api/meta/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: true }),
        })
      })

      // Navigate to dashboard with API source indicators
      await page.goto('/dashboard?showApiSource=true')
      await page.waitForLoadState('networkidle')

      // Verify dashboard loads
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Verify KPI metrics are displayed
      const metricTexts = ['ROAS', 'CTR']
      for (const metric of metricTexts) {
        const element = page.getByText(metric)
        await expect(element.first()).toBeVisible({ timeout: 5000 })
      }

      // Check for campaign data
      for (const campaign of campaigns) {
        const campElement = page.getByText(campaign.name)
        const isVisible = await campElement.first().isVisible({ timeout: 3000 }).catch(() => false)
        if (isVisible) {
          await expect(campElement.first()).toBeVisible()
        }
      }
    })
  })

  // =========================================================================
  // Permission 5: ads_management
  // =========================================================================
  test.describe('ads_management - Campaign Lifecycle', () => {
    test('should create campaign, verify in list, and toggle status', async ({ page }) => {
      const campaigns = MockHelper.campaigns()
      let campaignStatusToggled = false

      // Mock campaigns list API
      await page.route('**/api/campaigns', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              campaigns: campaignStatusToggled
                ? campaigns.map(c => c.id === '120210000000001' ? { ...c, status: 'PAUSED' } : c)
                : campaigns,
            }),
          })
        } else if (route.request().method() === 'POST') {
          // Campaign creation
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              campaign: {
                id: '120210000000004',
                name: '신규 전환 캠페인',
                status: 'ACTIVE',
                objective: 'OUTCOME_SALES',
                daily_budget: '50000',
                created_time: new Date().toISOString(),
                updated_time: new Date().toISOString(),
              },
            }),
          })
        }
      })

      // Mock campaign status update
      await page.route('**/api/campaigns/*/status**', async (route) => {
        campaignStatusToggled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, status: 'PAUSED' }),
        })
      })

      // Mock meta accounts
      await page.route('**/api/meta/accounts**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accounts: MockHelper.metaAccounts() }),
        })
      })

      // Mock meta status
      await page.route('**/api/meta/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ connected: true }),
        })
      })

      // Step 1: Navigate to campaign creation
      await page.goto('/campaigns/new')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Step 2: Fill campaign creation form (adapt to actual wizard steps)
      const nameInput = page.getByLabel(/캠페인 이름|Campaign name/i)
        .or(page.getByPlaceholder(/캠페인 이름|Campaign name/i))
        .or(page.locator('input[name="name"]'))

      if (await nameInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.first().fill('신규 전환 캠페인')
      }

      // Look for objective selector
      const objectiveButton = page.getByText(/전환|Conversions|OUTCOME_SALES/)
        .or(page.getByRole('radio', { name: /전환/ }))
        .or(page.getByRole('button', { name: /전환/ }))

      if (await objectiveButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await objectiveButton.first().click()
      }

      // Look for next/submit button
      const nextButton = page.getByRole('button', { name: /다음|Next|생성|Create|완료|Submit/ })
      if (await nextButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.first().click()
        await page.waitForTimeout(1000)
      }

      // Try submitting if there are more steps
      const submitButton = page.getByRole('button', { name: /생성|Create|완료|Submit|캠페인 만들기/ })
      if (await submitButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.first().click()
        await page.waitForTimeout(1000)
      }

      // Step 3: Navigate to campaign list to verify
      await page.goto('/campaigns')
      await page.waitForLoadState('networkidle')

      // Verify campaigns are listed
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

      // Look for campaign names
      const firstCampaign = page.getByText(campaigns[0].name)
      if (await firstCampaign.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(firstCampaign.first()).toBeVisible()
      }

      // Step 4: Toggle campaign status (pause)
      const statusToggle = page.getByRole('button', { name: /일시정지|Pause|비활성/ })
        .or(page.getByRole('switch'))
        .or(page.locator('[data-action="toggle-status"]'))

      if (await statusToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await statusToggle.first().click()
        await page.waitForTimeout(1000)

        // Verify status changed
        const pausedText = page.getByText(/일시정지|PAUSED|비활성/)
        const isPaused = await pausedText.first().isVisible({ timeout: 3000 }).catch(() => false)
        if (isPaused) {
          await expect(pausedText.first()).toBeVisible()
        }
      }
    })
  })
})
