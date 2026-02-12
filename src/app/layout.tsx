import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { Providers } from './providers'
import { getMetadata, getJsonLdScript } from '@/lib/constants/seo'
import { FacebookSDK } from '@/presentation/components/common/FacebookSDK'
import { DemoModeProvider } from '@/presentation/components/demo/DemoModeProvider'

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {/* JSON-LD 구조화 데이터 - SEO를 위해 head에 포함 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: getJsonLdScript('Organization') }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        {/* Demo Mode Caption Overlay - Meta App Review 촬영용 */}
        <Suspense fallback={null}>
          <DemoModeProvider />
        </Suspense>
        {/* Facebook SDK - Meta 통합 (lazy loaded) */}
        <Suspense fallback={null}>
          <FacebookSDK />
        </Suspense>
        {/* Vercel Analytics - 사용자 분석 (deferred) */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {/* Vercel Speed Insights - 성능 모니터링 (deferred) */}
        <Suspense fallback={null}>
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  )
}
