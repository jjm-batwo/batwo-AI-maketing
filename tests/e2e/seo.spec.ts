/**
 * 🔴 RED Phase: SEO E2E Tests
 *
 * These tests verify that SEO files are accessible and properly configured.
 */

import { test, expect } from '@playwright/test'

// SEO 테스트는 공개 페이지이므로 비인증 상태 필요
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('SEO 파일 접근성', () => {
  test('sitemap.xml이 접근 가능해야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')
  })

  test('sitemap.xml이 올바른 구조를 가져야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const xml = await response.text()

    // XML 선언 확인
    expect(xml).toContain('<?xml')
    expect(xml).toContain('<urlset')
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/')

    // 필수 URL 포함 확인
    expect(xml).toContain('<loc>')
    expect(xml).toContain('</loc>')
  })

  test('sitemap.xml에 주요 페이지가 포함되어야 함', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const xml = await response.text()

    // 주요 페이지 확인 (홈페이지 URL)
    expect(xml).toMatch(/<loc>https:\/\/batwo\.ai\/?<\/loc>/) // 홈페이지 (trailing slash 선택적)
    expect(xml).toContain('/terms')
    expect(xml).toContain('/privacy')
  })

  test('robots.txt가 접근 가능해야 함', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
  })

  test('robots.txt가 올바른 지시사항을 포함해야 함', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const text = await response.text()

    // User-agent 지시사항 확인
    expect(text).toContain('User-Agent:')

    // Sitemap 참조 확인
    expect(text).toContain('Sitemap:')
    expect(text).toMatch(/Sitemap:.*sitemap\.xml/)
  })

  test('robots.txt가 보호된 경로를 Disallow해야 함', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const text = await response.text()

    // API 경로 보호
    expect(text).toContain('Disallow: /api/')

    // 인증 경로 보호 (선택적)
    // expect(text).toContain('Disallow: /auth/')
  })
})

test.describe('메타데이터 검증', () => {
  test('홈페이지에 필수 메타태그가 있어야 함', async ({ page }) => {
    await page.goto('/')

    // Title
    const title = await page.title()
    expect(title).toContain('바투')

    // Meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(typeof description).toBe('string')
    expect(description!.length).toBeGreaterThan(0)
    expect(description!.length).toBeGreaterThan(50)

    // Meta keywords
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content')
    expect(typeof keywords).toBe('string')
    expect(keywords!.length).toBeGreaterThan(0)
  })

  test('홈페이지에 Open Graph 메타태그가 있어야 함', async ({ page }) => {
    await page.goto('/')

    // OG title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(typeof ogTitle).toBe('string')
    expect(ogTitle!.length).toBeGreaterThan(0)

    // OG description
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(typeof ogDescription).toBe('string')
    expect(ogDescription!.length).toBeGreaterThan(0)

    // OG image
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(typeof ogImage).toBe('string')
    expect(ogImage).toMatch(/^https?:\/\//)

    // OG type
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content')
    expect(ogType).toBe('website')

    // OG locale
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content')
    expect(ogLocale).toBe('ko_KR')

    // OG site_name
    const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute('content')
    expect(ogSiteName).toContain('바투')
  })

  test('홈페이지에 Twitter Card 메타태그가 있어야 함', async ({ page }) => {
    await page.goto('/')

    // Twitter card type
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    expect(twitterCard).toBe('summary_large_image')

    // Twitter title
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content')
    expect(typeof twitterTitle).toBe('string')
    expect(twitterTitle!.length).toBeGreaterThan(0)

    // Twitter description
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content')
    expect(typeof twitterDescription).toBe('string')
    expect(twitterDescription!.length).toBeGreaterThan(0)

    // Twitter image
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    expect(typeof twitterImage).toBe('string')
  })

  test('홈페이지에 JSON-LD 구조화 데이터가 있어야 함', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // JSON-LD 스크립트들 찾기
    const jsonLdScripts = page.locator('script[type="application/ld+json"]')
    await expect(jsonLdScripts.first()).toBeAttached({ timeout: 5000 })

    // Organization 또는 WebSite 타입의 JSON-LD 찾기 (FAQPage 제외)
    const count = await jsonLdScripts.count()
    let foundOrganization = false

    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent()
      if (!content) continue

      const jsonLd = JSON.parse(content)
      if (jsonLd['@type'] === 'Organization' || jsonLd['@type'] === 'WebSite') {
        expect(jsonLd['@context']).toBe('https://schema.org')
        expect(typeof jsonLd['@type']).toBe('string')
        expect(typeof jsonLd.name).toBe('string')
        foundOrganization = true
        break
      }
    }

    expect(foundOrganization).toBe(true)
  })

  test('홈페이지에 canonical URL이 있어야 함', async ({ page }) => {
    await page.goto('/')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(typeof canonical).toBe('string')
    expect(canonical).toMatch(/^https?:\/\//)
  })

  test('홈페이지에 viewport 메타태그가 있어야 함', async ({ page }) => {
    await page.goto('/')

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(typeof viewport).toBe('string')
    expect(viewport).toContain('width=device-width')
  })

  test('홈페이지에 언어 설정이 있어야 함', async ({ page }) => {
    await page.goto('/')

    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('ko')
  })
})

test.describe('OG 이미지 접근성', () => {
  test('OG 이미지가 접근 가능해야 함', async ({ request, page }) => {
    await page.goto('/')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(typeof ogImage).toBe('string')

    // 절대 URL을 상대 경로로 변환 (테스트 환경에서는 localhost 사용)
    const imageUrl = ogImage?.startsWith('http')
      ? new URL(ogImage).pathname
      : ogImage

    // 이미지 접근 가능 확인
    const imageResponse = await request.get(imageUrl!)
    expect(imageResponse.status()).toBe(200)
    expect(imageResponse.headers()['content-type']).toMatch(/image\/(png|jpeg|jpg|webp)/)
  })

  test('OG 이미지가 올바른 크기여야 함', async ({ page }) => {
    await page.goto('/')

    // OG image dimensions
    const ogWidth = await page.locator('meta[property="og:image:width"]').getAttribute('content')
    const ogHeight = await page.locator('meta[property="og:image:height"]').getAttribute('content')

    expect(ogWidth).toBe('1200')
    expect(ogHeight).toBe('630')
  })
})

test.describe('페이지별 SEO', () => {
  test('이용약관 페이지에 적절한 메타데이터가 있어야 함', async ({ page }) => {
    await page.goto('/terms')

    const title = await page.title()
    expect(title).toContain('이용약관')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(typeof description).toBe('string')
    expect(description!.length).toBeGreaterThan(0)
  })

  test('개인정보처리방침 페이지에 적절한 메타데이터가 있어야 함', async ({ page }) => {
    await page.goto('/privacy')

    const title = await page.title()
    expect(title).toContain('개인정보')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(typeof description).toBe('string')
    expect(description!.length).toBeGreaterThan(0)
  })
})
