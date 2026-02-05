import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'
import { MockHelper } from '../helpers/mock.helper'
import { ApiHelper } from '../helpers/api.helper'

/**
 * Dashboard E2E Tests
 *
 * Test Coverage:
 * - Dashboard page rendering
 * - KPI cards display
 * - Date filter functionality
 * - Chart rendering
 * - Campaign summary table
 * - AI insights section
 * - Meta connection requirement
 */

const apiHelper = new ApiHelper()

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as authenticated user
    await authFixture.loginAsUser(page)
  })

  test.describe('Dashboard - Meta Not Connected', () => {
    test('should show Meta connection prompt when not connected', async ({ page }) => {
      // Mock Meta connection status as false
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: false }),
        })
      })

      await page.goto('/dashboard')

      // Should show Meta connection prompt
      await expect(page.getByText(/Meta 계정을 연결해주세요/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /Meta 연결하기/i })).toBeVisible()
    })

    test('should show onboarding wizard for new users', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: false }),
        })
      })

      await page.goto('/dashboard')

      // Onboarding wizard should appear
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // Should show welcome message
      await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()
    })
  })

  test.describe('Dashboard - Meta Connected', () => {
    test.beforeEach(async ({ page }) => {
      // Mock Meta connection status as true
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      // Mock dashboard KPI API
      const kpiData = MockHelper.kpiData()
      await page.route('**/api/dashboard/kpi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: {
              totalSpend: kpiData.spend,
              totalConversions: kpiData.conversions,
              averageRoas: kpiData.roas,
              averageCtr: kpiData.ctr,
              changes: {
                spend: 5.2,
                conversions: 12.5,
                roas: -3.1,
                ctr: 8.7,
              },
            },
            chartData: [
              { date: '2026-02-01', spend: 15000, conversions: 20, roas: 4.2 },
              { date: '2026-02-02', spend: 18000, conversions: 25, roas: 4.5 },
              { date: '2026-02-03', spend: 20000, conversions: 30, roas: 4.8 },
              { date: '2026-02-04', spend: 17000, conversions: 22, roas: 4.3 },
              { date: '2026-02-05', spend: 19500, conversions: 26, roas: 4.6 },
            ],
          }),
        })
      })

      // Mock campaigns summary API
      await page.route('**/api/campaigns/summary**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: MockHelper.campaigns().map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              spend: 29500,
              conversions: 41,
              roas: 4.52,
            })),
          }),
        })
      })
    })

    test('should render dashboard page with header', async ({ page }) => {
      await page.goto('/dashboard')

      // Header elements
      await expect(page.getByRole('heading', { name: /대시보드|Dashboard/i })).toBeVisible()
    })

    test('should display all KPI cards', async ({ page }) => {
      await page.goto('/dashboard')

      // Wait for KPI cards to load
      await page.waitForLoadState('networkidle')

      // Should display main KPI metrics
      await expect(page.getByText(/광고비|Spend/i)).toBeVisible()
      await expect(page.getByText(/전환|Conversions/i)).toBeVisible()
      await expect(page.getByText(/ROAS/i)).toBeVisible()
      await expect(page.getByText(/CTR/i)).toBeVisible()
    })

    test('should show KPI values correctly', async ({ page }) => {
      await page.goto('/dashboard')

      // Wait for data to load
      await page.waitForLoadState('networkidle')

      const kpiData = MockHelper.kpiData()

      // Check if spend value is displayed (formatted with commas)
      const spendText = kpiData.spend.toLocaleString('ko-KR')
      await expect(page.getByText(new RegExp(spendText))).toBeVisible({ timeout: 5000 })
    })

    test('should display change indicators on KPI cards', async ({ page }) => {
      await page.goto('/dashboard')

      await page.waitForLoadState('networkidle')

      // Should show percentage changes
      await expect(page.locator('text=/[+-]?\\d+\\.\\d+%/')).toBeVisible({ timeout: 5000 })
    })

    test('should render performance chart', async ({ page }) => {
      await page.goto('/dashboard')

      // Wait for chart to render
      await page.waitForLoadState('networkidle')

      // Look for chart container or canvas
      const chart = page.locator('[data-testid="kpi-chart"]')
        .or(page.locator('canvas'))
        .or(page.locator('.recharts-wrapper'))
        .first()

      await expect(chart).toBeVisible({ timeout: 10000 })
    })

    test('should display campaign summary table', async ({ page }) => {
      await page.goto('/dashboard')

      await page.waitForLoadState('networkidle')

      // Should show campaign table
      const campaigns = MockHelper.campaigns()
      await expect(page.getByText(campaigns[0].name)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Date Filter Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await page.route('**/api/dashboard/kpi**', async (route) => {
        const url = new URL(route.request().url())
        const period = url.searchParams.get('period') || '7d'

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: {
              totalSpend: period === '7d' ? 89500 : 200000,
              totalConversions: period === '7d' ? 123 : 300,
              averageRoas: 4.52,
              averageCtr: 2.76,
              changes: { spend: 5, conversions: 10, roas: 15, ctr: 5 },
            },
            chartData: [],
          }),
        })
      })

      await page.route('**/api/campaigns/summary**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: [] }),
        })
      })
    })

    test('should change date filter to 7 days', async ({ page }) => {
      await page.goto('/dashboard')

      // Find date filter tabs
      const filter7d = page.getByRole('tab', { name: /7일|7 days/i })
        .or(page.locator('button:has-text("7일")'))
        .first()

      if (await filter7d.isVisible({ timeout: 2000 })) {
        await filter7d.click()

        // Should trigger API call with period=7d
        await apiHelper.waitForApi(page, /\/api\/dashboard\/kpi\?.*period=7d/)
      }
    })

    test('should change date filter to 30 days', async ({ page }) => {
      await page.goto('/dashboard')

      const filter30d = page.getByRole('tab', { name: /30일|30 days/i })
        .or(page.locator('button:has-text("30일")'))
        .first()

      if (await filter30d.isVisible({ timeout: 2000 })) {
        await filter30d.click()

        // Should trigger API call with period=30d
        await apiHelper.waitForApi(page, /\/api\/dashboard\/kpi\?.*period=30d/)
      }
    })

    test('should update KPI values when filter changes', async ({ page }) => {
      await page.goto('/dashboard')

      await page.waitForLoadState('networkidle')

      // Get initial spend value
      const initialSpend = await page.locator('text=/₩?[0-9,]+/').first().textContent()

      // Change filter
      const filter30d = page.getByRole('tab', { name: /30일|30 days/i })
        .or(page.locator('button:has-text("30일")'))
        .first()

      if (await filter30d.isVisible({ timeout: 2000 })) {
        await filter30d.click()

        // Wait for update
        await page.waitForTimeout(1000)

        // Spend value should change (mocked to different value)
        const newSpend = await page.locator('text=/₩?[0-9,]+/').first().textContent()
        // Values should be different (7d: 89500, 30d: 200000)
        expect(newSpend).not.toBe(initialSpend)
      }
    })
  })

  test.describe('AI Insights Section', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await page.route('**/api/dashboard/kpi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: MockHelper.kpiData(),
            chartData: [],
          }),
        })
      })

      await page.route('**/api/campaigns/summary**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: [] }),
        })
      })

      // Mock AI insights API
      await page.route('**/api/ai/insights**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ insights: MockHelper.aiInsights() }),
        })
      })
    })

    test('should display AI insights section', async ({ page }) => {
      await page.goto('/dashboard')

      // Should show AI insights heading
      await expect(page.getByText(/AI 인사이트|AI Insights/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show AI insight cards', async ({ page }) => {
      await page.goto('/dashboard')

      const insights = MockHelper.aiInsights()

      // Wait for insights to load
      await page.waitForLoadState('networkidle')

      // Should display first insight
      await expect(page.getByText(insights[0].title)).toBeVisible({ timeout: 5000 })
    })

    test('should display insight priority badges', async ({ page }) => {
      await page.goto('/dashboard')

      await page.waitForLoadState('networkidle')

      // Should show priority indicators
      await expect(page.getByText(/높음|high|중간|medium/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Sync Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await page.route('**/api/dashboard/kpi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: MockHelper.kpiData(),
            chartData: [],
          }),
        })
      })
    })

    test('should have sync button', async ({ page }) => {
      await page.goto('/dashboard')

      const syncButton = page.getByRole('button', { name: /동기화|Sync/i })
        .or(page.locator('button:has(svg.lucide-refresh-cw)'))

      await expect(syncButton).toBeVisible({ timeout: 5000 })
    })

    test('should trigger sync on button click', async ({ page }) => {
      let syncCalled = false

      await page.route('**/api/campaigns/sync', async (route) => {
        syncCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/dashboard')

      const syncButton = page.getByRole('button', { name: /동기화|Sync/i })
        .or(page.locator('button:has(svg.lucide-refresh-cw)'))

      if (await syncButton.isVisible({ timeout: 2000 })) {
        await syncButton.click()

        // Wait for sync API call
        await page.waitForTimeout(1000)

        expect(syncCalled).toBe(true)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle KPI API errors gracefully', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await apiHelper.mockApiError(page, '**/api/dashboard/kpi**', 500, 'Internal Server Error')

      await page.goto('/dashboard')

      // Should show error message
      await expect(page.getByText(/오류|error/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show retry button on error', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await apiHelper.mockApiError(page, '**/api/dashboard/kpi**', 500, 'Server Error')

      await page.goto('/dashboard')

      // Should show retry button
      await expect(page.getByRole('button', { name: /재시도|Retry/i })).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.route('**/api/meta/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ isConnected: true }),
        })
      })

      await page.route('**/api/dashboard/kpi**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: MockHelper.kpiData(),
            chartData: [],
          }),
        })
      })

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/dashboard')

      // KPI cards should stack vertically
      await expect(page.getByText(/광고비|Spend/i)).toBeVisible()
      await expect(page.getByText(/전환|Conversions/i)).toBeVisible()
    })
  })
})
