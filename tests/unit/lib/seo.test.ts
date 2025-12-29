/**
 * 🔴 RED Phase: SEO Constants Tests
 *
 * These tests verify that SEO constants are properly defined
 * and contain all required fields for comprehensive SEO.
 */

import { describe, it, expect } from 'vitest'
import { SEO, getMetadata, getJsonLd } from '@/lib/constants/seo'

describe('SEO Constants', () => {
  describe('SEO 기본 상수', () => {
    it('사이트 기본 정보가 정의되어 있어야 함', () => {
      expect(SEO.siteName).toBe('바투 AI 마케팅')
      expect(SEO.siteUrl).toBeDefined()
      expect(SEO.siteUrl).toMatch(/^https?:\/\//)
    })

    it('기본 메타데이터가 정의되어 있어야 함', () => {
      expect(SEO.defaultTitle).toBeDefined()
      expect(SEO.defaultTitle.length).toBeGreaterThan(10)
      expect(SEO.defaultDescription).toBeDefined()
      expect(SEO.defaultDescription.length).toBeGreaterThan(50)
    })

    it('키워드가 배열로 정의되어 있어야 함', () => {
      expect(Array.isArray(SEO.keywords)).toBe(true)
      expect(SEO.keywords.length).toBeGreaterThan(5)
      expect(SEO.keywords).toContain('AI 마케팅')
      expect(SEO.keywords).toContain('Meta 광고')
    })

    it('OG 이미지 경로가 정의되어 있어야 함', () => {
      expect(SEO.ogImage).toBeDefined()
      expect(SEO.ogImage).toMatch(/\.(png|jpg|jpeg)$/)
    })

    it('Twitter 핸들이 정의되어 있어야 함', () => {
      expect(SEO.twitterHandle).toBeDefined()
      expect(SEO.twitterHandle).toMatch(/^@/)
    })

    it('로케일 정보가 정의되어 있어야 함', () => {
      expect(SEO.locale).toBe('ko_KR')
      expect(SEO.language).toBe('ko')
    })
  })

  describe('Open Graph 설정', () => {
    it('OG 타입이 정의되어 있어야 함', () => {
      expect(SEO.og.type).toBe('website')
    })

    it('OG 이미지 크기가 정의되어 있어야 함', () => {
      expect(SEO.og.imageWidth).toBe(1200)
      expect(SEO.og.imageHeight).toBe(630)
    })
  })

  describe('Twitter Card 설정', () => {
    it('Twitter card 타입이 정의되어 있어야 함', () => {
      expect(SEO.twitter.card).toBe('summary_large_image')
    })

    it('Twitter 사이트 핸들이 정의되어 있어야 함', () => {
      expect(SEO.twitter.site).toBeDefined()
      expect(SEO.twitter.site).toMatch(/^@/)
    })
  })

  describe('getMetadata 함수', () => {
    it('기본 메타데이터를 반환해야 함', () => {
      const metadata = getMetadata()

      expect(metadata.title).toBeDefined()
      expect(metadata.description).toBe(SEO.defaultDescription)
      expect(metadata.keywords).toEqual(SEO.keywords)
    })

    it('커스텀 title과 description을 적용해야 함', () => {
      const customTitle = '캠페인 관리'
      const customDescription = '캠페인을 효율적으로 관리하세요'

      const metadata = getMetadata({
        title: customTitle,
        description: customDescription,
      })

      expect(metadata.title).toContain(customTitle)
      expect(metadata.description).toBe(customDescription)
    })

    it('Open Graph 메타데이터를 포함해야 함', () => {
      const metadata = getMetadata()

      expect(metadata.openGraph).toBeDefined()
      const og = metadata.openGraph as Record<string, unknown>
      expect(og.siteName).toBe(SEO.siteName)
      expect(og.locale).toBe(SEO.locale)
      expect(og.type).toBe(SEO.og.type)
    })

    it('Twitter Card 메타데이터를 포함해야 함', () => {
      const metadata = getMetadata()

      expect(metadata.twitter).toBeDefined()
      const twitter = metadata.twitter as Record<string, unknown>
      expect(twitter.card).toBe(SEO.twitter.card)
      expect(twitter.site).toBe(SEO.twitter.site)
    })

    it('커스텀 OG 이미지를 적용해야 함', () => {
      const customImage = '/images/custom-og.png'

      const metadata = getMetadata({ ogImage: customImage })

      expect(metadata.openGraph?.images).toContainEqual(
        expect.objectContaining({ url: expect.stringContaining(customImage) })
      )
    })

    it('canonical URL을 포함해야 함', () => {
      const path = '/campaigns'

      const metadata = getMetadata({ path })

      expect(metadata.alternates?.canonical).toContain(path)
    })
  })

  describe('getJsonLd 함수', () => {
    it('Organization 스키마를 반환해야 함', () => {
      const jsonLd = getJsonLd()

      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('Organization')
      expect(jsonLd.name).toBe(SEO.siteName)
      expect(jsonLd.url).toBe(SEO.siteUrl)
    })

    it('로고 URL을 포함해야 함', () => {
      const jsonLd = getJsonLd()

      expect(jsonLd.logo).toBeDefined()
      expect(jsonLd.logo).toMatch(/^https?:\/\//)
    })

    it('SoftwareApplication 스키마를 지원해야 함', () => {
      const jsonLd = getJsonLd('SoftwareApplication')

      expect(jsonLd['@type']).toBe('SoftwareApplication')
      const softwareApp = jsonLd as unknown as { applicationCategory: string; operatingSystem: string }
      expect(softwareApp.applicationCategory).toBe('BusinessApplication')
      expect(softwareApp.operatingSystem).toBe('Web')
    })

    it('sameAs 소셜 링크를 포함해야 함', () => {
      const jsonLd = getJsonLd()

      expect(Array.isArray(jsonLd.sameAs)).toBe(true)
    })
  })

  describe('페이지별 SEO 상수', () => {
    it('랜딩 페이지 SEO가 정의되어 있어야 함', () => {
      expect(SEO.pages.landing).toBeDefined()
      expect(SEO.pages.landing.title).toBeDefined()
      expect(SEO.pages.landing.description).toBeDefined()
    })

    it('대시보드 SEO가 정의되어 있어야 함', () => {
      expect(SEO.pages.dashboard).toBeDefined()
      expect(SEO.pages.dashboard.title).toBeDefined()
    })

    it('이용약관 페이지 SEO가 정의되어 있어야 함', () => {
      expect(SEO.pages.terms).toBeDefined()
      expect(SEO.pages.terms.title).toContain('이용약관')
    })

    it('개인정보처리방침 페이지 SEO가 정의되어 있어야 함', () => {
      expect(SEO.pages.privacy).toBeDefined()
      expect(SEO.pages.privacy.title).toContain('개인정보')
    })
  })
})
