import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getMetadata } from '@/lib/constants/seo'
import { ErrorBoundary } from '@/presentation/components/common/ErrorBoundary'
import { AuthRedirect } from '@/presentation/components/common/AuthRedirect'
import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  FeaturesSection,
  LandingFooter,
} from '@/presentation/components/landing'

// Lazy load below-fold sections for better initial page performance
const ProductShowcaseSection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.ProductShowcaseSection })),
  { ssr: true }
)

const HowItWorksSection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.HowItWorksSection })),
  { ssr: true }
)

const TestimonialsSection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.TestimonialsSection })),
  { ssr: true }
)

const PricingSection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.PricingSection })),
  { ssr: true }
)

const FAQSection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.FAQSection })),
  { ssr: true }
)

const CTASection = dynamic(
  () => import('@/presentation/components/landing').then(mod => ({ default: mod.CTASection })),
  { ssr: true }
)

export const metadata: Metadata = getMetadata({ path: '/' })

// ISR: 랜딩 페이지는 1시간마다 재생성 (auth() 제거로 정적 캐싱 가능)
export const revalidate = 3600

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* 로그인된 사용자는 클라이언트에서 /campaigns로 리다이렉트 */}
      <AuthRedirect />
      <ErrorBoundary>
        <LandingHeader />
      </ErrorBoundary>
      <main id="main-content">
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <SocialProofSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <FeaturesSection id="features" />
        </ErrorBoundary>
        <ErrorBoundary>
          <ProductShowcaseSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <HowItWorksSection id="how-it-works" />
        </ErrorBoundary>
        <ErrorBoundary>
          <TestimonialsSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <PricingSection id="pricing" />
        </ErrorBoundary>
        <ErrorBoundary>
          <FAQSection />
        </ErrorBoundary>
        <ErrorBoundary>
          <CTASection />
        </ErrorBoundary>
      </main>
      <ErrorBoundary>
        <LandingFooter />
      </ErrorBoundary>
    </div>
  )
}
