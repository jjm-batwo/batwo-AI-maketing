/**
 * Meta App Review Demo Recording Script
 *
 * Meta 앱 검수용 데모 영상 자동 녹화 스크립트
 *
 * 사용법:
 * 1. 로컬 서버 실행: npm run dev
 * 2. 세션 저장 (최초 1회): npm run record:demo -- --setup
 *    -> 브라우저가 열리면 수동으로 로그인 후 대시보드 도착 시 Enter 키 입력
 * 3. 녹화 실행: npm run record:demo
 *
 * 출력:
 * - docs/meta-app-review/videos/1-ads-management.webm
 * - docs/meta-app-review/videos/2-ads-read.webm
 * - docs/meta-app-review/videos/3-business-management.webm
 * - docs/meta-app-review/videos/4-pages-show-list.webm
 * - docs/meta-app-review/videos/5-pages-read-engagement.webm
 */

import { chromium, Browser, BrowserContext, Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import * as readline from 'readline'

// 녹화 설정
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: path.join(__dirname, '../../docs/meta-app-review/videos'),
  authStateFile: path.join(__dirname, '../../.auth-state.json'),
  viewport: { width: 1280, height: 720 },
  slowMo: 800, // 액션 사이 대기 시간 (ms)
  startDelay: 3000, // 시작 전 대기 시간 (ms)
  actionDelay: 1500, // 각 액션 후 대기 시간 (ms)
}

// 출력 디렉토리 생성
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true })
}

/**
 * 브라우저 및 컨텍스트 설정 (세션 복원 포함)
 */
async function setupBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  const browser = await chromium.launch({
    headless: false, // 녹화를 위해 headful 모드
    slowMo: CONFIG.slowMo,
  })

  // 저장된 세션 상태가 있으면 복원
  const contextOptions: Parameters<Browser['newContext']>[0] = {
    viewport: CONFIG.viewport,
    recordVideo: {
      dir: CONFIG.outputDir,
      size: CONFIG.viewport,
    },
    javaScriptEnabled: true,
  }

  if (hasAuthSession()) {
    contextOptions.storageState = CONFIG.authStateFile
  }

  const context = await browser.newContext(contextOptions)

  return { browser, context }
}

/**
 * 사용자 입력 대기 유틸리티
 */
function _waitForEnter(message: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(message, () => {
      rl.close()
      resolve()
    })
  })
}

/**
 * 세션 설정 모드 (수동 로그인 후 세션 저장)
 */
async function setupAuthSession(): Promise<void> {
  console.log('')
  console.log('🔐 세션 설정 모드')
  console.log('================================')
  console.log('')
  console.log('브라우저가 열립니다. 다음을 수행해주세요:')
  console.log('1. OAuth 버튼 (Google/Kakao/Meta)을 클릭하여 로그인')
  console.log('2. 대시보드 페이지가 로드될 때까지 대기')
  console.log('3. 로그인 완료 시 자동으로 세션이 저장됩니다')
  console.log('')

  const browser = await chromium.launch({
    headless: false,
    slowMo: CONFIG.slowMo,
  })

  const context = await browser.newContext({
    viewport: CONFIG.viewport,
  })

  const page = await context.newPage()
  await page.goto(`${CONFIG.baseUrl}/login`)
  await page.waitForLoadState('networkidle')

  console.log(`📍 로그인 페이지: ${CONFIG.baseUrl}/login`)
  console.log('')
  console.log('⏳ 로그인 완료 대기 중... (대시보드 도착 시 자동 저장)')

  // 로그인 완료 자동 감지 (대시보드 또는 로그인이 아닌 페이지로 이동 시)
  const maxWaitTime = 300000 // 5분
  const checkInterval = 1000 // 1초마다 체크
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    const currentUrl = page.url()

    // 로그인 페이지가 아니고, 대시보드나 다른 앱 페이지로 이동했는지 확인
    if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
      console.log('')
      console.log(`✅ 로그인 감지: ${currentUrl}`)
      break
    }

    await page.waitForTimeout(checkInterval)
  }

  // 세션 상태 저장
  await context.storageState({ path: CONFIG.authStateFile })
  console.log(`✅ 세션이 저장되었습니다: ${CONFIG.authStateFile}`)
  console.log('')
  console.log('이제 "npm run record:demo" 명령으로 녹화를 시작할 수 있습니다.')
  console.log('')

  await browser.close()
}

/**
 * 저장된 세션 확인
 */
function hasAuthSession(): boolean {
  return fs.existsSync(CONFIG.authStateFile)
}

/**
 * 로그인 확인 (세션 기반)
 */
