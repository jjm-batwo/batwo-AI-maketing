import { test, expect } from '@playwright/test'
import { mockReportList, mockCreateReportResponse } from '../fixtures/report'

test.describe('보고서 생성 → 목록 노출', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 인증
    await page.goto('/api/test/mock-auth')
  })

  test('보고서 목록 페이지에 보고서가 표시된다', async ({ page }) => {
    const listData = mockReportList()

    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listData),
      })
    })

    await page.goto('/reports')

    // 보고서 목록 컨테이너 확인
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 10000 })

    // 각 보고서 항목 확인
    for (const report of listData.reports) {
      await expect(page.getByTestId(`report-item-${report.id}`)).toBeVisible()
    }

    // 보고서 유형 라벨 확인
    await expect(page.getByText('주간 보고서').first()).toBeVisible()
    await expect(page.getByText('월간 보고서')).toBeVisible()
  })

  test('GENERATED 상태 보고서에만 다운로드 버튼이 노출된다', async ({ page }) => {
    const listData = mockReportList()

    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listData),
      })
    })

    await page.goto('/reports')

    // GENERATED 보고서 → 다운로드 버튼 있음
    await expect(page.getByTestId('report-download-report-001')).toBeVisible()
    await expect(page.getByTestId('report-download-report-002')).toBeVisible()

    // PENDING 보고서 → 다운로드 버튼 없음
    await expect(page.getByTestId('report-download-report-003')).not.toBeVisible()
  })

  test('보고서 상태 뱃지가 올바르게 표시된다', async ({ page }) => {
    const listData = mockReportList()

    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listData),
      })
    })

    await page.goto('/reports')

    await expect(page.getByText('생성 완료').first()).toBeVisible()
    await expect(page.getByText('생성 중')).toBeVisible()
  })

  test('보고서가 없으면 빈 상태가 표시된다', async ({ page }) => {
    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reports: [], total: 0, page: 1, pageSize: 10 }),
      })
    })

    await page.goto('/reports')

    await expect(page.getByTestId('report-empty-state')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('아직 보고서가 없어요')).toBeVisible()
  })

  test('보고서 생성 API 호출 후 목록이 갱신되어 새 보고서가 노출된다', async ({ page }) => {
    const listData = mockReportList()
    const newReport = mockCreateReportResponse()

    let callCount = 0
    await page.route('**/api/reports', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newReport),
        })
      } else {
        callCount++
        const reports = callCount === 1
          ? listData
          : {
              ...listData,
              reports: [
                {
                  id: newReport.id,
                  type: newReport.type,
                  status: newReport.status,
                  dateRange: newReport.dateRange,
                  generatedAt: newReport.generatedAt,
                  campaignCount: 3,
                },
                ...listData.reports,
              ],
              total: listData.total + 1,
            }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(reports),
        })
      }
    })

    await page.goto('/reports')
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 10000 })

    // 초기 목록에는 새 보고서 없음
    await expect(page.getByTestId(`report-item-${newReport.id}`)).not.toBeVisible()

    // 보고서 생성 API 호출 트리거
    const postResponse = await page.request.post('/api/reports', {
      data: { type: 'WEEKLY', dateRange: newReport.dateRange },
    })
    expect(postResponse.status()).toBe(201)

    // 페이지 새로고침하여 갱신된 목록 확인
    await page.reload()
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId(`report-item-${newReport.id}`)).toBeVisible()
  })

  test('보고서 목록에서 상세 페이지로 이동한다', async ({ page }) => {
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

    // 첫 번째 보고서의 상세 링크 클릭
    await page.getByTestId('report-detail-link-report-001').click()
    await expect(page).toHaveURL(/\/reports\/report-001/, { timeout: 10000 })
  })
})
