import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricChangeProps {
  /** 변화율 (양수/음수 모두 가능) */
  value: number
  /** 역방향 지표 — 음수가 "좋음"인 경우 (예: CPA, 비용) */
  inverse?: boolean
  /** 텍스트 + 배경 뱃지 스타일로 표시 */
  badge?: boolean
  /** 크기 */
  size?: 'sm' | 'md'
  /** 소수점 자릿수 */
  decimals?: number
  className?: string
}

/**
 * 지표 변화율 표시 컴포넌트 (+X% ↑ / -X% ↓)
 * KPICard, AIInsights, OptimizationResultCard 등에서 반복되는 패턴 통합
 */
export function MetricChange({
  value,
  inverse = false,
  badge = false,
  size = 'sm',
  decimals = 1,
  className,
}: MetricChangeProps) {
  const isNeutral = value === 0
  const isPositive = inverse ? value < 0 : value > 0
  const isNegative = inverse ? value > 0 : value < 0

  const formatted = `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`

  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3 w-3'
  const textSize = size === 'md' ? 'text-sm' : 'text-xs'

  if (isNeutral) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium text-muted-foreground',
          textSize,
          badge && 'px-2 py-0.5 rounded-full bg-muted ring-1 ring-border',
          className
        )}
      >
        <Minus className={iconSize} aria-hidden="true" />
        0%
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        textSize,
        isPositive && 'text-green-700 dark:text-green-400',
        isNegative && 'text-red-700 dark:text-red-400',
        badge &&
          isPositive &&
          'bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full ring-1 ring-green-600/20 dark:ring-green-500/30',
        badge &&
          isNegative &&
          'bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full ring-1 ring-red-600/20 dark:ring-red-500/30',
        className
      )}
      aria-label={`${isPositive ? '증가' : '감소'} ${Math.abs(value).toFixed(decimals)}%`}
    >
      {isPositive ? (
        <ArrowUpRight className={iconSize} aria-hidden="true" />
      ) : (
        <ArrowDownRight className={iconSize} aria-hidden="true" />
      )}
      {formatted}
    </span>
  )
}
