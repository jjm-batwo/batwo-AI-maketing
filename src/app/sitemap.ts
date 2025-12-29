/**
 * Dynamic Sitemap Generation
 *
 * Next.js App Router의 sitemap.ts를 사용하여 동적 사이트맵 생성
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from 'next'
import { SEO } from '@/lib/constants/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO.siteUrl

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // TODO: 추후 동적 페이지 추가 (예: 공개 캠페인 페이지)
  // const dynamicPages = await getCampaignPages()

  return [...staticPages]
}
