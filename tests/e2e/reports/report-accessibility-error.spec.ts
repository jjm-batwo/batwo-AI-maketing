import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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

test.describe.serial('보고서 접근성 검증 (@axe-core/playwright)', () => {
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

  test('보고서 목록 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByTestId('report-list').first()).toBeVisible({ timeout: 15000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'aria-valid-attr-value'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('보고서 상세 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    const reportId = seedData.reports.weeklyGenerated.id

    await page.goto(`/reports/${reportId}`)
    await expect(page.getByTestId('report-detail')).toBeVisible({ timeout: 15000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('샘플 보고서 페이지가 접근성 기준을 충족한다', async ({ page }) => {
    await page.goto('/reports/sample')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe('보고서 에러 시나리오', () => {
  test('존재하지 않는 보고서 ID로 접근하면 404 처리된다', async ({ page }) => {
    // 서버 컴포넌트에서 notFound() 호출 → Next.js 기본 404 페이지
    await page.goto('/reports/nonexistent-report-id-that-does-not-exist')

    // Next.js 404 페이지 텍스트 확인 (API 오류 또는 not-found 페이지)
    await expect(
      page.getByText(/This page could not be found|404|보고서를 찾을 수 없습니다|보고서를 불러오는데 실패했습니다/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('존재하지 않는 공유 토큰으로 접근하면 유효하지 않은 링크 안내가 표시된다', async ({ page }) => {
    // 존재하지 않는 토큰 → 404 또는 유효하지 않은 공유 링크 안내
    await page.goto('/reports/share/nonexistent-share-token-xyz')

    await expect(
      page.getByText(/유효하지 않은 공유 링크|not found|404/i)
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
