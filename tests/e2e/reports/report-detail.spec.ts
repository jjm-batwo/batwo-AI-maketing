import { test, expect } from '@playwright/test'

interface SeedReports {
  weeklyGenerated: { id: string; type: string; status: string }
  monthlyGenerated: { id: string; type: string; status: string }
  weeklyPending: { id: string; type: string; status: string }
  withShareToken: { id: string; shareToken: string; type: string; status: string }
}

interface SeedData {
  reports: SeedReports
  userId: string
}

test.describe.serial('보고서 상세 조회 + Enhanced 9개 섹션 렌더링', () => {
  let seedData: SeedData

  test.beforeAll(async ({ request }) => {
    const seedResponse = await request.get('/api/test/seed-reports')
    expect(seedResponse.ok()).toBeTruthy()
    const body = await seedResponse.json()
    seedData = body.data
  })

  test.afterAll(async ({ request }) => {
    await request.delete('/api/test/seed-reports')
  })

  test('보고서 상세 페이지가 렌더링된다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto(`/reports/${reportId}`)

    // 보고서 상세 컨테이너
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    // 헤더 정보
    await expect(page.getByTestId('report-detail-header')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: /주간 성과 보고서/ })).toBeVisible()
  })

  test('Enhanced 9개 섹션이 모두 렌더링된다', async ({ page }) => {
    // weeklyGenerated 보고서는 enrichedData(enhanced sections)를 포함함
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

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
    // monthlyGenerated 보고서는 enrichedData 없이 생성됨 (Basic View 확인용)
    const reportId = seedData.reports.monthlyGenerated.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    // Enhanced sections 없음
    await expect(page.getByTestId('report-enhanced-sections')).not.toBeVisible()

    // Basic view: KPI 카드, AI 인사이트 확인
    await expect(page.getByRole('heading', { name: 'ROAS' })).toBeVisible()
    await expect(page.getByText('AI 인사이트')).toBeVisible()
  })

  test('다운로드, 공유 버튼이 헤더에 표시된다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    await expect(page.getByTestId('report-download-btn')).toBeVisible()
    await expect(page.getByTestId('share-report-btn')).toBeVisible()
  })

  test('뒤로가기 버튼이 /reports로 이동한다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    // 뒤로가기 버튼 클릭
    await page.getByRole('link', { name: /뒤로가기/ }).click()
    await expect(page).toHaveURL(/\/reports$/, { timeout: 10000 })
  })
})
