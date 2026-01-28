import { Page } from '@playwright/test'

export interface AuthFixture {
  /**
   * 테스트 사용자로 로그인
   * @param page - Playwright Page 객체
   * @param email - 로그인할 이메일 (기본값: test@example.com)
   * @param password - 로그인할 비밀번호 (기본값: password123)
   */
  loginAsUser: (page: Page, email?: string, password?: string) => Promise<void>

  /**
   * Meta OAuth 로그인 시뮬레이션
   * @param page - Playwright Page 객체
   */
  loginWithMeta: (page: Page) => Promise<void>

  /**
   * Google OAuth 로그인 시뮬레이션
   * @param page - Playwright Page 객체
   */
  loginWithGoogle: (page: Page) => Promise<void>

  /**
   * 로그아웃
   * @param page - Playwright Page 객체
   */
  logout: (page: Page) => Promise<void>
}

/**
 * 인증 헬퍼 함수들
 */
export const authFixture: AuthFixture = {
  /**
   * 테스트 사용자로 로그인
   * Note: Mock 인증 세션을 사용하는 경우 global-setup에서 이미 설정됨
   */
  async loginAsUser(page: Page, email = 'test@example.com', password = 'password123') {
    // Mock 인증 API를 통한 세션 생성
    const baseURL = 'http://localhost:3000' // Use configured baseURL from playwright.config.ts

    try {
      const response = await page.goto(`${baseURL}/api/test/mock-auth`)
      if (response && response.ok()) {
        console.log('[Auth Fixture] Mock session created successfully')
        // 홈페이지로 이동 (인증된 사용자는 /campaigns로 리다이렉트됨)
        await page.goto('/')
        return
      }
    } catch {
      console.warn('[Auth Fixture] Mock auth API failed, falling back to manual login')
    }

    // Fallback: 수동 로그인 (실제 로그인 폼이 있는 경우)
    await page.goto('/login')
    const emailInput = page.getByLabel(/이메일|Email/)
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(email)
      await page.getByLabel(/비밀번호|Password/).fill(password)
      await page.getByRole('button', { name: /로그인/ }).click()
      await page.waitForURL(/\/campaigns|\/dashboard/, { timeout: 10000 })
    }
  },

  /**
   * Meta OAuth 로그인 시뮬레이션
   * Note: 실제 OAuth 플로우는 외부 서비스이므로 mock 필요
   */
  async loginWithMeta(page: Page) {
    await page.goto('/login')

    // Meta 로그인 버튼 클릭 시 OAuth URL로 리다이렉트되는지 확인
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      page.getByRole('button', { name: /Meta/ }).click(),
    ])

    // OAuth 팝업이 열렸는지 확인
    if (popup) {
      await popup.waitForLoadState()
      // 실제 테스트에서는 Mock OAuth 서버 사용 필요
      await popup.close()
    }
  },

  /**
   * Google OAuth 로그인 시뮬레이션
   */
  async loginWithGoogle(page: Page) {
    await page.goto('/login')

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      page.getByRole('button', { name: /Google/ }).click(),
    ])

    if (popup) {
      await popup.waitForLoadState()
      await popup.close()
    }
  },

  /**
   * 로그아웃
   */
  async logout(page: Page) {
    // Mock 인증 세션 삭제
    const baseURL = 'http://localhost:3000' // Use configured baseURL from playwright.config.ts

    try {
      await page.request.delete(`${baseURL}/api/test/mock-auth`)
      console.log('[Auth Fixture] Mock session deleted')
    } catch {
      console.warn('[Auth Fixture] Failed to delete mock session via API')
    }

    // 사용자 메뉴를 찾아 로그아웃 클릭 시도
    const userMenu = page.getByTestId('user-menu')
      .or(page.getByRole('button', { name: /사용자|User|계정/ }))

    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click()

      const logoutButton = page.getByRole('button', { name: /로그아웃|Logout/ })
        .or(page.getByRole('menuitem', { name: /로그아웃|Logout/ }))

      if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click()
      }
    } else {
      // UI 로그아웃 버튼이 없으면 직접 로그아웃 API 호출
      await page.goto('/api/auth/signout')
    }

    // 로그인 페이지로 리다이렉트 대기
    await page.waitForURL(/\/login/, { timeout: 5000 })
  },
}

/**
 * 인증된 상태로 페이지 방문
 */
export async function visitAsAuthenticated(
  page: Page,
  url: string,
  credentials?: { email: string; password: string }
) {
  await authFixture.loginAsUser(page, credentials?.email, credentials?.password)
  await page.goto(url)
}
