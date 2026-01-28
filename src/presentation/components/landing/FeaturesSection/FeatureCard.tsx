import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Feature } from './featuresData'

interface FeatureCardProps {
  feature: Feature
}

export const FeatureCard = memo(function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon

  return (
    <Card
      className="group border-0 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 cursor-default"
      role="listitem"
    >
      <CardHeader>
        <div
          className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110"
          aria-hidden="true"
        >
          <Icon
            className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            aria-hidden="true"
          />
        </div>
        <CardTitle className="text-lg transition-colors duration-300 group-hover:text-primary">
          {feature.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{feature.description}</p>
      </CardContent>
    </Card>
  )
})
