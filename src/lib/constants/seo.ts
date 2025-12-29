/**
 * SEO Constants and Utilities
 *
 * 바투 AI 마케팅 솔루션의 SEO 관련 상수 및 헬퍼 함수
 */

import type { Metadata } from 'next'

// =============================================================================
// SEO 상수 정의
// =============================================================================

export const SEO = {
  // 사이트 기본 정보
  siteName: '바투 AI 마케팅' as const,
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai',

  // 기본 메타데이터
  defaultTitle: '바투 - AI 마케팅 솔루션 | 커머스 사업자를 위한 광고 자동화',
  defaultDescription:
    '바투는 커머스 사업자를 위한 AI 마케팅 대행 솔루션입니다. Meta(Facebook/Instagram) 광고 캠페인 자동화, 실시간 KPI 대시보드, AI 기반 성과 분석 및 최적화 제안으로 광고 효율을 극대화하세요.',

  // 키워드 (mutable array)
  keywords: [
    'AI 마케팅',
    'Meta 광고',
    'Facebook 광고',
    'Instagram 광고',
    '광고 자동화',
    '마케팅 자동화',
    'KPI 대시보드',
    '광고 성과 분석',
    'AI 광고 최적화',
    '커머스 마케팅',
    '디지털 마케팅',
    '퍼포먼스 마케팅',
  ] as string[],

  // 이미지
  ogImage: '/og-image.png',
  logo: '/logo.png',

  // 소셜
  twitterHandle: '@batwo_ai',

  // 로케일
  locale: 'ko_KR' as const,
  language: 'ko' as const,

  // Open Graph 설정
  og: {
    type: 'website' as const,
    imageWidth: 1200 as const,
    imageHeight: 630 as const,
    imageAlt: '바투 AI 마케팅 솔루션',
  },

  // Twitter Card 설정
  twitter: {
    card: 'summary_large_image' as const,
    site: '@batwo_ai',
    creator: '@batwo_ai',
  },

  // 페이지별 SEO
  pages: {
    landing: {
      title: '바투 - AI 마케팅 솔루션',
      description:
        '커머스 사업자를 위한 AI 마케팅 대행 솔루션. Meta 광고 자동화로 광고 효율을 극대화하세요.',
    },
    dashboard: {
      title: '대시보드',
      description: '실시간 캠페인 성과 확인 및 AI 인사이트',
    },
    campaigns: {
      title: '캠페인 관리',
      description: 'Meta 광고 캠페인을 생성하고 관리하세요.',
    },
    reports: {
      title: '보고서',
      description: 'AI가 생성한 주간 성과 보고서를 확인하세요.',
    },
    terms: {
      title: '이용약관 | 바투 AI 마케팅',
      description: '바투 AI 마케팅 솔루션 서비스 이용약관입니다.',
    },
    privacy: {
      title: '개인정보처리방침 | 바투 AI 마케팅',
      description: '바투 AI 마케팅 솔루션의 개인정보처리방침입니다.',
    },
    login: {
      title: '로그인 | 바투 AI 마케팅',
      description: '바투 AI 마케팅에 로그인하세요.',
    },
  },

  // 소셜 링크 (mutable array)
  socialLinks: [
    'https://twitter.com/batwo_ai',
    // 'https://www.facebook.com/batwo.ai',
    // 'https://www.instagram.com/batwo.ai',
  ] as string[],
}

// =============================================================================
// 메타데이터 생성 함수
// =============================================================================

interface MetadataOptions {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  path?: string
  noIndex?: boolean
}

export function getMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title,
    description = SEO.defaultDescription,
    keywords = SEO.keywords,
    ogImage = SEO.ogImage,
    path = '',
    noIndex = false,
  } = options

  const fullTitle = title
    ? `${title} | ${SEO.siteName}`
    : SEO.defaultTitle

  const canonicalUrl = `${SEO.siteUrl}${path}`
  const ogImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `${SEO.siteUrl}${ogImage}`

  return {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: SEO.siteName }],
    creator: SEO.siteName,
    publisher: SEO.siteName,

    // Robots
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },

    // Canonical
    alternates: {
      canonical: canonicalUrl,
    },

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SEO.siteName,
      locale: SEO.locale,
      type: SEO.og.type,
      images: [
        {
          url: ogImageUrl,
          width: SEO.og.imageWidth,
          height: SEO.og.imageHeight,
          alt: SEO.og.imageAlt,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: SEO.twitter.card,
      site: SEO.twitter.site,
      creator: SEO.twitter.creator,
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },

    // Verification (환경변수에서 가져옴)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      // other: {
      //   'naver-site-verification': process.env.NAVER_SITE_VERIFICATION,
      // },
    },

    // 기타
    metadataBase: new URL(SEO.siteUrl),
  }
}

// =============================================================================
// JSON-LD 구조화 데이터 생성 함수
// =============================================================================

type JsonLdType = 'Organization' | 'SoftwareApplication' | 'WebSite'

interface JsonLdBase {
  '@context': string
  '@type': string
  name: string
  url: string
  logo?: string
  sameAs?: string[]
}

interface OrganizationJsonLd extends JsonLdBase {
  '@type': 'Organization'
  description?: string
  contactPoint?: {
    '@type': 'ContactPoint'
    contactType: string
    email?: string
  }
}

interface SoftwareApplicationJsonLd extends JsonLdBase {
  '@type': 'SoftwareApplication'
  applicationCategory: string
  operatingSystem: string
  offers?: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
  }
}

interface WebSiteJsonLd extends JsonLdBase {
  '@type': 'WebSite'
  potentialAction?: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

type JsonLdResult = OrganizationJsonLd | SoftwareApplicationJsonLd | WebSiteJsonLd

export function getJsonLd(type: JsonLdType = 'Organization'): JsonLdResult {
  const baseData = {
    '@context': 'https://schema.org',
    name: SEO.siteName,
    url: SEO.siteUrl,
    logo: `${SEO.siteUrl}${SEO.logo}`,
    sameAs: SEO.socialLinks,
  }

  switch (type) {
    case 'SoftwareApplication':
      return {
        ...baseData,
        '@type': 'SoftwareApplication',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
        },
      }

    case 'WebSite':
      return {
        ...baseData,
        '@type': 'WebSite',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SEO.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }

    case 'Organization':
    default:
      return {
        ...baseData,
        '@type': 'Organization',
        description: SEO.defaultDescription,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'support@batwo.ai',
        },
      }
  }
}

// =============================================================================
// JSON-LD Script 컴포넌트 헬퍼
// =============================================================================

export function getJsonLdScript(type: JsonLdType = 'Organization'): string {
  return JSON.stringify(getJsonLd(type))
}
