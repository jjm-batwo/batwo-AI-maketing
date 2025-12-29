import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/campaigns')
      await expect(page).toHaveURL(/\/login/)
    })

    test('should redirect to login when accessing dashboard', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/login/)
    })

    test('should show login page correctly', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: /로그인/ })).toBeVisible()
      await expect(page.getByLabel('이메일')).toBeVisible()
      await expect(page.getByLabel('비밀번호')).toBeVisible()
      await expect(page.getByRole('button', { name: /로그인/ })).toBeVisible()
    })
  })

  test.describe('Login Flow', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel('이메일').fill('invalid@example.com')
      await page.getByLabel('비밀번호').fill('wrongpassword')
      await page.getByRole('button', { name: /로그인/ }).click()

      await expect(page.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/)).toBeVisible()
    })

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel('이메일').fill('test@example.com')
      await page.getByLabel('비밀번호').fill('password123')
      await page.getByRole('button', { name: /로그인/ }).click()

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL('/')
      await expect(page.getByText(/대시보드/)).toBeVisible()
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login')
      await page.getByRole('button', { name: /로그인/ }).click()

      await expect(page.getByText(/이메일을 입력해주세요/)).toBeVisible()
    })
  })

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel('이메일').fill('test@example.com')
      await page.getByLabel('비밀번호').fill('password123')
      await page.getByRole('button', { name: /로그인/ }).click()
      await expect(page).toHaveURL('/')
    })

    test('should logout successfully', async ({ page }) => {
      // Click user menu and logout
      await page.getByTestId('user-menu').click()
      await page.getByRole('button', { name: /로그아웃/ }).click()

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Registration Flow', () => {
    test('should show register page correctly', async ({ page }) => {
      await page.goto('/register')
      await expect(page.getByRole('heading', { name: /회원가입/ })).toBeVisible()
      await expect(page.getByLabel('이름')).toBeVisible()
      await expect(page.getByLabel('이메일')).toBeVisible()
      await expect(page.getByLabel('비밀번호')).toBeVisible()
    })

    test('should navigate to login from register', async ({ page }) => {
      await page.goto('/register')
      await page.getByRole('link', { name: /로그인/ }).click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Social Login', () => {
    test('should show Google login button', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
    })

    test('should show Kakao login button', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible()
    })
  })
})
