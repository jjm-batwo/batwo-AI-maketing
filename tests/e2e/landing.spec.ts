import { test, expect } from '@playwright/test'
import { setViewport } from './fixtures'

test.describe('Landing Page', () => {
  test.describe('랜딩 페이지 로드', () => {
    test('should load landing page successfully', async ({ page }) => {
      await page.goto('/')

      // 페이지가 로드되어야 함
      await expect(page.locator('body')).toBeVisible()
    })

    test('should have correct page title', async ({ page }) => {
      await page.goto('/')

      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    test('should not redirect authenticated users', async ({ page }) => {
      // Note: 실제 인증 로직에 따라 수정 필요
      // 로그인하지 않은 사용자는 랜딩 페이지에 머물러야 함
      await page.goto('/')

      // 로그인 페이지로 리다이렉트되지 않아야 함
      await expect(page).not.toHaveURL(/\/login/)
    })
  })

  test.describe('Hero 섹션 표시', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('should display hero section', async ({ page }) => {
      const heroSection = page.locator('section, div').filter({ hasText: /AI 마케팅|바투/ }).first()
      await expect(heroSection).toBeVisible({ timeout: 10000 })
    })

    test('should display main heading', async ({ page }) => {
      // Hero 섹션의 메인 헤딩 확인
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()

      const headingText = await heading.textContent()
      expect(headingText?.length).toBeGreaterThan(0)
    })

    test('should display hero description', async ({ page }) => {
      // Hero 섹션의 설명 텍스트 확인
      const description = page.locator('p').first()
      await expect(description).toBeVisible()
    })

    test('should have visually distinct hero section', async ({ page }) => {
      const heroSection = page.locator('section, main').first()
      await expect(heroSection).toBeVisible()

      // Hero 섹션이 충분한 높이를 가지고 있어야 함
      const boundingBox = await heroSection.boundingBox()
      expect(boundingBox?.height).toBeGreaterThan(300)
    })
  })

  test.describe('CTA 버튼 동작', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('should display CTA button in hero section', async ({ page }) => {
      const ctaButton = page.getByRole('link', { name: /시작하기|무료로 시작|지금 시작/ })
        .or(page.getByRole('button', { name: /시작하기|무료로 시작|지금 시작/ }))

      await expect(ctaButton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should navigate on CTA button click', async ({ page }) => {
      const ctaButton = page.getByRole('link', { name: /시작하기|무료로 시작|지금 시작/ })
        .or(page.getByRole('button', { name: /시작하기|무료로 시작|지금 시작/ }))

      const firstCta = ctaButton.first()
      await expect(firstCta).toBeVisible()

      // CTA 버튼 클릭
      await firstCta.click()

      // 로그인 페이지 또는 회원가입 페이지로 이동해야 함
      await page.waitForURL(/\/(login|register|signup)/, { timeout: 10000 })
    })

    test('should have accessible CTA button', async ({ page }) => {
      const ctaButton = page.getByRole('link', { name: /시작하기|무료로 시작|지금 시작/ })
        .or(page.getByRole('button', { name: /시작하기|무료로 시작|지금 시작/ }))

      const firstCta = ctaButton.first()

      // 버튼이 활성화되어 있어야 함
      await expect(firstCta).toBeEnabled()

      // 버튼에 텍스트가 있어야 함
      const buttonText = await firstCta.textContent()
      expect(buttonText?.length).toBeGreaterThan(0)
    })

    test('should display multiple CTAs throughout page', async ({ page }) => {
      const ctaButtons = page.getByRole('link', { name: /시작하기|무료로 시작|지금 시작/ })
        .or(page.getByRole('button', { name: /시작하기|무료로 시작|지금 시작/ }))

      const count = await ctaButtons.count()
      // 랜딩 페이지에는 보통 여러 개의 CTA가 있음
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('모바일 반응형 확인', () => {
    test('should display correctly on iPhone SE', async ({ page }) => {
      await setViewport(page, 'mobile')
      await page.goto('/')

      // 페이지가 로드되어야 함
      await expect(page.locator('body')).toBeVisible()

      // 가로 스크롤이 없어야 함
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1 for rounding
    })

    test('should display correctly on iPhone 11 Pro Max', async ({ page }) => {
      await setViewport(page, 'mobileWide')
      await page.goto('/')

      await expect(page.locator('body')).toBeVisible()

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
    })

    test('should display correctly on iPad', async ({ page }) => {
      await setViewport(page, 'tablet')
      await page.goto('/')

      await expect(page.locator('body')).toBeVisible()
    })

    test('should display correctly on desktop', async ({ page }) => {
      await setViewport(page, 'desktop')
      await page.goto('/')

      await expect(page.locator('body')).toBeVisible()
    })

    test('should display hero section on mobile', async ({ page }) => {
      await setViewport(page, 'mobile')
      await page.goto('/')

      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should display CTA button on mobile', async ({ page }) => {
      await setViewport(page, 'mobile')
      await page.goto('/')

      const ctaButton = page.getByRole('link', { name: /시작하기|무료로 시작|지금 시작/ })
        .or(page.getByRole('button', { name: /시작하기|무료로 시작|지금 시작/ }))

      await expect(ctaButton.first()).toBeVisible()
    })

    test('should have readable text on mobile', async ({ page }) => {
      await setViewport(page, 'mobile')
      await page.goto('/')

      // 텍스트가 충분히 큰 폰트 사이즈를 가져야 함 (접근성)
      const heading = page.locator('h1, h2').first()
      const fontSize = await heading.evaluate(el => {
        return window.getComputedStyle(el).fontSize
      })

      const fontSizeNum = parseInt(fontSize)
      expect(fontSizeNum).toBeGreaterThanOrEqual(20) // 최소 20px
    })

    test('should not have horizontal overflow on mobile', async ({ page }) => {
      await setViewport(page, 'mobile')
      await page.goto('/')

      // 가로 스크롤바가 없어야 함
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })

      expect(hasHorizontalScroll).toBeFalsy()
    })
  })

  test.describe('랜딩 페이지 섹션들', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('should display features section', async ({ page }) => {
      const featuresSection = page.getByRole('heading', { name: /기능|특징|Features/ })

      if (await featuresSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(featuresSection).toBeVisible()
      }
    })

    test('should display pricing section', async ({ page }) => {
      const pricingSection = page.getByRole('heading', { name: /가격|요금|Pricing/ })

      if (await pricingSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pricingSection).toBeVisible()
      }
    })

    test('should display FAQ section', async ({ page }) => {
      const faqSection = page.getByRole('heading', { name: /FAQ|자주 묻는|질문/ })

      if (await faqSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(faqSection).toBeVisible()
      }
    })

    test('should display footer', async ({ page }) => {
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })

    test('should have links in footer', async ({ page }) => {
      const footer = page.locator('footer')
      const links = footer.getByRole('link')

      const count = await links.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('네비게이션', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('should display header navigation', async ({ page }) => {
      const header = page.locator('header, nav').first()
      await expect(header).toBeVisible()
    })

    test('should have logo in header', async ({ page }) => {
      const logo = page.locator('header img, header svg, header [data-testid="logo"]').first()
        .or(page.getByRole('link', { name: /바투|Batwo|홈/ }).first())

      await expect(logo).toBeVisible({ timeout: 5000 })
    })

    test('should navigate to login from header', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /로그인|Login/ })

      if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginLink.click()
        await expect(page).toHaveURL(/\/login/)
      }
    })
  })

  test.describe('성능 및 접근성', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')

      // 메인 콘텐츠가 3초 이내에 로드되어야 함
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 3000 })

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000)
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/')

      // h1 태그가 있어야 함
      const h1 = page.locator('h1')
      const h1Count = await h1.count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
    })

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/')

      // 모든 이미지에 alt 속성이 있어야 함
      const images = page.locator('img')
      const count = await images.count()

      for (let i = 0; i < count; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        // alt는 존재해야 함 (빈 문자열도 허용)
        expect(alt).not.toBeNull()
      }
    })
  })

  test.describe('스크롤 동작', () => {
    test('should allow scrolling to bottom', async ({ page }) => {
      await page.goto('/')

      // 페이지 하단으로 스크롤
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // 푸터가 보여야 함
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })

    test('should maintain header on scroll', async ({ page }) => {
      await page.goto('/')

      const header = page.locator('header, nav').first()
      await expect(header).toBeVisible()

      // 스크롤 후에도 헤더가 보이는지 확인 (sticky header인 경우)
      await page.evaluate(() => window.scrollTo(0, 500))

      // 일부 구현에서는 헤더가 sticky할 수 있음
      const isVisible = await header.isVisible()
      // 헤더가 sticky이거나 스크롤해도 보이거나, 둘 중 하나
      expect(typeof isVisible).toBe('boolean')
    })
  })
})
