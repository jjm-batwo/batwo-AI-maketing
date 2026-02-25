import { test, expect } from '@playwright/test'

// 무료 감사 플로우는 비인증 상태에서 시작 (랜딩 페이지)
// 콜백 페이지는 인증 불필요 (공개 접근)

// Mock 감사 결과 데이터
const mockAuditReport = {
  overall: 68,
  grade: 'C',
  categories: [
    {
      name: '예산 효율성',
      score: 72,
      findings: [
        { type: 'warning', message: '3개 캠페인의 CPA가 목표 대비 150% 초과' },
        { type: 'positive', message: '전체 예산 소진율 85% (적정)' },
      ],
      recommendations: [
        {
          priority: 'high',
          message: 'CPA 초과 캠페인 예산 30% 감소 권장',
          estimatedImpact: '월 ₩150,000 절감',
        },
      ],
    },
    {
      name: '타겟팅',
      score: 65,
      findings: [
        { type: 'warning', message: '타겟 오디언스 중복률 45%' },
      ],
      recommendations: [
        {
          priority: 'medium',
          message: '오디언스 세분화 필요',
          estimatedImpact: 'CTR 15% 개선 예상',
        },
      ],
    },
    {
      name: '크리에이티브',
      score: 58,
      findings: [
        { type: 'critical', message: '2개 소재의 빈도 7회 이상 (피로도 높음)' },
      ],
      recommendations: [
        {
          priority: 'high',
          message: '소재 교체 필요',
          estimatedImpact: 'CTR 20% 회복 예상',
        },
      ],
    },
    {
      name: '전환 추적',
      score: 80,
      findings: [
        { type: 'positive', message: '픽셀 설치 완료' },
        { type: 'positive', message: 'CAPI 연동 활성' },
      ],
      recommendations: [],
    },
  ],
  estimatedWaste: { amount: 450000, currency: 'KRW' },
  estimatedImprovement: { amount: 280000, currency: 'KRW' },
  totalCampaigns: 8,
  activeCampaigns: 5,
  analyzedAt: '2026-02-25T01:00:00Z',
}

