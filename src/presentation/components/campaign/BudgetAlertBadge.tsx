'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, CheckCircle, Bell, BellOff } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type BudgetStatus = 'normal' | 'warning' | 'exceeded'

interface BudgetAlertBadgeProps {
  status: BudgetStatus
  spendPercent: number
  thresholdPercent?: number
  isAlertEnabled?: boolean
  className?: string
  showTooltip?: boolean
}

const statusConfig = {
  normal: {
    icon: CheckCircle,
    label: '정상',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    description: '예산 정상 범위 내',
  },
  warning: {
    icon: AlertTriangle,
    label: '주의',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600',
    description: '예산 임계값 도달',
  },
  exceeded: {
    icon: AlertCircle,
    label: '초과',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
    description: '예산 소진 완료',
  },
}

export function BudgetAlertBadge({
  status,
  spendPercent,
  thresholdPercent,
  isAlertEnabled = true,
  className,
  showTooltip = true,
}: BudgetAlertBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
      <span>{spendPercent}%</span>
      {!isAlertEnabled && (
        <BellOff className="h-3 w-3 text-gray-400" />
      )}
    </div>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{config.description}</p>
            <p>예산 소진: {spendPercent}%</p>
            {thresholdPercent && (
              <p>알림 임계값: {thresholdPercent}%</p>
            )}
            <p className="flex items-center gap-1">
              {isAlertEnabled ? (
                <>
                  <Bell className="h-3 w-3" />
                  알림 활성화됨
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3" />
                  알림 비활성화됨
                </>
              )}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface BudgetProgressBarProps {
  spendPercent: number
  thresholdPercent?: number
  className?: string
}

export function BudgetProgressBar({
  spendPercent,
  thresholdPercent = 80,
  className,
}: BudgetProgressBarProps) {
  const clampedPercent = Math.min(spendPercent, 100)

  let barColor = 'bg-green-500'
  if (spendPercent >= 100) {
    barColor = 'bg-red-500'
  } else if (spendPercent >= thresholdPercent) {
    barColor = 'bg-yellow-500'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        {/* 진행 바 */}
        <div
          className={cn('h-full transition-all duration-300', barColor)}
          style={{ width: `${clampedPercent}%` }}
        />
        {/* 임계값 마커 */}
        {thresholdPercent && thresholdPercent < 100 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-muted-foreground"
            style={{ left: `${thresholdPercent}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        {thresholdPercent && thresholdPercent < 100 && (
          <span style={{ marginLeft: `${thresholdPercent - 10}%` }}>
            {thresholdPercent}%
          </span>
        )}
        <span>100%</span>
      </div>
    </div>
  )
}
