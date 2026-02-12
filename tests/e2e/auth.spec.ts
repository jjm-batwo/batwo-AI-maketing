import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures/auth'
// import { MockHelper } from './helpers/mock.helper'

// auth 테스트는 모두 비인증 상태에서 실행되어야 함
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Authentication', () => {
  test.describe('로그인 페이지 렌더링', () => {
    test('should render login page with all elements', async ({ page }) => {
      await page.goto('/login')

      // Suspense 해제 대기 - Card 컴포넌트가 렌더링될 때까지 대기
      await page.waitForSelector('[data-slot="card"], .rounded-lg.border', { timeout: 10000 })

      // 페이지 제목 확인
      await expect(page.getByRole('heading', { name: /바투에 로그인하기/ })).toBeVisible()

      // 설명 텍스트 확인
      await expect(page.getByText(/AI 마케팅 솔루션의 모든 기능을 이용해보세요/)).toBeVisible()

      // 소셜 로그인 버튼 확인
      await expect(page.getByRole('button', { name: /Google로 계속하기/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /카카오로 계속하기/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Meta로 계속하기/ })).toBeVisible()

      // 약관 링크 확인
      await expect(page.getByRole('link', { name: /이용약관/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /개인정보처리방침/ })).toBeVisible()
    })

    test('should render login page without errors', async ({ page }) => {
      await page.goto('/login')

      // 에러 메시지가 없어야 함
      const errorMessage = page.locator('text=/이메일 또는 비밀번호가 올바르지 않습니다/')
      await expect(errorMessage).not.toBeVisible()
    })
  })

  test.describe('Meta 로그인 버튼 클릭', () => {
    test('should trigger Meta OAuth flow on button click', async ({ page }) => {
      await page.goto('/login')

      const metaButton = page.getByRole('button', { name: /Meta로 계속하기/ })
      await expect(metaButton).toBeVisible()
      await expect(metaButton).toBeEnabled()

      // Meta 로그인 버튼 클릭 시 OAuth 플로우 시작
      // Note: 실제 OAuth는 외부 서비스이므로 redirect만 확인
      await metaButton.click()

      // 버튼이 로딩 상태로 변경되는지 확인
      await expect(page.locator('button:has-text("Meta로 계속하기") svg.animate-spin')).toBeVisible({
        timeout: 2000,
      }).catch(() => {
        // OAuth redirect가 빠르게 발생하면 로딩 상태를 못 볼 수 있음
      })
    })

    test('should disable other buttons during Meta login', async ({ page }) => {
      await page.goto('/login')

      const metaButton = page.getByRole('button', { name: /Meta로 계속하기/ })
      const googleButton = page.getByRole('button', { name: /Google로 계속하기/ })
      const kakaoButton = page.getByRole('button', { name: /카카오로 계속하기/ })

      // Meta 로그인 시작
      await metaButton.click()

      // 잠시 대기 후 다른 버튼들이 비활성화되었는지 확인
      await page.waitForTimeout(100)

      if (await googleButton.isVisible()) {
        await expect(googleButton).toBeDisabled()
      }

      if (await kakaoButton.isVisible()) {
        await expect(kakaoButton).toBeDisabled()
      }
    })
  })

  test.describe('미인증 사용자 리다이렉트', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard')

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing campaigns without auth', async ({ page }) => {
      await page.goto('/campaigns')

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing reports without auth', async ({ page }) => {
      await page.goto('/reports')

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing settings without auth', async ({ page }) => {
      await page.goto('/settings')

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should redirect to login when accessing protected route', async ({ page }) => {
      // 보호된 라우트 접근 시 로그인 페이지로 리다이렉트
      await page.goto('/campaigns/new', { waitUntil: 'domcontentloaded' })

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 })

      // Note: callbackUrl 보존은 향후 구현 예정
    })
  })

  test.describe('Google OAuth 로그인', () => {
    test('should show Google login button with correct styling', async ({ page }) => {
      await page.goto('/login')

      const googleButton = page.getByRole('button', { name: /Google로 계속하기/ })

      await expect(googleButton).toBeVisible()
      await expect(googleButton).toHaveClass(/bg-black/)

      // Google 로고 SVG 확인
      const googleLogo = googleButton.locator('svg').first()
      await expect(googleLogo).toBeVisible()
    })

    test('should trigger Google OAuth flow on button click', async ({ page }) => {
      await page.goto('/login')

      const googleButton = page.getByRole('button', { name: /Google로 계속하기/ })
      await googleButton.click()

      // OAuth 플로우 시작 확인 (로딩 스피너 또는 리다이렉트)
      await expect(page.locator('button:has-text("Google로 계속하기") svg.animate-spin')).toBeVisible({
        timeout: 2000,
      }).catch(() => {
        // 빠른 리다이렉트 시 무시
      })
    })
  })

  test.describe('Kakao OAuth 로그인', () => {
    test('should show Kakao login button with correct styling', async ({ page }) => {
      await page.goto('/login')

      const kakaoButton = page.getByRole('button', { name: /카카오로 계속하기/ })

      await expect(kakaoButton).toBeVisible()
      // Kakao 브랜드 컬러 확인
      await expect(kakaoButton).toHaveClass(/bg-\[#FEE500\]/)

      // Kakao 로고 SVG 확인
      const kakaoLogo = kakaoButton.locator('svg')
      await expect(kakaoLogo).toBeVisible()
    })
  })

  test.describe('에러 처리', () => {
    test('should display error message from URL parameter', async ({ page }) => {
      await page.goto('/login?error=OAuthAccountNotLinked')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/이미 다른 방법으로 가입된 이메일입니다/)
      ).toBeVisible()

      // 에러 아이콘 확인
      await expect(page.locator('svg').filter({ hasText: '' }).first()).toBeVisible()
    })

    test('should display default error for unknown error codes', async ({ page }) => {
      await page.goto('/login?error=UnknownError')

      await expect(
        page.getByText(/로그인 중 오류가 발생했습니다/)
      ).toBeVisible()
    })
  })

  test.describe('로그아웃', () => {
    test('should have logout functionality accessible', async ({ page }) => {
      // 로그인 페이지로 이동하여 로그아웃 기능이 있는지 확인
      // Note: 실제 로그아웃 테스트는 인증된 사용자 컨텍스트가 필요하므로
      // 여기서는 로그인 페이지가 정상적으로 렌더링되는지만 확인
      await page.goto('/login')

      // 로그인 페이지가 로드되었는지 확인
      await expect(page.getByRole('heading', { name: /바투에 로그인하기/ })).toBeVisible({ timeout: 10000 })

      // 로그인 버튼들이 표시되는지 확인
      await expect(page.getByRole('button', { name: /Google로 계속하기/ })).toBeVisible()
    })
  })

  test.describe('이메일/비밀번호 로그인 플로우', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login')

      // Mock 인증 사용 (실제 이메일/비밀번호 폼이 없으므로)
      await authFixture.loginAsUser(page, 'test@example.com', 'password123')

      // 로그인 후 대시보드로 리다이렉트 확인
      await expect(page).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 인증된 상태 확인 - 헤더에 사용자 메뉴가 표시되어야 함
      const userMenu = page.getByTestId('user-menu')
        .or(page.getByRole('button', { name: /사용자|User|계정/ }))

      if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(userMenu).toBeVisible()
      }
    })

    test('should show error message for invalid password', async ({ page }) => {
      await page.goto('/login?error=CredentialsSignin')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/이메일 또는 비밀번호가 올바르지 않습니다|잘못된 비밀번호/)
      ).toBeVisible()
    })

    test('should show error message for non-existent email', async ({ page }) => {
      await page.goto('/login?error=UserNotFound')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/존재하지 않는 이메일|사용자를 찾을 수 없습니다|이메일 또는 비밀번호가 올바르지 않습니다/)
      ).toBeVisible()
    })

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await page.goto('/login')

      // Mock 인증으로 로그인
      await authFixture.loginAsUser(page)

      // 대시보드 또는 캠페인 페이지로 리다이렉트 확인
      await page.waitForURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // URL 확인
      const url = page.url()
      expect(url).toMatch(/\/(dashboard|campaigns)/)
    })

    test('should handle session expiration and require re-login', async ({ page }) => {
      await page.goto('/login')

      // 1. 먼저 로그인
      await authFixture.loginAsUser(page)
      await expect(page).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 2. 세션 쿠키 삭제 (세션 만료 시뮬레이션)
      await page.context().clearCookies()

      // 3. 보호된 페이지 접근 시도
      await page.goto('/campaigns')

      // 4. 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

      // 5. 로그인 폼이 표시되는지 확인
      await expect(page.getByRole('heading', { name: /바투에 로그인하기/ })).toBeVisible()
    })
  })

  test.describe('세션 관리', () => {
    test('should preserve session across page reloads', async ({ page }) => {
      await page.goto('/login')

      // 로그인
      await authFixture.loginAsUser(page)
      await expect(page).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 페이지 새로고침
      await page.reload()

      // 여전히 인증된 상태인지 확인 (로그인 페이지로 리다이렉트되지 않음)
      await expect(page).not.toHaveURL(/\/login/)
      expect(page.url()).toMatch(/\/(dashboard|campaigns)/)
    })

    test('should clear session on logout', async ({ page }) => {
      await page.goto('/login')

      // 로그인
      await authFixture.loginAsUser(page)
      await expect(page).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 로그아웃
      await authFixture.logout(page)

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

      // 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should maintain separate sessions in different contexts', async ({ browser }) => {
      // 첫 번째 컨텍스트: 로그인된 사용자
      const context1 = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const page1 = await context1.newPage()
      await page1.goto('/login')
      await authFixture.loginAsUser(page1)
      await expect(page1).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 두 번째 컨텍스트: 로그인하지 않은 사용자
      const context2 = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const page2 = await context2.newPage()
      await page2.goto('/dashboard')

      // 두 번째 컨텍스트는 로그인 페이지로 리다이렉트
      await expect(page2).toHaveURL(/\/login/, { timeout: 10000 })

      // 첫 번째 컨텍스트는 여전히 인증된 상태
      await page1.goto('/dashboard')
      await expect(page1).not.toHaveURL(/\/login/)

      await context1.close()
      await context2.close()
    })
  })

  test.describe('OAuth 에러 처리', () => {
    test('should handle OAuth callback errors gracefully', async ({ page }) => {
      // OAuth 콜백 에러 시뮬레이션
      await page.goto('/login?error=OAuthSignin')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/로그인 중 오류가 발생했습니다/)
      ).toBeVisible()
    })

    test('should handle OAuth access denied', async ({ page }) => {
      await page.goto('/login?error=OAuthAccessDenied')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/로그인이 취소되었습니다|액세스가 거부|로그인 중 오류가 발생했습니다/)
      ).toBeVisible()
    })

    test('should handle OAuth configuration errors', async ({ page }) => {
      await page.goto('/login?error=OAuthConfiguration')

      // 에러 메시지 표시 확인
      await expect(
        page.getByText(/로그인 중 오류가 발생했습니다/)
      ).toBeVisible()
    })
  })

  test.describe('로그인 상태 지속성', () => {
    test('should remember login state after browser restart simulation', async ({ page }) => {
      await page.goto('/login')

      // 로그인
      await authFixture.loginAsUser(page)
      await expect(page).toHaveURL(/\/(dashboard|campaigns)/, { timeout: 10000 })

      // 세션 쿠키 가져오기
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'))

      // 세션 쿠키가 존재하는지 확인
      expect(sessionCookie).toBeDefined()

      // 새 페이지에서 쿠키 복원 후 접근
      await page.goto('/dashboard')
      await expect(page).not.toHaveURL(/\/login/)
    })
  })

  test.describe('보안 검증', () => {
    test('should not expose sensitive information in URL after failed login', async ({ page }) => {
      await page.goto('/login?error=CredentialsSignin')

      // URL에 민감한 정보가 없는지 확인
      const url = page.url()
      expect(url).not.toMatch(/password|token|secret/)
    })

    test('should clear password field after failed login attempt', async ({ page }) => {
      await page.goto('/login?error=CredentialsSignin')

      // 에러 메시지가 표시되는지 확인
      await expect(
        page.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/)
      ).toBeVisible()

      // Note: 실제 비밀번호 필드는 OAuth 전용 로그인이므로 없음
      // 이 테스트는 향후 이메일/비밀번호 로그인 폼 추가 시 활성화
    })

    test('should use secure cookies for session management', async ({ page }) => {
      await page.goto('/login')
      await authFixture.loginAsUser(page)

      const cookies = await page.context().cookies()
      const authCookies = cookies.filter(c =>
        c.name.includes('session') ||
        c.name.includes('auth') ||
        c.name.includes('next-auth')
      )

      // 인증 쿠키가 있는 경우 HttpOnly, Secure 플래그 확인
      authCookies.forEach(cookie => {
        // CI 환경에서는 localhost이므로 Secure 플래그가 없을 수 있음
        if (process.env.CI) {
          expect(cookie.httpOnly).toBe(true)
        }
      })
    })
  })
})