async function verifyLogin(page: Page): Promise<boolean> {
  console.log('  세션 확인 중...')
  await page.goto(`${CONFIG.baseUrl}/dashboard`)
  await page.waitForLoadState('networkidle')

  // 로그인 페이지로 리다이렉트되었는지 확인
  const url = page.url()
  if (url.includes('/login') || url.includes('/auth')) {
    console.log('  ❌ 세션 만료 - 다시 설정 필요')
    return false
  }

  console.log('  ✅ 로그인 확인 완료')
  return true
}

/**
 * 마우스 커서 강조 CSS 추가
 */
async function addCursorHighlight(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      * {
        cursor: pointer !important;
      }
      body {
        cursor: default !important;
      }
    `,
  })
}

/**
 * 시나리오 1: ads_management (캠페인 관리)
 */
async function recordAdsManagement(): Promise<void> {
  console.log('\n📹 1. ads_management 녹화 시작...')

  const { browser, context } = await setupBrowser()
  const page = await context.newPage()

  try {
    await addCursorHighlight(page)
    await page.waitForTimeout(CONFIG.startDelay)

    // 로그인
    if (!(await verifyLogin(page))) {
      throw new Error('세션이 만료되었습니다. npm run record:demo -- --setup 을 실행해주세요.')
    }

    // 대시보드
    await page.goto(`${CONFIG.baseUrl}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 캠페인 목록 페이지
    console.log('  캠페인 목록 이동...')
    await page.goto(`${CONFIG.baseUrl}/campaigns`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 스크롤 다운 (캠페인 목록 확인)
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(CONFIG.actionDelay)

    // 새 캠페인 생성 페이지
    console.log('  새 캠페인 생성 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/campaigns/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 캠페인 폼 작성 (예시)
    const nameInput = page.locator('input[name="name"], input#name').first()
    if (await nameInput.isVisible()) {
      await nameInput.click()
      await nameInput.fill('데모 캠페인 - Meta 검수')
      await page.waitForTimeout(CONFIG.actionDelay)
    }

    // 목표 선택 (있다면)
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(CONFIG.actionDelay)

    // 예산 입력
    const budgetInput = page.locator('input[name="dailyBudget"], input#dailyBudget').first()
    if (await budgetInput.isVisible()) {
      await budgetInput.click()
      await budgetInput.fill('100000')
      await page.waitForTimeout(CONFIG.actionDelay)
    }

    // 저장 버튼 표시
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 캠페인 목록으로 돌아가기
    await page.goto(`${CONFIG.baseUrl}/campaigns`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay)

    // 첫 번째 캠페인 클릭 (상세 페이지)
    const firstCampaign = page.locator('[data-testid="campaign-card"], [class*="cursor-pointer"]').first()
    if (await firstCampaign.isVisible()) {
      await firstCampaign.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.actionDelay * 2)

      // 캠페인 상태 변경 버튼 (일시중지)
      const pauseButton = page.locator('button:has-text("일시중지"), button:has-text("Pause")').first()
      if (await pauseButton.isVisible()) {
        await pauseButton.click()
        await page.waitForTimeout(CONFIG.actionDelay * 2)
      }
    }

    await page.waitForTimeout(CONFIG.startDelay)
  } finally {
    await context.close()
    await browser.close()

    // 녹화된 비디오 파일 이름 변경
    const videoFiles = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1]
      fs.renameSync(
        path.join(CONFIG.outputDir, latestVideo),
        path.join(CONFIG.outputDir, '1-ads-management.webm')
      )
    }
  }

  console.log('  ✅ ads_management 녹화 완료')
}

/**
 * 시나리오 2: ads_read (성과 조회)
 */
