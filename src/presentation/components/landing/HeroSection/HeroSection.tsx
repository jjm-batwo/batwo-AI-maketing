'use client'

import { memo } from 'react'
import { useIntersectionObserver } from '@/presentation/hooks'
import { GradientBackground } from './GradientBackground'
import { HeroContent } from './HeroContent'
// AIChatDemo → DashboardPreview로 교체
import { DashboardPreview } from './DashboardPreview'

export const HeroSection = memo(function HeroSection() {
  const { ref: textRef, isIntersecting: textVisible } = useIntersectionObserver()
  const { ref: previewRef, isIntersecting: previewVisible } = useIntersectionObserver()

  return (
    // 레이아웃: 고정 패딩 → min-h-[100dvh] + flex center로 풀스크린 정렬
    <section
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20"
      aria-labelledby="hero-heading"
    >
      <GradientBackground />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center max-w-5xl">
        {/* Centered Text Content */}
        <div ref={textRef} className="w-full">
          <HeroContent isVisible={textVisible} />
        </div>

        {/* Centered Dashboard Preview */}
        <div
          ref={previewRef}
          className={`relative mt-16 w-full max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden border border-gray-200 ${previewVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          role="img"
          aria-label="대시보드 미리보기"
        >
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
})
