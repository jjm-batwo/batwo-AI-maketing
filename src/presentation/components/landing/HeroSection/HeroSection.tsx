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
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <GradientBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* 텍스트 콘텐츠 - 왼쪽 */}
          <div ref={textRef}>
            <HeroContent isVisible={textVisible} />
          </div>

          {/* 대시보드 미리보기 - 오른쪽. DecorativeElements(pulse 무한 애니메이션) 제거. perspective 3D 틸트 적용 */}
          <div
            ref={previewRef}
            className={`relative ${previewVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
            role="img"
            aria-label="대시보드 미리보기"
            style={{ transform: 'perspective(1200px) rotateY(-5deg)' }}
          >
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
})
