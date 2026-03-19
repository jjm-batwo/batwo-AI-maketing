import { test, expect } from '@playwright/test'
import { mockReportDetail, mockReportList } from '../fixtures/report'
import { DownloadHelper } from '../helpers/download.helper'

test.describe('보고서 PDF 다운로드', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('보고서 상세에서 PDF 다운로드 시 content-type이 application/pdf이다', async ({ page }) => {
    const detail = mockReportDetail('report-001')

    await page.route('**/api/reports/report-001', async (route) => {
      if (route.request().url().includes('/download')) return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    // Mock PDF 다운로드 응답
    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload(
      '**/api/reports/report-001/download',
      '주간_성과_보고서_2026-03-10_2026-03-16.pdf'
    )

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // 다운로드 응답 캡처 시작
    await downloadHelper.startListening(/\/api\/reports\/report-001\/download/)

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
    const listData = mockReportList()

    await page.route('**/api/reports?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(listData),
      })
    })

    // Mock PDF 다운로드
    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload('**/api/reports/report-001/download', 'report.pdf')

    await page.goto('/reports')
    await expect(page.getByTestId('report-list')).toBeVisible({ timeout: 10000 })

    // 다운로드 응답 캡처
    await downloadHelper.startListening(/\/api\/reports\/report-001\/download/)

    // 목록의 다운로드 버튼 클릭
    await page.getByTestId('report-download-report-001').click()

    const capture = await downloadHelper.waitForDownload()
    expect(capture.status).toBe(200)
    expect(capture.contentType).toBe('application/pdf')
  })

  test('다운로드 응답의 Content-Length가 0보다 크다', async ({ page }) => {
    const detail = mockReportDetail('report-001')

    await page.route('**/api/reports/report-001', async (route) => {
      if (route.request().url().includes('/download')) return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload('**/api/reports/report-001/download', 'report.pdf')

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    await downloadHelper.startListening(/\/api\/reports\/report-001\/download/)
    await page.getByTestId('report-download-btn').click()

    const capture = await downloadHelper.waitForDownload()
    expect(capture.contentLength).toBeGreaterThan(0)
    expect(capture.bodySize).toBeGreaterThan(0)
  })
})
