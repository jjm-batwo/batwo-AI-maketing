import { test, expect } from '@playwright/test'
import { mockReportDetail } from '../fixtures/report'

test.describe('보고서 상세 조회 + Enhanced 9개 섹션 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('보고서 상세 페이지가 렌더링된다', async ({ page }) => {
    const detail = mockReportDetail('report-001')

    await page.route('**/api/reports/report-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.goto('/reports/report-001')

    // 보고서 상세 컨테이너
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // 헤더 정보
    await expect(page.getByTestId('report-detail-header')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: /주간 성과 보고서/ })).toBeVisible()

    // 날짜 범위
    await expect(page.getByText('2026-03-10 ~ 2026-03-16')).toBeVisible()
  })

  test('Enhanced 9개 섹션이 모두 렌더링된다', async ({ page }) => {
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

    // Enhanced sections 컨테이너
    await expect(page.getByTestId('report-enhanced-sections')).toBeVisible()

    // 9개 섹션 확인
    const sectionTestIds = [
      'section-overall-summary',
      'section-daily-trend',
      'section-campaign-performance',
      'section-creative-performance',
      'section-creative-fatigue',
      'section-format-comparison',
      'section-funnel-performance',
      'section-performance-analysis',
      'section-recommendations',
    ]

    for (const testId of sectionTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  test('Enhanced 데이터가 없으면 Basic View가 렌더링된다', async ({ page }) => {
    const detail = mockReportDetail('report-001')
    // Enhanced 섹션 제거
    delete detail.overallSummary
    delete detail.dailyTrend
    delete detail.campaignPerformance
    delete detail.creativePerformance
    delete detail.creativeFatigue
    delete detail.formatComparison
    delete detail.funnelPerformance
    delete detail.performanceAnalysis
    delete detail.recommendations

    await page.route('**/api/reports/report-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // Enhanced sections 없음
    await expect(page.getByTestId('report-enhanced-sections')).not.toBeVisible()

    // Basic view: KPI 카드, AI 인사이트 확인
    await expect(page.getByText('ROAS')).toBeVisible()
    await expect(page.getByText('AI 인사이트')).toBeVisible()
    await expect(page.getByText('ROAS가 지난주 대비 15% 상승했습니다.')).toBeVisible()
  })

  test('다운로드, 공유 버튼이 헤더에 표시된다', async ({ page }) => {
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

    await expect(page.getByTestId('report-download-btn')).toBeVisible()
    await expect(page.getByTestId('share-report-btn')).toBeVisible()
  })

  test('뒤로가기 버튼이 /reports로 이동한다', async ({ page }) => {
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

    // 뒤로가기 버튼 클릭
    await page.getByRole('link', { name: /뒤로가기/ }).click()
    await expect(page).toHaveURL(/\/reports$/, { timeout: 10000 })
  })
})
