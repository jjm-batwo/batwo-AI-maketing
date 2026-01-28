import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from './providers'
import { getMetadata, getJsonLdScript, SEO } from '@/lib/constants/seo'
import { FacebookSDK } from '@/presentation/components/common/FacebookSDK'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

// SEO 메타데이터
export const metadata: Metadata = getMetadata({
  path: '/',
})

// Viewport 설정
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={SEO.language}>
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: getJsonLdScript('Organization') }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        {/* Facebook SDK - Meta 통합 */}
        <FacebookSDK />
        {/* Vercel Analytics - 사용자 분석 */}
        <Analytics />
        {/* Vercel Speed Insights - 성능 모니터링 */}
        <SpeedInsights />
      </body>
    </html>
  )
}
