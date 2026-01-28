import { memo } from 'react'
import { Check } from 'lucide-react'

interface Indicator {
  text: string
  color: 'green' | 'blue' | 'purple'
}

const INDICATORS: Indicator[] = [
  { text: '초기 비용 0원', color: 'green' },
  { text: '5분 간편 설정', color: 'blue' },
  { text: '언제든 해지 가능', color: 'purple' },
]

const COLOR_CLASSES = {
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
  },
} as const

export const TrustIndicators = memo(function TrustIndicators() {
  return (
    <ul
      className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground/80 list-none"
      role="list"
      aria-label="주요 혜택"
    >
      {INDICATORS.map((indicator, i) => (
        <TrustIndicatorItem key={i} indicator={indicator} />
      ))}
    </ul>
  )
})

interface TrustIndicatorItemProps {
  indicator: Indicator
}

const TrustIndicatorItem = memo(function TrustIndicatorItem({ indicator }: TrustIndicatorItemProps) {
  const colorClass = COLOR_CLASSES[indicator.color]

  return (
    <li className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded-full ${colorClass.bg} flex items-center justify-center`}
        aria-hidden="true"
      >
        <Check className={`h-3 w-3 ${colorClass.text}`} />
      </div>
      <span>{indicator.text}</span>
    </li>
  )
})