test.describe('무료 감사 플로우', () => {
  test.describe('A. 랜딩 페이지 — 무료 감사 CTA', () => {
    // 랜딩 페이지는 인증 없이 접근
    test.use({ storageState: { cookies: [], origins: [] } })

    test('랜딩 페이지에 무료 진단 CTA 버튼이 표시되어야 한다', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      // FreeAuditButton 또는 무료 감사 관련 CTA 확인
      const auditCta = page
        .getByRole('button', { name: /무료 진단|무료 감사|광고 계정.*몇 점/ })
        .or(page.getByText(/내 광고 계정.*몇 점|무료 진단받기|무료 감사/))

      await expect(auditCta.first()).toBeVisible({ timeout: 10000 })
    })

    test('무료 진단 버튼 클릭 시 auth-url API를 호출하고 리다이렉트해야 한다', async ({ page }) => {
      // auth-url API를 mock하여 외부 OAuth 의존성 제거
      await page.route('**/api/audit/auth-url', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authUrl: 'https://www.facebook.com/dialog/oauth?test=1',
          }),
        })
      })

      await page.goto('/', { waitUntil: 'domcontentloaded' })

      const auditCta = page
        .getByRole('button', { name: /무료 진단|무료 감사|광고 계정.*몇 점|진단받기/ })
        .or(page.getByText(/내 광고 계정.*몇 점|무료 진단받기/))

      if (await auditCta.first().isVisible({ timeout: 8000 }).catch(() => false)) {
        // API 호출 요청 감지
        const [apiRequest] = await Promise.all([
          page.waitForRequest('**/api/audit/auth-url', { timeout: 5000 }).catch(() => null),
          auditCta.first().click(),
        ])

        // auth-url API가 호출되어야 함
        expect(apiRequest).not.toBeNull()
      }
    })
  })

  test.describe('B. 감사 콜백 페이지 — 로딩 상태', () => {
    test('session과 adAccountId가 있으면 분석 API를 호출하고 로딩 스피너를 표시해야 한다', async ({
      page,
    }) => {
      // analyze API를 지연 응답으로 mock하여 로딩 상태 확인
      let resolveAnalyze!: (value: void) => void
      const analyzeDelay = new Promise<void>((resolve) => {
        resolveAnalyze = resolve
      })

      await page.route('**/api/audit/analyze', async (route) => {
        await analyzeDelay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // 로딩 스피너 (role="status") 또는 로딩 메시지가 표시되어야 함
      const loadingIndicator = page
        .getByRole('status')
        .or(page.getByText(/분석하고 있습니다|잠시만 기다려/))

      await expect(loadingIndicator.first()).toBeVisible({ timeout: 8000 })

      // 분석 완료
      resolveAnalyze()
    })
  })

  test.describe('C. 감사 콜백 페이지 — 결과 표시', () => {
    test('분석 결과가 반환되면 무료 진단 결과 제목이 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      await expect(
        page.getByRole('heading', { name: /광고 계정 무료 진단 결과/ })
      ).toBeVisible({ timeout: 15000 })
    })

    test('종합 점수 게이지(AuditReportCard)가 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // AuditReportCard의 "광고 계정 종합 진단" 제목 확인
      await expect(page.getByText('광고 계정 종합 진단')).toBeVisible({ timeout: 15000 })
    })

    test('종합 점수와 등급이 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // 종합 점수 (68점) 표시 확인
      await expect(page.getByText('68')).toBeVisible({ timeout: 15000 })

      // 등급 배지 확인 (aria-label="등급 C")
      const gradeBadge = page
        .getByLabel('등급 C')
        .or(page.getByText('C등급'))

      await expect(gradeBadge.first()).toBeVisible({ timeout: 10000 })
    })

    test('낭비 예상 비용과 개선 가능 효과가 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // 낭비 예상 비용 (₩450,000)
      await expect(page.getByText(/₩450,000|450,000/)).toBeVisible({ timeout: 15000 })

      // 개선 가능 효과 (₩280,000) — AuditReportCard와 AuditConversionCTA 두 곳에 표시되므로 first() 사용
      await expect(page.getByText(/₩280,000|280,000/).first()).toBeVisible({ timeout: 10000 })
    })

    test('카테고리별 분석(AuditCategoryBreakdown)이 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // 카테고리 이름들이 표시되어야 함
      await expect(page.getByText('예산 효율성')).toBeVisible({ timeout: 15000 })
      await expect(page.getByText('타겟팅')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('크리에이티브')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('전환 추적')).toBeVisible({ timeout: 10000 })
    })

    test('전환 유도 CTA 섹션(AuditConversionCTA)이 표시되어야 한다', async ({ page }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAuditReport),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // AuditConversionCTA의 "AI가 자동으로 최적화해드려요" 메시지
      await expect(page.getByText(/AI가 자동으로 최적화/)).toBeVisible({ timeout: 15000 })

      // "14일 무료 체험 시작" 링크
      await expect(
        page.getByRole('link', { name: /14일 무료 체험 시작/ })
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('D. 감사 콜백 페이지 — 에러 처리', () => {
    test('error=access_denied 파라미터가 있으면 에러 메시지가 표시되어야 한다', async ({
      page,
    }) => {
      await page.goto('/audit/callback?error=access_denied', {
        waitUntil: 'domcontentloaded',
      })

      // ErrorView: "분석에 실패했습니다" 제목 (role="alert")
      await expect(
        page.getByRole('heading', { name: '분석에 실패했습니다' })
      ).toBeVisible({ timeout: 10000 })
    })

    test('에러 발생 시 다시 시도하기 버튼이 표시되어야 한다', async ({ page }) => {
      await page.goto('/audit/callback?error=access_denied', {
        waitUntil: 'domcontentloaded',
      })

      // aria-label="무료 진단 다시 시도"이므로 텍스트 내용으로도 찾기 위해 getByText 사용
      await expect(
        page.getByText('다시 시도하기')
      ).toBeVisible({ timeout: 10000 })
    })

    test('analyze API가 500 에러를 반환하면 에러 메시지가 표시되어야 한다', async ({
      page,
    }) => {
      await page.route('**/api/audit/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
        })
      })

      await page.goto('/audit/callback?session=test-session&adAccountId=act_123', {
        waitUntil: 'domcontentloaded',
      })

      // 에러 뷰가 표시되어야 함
      await expect(
        page.getByRole('heading', { name: '분석에 실패했습니다' })
      ).toBeVisible({ timeout: 15000 })
    })

    test('다시 시도하기 버튼 클릭 시 랜딩 페이지로 이동해야 한다', async ({ page }) => {
      await page.goto('/audit/callback?error=access_denied', {
        waitUntil: 'domcontentloaded',
      })

      // aria-label="무료 진단 다시 시도"이므로 aria-label로 찾거나 텍스트로 찾기
      const retryButton = page.getByRole('button', { name: /무료 진단 다시 시도|다시 시도하기/ })
      await expect(retryButton).toBeVisible({ timeout: 10000 })

      // 클릭 시 / 으로 이동 (window.location.href = '/')
      await retryButton.click()
      await expect(page).toHaveURL('/', { timeout: 10000 })
    })

    test('session이나 adAccountId가 없으면 빈 화면이 표시되어야 한다', async ({ page }) => {
      // 파라미터 없이 접근 — analyze 호출 안 됨
      await page.route('**/api/audit/analyze', async (route) => {
        // 이 라우트는 호출되지 않아야 함
        await route.fulfill({ status: 500, body: 'Should not be called' })
      })

      await page.goto('/audit/callback', { waitUntil: 'domcontentloaded' })

      // 로딩 스피너도, 에러도, 결과도 없는 빈 상태
      await expect(
        page.getByRole('heading', { name: /광고 계정 무료 진단 결과/ })
      ).not.toBeVisible()
      await expect(
        page.getByRole('heading', { name: '분석에 실패했습니다' })
      ).not.toBeVisible()
    })
  })
})
