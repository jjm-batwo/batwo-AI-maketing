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
      // API 응답에서 토큰과 쿠키 정보 추출
      const responseText = await page.locator('body').textContent()
      const authData = JSON.parse(responseText || '{}')

      if (authData.token && authData.cookieName) {
        // Playwright context에 직접 쿠키 설정 (서버 쿠키와 동기화 보장)
        const url = new URL(baseURL)
        await context.addCookies([{
          name: authData.cookieName,
          value: authData.token,
          domain: url.hostname,
          path: '/',
          httpOnly: true,
          secure: authData.cookieOptions?.secure || false,
          sameSite: 'Lax',
          expires: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
        }])
        console.log('[E2E Setup] Mock session cookie set directly via Playwright')

        // 페이지 로드하여 localStorage 접근 가능하게 함
        await page.goto(baseURL)

        // 1. 인증만 있는 storage state 저장 (온보딩 테스트용 - 온보딩 미완료)
        const storageStateFreshPath = path.join(__dirname, 'storage-state-fresh.json')
        await context.storageState({ path: storageStateFreshPath })
        console.log('[E2E Setup] Fresh storage state saved (auth only):', storageStateFreshPath)

        // 2. 온보딩 완료 상태를 localStorage에 설정 (대부분의 테스트용)
        await page.evaluate(() => {
          // Zustand persist 형식으로 저장 (onboardingStore.ts와 일치)
          const onboardingState = {
            state: {
              currentStep: 4,
              totalSteps: 4,
              isCompleted: true,
              _hasHydrated: true,
            },
            version: 0,
          }
          localStorage.setItem('batwo_onboarding', JSON.stringify(onboardingState))
        })
        console.log('[E2E Setup] Onboarding completed state set in localStorage')

        // 3. 온보딩 완료 상태를 포함한 storage state 저장
        const storageStatePath = path.join(__dirname, 'storage-state.json')
        await context.storageState({ path: storageStatePath })
        console.log('[E2E Setup] Storage state saved (auth + onboarding):', storageStatePath)
      }

      console.log('[E2E Setup] Mock session created successfully')
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
