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

test.describe.serial('보고서 생성 → 목록 노출', () => {
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

  test('보고서 목록 페이지에 보고서가 표시된다', async ({ page }) => {
    await page.goto('/reports')
    // 캐시된 응답을 피하기 위해 리로드 (ISR revalidate: 120 캐시 우회)
    await page.reload()

    // 보고서 목록 컨테이너 확인
    await expect(page.getByTestId('report-list').first()).toBeVisible({ timeout: 15000 })

    // 시드된 보고서 항목 확인
    await expect(page.getByTestId(`report-item-${seedData.reports.weeklyGenerated.id}`)).toBeVisible()
    await expect(page.getByTestId(`report-item-${seedData.reports.monthlyGenerated.id}`)).toBeVisible()
    await expect(page.getByTestId(`report-item-${seedData.reports.weeklyPending.id}`)).toBeVisible()

    // 보고서 유형 라벨 확인
    await expect(page.getByText('주간 보고서').first()).toBeVisible()
    await expect(page.getByText('월간 보고서').first()).toBeVisible()
  })

  test('GENERATED 상태 보고서에만 다운로드 버튼이 노출된다', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByTestId('report-list').first()).toBeVisible({ timeout: 15000 })

    // GENERATED 보고서 → 다운로드 버튼 있음
    await expect(
      page.getByTestId(`report-download-${seedData.reports.weeklyGenerated.id}`)
    ).toBeVisible()
    await expect(
      page.getByTestId(`report-download-${seedData.reports.monthlyGenerated.id}`)
    ).toBeVisible()

    // PENDING 보고서 → 다운로드 버튼 없음
    await expect(
      page.getByTestId(`report-download-${seedData.reports.weeklyPending.id}`)
    ).not.toBeVisible()
  })

  test('보고서 상태 뱃지가 올바르게 표시된다', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByTestId('report-list').first()).toBeVisible({ timeout: 15000 })

    await expect(page.getByText('생성 완료').first()).toBeVisible()
    await expect(page.getByText('생성 중')).toBeVisible()
  })

  test('보고서 목록 헤더가 표시된다', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { level: 1, name: '보고서' })).toBeVisible({ timeout: 15000 })
  })

  test('보고서 목록에서 상세 페이지로 이동한다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto('/reports')
    await expect(page.getByTestId('report-list').first()).toBeVisible({ timeout: 15000 })

    // 첫 번째 보고서의 상세 링크 클릭
    await page.getByTestId(`report-detail-link-${reportId}`).click()
    await expect(page).toHaveURL(new RegExp(`/reports/${reportId}`), { timeout: 10000 })
  })
})

// 빈 상태 테스트: 별도 serial describe로 분리하여 위 serial block 완료 후 실행
// afterAll에서 데이터가 삭제되므로 빈 상태 확인 가능
test.describe.serial('보고서 빈 상태', () => {
  test.beforeAll(async ({ request }) => {
    // 혹시 남아있는 시드 데이터 정리
    await request.delete('/api/test/seed-reports')
  })

  test('보고서가 없으면 빈 상태가 표시된다', async ({ page }) => {
    await page.goto('/reports')
    // 캐시된 페이지를 피하기 위해 리로드
    await page.reload()

    await expect(page.getByTestId('report-empty-state').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('아직 보고서가 없어요')).toBeVisible()
  })
})
