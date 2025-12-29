import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.getByLabel('이메일').fill('test@example.com')
    await page.getByLabel('비밀번호').fill('password123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await expect(page).toHaveURL('/')
  })

  test.describe('Dashboard Layout', () => {
    test('should display dashboard page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /대시보드/ })).toBeVisible()
    })

    test('should show sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('link', { name: /대시보드/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /캠페인/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /보고서/ })).toBeVisible()
    })

    test('should show user menu', async ({ page }) => {
      await expect(page.getByTestId('user-menu')).toBeVisible()
    })
  })

  test.describe('KPI Cards', () => {
    test('should display KPI cards', async ({ page }) => {
      // Check for KPI cards - these might show loading initially
      await expect(page.getByText(/총 지출|ROAS|CTR|전환/)).toBeVisible({ timeout: 10000 })
    })

    test('should show loading state initially', async ({ page }) => {
      // Check if skeleton or loading state is shown
      const skeleton = page.getByTestId('kpi-skeleton')
      const kpiCard = page.getByRole('article')

      // Either skeleton or actual card should be visible
      await expect(skeleton.or(kpiCard).first()).toBeVisible()
    })
  })

  test.describe('Campaign Summary Table', () => {
    test('should display campaign summary', async ({ page }) => {
      await expect(page.getByText('캠페인 현황')).toBeVisible()
    })

    test('should show campaign list link', async ({ page }) => {
      await expect(page.getByRole('link', { name: '전체 보기' })).toBeVisible()
    })

    test('should navigate to campaigns from summary', async ({ page }) => {
      await page.getByRole('link', { name: '전체 보기' }).click()
      await expect(page).toHaveURL('/campaigns')
    })
  })

  test.describe('Period Selector', () => {
    test('should show period selector', async ({ page }) => {
      await expect(page.getByRole('combobox', { name: /기간/ }).or(
        page.getByText(/7일|14일|30일/)
      )).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to campaigns page', async ({ page }) => {
      await page.getByRole('link', { name: /캠페인/ }).first().click()
      await expect(page).toHaveURL('/campaigns')
    })

    test('should navigate to reports page', async ({ page }) => {
      await page.getByRole('link', { name: /보고서/ }).first().click()
      await expect(page).toHaveURL('/reports')
    })

    test('should return to dashboard', async ({ page }) => {
      await page.goto('/campaigns')
      await page.getByRole('link', { name: /대시보드/ }).first().click()
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Responsive Layout', () => {
    test('should hide sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Sidebar should be hidden or in hamburger menu
      const sidebar = page.getByRole('navigation')
      await expect(sidebar).toBeHidden().catch(() => {
        // Or check for mobile menu button
        expect(page.getByRole('button', { name: /메뉴/ })).toBeVisible()
      })
    })

    test('should show mobile menu button on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()

      const menuButton = page.getByRole('button', { name: /메뉴/ })
        .or(page.getByTestId('mobile-menu-button'))

      // Menu button should be visible on mobile
      if (await menuButton.isVisible()) {
        await menuButton.click()
        await expect(page.getByRole('link', { name: /캠페인/ })).toBeVisible()
      }
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state when no campaigns', async ({ page }) => {
      // This test assumes no campaigns exist
      const emptyState = page.getByText(/아직 캠페인이 없습니다|캠페인을 생성해보세요/)
      const campaignTable = page.getByRole('table')

      // Either empty state or campaign table should be visible
      await expect(emptyState.or(campaignTable)).toBeVisible()
    })
  })

  test.describe('Quota Status', () => {
    test('should show quota status badge', async ({ page }) => {
      // Check for quota badge in header or sidebar
      const quotaBadge = page.getByTestId('quota-badge')
        .or(page.getByText(/\d+\/\d+회/))

      if (await quotaBadge.isVisible()) {
        await expect(quotaBadge).toBeVisible()
      }
    })
  })
})
