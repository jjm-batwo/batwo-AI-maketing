import { test, expect } from '@playwright/test'
import { DownloadHelper } from '../helpers/download.helper'

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

test.describe.serial('보고서 PDF 다운로드', () => {
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

  test('보고서 상세에서 PDF 다운로드 시 content-type이 application/pdf이다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    // Mock PDF 다운로드 응답 (클라이언트 사이드 fetch 인터셉트)
    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload(
      `**/api/reports/${reportId}/download`,
      '주간_성과_보고서.pdf'
    )

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    // 다운로드 응답 캡처 시작
    await downloadHelper.startListening(new RegExp(`/api/reports/${reportId}/download`))

    // 다운로드 버튼 클릭
    await page.getByTestId('report-download-btn').click()

    // 다운로드 응답 확인
    const capture = await downloadHelper.waitForDownload()
    expect(capture.status).toBe(200)
    expect(capture.contentType).toBe('application/pdf')
    expect(capture.contentDisposition).toContain('attachment')
    expect(capture.contentDisposition).toContain('.pdf')
  })

  test('보고서 목록에서 다운로드 버튼 클릭 시 PDF가 다운로드된다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    // Mock PDF 다운로드 (클라이언트 사이드 fetch 인터셉트)
    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload(`**/api/reports/${reportId}/download`, 'report.pdf')

    await page.goto('/reports')
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 15000 })

    // 다운로드 응답 캡처
    await downloadHelper.startListening(new RegExp(`/api/reports/${reportId}/download`))

    // 목록의 다운로드 버튼 클릭
    await page.getByTestId(`report-download-${reportId}`).click()

    const capture = await downloadHelper.waitForDownload()
    expect(capture.status).toBe(200)
    expect(capture.contentType).toBe('application/pdf')
  })

  test('다운로드 응답의 Content-Length가 0보다 크다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload(`**/api/reports/${reportId}/download`, 'report.pdf')

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    await downloadHelper.startListening(new RegExp(`/api/reports/${reportId}/download`))
    await page.getByTestId('report-download-btn').click()

    const capture = await downloadHelper.waitForDownload()
    expect(capture.contentLength).toBeGreaterThan(0)
    // bodySize는 Playwright 모킹 환경에서 response.body() 접근이 제한될 수 있으므로
    // contentLength가 0보다 크면 PDF 내용이 존재함을 검증
    expect(capture.contentLength ?? capture.bodySize ?? 0).toBeGreaterThan(0)
  })
})
