import { memo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialProofBadge } from './SocialProofBadge'
import { TrustIndicators } from './TrustIndicators'

interface HeroContentProps {
  isVisible: boolean
}

export const HeroContent = memo(function HeroContent({ isVisible }: HeroContentProps) {
  return (
    <div
      className={`text-center lg:text-left ${
        isVisible ? 'animate-slide-in-left' : 'opacity-0'
      }`}
    >
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-medium bg-primary/10 text-primary rounded-full border border-primary/10 shadow-sm hover:bg-primary/15 transition-colors cursor-default"
        role="status"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>AI 기반 마케팅 자동화 솔루션</span>
      </div>

      {/* Headline */}
      <h1
        id="hero-heading"
        className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
      >
        마케팅 지식 없이도
        <br />
        <span className="text-gradient">전문가처럼 광고하기</span>
      </h1>

      {/* Subheadline */}
      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
        복잡한 메타, 구글 광고 설정을 AI가 1분 만에 완료합니다.
        <br className="hidden md:block" />
        데이터 분석부터 소재 최적화까지, 바투가 알아서 해드립니다.
      </p>

      {/* CTA Buttons */}
      <CTAButtons />

      {/* Social Proof Badge */}
      <SocialProofBadge />

      {/* Trust Indicators */}
      <TrustIndicators />
    </div>
  )
})

const CTAButtons = memo(function CTAButtons() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
      <Button
        size="lg"
        asChild
        className="h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
      >
        <Link
          href="/register"
          className="gap-2 font-semibold"
          aria-label="14일 무료 체험 시작하기 - 회원가입 페이지로 이동"
        >
          14일 무료로 시작하기
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        asChild
        className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-2 hover:bg-muted/50 transition-all w-full sm:w-auto"
      >
        <Link
          href="#how-it-works"
          aria-label="서비스 소개 영상 보기 - 하단 섹션으로 이동"
        >
          서비스 소개 영상
        </Link>
      </Button>
    </div>
  )
})
