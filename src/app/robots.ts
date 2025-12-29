/**
 * Robots.txt Generation
 *
 * Next.js App Router의 robots.ts를 사용하여 robots.txt 생성
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import type { MetadataRoute } from 'next'
import { SEO } from '@/lib/constants/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO.siteUrl

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/_next/',
          '/private/',
        ],
      },
      // Googlebot 특별 규칙 (선택적)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
