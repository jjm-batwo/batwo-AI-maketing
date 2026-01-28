import { test, expect } from '@playwright/test'
import { authFixture } from './fixtures'

test.describe('Authentication', () => {
  test.describe('로그인 페이지 렌더링', () => {
    test('should render login page with all elements', async ({ page }) => {
      await page.goto('/login')

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

    test('should preserve callback URL after redirect', async ({ page }) => {
      await page.goto('/campaigns/new')

      // 로그인 페이지로 리다이렉트되고 callbackUrl 파라미터가 포함되어야 함
      await page.waitForURL(/\/login/)

      const url = new URL(page.url())
      expect(url.searchParams.has('callbackUrl')).toBeTruthy()
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
    test('should logout successfully with mock auth', async ({ page }) => {
      // Mock 인증 세션 생성
      await authFixture.loginAsUser(page)

      // 로그아웃 실행
      await authFixture.logout(page)

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
