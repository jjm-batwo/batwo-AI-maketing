import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { auth } from '@/infrastructure/auth'
import { getMetadata } from '@/lib/constants/seo'
import { ErrorBoundary } from '@/presentation/components/common/ErrorBoundary'
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

export default async function LandingPage() {
  // 서버 컴포넌트에서 세션 확인
  const session = await auth()

  // 로그인한 사용자는 캠페인 페이지로 리다이렉트
  if (session?.user) {
    redirect('/campaigns')
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
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
