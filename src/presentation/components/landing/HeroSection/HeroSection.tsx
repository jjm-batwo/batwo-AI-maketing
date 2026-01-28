'use client'

import { memo } from 'react'
import { useIntersectionObserver } from '@/presentation/hooks'
import { GradientBackground } from './GradientBackground'
import { HeroContent } from './HeroContent'
import { DashboardPreview } from './DashboardPreview'

export const HeroSection = memo(function HeroSection() {
  const { ref: textRef, isIntersecting: textVisible } = useIntersectionObserver()
  const { ref: previewRef, isIntersecting: previewVisible } = useIntersectionObserver()

  return (
    <section
      className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <GradientBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content - Left */}
          <div ref={textRef}>
            <HeroContent isVisible={textVisible} />
          </div>

          {/* Dashboard Preview - Right */}
          <div
            ref={previewRef}
            className={`relative perspective-1000 ${
              previewVisible ? 'animate-slide-in-right' : 'opacity-0'
            }`}
            role="img"
            aria-label="바투 대시보드 미리보기 - 실시간 캠페인 성과 데이터와 AI 인사이트"
          >
            <DecorativeElements />
            <div className="relative">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

const DecorativeElements = memo(function DecorativeElements() {
  return (
    <>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse delay-700 pointer-events-none" aria-hidden="true" />
    </>
  )
})
