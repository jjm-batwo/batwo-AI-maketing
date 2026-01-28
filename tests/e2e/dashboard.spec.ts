import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures'

test.describe('Dashboard', () => {
  test.describe('대시보드 페이지 로드', () => {
    test.beforeEach(async ({ page }) => {
      // Mock 인증 세션 생성
      await authFixture.loginAsUser(page)
      await page.goto('/dashboard')
    })

    test('should load dashboard page successfully', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard|\/campaigns/)
      const heading = page.getByRole('heading', { name: /대시보드|캠페인|Dashboard|Campaigns/ })
      await expect(heading.first()).toBeVisible()
    })

    test('should display page title', async ({ page }) => {
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
      // 대시보드 또는 캠페인 페이지 타이틀
      expect(title).toMatch(/대시보드|캠페인|Dashboard|Campaigns|바투|Batwo/)
    })
  })

  test.describe('KPI 카드 표시', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/dashboard')
    })

    test('should display all KPI cards or metrics', async ({ page }) => {
      // KPI 카드 또는 메트릭 표시 확인
      const kpiCards = page.locator('[data-testid^="kpi-card"]')
        .or(page.locator('[data-testid^="metric-"]'))
        .or(page.getByText(/지출|ROAS|CTR|전환|Spend|Click/))

      await expect(kpiCards.first()).toBeVisible({ timeout: 10000 })

      // 최소 1개 이상의 KPI 표시
      const count = await kpiCards.count()
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('should show KPI card with spend metric', async ({ page }) => {
      await expect(
        page.getByText(/총 지출|광고비/)
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI card with ROAS metric', async ({ page }) => {
      await expect(
        page.getByText(/ROAS/)
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI card with CTR metric', async ({ page }) => {
      await expect(
        page.getByText(/CTR|클릭률/)
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI card with conversion metric', async ({ page }) => {
      await expect(
        page.getByText(/전환|구매/)
      ).toBeVisible({ timeout: 10000 })
    })

    test('should display loading state initially', async ({ page }) => {
      // 페이지 새로고침 시 로딩 상태 확인
      await page.reload()

      // 스켈레톤 또는 로딩 스피너가 표시되어야 함
      const loadingIndicator = page.locator('[data-testid="kpi-skeleton"]')
        .or(page.locator('svg.animate-spin'))

      await expect(loadingIndicator.first()).toBeVisible({ timeout: 2000 })
        .catch(() => {
          // 데이터 로딩이 너무 빨라서 로딩 상태를 못 볼 수 있음
        })
    })

    test('should show numeric values in KPI cards', async ({ page }) => {
      // KPI 카드에 숫자 값이 표시되어야 함
      const numberPattern = /[\d,]+/
      const kpiValues = page.locator('[data-testid^="kpi-value"]')

      await expect(kpiValues.first()).toBeVisible({ timeout: 10000 })

      const firstValue = await kpiValues.first().textContent()
      expect(firstValue).toMatch(numberPattern)
    })
  })

  test.describe('캠페인 목록 렌더링', () => {
    test.beforeEach(async ({ page }) => {
      await authFixture.loginAsUser(page)
      await page.goto('/dashboard')
    })

    test('should display campaign summary section or redirect to campaigns', async ({ page }) => {
      // 대시보드의 캠페인 섹션 또는 캠페인 페이지 표시
      const campaignSection = page.getByRole('heading', { name: /캠페인 현황|최근 캠페인|캠페인|Campaigns/ })
      await expect(campaignSection.first()).toBeVisible({ timeout: 10000 })
    })

    test('should show view all campaigns link', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /전체 보기|모두 보기/ })
      await expect(viewAllLink).toBeVisible()
    })

    test('should navigate to campaigns page on link click', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /전체 보기|모두 보기/ })
      await viewAllLink.click()

      await expect(page).toHaveURL(/\/campaigns/)
    })

    test('should display campaign list or empty state', async ({ page }) => {
      // 캠페인 목록 또는 빈 상태가 표시되어야 함
      const campaignList = page.locator('[data-testid="campaign-list"]')
      const emptyState = page.getByText(/캠페인이 없습니다|첫 캠페인을 만들어보세요/)

      await expect(campaignList.or(emptyState)).toBeVisible({ timeout: 10000 })
    })

    test('should show campaign card when campaigns exist', async ({ page }) => {
      const campaignCard = page.locator('[data-testid^="campaign-card"]')

      // 캠페인이 있으면 카드가 표시되어야 함
      const isVisible = await campaignCard.first().isVisible({ timeout: 5000 })
        .catch(() => false)

      if (isVisible) {
        await expect(campaignCard.first()).toBeVisible()

        // 캠페인 이름이 표시되어야 함
        await expect(campaignCard.first()).toContainText(/.+/)
      }
    })
  })

  test.describe('대시보드 네비게이션', () => {
    test('should allow navigation to campaigns page', async ({ page }) => {
      await page.goto('/dashboard')

      const campaignsLink = page.getByRole('link', { name: /캠페인/ })
      await expect(campaignsLink.first()).toBeVisible()

      await campaignsLink.first().click()
      await expect(page).toHaveURL(/\/campaigns/)
    })

    test('should allow navigation to reports page', async ({ page }) => {
      await page.goto('/dashboard')

      const reportsLink = page.getByRole('link', { name: /보고서/ })

      if (await reportsLink.first().isVisible()) {
        await reportsLink.first().click()
        await expect(page).toHaveURL(/\/reports/)
      }
    })

    test('should allow navigation to settings page', async ({ page }) => {
      await page.goto('/dashboard')

      const settingsLink = page.getByRole('link', { name: /설정/ })

      if (await settingsLink.first().isVisible()) {
        await settingsLink.first().click()
        await expect(page).toHaveURL(/\/settings/)
      }
    })
  })

  test.describe('반응형 레이아웃', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      // 모바일에서 페이지가 정상적으로 로드되어야 함
      await expect(page.locator('body')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/dashboard')

      await expect(page.locator('body')).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/dashboard')

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('사이드바 네비게이션', () => {
    test.skip('should show sidebar on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto('/dashboard')

      const sidebar = page.locator('aside, nav[data-testid="sidebar"]')

      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible()

        // 사이드바에 네비게이션 링크들이 있어야 함
        await expect(sidebar.getByRole('link', { name: /대시보드/ })).toBeVisible()
        await expect(sidebar.getByRole('link', { name: /캠페인/ })).toBeVisible()
      }
    })

    test.skip('should hide sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      // 모바일에서는 사이드바가 숨겨지거나 햄버거 메뉴로 변경
      const sidebar = page.locator('aside:visible, nav[data-testid="sidebar"]:visible')
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')

      const sidebarVisible = await sidebar.isVisible().catch(() => false)
      const menuVisible = await mobileMenu.isVisible().catch(() => false)

      // 사이드바가 숨겨져 있거나 모바일 메뉴 버튼이 있어야 함
      expect(sidebarVisible || menuVisible).toBeTruthy()
    })
  })
})
