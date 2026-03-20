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

test.describe.serial('보고서 공유: 생성 → 토큰 접근 → 해제', () => {
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

  test('공유 링크를 생성할 수 있다', async ({ page }) => {
    // monthlyGenerated 보고서는 shareToken 없음 → share-generate-btn이 표시됨
    const reportId = seedData.reports.monthlyGenerated.id

    // 공유 생성/해제는 클라이언트 사이드 fetch 호출 → page.route()로 인터셉트
    await page.route(`**/api/reports/${reportId}/share`, async (route) => {
      if (route.request().method() === 'POST') {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            shareToken: 'new-share-token-e2e',
            shareExpiresAt: expiresAt,
            shareUrl: `http://localhost:3000/reports/share/new-share-token-e2e`,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    // 공유 버튼 클릭 → 다이얼로그 열림
    await page.getByTestId('share-report-btn').click()
    await expect(page.getByText('보고서 공유')).toBeVisible({ timeout: 5000 })

    // 공유 링크 생성 버튼 클릭
    await page.getByTestId('share-generate-btn').click()

    // 토스트 메시지 확인 (공유 링크 생성 성공)
    await expect(page.getByText(/공유 링크가 생성되었습니다/)).toBeVisible({ timeout: 5000 })
  })

  test('공유 토큰으로 보고서에 접근할 수 있다', async ({ page }) => {
    // 시드된 withShareToken 보고서의 토큰으로 접근 (실제 DB에 저장된 데이터)
    const shareToken = seedData.reports.withShareToken.shareToken

    // 공유 페이지는 공개 접근 — 인증 불필요
    await page.goto(`/reports/share/${shareToken}`)

    // 공유 뷰어 페이지가 렌더링될 때까지 대기
    await expect(
      page.getByTestId('shared-report-viewer').or(page.getByTestId('report-detail')).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('기존 공유 링크가 있으면 URL과 해제 버튼이 표시된다', async ({ page }) => {
    // withShareToken 보고서 — 이미 shareToken이 DB에 존재
    const reportId = seedData.reports.withShareToken.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

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
    const reportId = seedData.reports.withShareToken.id

    // 해제는 클라이언트 사이드 DELETE fetch → page.route()로 인터셉트
    await page.route(`**/api/reports/${reportId}/share`, async (route) => {
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

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

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
