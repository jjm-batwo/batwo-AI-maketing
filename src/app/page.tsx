import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth'
import { getMetadata } from '@/lib/constants/seo'
import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  FeaturesSection,
  ProductShowcaseSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from '@/presentation/components/landing'

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
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <ProductShowcaseSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