async function recordAdsRead(): Promise<void> {
  console.log('\n📹 2. ads_read 녹화 시작...')

  const { browser, context } = await setupBrowser()
  const page = await context.newPage()

  try {
    await addCursorHighlight(page)
    await page.waitForTimeout(CONFIG.startDelay)

    if (!(await verifyLogin(page))) {
      throw new Error('세션이 만료되었습니다. npm run record:demo -- --setup 을 실행해주세요.')
    }

    // 대시보드 KPI 카드
    console.log('  대시보드 KPI 카드 표시...')
    await page.goto(`${CONFIG.baseUrl}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 3)

    // 스크롤 다운 (차트 표시)
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 캠페인 상세 페이지로 이동
    console.log('  캠페인 상세 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/campaigns`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay)

    // 첫 번째 캠페인 클릭
    const firstCampaign = page.locator('[data-testid="campaign-card"], [class*="cursor-pointer"]').first()
    if (await firstCampaign.isVisible()) {
      await firstCampaign.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.actionDelay * 2)

      // 성과 탭 클릭 (있다면)
      const performanceTab = page.locator('button:has-text("성과"), button:has-text("Performance")').first()
      if (await performanceTab.isVisible()) {
        await performanceTab.click()
        await page.waitForTimeout(CONFIG.actionDelay * 2)
      }

      // 스크롤하여 차트 확인
      await page.evaluate(() => window.scrollTo(0, 400))
      await page.waitForTimeout(CONFIG.actionDelay * 2)
    }

    // 보고서 페이지
    console.log('  보고서 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/reports`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 첫 번째 보고서 클릭
    const firstReport = page.locator('[data-testid="report-card"], [class*="cursor-pointer"]').first()
    if (await firstReport.isVisible()) {
      await firstReport.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CONFIG.actionDelay * 2)

      // 스크롤하여 전체 보고서 확인
      await page.evaluate(() => window.scrollTo(0, 600))
      await page.waitForTimeout(CONFIG.actionDelay)
      await page.evaluate(() => window.scrollTo(0, 1200))
      await page.waitForTimeout(CONFIG.actionDelay)
    }

    await page.waitForTimeout(CONFIG.startDelay)
  } finally {
    await context.close()
    await browser.close()

    const videoFiles = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1]
      fs.renameSync(path.join(CONFIG.outputDir, latestVideo), path.join(CONFIG.outputDir, '2-ads-read.webm'))
    }
  }

  console.log('  ✅ ads_read 녹화 완료')
}

/**
 * 시나리오 3: business_management (픽셀 관리)
 */
async function recordBusinessManagement(): Promise<void> {
  console.log('\n📹 3. business_management 녹화 시작...')

  const { browser, context } = await setupBrowser()
  const page = await context.newPage()

  try {
    await addCursorHighlight(page)
    await page.waitForTimeout(CONFIG.startDelay)

    if (!(await verifyLogin(page))) {
      throw new Error('세션이 만료되었습니다. npm run record:demo -- --setup 을 실행해주세요.')
    }

    // 설정 페이지
    console.log('  설정 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // Meta 연결 페이지
    console.log('  Meta 연결 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings/meta-connect`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 픽셀 관리 페이지
    console.log('  픽셀 관리 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings/pixel`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 3)

    // 픽셀 선택 (있다면)
    const pixelCard = page.locator('[data-testid="pixel-card"], [class*="cursor-pointer"]').first()
    if (await pixelCard.isVisible()) {
      await pixelCard.click()
      await page.waitForTimeout(CONFIG.actionDelay * 2)
    }

    // 스크롤하여 설치 안내 확인
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 스크립트 복사 버튼 (있다면)
    const copyButton = page.locator('button:has-text("복사"), button:has-text("Copy")').first()
    if (await copyButton.isVisible()) {
      await copyButton.click()
      await page.waitForTimeout(CONFIG.actionDelay * 2)
    }

    await page.waitForTimeout(CONFIG.startDelay)
  } finally {
    await context.close()
    await browser.close()

    const videoFiles = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1]
      fs.renameSync(
        path.join(CONFIG.outputDir, latestVideo),
        path.join(CONFIG.outputDir, '3-business-management.webm')
      )
    }
  }

  console.log('  ✅ business_management 녹화 완료')
}

/**
 * 시나리오 4: pages_show_list (페이지 목록)
 */
async function recordPagesShowList(): Promise<void> {
  console.log('\n📹 4. pages_show_list 녹화 시작...')

  const { browser, context } = await setupBrowser()
  const page = await context.newPage()

  try {
    await addCursorHighlight(page)
    await page.waitForTimeout(CONFIG.startDelay)

    if (!(await verifyLogin(page))) {
      throw new Error('세션이 만료되었습니다. npm run record:demo -- --setup 을 실행해주세요.')
    }

    // 설정 페이지
    console.log('  설정 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // Meta 연결 상태 확인
    console.log('  Meta 연결 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings/meta-connect`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // Meta 페이지 관리
    console.log('  Meta 페이지 관리 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings/meta-pages`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 3)

    // 페이지 목록 스크롤
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 페이지 선택 (있다면)
    const pageCard = page.locator('[data-testid="page-card"], [class*="cursor-pointer"]').first()
    if (await pageCard.isVisible()) {
      await pageCard.click()
      await page.waitForTimeout(CONFIG.actionDelay * 2)
    }

    await page.waitForTimeout(CONFIG.startDelay)
  } finally {
    await context.close()
    await browser.close()

    const videoFiles = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1]
      fs.renameSync(
        path.join(CONFIG.outputDir, latestVideo),
        path.join(CONFIG.outputDir, '4-pages-show-list.webm')
      )
    }
  }

  console.log('  ✅ pages_show_list 녹화 완료')
}

/**
 * 시나리오 5: pages_read_engagement (참여 분석)
 */
async function recordPagesReadEngagement(): Promise<void> {
  console.log('\n📹 5. pages_read_engagement 녹화 시작...')

  const { browser, context } = await setupBrowser()
  const page = await context.newPage()

  try {
    await addCursorHighlight(page)
    await page.waitForTimeout(CONFIG.startDelay)

    if (!(await verifyLogin(page))) {
      throw new Error('세션이 만료되었습니다. npm run record:demo -- --setup 을 실행해주세요.')
    }

    // Meta 페이지 관리
    console.log('  Meta 페이지 관리 페이지 이동...')
    await page.goto(`${CONFIG.baseUrl}/settings/meta-pages`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 페이지 선택 (인사이트 보기)
    const pageCard = page.locator('[data-testid="page-card"], [class*="cursor-pointer"]').first()
    if (await pageCard.isVisible()) {
      await pageCard.click()
      await page.waitForTimeout(CONFIG.actionDelay * 2)
    }

    // 인사이트 섹션 스크롤
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 참여 지표 확인
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(CONFIG.actionDelay * 2)

    // 기간 변경 (있다면)
    const dateRangePicker = page.locator('button:has-text("기간"), select[name="dateRange"]').first()
    if (await dateRangePicker.isVisible()) {
      await dateRangePicker.click()
      await page.waitForTimeout(CONFIG.actionDelay)

      // 옵션 선택 (예: 지난 7일)
      const option = page.locator('text=지난 7일, text=Last 7 days').first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(CONFIG.actionDelay * 2)
      }
    }

    await page.waitForTimeout(CONFIG.startDelay)
  } finally {
    await context.close()
    await browser.close()

    const videoFiles = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1]
      fs.renameSync(
        path.join(CONFIG.outputDir, latestVideo),
        path.join(CONFIG.outputDir, '5-pages-read-engagement.webm')
      )
    }
  }

  console.log('  ✅ pages_read_engagement 녹화 완료')
}

