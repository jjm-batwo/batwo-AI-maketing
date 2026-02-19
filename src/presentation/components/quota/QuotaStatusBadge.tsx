'use client'

import { cn } from '@/lib/utils'

interface QuotaStatusBadgeProps {
  used: number
  limit: number
  label: string
  period?: string
  className?: string
  // 체험 기간 관련 props
  isInTrial?: boolean
  trialDaysRemaining?: number
}

export function QuotaStatusBadge({
  used,
  limit,
  label,
  period,
  className,
  isInTrial = false,
  trialDaysRemaining = 0,
}: QuotaStatusBadgeProps) {
  // 체험 기간 중이면 체험 기간 배지 표시
  if (isInTrial && trialDaysRemaining > 0) {
    return (
      <span
        data-testid="quota-badge"
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          'bg-blue-100 text-blue-700 border-blue-200',
          className
        )}
      >
        체험 기간: {trialDaysRemaining}일 남음
      </span>
    )
  }

  // 체험 기간 종료된 경우
  if (isInTrial === false && trialDaysRemaining === 0 && used === 0 && limit === 0) {
    return (
      <span
        data-testid="quota-badge"
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          'bg-muted text-muted-foreground border-border',
          className
        )}
      >
        체험 기간 종료
      </span>
    )
  }

  const remaining = limit - used
  const percentage = (used / limit) * 100

  const getColorClass = () => {
    if (remaining === 0) return 'bg-red-100 text-red-700 border-red-200'
    if (percentage >= 80) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const periodText = period ? ` (${period})` : ''

  return (
    <span
      data-testid="quota-badge"
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getColorClass(),
        className
      )}
    >
      {label} {remaining}/{limit}회 남음{periodText}
    </span>
  )
}
