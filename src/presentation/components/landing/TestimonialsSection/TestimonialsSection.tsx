'use client'

import { memo } from 'react'
import { useIntersectionObserver } from '@/presentation/hooks'
import { TestimonialCard } from './TestimonialCard'
import { TESTIMONIALS } from './testimonialData'

export const TestimonialsSection = memo(function TestimonialsSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <header className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">실제 사용자들의 이야기</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            바투를 사용하는 커머스 사업자들의 생생한 후기를 확인하세요
          </p>
        </header>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} role="listitem">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})
