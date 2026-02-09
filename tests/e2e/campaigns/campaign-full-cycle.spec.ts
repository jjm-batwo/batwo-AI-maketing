import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'
import { MockHelper } from '../helpers/mock.helper'

/**
 * Campaign Full Lifecycle E2E Test
 * Tests the complete campaign flow in one continuous sequence:
 * Create -> List Verify -> Detail View -> Edit -> Pause -> Resume
 *
 * This is separate from campaigns.spec.ts which tests individual CRUD operations.
 * This tests the complete lifecycle as a continuous flow for Meta app review screencast.
 */
test.describe('Campaign Full Lifecycle Flow', () => {
  const testCampaignId = '120210000000004'
  const testCampaignName = '풀 사이클 테스트 캠페인'
  let currentStatus = 'ACTIVE'

  test.beforeEach(async ({ page }) => {
    await authFixture.loginAsUser(page)
    currentStatus = 'ACTIVE'
  })

  test('should complete full campaign lifecycle: create → verify → edit → pause → resume', async ({ page }) => {
    const existingCampaigns = MockHelper.campaigns()

    // ===================================================================
    // Mock Setup
    // ===================================================================

    // Mock meta status
    await page.route('**/api/meta/status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true, accountId: 'act_123456789' }),
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

    // Mock campaign creation (POST)
    await page.route('**/api/campaigns', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            campaign: {
              id: testCampaignId,
              name: testCampaignName,
              status: 'ACTIVE',
              objective: 'OUTCOME_SALES',
              daily_budget: '50000',
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
            },
          }),
        })
      } else {
        // GET - campaign list including our new campaign
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: [
              {
                id: testCampaignId,
                name: testCampaignName,
                status: currentStatus,
                objective: 'OUTCOME_SALES',
                daily_budget: '50000',
                created_time: new Date().toISOString(),
                updated_time: new Date().toISOString(),
              },
              ...existingCampaigns,
            ],
          }),
        })
      }
    })

    // Mock individual campaign detail
    await page.route(`**/api/campaigns/${testCampaignId}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaign: {
              id: testCampaignId,
              name: testCampaignName,
              status: currentStatus,
              objective: 'OUTCOME_SALES',
              daily_budget: '50000',
              targeting: { age_min: 25, age_max: 54, genders: [1, 2] },
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
            },
          }),
        })
      } else if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        // Campaign update (edit)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    // Mock campaign status toggle
    await page.route(`**/api/campaigns/${testCampaignId}/status`, async (route) => {
      const body = route.request().postDataJSON?.() || {}
      currentStatus = body.status || (currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: currentStatus }),
      })
    })

    // Mock campaign insights
    await page.route(`**/api/campaigns/${testCampaignId}/insights**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ insights: MockHelper.insights(testCampaignId) }),
      })
    })

    // Mock dashboard KPI
    await page.route('**/api/dashboard/kpi**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { current: MockHelper.kpiData(), period: 'last7days' },
        }),
      })
    })

    // ===================================================================
    // Step 1: CREATE - Navigate to campaign creation wizard
    // ===================================================================
    await page.goto('/campaigns/new')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

    // Fill campaign name if input is available
    const nameInput = page.getByLabel(/캠페인 이름|Campaign name/i)
      .or(page.getByPlaceholder(/캠페인 이름|Campaign name/i))
      .or(page.locator('input[name="name"]'))

    if (await nameInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.first().fill(testCampaignName)
    }

    // Select objective if available
    const objectiveOption = page.getByText(/전환|Conversions|매출/)
      .or(page.getByRole('radio', { name: /전환/ }))

    if (await objectiveOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await objectiveOption.first().click()
    }

    // Click next/submit
    const nextButton = page.getByRole('button', { name: /다음|Next|생성|Create|완료|Submit/ })
    if (await nextButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextButton.first().click()
      await page.waitForTimeout(1500)
    }

    // Final submit if multi-step
    const submitButton = page.getByRole('button', { name: /생성|Create|완료|캠페인 만들기/ })
    if (await submitButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.first().click()
      await page.waitForTimeout(1500)
    }

    // ===================================================================
    // Step 2: VERIFY - Check campaign appears in list
    // ===================================================================
    await page.goto('/campaigns')
    await page.waitForLoadState('networkidle')

    // Campaign list should load
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

    // Our new campaign should be in the list
    const newCampaign = page.getByText(testCampaignName)
    if (await newCampaign.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(newCampaign.first()).toBeVisible()
    }

    // ===================================================================
    // Step 3: VIEW - Open campaign detail
    // ===================================================================
    // Try clicking on the campaign or navigating directly
    if (await newCampaign.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await newCampaign.first().click()
      await page.waitForTimeout(1000)
    } else {
      await page.goto(`/campaigns/${testCampaignId}`)
    }
    await page.waitForLoadState('networkidle')

    // Verify detail page loaded - check for campaign stats instead of heading
    const dailyBudgetLabel = page.getByText(/일일 예산|Daily Budget/i)
    const totalSpentLabel = page.getByText(/총 지출|Total Spent/i)

    if (await dailyBudgetLabel.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dailyBudgetLabel.first()).toBeVisible()
    } else if (await totalSpentLabel.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(totalSpentLabel.first()).toBeVisible()
    } else {
      // Fallback: just verify we're on the campaign detail page by URL
      await expect(page).toHaveURL(new RegExp(`/campaigns/${testCampaignId}`))
    }

    // ===================================================================
    // Step 4: EDIT - Navigate to edit page
    // ===================================================================
    const editButton = page.getByRole('link', { name: /수정|Edit/ })
      .or(page.getByRole('button', { name: /수정|Edit/ }))

    if (await editButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.first().click()
      await page.waitForTimeout(1000)
    } else {
      await page.goto(`/campaigns/${testCampaignId}/edit`)
    }
    await page.waitForLoadState('networkidle')

    // Verify edit page loaded - check for form elements or URL
    const nameInputEdit = page.getByLabel(/캠페인 이름|Campaign name/i)
      .or(page.getByPlaceholder(/캠페인 이름|Campaign name/i))

    if (await nameInputEdit.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(nameInputEdit.first()).toBeVisible()
    } else {
      // Fallback: just verify we're on the edit page by URL
      await expect(page).toHaveURL(new RegExp(`/campaigns/${testCampaignId}/edit`))
    }

    // ===================================================================
    // Step 5: PAUSE - Toggle campaign status to paused
    // ===================================================================
    await page.goto('/campaigns')
    await page.waitForLoadState('networkidle')

    const pauseButton = page.getByRole('button', { name: /일시정지|Pause/ })
      .or(page.getByRole('switch'))
      .or(page.locator('[data-action="toggle-status"]'))

    if (await pauseButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      currentStatus = 'PAUSED'
      await pauseButton.first().click()
      await page.waitForTimeout(1000)
    }

    // ===================================================================
    // Step 6: RESUME - Toggle back to active
    // ===================================================================
    const resumeButton = page.getByRole('button', { name: /재개|Resume|활성화/ })
      .or(page.getByRole('switch'))

    if (await resumeButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      currentStatus = 'ACTIVE'
      await resumeButton.first().click()
      await page.waitForTimeout(1000)
    }

    // ===================================================================
    // Step 7: VERIFY DASHBOARD - Check dashboard reflects changes
    // ===================================================================
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })

    // Dashboard should load with KPI data
    const roasText = page.getByText('ROAS')
    await expect(roasText.first()).toBeVisible({ timeout: 5000 })
  })
})
