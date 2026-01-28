/**
 * Meta App Review Screencast Recording Script
 *
 * 이 스크립트는 Meta 앱 검수를 위한 스크린캐스트를 녹화합니다.
 *
 * 사용법:
 * 1. 로컬 서버 실행: npm run dev
 * 2. 녹화 실행: npx playwright test scripts/meta-app-review-recording.ts --headed
 *
 * 또는 수동 녹화:
 * npx playwright codegen http://localhost:3000 --save-storage=auth.json
 */

import { test, expect } from '@playwright/test'
import path from 'path'

// 녹화 설정
const RECORDING_CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: path.join(__dirname, '../docs/meta-app-review/recordings'),
  slowMo: 500, // 밀리초 - 녹화용 느린 동작
}

// 테스트 계정 (실제 테스트 계정으로 교체 필요)
const _TEST_ACCOUNT = {
  email: process.env.TEST_ACCOUNT_EMAIL || 'test@example.com',
  password: process.env.TEST_ACCOUNT_PASSWORD || 'password',
}

test.describe('Meta App Review Screencast', () => {
  test.beforeEach(async ({ page }) => {
    // 비디오 녹화 설정은 playwright.config.ts에서 설정
    await page.goto(RECORDING_CONFIG.baseUrl)
  })

  test('Scene 1: App Introduction', async ({ page }) => {
    // 앱 소개 화면
    await page.goto(`${RECORDING_CONFIG.baseUrl}/login`)
    await page.waitForTimeout(2000)

    // 로그인 페이지 캡처
    await expect(page.getByRole('heading')).toBeVisible()
    await page.waitForTimeout(3000)
  })

  test('Scene 2: Meta Account Connection', async ({ page }) => {
    // 대시보드로 이동 (로그인 필요)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/meta-connect`)
    await page.waitForTimeout(2000)

    // Meta 연결 버튼 표시
    const connectButton = page.getByRole('button', { name: /Meta 계정 연결/i })
    await expect(connectButton).toBeVisible()
    await page.waitForTimeout(2000)

    // 버튼 클릭 - Facebook OAuth 다이얼로그로 이동
    // 주의: 실제 녹화 시에는 Facebook 로그인이 필요합니다
    // await connectButton.click()
    // await page.waitForTimeout(5000)
  })

  test('Scene 3: pages_show_list Demo', async ({ page }) => {
    // 페이지 관리 화면
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/meta-pages`)
    await page.waitForTimeout(2000)

    // 페이지 목록 표시
    await expect(page.getByRole('heading', { name: /Meta 페이지 관리/i })).toBeVisible()
    await page.waitForTimeout(3000)

    // 페이지 선택 (있는 경우)
    const pageCard = page.locator('[class*="cursor-pointer"]').first()
    if (await pageCard.isVisible()) {
      await pageCard.click()
      await page.waitForTimeout(3000)
    }
  })

  test('Scene 4: pages_read_engagement Demo', async ({ page }) => {
    // 페이지 인사이트 화면 (페이지 선택 후)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/meta-pages`)
    await page.waitForTimeout(2000)

    // 참여 지표 섹션 표시
    const engagementSection = page.getByText(/참여 지표/i)
    await expect(engagementSection).toBeVisible()
    await page.waitForTimeout(3000)
  })

  test('Scene 5: business_management Demo', async ({ page }) => {
    // 픽셀 관리 화면
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/pixel`)
    await page.waitForTimeout(2000)

    // 픽셀 목록 또는 설치 안내 표시
    await page.waitForTimeout(3000)
  })

  test('Scene 6: ads_read Demo', async ({ page }) => {
    // 대시보드 화면 - 성과 데이터
    await page.goto(`${RECORDING_CONFIG.baseUrl}/dashboard`)
    await page.waitForTimeout(2000)

    // KPI 카드 표시
    await expect(page.getByText('ROAS')).toBeVisible()
    await expect(page.getByText('총 지출')).toBeVisible()
    await page.waitForTimeout(3000)

    // 차트 스크롤
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(2000)
  })

  test('Scene 7: ads_management Demo', async ({ page }) => {
    // 캠페인 목록
    await page.goto(`${RECORDING_CONFIG.baseUrl}/campaigns`)
    await page.waitForTimeout(2000)

    // 캠페인 생성 페이지
    await page.goto(`${RECORDING_CONFIG.baseUrl}/campaigns/new`)
    await page.waitForTimeout(2000)

    // 폼 필드 표시
    await expect(page.getByLabel(/캠페인 이름/i)).toBeVisible()
    await page.waitForTimeout(3000)
  })

  test('Full Flow Recording', async ({ page }) => {
    /**
     * 전체 플로우를 하나의 비디오로 녹화합니다.
     * 이 테스트를 실행하여 완전한 스크린캐스트를 생성하세요.
     */

    // 1. 앱 소개
    await page.goto(`${RECORDING_CONFIG.baseUrl}/login`)
    await page.waitForTimeout(3000)

    // 2. 앱 검수 데모 페이지 (권한 요약)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/app-review-demo`)
    await page.waitForTimeout(4000)

    // 스크롤하여 전체 내용 표시
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(1000)

    // 3. Meta 연결 페이지
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/meta-connect`)
    await page.waitForTimeout(3000)

    // 4. 페이지 관리 (pages_show_list + pages_read_engagement)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/settings/meta-pages`)
    await page.waitForTimeout(3000)

    // 5. 대시보드 (ads_read)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/dashboard`)
    await page.waitForTimeout(4000)
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(2000)

    // 6. 캠페인 목록 (ads_management)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/campaigns`)
    await page.waitForTimeout(3000)

    // 7. 캠페인 생성 (ads_management)
    await page.goto(`${RECORDING_CONFIG.baseUrl}/campaigns/new`)
    await page.waitForTimeout(4000)

    // 완료
    await page.goto(`${RECORDING_CONFIG.baseUrl}/app-review-demo`)
    await page.waitForTimeout(2000)
  })
})

/**
 * Playwright 설정 가이드
 *
 * playwright.config.ts에 다음 설정을 추가하세요:
 *
 * export default defineConfig({
 *   use: {
 *     video: 'on',
 *     launchOptions: {
 *       slowMo: 500,
 *     },
 *   },
 *   outputDir: './docs/meta-app-review/recordings',
 * })
 */