/**
 * 메인 실행 함수
 */
async function main() {
  const args = process.argv.slice(2)

  // --setup 플래그 확인
  if (args.includes('--setup')) {
    // 서버 연결 확인
    try {
      const response = await fetch(CONFIG.baseUrl)
      if (!response.ok) {
        throw new Error(`Server not responding: ${response.status}`)
      }
    } catch {
      console.error('❌ 서버에 연결할 수 없습니다. npm run dev를 실행하세요.')
      process.exit(1)
    }

    await setupAuthSession()
    return
  }

  console.log('================================================')
  console.log('  Meta App Review Demo Recording')
  console.log('================================================')
  console.log('')
  console.log(`Base URL: ${CONFIG.baseUrl}`)
  console.log(`Output: ${CONFIG.outputDir}`)
  console.log(`Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`)
  console.log('')
  console.log('📝 시작 전 확인사항:')
  console.log('  1. 로컬 서버 실행: npm run dev')
  console.log('  2. 세션 설정 (최초 1회): npm run record:demo -- --setup')
  console.log('')

  // 세션 파일 확인
  if (!hasAuthSession()) {
    console.error('❌ 세션 파일이 없습니다.')
    console.error('   먼저 "npm run record:demo -- --setup" 을 실행하여 로그인하세요.')
    process.exit(1)
  }
  console.log('✅ 세션 파일 확인')

  // 서버 연결 확인
  try {
    const response = await fetch(CONFIG.baseUrl)
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`)
    }
    console.log('✅ 서버 연결 확인')
  } catch {
    console.error('❌ 서버에 연결할 수 없습니다. npm run dev를 실행하세요.')
    process.exit(1)
  }

  console.log('')
  console.log('🎬 녹화를 시작합니다...')
  console.log('')

  try {
    await recordAdsManagement()
    await recordAdsRead()
    await recordBusinessManagement()
    await recordPagesShowList()
    await recordPagesReadEngagement()

    console.log('')
    console.log('================================================')
    console.log('  ✅ 모든 녹화 완료!')
    console.log('================================================')
    console.log('')
    console.log('📁 출력 파일:')
    const files = fs.readdirSync(CONFIG.outputDir).filter((f) => f.endsWith('.webm'))
    files.forEach((file) => {
      console.log(`  - ${file}`)
    })
    console.log('')
  } catch (error) {
    console.error('')
    console.error('❌ 녹화 중 오류 발생:', error)
    process.exit(1)
  }
}

// 실행
main()
