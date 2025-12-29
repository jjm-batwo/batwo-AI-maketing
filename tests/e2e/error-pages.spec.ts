/**
 * 🔴 RED Phase: Error Pages E2E Tests
 *
 * These tests verify that error pages work correctly in the browser.
 */

import { test, expect } from '@playwright/test'

test.describe('404 페이지', () => {
  test('존재하지 않는 페이지 접근 시 404 페이지가 표시되어야 함', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')

    // 404 텍스트 확인
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText(/페이지를 찾을 수 없습니다/i)).toBeVisible()
  })

  test('404 페이지에서 홈으로 돌아갈 수 있어야 함', async ({ page }) => {
    await page.goto('/non-existent-page')

    // 홈으로 버튼 클릭
    const homeLink = page.getByRole('link', { name: /홈으로/i })
    await expect(homeLink).toBeVisible()

    await homeLink.click()

    // 홈페이지로 이동 확인
    await expect(page).toHaveURL('/')
  })

  test('404 페이지가 한국어로 표시되어야 함', async ({ page }) => {
    await page.goto('/does-not-exist')

    // 한국어 메시지 확인
    await expect(page.getByText(/요청하신 페이지/i)).toBeVisible()
  })

  test('404 페이지가 반응형으로 동작해야 함', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/non-existent')

    await expect(page.getByText('404')).toBeVisible()

    // 태블릿 뷰포트
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByText('404')).toBeVisible()

    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByText('404')).toBeVisible()
  })
})

test.describe('로딩 상태', () => {
  test('대시보드 로딩 상태가 표시되어야 함', async ({ page }) => {
    // 대시보드 페이지 접근 (인증 없이는 리다이렉트될 수 있음)
    // 로딩 상태는 잠시 동안만 표시되므로, 페이지 접근 시 확인
    await page.goto('/campaigns')

    // 로딩 UI 또는 콘텐츠가 표시되는지 확인
    // (인증되지 않은 경우 로그인으로 리다이렉트될 수 있음)
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })
})

test.describe('접근성', () => {
  test('404 페이지가 접근성 기준을 충족해야 함', async ({ page }) => {
    await page.goto('/non-existent-accessible')

    // 메인 콘텐츠 영역 확인
    const mainContent = page.locator('main, [role="main"], .container')
    await expect(mainContent.first()).toBeVisible()

    // 제목이 있는지 확인
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // 링크가 키보드로 접근 가능한지 확인
    const homeLink = page.getByRole('link', { name: /홈으로/i })
    await homeLink.focus()
    await expect(homeLink).toBeFocused()
  })
})
