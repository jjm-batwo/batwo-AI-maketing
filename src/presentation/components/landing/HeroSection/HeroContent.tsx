import { memo } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialProofBadge } from './SocialProofBadge'
import { TrustIndicators } from './TrustIndicators'
import { FreeAuditButton } from './FreeAuditButton'

interface HeroContentProps {
  isVisible: boolean
}

export const HeroContent = memo(function HeroContent({ isVisible }: HeroContentProps) {
  return (
    <div
      className={`text-center flex flex-col items-center ${
        isVisible ? 'animate-slide-in-left' : 'opacity-0'
      }`}
    >
      {/* Headline */}
      <h1
        id="hero-heading"
        className="text-[2.5rem] md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]"
      >
        마케팅 지식 없이도
        <br />
        {/* text-glow: 흰색 단색 + 미묘한 글로우 효과 */}
        <span className="text-glow">전문가처럼 광고하기</span>
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
        복잡한 메타 광고 설정을 AI가 1분 만에 완료합니다. <br />
        대화형 AI로 캠페인 생성부터 성과 분석까지.
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
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
        {/* 메인 CTA: 그라디언트 → 단색 primary, shimmer 제거, hover 축소 */}
        <Button
          size="lg"
          asChild
          className="group h-12 px-6 lg:h-14 lg:px-8 xl:h-16 xl:px-10 text-sm lg:text-base bg-primary hover:bg-primary/90 shadow-sm transition-all w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="gap-2 font-semibold"
            aria-label="14일 무료 체험 시작하기 - 로그인 페이지로 이동"
          >
            14일 무료로 시작하기
            <ArrowRight
              className="h-4 w-4 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </Button>
        {/* 보조 버튼: backdrop-blur 제거, border 단순화 */}
        <Button
          size="lg"
          variant="outline"
          asChild
          className="h-12 px-6 lg:h-14 lg:px-8 xl:h-16 xl:px-10 text-sm lg:text-base bg-transparent border hover:bg-muted/50 transition-all w-full sm:w-auto"
        >
          <Link href="#how-it-works" aria-label="서비스 소개 영상 보기 - 하단 섹션으로 이동">
            서비스 소개 영상
          </Link>
        </Button>
      </div>

      {/* 무료 광고 진단 CTA */}
      <FreeAuditButton />
    </div>
  )
})
