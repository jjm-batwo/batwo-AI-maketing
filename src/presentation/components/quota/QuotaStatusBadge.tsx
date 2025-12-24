'use client'

import { cn } from '@/lib/utils'

interface QuotaStatusBadgeProps {
  used: number
  limit: number
  label: string
  period?: string
  className?: string
}

export function QuotaStatusBadge({
  used,
  limit,
  label,
  period,
  className,
}: QuotaStatusBadgeProps) {
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
