import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import localFont from 'next/font/local'
import { Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { Providers } from './providers'
import { getMetadata, getJsonLdScript } from '@/lib/constants/seo'
import { DemoModeProvider } from '@/presentation/components/demo/DemoModeProvider'

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '100 900',
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD 구조화 데이터 - SEO를 위해 head에 포함 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: getJsonLdScript('Organization') }}
        />
      </head>
      <body
        className={`${pretendard.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        {/* Demo Mode Caption Overlay - Meta App Review 촬영용 */}
        <Suspense fallback={null}>
          <DemoModeProvider />
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
