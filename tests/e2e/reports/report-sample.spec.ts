import { test, expect } from '@playwright/test'
import { DownloadHelper } from '../helpers/download.helper'

// 샘플 보고서 페이지는 force-static — DB 시딩 불필요
// 단, (dashboard) layout 인증이 필요하므로 beforeEach에서 mock-auth 호출
test.describe('샘플 보고서 조회 + 다운로드', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/mock-auth')
  })

  test('샘플 보고서 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/reports/sample')

    // 샘플 보고서 제목
    await expect(
      page.getByRole('heading', { level: 1, name: /주간 성과 보고서/ })
    ).toBeVisible({ timeout: 10000 })

    // 예시 보고서 뱃지
    await expect(page.getByText('예시 보고서', { exact: true }).first()).toBeVisible()

    // 예시 데이터 안내 텍스트
    await expect(page.getByText(/이 보고서는 예시 데이터로 생성되었습니다/)).toBeVisible()
  })

  test('KPI 카드가 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')

    await expect(page.getByRole('heading', { name: 'ROAS' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: '총 지출' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '전환수' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CTR' })).toBeVisible()
  })

  test('AI 인사이트 섹션이 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')

    await expect(page.getByText('AI 인사이트')).toBeVisible({ timeout: 10000 })

    // 인사이트 유형별 라벨 확인
    await expect(page.getByText('성과 우수').first()).toBeVisible()
  })

  test('캠페인별 성과 섹션이 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')

    await expect(page.getByText('캠페인별 성과')).toBeVisible({ timeout: 10000 })
  })

  test('AI 추천 액션 섹션이 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')

    await expect(page.getByText('AI 추천 액션')).toBeVisible({ timeout: 10000 })
  })

  test('뒤로가기 버튼이 /reports로 이동한다', async ({ page }) => {
    await page.goto('/reports/sample')

    await page.getByRole('link', { name: /뒤로가기/ }).click()
    await expect(page).toHaveURL(/\/reports/, { timeout: 10000 })
  })

  test('PDF 다운로드 버튼이 동작한다', async ({ page }) => {
    // 샘플 다운로드는 클라이언트 사이드 fetch → page.route()로 인터셉트
    const downloadHelper = new DownloadHelper(page)
    await downloadHelper.mockPdfDownload(
      '**/api/reports/sample/download*',
      '바투_예시_주간리포트.pdf'
    )

    await page.goto('/reports/sample')
    await expect(page.getByTestId('sample-download-btn')).toBeVisible({ timeout: 10000 })

    // 다운로드 응답 캡처
    await downloadHelper.startListening(/\/api\/reports\/sample\/download/)

    // PDF 다운로드 버튼 클릭
    await page.getByTestId('sample-download-btn').click()

    const capture = await downloadHelper.waitForDownload()
    expect(capture.status).toBe(200)
    expect(capture.contentType).toBe('application/pdf')
  })

  test('예시 보고서에서 공유 버튼 클릭 시 안내 메시지가 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')
    await expect(page.getByTestId('sample-share-btn')).toBeVisible({ timeout: 10000 })

    // alert 다이얼로그 캡처 — waitForEvent 먼저 등록, click은 non-blocking으로 실행
    const dialogPromise = page.waitForEvent('dialog')
    void page.getByTestId('sample-share-btn').click()

    const dialog = await dialogPromise
    expect(dialog.message()).toContain('예시 보고서는 공유할 수 없습니다')
    await dialog.accept()
  })

  test('푸터에 가상 데이터 안내가 표시된다', async ({ page }) => {
    await page.goto('/reports/sample')

    await expect(page.getByText(/플로라 뷰티/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/실시간 데이터로 보고서가 생성됩니다/)).toBeVisible()
  })
})
