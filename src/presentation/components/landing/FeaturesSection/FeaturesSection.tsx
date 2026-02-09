'use client'

import { memo } from 'react'
import { useIntersectionObserver } from '@/presentation/hooks'
import { FeatureCard } from './FeatureCard'
import { FEATURES } from './featuresData'

export const FeaturesSection = memo(function FeaturesSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 바투인가요?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 운영을 AI가 대신합니다. 당신은 비즈니스에만 집중하세요.
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
})
