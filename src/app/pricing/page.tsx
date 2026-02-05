import type { Metadata } from 'next'
import { getMetadata } from '@/lib/constants/seo'
import { LandingHeader, PricingSection, LandingFooter } from '@/presentation/components/landing'

export const metadata: Metadata = getMetadata({
  path: '/pricing',
  title: '요금제',
  description: '비즈니스에 맞는 요금제를 선택하세요. 무료로 시작하고 성장에 맞춰 업그레이드하세요.',
})

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  )
}
