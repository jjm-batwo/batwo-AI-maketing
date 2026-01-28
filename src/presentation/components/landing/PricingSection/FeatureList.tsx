import { memo } from 'react'
import { Check } from 'lucide-react'

interface FeatureListProps {
  features: readonly string[]
}

export const FeatureList = memo(function FeatureList({ features }: FeatureListProps) {
  return (
    <ul className="space-y-3" role="list" aria-label="포함된 기능">
      {features.map((feature) => (
        <FeatureItem key={feature} feature={feature} />
      ))}
    </ul>
  )
})

interface FeatureItemProps {
  feature: string
}

const FeatureItem = memo(function FeatureItem({ feature }: FeatureItemProps) {
  return (
    <li className="flex items-center gap-3 transition-all duration-300 hover:translate-x-1 cursor-default">
      <div
        className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20"
        aria-hidden="true"
      >
        <Check className="h-3 w-3 text-primary" />
      </div>
      <span className="text-sm">{feature}</span>
    </li>
  )
})
