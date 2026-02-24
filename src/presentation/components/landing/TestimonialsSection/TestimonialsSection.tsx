'use client'

import { memo } from 'react'
import { useIntersectionObserver } from '@/presentation/hooks'
import { TestimonialCard } from './TestimonialCard'
import { TESTIMONIALS } from './testimonialData'
import { SectionLabel } from '../SectionLabel'

export const TestimonialsSection = memo(function TestimonialsSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  // Distribute testimonials into 3 columns for masonry effect
  const col1 = TESTIMONIALS.filter((_, i) => i % 3 === 0)
  const col2 = TESTIMONIALS.filter((_, i) => i % 3 === 1)
  const col3 = TESTIMONIALS.filter((_, i) => i % 3 === 2)

  return (
    <section id="testimonials" className="py-20 md:py-32 overflow-hidden bg-gray-50/50">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <header className="text-center mb-12">
          <SectionLabel className="text-center">고객 후기</SectionLabel>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            실제 사용자들의 이야기
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            바투를 사용하는 커머스 사업자들의 생생한 후기를 확인하세요
          </p>
        </header>

        {/* Masonry Grid — 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start"
          role="list"
          aria-label="고객 후기"
        >
          {/* Column 1 */}
          <div role="listitem" aria-label="고객 후기 첫번째 열">
            {col1.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* Column 2 */}
          <div role="listitem" aria-label="고객 후기 두번째 열">
            {col2.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* Column 3 — hidden on mobile/tablet */}
          <div
            className="hidden lg:block"
            role="listitem"
            aria-label="고객 후기 세번째 열"
          >
            {col3.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
})
