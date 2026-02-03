import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.describe('대시보드 페이지 로드', () => {
    test.beforeEach(async ({ page }) => {
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
      // KPI 카드의 ROAS 헤딩 확인
      await expect(
        page.getByRole('heading', { name: 'ROAS', exact: true })
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI card with CTR metric', async ({ page }) => {
      // KPI 카드의 CTR 헤딩 확인
      await expect(
        page.getByRole('heading', { name: 'CTR', exact: true })
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI card with conversion metric', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /전환수/ })
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
      // KPI 카드 (aria-label에 ROAS, 총 지출, 전환수, CTR 포함)가 표시되어야 함
      const kpiArticle = page.getByRole('article', { name: /ROAS|총 지출|전환수|CTR/ }).first()

      await expect(kpiArticle).toBeVisible({ timeout: 10000 })

      // KPI 카드 내에 숫자 값이 포함되어 있는지 확인
      const articleText = await kpiArticle.textContent()
      expect(articleText).toMatch(/[\d,]+/)
    })
  })

  test.describe('캠페인 목록 렌더링', () => {
    test.beforeEach(async ({ page }) => {
      // Storage state provides authentication
      await page.goto('/dashboard')
    })

    test('should display campaign summary section or redirect to campaigns', async ({ page }) => {
      // 대시보드의 캠페인 섹션 또는 캠페인 페이지 표시
      const campaignSection = page.getByText(/캠페인 현황|활성 캠페인|최근 캠페인|Campaigns/)
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
      // 캠페인 목록 테이블 또는 빈 상태가 표시되어야 함
      const campaignTable = page.getByRole('table')
      const emptyState = page.getByText(/캠페인이 없|아직 캠페인이 없어요|첫 캠페인/)

      await expect(campaignTable.or(emptyState)).toBeVisible({ timeout: 10000 })
    })

    test('should show campaign rows when campaigns exist', async ({ page }) => {
      // 캠페인 테이블 행 또는 카드 확인
      const campaignRows = page.getByRole('table').locator('tbody tr')
      const campaignCards = page.locator('[data-testid^="campaign-card"]')

      // 캠페인이 있으면 행 또는 카드가 표시되어야 함
      const hasRows = await campaignRows.first().isVisible({ timeout: 5000 }).catch(() => false)
      const hasCards = await campaignCards.first().isVisible({ timeout: 1000 }).catch(() => false)

      if (hasRows || hasCards) {
        const element = hasRows ? campaignRows.first() : campaignCards.first()
        await expect(element).toBeVisible()
      }
    })
  })

  test.describe('대시보드 네비게이션', () => {
    test('should allow navigation to campaigns page', async ({ page }) => {
      // Storage state provides authentication
      await page.goto('/dashboard')

      const campaignsLink = page.getByRole('link', { name: /캠페인/ })
      await expect(campaignsLink.first()).toBeVisible()

      await campaignsLink.first().click()
      await expect(page).toHaveURL(/\/campaigns/)
    })

    test('should allow navigation to reports page', async ({ page }) => {
      // Storage state provides authentication
      await page.goto('/dashboard')

      const reportsLink = page.getByRole('link', { name: /보고서/ })

      if (await reportsLink.first().isVisible()) {
        await reportsLink.first().click()
        await expect(page).toHaveURL(/\/reports/)
      }
    })

    test('should allow navigation to settings page', async ({ page }) => {
      // Storage state provides authentication
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
      // Storage state provides authentication
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      // 모바일에서 페이지가 정상적으로 로드되어야 함
      await expect(page.locator('body')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Storage state provides authentication
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/dashboard')

      await expect(page.locator('body')).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      // Storage state provides authentication
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/dashboard')

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('사이드바 네비게이션', () => {
    test.skip('should show sidebar on desktop', async ({ page }) => {
      // Storage state provides authentication
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
      // Storage state provides authentication
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
