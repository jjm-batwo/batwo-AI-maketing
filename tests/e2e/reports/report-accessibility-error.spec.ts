import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockReportDetail, mockReportList } from '../fixtures/report'

test.describe('보고서 접근성 검증 (@axe-core/playwright)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('보고서 목록 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    const listData = mockReportList()

    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listData),
      })
    })

    await page.goto('/reports')
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('보고서 상세 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    const detail = mockReportDetail('report-001')

    await page.route('**/api/reports/report-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('샘플 보고서 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    await page.goto('/reports/sample')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe('보고서 에러 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('존재하지 않는 보고서 ID로 접근하면 404 처리된다', async ({ page }) => {
    await page.route('**/api/reports/nonexistent-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: '보고서를 찾을 수 없습니다' }),
      })
    })

    await page.goto('/reports/nonexistent-id')

    // 404 → Next.js notFound() 또는 에러 메시지 표시
    await expect(
      page.getByText(/보고서를 찾을 수 없습니다|Not Found|404/)
    ).toBeVisible({ timeout: 10000 })
  })

  test('만료된 공유 토큰으로 접근하면 만료 안내가 표시된다', async ({ page }) => {
    await page.route('**/api/reports/share/expired-token-123', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Share link has expired' }),
      })
    })

    await page.goto('/reports/share/expired-token-123')

    // UI에서 만료 안내 메시지 확인
    await expect(
      page.getByText(/만료|expired|유효하지 않/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('잘못된 공유 토큰으로 접근하면 에러가 표시된다', async ({ page }) => {
    await page.route('**/api/reports/share/invalid-token', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Report not found or invalid token' }),
      })
    })

    await page.goto('/reports/share/invalid-token')

    // UI에서 에러 메시지 확인
    await expect(
      page.getByText(/찾을 수 없|not found|404|유효하지 않/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('보고서 목록 API 실패 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    })

    await page.goto('/reports')

    // 에러 메시지 확인
    await expect(
      page.getByText(/보고서를 불러오는데 실패했습니다|오류/)
    ).toBeVisible({ timeout: 10000 })
  })

  test('인증되지 않은 사용자는 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    // 인증 없이 직접 접근
    await page.context().clearCookies()

    await page.goto('/reports')

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
