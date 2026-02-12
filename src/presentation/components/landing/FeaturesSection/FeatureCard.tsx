import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Feature } from './featuresData'

interface FeatureCardProps {
  feature: Feature
  index: number
  isIntersecting: boolean
}

export const FeatureCard = memo(function FeatureCard({ feature, index, isIntersecting }: FeatureCardProps) {
  const Icon = feature.icon

  return (
    <Card
      className={`group relative border-0 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-3 hover:border-primary/30 cursor-default overflow-hidden ${
        isIntersecting ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
      role="listitem"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        aria-hidden="true"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        aria-hidden="true"
      />

      <CardHeader className="relative z-10">
        <div
          className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110"
          aria-hidden="true"
        >
          <Icon
            className="h-7 w-7 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            aria-hidden="true"
          />
        </div>
        <CardTitle className="text-lg transition-colors duration-300 group-hover:text-primary">
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
      </CardContent>
    </Card>
  )
})
