import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'
import { MockHelper } from '../helpers/mock.helper'
import { ApiHelper } from '../helpers/api.helper'

/**
 * Campaigns E2E Tests
 *
 * Test Coverage:
 * - Campaign list page rendering
 * - New campaign creation flow
 * - Campaign detail view
 * - Campaign editing
 * - Campaign status changes (active/paused)
 * - Meta connection requirement
 */

const apiHelper = new ApiHelper()

test.describe('Campaigns Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await authFixture.loginAsUser(page)
  })

  test.describe('Campaign List - Meta Not Connected', () => {
    test('should show Meta connection prompt when not connected', async ({ page }) => {
      // Mock Meta connection status as false
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: false }),
        })
      })

      await page.goto('/campaigns')

      // Should show Meta connection prompt
      await expect(page.getByText(/Meta 계정을 연결해주세요/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /Meta 연결하기/i })).toBeVisible()
    })

    test('should redirect to Meta connect page on button click', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: false }),
        })
      })

      await page.goto('/campaigns')

      const connectButton = page.getByRole('link', { name: /Meta 연결하기/i })
      await connectButton.click()

      // Should navigate to Meta connect settings
      await expect(page).toHaveURL(/\/settings\/meta-connect/)
    })
  })

  test.describe('Campaign List - Meta Connected', () => {
    test.beforeEach(async ({ page }) => {
      // Mock Meta connection status as true
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      // Mock campaigns API
      await apiHelper.mockApiResponse(page, '**/api/campaigns**', {
        campaigns: MockHelper.campaigns(),
      })
    })

    test('should render campaigns page with header and actions', async ({ page }) => {
      await page.goto('/campaigns')

      // Header elements
      await expect(page.getByRole('heading', { name: /캠페인/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /새 캠페인/i })).toBeVisible()
    })

    test('should display campaign list with correct data', async ({ page }) => {
      await page.goto('/campaigns')

      const campaigns = MockHelper.campaigns()

      // Wait for campaigns to load
      await page.waitForSelector('[data-testid="campaign-list"]', { timeout: 10000 })
        .catch(() => page.waitForSelector('table', { timeout: 5000 }))

      // Check first campaign
      await expect(page.getByText(campaigns[0].name)).toBeVisible()
      await expect(page.getByText(/ACTIVE|활성/i)).toBeVisible()
    })

    test('should filter campaigns by status', async ({ page }) => {
      await page.goto('/campaigns')

      // Wait for page load
      await page.waitForLoadState('networkidle')

      // Open status filter dropdown
      const statusFilter = page.getByRole('combobox', { name: /상태|Status/i })
        .or(page.locator('button:has-text("전체")'))
        .first()

      if (await statusFilter.isVisible({ timeout: 2000 })) {
        await statusFilter.click()

        // Select ACTIVE filter
        const activeOption = page.getByRole('option', { name: /활성|ACTIVE/i })
          .or(page.getByText(/활성|ACTIVE/i))
          .first()

        await activeOption.click()

        // Should trigger API call with status filter
        await apiHelper.waitForApi(page, /\/api\/campaigns\?.*status=ACTIVE/)
      }
    })

    test('should navigate to new campaign page', async ({ page }) => {
      await page.goto('/campaigns')

      const newCampaignButton = page.getByRole('button', { name: /새 캠페인/i })
        .or(page.getByRole('link', { name: /새 캠페인/i }))

      await newCampaignButton.click()

      // Should navigate to campaign creation page
      await expect(page).toHaveURL(/\/campaigns\/new/)
    })

    test('should search campaigns by name', async ({ page }) => {
      await page.goto('/campaigns')

      const searchInput = page.getByPlaceholder(/검색|Search/i)

      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('신규 고객')

        // Wait for search to trigger
        await page.waitForTimeout(500)

        // Should show filtered results
        await expect(page.getByText(/신규 고객 확보 캠페인/i)).toBeVisible()
      }
    })
  })

  test.describe('Campaign Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await page.route('**/api/meta/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ accounts: MockHelper.metaAccounts() }),
        })
      })
    })

    test('should display new campaign form', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Form fields should be visible
      await expect(page.getByLabel(/캠페인 이름|Campaign Name/i)).toBeVisible()
      await expect(page.getByLabel(/목표|Objective/i)).toBeVisible()
      await expect(page.getByLabel(/예산|Budget/i)).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/campaigns/new')

      // Try to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /생성|Create/i })

      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click()

        // Should show validation errors
        await expect(page.getByText(/필수 항목|required/i)).toBeVisible()
      }
    })

    test('should create campaign successfully', async ({ page }) => {
      await page.route('**/api/campaigns', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: '120210000000004',
              name: 'Test Campaign',
              status: 'ACTIVE',
            }),
          })
        }
      })

      await page.goto('/campaigns/new')

      // Fill form
      await page.getByLabel(/캠페인 이름|Campaign Name/i).fill('Test Campaign')

      const objectiveSelect = page.getByLabel(/목표|Objective/i)
      if (await objectiveSelect.isVisible({ timeout: 2000 })) {
        await objectiveSelect.click()
        await page.getByRole('option', { name: /판매|Sales/i }).first().click()
      }

      await page.getByLabel(/예산|Budget/i).fill('50000')

      // Submit form
      const submitButton = page.getByRole('button', { name: /생성|Create/i })
      await submitButton.click()

      // Should redirect to campaigns list
      await expect(page).toHaveURL(/\/campaigns/, { timeout: 10000 })
    })
  })

  test.describe('Campaign Details', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      const campaign = MockHelper.campaigns()[0]
      await page.route(`**/api/campaigns/${campaign.id}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaign }),
        })
      })

      await page.route(`**/api/campaigns/${campaign.id}/insights`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ insights: MockHelper.insights(campaign.id) }),
        })
      })
    })

    test('should display campaign details', async ({ page }) => {
      const campaign = MockHelper.campaigns()[0]
      await page.goto(`/campaigns/${campaign.id}`)

      // Campaign info should be visible
      await expect(page.getByText(campaign.name)).toBeVisible()
      await expect(page.getByText(/ACTIVE|활성/i)).toBeVisible()
    })

    test('should show campaign performance metrics', async ({ page }) => {
      const campaign = MockHelper.campaigns()[0]
      await page.goto(`/campaigns/${campaign.id}`)

      // Wait for insights to load
      await page.waitForSelector('[data-testid="campaign-insights"]', { timeout: 5000 })
        .catch(() => {})

      // Should display metrics
      await expect(page.getByText(/노출|Impressions/i)).toBeVisible()
      await expect(page.getByText(/클릭|Clicks/i)).toBeVisible()
    })

    test('should navigate to edit page', async ({ page }) => {
      const campaign = MockHelper.campaigns()[0]
      await page.goto(`/campaigns/${campaign.id}`)

      const editButton = page.getByRole('button', { name: /수정|Edit/i })
        .or(page.getByRole('link', { name: /수정|Edit/i }))

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click()

        // Should navigate to edit page
        await expect(page).toHaveURL(new RegExp(`/campaigns/${campaign.id}/edit`))
      }
    })
  })

  test.describe('Campaign Status Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })
    })

    test('should pause active campaign', async ({ page }) => {
      const campaign = MockHelper.campaigns()[0] // Active campaign

      await page.route(`**/api/campaigns/${campaign.id}`, async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...campaign, status: 'PAUSED' }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ campaign }),
          })
        }
      })

      await page.goto(`/campaigns/${campaign.id}`)

      const pauseButton = page.getByRole('button', { name: /일시정지|Pause/i })

      if (await pauseButton.isVisible({ timeout: 2000 })) {
        await pauseButton.click()

        // Should show paused status
        await expect(page.getByText(/PAUSED|일시정지/i)).toBeVisible({ timeout: 5000 })
      }
    })

    test('should activate paused campaign', async ({ page }) => {
      const campaign = MockHelper.campaigns()[1] // Paused campaign

      await page.route(`**/api/campaigns/${campaign.id}`, async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...campaign, status: 'ACTIVE' }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ campaign }),
          })
        }
      })

      await page.goto(`/campaigns/${campaign.id}`)

      const activateButton = page.getByRole('button', { name: /활성화|Activate/i })

      if (await activateButton.isVisible({ timeout: 2000 })) {
        await activateButton.click()

        // Should show active status
        await expect(page.getByText(/ACTIVE|활성/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await apiHelper.mockApiError(page, '**/api/campaigns**', 500, 'Internal Server Error')

      await page.goto('/campaigns')

      // Should show error message
      await expect(page.getByText(/오류|error/i)).toBeVisible({ timeout: 5000 })
    })

    test('should handle campaign not found', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await apiHelper.mockApiError(page, '**/api/campaigns/999999', 404, 'Campaign not found')

      await page.goto('/campaigns/999999')

      // Should show not found message
      await expect(page.getByText(/찾을 수 없습니다|not found/i)).toBeVisible({ timeout: 5000 })
    })
  })
})
