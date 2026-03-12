import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'purple'

interface StatusBadgeProps {
  label: string
  variant: StatusVariant
  /** 살아있는 표시 점 (실시간 상태 등) */
  dot?: boolean
  className?: string
}

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-500/15 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  purple: 'bg-purple-500/15 text-purple-500 dark:text-purple-400',
}

const DOT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  purple: 'bg-purple-500',
}

/**
 * 시맨틱 상태 뱃지 (상태, 심각도, 우선순위 등 공통 사용)
 * CampaignCard, AnomalyAlert, AIInsights, BudgetAlertBadge 등에서 반복되는 패턴 통합
 */
export function StatusBadge({ label, variant, dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[variant])}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
