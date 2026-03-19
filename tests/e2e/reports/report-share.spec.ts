import { test, expect } from '@playwright/test'
import { mockReportDetail, mockShareResponse, mockSharedReportResponse } from '../fixtures/report'

test.describe('보고서 공유: 생성 → 토큰 접근 → 해제', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('공유 링크를 생성할 수 있다', async ({ page }) => {
    const detail = mockReportDetail('report-001')
    const shareRes = mockShareResponse('report-001')

    await page.route('**/api/reports/report-001', async (route) => {
      if (route.request().url().includes('/share')) return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.route('**/api/reports/report-001/share', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(shareRes),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // 공유 버튼 클릭 → 다이얼로그 열림
    await page.getByTestId('share-report-btn').click()
    await expect(page.getByText('보고서 공유')).toBeVisible({ timeout: 5000 })

    // 공유 링크 생성 버튼 클릭
    await page.getByTestId('share-generate-btn').click()

    // 토스트 메시지 확인 (공유 링크 생성 성공)
    await expect(page.getByText(/공유 링크가 생성되었습니다/)).toBeVisible({ timeout: 5000 })
  })

  test('공유 토큰으로 보고서에 접근할 수 있다', async ({ page }) => {
    const sharedReport = mockSharedReportResponse()

    await page.route('**/api/reports/share/test-share-token-abc123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sharedReport),
      })
    })

    // 공유 토큰으로 직접 접근 (인증 없이)
    await page.goto('/reports/share/test-share-token-abc123')

    // 공유 뷰어 페이지가 렌더링될 때까지 대기 (testId 기반)
    await expect(
      page.getByTestId('shared-report-viewer').or(page.getByTestId('report-detail'))
    ).toBeVisible({ timeout: 10000 })

    // API 응답 확인
    const apiResponse = await page.request.get('/api/reports/share/test-share-token-abc123')
    expect(apiResponse.status()).toBe(200)
    const body = await apiResponse.json()
    expect(body).toBeTruthy()
  })

  test('기존 공유 링크가 있으면 URL과 해제 버튼이 표시된다', async ({ page }) => {
    const detail = mockReportDetail('report-001')
    const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    detail.shareToken = 'existing-token-xyz'
    detail.shareExpiresAt = shareExpiresAt

    await page.route('**/api/reports/report-001', async (route) => {
      if (route.request().url().includes('/share')) return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // 공유 버튼 클릭
    await page.getByTestId('share-report-btn').click()
    await expect(page.getByText('보고서 공유')).toBeVisible({ timeout: 5000 })

    // 기존 공유 URL이 표시됨
    await expect(page.getByTestId('share-url-input')).toBeVisible()

    // 복사 버튼과 해제 버튼 확인
    await expect(page.getByTestId('share-copy-btn')).toBeVisible()
    await expect(page.getByTestId('share-revoke-btn')).toBeVisible()
  })

  test('공유 링크를 해제할 수 있다', async ({ page }) => {
    const detail = mockReportDetail('report-001')
    const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    detail.shareToken = 'existing-token-xyz'
    detail.shareExpiresAt = shareExpiresAt

    await page.route('**/api/reports/report-001', async (route) => {
      if (route.request().url().includes('/share')) return route.continue()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
    })

    await page.route('**/api/reports/report-001/share', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/reports/report-001')
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 10000 })

    // 공유 다이얼로그 열기
    await page.getByTestId('share-report-btn').click()
    await expect(page.getByTestId('share-revoke-btn')).toBeVisible({ timeout: 5000 })

    // confirm 다이얼로그 자동 수락
    page.on('dialog', (dialog) => dialog.accept())

    // 링크 해제 클릭
    await page.getByTestId('share-revoke-btn').click()

    // 토스트: 공유 링크 취소 확인
    await expect(page.getByText(/공유 링크가 취소되었습니다/)).toBeVisible({ timeout: 5000 })
  })

})
