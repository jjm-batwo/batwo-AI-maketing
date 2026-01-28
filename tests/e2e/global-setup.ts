import { chromium, FullConfig } from '@playwright/test'
import * as path from 'path'

/**
 * Playwright Global Setup
 *
 * 테스트 실행 전 한 번만 실행되는 설정
 * - Mock 인증 세션 생성
 * - 테스트 데이터베이스 시드
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'

  console.log('[E2E Setup] Starting global setup...')
  console.log('[E2E Setup] Base URL:', baseURL)

  // 브라우저 시작
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // 1. 테스트 데이터베이스 초기화 API 호출
    console.log('[E2E Setup] Initializing test database...')
    const initResponse = await page.goto(`${baseURL}/api/test/db-init`, {
      timeout: 30000,
    })

    if (!initResponse || !initResponse.ok()) {
      console.warn('[E2E Setup] Database init API not available - tests may fail')
    } else {
      console.log('[E2E Setup] Database initialized successfully')
    }

    // 2. Mock 인증 세션 생성
    console.log('[E2E Setup] Creating mock authentication session...')

    // NextAuth 세션 쿠키 생성을 위한 API 호출
    const authResponse = await page.goto(`${baseURL}/api/test/mock-auth`, {
      timeout: 10000,
    })

    if (!authResponse || !authResponse.ok()) {
      console.warn('[E2E Setup] Mock auth API not available')
      console.warn('[E2E Setup] Authenticated tests will be skipped')
    } else {
      console.log('[E2E Setup] Mock session created successfully')

      // 세션 쿠키를 스토리지에 저장
      const storageStatePath = path.join(__dirname, 'storage-state.json')

      await context.storageState({ path: storageStatePath })
      console.log('[E2E Setup] Storage state saved:', storageStatePath)
    }
  } catch (error) {
    console.error('[E2E Setup] Error during global setup:', error)
    // 에러가 발생해도 테스트는 계속 진행
    // (인증되지 않은 테스트는 실행 가능)
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }

  console.log('[E2E Setup] Global setup completed')
}

export default globalSetup
